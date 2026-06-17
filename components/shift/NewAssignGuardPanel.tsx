"use client";

import { useState, useEffect } from "react";
import { Search, XCircle, DollarSign, Loader2 } from "lucide-react";
import { fetchLocationAction, fetchGuardsAction } from "@/actions/dashboard.actions";
import useDebounceValue from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface GuardRates {
  per_hour_rate?: number;
  per_shift_rate?: number;
  travel_fee?: number;
}

interface NewAssignGuardPanelProps {
  onSelect: (guard: any, rates: GuardRates) => void;
  onClose: () => void;
  assigningGuardId?: string | null;
  isReassign?: boolean;
  initialRates?: {
    per_hour_rate?: number;
    per_shift_rate?: number;
    travel_fee?: number;
  };
}

export function NewAssignGuardPanel({ onSelect, onClose, assigningGuardId, isReassign, initialRates }: NewAssignGuardPanelProps) {
  // Rate inputs
  const [hourlyRate, setHourlyRate] = useState(initialRates?.per_hour_rate ? String(initialRates.per_hour_rate) : "");
  const [perShiftRate, setPerShiftRate] = useState(initialRates?.per_shift_rate ? String(initialRates.per_shift_rate) : "");
  const [travelFee, setTravelFee] = useState(initialRates?.travel_fee ? String(initialRates.travel_fee) : "");

  // Guard search & filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    country: "",
    state: "",
    city: "",
    status: "all",
    service: "All"
  });
  const [locations, setLocations] = useState<{ countries: string[], states: string[], cities: string[] }>({
    countries: [],
    states: [],
    cities: []
  });
  const [guards, setGuards] = useState<any[]>([]);
  const [isLoadingGuards, setIsLoadingGuards] = useState(false);
  const [pagination, setPagination] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const debouncedSearchQuery = useDebounceValue(searchQuery, 500);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Load locations on mount
  useEffect(() => {
    const loadLocations = async () => {
      const res = await fetchLocationAction();
      if (res.success && res.data) {
        setLocations({
          countries: ["All Country", ...res.data.countries],
          states: ["All State", ...res.data.states],
          cities: ["All City", ...res.data.cities]
        });
        setFilters(prev => ({
          ...prev,
          country: "All Country",
          state: "All State",
          city: "All City"
        }));
      }
    };
    loadLocations();
  }, []);

  // Load guards when search/filters change
  useEffect(() => {
    const loadGuards = async () => {
      setIsLoadingGuards(true);
      let armed = "";
      let unarmed = "";
      if (filters.service === "armed") armed = "true";
      if (filters.service === "unarmed") unarmed = "true";
      if (filters.service === "both") { armed = "true"; unarmed = "true"; }

      const res = await fetchGuardsAction({
        page: currentPage,
        search: debouncedSearchQuery,
        status: filters.status === "all" ? "" : filters.status,
        city: filters.city,
        state: filters.state,
        country: filters.country,
        armed,
        unarmed
      });
      if (res.success && res.data) {
        setGuards(res.data);
        setPagination(res.pagination);
      }
      setIsLoadingGuards(false);
    };
    loadGuards();
  }, [currentPage, debouncedSearchQuery, filters]);

  const handleSelectGuard = (guard: any) => {
    const rates: GuardRates = {};
    const hr = parseFloat(hourlyRate);
    const sr = parseFloat(perShiftRate);
    const tf = parseFloat(travelFee);

    if (!isNaN(hr) && hr > 0) rates.per_hour_rate = hr;
    if (!isNaN(sr) && sr > 0) rates.per_shift_rate = sr;
    if (!isNaN(tf) && tf > 0) rates.travel_fee = tf;

    onSelect(guard, rates);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-blue-50/60 to-white">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2.5">
          {isReassign ? "Re-Assign Guard" : "Assign New Guard"}
        </h2>
        <p className="text-[13px] text-slate-500 mt-1">Enter guard pay rates and select a guard to assign to this shift</p>
      </div>

      {/* Rate Inputs Section */}
      <div className="px-6 pt-5 pb-4 border-b border-slate-100">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-slate-700">Hourly Rate paid to Guard</Label>
            <div className="relative">
              <span className={cn("absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium", perShiftRate ? "text-slate-300" : "text-slate-400")}>$</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                placeholder="0.00"
                disabled={!!perShiftRate}
                className={cn(
                  "h-10 pl-7 bg-white border-slate-200 focus:border-[#0064cb] focus:ring-[#0064cb]/10 rounded-lg text-sm",
                  perShiftRate && "opacity-50 cursor-not-allowed bg-slate-50"
                )}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-slate-700">Per Shift Rate paid to Guard</Label>
            <div className="relative">
              <span className={cn("absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium", hourlyRate ? "text-slate-300" : "text-slate-400")}>$</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={perShiftRate}
                onChange={(e) => setPerShiftRate(e.target.value)}
                placeholder="0.00"
                disabled={!!hourlyRate}
                className={cn(
                  "h-10 pl-7 bg-white border-slate-200 focus:border-[#0064cb] focus:ring-[#0064cb]/10 rounded-lg text-sm",
                  hourlyRate && "opacity-50 cursor-not-allowed bg-slate-50"
                )}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-slate-700">Travel Fee paid to Guard</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">$</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={travelFee}
                onChange={(e) => setTravelFee(e.target.value)}
                placeholder="0.00"
                className="h-10 pl-7 bg-white border-slate-200 focus:border-[#0064cb] focus:ring-[#0064cb]/10 rounded-lg text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters Section */}
      <div className="px-6 pt-5 pb-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="space-y-1.5 flex-1">
            <Label className="text-[13px] font-medium text-slate-700">Search</Label>
            <div className="relative w-full">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name or email..."
                className="w-full h-10 bg-white border-slate-200 focus:border-[#0064cb] focus:ring-[#0064cb]/10 rounded-lg text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-800"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowMobileFilters(prev => !prev)}
            className="md:hidden self-end h-10 px-4 rounded-lg font-bold text-xs border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
          >
            <span>{showMobileFilters ? "Hide Filters" : "Show Filters"}</span>
            <span className={`transition-transform duration-200 text-[9px] ${showMobileFilters ? "rotate-180" : ""}`}>▼</span>
          </button>
        </div>

        <div className={cn(
          "grid grid-cols-1 md:grid-cols-5 gap-4 md:grid",
          showMobileFilters ? "grid" : "hidden"
        )}>
          <div className="space-y-1.5 w-full">
            <Label className="text-[13px] font-medium text-slate-700">Country</Label>
            <Select value={filters.country} onValueChange={(val) => setFilters(prev => ({ ...prev, country: val }))}>
              <SelectTrigger className="w-full !h-10 bg-white border-slate-200 focus:ring-[#0064cb]/10 focus:border-[#0064cb] rounded-lg">
                <SelectValue placeholder="Select Country" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 shadow-xl z-[200]">
                {locations.countries.map(country => (
                  <SelectItem key={country} value={country}>{country}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 w-full">
            <Label className="text-[13px] font-medium text-slate-700">State</Label>
            <Select value={filters.state} onValueChange={(val) => setFilters(prev => ({ ...prev, state: val }))}>
              <SelectTrigger className="w-full !h-10 bg-white border-slate-200 focus:ring-[#0064cb]/10 focus:border-[#0064cb] rounded-lg">
                <SelectValue placeholder="Select State" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 shadow-xl z-[200]">
                {locations.states.map(state => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 w-full">
            <Label className="text-[13px] font-medium text-slate-700">City</Label>
            <Select value={filters.city} onValueChange={(val) => setFilters(prev => ({ ...prev, city: val }))}>
              <SelectTrigger className="w-full !h-10 bg-white border-slate-200 focus:ring-[#0064cb]/10 focus:border-[#0064cb] rounded-lg">
                <SelectValue placeholder="Select City" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 shadow-xl z-[200]">
                {locations.cities.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 w-full">
            <Label className="text-[13px] font-medium text-slate-700">Status</Label>
            <Select value={filters.status} onValueChange={(val) => setFilters(prev => ({ ...prev, status: val }))}>
              <SelectTrigger className="w-full !h-10 bg-white border-slate-200 focus:ring-[#0064cb]/10 focus:border-[#0064cb] rounded-lg">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 shadow-xl z-[200]">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 w-full">
            <Label className="text-[13px] font-medium text-slate-700">Service</Label>
            <Select value={filters.service} onValueChange={(val) => setFilters(prev => ({ ...prev, service: val }))}>
              <SelectTrigger className="w-full !h-10 bg-white border-slate-200 focus:ring-[#0064cb]/10 focus:border-[#0064cb] rounded-lg">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 shadow-xl z-[200]">
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="both">Both</SelectItem>
                <SelectItem value="armed">Armed</SelectItem>
                <SelectItem value="unarmed">Unarmed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Guard Table */}
      <div className="px-6 pb-4">
        <div className="border border-slate-200 rounded-lg overflow-hidden flex flex-col min-h-[300px] bg-white shadow-sm">
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto custom-scrollbar-visible">
            <Table className="border-collapse min-w-[1200px]">
              <TableHeader className="bg-white sticky top-0 z-20">
                <TableRow className="hover:bg-transparent border-b border-slate-100">
                  <TableHead className="w-[140px] py-4 px-6 text-[11px] font-bold text-slate-700 uppercase tracking-wider border-r border-slate-100">ACTION</TableHead>
                  <TableHead className="w-[80px] text-[11px] font-bold text-slate-700 uppercase tracking-wider py-4 px-6 border-r border-slate-100 text-center">#</TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-700 uppercase tracking-wider py-4 px-6 border-r border-slate-100">NAME</TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-700 uppercase tracking-wider py-4 px-6 border-r border-slate-100">EMAIL</TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-700 uppercase tracking-wider py-4 px-6 border-r border-slate-100">PHONE NO.</TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-700 uppercase tracking-wider py-4 px-6 border-r border-slate-100 text-center">ARMED</TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-700 uppercase tracking-wider py-4 px-6 border-r border-slate-100 text-center">UNARMED</TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-700 uppercase tracking-wider py-4 px-6 border-r border-slate-100">ADDRESS</TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-700 uppercase tracking-wider py-4 px-6 border-r border-slate-100">LAST ACTIVE</TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-700 uppercase tracking-wider py-4 px-6">STATUS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingGuards ? (
                  <TableRow>
                    <TableCell colSpan={10} className="py-12 text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#0064cb]" />
                      <p className="text-xs text-slate-700 mt-2">Loading guards...</p>
                    </TableCell>
                  </TableRow>
                ) : guards.length > 0 ? (
                  guards.map((guard, index) => (
                    <TableRow key={guard.guard_id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <TableCell className="py-5 px-6 border-r border-slate-50/50">
                        <button
                          onClick={() => handleSelectGuard(guard)}
                          disabled={assigningGuardId === guard.guard_id}
                          className="cursor-pointer text-[13px] font-bold text-[#0064cb] hover:text-[#0052ae] flex items-center gap-2 transition-all disabled:opacity-50"
                        >
                          {assigningGuardId === guard.guard_id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                          Select Guard
                        </button>
                      </TableCell>
                      <TableCell className="text-[13px] text-slate-800 py-5 px-6 border-r border-slate-50/50 text-center">
                        {(currentPage - 1) * 10 + index + 1}
                      </TableCell>
                      <TableCell className="text-[13px] font-medium text-slate-600 py-5 px-6 border-r border-slate-50/50">
                        {guard.first_name} {guard.last_name}
                      </TableCell>
                      <TableCell className="text-[13px] text-slate-700 py-5 px-6 border-r border-slate-50/50">
                        {guard.email}
                      </TableCell>
                      <TableCell className="text-[13px] text-slate-700 py-5 px-6 border-r border-slate-50/50">
                        {guard.phone_number || "-"}
                      </TableCell>
                      <TableCell className="text-[13px] text-slate-700 py-5 px-6 border-r border-slate-50/50 text-center">
                        {guard.armed ? "Yes" : "No"}
                      </TableCell>
                      <TableCell className="text-[13px] text-slate-700 py-5 px-6 border-r border-slate-50/50 text-center">
                        {guard.unarmed ? "Yes" : "No"}
                      </TableCell>
                      <TableCell className="text-[13px] text-slate-700 py-5 px-6 border-r border-slate-50/50">
                        {guard.address || "-"}
                      </TableCell>
                      <TableCell className="text-[13px] text-slate-700 py-5 px-6 border-r border-slate-50/50">
                        {guard.last_active_at ? new Date(guard.last_active_at).toLocaleDateString() : "-"}
                      </TableCell>
                      <TableCell className="py-5 px-6">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                          guard.status ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                        )}>
                          {guard.status ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="py-8 text-center text-slate-700">No guards found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Footer with Cancel */}
      <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
        <button
          onClick={onClose}
          className="cursor-pointer h-9 px-5 rounded-lg text-sm font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-all"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
