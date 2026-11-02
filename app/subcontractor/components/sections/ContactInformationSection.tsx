"use client";

import React, { useEffect, useState, useRef } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { City } from "country-state-city";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomInput } from "../CustomInput";
import { FormValues } from "../SubcontractorForm";
import { CityAutocomplete } from "../CityAutocomplete";
import { lookupPostalCode } from "@/lib/postal-lookup";
import {
  getSubcontractorLocationAction,
  SubcontractorState,
} from "@/actions/subcontractor.actions";
import { toFullCountryName } from "@/lib/utils";

export function ContactInformationSection() {
  const { register, control, watch, setValue, setError, clearErrors, formState: { errors } } = useFormContext<FormValues>();
  const [countries, setCountries] = useState<string[]>([]);
  const [states, setStates] = useState<SubcontractorState[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [isCountriesLoading, setIsCountriesLoading] = useState(false);
  const [isStatesLoading, setIsStatesLoading] = useState(false);
  const [isZipLoading, setIsZipLoading] = useState(false);
  const [zipLocationMessage, setZipLocationMessage] = useState<string | null>(null);
  const [zipErrorMessage, setZipErrorMessage] = useState<string | null>(null);
  const selectedCountry = watch("country");
  const selectedState = watch("state");
  const selectedZip = watch("zipCode");

  const normalizedCountry = toFullCountryName(selectedCountry);

  useEffect(() => {
    let isCancelled = false;

    async function loadInitialLocations() {
      setIsCountriesLoading(true);
      if (normalizedCountry) {
        setIsStatesLoading(true);
      }
      try {
        const res = await getSubcontractorLocationAction(normalizedCountry || undefined);
        if (!isCancelled && res.success && res.data) {
          if (res.data.countries && res.data.countries.length > 0) {
            setCountries(res.data.countries);
          }
          if (res.data.states) {
            setStates(res.data.states);
          }
        }
      } catch (e) {
        console.error("Error loading subcontractor locations:", e);
      } finally {
        if (!isCancelled) {
          setIsCountriesLoading(false);
          setIsStatesLoading(false);
        }
      }
    }

    loadInitialLocations();

    return () => {
      isCancelled = true;
    };
  }, []);

  const prevCountryRef = useRef<string>(normalizedCountry);
  useEffect(() => {
    if (prevCountryRef.current === normalizedCountry) return;
    prevCountryRef.current = normalizedCountry;

    if (!normalizedCountry) {
      setStates([]);
      return;
    }

    let isCancelled = false;
    setIsStatesLoading(true);

    getSubcontractorLocationAction(normalizedCountry)
      .then((res) => {
        if (!isCancelled && res.success && res.data) {
          if (res.data.countries && res.data.countries.length > 0) {
            setCountries(res.data.countries);
          }
          setStates(res.data.states || []);
        }
      })
      .catch((e) => {
        console.error("Error fetching states for country:", e);
      })
      .finally(() => {
        if (!isCancelled) {
          setIsStatesLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [normalizedCountry]);

  useEffect(() => {
    const countryIso =
      normalizedCountry === "United States" ? "US" : normalizedCountry === "Canada" ? "CA" : normalizedCountry;

    if (countryIso && selectedState) {
      let stateCode = selectedState;
      if (selectedState.length > 2) {
        const found = states.find(
          (s) => s.name?.toLowerCase() === selectedState.toLowerCase() || s.short_code === selectedState
        );
        if (found) stateCode = found.short_code;
      }
      setCities(City.getCitiesOfState(countryIso, stateCode) || []);
    } else if (countryIso === "US") {
      setCities(City.getCitiesOfCountry("US") || []);
    } else {
      setCities([]);
    }
  }, [selectedState, normalizedCountry, states]);

  const handleZipLookup = async (zipValue: string, isBlur: boolean = false) => {
    const rawPostal = (zipValue || "").trim();
    if (!rawPostal) {
      setZipLocationMessage(null);
      setZipErrorMessage(null);
      clearErrors("zipCode");
      return;
    }

    if (rawPostal.length < 3 && !isBlur) {
      setZipLocationMessage(null);
      return;
    }

    setIsZipLoading(true);
    setZipErrorMessage(null);

    try {
      const targetCountryIso = normalizedCountry === "Canada" ? "CA" : "US";
      const res = await lookupPostalCode(rawPostal, targetCountryIso);
      if (res && (res.cityName || res.stateCode) && res.formattedMessage) {
        setZipErrorMessage(null);
        clearErrors("zipCode");

        if (res.country) {
          const cName = toFullCountryName(res.country);
          setValue("country", cName, { shouldValidate: true });
        }
        if (res.stateCode) {
          const found = states.find(
            (s) =>
              s.short_code?.toUpperCase() === res.stateCode?.toUpperCase() ||
              s.name?.toLowerCase() === res.stateName?.toLowerCase()
          );
          setValue("state", found ? (found.short_code || found.name) : res.stateCode, { shouldValidate: true });
        }
        if (res.cityName) setValue("city", res.cityName, { shouldValidate: true });
        setZipLocationMessage(res.formattedMessage);
      } else {
        setZipLocationMessage(null);
        const errorMsg =
          normalizedCountry === "Canada"
            ? "Invalid or unverified postal code for Canada"
            : "Invalid or unverified zip code";
        setZipErrorMessage(errorMsg);
        setError("zipCode", { type: "manual", message: errorMsg });
      }
    } catch (e) {
      console.error("Postal lookup error:", e);
      setZipLocationMessage(null);
      const errorMsg = "Unable to verify zip code";
      setZipErrorMessage(errorMsg);
      setError("zipCode", { type: "manual", message: errorMsg });
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
            render={({ field }) => {
              const countryVal =
                field.value === "US"
                  ? "United States"
                  : field.value === "CA"
                    ? "Canada"
                    : field.value || "";

              return (
                <Select
                  onValueChange={(val) => {
                    field.onChange(val);
                    setValue("state", "");
                    setValue("city", "");
                    setZipLocationMessage(null);
                    const curZip = (watch("zipCode") || "").trim();
                    if (curZip) {
                      handleZipLookup(curZip, true);
                    } else {
                      setZipErrorMessage(null);
                      clearErrors("zipCode");
                    }
                  }}
                  value={countryVal}
                  disabled={isCountriesLoading}
                >
                  <SelectTrigger className="">
                    <SelectValue placeholder={isCountriesLoading ? "Loading countries..." : "Select Country"} />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              );
            }}
          />
          {errors.country && <p className="text-xs text-red-500">{errors.country.message}</p>}
        </div>
        <div className="space-y-1">
          <Label className="text-slate-700 font-medium">Zip Code<span className="text-red-500">*</span></Label>
          <CustomInput
            placeholder="Enter zip code"
            maxLength={12}
            className={
              zipErrorMessage || errors.zipCode
                ? "border-red-500 ring-1 ring-red-500 focus-visible:ring-red-500"
                : ""
            }
            {...register("zipCode", {
              onChange: (e) => {
                const val = e.target.value.replace(/[^a-zA-Z0-9\s\-]/g, "");
                e.target.value = val;
                const trimmed = val.trim();
                if (!trimmed) {
                  setZipLocationMessage(null);
                  setZipErrorMessage(null);
                  clearErrors("zipCode");
                  return;
                }
                if (trimmed.length >= 4) {
                  handleZipLookup(trimmed, false);
                } else {
                  setZipLocationMessage(null);
                }
              },
              onBlur: () => {
                const curZip = (watch("zipCode") || "").trim();
                if (curZip) {
                  handleZipLookup(curZip, true);
                }
              }
            })}
          />
          {isZipLoading && (
            <p className="text-xs text-blue-600 flex items-center gap-1 mt-1 font-medium">
              <Loader2 className="w-3 h-3 animate-spin shrink-0" /> Identifying city & state...
            </p>
          )}
          {zipLocationMessage && !isZipLoading && !zipErrorMessage && !errors.zipCode && (
            <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> {zipLocationMessage}
            </p>
          )}
          {!isZipLoading && (zipErrorMessage || errors.zipCode) && (
            <p className="text-xs text-red-500 flex items-center gap-1 mt-1 font-medium">
              {zipErrorMessage || errors.zipCode?.message}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <Label className="text-slate-700 font-medium">State<span className="text-red-500">*</span></Label>
          <Controller
            control={control}
            name="state"
            render={({ field }) => {
              const matched = states.find(
                (s) =>
                  s.short_code?.toUpperCase() === field.value?.toUpperCase() ||
                  s.name?.toLowerCase() === field.value?.toLowerCase()
              );
              const selectValue = matched ? (matched.short_code || matched.name) : field.value || "";

              return (
                <Select
                  onValueChange={(val) => {
                    field.onChange(val);
                    setValue("city", "");
                  }}
                  value={selectValue}
                  disabled={!normalizedCountry || isStatesLoading}
                >
                  <SelectTrigger className="">
                    <SelectValue
                      placeholder={
                        isStatesLoading
                          ? "Loading states..."
                          : !normalizedCountry
                            ? "Select Country first"
                            : "Select State"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map((s) => {
                      const val = s.short_code || s.name;
                      return (
                        <SelectItem key={val} value={val}>
                          {s.name}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              );
            }}
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
                disabled={!normalizedCountry}
                placeholder={!normalizedCountry ? "Select Country first" : "Search or enter city"}
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
