"use client";

import { clientFetchCustomersAction } from "@/lib/client-actions";
import { useState, useEffect } from "react";
import {
  UserPlus,
  Mail,
  Phone,
  Search,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  User,
  Building,
  MapPin,
  Users
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { toast } from "sonner";
import { registerCustomerAction } from "@/actions/auth.actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Country, State, City } from "country-state-city";
import { US_STATE_CITY_DATA } from "@/app/subcontractor/components/StaticData";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/table/pagination";
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

export default function CustomerDirectoryPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(countries[11]); // Default to United States
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [formData, setFormData] = useState({
    companyName: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
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

  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  const [billingAddressStates, setBillingAddressStates] = useState<any[]>([]);
  const [billingAddressCities, setBillingAddressCities] = useState<any[]>([]);
  
  const [serviceAddressStates, setServiceAddressStates] = useState<any[]>([]);
  const [serviceAddressCities, setServiceAddressCities] = useState<any[]>([]);

  // Billing address effects
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
      const stateData = Object.values(US_STATE_CITY_DATA).find(s => s.short_code === formData.billingState);
      if (stateData) {
        const usCities = stateData.cities.map(city => ({ name: city }));
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

  // Service address effects
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
      const stateData = Object.values(US_STATE_CITY_DATA).find(s => s.short_code === formData.serviceState);
      if (stateData) {
        const usCities = stateData.cities.map(city => ({ name: city }));
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

  // Handle same as billing
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

  // Debounced search query implementation
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadCustomers(1);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const loadCustomers = async (page: number = 1) => {
    setIsLoading(true);
    const res = await clientFetchCustomersAction({
      page,
      search: searchQuery
    });
    if (res.success) {
      setCustomers(res.data);
      setPagination(res.pagination);
      setCurrentPage(page);
    } else {
      toast.error(res.error || "Failed to load customers");
    }
    setIsLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const isServiceComplete = formData.sameAsBilling ? true : (formData.serviceCity && formData.serviceState && formData.serviceCountry);

    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.companyName ||
      !formData.billingCity ||
      !formData.billingState ||
      !formData.billingCountry ||
      !isServiceComplete
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (formData.phone) {
      const digitCount = formData.phone.replace(/\D/g, "").length;
      if (digitCount < 7 || digitCount > 15) {
        toast.error("Phone number must be between 7 and 15 digits");
        return;
      }
    }

    setIsRegistering(true);
    const res = await registerCustomerAction({
      company_name: formData.companyName,
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email,
      phone_number: formData.phone ? `${selectedCountry.dialCode}${formData.phone}` : "",
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
      loadCustomers(1);
    } else {
      toast.error(res.error || "Customer registration failed");
    }
    setIsRegistering(false);
  };

  return (
    <div className="p-0 sm:p-4 md:p-6 max-w-[1500px] mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Breadcrumbs & Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-slate-700 text-[13px] mb-1">
          <Link href="/dashboard" className="hover:text-[#0064cb] transition-colors">Dashboard</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-700">Users Directory</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-600 font-medium">Customers</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 bg-white rounded-lg border border-slate-200 text-slate-700 hover:text-[#0064cb] transition-all">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Customers Directory</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Registration Form */}
        <div className="lg:col-span-5">
          <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-white !gap-0 !py-0">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0064cb]/10 flex items-center justify-center text-[#0064cb]">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-slate-800">Register New Customer</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <form onSubmit={handleRegister} className="space-y-6">
                
                {/* General Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-700 border-b pb-2">General Information</h3>
                  
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">Company Name</label>
                    <div className="relative">
                      <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700 z-10 pointer-events-none" />
                      <Input
                        placeholder="Company name"
                        required
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        className="h-12 pl-11 bg-slate-50/50 border-slate-200 rounded-xl focus:ring-[#0064cb]/10 focus:border-[#0064cb] transition-all text-slate-800 font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">First Name</label>
                      <Input
                        placeholder="First name"
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="h-12 bg-slate-50/50 border-slate-200 rounded-xl focus:ring-[#0064cb]/10 focus:border-[#0064cb] transition-all text-slate-800 font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">Last Name</label>
                      <Input
                        placeholder="Last name"
                        required
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="h-12 bg-slate-50/50 border-slate-200 rounded-xl focus:ring-[#0064cb]/10 focus:border-[#0064cb] transition-all text-slate-800 font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700" />
                      <Input
                        type="email"
                        placeholder="Enter email address"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="h-12 pl-11 bg-slate-50/50 border-slate-200 rounded-xl focus:ring-[#0064cb]/10 focus:border-[#0064cb] transition-all text-slate-800 font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">Phone Number</label>
                    <div className="relative flex items-center h-12 bg-slate-50/50 border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-[#0064cb]/10 focus-within:border-[#0064cb] transition-all">
                      <button
                        type="button"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-1.5 px-3 h-full rounded-l-xl hover:bg-slate-100/50 border-r border-slate-200/80 transition-colors focus:outline-none cursor-pointer"
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
                              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-slate-50 transition-colors cursor-pointer ${
                                selectedCountry.code === country.code ? "bg-blue-50/30 font-semibold text-[#0064cb]" : "text-slate-700"
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
                  </div>
                </div>

                {/* Billing Address */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-700 border-b pb-2">Billing Address</h3>
                  
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">Street Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700 z-10 pointer-events-none" />
                      <Input
                        placeholder="Enter street address"
                        value={formData.billingStreet}
                        required
                        onChange={(e) => setFormData({ ...formData, billingStreet: e.target.value, billingAddress: e.target.value })}
                        className="h-12 pl-11 bg-slate-50/50 border-slate-200 rounded-xl focus:ring-[#0064cb]/10 focus:border-[#0064cb] transition-all text-slate-800 font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">Country</label>
                      <Select 
                        onValueChange={(val) => setFormData({ ...formData, billingCountry: val, billingState: "", billingCity: "" })} 
                        value={formData.billingCountry}
                      >
                        <SelectTrigger className="!h-12 bg-slate-50/50 border-slate-200 rounded-xl focus:ring-[#0064cb]/10 focus:border-[#0064cb] transition-all text-slate-800 font-medium">
                          <SelectValue placeholder="Select Country" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(ALLOWED_COUNTRIES).map(([code, name]) => (
                            <SelectItem key={code} value={code}>{name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">State</label>
                      <Select 
                        key={`billing-state-${billingAddressStates.length}`}
                        onValueChange={(val) => setFormData({ ...formData, billingState: val, billingCity: "" })} 
                        value={formData.billingState}
                        disabled={!formData.billingCountry}
                      >
                        <SelectTrigger className="!h-12 bg-slate-50/50 border-slate-200 rounded-xl focus:ring-[#0064cb]/10 focus:border-[#0064cb] transition-all text-slate-800 font-medium">
                          <SelectValue placeholder="Select State" />
                        </SelectTrigger>
                        <SelectContent>
                          {billingAddressStates.map((s) => (
                            <SelectItem key={s.isoCode} value={s.isoCode}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">City</label>
                      <Select 
                        key={`billing-city-${billingAddressCities.length}`}
                        onValueChange={(val) => setFormData({ ...formData, billingCity: val })} 
                        value={formData.billingCity}
                        disabled={!formData.billingState}
                      >
                        <SelectTrigger className="!h-12 bg-slate-50/50 border-slate-200 rounded-xl focus:ring-[#0064cb]/10 focus:border-[#0064cb] transition-all text-slate-800 font-medium">
                          <SelectValue placeholder="Select City" />
                        </SelectTrigger>
                        <SelectContent>
                          {billingAddressCities.map((c) => (
                            <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">ZIP Code</label>
                      <Input
                        placeholder="ZIP Code"
                        maxLength={10}
                        value={formData.billingZip}
                        onChange={(e) => setFormData({ ...formData, billingZip: e.target.value.slice(0, 10) })}
                        className="h-12 bg-slate-50/50 border-slate-200 rounded-xl focus:ring-[#0064cb]/10 focus:border-[#0064cb] transition-all text-slate-800 font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Service Address */}
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
                        required
                        disabled={formData.sameAsBilling}
                        onChange={(e) => setFormData({ ...formData, serviceStreet: e.target.value, serviceAddress: e.target.value })}
                        className="h-12 pl-11 bg-slate-50/50 border-slate-200 rounded-xl focus:ring-[#0064cb]/10 focus:border-[#0064cb] transition-all text-slate-800 font-medium"
                      />
                    </div>
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
                          onValueChange={(val) => setFormData({ ...formData, serviceCountry: val, serviceState: "", serviceCity: "" })} 
                          value={formData.serviceCountry}
                        >
                          <SelectTrigger className="!h-12 bg-slate-50/50 border-slate-200 rounded-xl focus:ring-[#0064cb]/10 focus:border-[#0064cb] transition-all text-slate-800 font-medium">
                            <SelectValue placeholder="Select Country" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(ALLOWED_COUNTRIES).map(([code, name]) => (
                              <SelectItem key={code} value={code}>{name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">State</label>
                      {formData.sameAsBilling ? (
                        <div className="relative">
                          <Input
                            value={
                              formData.billingCountry === "US" 
                                ? Object.entries(US_STATE_CITY_DATA).find(([_, s]) => s.short_code === formData.billingState)?.[0] || formData.billingState
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
                          onValueChange={(val) => setFormData({ ...formData, serviceState: val, serviceCity: "" })} 
                          value={formData.serviceState}
                          disabled={!formData.serviceCountry}
                        >
                          <SelectTrigger className="!h-12 bg-slate-50/50 border-slate-200 rounded-xl focus:ring-[#0064cb]/10 focus:border-[#0064cb] transition-all text-slate-800 font-medium">
                            <SelectValue placeholder="Select State" />
                          </SelectTrigger>
                          <SelectContent>
                            {serviceAddressStates.map((s) => (
                              <SelectItem key={s.isoCode} value={s.isoCode}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
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
                          onValueChange={(val) => setFormData({ ...formData, serviceCity: val })} 
                          value={formData.serviceCity}
                          disabled={!formData.serviceState}
                        >
                          <SelectTrigger className="!h-12 bg-slate-50/50 border-slate-200 rounded-xl focus:ring-[#0064cb]/10 focus:border-[#0064cb] transition-all text-slate-800 font-medium">
                            <SelectValue placeholder="Select City" />
                          </SelectTrigger>
                          <SelectContent>
                            {serviceAddressCities.map((c) => (
                              <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">ZIP Code</label>
                      <Input
                        placeholder="ZIP Code"
                        maxLength={10}
                        value={formData.serviceZip}
                        disabled={formData.sameAsBilling}
                        onChange={(e) => setFormData({ ...formData, serviceZip: e.target.value.slice(0, 10) })}
                        className="h-12 bg-slate-50/50 border-slate-200 rounded-xl focus:ring-[#0064cb]/10 focus:border-[#0064cb] transition-all text-slate-800 font-medium"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isRegistering}
                  className="cursor-pointer w-full h-12 bg-[#0064cb] hover:bg-[#0052ae] text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 mt-4 disabled:opacity-70"
                >
                  {isRegistering ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Registering...</span>
                    </div>
                  ) : "Register Customer"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Customer List */}
        <div className="lg:col-span-7">
          <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-white min-h-[600px] flex flex-col !gap-0 !py-0">
            <CardHeader className="p-4 sm:p-6 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                  <Users className="w-5 h-5 text-[#0064cb]" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-slate-800">Customers List</CardTitle>
                  <p className="text-xs text-slate-800 font-medium mt-0.5">
                    {pagination?.total || customers.length} Registered Customers
                  </p>
                </div>
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-[260px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700" />
                <Input
                  placeholder="Search company or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 pl-9 pr-4 bg-slate-50 border-slate-200 rounded-xl focus:ring-[#0064cb]/10 focus:border-[#0064cb] transition-all text-xs font-medium text-slate-800"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col min-h-0">
              <Table className="min-w-[800px]">
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-slate-100">
                    <TableHead className="py-4 px-6 text-[11px] font-bold text-slate-700 uppercase tracking-wider">Action</TableHead>
                    <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider">Company Name</TableHead>
                    <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider">Full Name</TableHead>
                    <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider">Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i} className="hover:bg-transparent border-slate-50">
                          <TableCell className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <Skeleton className="w-8 h-8 rounded-full bg-slate-100" />
                              <Skeleton className="h-4 w-24 bg-slate-100" />
                            </div>
                          </TableCell>
                          <TableCell className="py-4 px-4"><Skeleton className="h-4 w-24 bg-slate-100" /></TableCell>
                          <TableCell className="py-4 px-4"><Skeleton className="h-4 w-36 bg-slate-100" /></TableCell>
                        </TableRow>
                      ))
                    ) : customers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="h-96 text-center">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Users className="w-12 h-12 text-slate-200" />
                            <p className="text-sm font-medium text-slate-700">No customers found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      customers.map((customer) => (
                        <TableRow key={customer.id || customer.customer_id || Math.random()} className="group hover:bg-slate-50/50 border-slate-50 transition-colors">
                          <TableCell className="px-6 py-4">
                            <Link href={`/users-directory/customers/${customer.id || customer.customer_id}`}>
                              <Button variant="outline" size="sm" className="h-8 px-3 rounded-full text-xs font-semibold text-[#0064cb] border-[#0064cb]/20 hover:bg-[#0064cb]/5 hover:text-[#0052ae]">
                                View
                              </Button>
                            </Link>
                          </TableCell>
                          <TableCell className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                                <Building className="w-4 h-4" />
                              </div>
                              <span className="text-sm font-bold text-slate-700">
                                {customer.company_name || "---"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 px-4">
                             <span className="text-xs text-slate-800 font-medium">
                               {customer.first_name || "---"} {customer.last_name || ""}
                             </span>
                          </TableCell>
                          <TableCell className="py-4 px-4">
                            <span className="text-xs text-slate-800 font-medium">{customer.email}</span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
              </Table>
            </CardContent>
            {pagination && (
              <Pagination
                page={currentPage}
                totalPages={pagination.total_pages}
                totalItems={pagination.total}
                limit={pagination.limit}
                onPageChange={loadCustomers}
                isPending={isLoading}
              />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
