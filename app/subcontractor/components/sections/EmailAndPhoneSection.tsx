"use client";

import React, { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { ChevronDown, Phone, CheckCircle2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { CustomInput } from "../CustomInput";
import { verifySubcontractorApplicationAction } from "@/actions/subcontractor.actions";
import { FormValues } from "../SubcontractorForm";

const phoneCountries = [
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

export function EmailAndPhoneSection() {
  const { register, watch, setValue, setError, clearErrors, formState: { errors } } = useFormContext<FormValues>();

  const [selectedPhoneCountry, setSelectedPhoneCountry] = useState(phoneCountries[11]); // Default to US
  const [isPhoneDropdownOpen, setIsPhoneDropdownOpen] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);

  const guardEmail = watch("email");
  const phoneValue = watch("phone");

  useEffect(() => {
    if (!guardEmail) {
      setIsEmailVerified(false);
      return;
    }
    const timeoutId = setTimeout(async () => {
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guardEmail)) {
        const res = await verifySubcontractorApplicationAction(guardEmail, "");
        if (!res.success) {
          setError("email", { type: "manual", message: res.error || "Email already exists" });
          setIsEmailVerified(false);
        } else {
          clearErrors("email");
          setIsEmailVerified(true);
        }
      }
    }, 800);
    return () => clearTimeout(timeoutId);
  }, [guardEmail, setError, clearErrors]);

  useEffect(() => {
    if (!phoneValue) {
      setIsPhoneVerified(false);
      return;
    }
    const timeoutId = setTimeout(async () => {
      if (phoneValue.length >= 10) {
        const res = await verifySubcontractorApplicationAction("", phoneValue);
        if (!res.success) {
          setError("phone", { type: "manual", message: res.error || "Phone already exists" });
          setIsPhoneVerified(false);
        } else {
          clearErrors("phone");
          setIsPhoneVerified(true);
        }
      }
    }, 800);
    return () => clearTimeout(timeoutId);
  }, [phoneValue, setError, clearErrors]);

  return (
    <>
      <div className="space-y-1">
        <Label htmlFor="email" className="text-red-500 font-medium">Email*</Label>
        <CustomInput
          id="email"
          type="email"
          placeholder="Enter your email"
          {...register("email")}
        />
        {errors.email ? (
          <p className="text-xs text-red-500">{errors.email.message}</p>
        ) : isEmailVerified ? (
          <p className="text-xs text-green-600 flex items-center font-medium mt-1"><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Verified</p>
        ) : null}
      </div>

      <div className="space-y-1 relative">
        <Label className="text-slate-700 font-medium">Cell Phone<span className="text-red-500">*</span></Label>
        <div className="relative flex items-center h-10 bg-surface border border-border rounded-sm focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-background transition-all">
          <button
            type="button"
            onClick={() => setIsPhoneDropdownOpen(!isPhoneDropdownOpen)}
            className="flex items-center gap-1.5 px-3 h-full rounded-l-sm hover:bg-slate-100 dark:hover:bg-slate-800 border-r border-border transition-colors focus:outline-none cursor-pointer"
          >
            <img
              src={`https://flagcdn.com/w20/${selectedPhoneCountry.code}.png`}
              alt={selectedPhoneCountry.name}
              className="w-5 h-3.5 object-cover rounded-sm shadow-sm"
            />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{selectedPhoneCountry.dialCode}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>

          <div className="relative flex-1 h-full flex items-center">
            <Phone className="absolute left-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Enter phone number"
              {...register("phone", {
                onChange: (e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 15);
                  e.target.value = digits;
                  setIsPhoneVerified(false);
                }
              })}
              className="w-full h-full bg-transparent outline-none border-none pl-9 pr-3 text-slate-900 dark:text-slate-100 font-medium placeholder:text-muted-foreground placeholder:font-normal text-sm"
            />
          </div>

          {isPhoneDropdownOpen && (
            <div
              className="fixed inset-0 z-40 cursor-default"
              onClick={() => setIsPhoneDropdownOpen(false)}
            />
          )}

          {isPhoneDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-[260px] max-h-[220px] overflow-y-auto bg-popover border border-border rounded-sm shadow-md z-50 animate-in fade-in duration-100">
              {phoneCountries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => {
                    setSelectedPhoneCountry(country);
                    setValue("phoneCode", country.dialCode);
                    setIsPhoneDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer ${selectedPhoneCountry.code === country.code ? "bg-accent text-accent-foreground font-semibold" : "text-popover-foreground"}`}
                >
                  <img
                    src={`https://flagcdn.com/w20/${country.code}.png`}
                    alt={country.name}
                    className="w-5 h-3.5 object-cover rounded-sm shadow-sm"
                  />
                  <span className="flex-1 truncate font-medium">{country.name}</span>
                  <span className="text-muted-foreground text-xs font-semibold">{country.dialCode}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        {errors.phone ? (
          <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>
        ) : isPhoneVerified ? (
          <p className="text-xs text-green-600 flex items-center font-medium mt-1"><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Verified</p>
        ) : null}
      </div>
    </>
  );
}
