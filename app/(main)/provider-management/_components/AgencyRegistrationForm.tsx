"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  ArrowLeft,
  ChevronRight,
  Mail,
  ChevronDown,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { GooglePlacesAutocomplete } from "@/components/ui/GooglePlacesAutocomplete";
import {
  clientCreatePersonnelProfileAction,
  CreatePersonnelProfilePayload,
} from "@/lib/client-actions";

function countWords(str?: string): number {
  if (!str || !str.trim()) return 0;
  return str.trim().split(/\s+/).filter(Boolean).length;
}

// Exactly matching countries list from Register New Guard (personal-info-section.tsx)
const COUNTRIES = [
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
  { name: "Venezuela", code: "ve", dialCode: "+58" },
];

interface AgencyRegistrationFormProps {
  onBack: () => void;
  onSuccess?: () => void;
  type?: "agency" | "agent" | "fastguard";
}

export function AgencyRegistrationForm({
  onBack,
  onSuccess,
  type = "agency",
}: AgencyRegistrationFormProps) {
  const isAgent = type === "agent";
  const entityLabel = isAgent ? "Agent" : "Agency";

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Phone flag dropdown state matching Register New Guard
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[11]); // Default to United States (+1)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [street, setStreet] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("United States");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");

  // Required field errors: Agency Name, Email, Country, State, City
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    country?: string;
    state?: string;
    city?: string;
  }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: {
      name?: string;
      email?: string;
      country?: string;
      state?: string;
      city?: string;
    } = {};

    // 1. Agency Name (Required)
    if (!name.trim()) {
      newErrors.name = `${entityLabel} Name is required`;
    }

    // 2. Email Address (Required)
    if (!email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    // 3. Country (Required)
    if (!country.trim()) {
      newErrors.country = "Country is required";
    }

    // 4. State (Required)
    if (!state.trim()) {
      newErrors.state = "State is required";
    }

    // 5. City (Required)
    if (!city.trim()) {
      newErrors.city = "City is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fill in all required fields properly");
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      let formattedPhone = phoneNumber.trim();
      if (formattedPhone) {
        formattedPhone = `${selectedCountry.dialCode}${formattedPhone}`;
      }

      const payload: CreatePersonnelProfilePayload = {
        profile_type: type,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: formattedPhone || undefined,
        address: {
          street: street.trim() || undefined,
          zip: zip.trim() || undefined,
          city: city.trim(),
          state: state.trim(),
          country: country.trim(),
        },
        notes: notes.trim() || undefined,
      };

      const res = await clientCreatePersonnelProfileAction(payload);

      if (res.success) {
        toast.success(res.message || `${entityLabel} created successfully!`);
        if (onSuccess) {
          onSuccess();
        } else {
          onBack();
        }
      } else {
        toast.error(res.error || `Failed to create ${entityLabel.toLowerCase()}`);
      }
    } catch (err: any) {
      console.error(`Error creating ${type}:`, err);
      toast.error(err?.message || `An error occurred while creating ${entityLabel.toLowerCase()}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto animate-in fade-in duration-300">
      {/* Top Breadcrumb & Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-slate-700 text-[13px] mb-1">
          <Link href="/dashboard" className="hover:text-[#0064cb] transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-700">Provider Management</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <button
            type="button"
            onClick={onBack}
            className="text-slate-700 hover:text-[#0064cb] transition-colors cursor-pointer"
          >
            {isAgent ? "Agents" : "Agencies"}
          </button>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-600 font-medium">Add New {entityLabel}</span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="p-2 bg-white rounded-lg border border-slate-200 text-slate-700 hover:text-[#0064cb] transition-all cursor-pointer shadow-sm hover:shadow"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Register New {entityLabel}
              </h1>
              <p className="text-xs text-slate-700 mt-0.5">
                Create a new {entityLabel.toLowerCase()} profile to manage assigned security guards.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="cursor-pointer border-slate-200 text-slate-700 hover:bg-slate-100 rounded-md hidden sm:flex items-center gap-2 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to {isAgent ? "Agents List" : "Agencies List"}</span>
          </Button>
        </div>
      </div>

      {/* Single Card Form */}
      <form onSubmit={handleSubmit}>
        <Card className="border border-slate-100 shadow-xl rounded-2xl overflow-hidden bg-white">
          <CardHeader className="p-5 sm:p-6 pb-5 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0064cb] flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-slate-800">
                  {entityLabel} Registration Form
                </CardTitle>
                <CardDescription className="text-xs text-slate-600 mt-0.5">
                  Complete the details below to register a new {entityLabel.toLowerCase()} profile.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5 sm:p-7 space-y-6">
            {/* ROW 1: Agency Name & Email & Phone No. in the SAME ROW */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Agency Name (Required) */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  {entityLabel} Name <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="e.g. Metro Protection Services"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  className={cn(
                    "h-11 bg-white border-slate-200 rounded-md text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0064cb] focus:ring-2 focus:ring-[#0064cb]/20 focus-visible:ring-offset-0",
                    errors.name && "border-red-500 focus-visible:ring-red-500"
                  )}
                />
                {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name}</p>}
              </div>

              {/* Email Address (Required) */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="email"
                    placeholder="contact@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    className={cn(
                      "h-11 pl-9 bg-white border-slate-200 rounded-md text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0064cb] focus:ring-2 focus:ring-[#0064cb]/20 focus-visible:ring-offset-0",
                      errors.email && "border-red-500 focus-visible:ring-red-500"
                    )}
                  />
                </div>
                {errors.email && <p className="text-xs text-red-500 font-medium">{errors.email}</p>}
              </div>

              {/* Phone Number with Flag Dropdown (Optional, exact Register New Guard style) */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Phone Number
                </label>
                <div className="relative flex items-center h-11 bg-white border border-slate-200 rounded-md focus-within:ring-2 focus-within:ring-[#0064cb]/20 focus-within:border-[#0064cb] transition-all">
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-1.5 px-3 h-full rounded-l-md hover:bg-slate-50 border-r border-slate-200 transition-colors focus:outline-none cursor-pointer bg-slate-50/50"
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
                    <input
                      type="text"
                      placeholder="Enter phone number"
                      value={phoneNumber}
                      maxLength={15}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                      className="w-full h-full bg-white outline-none border-none pl-3 pr-3 text-slate-800 font-medium placeholder-slate-400 text-sm rounded-r-md"
                    />
                  </div>
                  {isDropdownOpen && (
                    <div className="fixed inset-0 z-40 cursor-default" onClick={() => setIsDropdownOpen(false)} />
                  )}
                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-[260px] max-h-[220px] overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl z-50">
                      {COUNTRIES.map((c: any) => (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => {
                            setSelectedCountry(c);
                            setIsDropdownOpen(false);
                          }}
                          className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                        >
                          <img
                            src={`https://flagcdn.com/w20/${c.code}.png`}
                            alt={c.name}
                            className="w-5 h-3.5 object-cover rounded-sm"
                          />
                          <span className="text-sm font-medium text-slate-700 flex-1">{c.name}</span>
                          <span className="text-xs font-bold text-slate-500">{c.dialCode}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ROW 2: Street Address & Zip Code in the SAME ROW */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* Street Address with Google Places Autocomplete */}
              <div className="space-y-1.5 md:col-span-8">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Street Address
                </label>
                <GooglePlacesAutocomplete
                  value={street}
                  onChange={setStreet}
                  onAddressSelect={(address) => {
                    if (address.street) setStreet(address.street);
                    if (address.city) {
                      setCity(address.city);
                      if (errors.city) setErrors((prev) => ({ ...prev, city: undefined }));
                    }
                    if (address.state) {
                      setState(address.state);
                      if (errors.state) setErrors((prev) => ({ ...prev, state: undefined }));
                    }
                    if (address.zip) {
                      const cleanZip = address.zip.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10);
                      setZip(cleanZip);
                    }
                    if (address.country) {
                      setCountry(address.country);
                      if (errors.country) setErrors((prev) => ({ ...prev, country: undefined }));
                    }
                  }}
                  placeholder="Enter street address"
                  className="h-11 bg-white border-slate-200 rounded-md text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0064cb] focus:ring-2 focus:ring-[#0064cb]/20 focus-visible:ring-offset-0"
                />
              </div>

              {/* Zip Code: Alphanumeric up to 10 chars, no special chars, no negative values */}
              <div className="space-y-1.5 md:col-span-4">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Zip Code
                </label>
                <Input
                  placeholder="e.g. 33101"
                  value={zip}
                  maxLength={10}
                  onChange={(e) => {
                    // Disallow special characters and negative values, allow integers and strings up to 10 chars
                    const sanitized = e.target.value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10);
                    setZip(sanitized);
                  }}
                  className="h-11 bg-white border-slate-200 rounded-md text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0064cb] focus:ring-2 focus:ring-[#0064cb]/20 focus-visible:ring-offset-0"
                />
              </div>
            </div>

            {/* ROW 3: Country, State & City in the SAME ROW (INPUT FIELDS ONLY) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Country (Required, Input field only) */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Country <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="e.g. United States"
                  value={country}
                  onChange={(e) => {
                    setCountry(e.target.value);
                    if (errors.country) setErrors((prev) => ({ ...prev, country: undefined }));
                  }}
                  className={cn(
                    "h-11 bg-white border-slate-200 rounded-md text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0064cb] focus:ring-2 focus:ring-[#0064cb]/20 focus-visible:ring-offset-0",
                    errors.country && "border-red-500 focus-visible:ring-red-500"
                  )}
                />
                {errors.country && <p className="text-xs text-red-500 font-medium">{errors.country}</p>}
              </div>

              {/* State (Required, Input field only) */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  State <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="e.g. Florida"
                  value={state}
                  onChange={(e) => {
                    setState(e.target.value);
                    if (errors.state) setErrors((prev) => ({ ...prev, state: undefined }));
                  }}
                  className={cn(
                    "h-11 bg-white border-slate-200 rounded-md text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0064cb] focus:ring-2 focus:ring-[#0064cb]/20 focus-visible:ring-offset-0",
                    errors.state && "border-red-500 focus-visible:ring-red-500"
                  )}
                />
                {errors.state && <p className="text-xs text-red-500 font-medium">{errors.state}</p>}
              </div>

              {/* City (Required, Input field only) */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  City <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="e.g. Miami"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    if (errors.city) setErrors((prev) => ({ ...prev, city: undefined }));
                  }}
                  className={cn(
                    "h-11 bg-white border-slate-200 rounded-md text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0064cb] focus:ring-2 focus:ring-[#0064cb]/20 focus-visible:ring-offset-0",
                    errors.city && "border-red-500 focus-visible:ring-red-500"
                  )}
                />
                {errors.city && <p className="text-xs text-red-500 font-medium">{errors.city}</p>}
              </div>
            </div>

            {/* ROW 4: Notes & Details (Optional) - Dedicated Textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Notes & Details (Optional)
                </label>
                <span
                  className={cn(
                    "text-[11px] font-medium transition-colors",
                    countWords(notes) >= 500 ? "text-amber-600 font-bold" : "text-slate-400"
                  )}
                >
                  {countWords(notes)} / 500 words
                </span>
              </div>
              <textarea
                placeholder="Enter any additional notes or details regarding operations, coverage, contracts, or contacts for this agency..."
                value={notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                  const val = e.target.value;
                  const words = val.trim().split(/\s+/).filter(Boolean);
                  if (words.length > 500) {
                    const truncated = words.slice(0, 500).join(" ");
                    setNotes(truncated);
                    toast.warning("Notes & Details cannot exceed 500 words");
                    return;
                  }
                  setNotes(val);
                }}
                rows={4}
                className="w-full min-h-[110px] p-3.5 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0064cb] focus:ring-2 focus:ring-[#0064cb]/20 transition-all resize-y shadow-xs"
              />
            </div>
          </CardContent>

          {/* Card Footer Actions */}
          <div className="p-5 sm:p-6 bg-slate-50/70 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={isSubmitting}
              className="h-11 px-6 border-slate-200 text-slate-700 hover:bg-slate-100 rounded-md font-semibold text-xs cursor-pointer shadow-sm"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-11 px-8 bg-[#0064cb] hover:bg-[#0052ae] text-white rounded-md font-bold text-xs shadow-lg shadow-blue-200 transition-all active:scale-95 cursor-pointer flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving {entityLabel}...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save {entityLabel}</span>
                </>
              )}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
