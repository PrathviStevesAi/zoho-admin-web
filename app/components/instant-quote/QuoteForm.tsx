"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Country, State, City as CityLib } from "country-state-city";
import { securityTypes } from "./Datas";
import { submitQuoteAction } from "@/actions/quote.actions";

export default function QuoteForm() {
  const [loading, setLoading] = useState(false);
  const [sameAsBilling, setSameAsBilling] = useState(false);
  const [formErrors, setFormErrors] = useState<any>({});
  
  // Location states
  const [countries, setCountries] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [serviceStates, setServiceStates] = useState<any[]>([]);
  const [serviceCities, setServiceCities] = useState<any[]>([]);

  const initialFormData = {
    Company_Name: "",
    First_Name: "",
    Last_Name: "",
    Mobile: "",
    Email: "",
    Security_Type: "",
    No_of_Guards: "1",
    Job_Description: "",
    Start_Date: "",
    End_Date: "",
    Start_Time: "",
    End_Time: "",
    Location_Business_Name: "",
    Street: "",
    City: "",
    State: "",
    Zip_Code: "",
    Country: "",
    Service_Loc_Business: "",
    Service_Street: "",
    Service_City: "",
    Service_State: "",
    Service_Zip_Code: "",
    Service_Country: "United States",
    "is_24/7": true,
    is_per_day: false,
    hours_per_day: "",
    total_hours: "",
  };

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    const allCountries = Country.getAllCountries();
    setCountries(allCountries);
    const us = allCountries.find((c) => c.name === "United States");
    if (us) {
      const statesList = State.getStatesOfCountry(us.isoCode);
      setStates(statesList);
      setServiceStates(statesList);
      
      setFormData((prev) => ({
        ...prev,
        Country: us.name,
        Service_Country: us.name,
      }));
    }
  }, []);

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>, isService = false) => {
    const countryName = e.target.value;
    const countryObj = countries.find((c) => c.name === countryName);
    if (countryObj) {
      const statesList = State.getStatesOfCountry(countryObj.isoCode);
      if (isService) {
        setServiceStates(statesList);
        setServiceCities([]);
        setFormData((prev) => ({ ...prev, Service_Country: countryName, Service_State: "", Service_City: "" }));
      } else {
        setStates(statesList);
        setCities([]);
        setFormData((prev) => ({ ...prev, Country: countryName, State: "", City: "" }));
      }
    }
  };

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>, isService = false) => {
    const stateName = e.target.value;
    const countryName = isService ? formData.Service_Country : formData.Country;
    const countryObj = countries.find((c) => c.name === countryName);
    const statesList = isService ? serviceStates : states;
    const stateObj = statesList.find((s) => s.name === stateName);

    if (countryObj && stateObj) {
      const citiesList = CityLib.getCitiesOfState(countryObj.isoCode, stateObj.isoCode);
      if (isService) {
        setServiceCities(citiesList);
        setFormData((prev) => ({ ...prev, Service_State: stateName, Service_City: "" }));
      } else {
        setCities(citiesList);
        setFormData((prev) => ({ ...prev, State: stateName, City: "" }));
      }
    }
  };

  const handleSameAsBillingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setSameAsBilling(checked);

    if (checked) {
      setFormData((prevData) => ({
        ...prevData,
        Service_Loc_Business: prevData.Location_Business_Name,
        Service_Street: prevData.Street,
        Service_City: prevData.City,
        Service_State: prevData.State,
        Service_Zip_Code: prevData.Zip_Code,
        Service_Country: prevData.Country,
      }));
      setServiceStates(states);
      setServiceCities(cities);
    } else {
      setFormData((prevData) => ({
        ...prevData,
        Service_Loc_Business: "",
        Service_Street: "",
        Service_City: "",
        Service_State: "",
        Service_Zip_Code: "",
      }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validateForm = () => {
    const errors: any = {};
    if (!formData.Company_Name) errors.Company_Name = "Required";
    if (!formData.First_Name) errors.First_Name = "Required";
    if (!formData.Last_Name) errors.Last_Name = "Required";
    if (!formData.Email) errors.Email = "Required";
    if (!formData.Mobile) errors.Mobile = "Required";
    if (!formData.Security_Type) errors.Security_Type = "Required";
    
    if (formData["is_24/7"]) {
      if (!formData.Start_Date) errors.Start_Date = "Required";
      if (!formData.End_Date) errors.End_Date = "Required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const performSubmit = async () => {
    setLoading(true);
    
    // Format mobile
    const rawMobile = formData.Mobile.replace(/^\+1-/, "").replace(/-/g, "");
    const finalMobile = `+1${rawMobile}`;

    let totalDays = 0;
    let totalHours = 0;
    let daysArray: any[] = [];
    
    let basePayload: any = {
      First_Name: formData.First_Name,
      Last_Name: formData.Last_Name,
      Company: formData.Company_Name,
      Email: formData.Email,
      Mobile: finalMobile,
      Street: formData.Street,
      City: formData.City,
      Billing_State1: formData.State,
      Zip_Code: formData.Zip_Code,
      Country: formData.Country,
      Service_Loc_Business_Name: formData.Service_Loc_Business,
      Location_Business_Name: formData.Location_Business_Name,
      Service_Street_1: formData.Service_Street,
      Service_City: formData.Service_City,
      Service_State2: formData.Service_State,
      Service_Zip_Code: formData.Service_Zip_Code,
      Services_Needed_New: [formData.Security_Type],
      Description: formData.Job_Description,
      Currency: "USD",
      Number_of_Guards: String(formData.No_of_Guards),
      "is_24/7": formData["is_24/7"],
      is_per_day: formData.is_per_day,
    };

    if (formData["is_24/7"]) {
      const startDateObj = new Date(formData.Start_Date);
      const endDateObj = new Date(formData.End_Date);
      const diffMs = endDateObj.getTime() - startDateObj.getTime();
      totalDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      
      basePayload = {
        ...basePayload,
        Start_date: formData.Start_Date.split("T")[0] || formData.Start_Date,
        Start_time: formData.Start_Date.includes("T") ? formData.Start_Date.split("T")[1] : formData.Start_Time,
        End_date: formData.End_Date.split("T")[0] || formData.End_Date,
        End_time: formData.End_Date.includes("T") ? formData.End_Date.split("T")[1] : formData.End_Time,
        total_days: totalDays,
      };
    } else {
      // Per Day
      const startDateObj = new Date(formData.Start_Date);
      const endDateObj = new Date(formData.End_Date);
      const diffMs = endDateObj.getTime() - startDateObj.getTime();
      totalDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1); // inclusive

      let hoursPerDay = 0;
      if (formData.Start_Time && formData.End_Time) {
        const [startH, startM] = formData.Start_Time.split(":").map(Number);
        const [endH, endM] = formData.End_Time.split(":").map(Number);
        hoursPerDay = (endH + endM / 60) - (startH + startM / 60);
        if (hoursPerDay < 0) hoursPerDay += 24;
      }
      
      totalHours = totalDays * hoursPerDay;

      for (let i = 0; i < totalDays; i++) {
        const current = new Date(startDateObj);
        current.setDate(current.getDate() + i);
        // Correct timezone issue
        const dateStr = new Date(current.getTime() - current.getTimezoneOffset() * 60000).toISOString().split("T")[0];
        const dayName = current.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
        daysArray.push({
          date: dateStr,
          day: dayName,
          start_time: formData.Start_Time || "00:00",
          end_time: formData.End_Time || "00:00",
          hours_per_day: hoursPerDay.toFixed(2),
        });
      }

      basePayload = {
        ...basePayload,
        Start_date: formData.Start_Date,
        End_date: formData.End_Date,
        total_hours: Number(totalHours.toFixed(2)),
        total_days: totalDays,
        days: daysArray,
      };
    }

    const payload = {
      data: [basePayload],
    };

    const res = await submitQuoteAction(payload);
    setLoading(false);

    if (res.success) {
      toast.success("Quote submitted successfully!");
      setFormData(initialFormData);
    } else {
      toast.error(res.error || "Failed to submit quote.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      await performSubmit();
    } else {
      toast.error("Please fill in all required fields.");
    }
  };

  return (
    <div className="w-full">
      <div className="mb-8 flex flex-col items-center">
        <Image
          src="/images/website-logo.png"
          alt="Fast Guard Security Service"
          width={250}
          height={60}
          className="object-contain"
          priority
        />
        <h2 className="mt-4 text-2xl font-bold text-slate-800 text-center uppercase text-green-700 bg-green-50 px-6 py-2 rounded-full border border-green-200 shadow-sm">
          Instant Quote
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Basic Details Section */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-b pb-2">Basic Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium mb-1">Company Name <span className="text-red-500">*</span></label>
              <input type="text" name="Company_Name" value={formData.Company_Name} onChange={handleInputChange} className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" required />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">First Name <span className="text-red-500">*</span></label>
              <input type="text" name="First_Name" value={formData.First_Name} onChange={handleInputChange} className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" required />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Last Name <span className="text-red-500">*</span></label>
              <input type="text" name="Last_Name" value={formData.Last_Name} onChange={handleInputChange} className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" required />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Best Number To Contact You? <span className="text-red-500">*</span></label>
              <input type="tel" name="Mobile" value={formData.Mobile} onChange={handleInputChange} placeholder="+1-XXX-XXX-XXXX" className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" required />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email <span className="text-red-500">*</span></label>
              <input type="email" name="Email" value={formData.Email} onChange={handleInputChange} className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" required />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Type Of Security Needed? <span className="text-red-500">*</span></label>
              <select name="Security_Type" value={formData.Security_Type} onChange={handleInputChange} className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white" required>
                {securityTypes.map((type, idx) => (
                  <option key={idx} value={type.value} disabled={type.value === ""}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">How many Guards do you want? <span className="text-red-500">*</span></label>
              <input type="number" name="No_of_Guards" min="1" value={formData.No_of_Guards} onChange={handleInputChange} className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" required />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium mb-1">Job Description <span className="text-red-500">*</span></label>
              <textarea name="Job_Description" value={formData.Job_Description} onChange={handleInputChange} rows={4} className="flex w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" required />
            </div>
          </div>
        </div>

        {/* Schedule Section */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-b pb-2">Guard Needed For?</h3>
          
          <div className="flex gap-6 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="availability" checked={formData["is_24/7"]} onChange={() => setFormData({ ...formData, "is_24/7": true, is_per_day: false })} className="w-4 h-4 text-primary" />
              <span>24/7</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="availability" checked={formData.is_per_day} onChange={() => setFormData({ ...formData, "is_24/7": false, is_per_day: true })} className="w-4 h-4 text-primary" />
              <span>Per Day</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date & Time <span className="text-red-500">*</span></label>
              {formData["is_24/7"] ? (
                <input type="datetime-local" name="Start_Date" value={formData.Start_Date} onChange={handleInputChange} className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" required />
              ) : (
                <div className="flex gap-2">
                  <input type="date" name="Start_Date" value={formData.Start_Date} onChange={handleInputChange} className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" required />
                  <input type="time" name="Start_Time" value={formData.Start_Time} onChange={handleInputChange} className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" required />
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date & Time <span className="text-red-500">*</span></label>
              {formData["is_24/7"] ? (
                <input type="datetime-local" name="End_Date" value={formData.End_Date} onChange={handleInputChange} className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" required />
              ) : (
                <div className="flex gap-2">
                  <input type="date" name="End_Date" value={formData.End_Date} onChange={handleInputChange} className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" required />
                  <input type="time" name="End_Time" value={formData.End_Time} onChange={handleInputChange} className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" required />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Billing Location Section */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-b pb-2">Billing Location</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium mb-1">Location / Business Name</label>
              <input type="text" name="Location_Business_Name" value={formData.Location_Business_Name} onChange={handleInputChange} className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium mb-1">Street Address</label>
              <input type="text" name="Street" value={formData.Street} onChange={handleInputChange} className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Country</label>
              <select value={formData.Country} onChange={(e) => handleCountryChange(e, false)} className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white">
                <option value="">Select Country</option>
                {countries.map((c) => (
                  <option key={c.isoCode} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">State</label>
              <select value={formData.State} onChange={(e) => handleStateChange(e, false)} className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white" disabled={!formData.Country}>
                <option value="">Select State</option>
                {states.map((s) => (
                  <option key={s.isoCode} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">City</label>
              <select name="City" value={formData.City} onChange={handleInputChange} className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white" disabled={!formData.State}>
                <option value="">Select City</option>
                {cities.map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Zip Code</label>
              <input type="text" name="Zip_Code" value={formData.Zip_Code} onChange={handleInputChange} className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
        </div>

        {/* Service Location Section */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-6">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Service Location</h3>
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" checked={sameAsBilling} onChange={handleSameAsBillingChange} className="w-4 h-4 text-primary rounded" />
              <span>Same as Billing Location</span>
            </label>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium mb-1">Location / Business Name</label>
              <input type="text" name="Service_Loc_Business" value={formData.Service_Loc_Business} onChange={handleInputChange} disabled={sameAsBilling} className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50" />
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium mb-1">Street Address</label>
              <input type="text" name="Service_Street" value={formData.Service_Street} onChange={handleInputChange} disabled={sameAsBilling} className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Country</label>
              <select value={formData.Service_Country} onChange={(e) => handleCountryChange(e, true)} disabled={sameAsBilling} className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white disabled:opacity-50">
                <option value="">Select Country</option>
                {countries.map((c) => (
                  <option key={c.isoCode} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">State</label>
              <select value={formData.Service_State} onChange={(e) => handleStateChange(e, true)} disabled={sameAsBilling || !formData.Service_Country} className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white disabled:opacity-50">
                <option value="">Select State</option>
                {serviceStates.map((s) => (
                  <option key={s.isoCode} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">City</label>
              <select name="Service_City" value={formData.Service_City} onChange={handleInputChange} disabled={sameAsBilling || !formData.Service_State} className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white disabled:opacity-50">
                <option value="">Select City</option>
                {serviceCities.map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Zip Code</label>
              <input type="text" name="Service_Zip_Code" value={formData.Service_Zip_Code} onChange={handleInputChange} disabled={sameAsBilling} className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50" />
            </div>
          </div>
        </div>

        <div className="flex justify-center pt-6 pb-12">
          <button type="submit" disabled={loading} className="px-10 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-md transition-colors flex items-center gap-2 text-lg">
            {loading && <Loader2 className="h-5 w-5 animate-spin" />}
            {loading ? "Submitting..." : "Get Instant Quote"}
          </button>
        </div>
      </form>
    </div>
  );
}
