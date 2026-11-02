"use client";

import { useState } from "react";
import { MapPin, Loader2, CheckCircle2 } from "lucide-react";
import { cn, toFullCountryName } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CityAutocomplete } from "@/components/ui/city-autocomplete";
import { lookupPostalCode } from "@/lib/postal-lookup";

interface GuardAddressProps {
  guard: any;
  isEditing: boolean;
  editForm: any;
  handleEditChange: (field: string, value: any) => void;
  countries: any[];
  states: any[];
  cities: any[];
  formErrors?: Record<string, string>;
  isCountriesLoading?: boolean;
  isStatesLoading?: boolean;
}

export function GuardAddress({
  guard,
  isEditing,
  editForm,
  handleEditChange,
  countries,
  states,
  cities,
  formErrors,
  isCountriesLoading = false,
  isStatesLoading = false,
}: GuardAddressProps) {
  const [isZipLoading, setIsZipLoading] = useState(false);
  const [zipLocationMessage, setZipLocationMessage] = useState<string | null>(null);
  const [zipErrorMessage, setZipErrorMessage] = useState<string | null>(null);

  const normalizedCountry = toFullCountryName(editForm.country);

  const handleZipLookup = async (zipVal: string, activeCountry?: string, isBlur: boolean = false) => {
    const rawPostal = (zipVal || "").trim();
    if (!rawPostal) {
      setZipLocationMessage(null);
      setZipErrorMessage(null);
      handleEditChange("zip_code_error", "");
      return;
    }
    if (rawPostal.length < 3 && !isBlur) {
      setZipLocationMessage(null);
      return;
    }
    setIsZipLoading(true);
    setZipErrorMessage(null);

    try {
      const curCountry = activeCountry || normalizedCountry || "United States";
      const targetCountryIso = curCountry === "Canada" || curCountry === "CA" ? "CA" : "US";
      const res = await lookupPostalCode(rawPostal, targetCountryIso);
      if (res && (res.cityName || res.stateCode) && res.formattedMessage) {
        setZipErrorMessage(null);
        handleEditChange("zip_code_error", "");
        const cName = toFullCountryName(res.country || curCountry);

        let finalState = res.stateCode;
        if (res.stateCode) {
          const found = states.find(
            (s: any) =>
              s.short_code?.toUpperCase() === res.stateCode?.toUpperCase() ||
              s.name?.toLowerCase() === res.stateName?.toLowerCase()
          );
          if (found) finalState = found.short_code || found.name;
        }

        handleEditChange("country", cName);
        if (finalState) handleEditChange("state", finalState);
        if (res.cityName) handleEditChange("city", res.cityName);
        setZipLocationMessage(res.formattedMessage);
      } else {
        setZipLocationMessage(null);
        const errorMsg =
          curCountry === "Canada" || curCountry === "CA"
            ? "Invalid or unverified postal code for Canada"
            : "Invalid or unverified zip code";
        setZipErrorMessage(errorMsg);
        handleEditChange("zip_code_error", errorMsg);
      }
    } catch (err) {
      console.error("Postal lookup error:", err);
      setZipLocationMessage(null);
      const errorMsg = "Unable to verify zip code";
      setZipErrorMessage(errorMsg);
      handleEditChange("zip_code_error", errorMsg);
    } finally {
      setIsZipLoading(false);
    }
  };

  const matchedState = states.find(
    (s: any) =>
      s.short_code?.toUpperCase() === editForm.state?.toUpperCase() ||
      s.name?.toLowerCase() === editForm.state?.toLowerCase()
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-5 lg:col-span-2 relative z-20 overflow-visible">
      <div className="flex items-center gap-2 text-[#0064cb]">
        <MapPin className="w-4 h-4" />
        <h3 className="font-bold text-slate-800 text-[14px]">Address</h3>
      </div>
      <div className="grid grid-cols-2 gap-y-5 gap-x-4">
        <div className="col-span-2 space-y-1">
          <span className="text-[11px] text-slate-500 font-semibold block">Street Address</span>
          {isEditing ? (
            <Input
              value={editForm.street_address || ""}
              onChange={(e) => handleEditChange("street_address", e.target.value)}
              placeholder="Enter Street Address"
              className="h-10 text-sm mt-1"
            />
          ) : (
            <p className="text-[13px] font-bold text-slate-800 leading-relaxed">
              {guard.street_address || "N/A"}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <span className="text-[11px] text-slate-500 font-semibold block">
            Country {isEditing && <span className="text-red-500">*</span>}
          </span>
          {isEditing ? (
            <>
              <Select
                value={normalizedCountry || undefined}
                onValueChange={(val) => {
                  handleEditChange("country", val);
                  handleEditChange("state", "");
                  handleEditChange("city", "");
                  setZipLocationMessage(null);
                  const curZip = (editForm.zip_code || "").trim();
                  if (curZip) {
                    handleZipLookup(curZip, val, true);
                  } else {
                    setZipErrorMessage(null);
                    handleEditChange("zip_code_error", "");
                  }
                }}
                disabled={isCountriesLoading}
              >
                <SelectTrigger
                  className={cn(
                    "h-10 text-sm mt-1",
                    formErrors?.country && "border-red-500 ring-1 ring-red-500"
                  )}
                >
                  <SelectValue placeholder={isCountriesLoading ? "Loading countries..." : "Select Country"} />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((c: any) => {
                    const countryName = typeof c === "string" ? c : c.name || c.isoCode;
                    return (
                      <SelectItem key={countryName} value={countryName}>
                        {countryName}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {formErrors?.country && (
                <p className="text-xs text-red-500 font-medium mt-1">{formErrors.country}</p>
              )}
            </>
          ) : (
            <p className="text-[13px] font-bold text-slate-800">{guard.country || "N/A"}</p>
          )}
        </div>

        <div className="space-y-1">
          <span className="text-[11px] text-slate-500 font-semibold block">Zip Code</span>
          {isEditing ? (
            <div className="space-y-1">
              <div className="relative">
                <Input
                  value={editForm.zip_code || ""}
                  maxLength={15}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^a-zA-Z0-9\s\-]/g, "");
                    handleEditChange("zip_code", val);
                    if (!val) {
                      setZipLocationMessage(null);
                      setZipErrorMessage(null);
                      handleEditChange("zip_code_error", "");
                      return;
                    }
                    if (val.length >= 4) {
                      handleZipLookup(val, normalizedCountry, false);
                    } else {
                      setZipLocationMessage(null);
                    }
                  }}
                  onBlur={() => {
                    if (editForm.zip_code) {
                      handleZipLookup(editForm.zip_code, normalizedCountry, true);
                    }
                  }}
                  placeholder="Enter Zip Code"
                  className={cn(
                    "h-10 text-sm mt-1 pr-8",
                    (zipErrorMessage || formErrors?.zip_code || editForm.zip_code_error) &&
                    "border-red-500 ring-1 ring-red-500 focus-visible:ring-red-500"
                  )}
                />
                {isZipLoading && (
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                  </div>
                )}
              </div>
              {isZipLoading && (
                <p className="text-xs text-blue-600 flex items-center gap-1 font-medium">
                  <Loader2 className="w-3 h-3 animate-spin shrink-0" /> Identifying city & state...
                </p>
              )}
              {zipLocationMessage && !isZipLoading && !zipErrorMessage && !formErrors?.zip_code && !editForm.zip_code_error && (
                <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-green-500 inline-block" />
                  {zipLocationMessage}
                </p>
              )}
              {!isZipLoading && (zipErrorMessage || formErrors?.zip_code || editForm.zip_code_error) && (
                <p className="text-xs text-red-500 font-medium mt-1">
                  {zipErrorMessage || formErrors?.zip_code || editForm.zip_code_error}
                </p>
              )}
            </div>
          ) : (
            <p className="text-[13px] font-bold text-slate-800">{guard.zip_code || "N/A"}</p>
          )}
        </div>

        <div className="space-y-1">
          <span className="text-[11px] text-slate-500 font-semibold block">
            State {isEditing && <span className="text-red-500">*</span>}
          </span>
          {isEditing ? (
            <>
              <Select
                value={matchedState?.short_code || editForm.state || undefined}
                onValueChange={(val) => {
                  handleEditChange("state", val);
                  handleEditChange("city", "");
                }}
                disabled={!normalizedCountry || isStatesLoading}
              >
                <SelectTrigger
                  className={cn(
                    "h-10 text-sm mt-1",
                    formErrors?.state && "border-red-500 ring-1 ring-red-500"
                  )}
                >
                  <SelectValue
                    placeholder={
                      isStatesLoading
                        ? "Loading states..."
                        : !normalizedCountry
                          ? "Select country first"
                          : "Select State"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {states.map((s: any) => {
                    const code = s.short_code || s.isoCode || s.name;
                    const label = s.name || s.short_code;
                    return (
                      <SelectItem key={code} value={code}>
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {formErrors?.state && (
                <p className="text-xs text-red-500 font-medium mt-1">{formErrors.state}</p>
              )}
            </>
          ) : (
            <p className="text-[13px] font-bold text-slate-800">{guard.state || "N/A"}</p>
          )}
        </div>

        <div className="space-y-1">
          <span className="text-[11px] text-slate-500 font-semibold block">City</span>
          {isEditing ? (
            <CityAutocomplete
              name="city"
              value={editForm.city || ""}
              onChange={(e) => handleEditChange("city", e.target.value)}
              onSelectOption={(opt) => handleEditChange("city", opt.name)}
              options={cities}
              disabled={!editForm.state && !normalizedCountry}
              placeholder="Select or enter city"
              className="h-10 text-sm mt-1"
              showStateBadge={!editForm.state}
            />
          ) : (
            <p className="text-[13px] font-bold text-slate-800">{guard.city || "N/A"}</p>
          )}
        </div>
      </div>
    </div>
  );
}
