"use client";

import {
  Globe,
  Building2,
  Map,
  UserCheck,
  Shield,
  ShieldAlert,
  ShieldCheck,
  MapPin,
  X,
  Info,
  Loader2,
  Search,
} from "lucide-react";
import Autocomplete from "react-google-autocomplete";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DynamicGuardsMap } from "../DynamicGuardsMap";
import { LocationType, ServiceFilterType } from "./types";

interface GuardFiltersAndMapProps {
  locationType: LocationType;
  onLocationTypeChange: (val: LocationType) => void;
  serviceFilter: ServiceFilterType;
  onServiceFilterChange: (val: ServiceFilterType) => void;

  centerLocation: string;
  onCenterLocationChange: (val: string) => void;
  onPlaceSelected: (place: any) => void;
  radiusMiles: number;
  onRadiusChange: (val: number | ((prev: number) => number)) => void;

  citySelectKey: number;
  stateSelectKey: number;
  countrySelectKey: number;
  selectedCities: string[];
  availableCities: string[];
  onAddCity: (city: string) => void;
  onRemoveCity: (city: string) => void;

  selectedStates: string[];
  availableStates: string[];
  onAddState: (state: string) => void;
  onRemoveState: (state: string) => void;

  selectedCountries: string[];
  availableCountries: string[];
  onAddCountry: (country: string) => void;
  onRemoveCountry: (country: string) => void;
  isLocationsLoading: boolean;

  isGuardsLoading: boolean;
  onSearchGuards: () => void;
  onResetFilters: () => void;

  mapDisplayedLocation: string;
  mapCenter: [number, number];
  allGuards: any[];
}

export function GuardFiltersAndMap({
  locationType,
  onLocationTypeChange,
  serviceFilter,
  onServiceFilterChange,
  centerLocation,
  onCenterLocationChange,
  onPlaceSelected,
  radiusMiles,
  onRadiusChange,
  citySelectKey,
  stateSelectKey,
  countrySelectKey,
  selectedCities,
  availableCities,
  onAddCity,
  onRemoveCity,
  selectedStates,
  availableStates,
  onAddState,
  onRemoveState,
  selectedCountries,
  availableCountries,
  onAddCountry,
  onRemoveCountry,
  isLocationsLoading,
  isGuardsLoading,
  onSearchGuards,
  onResetFilters,
  mapDisplayedLocation,
  mapCenter,
  allGuards,
}: GuardFiltersAndMapProps) {
  return (
    <div className="p-6 border-b border-slate-100 bg-white">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-4 space-y-4 bg-white">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-800">Location Type</Label>
            <Select
              value={locationType}
              onValueChange={(val: any) => onLocationTypeChange(val)}
            >
              <SelectTrigger className="w-full h-10 bg-white border-slate-200 rounded-lg text-xs font-medium cursor-pointer flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {locationType === "radius" && <Globe className="w-3.5 h-3.5 text-blue-600" />}
                  {locationType === "city" && <Building2 className="w-3.5 h-3.5 text-blue-600" />}
                  {locationType === "state" && <Map className="w-3.5 h-3.5 text-blue-600" />}
                  {locationType === "country" && <Globe className="w-3.5 h-3.5 text-blue-600" />}
                  {(locationType === "all_guard" || locationType === "all") && (
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  )}
                  <span>
                    {locationType === "radius" && "Geographic Area ( Radius )"}
                    {locationType === "city" && "City"}
                    {locationType === "state" && "State"}
                    {locationType === "country" && "Country"}
                    {(locationType === "all_guard" || locationType === "all") && "All Guards"}
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 shadow-xl cursor-pointer">
                <SelectItem value="radius" className="text-xs cursor-pointer py-2">
                  <div className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-blue-600" />
                    <span>Geographic Area ( Radius )</span>
                  </div>
                </SelectItem>
                <SelectItem value="city" className="text-xs cursor-pointer py-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>City</span>
                  </div>
                </SelectItem>
                <SelectItem value="state" className="text-xs cursor-pointer py-2">
                  <div className="flex items-center gap-2">
                    <Map className="w-3.5 h-3.5 text-blue-600" />
                    <span>State</span>
                  </div>
                </SelectItem>
                <SelectItem value="country" className="text-xs cursor-pointer py-2">
                  <div className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-blue-600" />
                    <span>Country</span>
                  </div>
                </SelectItem>
                <SelectItem value="all_guard" className="text-xs cursor-pointer py-2">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>All Guards</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-800">Service</Label>
            <Select
              value={serviceFilter}
              onValueChange={(val: "all" | "both" | "armed" | "unarmed") => onServiceFilterChange(val)}
            >
              <SelectTrigger className="w-full h-10 bg-white border-slate-200 rounded-lg text-xs font-medium cursor-pointer flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    {serviceFilter === "all" && "All"}
                    {serviceFilter === "both" && "Both"}
                    {serviceFilter === "armed" && "Armed"}
                    {serviceFilter === "unarmed" && "Unarmed"}
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 shadow-xl cursor-pointer">
                <SelectItem value="all" className="text-xs cursor-pointer py-2">
                  <div className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-blue-600" />
                    <span>All</span>
                  </div>
                </SelectItem>
                <SelectItem value="both" className="text-xs cursor-pointer py-2">
                  <div className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-blue-600" />
                    <span>Both</span>
                  </div>
                </SelectItem>
                <SelectItem value="armed" className="text-xs cursor-pointer py-2">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
                    <span>Armed</span>
                  </div>
                </SelectItem>
                <SelectItem value="unarmed" className="text-xs cursor-pointer py-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Unarmed</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {locationType === "radius" && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-black">Site Location</Label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-blue-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                  <Autocomplete
                    apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyAcL7f3q3X4BUlmdpjbo7ZY0GotX7Gh-sU"}
                    value={centerLocation}
                    onChange={(e: any) => onCenterLocationChange(e.target.value)}
                    onPlaceSelected={onPlaceSelected}
                    options={{
                      types: ["geocode", "establishment"],
                    }}
                    placeholder="Search location with Google..."
                    className="w-full h-10 pl-9 pr-8 bg-white border border-slate-200 rounded-lg text-xs text-black font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#0064cb] focus:ring-2 focus:ring-[#0064cb]/10 transition-colors cursor-pointer"
                    style={{ color: "#000000" }}
                  />
                  {centerLocation && (
                    <button
                      type="button"
                      onClick={() => onCenterLocationChange("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer z-10"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-800">Radius (Miles)</Label>
                <div className="flex items-center gap-3">
                  <div className="relative w-36 shrink-0 flex items-center">
                    <Input
                      type="number"
                      min={5}
                      max={5000}
                      step={5}
                      value={radiusMiles}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        onRadiusChange(val > 0 ? val : 50);
                      }}
                      className="w-full h-10 pr-14 bg-white border-slate-200 rounded-md text-xs font-medium text-slate-800 focus:border-[#0064cb]"
                    />
                    <div className="absolute right-1 flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => onRadiusChange((prev) => Math.max(5, prev - 5))}
                        className="w-6 h-7 flex items-center justify-center rounded-sm bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                        title="Decrease by 5 miles"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => onRadiusChange((prev) => prev + 5)}
                        className="w-6 h-7 flex items-center justify-center rounded-sm bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                        title="Increase by 5 miles"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 font-normal">
                    Find guards within {radiusMiles} miles.
                  </p>
                </div>
              </div>
            </>
          )}

          {locationType === "city" && (
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-800">City</Label>
              <Select
                key={citySelectKey}
                onValueChange={(val) => {
                  if (val && val !== "__none__") {
                    onAddCity(val);
                  }
                }}
              >
                <SelectTrigger className="w-full h-10 bg-white border-slate-200 rounded-lg text-xs font-medium cursor-pointer">
                  <SelectValue
                    placeholder={
                      selectedCities.length > 0
                        ? selectedCities.join(", ")
                        : isLocationsLoading
                          ? "Loading cities..."
                          : "Select City"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 max-h-56">
                  {availableCities.filter((c) => !selectedCities.some((sc) => sc.toLowerCase() === c.toLowerCase())).length === 0 ? (
                    <SelectItem value="__none__" disabled className="text-xs text-slate-400">
                      {isLocationsLoading ? "Loading cities..." : selectedCities.length > 0 ? "No more cities" : "No cities found"}
                    </SelectItem>
                  ) : (
                    availableCities
                      .filter((c) => !selectedCities.some((sc) => sc.toLowerCase() === c.toLowerCase()))
                      .map((city) => (
                        <SelectItem key={city} value={city} className="text-xs cursor-pointer">
                          {city}
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>

              {selectedCities.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedCities.map((cityName) => (
                    <span
                      key={cityName}
                      className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-800 text-xs font-semibold px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs"
                    >
                      <span>{cityName}</span>
                      <button
                        type="button"
                        onClick={() => onRemoveCity(cityName)}
                        className="text-slate-400 hover:text-red-500 rounded p-0.5 hover:bg-slate-200/60 transition-colors cursor-pointer"
                        title={`Remove ${cityName}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {locationType === "state" && (
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-800">State</Label>
              <Select
                key={stateSelectKey}
                onValueChange={(val) => {
                  if (val && val !== "__none__") {
                    onAddState(val);
                  }
                }}
              >
                <SelectTrigger className="w-full h-10 bg-white border-slate-200 rounded-lg text-xs font-medium cursor-pointer">
                  <SelectValue
                    placeholder={
                      selectedStates.length > 0
                        ? selectedStates.join(", ")
                        : isLocationsLoading
                          ? "Loading states..."
                          : "Select State"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 max-h-56">
                  {availableStates.filter((s) => !selectedStates.some((ss) => ss.toLowerCase() === s.toLowerCase())).length === 0 ? (
                    <SelectItem value="__none__" disabled className="text-xs text-slate-400">
                      {isLocationsLoading ? "Loading states..." : selectedStates.length > 0 ? "No more states" : "No states found"}
                    </SelectItem>
                  ) : (
                    availableStates
                      .filter((s) => !selectedStates.some((ss) => ss.toLowerCase() === s.toLowerCase()))
                      .map((state) => (
                        <SelectItem key={state} value={state} className="text-xs cursor-pointer">
                          {state}
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>

              {selectedStates.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedStates.map((stateName) => (
                    <span
                      key={stateName}
                      className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-800 text-xs font-semibold px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs"
                    >
                      <span>{stateName}</span>
                      <button
                        type="button"
                        onClick={() => onRemoveState(stateName)}
                        className="text-slate-400 hover:text-red-500 rounded p-0.5 hover:bg-slate-200/60 transition-colors cursor-pointer"
                        title={`Remove ${stateName}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {locationType === "country" && (
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-800">Country</Label>
              <Select
                key={countrySelectKey}
                onValueChange={(val) => {
                  if (val && val !== "__none__") {
                    onAddCountry(val);
                  }
                }}
              >
                <SelectTrigger className="w-full h-10 bg-white border-slate-200 rounded-lg text-xs font-medium cursor-pointer">
                  <SelectValue
                    placeholder={
                      selectedCountries.length > 0
                        ? selectedCountries.join(", ")
                        : isLocationsLoading
                          ? "Loading countries..."
                          : "Select Country"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 max-h-56">
                  {availableCountries.filter((c) => !selectedCountries.some((sc) => sc.toLowerCase() === c.toLowerCase())).length === 0 ? (
                    <SelectItem value="__none__" disabled className="text-xs text-slate-400">
                      {isLocationsLoading ? "Loading countries..." : selectedCountries.length > 0 ? "No more countries" : "No countries found"}
                    </SelectItem>
                  ) : (
                    availableCountries
                      .filter((c) => !selectedCountries.some((sc) => sc.toLowerCase() === c.toLowerCase()))
                      .map((country) => (
                        <SelectItem key={country} value={country} className="text-xs cursor-pointer">
                          {country}
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>

              {selectedCountries.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedCountries.map((countryName) => (
                    <span
                      key={countryName}
                      className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-800 text-xs font-semibold px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs"
                    >
                      <span>{countryName}</span>
                      <button
                        type="button"
                        onClick={() => onRemoveCountry(countryName)}
                        className="text-slate-400 hover:text-red-500 rounded p-0.5 hover:bg-slate-200/60 transition-colors cursor-pointer"
                        title={`Remove ${countryName}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {(locationType === "all_guard" || locationType === "all") && (
            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-lg text-xs text-blue-800 flex items-start gap-2">
              <Info className="w-4 h-4 text-[#0064cb] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">All Guards</span>
                <span>Fetches all active guards without location restrictions.</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 pt-2">
            <Button
              type="button"
              disabled={isGuardsLoading}
              onClick={onSearchGuards}
              className="h-10 px-5 bg-[#0064cb] hover:bg-[#0052ae] text-white rounded-lg text-xs font-bold shadow-md shadow-[#0064cb]/20 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {isGuardsLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Search className="w-3.5 h-3.5" />
              )}
              <span>Search Guards</span>
            </Button>
            <button
              type="button"
              onClick={onResetFilters}
              className="text-xs font-bold text-[#0064cb] hover:underline cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-0 rounded-xl overflow-hidden border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 text-xs text-slate-700 font-medium">
            <div className="flex items-center gap-1.5 font-bold text-black truncate max-w-[50%]" title={mapDisplayedLocation}>
              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate">{mapDisplayedLocation}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {locationType === "radius" ? (
                <span>Radius: <strong className="text-slate-900">{radiusMiles} miles</strong></span>
              ) : (
                <span>Type: <strong className="text-slate-900 capitalize">{(locationType === "all_guard" || locationType === "all") ? "All Guards" : locationType}</strong></span>
              )}
              <span className="text-slate-300">|</span>
              <span>Service: <strong className="text-slate-900 capitalize">{serviceFilter}</strong></span>
              <span className="text-slate-300">|</span>
              <span>Guards found: <strong className="text-[#0064cb] font-bold">{allGuards.length}</strong></span>
            </div>
          </div>

          <DynamicGuardsMap
            center={mapCenter}
            radiusMiles={radiusMiles}
            centerLocationName={mapDisplayedLocation}
            guardsFoundCount={allGuards.length}
            guards={allGuards}
            locationType={locationType}
          />
        </div>
      </div>
    </div>
  );
}
