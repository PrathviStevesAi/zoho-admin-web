"use client";

import { useState, useEffect } from "react";
import { Loader2, Check, ChevronRight, Search, XCircle, UserCheck, CalendarDays } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { findAvailableGuardsAction, fetchGuardsAction } from "@/actions/dashboard.actions";
import useDebounceValue from "@/hooks/use-debounce";

interface AvailableGuardsModuleProps {
  invoiceId: string;
  guards: any[];
  shifts: any[];
  isLoading: boolean;
  onBack: () => void;
  onRefresh: () => void;
  totalGuards: number;
}

export function AvailableGuardsModule({
  invoiceId,
  guards: results,
  shifts,
  isLoading: isResultsLoading,
  onBack,
  onRefresh,
  totalGuards
}: AvailableGuardsModuleProps) {
  // 0: Results, 1: Select Shifts, 2: Select Guards, 3: Finalize/Find
  const [activeStep, setActiveStep] = useState(0);
  const [selectedShiftIds, setSelectedShiftIds] = useState<string[]>([]);
  const [selectedGuardIds, setSelectedGuardIds] = useState<string[]>([]);

  // Guard Selection State
  const [allGuards, setAllGuards] = useState<any[]>([]);
  const [isGuardsLoading, setIsGuardsLoading] = useState(false);
  const [isFinding, setIsFinding] = useState(false);

  // Filters State
  const [guardSearchQuery, setGuardSearchQuery] = useState("");
  const [guardFilters, setGuardFilters] = useState({
    radiusMiles: "all",
    status: "all",
    service: "All"
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const debouncedSearchQuery = useDebounceValue(guardSearchQuery, 500);

  // Load Guards with Filters
  useEffect(() => {
    if (activeStep === 2) {
      loadGuards();
    }
  }, [activeStep, currentPage, debouncedSearchQuery, guardFilters]);

  const loadGuards = async () => {
    setIsGuardsLoading(true);
    let armed = "";
    let unarmed = "";
    if (guardFilters.service === "armed") armed = "true";
    if (guardFilters.service === "unarmed") unarmed = "true";
    if (guardFilters.service === "both") { armed = "true"; unarmed = "true"; }

    const isFiltered =
      debouncedSearchQuery !== "" ||
      guardFilters.radiusMiles !== "all" ||
      guardFilters.status !== "all" ||
      guardFilters.service !== "All";

    const res = await fetchGuardsAction({
      page: isFiltered ? undefined : currentPage,
      search: debouncedSearchQuery,
      status: guardFilters.status === "all" ? "" : guardFilters.status,
      armed,
      unarmed,
      invoice_id: guardFilters.radiusMiles === "all" ? undefined : invoiceId,
      radius_miles: guardFilters.radiusMiles === "all" ? "" : guardFilters.radiusMiles
    });

    if (res.success) {
      setAllGuards(res.data);
      setPagination(res.pagination);
    } else {
      toast.error(res.error || "Failed to load guards");
    }
    setIsGuardsLoading(false);
  };

  const handleSelectShift = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedShiftIds(prev => [...prev, id]);
    } else {
      setSelectedShiftIds(prev => prev.filter(i => i !== id));
    }
  };

  const handleSelectAllShifts = (checked: boolean) => {
    if (checked) {
      setSelectedShiftIds(shifts.map(s => s.shift_id));
    } else {
      setSelectedShiftIds([]);
    }
  };

  const handleSelectGuard = (id: string, checked: boolean) => {
    console.log("Selected Guard ID:", id);
    if (checked) {
      setSelectedGuardIds(prev => [...prev, id]);
    } else {
      setSelectedGuardIds(prev => prev.filter(i => i !== id));
    }
  };

  const handleSelectAllGuards = (checked: boolean) => {
    if (checked) {
      setSelectedGuardIds(allGuards.map(g => g.guard_id));
    } else {
      setSelectedGuardIds([]);
    }
  };

  const handleFind = async () => {
    if (selectedShiftIds.length === 0) {
      toast.error("Please select at least one shift");
      setActiveStep(1);
      return;
    }
    if (selectedGuardIds.length === 0) {
      toast.error("Please select at least one guard");
      setActiveStep(2);
      return;
    }

    setIsFinding(true);
    const res = await findAvailableGuardsAction({
      invoice_id: invoiceId,
      shift_ids: selectedShiftIds,
      guard_ids: selectedGuardIds
    });

    if (res.success) {
      toast.success("Find request sent successfully");
      onRefresh();
      setActiveStep(0);
      setSelectedShiftIds([]);
      setSelectedGuardIds([]);
    } else {
      toast.error(res.error || "Failed to find available guards");
    }
    setIsFinding(false);
  };

  const resetFilters = () => {
    setGuardSearchQuery("");
    setGuardFilters({
      radiusMiles: "20",
      status: "all",
      service: "All"
    });
    setCurrentPage(1);
  };

  const formatArray = (arr: any[] | null) => {
    if (!arr || arr.length === 0) return "----";
    return arr.join(", ");
  };

  const renderStepper = () => (
    <div className="flex items-center justify-center py-3 px-4">
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Step 1 Button */}
        <button
          onClick={() => setActiveStep(1)}
          disabled={activeStep === 1}
          className={cn(
            "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 rounded-full transition-all cursor-pointer",
            activeStep === 1
              ? "bg-[#0064cb] text-white shadow-md shadow-blue-200"
              : "bg-white text-slate-600 border border-slate-200 hover:border-[#0064cb] hover:text-[#0064cb]"
          )}
        >
          <div className={cn(
            "w-5.5 h-5.5 rounded-full flex items-center justify-center font-bold text-[11px]",
            activeStep === 1 ? "bg-white/20" : "bg-slate-100"
          )}>
            1
          </div>
          <span className="text-xs font-bold tracking-wider hidden sm:inline">Select Shift</span>
        </button>

        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />

        {/* Step 2 Button */}
        <button
          onClick={() => {
            if (selectedShiftIds.length === 0 && activeStep !== 2) {
              toast.error("Please select shifts first");
              return;
            }
            setActiveStep(2);
          }}
          disabled={activeStep === 2 || (activeStep === 0)}
          className={cn(
            "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 rounded-full transition-all",
            activeStep === 2
              ? "bg-[#0064cb] text-white shadow-md shadow-blue-200"
              : activeStep === 1
                ? "bg-white text-slate-600 border border-slate-200 hover:border-[#0064cb] hover:text-[#0064cb] cursor-pointer"
                : "bg-slate-50 text-slate-700 border border-slate-300 opacity-60 cursor-not-allowed"
          )}
        >
          <div className={cn(
            "w-5.5 h-5.5 rounded-full flex items-center justify-center font-bold text-[11px]",
            activeStep === 2 ? "bg-white/20" : "bg-slate-100"
          )}>
            2
          </div>
          <span className="text-xs font-bold tracking-wider hidden sm:inline">Select Guard</span>
        </button>

        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />

        {/* Step 3 Button (Find) */}
        <button
          onClick={() => {
            if (selectedShiftIds.length === 0) {
              toast.error("Please select shifts first");
              return;
            }
            if (selectedGuardIds.length === 0) {
              toast.error("Please select guards first");
              return;
            }
            setActiveStep(3);
          }}
          disabled={activeStep === 3 || activeStep === 0 || activeStep === 1}
          className={cn(
            "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 rounded-full transition-all",
            activeStep === 3
              ? "bg-[#0064cb] text-white shadow-md shadow-blue-200"
              : activeStep === 2
                ? "bg-white text-slate-600 border border-slate-200 hover:border-[#0064cb] hover:text-[#0064cb] cursor-pointer"
                : "bg-slate-50 text-slate-700 border border-slate-300 opacity-60 cursor-not-allowed"
          )}
        >
          <div className={cn(
            "w-5.5 h-5.5 rounded-full flex items-center justify-center font-bold text-[11px]",
            activeStep === 3 ? "bg-white/20" : "bg-slate-100"
          )}>
            3
          </div>
          <span className="text-xs font-bold tracking-wider hidden sm:inline">Find</span>
        </button>
      </div>
    </div>
  );

  const renderFilters = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-6 py-4 bg-slate-50/50 border-b border-slate-100">
      <div className="space-y-1.5 w-full">
        <Label className="text-[13px] font-medium text-slate-700">Search</Label>
        <div className="relative w-full">
          <Input
            value={guardSearchQuery}
            onChange={(e) => setGuardSearchQuery(e.target.value)}
            placeholder="Search name or email..."
            className="w-full h-10 bg-white border-slate-200 focus:border-[#0064cb] focus:ring-[#0064cb]/10 rounded-lg text-sm"
          />
          {guardSearchQuery && (
            <button
              onClick={() => setGuardSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-800 cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-1.5 w-full">
        <Label className="text-[13px] font-medium text-slate-700">Find Guard Within</Label>
        <Select value={guardFilters.radiusMiles} onValueChange={(val) => setGuardFilters(prev => ({ ...prev, radiusMiles: val }))}>
          <SelectTrigger className="w-full !h-10 bg-white border-slate-200 rounded-lg cursor-pointer">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent className="bg-white border-slate-200 shadow-xl cursor-pointer">
            <SelectItem value="all" className="cursor-pointer">All</SelectItem>
            <SelectItem value="10" className="cursor-pointer">10 Miles</SelectItem>
            <SelectItem value="20" className="cursor-pointer">20 Miles</SelectItem>
            <SelectItem value="30" className="cursor-pointer">30 Miles</SelectItem>
            <SelectItem value="40" className="cursor-pointer">40 Miles</SelectItem>
            <SelectItem value="50" className="cursor-pointer">50 Miles</SelectItem>
            <SelectItem value="60" className="cursor-pointer">60 Miles</SelectItem>
            <SelectItem value="70" className="cursor-pointer">70 Miles</SelectItem>
            <SelectItem value="80" className="cursor-pointer">80 Miles</SelectItem>
            <SelectItem value="90" className="cursor-pointer">90 Miles</SelectItem>
            <SelectItem value="100" className="cursor-pointer">100 Miles</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5 w-full">
        <Label className="text-[13px] font-medium text-slate-700">Status</Label>
        <Select value={guardFilters.status} onValueChange={(val) => setGuardFilters(prev => ({ ...prev, status: val }))}>
          <SelectTrigger className="w-full !h-10 bg-white border-slate-200 rounded-lg cursor-pointer">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent className="bg-white border-slate-200 shadow-xl cursor-pointer">
            <SelectItem value="all" className="cursor-pointer">All Status</SelectItem>
            <SelectItem value="true" className="cursor-pointer">Active</SelectItem>
            <SelectItem value="false" className="cursor-pointer">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5 w-full">
        <Label className="text-[13px] font-medium text-slate-700">Service</Label>
        <Select value={guardFilters.service} onValueChange={(val) => setGuardFilters(prev => ({ ...prev, service: val }))}>
          <SelectTrigger className="w-full !h-10 bg-white border-slate-200 rounded-lg cursor-pointer">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent className="bg-white border-slate-200 shadow-xl cursor-pointer">
            <SelectItem value="All" className="cursor-pointer">All</SelectItem>
            <SelectItem value="both" className="cursor-pointer">Both</SelectItem>
            <SelectItem value="armed" className="cursor-pointer">Armed</SelectItem>
            <SelectItem value="unarmed" className="cursor-pointer">Unarmed</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {renderStepper()}

      <Card className="border-slate-200 shadow-sm overflow-hidden rounded-xl bg-white max-w-7xl mx-auto">
        <CardContent className="p-0">
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900">
                {activeStep === 0 ? "Available Guards" : activeStep === 1 ? "Select Shifts" : activeStep === 2 ? "Select Guards" : "Finalize Search"}
              </h2>
              <p className="text-sm text-slate-600 mt-0.5 font-medium">
                {activeStep === 0 ? (
                  <>Total available guards found: <span className="font-semibold text-[#0064cb]">{totalGuards}</span></>
                ) : activeStep === 1 ? (
                  "You can select multiple shifts"
                ) : activeStep === 2 ? (
                  "Select guards for the search"
                ) : (
                  "Review your selection and find available guards"
                )}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={activeStep === 0 ? onBack : () => {
                setActiveStep(0);
                resetFilters();
              }}
              className="px-6 h-10 rounded-lg font-bold text-slate-600 border-slate-200 hover:bg-slate-50 transition-all cursor-pointer w-full sm:w-auto text-center shrink-0"
            >
              {activeStep === 0 ? "Back" : "Cancel"}
            </Button>
          </div>

          {activeStep === 2 && renderFilters()}

          <div className="p-0">
            {activeStep === 0 ? (
              /* RESULTS VIEW */
              <div className="overflow-x-auto custom-scrollbar w-full">
                <Table className="min-w-[900px] md:min-w-full">
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="hover:bg-transparent border-slate-100">
                      <TableHead className="text-[11px] font-bold text-slate-800 uppercase py-2.5 px-4">Guard Name</TableHead>
                      <TableHead className="text-[11px] font-bold text-slate-800 uppercase py-2.5 px-4">Email</TableHead>
                      <TableHead className="text-[11px] font-bold text-slate-800 uppercase py-2.5 px-4 text-center">Total Shifts Sent</TableHead>
                      <TableHead className="text-[11px] font-bold text-slate-800 uppercase py-2.5 px-4 text-center">Available For Shifts</TableHead>
                      <TableHead className="text-[11px] font-bold text-slate-800 uppercase py-2.5 px-4 text-center">Unavailable For Shifts</TableHead>
                      <TableHead className="text-[11px] font-bold text-slate-800 uppercase py-2.5 px-4 text-center">Seen</TableHead>
                      <TableHead className="text-[11px] font-bold text-slate-800 uppercase py-2.5 px-4 text-center">Responded</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isResultsLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-10 text-center">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#0064cb]" />
                        </TableCell>
                      </TableRow>
                    ) : results.length > 0 ? (
                      results.map((guard, index) => (
                        <TableRow key={guard.notification_id || index} className="border-slate-50 hover:bg-slate-50/30 transition-colors">
                          <TableCell className="py-2.5 px-4 text-sm font-bold text-slate-700">{guard.guard_name}</TableCell>
                          <TableCell className="py-2.5 px-4 text-sm font-medium text-slate-800">{guard.email}</TableCell>
                          <TableCell className="py-2.5 px-4 text-center">
                            <span className="text-xs font-medium text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md">
                              {formatArray(guard.total_shifts_sent)}
                            </span>
                          </TableCell>
                          <TableCell className="py-2.5 px-4 text-center">
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
                              {formatArray(guard.available_for_shifts)}
                            </span>
                          </TableCell>
                          <TableCell className="py-2.5 px-4 text-center">
                            <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-md">
                              {formatArray(guard.unavailable_for_shifts)}
                            </span>
                          </TableCell>
                          <TableCell className="py-2.5 px-4 text-center">
                            <span className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                              guard.notification_seen ? "bg-blue-50 text-blue-600" : "bg-slate-50 text-slate-700"
                            )}>
                              {guard.notification_seen ? "Seen" : "Unseen"}
                            </span>
                          </TableCell>
                          <TableCell className="py-2.5 px-4 text-center">
                            <span className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                              guard.is_responded ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-700"
                            )}>
                              {guard.is_responded ? "Responded" : "No Response"}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="py-8 text-center text-slate-700 font-medium">No available guards found for this invoice.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            ) : activeStep === 1 ? (
              /* SHIFT SELECTION VIEW */
              <div className="overflow-x-auto custom-scrollbar w-full">
                <Table className="min-w-[650px] md:min-w-full">
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="hover:bg-transparent border-slate-100">
                      <TableHead className="w-[60px] py-2.5 px-4 text-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-slate-300 text-[#0064cb] focus:ring-[#0064cb] cursor-pointer"
                          checked={shifts.length > 0 && selectedShiftIds.length === shifts.length}
                          onChange={(e) => handleSelectAllShifts(e.target.checked)}
                        />
                      </TableHead>
                      <TableHead className="text-[11px] font-bold text-slate-800 uppercase py-2.5 px-4">Shift No.</TableHead>
                      <TableHead className="text-[11px] font-bold text-slate-800 uppercase py-2.5 px-4">Service Name</TableHead>
                      <TableHead className="text-[11px] font-bold text-slate-800 uppercase py-2.5 px-4">Start Time</TableHead>
                      <TableHead className="text-[11px] font-bold text-slate-800 uppercase py-2.5 px-4">End Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shifts.length > 0 ? (
                      shifts.map((shift) => (
                        <TableRow key={shift.shift_id} className="border-slate-50 hover:bg-slate-50/30 transition-colors">
                          <TableCell className="py-2.5 px-4 text-center">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded border-slate-300 text-[#0064cb] focus:ring-[#0064cb] cursor-pointer"
                              checked={selectedShiftIds.includes(shift.shift_id)}
                              onChange={(e) => handleSelectShift(shift.shift_id, e.target.checked)}
                            />
                          </TableCell>
                          <TableCell className="text-sm font-bold text-slate-700 py-2.5 px-4">{shift.shift_no}</TableCell>
                          <TableCell className="text-sm font-medium text-slate-800 py-2.5 px-4">{shift.service_name}</TableCell>
                          <TableCell className="text-sm font-medium text-slate-800 py-2.5 px-4">
                            {new Date(shift.start_time).toLocaleDateString()}<br />
                            <span className="text-[11px] text-slate-700">{new Date(shift.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </TableCell>
                          <TableCell className="text-sm font-medium text-slate-800 py-2.5 px-4">
                            {new Date(shift.end_time).toLocaleDateString()}<br />
                            <span className="text-[11px] text-slate-700">{new Date(shift.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="py-8 text-center text-slate-700 font-medium">
                          No shifts found for this invoice. Please schedule shifts first.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            ) : activeStep === 2 ? (
              /* GUARD SELECTION VIEW */
              <div className="overflow-x-auto custom-scrollbar w-full">
                <Table className="min-w-[1200px] md:min-w-full">
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="hover:bg-transparent border-slate-100">
                      <TableHead className="w-[60px] py-2.5 px-4 text-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-slate-300 text-[#0064cb] focus:ring-[#0064cb] cursor-pointer"
                          checked={allGuards.length > 0 && selectedGuardIds.length === allGuards.length}
                          onChange={(e) => handleSelectAllGuards(e.target.checked)}
                        />
                      </TableHead>
                      <TableHead className="w-[60px] text-[11px] font-bold text-slate-800 uppercase py-2.5 px-4 text-center">#</TableHead>
                      <TableHead className="text-[11px] font-bold text-slate-800 uppercase py-2.5 px-4">NAME</TableHead>
                      <TableHead className="text-[11px] font-bold text-slate-800 uppercase py-2.5 px-4">EMAIL</TableHead>
                      <TableHead className="text-[11px] font-bold text-slate-800 uppercase py-2.5 px-4">PHONE NO.</TableHead>
                      <TableHead className="text-[11px] font-bold text-slate-800 uppercase py-2.5 px-4 text-center">ARMED</TableHead>
                      <TableHead className="text-[11px] font-bold text-slate-800 uppercase py-2.5 px-4 text-center">UNARMED</TableHead>
                      <TableHead className="text-[11px] font-bold text-slate-800 uppercase py-2.5 px-4">ADDRESS</TableHead>
                      <TableHead className="text-[11px] font-bold text-slate-800 uppercase py-2.5 px-4">AWAY DISTANCE (Miles)</TableHead>
                      <TableHead className="text-[11px] font-bold text-slate-800 uppercase py-2.5 px-4">STATUS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isGuardsLoading ? (
                      <TableRow>
                        <TableCell colSpan={10} className="py-10 text-center">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#0064cb]" />
                        </TableCell>
                      </TableRow>
                    ) : allGuards.length > 0 ? (
                      allGuards.map((guard, index) => (
                        <TableRow key={guard.guard_id} className="border-slate-50 hover:bg-slate-50/30 transition-colors">
                          <TableCell className="py-2.5 px-4 text-center">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded border-slate-300 text-[#0064cb] focus:ring-[#0064cb] cursor-pointer"
                              checked={selectedGuardIds.includes(guard.guard_id)}
                              onChange={(e) => handleSelectGuard(guard.guard_id, e.target.checked)}
                            />
                          </TableCell>
                          <TableCell className="text-[13px] text-slate-800 py-2.5 px-4 text-center">
                            {(currentPage - 1) * (pagination?.limit || 10) + index + 1}
                          </TableCell>
                          <TableCell className="text-[13px] font-bold text-slate-700 py-2.5 px-4">
                            {guard.first_name} {guard.last_name}
                          </TableCell>
                          <TableCell className="text-sm font-medium text-slate-700 py-2.5 px-4">{guard.email}</TableCell>
                          <TableCell className="text-sm font-medium text-slate-700 py-2.5 px-4">{guard.phone_number || "-"}</TableCell>
                          <TableCell className="py-2.5 px-4 text-center text-sm text-slate-700">{guard.armed ? "Yes" : "No"}</TableCell>
                          <TableCell className="py-2.5 px-4 text-center text-sm text-slate-700">{guard.unarmed ? "Yes" : "No"}</TableCell>
                          <TableCell className="text-sm font-medium text-slate-700 py-2.5 px-4 max-w-[200px] truncate">{guard.address || "--"}</TableCell>
                          <TableCell className="text-sm font-medium text-slate-700 py-2.5 px-4">{guard.distance_miles ?? "--"}</TableCell>
                          <TableCell className="py-2.5 px-4">
                            <span className={cn(
                              "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                              guard.status ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                            )}>
                              {guard.status ? "Active" : "Inactive"}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={10} className="py-6 text-center text-slate-700 font-medium">No guards found matching filters.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            ) : (
              /* STEP 3: FINALIZE VIEW */
              <div className="p-8 text-center space-y-8 animate-in fade-in duration-500">
                <div className="max-w-2xl mx-auto space-y-6">
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8">
                    <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 flex flex-col items-center gap-3 w-48 shadow-sm">
                      <div className="w-12 h-12 bg-blue-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                        <CalendarDays className="w-6 h-6" />
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-blue-600 leading-none">{selectedShiftIds.length}</p>
                        <p className="text-[12px] font-bold text-blue-400 tracking-widest mt-1">Shifts Selected</p>
                      </div>
                    </div>

                    <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 flex flex-col items-center gap-3 w-48 shadow-sm">
                      <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
                        <UserCheck className="w-6 h-6" />
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-emerald-600 leading-none">{selectedGuardIds.length}</p>
                        <p className="text-[12px] font-bold text-emerald-400 tracking-widest mt-1">Guards Selected</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-slate-900">Ready to find?</h3>
                    <p className="text-sm text-slate-600 leading-relaxed px-4">
                      We will notify the selected guards about these shifts to check their availability.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto px-6 sm:px-0">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setActiveStep(2);
                      resetFilters();
                    }}
                    className="h-12 px-8 rounded-xl font-bold text-slate-600 border-slate-200 hover:bg-slate-50 cursor-pointer transition-all w-full sm:w-auto flex justify-center items-center"
                  >
                    Back to Guards
                  </Button>
                  <Button
                    onClick={handleFind}
                    disabled={isFinding}
                    className="h-12 px-12 bg-[#0064cb] hover:bg-[#0052ae] text-white rounded-xl font-bold shadow-xl shadow-[#0064cb]/20 cursor-pointer transition-all active:scale-95 flex gap-2 w-full sm:w-auto justify-center items-center"
                  >
                    {isFinding ? <Loader2 className="w-5 h-5 animate-spin" /> : "Find Guards"}
                  </Button>
                </div>
              </div>
            )}

            {/* Footer Actions for Steps 1 and 2 */}
            {(activeStep === 1 || activeStep === 2) && (
              <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4 w-full">
                {activeStep === 1 ? (
                  <Button
                    onClick={() => {
                      if (selectedShiftIds.length === 0) {
                        toast.error("Please select shifts first");
                      } else {
                        setActiveStep(2);
                      }
                    }}
                    className="bg-[#0064cb] hover:bg-[#0052ae] text-white px-8 h-11 rounded-lg font-bold shadow-lg shadow-[#0064cb]/20 transition-all cursor-pointer w-full sm:w-auto flex justify-center items-center"
                  >
                    Go to Step 2
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setActiveStep(1)}
                      className="px-6 h-11 rounded-lg font-bold text-slate-600 border-slate-200 cursor-pointer w-full sm:w-auto text-center"
                    >
                      Back to Step 1
                    </Button>
                    <Button
                      onClick={() => {
                        if (selectedGuardIds.length === 0) {
                          toast.error("Please select guards first");
                        } else {
                          setActiveStep(3);
                          resetFilters();
                        }
                      }}
                      className="bg-[#0064cb] hover:bg-[#0052ae] text-white px-8 h-11 rounded-lg font-bold shadow-lg shadow-[#0064cb]/20 transition-all cursor-pointer w-full sm:w-auto flex justify-center items-center"
                    >
                      Go to Step 3
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
