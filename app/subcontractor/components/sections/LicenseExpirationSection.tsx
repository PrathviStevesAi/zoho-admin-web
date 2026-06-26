"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { CustomInput } from "../CustomInput";
import { FormValues } from "../SubcontractorForm";

export function LicenseExpirationSection() {
  const { register, formState: { errors } } = useFormContext<FormValues>();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-1">
        <Label htmlFor="license_number" className="text-slate-700">Driving License Number<span className="text-red-500">*</span></Label>
        <CustomInput 
          id="license_number" 
          placeholder="Enter Driving license number" 
          maxLength={15}
          {...register("license_number", {
            onChange: (e) => {
              e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
            }
          })} 
        />
        {errors.license_number && <p className="text-xs text-red-500">{errors.license_number.message}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="expiration_date" className="text-slate-700">Expiration Date<span className="text-red-500">*</span></Label>
        <CustomInput id="expiration_date" type="date" min={new Date().toISOString().split('T')[0]} {...register("expiration_date")} />
        {errors.expiration_date && <p className="text-xs text-red-500">{errors.expiration_date.message}</p>}
      </div>
    </div>
  );
}
