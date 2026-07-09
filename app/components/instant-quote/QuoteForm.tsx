"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Country, State, City as CityLib } from "country-state-city";
import { securityTypes } from "./Datas";
import { submitQuoteAction } from "@/actions/quote.actions";
import Loader from "../Loader";
import Autocomplete from "react-google-autocomplete";

const CUSTOM_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "Central California",
  "Colorado", "Connecticut", "Delaware", "Florida", "Georgia",
  "Hawaii", "Idaho", "Illinois", "Indiana", "Kansas",
  "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts",
  "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana",
  "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico",
  "New York", "North Carolina", "North Dakota", "Northern California", "Ohio",
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina",
  "South Dakota", "Southern California", "Tennessee", "Texas", "Utah",
  "Vermont", "Virginia", "Washington", "Washington DC", "West Virginia",
  "Wisconsin", "Wyoming"
];

export type DailySchedule = {
  dateStr: string;
  displayDate: string;
  active: boolean;
  startTime: string;
  endTime: string;
  hoursStr: string;
  isStartOfWeek?: boolean;
  sameAsPrevWeek?: boolean;
};

const cityAutocompleteOptions = {
  types: ["(cities)"],
  componentRestrictions: { country: "us" },
};

const addressAutocompleteOptions = {
  types: ["address"],
  componentRestrictions: { country: "us" },
};

export default function QuoteForm() {
  const [loading, setLoading] = useState(false);
  const [sameAsBilling, setSameAsBilling] = useState(false);
  const [formErrors, setFormErrors] = useState<any>({});
  const [countries, setCountries] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [serviceStates, setServiceStates] = useState<any[]>([]);
  const [serviceCities, setServiceCities] = useState<any[]>([]);
  const [minDate, setMinDate] = useState("");
  const [minDateTime, setMinDateTime] = useState("");

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
    Country: "United States",
    Service_Loc_Business: "",
    Service_Street: "",
    Service_City: "",
    Service_State: "",
    Service_Zip_Code: "",
    Service_Country: "United States",
    "is_24/7": false,
    is_per_day: false,
    hours_per_day: "",
    total_hours: "",
    perDaySchedules: [] as DailySchedule[],
  };

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    if (formData.is_per_day && formData.Start_Date && formData.End_Date) {
      const start = new Date(formData.Start_Date);
      const end = new Date(formData.End_Date);

      if (start <= end) {
        const newSchedules: DailySchedule[] = [];
        const currentDate = new Date(start);

        while (currentDate <= end) {
          const yyyy = currentDate.getFullYear();
          const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
          const dd = String(currentDate.getDate()).padStart(2, '0');
          const dateStr = `${yyyy}-${mm}-${dd}`;

          const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const displayDate = `${daysOfWeek[currentDate.getDay()]}, ${months[currentDate.getMonth()]} ${currentDate.getDate()}`;

          const isStartOfWeek = newSchedules.length > 0 && currentDate.getDay() === 1;

          const existing = formData.perDaySchedules.find((s: DailySchedule) => s.dateStr === dateStr);
          if (existing) {
            newSchedules.push({ ...existing, isStartOfWeek });
          } else {
            newSchedules.push({
              dateStr,
              displayDate,
              active: true,
              startTime: "",
              endTime: "",
              hoursStr: "",
              isStartOfWeek,
              sameAsPrevWeek: false
            });
          }

          currentDate.setDate(currentDate.getDate() + 1);
        }

        setFormData(prev => {
          // Prevent infinite loops by checking if arrays are identical
          if (prev.perDaySchedules.length === newSchedules.length && prev.perDaySchedules.every((s, i) => s.dateStr === newSchedules[i].dateStr)) {
            return prev;
          }
          return { ...prev, perDaySchedules: newSchedules };
        });
      }
    }
  }, [formData.Start_Date, formData.End_Date, formData.is_per_day]);

  useEffect(() => {
    const allCountries = Country.getAllCountries();
    setCountries(allCountries);
    const us = allCountries.find((c) => c.name === "United States");
    if (us) {
      const formattedStates = CUSTOM_STATES.map((name) => ({ name, isoCode: name }));
      setStates(formattedStates);
      setServiceStates(formattedStates);

      setFormData((prev) => ({
        ...prev,
        Country: us.name,
        Service_Country: us.name,
      }));
    }
  }, []);

  useEffect(() => {
    const now = new Date();
    // YYYY-MM-DD
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    setMinDate(`${yyyy}-${mm}-${dd}`);
    // YYYY-MM-DDThh:mm
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    setMinDateTime(`${yyyy}-${mm}-${dd}T${hh}:${min}`);
  }, []);

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>, isService = false) => {
    const stateName = e.target.value;
    if (isService) {
      setFormData((prev) => ({ ...prev, Service_State: stateName, Service_City: "" }));
    } else {
      setFormData((prev) => {
        const updated = { ...prev, State: stateName, City: "" };
        if (sameAsBilling) {
          updated.Service_State = stateName;
          updated.Service_City = "";
        }
        return updated;
      });
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

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length === 0) return "";
    // If it starts with 1, we can consider the 1 as the country code
    let startIndex = digits.startsWith("1") ? 1 : 0;
    const countryCode = "+1";
    const part1 = digits.substring(startIndex, startIndex + 3);
    const part2 = digits.substring(startIndex + 3, startIndex + 6);
    const part3 = digits.substring(startIndex + 6, startIndex + 10);
    let formatted = countryCode;
    if (part1) formatted += `-${part1}`;
    if (part2) formatted += `-${part2}`;
    if (part3) formatted += `-${part3}`;

    return formatted;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    let finalValue = type === "checkbox" ? checked : value;

    if (name === "Mobile") {
      finalValue = formatPhoneNumber(value as string);
    }

    setFormData((prev) => {
      const updated = { ...prev, [name]: finalValue };
      if (sameAsBilling) {
        if (name === "Location_Business_Name") updated.Service_Loc_Business = finalValue as string;
        if (name === "Country") updated.Service_Country = finalValue as string;
        if (name === "Street") updated.Service_Street = finalValue as string;
        if (name === "City") updated.Service_City = finalValue as string;
        if (name === "State") updated.Service_State = finalValue as string;
        if (name === "Zip_Code") updated.Service_Zip_Code = finalValue as string;
      }
      return updated;
    });

    if (formErrors[name]) {
      setFormErrors((prev: any) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSameAsPrevWeekChange = (index: number, checked: boolean) => {
    setFormData((prev) => {
      const newSchedules = [...prev.perDaySchedules];
      newSchedules[index] = { ...newSchedules[index], sameAsPrevWeek: checked };

      if (checked) {
        for (let i = 0; i < 7; i++) {
          const currentIndex = index + i;
          if (currentIndex < newSchedules.length) {
            const currentDate = new Date(newSchedules[currentIndex].dateStr);
            currentDate.setDate(currentDate.getDate() - 7);

            const prevyyyy = currentDate.getFullYear();
            const prevmm = String(currentDate.getMonth() + 1).padStart(2, '0');
            const prevdd = String(currentDate.getDate()).padStart(2, '0');
            const prevDateStr = `${prevyyyy}-${prevmm}-${prevdd}`;

            const prevSchedule = newSchedules.find(s => s.dateStr === prevDateStr);

            if (prevSchedule) {
              newSchedules[currentIndex] = {
                ...newSchedules[currentIndex],
                active: prevSchedule.active,
                startTime: prevSchedule.startTime,
                endTime: prevSchedule.endTime,
                hoursStr: prevSchedule.hoursStr,
              };
            }
          }
        }
      }
      return { ...prev, perDaySchedules: newSchedules };
    });
  };

  const handleScheduleChange = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newSchedules = [...prev.perDaySchedules];
      const schedule = { ...newSchedules[index], [field]: value };

      const parseHoursToMs = (hStr: string) => {
        let h = 0, m = 0;
        if (hStr.includes(':')) {
          const parts = hStr.split(':');
          h = parseFloat(parts[0]) || 0;
          m = parseFloat(parts[1]) || 0;
        } else {
          const val = parseFloat(hStr) || 0;
          h = Math.floor(val);
          m = Math.round((val - h) * 60);
        }
        return (h * 60 + m) * 60000;
      };

      if (field === 'endTime') {
        if (schedule.startTime && schedule.endTime) {
          const [sh, sm] = schedule.startTime.split(':').map(Number);
          const [eh, em] = schedule.endTime.split(':').map(Number);
          let startMs = (sh * 60 + sm) * 60000;
          let endMs = (eh * 60 + em) * 60000;
          if (endMs < startMs) endMs += 24 * 60 * 60000;
          const diffMs = endMs - startMs;
          const hours = Math.floor(diffMs / (1000 * 60 * 60));
          const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          schedule.hoursStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        }
      } else if (field === 'startTime' || field === 'hoursStr') {
        if (schedule.startTime && schedule.hoursStr) {
          const [sh, sm] = schedule.startTime.split(':').map(Number);
          let startMs = (sh * 60 + sm) * 60000;
          let durationMs = parseHoursToMs(schedule.hoursStr);
          let endMs = startMs + durationMs;
          const endHours = Math.floor((endMs / (1000 * 60 * 60)) % 24);
          const endMinutes = Math.floor((endMs % (1000 * 60 * 60)) / 60000);
          schedule.endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
        } else if (field === 'startTime' && schedule.startTime && schedule.endTime) {
          const [sh, sm] = schedule.startTime.split(':').map(Number);
          const [eh, em] = schedule.endTime.split(':').map(Number);
          let startMs = (sh * 60 + sm) * 60000;
          let endMs = (eh * 60 + em) * 60000;
          if (endMs < startMs) endMs += 24 * 60 * 60000;
          const diffMs = endMs - startMs;
          const hours = Math.floor(diffMs / (1000 * 60 * 60));
          const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          schedule.hoursStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        }
      }

      newSchedules[index] = schedule;
      return { ...prev, perDaySchedules: newSchedules };
    });
  };

  const calculateNote = () => {
    if (formData["is_24/7"]) {
      if (formData.Start_Date && formData.End_Date) {
        const start = new Date(formData.Start_Date);
        const end = new Date(formData.End_Date);
        if (start < end) {
          const diffMs = end.getTime() - start.getTime();
          const diffHours = diffMs / (1000 * 60 * 60);
          const days = Math.ceil(diffHours / 24);

          const formatDate = (date: Date) => {
            const dd = String(date.getDate()).padStart(2, '0');
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const yyyy = date.getFullYear();
            const HH = String(date.getHours()).padStart(2, '0');
            const min = String(date.getMinutes()).padStart(2, '0');
            return `${dd}/${mm}/${yyyy} ${HH}:${min}`;
          };

          return (
            <span>
              <strong>Note:</strong> Guard will be available 24/7 from {formatDate(start)} to {formatDate(end)} ({diffHours.toFixed(2)} hours, {days} days)
            </span>
          );
        }
      }
    } else if (formData.is_per_day) {
      let totalHours = 0;
      let totalMinutes = 0;
      let activeDays = 0;

      if (formData.perDaySchedules && formData.perDaySchedules.length > 0) {
        formData.perDaySchedules.forEach((s: DailySchedule) => {
          if (s.active) {
            activeDays++;
            if (s.hoursStr) {
              const [h, m] = s.hoursStr.split(':').map(Number);
              totalHours += h || 0;
              totalMinutes += m || 0;
            }
          }
        });

        totalHours += Math.floor(totalMinutes / 60);
        totalMinutes = totalMinutes % 60;

        return (
          <span>
            <strong>Note:</strong> Guard will be available for {activeDays} days ({totalHours} hr{totalHours !== 1 ? 's' : ''} {totalMinutes} min)
          </span>
        );
      } else {
        return <span><strong>Note:</strong> Guard will be available for 0 days (0 hr 0 min)</span>;
      }
    }
    return <span><strong>Note:</strong> </span>;
  };

  const validateForm = () => {
    const errors: any = {};
    if (!formData.Company_Name) errors.Company_Name = "Company Name is required";
    if (!formData.First_Name) errors.First_Name = "First Name is required";
    if (!formData.Last_Name) errors.Last_Name = "Last Name is required";

    if (!formData.Email) {
      errors.Email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.Email)) {
      errors.Email = "Invalid email format";
    }

    if (!formData.Mobile) {
      errors.Mobile = "Mobile is required";
    } else if (formData.Mobile.length < 15) {
      errors.Mobile = "Invalid phone number";
    }

    if (!formData.Security_Type) errors.Security_Type = "Security Type is required";
    if (!formData.No_of_Guards || Number(formData.No_of_Guards) < 1) errors.No_of_Guards = "Number of guards is required";
    if (!formData.Job_Description) errors.Job_Description = "Job description is required";

    if (!formData["is_24/7"] && !formData.is_per_day) {
      errors.Availability = "Please select Guard Needed For";
    } else if (formData["is_24/7"]) {
      if (!formData.Start_Date) errors.Start_Date = "Start Date & Time is required";
      if (!formData.End_Date) errors.End_Date = "End Date & Time is required";
    } else {
      if (!formData.Start_Date) errors.Start_Date = "Start Date is required";
      if (!formData.End_Date) errors.End_Date = "End Date is required";
    }

    if (!formData.Location_Business_Name) errors.Location_Business_Name = "Business Name is required";
    if (!formData.Street) errors.Street = "Street Address is required";
    if (!formData.State) errors.State = "State is required";
    if (!formData.City) errors.City = "City is required";
    if (!formData.Zip_Code) errors.Zip_Code = "Zip Code is required";
    if (!formData.Service_Loc_Business) errors.Service_Loc_Business = "Business Name is required";
    if (!formData.Service_Street) errors.Service_Street = "Street Address is required";
    if (!formData.Service_State) errors.Service_State = "State is required";
    if (!formData.Service_City) errors.Service_City = "City is required";
    if (!formData.Service_Zip_Code) errors.Service_Zip_Code = "Zip Code is required";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const performSubmit = async () => {
    setLoading(true);
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
        total_hours: 0,
        days: []
      };
    } else {
      // Per Day
      const activeDays = formData.perDaySchedules ? formData.perDaySchedules.filter((s: DailySchedule) => s.active) : [];
      totalDays = activeDays.length;

      daysArray = activeDays.map((s: DailySchedule) => {
        const [yyyy, mm, dd] = s.dateStr.split('-');
        const d = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd));
        const dayName = d.toLocaleDateString("en-US", { weekday: "long" });

        let h = 0;
        if (s.hoursStr && s.hoursStr.includes(':')) {
          const [hh, min] = s.hoursStr.split(':');
          h = parseInt(hh) + parseInt(min) / 60;
        } else {
          h = parseFloat(s.hoursStr) || 0;
        }
        totalHours += h;

        return {
          date: s.dateStr,
          day: dayName,
          start_time: s.startTime || "00:00",
          end_time: s.endTime || "00:00",
          hours_per_day: h.toFixed(2),
        };
      });

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

    console.log("=== SUBMITTING QUOTE ===");
    console.log("Payload:", JSON.stringify(payload, null, 2));

    const res = await submitQuoteAction(payload);

    console.log("Response:", res);
    console.log("========================");

    setLoading(false);

    if (res.success) {
      toast.success("Quote submitted successfully!");
      setFormData(initialFormData);
      setSameAsBilling(false);
      setFormErrors({});
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
    <div className="w-full bg-white rounded-xl shadow-lg border border-slate-100 p-6 md:p-8 relative">
      {loading && <Loader />}
      <div className="mb-8">
        <div className="flex justify-start mb-4">
          <Image
            src="/images/website-logo.png"
            alt="Fast Guard Security Service"
            width={220}
            height={55}
            className="object-contain"
            priority
          />
        </div>
        <h2 className="text-2xl font-bold text-center uppercase text-[#0d7943]">
          INSTANT QUOTE
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8" noValidate>
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-b pb-2">Basic Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium mb-1 text-slate-700">Company Name <span className="text-red-500">*</span></label>
              <input type="text" name="Company_Name" value={formData.Company_Name} onChange={handleInputChange} placeholder="Enter your company name" className={`flex h-10 w-full rounded-md border ${formErrors.Company_Name ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary`} />
              {formErrors.Company_Name && <span className="text-xs text-red-500 mt-1 block">{formErrors.Company_Name}</span>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">First Name <span className="text-red-500">*</span></label>
              <input type="text" name="First_Name" value={formData.First_Name} onChange={handleInputChange} placeholder="Enter First Name" className={`flex h-10 w-full rounded-md border ${formErrors.First_Name ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary`} />
              {formErrors.First_Name && <span className="text-xs text-red-500 mt-1 block">{formErrors.First_Name}</span>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">Last Name <span className="text-red-500">*</span></label>
              <input type="text" name="Last_Name" value={formData.Last_Name} onChange={handleInputChange} placeholder="Enter Last Name" className={`flex h-10 w-full rounded-md border ${formErrors.Last_Name ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary`} />
              {formErrors.Last_Name && <span className="text-xs text-red-500 mt-1 block">{formErrors.Last_Name}</span>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">Best Number To Contact You? <span className="text-red-500">*</span></label>
              <input type="tel" name="Mobile" value={formData.Mobile} onChange={handleInputChange} placeholder="+1-XXX-XXX-XXXX" className={`flex h-10 w-full rounded-md border ${formErrors.Mobile ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary`} />
              {formErrors.Mobile && <span className="text-xs text-red-500 mt-1 block">{formErrors.Mobile}</span>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">Email <span className="text-red-500">*</span></label>
              <input type="email" name="Email" value={formData.Email} onChange={handleInputChange} placeholder="Enter Email" className={`flex h-10 w-full rounded-md border ${formErrors.Email ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary`} />
              {formErrors.Email && <span className="text-xs text-red-500 mt-1 block">{formErrors.Email}</span>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">Type Of Security Needed? <span className="text-red-500">*</span></label>
              <select name="Security_Type" value={formData.Security_Type} onChange={handleInputChange} className={`flex h-10 w-full rounded-md border ${formErrors.Security_Type ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white`}>
                <option value="" disabled>Select Security Type</option>
                {securityTypes.map((type, idx) => (
                  <option key={idx} value={type.value} disabled={type.value === ""}>{type.label}</option>
                ))}
              </select>
              {formErrors.Security_Type && <span className="text-xs text-red-500 mt-1 block">{formErrors.Security_Type}</span>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">How many Guards do you want? <span className="text-red-500">*</span></label>
              <input type="number" name="No_of_Guards" min="1" value={formData.No_of_Guards} onChange={handleInputChange} placeholder="1" className={`flex h-10 w-full rounded-md border ${formErrors.No_of_Guards ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary`} />
              {formErrors.No_of_Guards && <span className="text-xs text-red-500 mt-1 block">{formErrors.No_of_Guards}</span>}
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium mb-1 text-slate-700">Job Description <span className="text-red-500">*</span></label>
              <textarea name="Job_Description" value={formData.Job_Description} onChange={handleInputChange} rows={4} placeholder="Please provide details about your security needs..." className={`flex w-full rounded-md border ${formErrors.Job_Description ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary`} />
              {formErrors.Job_Description && <span className="text-xs text-red-500 mt-1 block">{formErrors.Job_Description}</span>}
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-b pb-2">Guard Needed For?</h3>

          <div className="flex gap-6 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="availability" checked={formData["is_24/7"]} onChange={() => {
                setFormData({ ...formData, "is_24/7": true, is_per_day: false });
                if (formErrors.Availability) setFormErrors((prev: any) => ({ ...prev, Availability: undefined }));
              }} className="w-4 h-4 text-primary" />
              <span>24/7</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="availability" checked={formData.is_per_day} onChange={() => {
                setFormData({ ...formData, "is_24/7": false, is_per_day: true });
                if (formErrors.Availability) setFormErrors((prev: any) => ({ ...prev, Availability: undefined }));
              }} className="w-4 h-4 text-primary" />
              <span>Per Day</span>
            </label>
          </div>
          {formErrors.Availability && <span className="text-xs text-red-500 block mb-4">{formErrors.Availability}</span>}

          {(formData["is_24/7"] || formData.is_per_day) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700">
                  {formData["is_24/7"] ? "Start Date & Time" : "Start Date"} <span className="text-red-500">*</span>
                </label>
                {formData["is_24/7"] ? (
                  <input type="datetime-local" min={minDateTime} name="Start_Date" value={formData.Start_Date} onChange={handleInputChange} className={`flex h-10 w-full rounded-md border ${formErrors.Start_Date ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary`} />
                ) : (
                  <input type="date" min={minDate} name="Start_Date" value={formData.Start_Date} onChange={handleInputChange} className={`flex h-10 w-full rounded-md border ${formErrors.Start_Date ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary`} />
                )}
                {formErrors.Start_Date && <span className="text-xs text-red-500 mt-1 block">{formErrors.Start_Date}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700">
                  {formData["is_24/7"] ? "End Date & Time" : "End Date"} <span className="text-red-500">*</span>
                </label>
                {formData["is_24/7"] ? (
                  <input type="datetime-local" min={minDateTime} name="End_Date" value={formData.End_Date} onChange={handleInputChange} className={`flex h-10 w-full rounded-md border ${formErrors.End_Date ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary`} />
                ) : (
                  <input type="date" min={minDate} name="End_Date" value={formData.End_Date} onChange={handleInputChange} className={`flex h-10 w-full rounded-md border ${formErrors.End_Date ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary`} />
                )}
                {formErrors.End_Date && <span className="text-xs text-red-500 mt-1 block">{formErrors.End_Date}</span>}
              </div>
            </div>
          )}

          {formData.is_per_day && formData.perDaySchedules && formData.perDaySchedules.length > 0 && (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-700 font-semibold border-b dark:border-slate-700">
                  <tr>
                    <th className="py-3 px-2">Date</th>
                    <th className="py-3 px-2 text-center">Hours per Day</th>
                    <th className="py-3 px-2 text-center">Start Time</th>
                    <th className="py-3 px-2 text-center">End Time</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.perDaySchedules.map((schedule: DailySchedule, index: number) => (
                    <React.Fragment key={schedule.dateStr}>
                      {schedule.isStartOfWeek && (
                        <tr>
                          <td colSpan={4} className="py-2 px-2 pt-4">
                            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700 w-max">
                              <input
                                type="checkbox"
                                checked={!!schedule.sameAsPrevWeek}
                                onChange={(e) => handleSameAsPrevWeekChange(index, e.target.checked)}
                                className="w-4 h-4 text-primary rounded border-slate-300"
                              />
                              Same time as previous week
                            </label>
                          </td>
                        </tr>
                      )}
                      <tr className="border-b dark:border-slate-700 border-slate-100 border-dashed">
                        <td className="py-3 px-2 flex items-center gap-3">
                          <input type="checkbox" checked={schedule.active} onChange={(e) => handleScheduleChange(index, 'active', e.target.checked)} className="w-4 h-4 text-primary rounded border-slate-300" />
                          <span className="font-medium whitespace-nowrap">{schedule.displayDate}</span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <input type="text" value={schedule.hoursStr} onChange={(e) => handleScheduleChange(index, 'hoursStr', e.target.value)} disabled={!schedule.active} placeholder="e.g., 8:00" className="w-32 mx-auto text-center bg-transparent border border-slate-300 rounded-md h-9 px-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50" />
                        </td>
                        <td className="py-3 px-2">
                          <input type="time" value={schedule.startTime} onChange={(e) => handleScheduleChange(index, 'startTime', e.target.value)} disabled={!schedule.active} className="w-full bg-transparent border border-slate-300 rounded-md h-9 px-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50" />
                        </td>
                        <td className="py-3 px-2">
                          <input type="time" value={schedule.endTime} onChange={(e) => handleScheduleChange(index, 'endTime', e.target.value)} disabled={!schedule.active} className="w-full bg-transparent border border-slate-300 rounded-md h-9 px-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50" />
                        </td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {(formData["is_24/7"] || formData.is_per_day) && (
            <div className="mt-4 p-3 rounded-md bg-[#e8f5e9] text-[#0b3b2c] text-sm border border-[#c8e6c9]">
              {calculateNote()}
            </div>
          )}
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-b pb-2">Billing Location</h3>

          <div className="flex flex-col gap-6">
            {/* Row 1 */}
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Business Name <span className="text-red-500">*</span></label>
                <input type="text" name="Location_Business_Name" value={formData.Location_Business_Name} onChange={handleInputChange} placeholder="Enter Business Name" className={`flex h-10 w-full rounded-md border ${formErrors.Location_Business_Name ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary`} />
                {formErrors.Location_Business_Name && <span className="text-xs text-red-500 mt-1 block">{formErrors.Location_Business_Name}</span>}
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Country <span className="text-red-500">*</span></label>
                <input type="text" name="Country" value={formData.Country} readOnly className="flex h-10 w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500 cursor-not-allowed focus:outline-none" />
              </div>
            </div>

            {/* Row 2 */}
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">State <span className="text-red-500">*</span></label>
                <select value={formData.State} onChange={(e) => handleStateChange(e, false)} className={`flex h-10 w-full rounded-md border ${formErrors.State ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white`} disabled={!formData.Country}>
                  <option value="">Select State</option>
                  {states.map((s) => (
                    <option key={s.isoCode} value={s.name}>{s.name}</option>
                  ))}
                </select>
                {formErrors.State && <span className="text-xs text-red-500 mt-1 block">{formErrors.State}</span>}
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">City <span className="text-red-500">*</span></label>
                <Autocomplete
                  apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                  options={cityAutocompleteOptions}
                  onPlaceSelected={(place) => {
                    if (place) {
                      const cityName = place.name || (place.formatted_address ? place.formatted_address.split(',')[0] : '');
                      if (cityName) {
                        handleInputChange({ target: { name: "City", value: cityName } } as any);
                      }
                    }
                  }}
                  name="City"
                  value={formData.City}
                  onChange={handleInputChange}
                  placeholder="Enter City"
                  className={`flex h-10 w-full rounded-md border ${formErrors.City ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary`}
                />
                {formErrors.City && <span className="text-xs text-red-500 mt-1 block">{formErrors.City}</span>}
              </div>
            </div>

            {/* Row 3 */}
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-[70%]">
                <label className="block text-sm font-medium mb-1">Street Address <span className="text-red-500">*</span></label>
                <Autocomplete
                  apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                  options={addressAutocompleteOptions}
                  onPlaceSelected={(place) => {
                    if (place) {
                      const address = place.name || (place.formatted_address ? place.formatted_address.split(',')[0] : '');
                      if (address) {
                        handleInputChange({ target: { name: "Street", value: address } } as any);
                      }
                      const zipCode = place.address_components?.find((c: any) => c.types.includes("postal_code"))?.long_name;
                      if (zipCode && !formData.Zip_Code) {
                        handleInputChange({ target: { name: "Zip_Code", value: zipCode } } as any);
                      }
                    }
                  }}
                  name="Street"
                  value={formData.Street}
                  onChange={handleInputChange}
                  placeholder="Enter Street Address"
                  className={`flex h-10 w-full rounded-md border ${formErrors.Street ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary`}
                />
                {formErrors.Street && <span className="text-xs text-red-500 mt-1 block">{formErrors.Street}</span>}
              </div>

              <div className="w-full md:w-[30%]">
                <label className="block text-sm font-medium mb-1">Zip Code <span className="text-red-500">*</span></label>
                <input type="text" name="Zip_Code" maxLength={10} value={formData.Zip_Code} onChange={handleInputChange} placeholder="Enter Zip Code" className={`flex h-10 w-full rounded-md border ${formErrors.Zip_Code ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary`} />
                {formErrors.Zip_Code && <span className="text-xs text-red-500 mt-1 block">{formErrors.Zip_Code}</span>}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-6">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Service Location</h3>
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" checked={sameAsBilling} onChange={handleSameAsBillingChange} className="w-4 h-4 text-primary rounded" />
              <span>Same as Billing Location</span>
            </label>
          </div>

          <div className="flex flex-col gap-6">
            {/* Row 1 */}
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Business Name <span className="text-red-500">*</span></label>
                <input type="text" name="Service_Loc_Business" value={formData.Service_Loc_Business} onChange={handleInputChange} disabled={sameAsBilling} placeholder="Enter Business Name" className={`flex h-10 w-full rounded-md border ${formErrors.Service_Loc_Business ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50`} />
                {formErrors.Service_Loc_Business && <span className="text-xs text-red-500 mt-1 block">{formErrors.Service_Loc_Business}</span>}
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Country <span className="text-red-500">*</span></label>
                <input type="text" name="Service_Country" value={formData.Service_Country} readOnly disabled={sameAsBilling} className="flex h-10 w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500 cursor-not-allowed focus:outline-none disabled:opacity-50" />
              </div>
            </div>

            {/* Row 2 */}
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">State <span className="text-red-500">*</span></label>
                <select value={formData.Service_State} onChange={(e) => handleStateChange(e, true)} disabled={sameAsBilling || !formData.Service_Country} className={`flex h-10 w-full rounded-md border ${formErrors.Service_State ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white disabled:opacity-50`}>
                  <option value="">Select State</option>
                  {serviceStates.map((s) => (
                    <option key={s.isoCode} value={s.name}>{s.name}</option>
                  ))}
                </select>
                {formErrors.Service_State && <span className="text-xs text-red-500 mt-1 block">{formErrors.Service_State}</span>}
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">City <span className="text-red-500">*</span></label>
                <Autocomplete
                  apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                  options={cityAutocompleteOptions}
                  onPlaceSelected={(place) => {
                    if (place) {
                      const cityName = place.name || (place.formatted_address ? place.formatted_address.split(',')[0] : '');
                      if (cityName) {
                        handleInputChange({ target: { name: "Service_City", value: cityName } } as any);
                      }
                    }
                  }}
                  name="Service_City"
                  value={formData.Service_City}
                  onChange={handleInputChange}
                  disabled={sameAsBilling}
                  placeholder="Enter City"
                  className={`flex h-10 w-full rounded-md border ${formErrors.Service_City ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50`}
                />
                {formErrors.Service_City && <span className="text-xs text-red-500 mt-1 block">{formErrors.Service_City}</span>}
              </div>
            </div>

            {/* Row 3 */}
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-[70%]">
                <label className="block text-sm font-medium mb-1">Street Address <span className="text-red-500">*</span></label>
                <Autocomplete
                  apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                  options={addressAutocompleteOptions}
                  onPlaceSelected={(place) => {
                    if (place) {
                      const address = place.name || (place.formatted_address ? place.formatted_address.split(',')[0] : '');
                      if (address) {
                        handleInputChange({ target: { name: "Service_Street", value: address } } as any);
                      }
                      const zipCode = place.address_components?.find((c: any) => c.types.includes("postal_code"))?.long_name;
                      if (zipCode && !formData.Service_Zip_Code) {
                        handleInputChange({ target: { name: "Service_Zip_Code", value: zipCode } } as any);
                      }
                    }
                  }}
                  name="Service_Street"
                  value={formData.Service_Street}
                  onChange={handleInputChange}
                  disabled={sameAsBilling}
                  placeholder="Enter Street Address"
                  className={`flex h-10 w-full rounded-md border ${formErrors.Service_Street ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50`}
                />
                {formErrors.Service_Street && <span className="text-xs text-red-500 mt-1 block">{formErrors.Service_Street}</span>}
              </div>

              <div className="w-full md:w-[30%]">
                <label className="block text-sm font-medium mb-1">Zip Code <span className="text-red-500">*</span></label>
                <input type="text" name="Service_Zip_Code" maxLength={10} value={formData.Service_Zip_Code} onChange={handleInputChange} placeholder="Enter Zip Code" disabled={sameAsBilling} className={`flex h-10 w-full rounded-md border ${formErrors.Service_Zip_Code ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50`} />
                {formErrors.Service_Zip_Code && <span className="text-xs text-red-500 mt-1 block">{formErrors.Service_Zip_Code}</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <button type="submit" disabled={loading} className="cursor-pointer px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-md shadow-md transition-colors flex items-center gap-2 text-lg">
            {loading ? "Submitting..." : "Submit Quote"}
          </button>
        </div>
      </form>
    </div>
  );
}
