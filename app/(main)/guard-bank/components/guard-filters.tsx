"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface GuardFiltersProps {
  search: string;
  setSearch: (val: string) => void;
  selectedCountry: string;
  setSelectedCountry: (val: string) => void;
  selectedState: string;
  setSelectedState: (val: string) => void;
  selectedCity: string;
  setSelectedCity: (val: string) => void;
  locations: {
    countries: string[];
    states: string[];
    cities: string[];
  };
  mounted: boolean;
  isHomeTab?: boolean;
}

export function GuardFilters({
  search,
  setSearch,
  selectedCountry,
  setSelectedCountry,
  selectedState,
  setSelectedState,
  selectedCity,
  setSelectedCity,
  locations,
  mounted,
  isHomeTab = false
}: GuardFiltersProps) {
  const labelClass = isHomeTab 
    ? "text-sm text-slate-600" 
    : "text-[13px] text-slate-600 font-medium";

  const searchLabel = isHomeTab ? "Search by name or email" : "Search";
  const searchPlaceholder = isHomeTab ? "Enter name or email" : "Search name or email...";

  const renderSelect = (
    value: string,
    onChange: (val: string) => void,
    placeholder: string,
    options: string[],
    allLabel: string
  ) => {
    if (!mounted) {
      return <div className="h-10 border border-slate-200 rounded-md animate-pulse bg-slate-50" />;
    }
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-10 border-slate-200 bg-slate-50">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{allLabel}</SelectItem>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="space-y-1.5">
        <label className={labelClass}>{searchLabel}</label>
        <Input 
          placeholder={searchPlaceholder} 
          className="h-10 bg-slate-50 border-slate-200" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <label className={labelClass}>Country</label>
        {renderSelect(selectedCountry, setSelectedCountry, "All Countries", locations.countries, "All Countries")}
      </div>
      <div className="space-y-1.5">
        <label className={labelClass}>State</label>
        {renderSelect(selectedState, setSelectedState, "All States", locations.states, "All States")}
      </div>
      <div className="space-y-1.5">
        <label className={labelClass}>City</label>
        {renderSelect(selectedCity, setSelectedCity, "All Cities", locations.cities, "All Cities")}
      </div>
    </div>
  );
}
