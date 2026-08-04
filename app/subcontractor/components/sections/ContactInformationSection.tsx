"use client";

import React, { useEffect, useState } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { Country, State, City } from "country-state-city";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomInput } from "../CustomInput";
import { FormValues } from "../SubcontractorForm";
import { US_STATE_CITY_DATA } from "../StaticData";

const ALLOWED_COUNTRIES = ["US", "CA", "AR", "BO", "BR", "CL", "CO", "EC", "GY", "PY", "PE", "SR", "UY", "VE"];

export function ContactInformationSection() {
  const { register, control, watch, setValue, formState: { errors } } = useFormContext<FormValues>();

  const [countries, setCountries] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);

  const selectedCountry = watch("country");
  const selectedState = watch("state");

  useEffect(() => {
    const allCountries = Country.getAllCountries().filter(c => ALLOWED_COUNTRIES.includes(c.isoCode));
    setCountries(allCountries);
  }, []);

  useEffect(() => {
    if (selectedCountry === "US") {
      const usStates = Object.entries(US_STATE_CITY_DATA).map(([name, data]) => ({
        isoCode: data.short_code,
        name: name,
      }));
      setStates(usStates);
    } else if (selectedCountry) {
      setStates(State.getStatesOfCountry(selectedCountry));
    } else {
      setStates([]);
    }
  }, [selectedCountry]);

  useEffect(() => {
    if (selectedCountry === "US" && selectedState) {
      const stateData = Object.values(US_STATE_CITY_DATA).find(s => s.short_code === selectedState);
      if (stateData) {
        const usCities = stateData.cities.map(city => ({ name: city }));
        setCities(usCities);
      } else {
        setCities([]);
      }
    } else if (selectedCountry && selectedState) {
      setCities(City.getCitiesOfState(selectedCountry, selectedState));
    } else {
      setCities([]);
    }
  }, [selectedState, selectedCountry]);

  return (
    <Card className="shadow-none border-slate-200">
      <CardHeader className="pb-3 border-b border-slate-100">
        <CardTitle className="text-base font-bold text-slate-800">Contact Information</CardTitle>
      </CardHeader>
      <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-1">
          <Label className="text-slate-700 font-medium">First Name<span className="text-red-500">*</span></Label>
          <CustomInput 
            placeholder="Enter first name" 
            {...register("firstName", {
              onChange: (e) => {
                e.target.value = e.target.value.replace(/[^a-zA-Z\s\-']/g, '');
              }
            })} 
          />
          {errors.firstName && <p className="text-xs text-red-500">{errors.firstName.message}</p>}
        </div>
        <div className="space-y-1">
          <Label className="text-slate-700 font-medium">Last Name<span className="text-red-500">*</span></Label>
          <CustomInput 
            placeholder="Enter last name" 
            {...register("lastName", {
              onChange: (e) => {
                e.target.value = e.target.value.replace(/[^a-zA-Z\s\-']/g, '');
              }
            })} 
          />
          {errors.lastName && <p className="text-xs text-red-500">{errors.lastName.message}</p>}
        </div>
        <div className="space-y-1">
          <Label className="text-slate-700 font-medium">Street Address<span className="text-red-500">*</span></Label>
          <CustomInput placeholder="Enter street address" {...register("address")} />
          {errors.address && <p className="text-xs text-red-500">{errors.address.message}</p>}
        </div>
        <div className="space-y-1">
          <Label className="text-slate-700 font-medium">Country<span className="text-red-500">*</span></Label>
          <Controller
            control={control}
            name="country"
            render={({ field }) => (
              <Select 
                onValueChange={(val) => {
                  field.onChange(val);
                  setValue("state", "");
                  setValue("city", "");
                }} 
                value={field.value}
              >
                <SelectTrigger className="">
                  <SelectValue placeholder="Select Country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((c) => (
                    <SelectItem key={c.isoCode} value={c.isoCode}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.country && <p className="text-xs text-red-500">{errors.country.message}</p>}
        </div>
        <div className="space-y-1">
          <Label className="text-slate-700 font-medium">State<span className="text-red-500">*</span></Label>
          <Controller
            control={control}
            name="state"
            render={({ field }) => (
              <Select 
                onValueChange={(val) => {
                  field.onChange(val);
                  setValue("city", "");
                }} 
                value={field.value} 
                disabled={!selectedCountry}
              >
                <SelectTrigger className="">
                  <SelectValue placeholder="Select State" />
                </SelectTrigger>
                <SelectContent>
                  {states.map((s) => (
                    <SelectItem key={s.isoCode} value={s.isoCode}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.state && <p className="text-xs text-red-500">{errors.state.message}</p>}
        </div>
        <div className="space-y-1">
          <Label className="text-slate-700 font-medium">City<span className="text-red-500">*</span></Label>
          <Controller
            control={control}
            name="city"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value} disabled={!selectedState}>
                <SelectTrigger className="bg-slate-100/50">
                  <SelectValue placeholder="Select City" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((c) => (
                    <SelectItem key={c.name} value={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.city && <p className="text-xs text-red-500">{errors.city.message}</p>}
        </div>
        <div className="space-y-1">
          <Label className="text-slate-700 font-medium">Zip Code<span className="text-red-500">*</span></Label>
          <CustomInput 
            placeholder="Enter zip code" 
            maxLength={10} 
            {...register("zipCode", {
              onChange: (e) => {
                e.target.value = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
              }
            })} 
          />
          {errors.zipCode && <p className="text-xs text-red-500">{errors.zipCode.message}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
