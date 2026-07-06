"use client";

import {
  clientFetchGuardsAction
} from "@/lib/client-actions";

import { useState, useEffect } from "react";
import {
  Shield,
  UserPlus,
  Mail,
  Phone,
  Trash2,
  Search,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  User,
  Loader2,
  MapPin,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { toast } from "sonner";
import { registerUserAction, registerGuardAction, deleteMemberAction } from "@/actions/auth.actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Country, State, City } from "country-state-city";
import { US_STATE_CITY_DATA } from "@/app/subcontractor/components/StaticData";
import Swal from "sweetalert2";
import { Skeleton } from "@/components/ui/skeleton";
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

export default function GuardDirectoryPage() {
  const [guards, setGuards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(countries[11]); // Default to United States
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    address: "",
    streetAddress: "",
    city: "",
    state: "",
    country: "",
    zipCode: "",
    armed: false,
    unarmed: false,
    license: false,
    licenseNumber: "",
    licenseExpirationDate: "",
    gender: "male"
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  const [addressStates, setAddressStates] = useState<any[]>([]);
  const [addressCities, setAddressCities] = useState<any[]>([]);

  useEffect(() => {
    if (formData.country === "US") {
      const usStates = Object.entries(US_STATE_CITY_DATA).map(([name, data]) => ({
        isoCode: data.short_code,
        name: name,
      }));
      setAddressStates(usStates);
    } else if (formData.country) {
      setAddressStates(State.getStatesOfCountry(formData.country));
    } else {
      setAddressStates([]);
    }
  }, [formData.country]);

  useEffect(() => {
    if (formData.country === "US" && formData.state) {
      const stateData = Object.values(US_STATE_CITY_DATA).find(s => s.short_code === formData.state);
      if (stateData) {
        const usCities = stateData.cities.map(city => ({ name: city }));
        setAddressCities(usCities);
      } else {
        setAddressCities([]);
      }
    } else if (formData.country && formData.state) {
      setAddressCities(City.getCitiesOfState(formData.country, formData.state));
    } else {
      setAddressCities([]);
    }
  }, [formData.state, formData.country]);

  // Debounced search query implementation
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadGuards(1); // Reset page to 1 on new search
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const loadGuards = async (page: number = 1) => {
    setIsLoading(true);
    const res = await clientFetchGuardsAction({
      page,
      search: searchQuery
    });
    if (res.success) {
      setGuards(res.data);
      setPagination(res.pagination);
      setCurrentPage(page);
    } else {
      toast.error(res.error || "Failed to load guards");
    }
    setIsLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !(formData.streetAddress || formData.address) ||
      !formData.city ||
      !formData.state ||
      !formData.country
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!formData.armed && !formData.unarmed) {
      toast.error("Please select at least one qualification (Armed or Unarmed)");
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
    const randomPassword = Math.random().toString(36).slice(-8) + "aB1!";
    const res = await registerGuardAction({
      email: formData.email,
      password: randomPassword,
      role: "guard",
      first_name: formData.firstName,
      last_name: formData.lastName,
      phone_number: formData.phone ? `${selectedCountry.dialCode}${formData.phone}` : "",
      street_address: formData.streetAddress || formData.address,
      city: formData.city,
      state: formData.state,
      country: formData.country,
      zip_code: formData.zipCode,
      latitude: 0,
      longitude: 0,
      license: formData.license,
      unarmed: formData.unarmed,
      armed: formData.armed,
      gender: formData.gender,
      license_number: formData.license ? (formData.licenseNumber || null) : null,
      license_expiration_date: formData.license ? (formData.licenseExpirationDate || null) : null,
      video_url: "",
      headshot_image_url: "",
      security_guard_license_url: "",
      driver_license_url: "",
      firewatch_certificate_url: "",
      resume_url: ""
    });

    if (res.success) {
      toast.success("Guard registered successfully");
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
        address: "",
        streetAddress: "",
        city: "",
        state: "",
        country: "",
        zipCode: "",
        armed: false,
        unarmed: false,
        license: false,
        licenseNumber: "",
        licenseExpirationDate: "",
        gender: "male"
      });
      setSelectedCountry(countries[11]);
      loadGuards(1);
    } else {
      toast.error(res.error || "Guard registration failed");
    }
    setIsRegistering(false);
  };

  const handleDelete = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `You are about to remove guard ${name} from the directory.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      width: "400px",
      padding: "2rem",
      buttonsStyling: false,
      customClass: {
        confirmButton: "bg-[#ef4444] hover:bg-[#dc2626] text-white font-bold py-3 px-6 rounded-xl transition-all mx-2 cursor-pointer",
        cancelButton: "bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 px-6 rounded-xl transition-all mx-2 cursor-pointer",
        popup: "rounded-[2rem] shadow-2xl border-none font-sans",
        title: "text-xl font-bold text-slate-800 !p-0 !m-0",
        htmlContainer: "text-slate-800 font-medium !p-0 !m-0 !mt-2",
        icon: "!mt-2 mb-2"
      }
    });

    if (result.isConfirmed) {
      const toastId = toast.loading("Deleting guard...");
      const res = await deleteMemberAction(id);

      if (res.success) {
        toast.success(res.message, { id: toastId });
        loadGuards(currentPage);
      } else {
        toast.error(res.error || "Failed to delete guard", { id: toastId });
      }
    }
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
          <span className="text-slate-600 font-medium">Guards</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 bg-white rounded-lg border border-slate-200 text-slate-700 hover:text-[#0064cb] transition-all">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Guards Directory</h1>
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
                  <CardTitle className="text-lg font-bold text-slate-800">Register New Guard</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">First Name</label>
                    <Input
                      placeholder="First name"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value.replace(/\d/g, "") })}
                      className="h-12 bg-slate-50/50 border-slate-200 rounded-xl focus:ring-[#0064cb]/10 focus:border-[#0064cb] transition-all text-slate-800 font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">Last Name</label>
                    <Input
                      placeholder="Last name"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value.replace(/\d/g, "") })}
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
                    {/* Country Code Trigger */}
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

                    {/* Phone Input */}
                    <div className="relative flex-1 h-full flex items-center">
                      <Phone className="absolute left-3 w-4 h-4 text-slate-700" />
                      <input
                        type="text"
                        placeholder="Enter phone number"
                        value={formData.phone}
                        onChange={(e) => {
                          // Allow only digits (no + or other characters)
                          const digits = e.target.value.replace(/\D/g, "").slice(0, 15);
                          setFormData({ ...formData, phone: digits });
                        }}
                        className="w-full h-full bg-transparent outline-none border-none pl-9 pr-3 text-slate-800 font-medium placeholder-slate-400 text-sm"
                      />
                    </div>

                    {/* Backdrop/Overlay for closing dropdown when clicking outside */}
                    {isDropdownOpen && (
                      <div 
                        className="fixed inset-0 z-40 cursor-default" 
                        onClick={() => setIsDropdownOpen(false)}
                      />
                    )}

                    {/* Country Dropdown list */}
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

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">Street Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700 z-10 pointer-events-none" />
                    <Input
                      placeholder="Enter street address"
                      value={formData.streetAddress}
                      required
                      onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value, address: e.target.value })}
                      className="h-12 pl-11 bg-slate-50/50 border-slate-200 rounded-xl focus:ring-[#0064cb]/10 focus:border-[#0064cb] transition-all text-slate-800 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">Country</label>
                    <Select 
                      onValueChange={(val) => setFormData({ ...formData, country: val, state: "", city: "" })} 
                      value={formData.country}
                    >
                      <SelectTrigger className="!h-12 bg-slate-50/50 border-slate-200 rounded-xl focus:ring-[#0064cb]/10 focus:border-[#0064cb] transition-all text-slate-800 font-medium">
                        <SelectValue placeholder="Select Country" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ALLOWED_COUNTRIES).map(([code, name]) => (
                          <SelectItem key={code} value={code}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">State</label>
                    <Select 
                      onValueChange={(val) => setFormData({ ...formData, state: val, city: "" })} 
                      value={formData.state}
                      disabled={!formData.country}
                    >
                      <SelectTrigger className="!h-12 bg-slate-50/50 border-slate-200 rounded-xl focus:ring-[#0064cb]/10 focus:border-[#0064cb] transition-all text-slate-800 font-medium">
                        <SelectValue placeholder="Select State" />
                      </SelectTrigger>
                      <SelectContent>
                        {addressStates.map((s) => (
                          <SelectItem key={s.isoCode} value={s.isoCode}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">City</label>
                    <Select 
                      onValueChange={(val) => setFormData({ ...formData, city: val })} 
                      value={formData.city}
                      disabled={!formData.state}
                    >
                      <SelectTrigger className="!h-12 bg-slate-50/50 border-slate-200 rounded-xl focus:ring-[#0064cb]/10 focus:border-[#0064cb] transition-all text-slate-800 font-medium">
                        <SelectValue placeholder="Select City" />
                      </SelectTrigger>
                      <SelectContent>
                        {addressCities.map((c) => (
                          <SelectItem key={c.name} value={c.name}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">ZIP Code</label>
                    <Input
                      placeholder="ZIP Code"
                      maxLength={10}
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value.slice(0, 10) })}
                      className="h-12 bg-slate-50/50 border-slate-200 rounded-xl focus:ring-[#0064cb]/10 focus:border-[#0064cb] transition-all text-slate-800 font-medium"
                    />
                  </div>
                </div>



                <div className="space-y-1 pt-1">
                  <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full h-12 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-[#0064cb]/10 focus:border-[#0064cb] text-slate-800 font-medium text-left px-4 cursor-pointer focus:outline-none appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748B%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22/%3E%3C/svg%3E')] bg-[length:12px_12px] bg-[position:right_16px_center] bg-no-repeat pr-10"
                  >
                    <option value="male" className="text-slate-800 bg-white">Male</option>
                    <option value="female" className="text-slate-800 bg-white">Female</option>
                    <option value="other" className="text-slate-800 bg-white">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">Service Qualifications</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className={cn(
                      "flex items-center gap-3 p-3 border rounded-xl transition-all bg-slate-50/50",
                      formData.unarmed ? "border-[#0064cb] bg-blue-50/20" : "border-slate-200 hover:bg-slate-100/50"
                    )}>
                      <input
                        type="checkbox"
                        id="qual-unarmed"
                        checked={formData.unarmed}
                        onChange={(e) => setFormData({ ...formData, unarmed: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-300 text-[#0064cb] focus:ring-[#0064cb] cursor-pointer"
                      />
                      <label htmlFor="qual-unarmed" className="text-sm font-semibold text-slate-800 cursor-pointer select-none flex-1">
                        Unarmed
                      </label>
                    </div>
                    <div className={cn(
                      "flex items-center gap-3 p-3 border rounded-xl transition-all bg-slate-50/50",
                      formData.armed ? "border-[#0064cb] bg-blue-50/20" : "border-slate-200 hover:bg-slate-100/50"
                    )}>
                      <input
                        type="checkbox"
                        id="qual-armed"
                        checked={formData.armed}
                        onChange={(e) => setFormData({ ...formData, armed: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-300 text-[#0064cb] focus:ring-[#0064cb] cursor-pointer"
                      />
                      <label htmlFor="qual-armed" className="text-sm font-semibold text-slate-800 cursor-pointer select-none flex-1">
                        Armed
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className={cn(
                    "flex items-center gap-3 p-3 border rounded-xl transition-all bg-slate-50/50",
                    formData.license ? "border-[#0064cb] bg-blue-50/20" : "border-slate-200 hover:bg-slate-100/50"
                  )}>
                    <input
                      type="checkbox"
                      id="qual-license"
                      checked={formData.license}
                      onChange={(e) => setFormData({ ...formData, license: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300 text-[#0064cb] focus:ring-[#0064cb] cursor-pointer"
                    />
                    <label htmlFor="qual-license" className="text-sm font-semibold text-slate-800 cursor-pointer select-none flex-1">
                      Has Security License
                    </label>
                  </div>
                </div>

                {formData.license && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">License Number</label>
                      <Input
                        placeholder="Enter license number"
                        value={formData.licenseNumber}
                        onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                        className="h-12 bg-slate-50/50 border-slate-200 rounded-xl focus:ring-[#0064cb]/10 focus:border-[#0064cb] transition-all text-slate-800 font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">Expiration Date</label>
                      <Input
                        type="date"
                        value={formData.licenseExpirationDate}
                        onChange={(e) => setFormData({ ...formData, licenseExpirationDate: e.target.value })}
                        className="h-12 bg-slate-50/50 border-slate-200 rounded-xl focus:ring-[#0064cb]/10 focus:border-[#0064cb] transition-all text-slate-800 font-medium cursor-pointer"
                      />
                    </div>
                  </div>
                )}

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
                  ) : "Register Guard"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Guard List */}
        <div className="lg:col-span-7">
          <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-white min-h-[600px] flex flex-col !gap-0 !py-0">
            <CardHeader className="p-4 sm:p-6 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                  <Shield className="w-5 h-5 text-[#0064cb]" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-slate-800">Guards List</CardTitle>
                  <p className="text-xs text-slate-800 font-medium mt-0.5">
                    {pagination?.total || guards.length} Registered Guards
                  </p>
                </div>
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-[260px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700" />
                <Input
                  placeholder="Search name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 pl-9 pr-4 bg-slate-50 border-slate-200 rounded-xl focus:ring-[#0064cb]/10 focus:border-[#0064cb] transition-all text-xs font-medium text-slate-800"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col">
              <div className="overflow-x-auto flex-1">
                <Table className="min-w-[800px]">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-slate-100">
                      <TableHead className="py-4 px-6 text-[11px] font-bold text-slate-700 uppercase tracking-wider">Name</TableHead>
                      <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider">Email</TableHead>
                      <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider">Phone</TableHead>
                      <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider text-center">Armed</TableHead>
                      <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider text-center">Unarmed</TableHead>
                      <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider">Address</TableHead>
                      <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider">Status</TableHead>
                      {/* <TableHead className="py-4 px-6 text-right text-[11px] font-bold text-slate-700 uppercase tracking-wider">Action</TableHead> */}
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
                          <TableCell className="py-4 px-4"><Skeleton className="h-4 w-36 bg-slate-100" /></TableCell>
                          <TableCell className="py-4 px-4"><Skeleton className="h-4 w-24 bg-slate-100" /></TableCell>
                          <TableCell className="py-4 px-4"><Skeleton className="h-4 w-8 mx-auto bg-slate-100" /></TableCell>
                          <TableCell className="py-4 px-4"><Skeleton className="h-4 w-8 mx-auto bg-slate-100" /></TableCell>
                          <TableCell className="py-4 px-4"><Skeleton className="h-4 w-32 bg-slate-100" /></TableCell>
                          <TableCell className="py-4 px-4"><Skeleton className="h-4 w-12 bg-slate-100" /></TableCell>
                          <TableCell className="px-6 py-4 text-right"><Skeleton className="w-8 h-8 rounded-lg ml-auto bg-slate-50" /></TableCell>
                        </TableRow>
                      ))
                    ) : guards.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-96 text-center">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Shield className="w-12 h-12 text-slate-200" />
                            <p className="text-sm font-medium text-slate-700">No guards found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      guards.map((guard) => (
                        <TableRow key={guard.guard_id} className="group hover:bg-slate-50/50 border-slate-50 transition-colors">
                          <TableCell className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                                <User className="w-4 h-4" />
                              </div>
                              <span className="text-sm font-bold text-slate-700">
                                {guard.first_name || "---"} {guard.last_name || "---"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 px-4">
                            <span className="text-xs text-slate-800 font-medium">{guard.email}</span>
                          </TableCell>
                          <TableCell className="py-4 px-4">
                            <span className="text-xs text-slate-800 font-medium">{guard.phone_number || "---"}</span>
                          </TableCell>
                          <TableCell className="py-4 px-4 text-center">
                            <span className={cn(
                              "text-xs font-bold",
                              guard.armed ? "text-emerald-600" : "text-slate-700"
                            )}>
                              {guard.armed ? "Yes" : "No"}
                            </span>
                          </TableCell>
                          <TableCell className="py-4 px-4 text-center">
                            <span className={cn(
                              "text-xs font-bold",
                              guard.unarmed ? "text-emerald-600" : "text-slate-700"
                            )}>
                              {guard.unarmed ? "Yes" : "No"}
                            </span>
                          </TableCell>
                          <TableCell className="py-4 px-4">
                            <span className="text-xs text-slate-800 font-medium block truncate max-w-[150px]" title={guard.address}>
                              {guard.address || "---"}
                            </span>
                          </TableCell>
                          <TableCell className="py-4 px-4">
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border",
                              guard.status
                                ? "bg-green-50 text-green-600 border-green-200"
                                : "bg-red-50 text-red-600 border-red-200"
                            )}>
                              {guard.status ? "Active" : "Inactive"}
                            </span>
                          </TableCell>
                          {/* <TableCell className="px-6 py-4 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(guard.guard_id, `${guard.first_name || "---"} ${guard.last_name || "---"}`)}
                              className="cursor-pointer w-8 h-8 rounded-lg text-red-500 hover:bg-red-50 transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell> */}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              {pagination && pagination.pages > 1 && (
                <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
                  <span className="text-xs text-slate-700 font-medium">
                    Showing Page {currentPage} of {pagination.pages} ({pagination.total} guards total)
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage <= 1}
                      onClick={() => loadGuards(currentPage - 1)}
                      className="cursor-pointer text-xs rounded-xl h-9"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage >= pagination.pages}
                      onClick={() => loadGuards(currentPage + 1)}
                      className="cursor-pointer text-xs rounded-xl h-9"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
