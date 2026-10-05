"use client";

import { useState } from "react";
import { MapPin, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
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
}

export function GuardAddress({
  guard,
  isEditing,
  editForm,
  handleEditChange,
  countries,
  states,
  cities,
  formErrors
}: GuardAddressProps) {
  const [isZipLoading, setIsZipLoading] = useState(false);
  const [zipLocationMessage, setZipLocationMessage] = useState<string | null>(null);

  const handleZipLookup = async (zipVal: string) => {
    const rawPostal = (zipVal || "").trim();
    if (rawPostal.length < 3) {
      setZipLocationMessage(null);
      return;
    }
    setIsZipLoading(true);
    try {
      const res = await lookupPostalCode(rawPostal, editForm.country || "US");
      if (res) {
        if (res.country) handleEditChange("country", res.country);
        if (res.stateCode) handleEditChange("state", res.stateCode);
        if (res.cityName) handleEditChange("city", res.cityName);
        if (res.formattedMessage) {
          setZipLocationMessage(res.formattedMessage);
        }
      } else {
        setZipLocationMessage(null);
      }
    } catch (err) {
      console.error("Postal lookup error:", err);
    } finally {
      setIsZipLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-5 lg:col-span-2 relative z-20 overflow-visible">
      <div className="flex items-center gap-2 text-[#0064cb]">
        <MapPin className="w-4 h-4" />
        <h3 className="font-bold text-slate-800 text-[14px]">Address</h3>
      </div>
      <div className="grid grid-cols-2 gap-y-5 gap-x-4">
        {/* Street Address */}
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

        {/* Country */}
        <div className="space-y-1">
          <span className="text-[11px] text-slate-500 font-semibold block">
            Country {isEditing && <span className="text-red-500">*</span>}
          </span>
          {isEditing ? (
            <>
              <Select
                value={editForm.country || undefined}
                onValueChange={(val) => {
                  handleEditChange("country", val);
                  handleEditChange("state", "");
                  handleEditChange("city", "");
                  setZipLocationMessage(null);
                }}
              >
                <SelectTrigger
                  className={cn(
                    "h-10 text-sm mt-1",
                    formErrors?.country && "border-red-500 ring-1 ring-red-500"
                  )}
                >
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
              {formErrors?.country && (
                <p className="text-xs text-red-500 font-medium mt-1">{formErrors.country}</p>
              )}
            </>
          ) : (
            <p className="text-[13px] font-bold text-slate-800">{guard.country || "N/A"}</p>
          )}
        </div>

        {/* Zip Code - moved right before State */}
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
                    if (val.length >= 4) {
                      handleZipLookup(val);
                    }
                  }}
                  onBlur={() => {
                    if (editForm.zip_code) handleZipLookup(editForm.zip_code);
                  }}
                  placeholder="Enter Zip Code"
                  className="h-10 text-sm mt-1 pr-8"
                />
                {isZipLoading && (
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                  </div>
                )}
              </div>
              {zipLocationMessage && (
                <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-green-500 inline-block" />
                  {zipLocationMessage}
                </p>
              )}
            </div>
          ) : (
            <p className="text-[13px] font-bold text-slate-800">{guard.zip_code || "N/A"}</p>
          )}
        </div>

        {/* State */}
        <div className="space-y-1">
          <span className="text-[11px] text-slate-500 font-semibold block">
            State {isEditing && <span className="text-red-500">*</span>}
          </span>
          {isEditing ? (
            <>
              <Select
                value={editForm.state || undefined}
                onValueChange={(val) => {
                  handleEditChange("state", val);
                  handleEditChange("city", "");
                }}
                disabled={!editForm.country}
              >
                <SelectTrigger
                  className={cn(
                    "h-10 text-sm mt-1",
                    formErrors?.state && "border-red-500 ring-1 ring-red-500"
                  )}
                >
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
              {formErrors?.state && (
                <p className="text-xs text-red-500 font-medium mt-1">{formErrors.state}</p>
              )}
            </>
          ) : (
            <p className="text-[13px] font-bold text-slate-800">{guard.state || "N/A"}</p>
          )}
        </div>

        {/* City - Dynamic CityAutocomplete */}
        <div className="space-y-1">
          <span className="text-[11px] text-slate-500 font-semibold block">City</span>
          {isEditing ? (
            <CityAutocomplete
              name="city"
              value={editForm.city || ""}
              onChange={(e) => handleEditChange("city", e.target.value)}
              onSelectOption={(opt) => handleEditChange("city", opt.name)}
              options={cities}
              disabled={!editForm.state && !editForm.country}
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
