"use client";

import {
  clientFetchGuardsAction
} from "@/lib/client-actions";
import { useState, useEffect } from "react";
import { X, Search, XCircle } from "lucide-react";
import { fetchLocationAction, } from "@/actions/dashboard.actions";
import useDebounceValue from "@/hooks/use-debounce";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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

interface SelectUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (guard: any, rates: { hourlyRate?: number; travelFee?: number; flatQcRate?: number }) => void;
  selectedShiftIds?: string[];
  assigningGuardId?: string | null;
  mode?: "lead" | "standby";
}

export function SelectUserDialog({ isOpen, onClose, onSelect, selectedShiftIds, assigningGuardId, mode = "lead" }: SelectUserDialogProps) {
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userFilters, setUserFilters] = useState({
    country: "All Country",
    state: "All State",
    city: "All City",
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
  const debouncedSearchQuery = useDebounceValue(userSearchQuery, 500);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const [hourlyRate, setHourlyRate] = useState("");
  const [travelFee, setTravelFee] = useState("");
  const [flatQcRate, setFlatQcRate] = useState("");

  useEffect(() => {
    if (isOpen) {
      setHourlyRate("");
      setTravelFee("");
      setFlatQcRate("");
    }
  }, [isOpen]);

  const handleSelectGuard = (guard: any) => {
    const rates: { hourlyRate?: number; travelFee?: number; flatQcRate?: number } = {};
    if (mode === "lead") {
      const hr = parseFloat(hourlyRate);
      const tf = parseFloat(travelFee);
      if (!isNaN(hr) && hr > 0) rates.hourlyRate = hr;
      if (!isNaN(tf) && tf > 0) rates.travelFee = tf;
    } else {
      const fqr = parseFloat(flatQcRate);
      if (!isNaN(fqr) && fqr > 0) rates.flatQcRate = fqr;
    }
    onSelect(guard, rates);
  };

  useEffect(() => {
    if (isOpen) {
      const loadLocations = async () => {
        const res = await fetchLocationAction(userFilters.country, userFilters.state, "approved");
        if (res.success && res.data) {
          setLocations({
            countries: ["All Country", ...res.data.countries],
            states: ["All State", ...res.data.states],
            cities: ["All City", ...res.data.cities]
          });
        }
      };
      loadLocations();
    }
  }, [isOpen, userFilters.country, userFilters.state]);

  useEffect(() => {
    if (isOpen) {
      const loadGuards = async () => {
        setIsLoadingGuards(true);
        let armed = "";
        let unarmed = "";
        if (userFilters.service === "armed") armed = "true";
        if (userFilters.service === "unarmed") unarmed = "true";
        if (userFilters.service === "both") { armed = "true"; unarmed = "true"; }

        const res = await clientFetchGuardsAction({
          page: currentPage,
          search: debouncedSearchQuery,
          status: userFilters.status === "all" ? "" : userFilters.status,
          city: userFilters.city,
          state: userFilters.state,
          country: userFilters.country,
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
    }
  }, [isOpen, currentPage, debouncedSearchQuery, userFilters]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] 2xl:max-w-7xl p-0 overflow-hidden border-none shadow-2xl rounded-xl bg-white max-h-[90vh] flex flex-col sm:left-[calc(50%+35px)]">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-50">
          <div>
            <DialogTitle className="text-xl font-bold text-slate-900">
              {mode === "lead" ? "Select Lead Guard" : "Select Standby Guard"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Search and select a guard to assign to the selected shifts.
            </DialogDescription>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-700 hover:text-slate-600 hover:rotate-90 duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 pt-0 pb-0 space-y-6 flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="space-y-3">
            {mode === "lead" ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="hourly_rate" className="text-[13px] font-medium text-slate-700">Hourly Rate Paid to Guard</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">$</span>
                    <Input
                      id="hourly_rate"
                      type="number"
                      min="0"
                      step="0.01"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      placeholder="0.00"
                      className="h-10 pl-7 bg-white border-slate-200 focus:border-[#0064cb] focus:ring-[#0064cb]/10 rounded-lg text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="travel_fee" className="text-[13px] font-medium text-slate-700">Travel Fee Paid to Guard</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">$</span>
                    <Input
                      id="travel_fee"
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
                <div className="flex flex-col sm:flex-row gap-3 items-end">
                  <div className="space-y-1.5 flex-1 w-full">
                    <Label className="text-[13px] font-medium text-slate-700">Search</Label>
                    <div className="relative w-full">
                      <Input
                        value={userSearchQuery || ""}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        placeholder="Search name or email..."
                        className="w-full h-10 bg-white border-slate-200 focus:border-[#0064cb] focus:ring-[#0064cb]/10 rounded-lg text-sm"
                      />
                      {userSearchQuery && (
                        <button
                          onClick={() => setUserSearchQuery("")}
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
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="flat_qc_rate" className="text-[13px] font-medium text-slate-700">Flat QC Rate to Guard</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">$</span>
                    <Input
                      id="flat_qc_rate"
                      type="number"
                      min="0"
                      step="0.01"
                      value={flatQcRate}
                      onChange={(e) => setFlatQcRate(e.target.value)}
                      placeholder="0.00"
                      className="h-10 pl-7 bg-white border-slate-200 focus:border-[#0064cb] focus:ring-[#0064cb]/10 rounded-lg text-sm"
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 items-end">
                  <div className="space-y-1.5 flex-1 w-full">
                    <Label className="text-[13px] font-medium text-slate-700">Search</Label>
                    <div className="relative w-full">
                      <Input
                        value={userSearchQuery || ""}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        placeholder="Search name or email..."
                        className="w-full h-10 bg-white border-slate-200 focus:border-[#0064cb] focus:ring-[#0064cb]/10 rounded-lg text-sm"
                      />
                      {userSearchQuery && (
                        <button
                          onClick={() => setUserSearchQuery("")}
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
              </div>
            )}

            <div className={cn(
              "grid grid-cols-1 md:grid-cols-5 gap-4 md:grid",
              showMobileFilters ? "grid" : "hidden"
            )}>
              <div className="space-y-1.5 w-full">
                <Label className="text-[13px] font-medium text-slate-700">Country</Label>
                <Select value={userFilters.country} onValueChange={(val) => setUserFilters(prev => ({ ...prev, country: val }))}>
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
                <Select value={userFilters.state} onValueChange={(val) => setUserFilters(prev => ({ ...prev, state: val }))}>
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
                <Select value={userFilters.city} onValueChange={(val) => setUserFilters(prev => ({ ...prev, city: val }))}>
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
                <Select value={userFilters.status} onValueChange={(val) => setUserFilters(prev => ({ ...prev, status: val }))}>
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
                <Select value={userFilters.service} onValueChange={(val) => setUserFilters(prev => ({ ...prev, service: val }))}>
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

          <div className="border border-slate-200 rounded-lg overflow-hidden flex flex-col flex-1 min-h-[150px] bg-white shadow-sm">
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto custom-scrollbar-visible">
              <Table className="border-collapse min-w-[1200px]" scrollbarClass="custom-scrollbar-visible">
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
                            {mode === "lead" ? "Select Lead Guard" : "Select Standby Guard"}
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

        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end bg-white">
          <button
            onClick={onClose}
            className="cursor-pointer text-sm font-bold text-[#0064cb] hover:text-[#0052ae] transition-colors"
          >
            Cancel
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
