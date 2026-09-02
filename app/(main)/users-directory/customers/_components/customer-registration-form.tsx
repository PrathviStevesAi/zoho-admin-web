"use client";

import { useState, useEffect } from "react";
import { registerCustomerAction } from "@/actions/auth.actions";
import { toast } from "sonner";
import {
  UserPlus,
  Building,
  Mail,
  Phone,
  MapPin,
  ChevronDown,
  ArrowLeft,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Country, State, City } from "country-state-city";
import { US_STATE_CITY_DATA } from "@/app/subcontractor/components/StaticData";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const countries = [
  { name: "Argentina", code: "ar", dialCode: "+54" },
  { name: "Bolivia", code: "bo", dialCode: "+591" },
  { name: "Brazil", code: "br", dialCode: "+55" },
  { name: "Canada", code: "ca", dialCode: "+1" },
  { name: "Chile", code: "cl", dialCode: "+56" },
  { name: "Colombia", code: "co", dialCode: "+57" },
  { name: "Ecuador", code: "ec", dialCode: "+593" },
  { name: "Guyana", code: "gy", dialCode: "+592" },
  { name: "Paraguay", code: "py", dialCode: "+595" },
  { name: "Peru", code: "pe", dialCode: "+51" },
  { name: "Suriname", code: "sr", dialCode: "+597" },
  { name: "United States", code: "us", dialCode: "+1" },
  { name: "Uruguay", code: "uy", dialCode: "+598" },
  { name: "Venezuela", code: "ve", dialCode: "+58" }
];

const ALLOWED_COUNTRIES: Record<string, string> = {
  US: "United States",
  CA: "Canada",
  AR: "Argentina",
  BO: "Bolivia",
  BR: "Brazil",
  CL: "Chile",
  CO: "Colombia",
  EC: "Ecuador",
  GY: "Guyana",
  PY: "Paraguay",
  PE: "Peru",
  SR: "Suriname",
  UY: "Uruguay",
  VE: "Venezuela",
};

export function CustomerRegistrationForm({ onBack }: { onBack: () => void }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(countries[11]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    companyName: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    billingType: "zoho",
    netTerms: "",
    servicePrices: [
      { id: 1, name: "Armed Security", price: 0 },
      { id: 2, name: "Body Guard Armed", price: 0 },
      { id: 3, name: "Fire Watch Guard", price: 0 },
      { id: 4, name: "Unarmed Security", price: 0 },
      { id: 5, name: "Body Guard Unarmed", price: 0 },
      { id: 6, name: "Body Guard with Suit", price: 0 },
      { id: 7, name: "Employee Termination / Work Place Separation Security", price: 0 },
    ],
    billingZip: "",
    billingCity: "",
    billingState: "",
    billingStreet: "",
    billingAddress: "",
    billingCountry: "",
    serviceZip: "",
    serviceCity: "",
    serviceState: "",
    serviceStreet: "",
    serviceAddress: "",
    serviceCountry: "",
    sameAsBilling: false,
  });

  const [billingAddressStates, setBillingAddressStates] = useState<any[]>([]);
  const [billingAddressCities, setBillingAddressCities] = useState<any[]>([]);
  const [serviceAddressStates, setServiceAddressStates] = useState<any[]>([]);
  const [serviceAddressCities, setServiceAddressCities] = useState<any[]>([]);

  useEffect(() => {
    if (formData.billingCountry === "US") {
      const usStates = Object.entries(US_STATE_CITY_DATA).map(([name, data]) => ({
        isoCode: data.short_code,
        name: name,
      }));
      setBillingAddressStates(usStates);
    } else if (formData.billingCountry) {
      setBillingAddressStates(State.getStatesOfCountry(formData.billingCountry));
    } else {
      setBillingAddressStates([]);
    }
  }, [formData.billingCountry]);

  useEffect(() => {
    if (formData.billingCountry === "US" && formData.billingState) {
      const stateData = Object.values(US_STATE_CITY_DATA).find((s: any) => s.short_code === formData.billingState);
      if (stateData) {
        const usCities = (stateData as any).cities.map((city: string) => ({ name: city }));
        setBillingAddressCities(usCities);
      } else {
        setBillingAddressCities([]);
      }
    } else if (formData.billingCountry && formData.billingState) {
      setBillingAddressCities(City.getCitiesOfState(formData.billingCountry, formData.billingState));
    } else {
      setBillingAddressCities([]);
    }
  }, [formData.billingState, formData.billingCountry]);

  useEffect(() => {
    if (formData.serviceCountry === "US") {
      const usStates = Object.entries(US_STATE_CITY_DATA).map(([name, data]) => ({
        isoCode: data.short_code,
        name: name,
      }));
      setServiceAddressStates(usStates);
    } else if (formData.serviceCountry) {
      setServiceAddressStates(State.getStatesOfCountry(formData.serviceCountry));
    } else {
      setServiceAddressStates([]);
    }
  }, [formData.serviceCountry]);

  useEffect(() => {
    if (formData.serviceCountry === "US" && formData.serviceState) {
      const stateData = Object.values(US_STATE_CITY_DATA).find((s: any) => s.short_code === formData.serviceState);
      if (stateData) {
        const usCities = (stateData as any).cities.map((city: string) => ({ name: city }));
        setServiceAddressCities(usCities);
      } else {
        setServiceAddressCities([]);
      }
    } else if (formData.serviceCountry && formData.serviceState) {
      setServiceAddressCities(City.getCitiesOfState(formData.serviceCountry, formData.serviceState));
    } else {
      setServiceAddressCities([]);
    }
  }, [formData.serviceState, formData.serviceCountry]);

  useEffect(() => {
    if (formData.sameAsBilling) {
      setFormData(prev => ({
        ...prev,
        serviceZip: prev.billingZip,
        serviceCity: prev.billingCity,
        serviceState: prev.billingState,
        serviceStreet: prev.billingStreet,
        serviceAddress: prev.billingAddress,
        serviceCountry: prev.billingCountry,
      }));

      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.serviceStreet;
        delete newErrors.serviceCountry;
        delete newErrors.serviceState;
        delete newErrors.serviceCity;
        delete newErrors.serviceZip;
        return newErrors;
      });
    }
  }, [
    formData.sameAsBilling,
    formData.billingZip,
    formData.billingCity,
    formData.billingState,
    formData.billingStreet,
    formData.billingAddress,
    formData.billingCountry
  ]);

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    if (!formData.companyName) newErrors.companyName = "Company name is required";
    if (!formData.firstName) newErrors.firstName = "First name is required";
    if (!formData.lastName) newErrors.lastName = "Last name is required";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = "Email address is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (formData.phone) {
      const digitCount = formData.phone.replace(/\D/g, "").length;
      if (digitCount < 7 || digitCount > 15) {
        newErrors.phone = "Phone number must be between 7 and 15 digits";
      }
    }

    if (!formData.billingType) newErrors.billingType = "Billing type is required";
    if (formData.billingType === "net_term" && !formData.netTerms) newErrors.netTerms = "Net terms is required";

    if (!formData.billingStreet) newErrors.billingStreet = "Street address is required";
    if (!formData.billingCountry) newErrors.billingCountry = "Country is required";
    if (!formData.billingState) newErrors.billingState = "State is required";
    if (!formData.billingCity) newErrors.billingCity = "City is required";
    if (!formData.billingZip) newErrors.billingZip = "ZIP code is required";

    if (!formData.sameAsBilling) {
      if (!formData.serviceStreet) newErrors.serviceStreet = "Street address is required";
      if (!formData.serviceCountry) newErrors.serviceCountry = "Country is required";
      if (!formData.serviceState) newErrors.serviceState = "State is required";
      if (!formData.serviceCity) newErrors.serviceCity = "City is required";
      if (!formData.serviceZip) newErrors.serviceZip = "ZIP code is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fill all the required fields");
      return;
    }

    setErrors({});
    setIsRegistering(true);

    const securityServicePriceObj = formData.servicePrices.reduce((acc, curr) => {
      acc[curr.name] = curr.price;
      return acc;
    }, {} as Record<string, number>);

    const res = await registerCustomerAction({
      company_name: formData.companyName,
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email,
      phone_number: formData.phone ? `${selectedCountry.dialCode}${formData.phone}` : "",
      billing_type: formData.billingType,
      net_terms_days: formData.billingType === "net_term" ? (Number(formData.netTerms) || 0) : 0,
      security_service_price: formData.billingType === "net_term" ? securityServicePriceObj : {},
      billing_address: {
        zip: formData.billingZip,
        city: formData.billingCity,
        state: formData.billingState,
        street: formData.billingStreet,
        address: formData.billingAddress,
        country: formData.billingCountry
      },
      service_address: {
        zip: formData.sameAsBilling ? formData.billingZip : formData.serviceZip,
        city: formData.sameAsBilling ? formData.billingCity : formData.serviceCity,
        state: formData.sameAsBilling ? formData.billingState : formData.serviceState,
        street: formData.sameAsBilling ? formData.billingStreet : formData.serviceStreet,
        address: formData.sameAsBilling ? formData.billingAddress : formData.serviceAddress,
        country: formData.sameAsBilling ? formData.billingCountry : formData.serviceCountry
      }
    });

    if (res.success) {
      toast.success("Customer registered successfully");
      setFormData({
        companyName: "",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        billingType: "zoho",
        netTerms: "",
        servicePrices: [
          { id: 1, name: "Armed Security", price: 0 },
          { id: 2, name: "Body Guard Armed", price: 0 },
          { id: 3, name: "Fire Watch Guard", price: 0 },
          { id: 4, name: "Unarmed Security", price: 0 },
          { id: 5, name: "Body Guard Unarmed", price: 0 },
          { id: 6, name: "Body Guard with Suit", price: 0 },
          { id: 7, name: "Employee Termination / Work Place Separation Security", price: 0 },
        ],
        billingZip: "",
        billingCity: "",
        billingState: "",
        billingStreet: "",
        billingAddress: "",
        billingCountry: "",
        serviceZip: "",
        serviceCity: "",
        serviceState: "",
        serviceStreet: "",
        serviceAddress: "",
        serviceCountry: "",
        sameAsBilling: false,
      });
      setSelectedCountry(countries[11]);
      onBack();
    } else {
      toast.error(res.error || "Customer registration failed");
    }
    setIsRegistering(false);
  };

  const getInputClassName = (error?: string, hasLeftIcon?: boolean) => {
    return cn(
      "h-12 bg-slate-50/50 rounded-xl transition-all text-slate-800 font-medium",
      hasLeftIcon ? "pl-11" : "",
      error
        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
        : "border-slate-200 focus:ring-[#0064cb]/10 focus:border-[#0064cb]"
    );
  };

  const getSelectTriggerClassName = (error?: string) => {
    return cn(
      "!h-12 bg-slate-50/50 rounded-xl transition-all text-slate-800 font-medium",
      error
        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
        : "border-slate-200 focus:ring-[#0064cb]/10 focus:border-[#0064cb]"
    );
  };

  return (
    <div className="max-w-[1400px] mx-auto animate-in fade-in duration-300">
      <div className="flex items-center justify-between bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0064cb]/10 flex items-center justify-center text-[#0064cb]">
            <UserPlus className="w-5 h-5" />
          </div>
          Register New Customer
        </h2>
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="cursor-pointer border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Customer List
        </Button>
      </div>

      <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-white !gap-0 !py-0">
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleRegister} className="space-y-6" noValidate>
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-700 border-b pb-2">General Information</h3>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">Company Name</label>
                <div className="relative">
                  <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700 z-10 pointer-events-none" />
                  <Input
                    placeholder="Company name"
                    value={formData.companyName}
                    onChange={(e) => {
                      setFormData({ ...formData, companyName: e.target.value });
                      clearError("companyName");
                    }}
                    className={getInputClassName(errors.companyName, true)}
                  />
                </div>
                {errors.companyName && <p className="text-red-500 text-[10px] mt-1 font-medium ml-1">{errors.companyName}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">First Name</label>
                  <Input
                    placeholder="First name"
                    value={formData.firstName}
                    onChange={(e) => {
                      setFormData({ ...formData, firstName: e.target.value });
                      clearError("firstName");
                    }}
                    className={getInputClassName(errors.firstName)}
                  />
                  {errors.firstName && <p className="text-red-500 text-[10px] mt-1 font-medium ml-1">{errors.firstName}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">Last Name</label>
                  <Input
                    placeholder="Last name"
                    value={formData.lastName}
                    onChange={(e) => {
                      setFormData({ ...formData, lastName: e.target.value });
                      clearError("lastName");
                    }}
                    className={getInputClassName(errors.lastName)}
                  />
                  {errors.lastName && <p className="text-red-500 text-[10px] mt-1 font-medium ml-1">{errors.lastName}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700" />
                    <Input
                      type="email"
                      placeholder="Enter email address"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        clearError("email");
                      }}
                      className={getInputClassName(errors.email, true)}
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-[10px] mt-1 font-medium ml-1">{errors.email}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">Phone Number</label>
                  <div className={cn(
                    "relative flex items-center h-12 bg-slate-50/50 border rounded-xl focus-within:ring-2 transition-all",
                    errors.phone ? "border-red-500 focus-within:border-red-500 focus-within:ring-red-500/20" : "border-slate-200 focus-within:ring-[#0064cb]/10 focus-within:border-[#0064cb]"
                  )}>
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 h-full rounded-l-xl hover:bg-slate-100/50 border-r transition-colors focus:outline-none cursor-pointer",
                        errors.phone ? "border-red-200" : "border-slate-200/80"
                      )}
                    >
                      <img
                        src={`https://flagcdn.com/w20/${selectedCountry.code}.png`}
                        alt={selectedCountry.name}
                        className="w-5 h-3.5 object-cover rounded-sm shadow-sm"
                      />
                      <span className="text-sm font-semibold text-slate-700">{selectedCountry.dialCode}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                    </button>

                    <div className="relative flex-1 h-full flex items-center">
                      <Phone className="absolute left-3 w-4 h-4 text-slate-700" />
                      <input
                        type="text"
                        placeholder="Enter phone number"
                        value={formData.phone}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, "").slice(0, 15);
                          setFormData({ ...formData, phone: digits });
                          clearError("phone");
                        }}
                        className="w-full h-full bg-transparent outline-none border-none pl-9 pr-3 text-slate-800 font-medium placeholder-slate-400 text-sm"
                      />
                    </div>

                    {isDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 w-[260px] max-h-[220px] overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl z-50 animate-in fade-in duration-100">
                        {countries.map((country) => (
                          <button
                            key={country.code}
                            type="button"
                            onClick={() => {
                              setSelectedCountry(country);
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-slate-50 transition-colors cursor-pointer ${selectedCountry.code === country.code ? "bg-blue-50/30 font-semibold text-[#0064cb]" : "text-slate-700"
                              }`}
                          >
                            <img
                              src={`https://flagcdn.com/w20/${country.code}.png`}
                              alt={country.name}
                              className="w-5 h-3.5 object-cover rounded-sm shadow-sm"
                            />
                            <span className="flex-1 truncate font-medium">{country.name}</span>
                            <span className="text-slate-700 text-xs font-semibold">{country.dialCode}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {errors.phone && <p className="text-red-500 text-[10px] mt-1 font-medium ml-1">{errors.phone}</p>}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-700 border-b pb-2">Billing Type</h3>

              <div className="bg-[#f0f7ff] border border-[#e0f0ff] rounded-xl p-4">
                <div className="flex gap-2">
                  <div className="text-[#0064cb] mt-0.5">
                    <Info className="w-4 h-4" />
                  </div>
                  <div className="space-y-2 text-xs text-slate-700">
                    <p className="font-semibold text-[#0064cb]">Note -</p>
                    <ul className="list-disc pl-4 space-y-1 text-slate-600">
                      <li><strong>Billing Type - Zoho</strong> means customer can place and order and it will execute through zoho same as Auto quote , he will get estimate and invoice through zoho.</li>
                      <li><strong>Net Term</strong> - Means Customer is regular customer he can place and order with predefined guard price , order directly add in new invoice section.</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">
                    Billing Type <span className="text-red-500">*</span>
                  </label>
                  <Select
                    onValueChange={(val) => {
                      setFormData({ ...formData, billingType: val });
                      clearError("billingType");
                    }}
                    value={formData.billingType}
                  >
                    <SelectTrigger className={getSelectTriggerClassName(errors.billingType)}>
                      <SelectValue placeholder="Select billing type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zoho">Zoho</SelectItem>
                      <SelectItem value="net_term">Net Term</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.billingType && <p className="text-red-500 text-[10px] mt-1 font-medium ml-1">{errors.billingType}</p>}
                </div>

                {formData.billingType === "net_term" && (
                  <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1 flex items-center gap-1">
                      Net Terms (Days)
                      <Info className="w-3.5 h-3.5 text-slate-400" />
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="Enter days (e.g., 15, 30, 45)"
                      value={formData.netTerms}
                      onKeyDown={(e) => {
                        if (e.key === '.' || e.key === '-' || e.key === 'e' || e.key === 'E') {
                          e.preventDefault();
                        }
                      }}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setFormData({ ...formData, netTerms: val });
                        clearError("netTerms");
                      }}
                      className={getInputClassName(errors.netTerms)}
                    />
                    {errors.netTerms && <p className="text-red-500 text-[10px] mt-1 font-medium ml-1">{errors.netTerms}</p>}
                  </div>
                )}
              </div>

              {formData.billingType === "net_term" && (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300 mt-6">
                  <div>
                    <h4 className="text-[13px] font-bold text-slate-800 flex items-center gap-1">
                      Security Service Price <span className="text-red-500">*</span> <Info className="w-3.5 h-3.5 text-slate-400" />
                    </h4>
                    <p className="text-[11px] text-slate-500">Set default prices for security services (editable)</p>
                  </div>
                  <div className="border border-slate-200 rounded-md overflow-hidden bg-white shadow-sm">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase">
                        <tr>
                          <th className="p-2.5 w-10 text-center">#</th>
                          <th className="p-2.5">Service Name</th>
                          <th className="p-2.5 w-38">Price (USD)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {formData.servicePrices.map((service, index) => (
                          <tr key={service.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-2 text-center text-slate-400 font-medium">{index + 1}</td>
                            <td className="p-2 text-slate-600 font-medium">{service.name}</td>
                            <td className="p-2">
                              <div className="relative flex items-center">
                                <span className="absolute left-2.5 text-slate-400 font-medium text-xs">$</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={service.price}
                                  onKeyDown={(e) => {
                                    if (e.key === '-') {
                                      e.preventDefault();
                                    }
                                  }}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === '' || Number(val) >= 0) {
                                      const newPrices = [...formData.servicePrices];
                                      newPrices[index].price = val as any;
                                      setFormData({ ...formData, servicePrices: newPrices });
                                    }
                                  }}
                                  className="w-full h-8 pl-6 pr-2 bg-white border border-slate-200 rounded-md text-slate-700 font-semibold focus:outline-none focus:border-[#0064cb] focus:ring-1 focus:ring-[#0064cb] text-xs transition-all"
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-700 border-b pb-2">Billing Address</h3>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">Street Address</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700 z-10 pointer-events-none" />
                  <Input
                    placeholder="Enter street address"
                    value={formData.billingStreet}
                    onChange={(e) => {
                      setFormData({ ...formData, billingStreet: e.target.value, billingAddress: e.target.value });
                      clearError("billingStreet");
                    }}
                    className={getInputClassName(errors.billingStreet, true)}
                  />
                </div>
                {errors.billingStreet && <p className="text-red-500 text-[10px] mt-1 font-medium ml-1">{errors.billingStreet}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">Country</label>
                  <Select
                    onValueChange={(val) => {
                      setFormData({ ...formData, billingCountry: val, billingState: "", billingCity: "" });
                      clearError("billingCountry");
                    }}
                    value={formData.billingCountry}
                  >
                    <SelectTrigger className={getSelectTriggerClassName(errors.billingCountry)}>
                      <SelectValue placeholder="Select Country" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ALLOWED_COUNTRIES).map(([code, name]) => (
                        <SelectItem key={code} value={code}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.billingCountry && <p className="text-red-500 text-[10px] mt-1 font-medium ml-1">{errors.billingCountry}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">State</label>
                  <Select
                    key={`billing-state-${billingAddressStates.length}`}
                    onValueChange={(val) => {
                      setFormData({ ...formData, billingState: val, billingCity: "" });
                      clearError("billingState");
                    }}
                    value={formData.billingState}
                    disabled={!formData.billingCountry}
                  >
                    <SelectTrigger className={getSelectTriggerClassName(errors.billingState)}>
                      <SelectValue placeholder="Select State" />
                    </SelectTrigger>
                    <SelectContent>
                      {billingAddressStates.map((s) => (
                        <SelectItem key={s.isoCode} value={s.isoCode}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.billingState && <p className="text-red-500 text-[10px] mt-1 font-medium ml-1">{errors.billingState}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">City</label>
                  <Select
                    key={`billing-city-${billingAddressCities.length}`}
                    onValueChange={(val) => {
                      setFormData({ ...formData, billingCity: val });
                      clearError("billingCity");
                    }}
                    value={formData.billingCity}
                    disabled={!formData.billingState}
                  >
                    <SelectTrigger className={getSelectTriggerClassName(errors.billingCity)}>
                      <SelectValue placeholder="Select City" />
                    </SelectTrigger>
                    <SelectContent>
                      {billingAddressCities.map((c) => (
                        <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.billingCity && <p className="text-red-500 text-[10px] mt-1 font-medium ml-1">{errors.billingCity}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">ZIP Code</label>
                  <Input
                    placeholder="ZIP Code"
                    maxLength={10}
                    value={formData.billingZip}
                    onChange={(e) => {
                      setFormData({ ...formData, billingZip: e.target.value.slice(0, 10) });
                      clearError("billingZip");
                    }}
                    className={getInputClassName(errors.billingZip)}
                  />
                  {errors.billingZip && <p className="text-red-500 text-[10px] mt-1 font-medium ml-1">{errors.billingZip}</p>}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-sm font-bold text-slate-700">Service Address</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="same-as-billing"
                    checked={formData.sameAsBilling}
                    onChange={(e) => setFormData({ ...formData, sameAsBilling: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-[#0064cb] focus:ring-[#0064cb] cursor-pointer"
                  />
                  <label htmlFor="same-as-billing" className="text-xs font-semibold text-slate-600 cursor-pointer select-none">
                    Same as billing
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">Street Address</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700 z-10 pointer-events-none" />
                  <Input
                    placeholder="Enter street address"
                    value={formData.serviceStreet}
                    disabled={formData.sameAsBilling}
                    onChange={(e) => {
                      setFormData({ ...formData, serviceStreet: e.target.value, serviceAddress: e.target.value });
                      clearError("serviceStreet");
                    }}
                    className={getInputClassName(errors.serviceStreet, true)}
                  />
                </div>
                {errors.serviceStreet && <p className="text-red-500 text-[10px] mt-1 font-medium ml-1">{errors.serviceStreet}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">Country</label>
                  {formData.sameAsBilling ? (
                    <div className="relative">
                      <Input
                        value={ALLOWED_COUNTRIES[formData.billingCountry] || formData.billingCountry}
                        disabled
                        className="h-12 bg-slate-50/50 border-slate-200 rounded-xl text-slate-800 font-medium"
                      />
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                  ) : (
                    <Select
                      onValueChange={(val) => {
                        setFormData({ ...formData, serviceCountry: val, serviceState: "", serviceCity: "" });
                        clearError("serviceCountry");
                      }}
                      value={formData.serviceCountry}
                    >
                      <SelectTrigger className={getSelectTriggerClassName(errors.serviceCountry)}>
                        <SelectValue placeholder="Select Country" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ALLOWED_COUNTRIES).map(([code, name]) => (
                          <SelectItem key={code} value={code}>{name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {errors.serviceCountry && <p className="text-red-500 text-[10px] mt-1 font-medium ml-1">{errors.serviceCountry}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">State</label>
                  {formData.sameAsBilling ? (
                    <div className="relative">
                      <Input
                        value={
                          formData.billingCountry === "US"
                            ? Object.entries(US_STATE_CITY_DATA).find(([_, s]: any) => s.short_code === formData.billingState)?.[0] || formData.billingState
                            : formData.billingState
                        }
                        disabled
                        className="h-12 bg-slate-50/50 border-slate-200 rounded-xl text-slate-800 font-medium"
                      />
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                  ) : (
                    <Select
                      key={`service-state-${serviceAddressStates.length}`}
                      onValueChange={(val) => {
                        setFormData({ ...formData, serviceState: val, serviceCity: "" });
                        clearError("serviceState");
                      }}
                      value={formData.serviceState}
                      disabled={!formData.serviceCountry}
                    >
                      <SelectTrigger className={getSelectTriggerClassName(errors.serviceState)}>
                        <SelectValue placeholder="Select State" />
                      </SelectTrigger>
                      <SelectContent>
                        {serviceAddressStates.map((s) => (
                          <SelectItem key={s.isoCode} value={s.isoCode}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {errors.serviceState && <p className="text-red-500 text-[10px] mt-1 font-medium ml-1">{errors.serviceState}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">City</label>
                  {formData.sameAsBilling ? (
                    <div className="relative">
                      <Input
                        value={formData.billingCity}
                        disabled
                        className="h-12 bg-slate-50/50 border-slate-200 rounded-xl text-slate-800 font-medium"
                      />
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                  ) : (
                    <Select
                      key={`service-city-${serviceAddressCities.length}`}
                      onValueChange={(val) => {
                        setFormData({ ...formData, serviceCity: val });
                        clearError("serviceCity");
                      }}
                      value={formData.serviceCity}
                      disabled={!formData.serviceState}
                    >
                      <SelectTrigger className={getSelectTriggerClassName(errors.serviceCity)}>
                        <SelectValue placeholder="Select City" />
                      </SelectTrigger>
                      <SelectContent>
                        {serviceAddressCities.map((c) => (
                          <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {errors.serviceCity && <p className="text-red-500 text-[10px] mt-1 font-medium ml-1">{errors.serviceCity}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">ZIP Code</label>
                  <Input
                    placeholder="ZIP Code"
                    maxLength={10}
                    value={formData.serviceZip}
                    disabled={formData.sameAsBilling}
                    onChange={(e) => {
                      setFormData({ ...formData, serviceZip: e.target.value.slice(0, 10) });
                      clearError("serviceZip");
                    }}
                    className={getInputClassName(errors.serviceZip)}
                  />
                  {errors.serviceZip && <p className="text-red-500 text-[10px] mt-1 font-medium ml-1">{errors.serviceZip}</p>}
                </div>
              </div>
            </div>

            <div className="flex justify-center mt-8">
              <Button
                type="submit"
                disabled={isRegistering}
                className="cursor-pointer h-12 px-12 bg-[#0064cb] hover:bg-[#0052ae] text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-70 text-base"
              >
                {isRegistering ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Registering...</span>
                  </div>
                ) : "Register Customer"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
