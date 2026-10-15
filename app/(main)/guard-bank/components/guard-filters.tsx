"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { GuardProviderFilter } from "./guard-provider-filter";
import { PersonnelProfilesResponseData } from "@/lib/client-actions";

interface GuardFiltersProps {
  search: string;
  setSearch: (val: string) => void;
  selectedCountry: string;
  setSelectedCountry: (val: string) => void;
  selectedState: string;
  setSelectedState: (val: string) => void;
  selectedCity: string;
  setSelectedCity: (val: string) => void;
  selectedAccountStatus: string;
  setSelectedAccountStatus: (val: string) => void;
  selectedProvider: string;
  setSelectedProvider: (val: string) => void;
  providersData?: PersonnelProfilesResponseData;
  loadingProviders?: boolean;
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
  selectedAccountStatus,
  setSelectedAccountStatus,
  selectedProvider,
  setSelectedProvider,
  providersData,
  loadingProviders = false,
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
    options: any[],
    allLabel: string
  ) => {
    if (!mounted) {
      return <div className="h-10 border border-slate-200 rounded-md animate-pulse bg-slate-50" />;
    }

    const safeOptions: string[] = Array.isArray(options)
      ? options
        .map((opt: any) => {
          if (typeof opt === "string") return opt.trim();
          if (typeof opt === "number") return String(opt);
          if (opt && typeof opt === "object") {
            if (typeof opt.name === "string") return opt.name.trim();
            if (typeof opt.label === "string") return opt.label.trim();
            if (typeof opt.value === "string") return opt.value.trim();
            return "";
          }
          return "";
        })
        .filter((opt) => typeof opt === "string" && opt.length > 0)
      : [];

    return (
      <Select value={typeof value === "string" ? value : "all"} onValueChange={onChange}>
        <SelectTrigger className="h-10 border-slate-200 bg-slate-50">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{allLabel}</SelectItem>
          {safeOptions.map((opt) => (
            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  if (isHomeTab) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-1.5">
          <label className={labelClass}>{searchLabel}</label>
          <Input
            placeholder={searchPlaceholder}
            className="h-10 bg-slate-50 border-slate-200"
            value={typeof search === "string" ? search : ""}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label className={labelClass}>Country</label>
          {renderSelect(selectedCountry, setSelectedCountry, "All Countries", locations?.countries || [], "All Countries")}
        </div>
        <div className="space-y-1.5">
          <label className={labelClass}>State</label>
          {renderSelect(selectedState, setSelectedState, "All States", locations?.states || [], "All States")}
        </div>
        <div className="space-y-1.5">
          <label className={labelClass}>City</label>
          {renderSelect(selectedCity, setSelectedCity, "All Cities", locations?.cities || [], "All Cities")}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 1st Row: Search, Status, Provider */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className={labelClass}>{searchLabel}</label>
          <Input
            placeholder={searchPlaceholder}
            className="h-10 bg-slate-50 border-slate-200"
            value={typeof search === "string" ? search : ""}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label className={labelClass}>Status</label>
          {!mounted ? (
            <div className="h-10 border border-slate-200 rounded-md animate-pulse bg-slate-50" />
          ) : (
            <Select
              value={typeof selectedAccountStatus === "string" ? selectedAccountStatus : "all"}
              onValueChange={setSelectedAccountStatus}
            >
              <SelectTrigger className="h-10 border-slate-200 bg-slate-50">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="space-y-1.5">
          <label className={labelClass}>Provider</label>
          <GuardProviderFilter
            value={selectedProvider}
            onChange={setSelectedProvider}
            providersData={providersData}
            isLoading={loadingProviders}
            mounted={mounted}
          />
        </div>
      </div>

      {/* 2nd Row: Country, State, City */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className={labelClass}>Country</label>
          {renderSelect(selectedCountry, setSelectedCountry, "All Countries", locations?.countries || [], "All Countries")}
        </div>
        <div className="space-y-1.5">
          <label className={labelClass}>State</label>
          {renderSelect(selectedState, setSelectedState, "All States", locations?.states || [], "All States")}
        </div>
        <div className="space-y-1.5">
          <label className={labelClass}>City</label>
          {renderSelect(selectedCity, setSelectedCity, "All Cities", locations?.cities || [], "All Cities")}
        </div>
      </div>
    </div>
  );
}
