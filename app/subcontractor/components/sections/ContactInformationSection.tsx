"use client";

import React, { useEffect, useState, useRef } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { Country, State, City } from "country-state-city";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomInput } from "../CustomInput";
import { FormValues } from "../SubcontractorForm";
import { US_STATE_CITY_DATA } from "../StaticData";
import { CityAutocomplete } from "../CityAutocomplete";

import { lookupPostalCode, ALLOWED_COUNTRY_CODES } from "@/lib/postal-lookup";

export function ContactInformationSection() {
  const { register, control, watch, setValue, formState: { errors } } = useFormContext<FormValues>();
  const [countries, setCountries] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [isZipLoading, setIsZipLoading] = useState(false);
  const [zipLocationMessage, setZipLocationMessage] = useState<string | null>(null);
  const selectedCountry = watch("country");
  const selectedState = watch("state");
  const selectedZip = watch("zipCode");

  useEffect(() => {
    const allCountries = Country.getAllCountries().filter(c => ALLOWED_COUNTRY_CODES.includes(c.isoCode));
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
    if (selectedCountry && selectedState) {
      let stateCode = selectedState;
      if (selectedState.length > 2) {
        const found = states.find(
          (s) => s.name.toLowerCase() === selectedState.toLowerCase() || s.isoCode === selectedState
        );
        if (found) stateCode = found.isoCode;
      }
      setCities(City.getCitiesOfState(selectedCountry, stateCode) || []);
    } else if (selectedCountry === "US") {
      setCities(City.getCitiesOfCountry("US") || []);
    } else {
      setCities([]);
    }
  }, [selectedState, selectedCountry, states]);

  const handleZipLookup = async (zipValue: string) => {
    const rawPostal = (zipValue || "").trim();
    if (rawPostal.length < 3) {
      setZipLocationMessage(null);
      return;
    }

    setIsZipLoading(true);
    try {
      const res = await lookupPostalCode(rawPostal, selectedCountry || "US");
      if (res) {
        if (res.country) setValue("country", res.country, { shouldValidate: true });
        if (res.stateCode) setValue("state", res.stateCode, { shouldValidate: true });
        if (res.cityName) setValue("city", res.cityName, { shouldValidate: true });
        if (res.formattedMessage) {
          setZipLocationMessage(res.formattedMessage);
        }
      } else {
        setZipLocationMessage(null);
      }
    } catch (e) {
      console.error("Postal lookup error:", e);
    } finally {
      setIsZipLoading(false);
    }
  };

  const handleAddressBlur = () => {
    const currentAddress = watch("address") || "";
    const match = currentAddress.match(/([A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d|\b\d{5}\b)/);
    if (match && match[1]) {
      const extractedZip = match[1].trim();
      const curZip = watch("zipCode");
      if (!curZip) {
        setValue("zipCode", extractedZip, { shouldValidate: true });
        handleZipLookup(extractedZip);
      }
    }
  };

  return (
    <Card className="shadow-none border-slate-200 !overflow-visible overflow-visible relative z-20">
      <CardHeader className="pb-3 border-b border-slate-100">
        <CardTitle className="text-base font-bold text-slate-800">Contact Information</CardTitle>
      </CardHeader>
      <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-4 gap-4 !overflow-visible overflow-visible">
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
          <CustomInput
            placeholder="Enter street address"
            {...register("address")}
            onBlur={handleAddressBlur}
          />
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
                  setZipLocationMessage(null);
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
          <Label className="text-slate-700 font-medium">Zip Code<span className="text-red-500">*</span></Label>
          <CustomInput
            placeholder="Enter zip code"
            maxLength={12}
            {...register("zipCode", {
              onChange: (e) => {
                const val = e.target.value.replace(/[^a-zA-Z0-9\s\-]/g, "");
                e.target.value = val;
                const trimmed = val.trim();
                if (trimmed.length >= 3) {
                  handleZipLookup(trimmed);
                } else {
                  setZipLocationMessage(null);
                }
              }
            })}
          />
          {isZipLoading && (
            <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
              <Loader2 className="w-3 h-3 animate-spin shrink-0" /> Identifying city & state...
            </p>
          )}
          {zipLocationMessage && !isZipLoading && (
            <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> {zipLocationMessage}
            </p>
          )}
          {errors.zipCode && <p className="text-xs text-red-500">{errors.zipCode.message}</p>}
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
              <CityAutocomplete
                name="city"
                value={field.value}
                onChange={(e: any) => {
                  const val = typeof e === "string" ? e : (e?.target?.value ?? "");
                  field.onChange(val);
                }}
                onSelectOption={(opt) => {
                  field.onChange(opt.name);
                  if (opt.stateCode && !selectedState) {
                    setValue("state", opt.stateCode);
                  }
                }}
                options={cities}
                disabled={!selectedCountry}
                placeholder={!selectedCountry ? "Select Country first" : "Search or enter city"}
                error={errors.city}
                showStateBadge={!selectedState}
              />
            )}
          />
          {errors.city && <p className="text-xs text-red-500">{errors.city.message}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
