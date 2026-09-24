"use client";

import { useState } from "react";
import { registerStaffAction } from "@/actions/auth.actions";
import { toast } from "sonner";
import {
  UserPlus,
  Mail,
  Phone,
  Lock,
  ArrowLeft,
  Eye,
  EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { Country } from "country-state-city";

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

export function MemberRegistrationForm({ onBack }: { onBack: () => void }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<any>({ name: "United States", code: "US", dialCode: "+1" });
  
  const countryOptions = Country.getAllCountries().filter((c: any) => Object.keys(ALLOWED_COUNTRIES).includes(c.isoCode));

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    role: "member"
  });

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

    if (!formData.firstName) newErrors.firstName = "First name is required";
    if (!formData.lastName) newErrors.lastName = "Last name is required";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = "Email address is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    if (formData.phone) {
      const digitCount = formData.phone.replace(/\D/g, "").length;
      if (digitCount < 7 || digitCount > 15) {
        newErrors.phone = "Phone number must be between 7 and 15 digits";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fill all the required fields");
      return;
    }

    setErrors({});
    setIsRegistering(true);

    const res = await registerStaffAction({
      email: formData.email,
      password: formData.password,
      first_name: formData.firstName,
      last_name: formData.lastName,
      phone_number: formData.phone ? `${selectedCountry.dialCode}${formData.phone}` : "",
      role: formData.role
    });

    if (res.success) {
      toast.success("Staff registered successfully");
      setFormData({ firstName: "", lastName: "", email: "", phone: "", password: "", role: "member" });
      setShowPassword(false);
      onBack();
    } else {
      toast.error(res.error || "Registration failed");
    }
    setIsRegistering(false);
  };

  const getInputClassName = (error?: string, hasLeftIcon?: boolean, hasRightIcon?: boolean) => {
    return cn(
      "h-12 bg-slate-50/50 rounded-xl transition-all text-slate-800 font-medium",
      hasLeftIcon ? "pl-11" : "",
      hasRightIcon ? "pr-11" : "",
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
          Register New Staff Member
        </h2>
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="cursor-pointer border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Staff Member List
        </Button>
      </div>

      <Card className="border-none shadow-xl rounded-2xl overflow-visible bg-white !gap-0 !py-0">
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleRegister} className="space-y-6" noValidate>
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-700 border-b pb-2">Member Information</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">First Name</label>
                  <Input
                    placeholder="Enter first name"
                    value={formData.firstName}
                    onChange={(e) => {
                      setFormData({ ...formData, firstName: e.target.value.replace(/\d/g, "") });
                      clearError("firstName");
                    }}
                    className={getInputClassName(errors.firstName)}
                  />
                  {errors.firstName && <p className="text-red-500 text-[10px] mt-1 font-medium ml-1">{errors.firstName}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">Last Name</label>
                  <Input
                    placeholder="Enter last name"
                    value={formData.lastName}
                    onChange={(e) => {
                      setFormData({ ...formData, lastName: e.target.value.replace(/\d/g, "") });
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
                  <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1 flex justify-between items-center">
                    <span>Phone Number</span>
                    <span className="text-[10px] lowercase text-slate-500 font-normal">(Optional)</span>
                  </label>
                  <div className={`relative flex items-center h-12 bg-slate-50/50 rounded-xl transition-all border ${errors.phone ? "border-red-500 ring-1 ring-red-500" : "border-slate-200 focus-within:ring-2 focus-within:ring-[#0064cb]/10 focus-within:border-[#0064cb]"}`}>
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="flex items-center gap-1.5 px-4 h-full rounded-l-xl hover:bg-slate-100/50 border-r border-slate-200/80 transition-colors focus:outline-none cursor-pointer"
                    >
                      <img
                        src={`https://flagcdn.com/w20/${selectedCountry.code.toLowerCase()}.png`}
                        alt={selectedCountry.name}
                        className="w-5 h-3.5 object-cover rounded-sm shadow-sm"
                      />
                      <span className="text-sm font-semibold text-slate-700">{selectedCountry.dialCode}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                    <div className="relative flex-1 h-full flex items-center">
                      <input
                        type="text"
                        placeholder="Enter phone number"
                        value={formData.phone}
                        maxLength={15}
                        onChange={(e) => {
                          setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "") });
                          clearError("phone");
                        }}
                        className="w-full h-full bg-transparent outline-none border-none px-3 text-slate-800 font-medium placeholder:text-slate-500 text-sm placeholder:font-normal"
                      />
                    </div>
                    {isDropdownOpen && (
                      <div className="fixed inset-0 z-40 cursor-default" onClick={() => setIsDropdownOpen(false)} />
                    )}
                    {isDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 w-[260px] max-h-[220px] overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl z-50">
                        {countryOptions.map((country: any) => (
                          <button
                            key={country.isoCode}
                            type="button"
                            onClick={() => {
                              setSelectedCountry({ name: country.name, code: country.isoCode, dialCode: country.phonecode.startsWith('+') ? country.phonecode : `+${country.phonecode}` });
                              setIsDropdownOpen(false);
                            }}
                            className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                          >
                            <img src={`https://flagcdn.com/w20/${country.isoCode.toLowerCase()}.png`} alt={country.name} className="w-5 h-3.5 object-cover rounded-sm border border-slate-100" />
                            <span className="text-sm font-medium text-slate-700 flex-1">{country.name}</span>
                            <span className="text-xs font-bold text-slate-500">{country.phonecode.startsWith('+') ? country.phonecode : `+${country.phonecode}`}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {errors.phone && <p className="text-red-500 text-[10px] mt-1 font-medium ml-1">{errors.phone}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">Access Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      value={formData.password}
                      onChange={(e) => {
                        setFormData({ ...formData, password: e.target.value.replace(/\s/g, "") });
                        clearError("password");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === " ") e.preventDefault();
                      }}
                      className={getInputClassName(errors.password, true, true)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-[10px] mt-1 font-medium ml-1">{errors.password}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">Select Role</label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => {
                      setFormData({ ...formData, role: value });
                      clearError("role");
                    }}
                  >
                    <SelectTrigger className={cn(getInputClassName(errors.role), "w-full !h-12 px-4")}>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
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
                ) : "Register Staff"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
