"use client";

import { useState, useEffect } from "react";
import { Loader2, Plus, X } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface AssignmentModuleProps {
  shifts: any[];
  isLoading: boolean;
  onDeleteShift: (id: string) => void;
  onUnassignGuard: (shiftOfferId: string, type: "lead_guard" | "standby_guard") => void;
  onOpenSelectUser: (selectedIds: string[], type: "lead" | "standby") => void;
  onBack: () => void;
  pendingAssignments: Record<string, { guard_id: string, guard_name: string, hourlyRate?: number, travelFee?: number, type?: "lead" | "standby", flatQcRate?: number }>;
  onAdd: (shiftRates: Record<string, { hourlyRate?: number; perShiftRate?: number; travelFee?: number }>, clearSelection?: () => void) => void;
  isAssigning: boolean;
  onRemovePendingAssignment?: (shiftId: string) => void;
}

export function AssignmentModule({
  shifts,
  isLoading,
  onUnassignGuard,
  onOpenSelectUser,
  onBack,
  pendingAssignments,
  onAdd,
  isAssigning,
  onRemovePendingAssignment
}: AssignmentModuleProps) {
  const [selectedShifts, setSelectedShifts] = useState<string[]>([]);
  const [hourlyRate, setHourlyRate] = useState<string>("");
  const [travelFee, setTravelFee] = useState<string>("");
  const [shiftRates, setShiftRates] = useState<Record<string, { hourlyRate?: number; travelFee?: number }>>({});

  const formatPrice = (val: any) => {
    if (val === null || val === undefined || val === "") return "----";
    const num = Number(val);
    if (isNaN(num)) return "----";
    return `$${num.toFixed(2)}`;
  };

  useEffect(() => {
    setSelectedShifts(prev => prev.filter(id => !pendingAssignments[id]));

    if (Object.keys(pendingAssignments).length === 0) {
      setHourlyRate("");
      setTravelFee("");
      setShiftRates({});
    } else {
      setShiftRates(prev => {
        const next = { ...prev };
        let changed = false;
        Object.keys(pendingAssignments).forEach(id => {
          if (!next[id]) {
            next[id] = {
              hourlyRate: hourlyRate !== "" ? Number(hourlyRate) : undefined,
              travelFee: travelFee !== "" ? Number(travelFee) : undefined,
            };
            changed = true;
          }
        });

        Object.keys(next).forEach(id => {
          if (!pendingAssignments[id]) {
            delete next[id];
            changed = true;
          }
        });

        return changed ? next : prev;
      });
    }
  }, [pendingAssignments, hourlyRate, travelFee]);

  const handleGlobalHourlyRateChange = (val: string) => {
    setHourlyRate(val);
    const rateVal = val !== "" ? Number(val) : undefined;
    setShiftRates(prev => {
      const next = { ...prev };
      Object.keys(pendingAssignments).forEach(shiftId => {
        next[shiftId] = {
          ...next[shiftId],
          hourlyRate: rateVal
        };
      });
      return next;
    });
  };

  const selectableShifts = shifts.filter(s => !s.guard && !pendingAssignments[s.shift_id]);
  const isAllSelected = selectableShifts.length > 0 && selectableShifts.every(s => selectedShifts.includes(s.shift_id));
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedShifts(selectableShifts.map(s => s.shift_id));
    } else {
      setSelectedShifts([]);
    }
  };

  const handleSelectRow = (shiftId: string, checked: boolean) => {
    if (checked) {
      setSelectedShifts(prev => [...prev, shiftId]);
    } else {
      setSelectedShifts(prev => prev.filter(id => id !== shiftId));
    }
  };

  const hasPending = Object.keys(pendingAssignments).length > 0;
  
  const isLeadDisabled = selectedShifts.length === 0 || hasPending || selectedShifts.some(id => {
    const s = shifts.find(x => x.shift_id === id);
    return s && (s.lead_guard || s.guard);
  });

  const isStandbyDisabled = selectedShifts.length === 0 || hasPending || selectedShifts.some(id => {
    const s = shifts.find(x => x.shift_id === id);
    return s && (s.secondary_guard || s.standby_guard || s.qc_guard || (s.standby_guards && s.standby_guards.length > 0));
  });

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <Card className="border-slate-200 shadow-sm overflow-hidden rounded-xl bg-white w-full">
        <CardContent className="p-0">
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col gap-1 bg-white">
            <h2 className="text-xl font-bold text-slate-900">Select guards for shifts</h2>
          </div>

          <div className="w-full bg-white">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-slate-700">Select guards for shifts</h3>
              <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
                <Button
                  variant="outline"
                  className={cn(
                    "text-[#0064cb] border-[#0064cb] hover:bg-blue-50 h-9 rounded-lg px-4 font-bold text-xs flex gap-2 transition-all cursor-pointer w-full sm:w-auto justify-center items-center shrink-0",
                    isLeadDisabled && "opacity-50 pointer-events-none grayscale"
                  )}
                  onClick={() => onOpenSelectUser(selectedShifts, "lead")}
                  disabled={isLeadDisabled}
                >
                  Assign Lead Guard <Plus className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="outline"
                  className={cn(
                    "text-amber-600 border-amber-600 hover:bg-amber-50 h-9 rounded-lg px-4 font-bold text-xs flex gap-2 transition-all cursor-pointer w-full sm:w-auto justify-center items-center shrink-0",
                    isStandbyDisabled && "opacity-50 pointer-events-none grayscale"
                  )}
                  onClick={() => onOpenSelectUser(selectedShifts, "standby")}
                  disabled={isStandbyDisabled}
                >
                  Assign Standby Guard <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            <div className="w-full">
              <Table
                className="w-full border-collapse text-xs [&_th]:whitespace-normal"
                scrollbarClass="overflow-x-auto md:overflow-hidden custom-scrollbar-visible"
              >
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="hover:bg-transparent border-slate-100">
                    <TableHead rowSpan={2} className="w-[40px] py-2 px-2 text-center border-b border-slate-100">
                      <input
                        type="checkbox"
                        className={cn(
                          "w-4 h-4 rounded border-slate-300 text-[#0064cb] focus:ring-[#0064cb] cursor-pointer",
                          selectableShifts.length === 0 && "opacity-50 cursor-not-allowed"
                        )}
                        checked={isAllSelected}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        disabled={selectableShifts.length === 0}
                      />
                    </TableHead>
                    <TableHead rowSpan={2} className="text-[11px] font-bold text-slate-800 uppercase py-2 px-2 border-b border-slate-100">Shift No.</TableHead>
                    <TableHead rowSpan={2} className="text-[11px] font-bold text-slate-800 uppercase py-2 px-2 border-b border-slate-100">Service Name</TableHead>
                    <TableHead rowSpan={2} className="text-[11px] font-bold text-slate-800 uppercase py-2 px-2 border-b border-slate-100">Start Time</TableHead>
                    <TableHead rowSpan={2} className="text-[11px] font-bold text-slate-800 uppercase py-2 px-2 border-b border-slate-100">End Time</TableHead>
                    <TableHead rowSpan={2} className="text-[11px] font-bold text-slate-800 uppercase py-2 px-2 border-b border-slate-100">Hourly Rate</TableHead>
                    <TableHead colSpan={3} className="text-[11px] font-bold text-slate-800 uppercase py-2 px-2 text-center border-l border-r border-b border-slate-100 bg-slate-100/30">Lead Guard</TableHead>
                    <TableHead colSpan={3} className="text-[11px] font-bold text-slate-800 uppercase py-2 px-2 text-center border-r border-b border-slate-100 bg-amber-50/10">Standby Guard (QC)</TableHead>
                  </TableRow>
                  <TableRow className="hover:bg-transparent border-slate-100">
                    <TableHead className="text-[10px] font-bold text-slate-700 uppercase py-2 px-2 border-l border-slate-100 bg-slate-100/10 border-b">Guard</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-700 uppercase py-2 px-2 bg-slate-100/10 border-b">Seen</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-700 uppercase py-2 px-2 border-r border-slate-100 bg-slate-100/10 border-b">Status</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-700 uppercase py-2 px-2 bg-amber-50/5 border-b">Guard</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-700 uppercase py-2 px-2 bg-amber-50/5 border-b">Seen</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-700 uppercase py-2 px-2 border-r border-slate-100 bg-amber-50/5 border-b">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={`skeleton-${i}`} className="border-b border-slate-50">
                        <TableCell className="py-4 px-2 text-center"><Skeleton className="w-4 h-4 rounded mx-auto" /></TableCell>
                        <TableCell className="py-4 px-2"><Skeleton className="h-4 w-10" /></TableCell>
                        <TableCell className="py-4 px-2"><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell className="py-4 px-2 space-y-1"><Skeleton className="h-4 w-20" /><Skeleton className="h-3 w-16" /></TableCell>
                        <TableCell className="py-4 px-2 space-y-1"><Skeleton className="h-4 w-20" /><Skeleton className="h-3 w-16" /></TableCell>
                        <TableCell className="py-4 px-2"><Skeleton className="h-4 w-16" /></TableCell>


                        <TableCell className="py-4 px-2 border-l border-slate-100">
                          <div className="flex items-center gap-1.5">
                            <Skeleton className="w-5 h-5 rounded-full shrink-0" />
                            <div className="space-y-1">
                              <Skeleton className="h-3 w-16" />
                              <Skeleton className="h-2 w-12" />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-2"><Skeleton className="h-3 w-6 mx-auto" /></TableCell>
                        <TableCell className="py-4 px-2 border-r border-slate-100"><Skeleton className="h-4 w-14 mx-auto rounded" /></TableCell>

                        <TableCell className="py-4 px-2">
                          <div className="flex items-center gap-1.5">
                            <Skeleton className="w-5 h-5 rounded-full shrink-0" />
                            <div className="space-y-1">
                              <Skeleton className="h-3 w-16" />
                              <Skeleton className="h-2 w-12" />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-2"><Skeleton className="h-3 w-6 mx-auto" /></TableCell>
                        <TableCell className="py-4 px-2 border-r border-slate-100"><Skeleton className="h-4 w-14 mx-auto rounded" /></TableCell>
                      </TableRow>
                    ))
                  ) : shifts.length > 0 ? (
                    shifts.map((shift) => (
                      <TableRow
                        key={shift.shift_id}
                        className={cn(
                          "border-b border-slate-50 transition-colors",
                          (shift.guard || pendingAssignments[shift.shift_id] || shift.secondary_guard || shift.standby_guard || shift.qc_guard || (shift.standby_guards && shift.standby_guards.length > 0)) ? "bg-slate-50/30" : "hover:bg-slate-50/10"
                        )}
                      >
                        <TableCell className="py-3 px-2 text-center">
                          <input
                            type="checkbox"
                            className={cn(
                              "w-4 h-4 rounded border-slate-300 text-[#0064cb] focus:ring-[#0064cb] cursor-pointer",
                              (shift.guard || pendingAssignments[shift.shift_id]) && "opacity-30 cursor-not-allowed"
                            )}
                            checked={selectedShifts.includes(shift.shift_id) || !!pendingAssignments[shift.shift_id]}
                            onChange={(e) => handleSelectRow(shift.shift_id, e.target.checked)}
                            disabled={!!shift.guard || !!pendingAssignments[shift.shift_id]}
                          />
                        </TableCell>
                        <TableCell className="text-xs font-bold text-slate-700 py-3 px-2">{shift.shift_no}</TableCell>
                        <TableCell className="text-xs font-medium text-slate-800 py-3 px-2 min-w-[100px]">{shift.service_name}</TableCell>
                        <TableCell className="text-xs font-medium text-slate-800 py-3 px-2 whitespace-nowrap">
                          {new Date(shift.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}<br />
                          <span className="text-[11px] text-slate-700">{new Date(shift.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </TableCell>
                        <TableCell className="text-xs font-medium text-slate-800 py-3 px-2 whitespace-nowrap">
                          {new Date(shift.end_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}<br />
                          <span className="text-[11px] text-slate-700">{new Date(shift.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </TableCell>
                        <TableCell className="py-3 px-2 text-xs text-slate-800 font-medium">
                          <span className={cn(
                            pendingAssignments[shift.shift_id]
                              ? "text-[#0064cb] font-semibold text-[13px] animate-pulse"
                              : ""
                          )}>
                            {pendingAssignments[shift.shift_id]
                              ? formatPrice(shiftRates[shift.shift_id]?.hourlyRate ?? pendingAssignments[shift.shift_id]?.hourlyRate)
                              : formatPrice(shift.per_hour_rate)}
                            {((pendingAssignments[shift.shift_id]?.hourlyRate || shift.per_hour_rate) !== null) && " /hr"}
                          </span>
                        </TableCell>



                        {(() => {
                          const pending = pendingAssignments[shift.shift_id]?.type === "lead" ? pendingAssignments[shift.shift_id] : undefined;
                          const leadData = shift.lead_guard || shift.guard;

                          if (leadData || pending) {
                            const actualGuard = leadData?.guard || leadData;
                            const name = pending
                              ? pending.guard_name
                              : (typeof actualGuard === 'object' ? `${actualGuard?.first_name || ""} ${actualGuard?.last_name || ""}`.trim() || actualGuard?.name || "Unknown" : String(actualGuard));

                            const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=f1f5f9&color=334155`;

                            const isSeen = pending ? false : (leadData?.is_seen === true);
                            const isResponded = pending ? false : (leadData?.status && leadData.status.toLowerCase() !== "pending" && leadData.status.toLowerCase() !== "unassigned");
                            const status = pending ? "PENDING" : (leadData?.status || "PENDING").toUpperCase();

                            let statusColor = "bg-amber-50 text-amber-600 border-amber-100";
                            if (status.includes("ACCEPT") || status.includes("ACTIVE")) {
                              statusColor = "bg-green-50 text-green-600 border-green-100";
                            } else if (status.includes("DECLINE") || status.includes("REJECT") || status.includes("CANCEL")) {
                              statusColor = "bg-red-50 text-red-600 border-red-100";
                            }

                            return (
                              <>
                                <TableCell className="py-2 px-1 border-l border-slate-100">
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-5 h-5 rounded-full bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center border border-slate-200">
                                      <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex flex-col min-w-0 max-w-[90px]">
                                      <span className={cn(
                                        "text-[11px] font-semibold truncate",
                                        pending ? "text-[#0064cb] animate-pulse" : "text-slate-800"
                                      )}>
                                        {name}
                                      </span>
                                      {actualGuard?.phone_number && (
                                        <span className="text-[10px] text-slate-500 truncate mt-0.5">
                                          {actualGuard.phone_number}
                                        </span>
                                      )}
                                    </div>
                                    {pending ? (
                                      <button
                                        onClick={() => onRemovePendingAssignment?.(shift.shift_id)}
                                        className="w-4 h-4 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-all cursor-pointer ml-auto"
                                        title="Remove Selection"
                                      >
                                        <X className="w-2.5 h-2.5 stroke-[3]" />
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => onUnassignGuard(leadData?.shift_offer_id || leadData?.offer_id || shift.shift_offer_id, "lead_guard")}
                                        className="w-4 h-4 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-full transition-all cursor-pointer shadow-sm shadow-red-500/20 ml-auto"
                                        title="Unassign Lead Guard"
                                      >
                                        <X className="w-2.5 h-2.5 stroke-[3]" />
                                      </button>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="py-2 px-1 text-center">
                                  <span className={cn(
                                    "text-xs font-bold",
                                    isSeen ? "text-green-600" : "text-red-500"
                                  )}>
                                    {isSeen ? "Yes" : "No"}
                                  </span>
                                </TableCell>
                                <TableCell className="py-2 px-1 border-r border-slate-100">
                                  <span className={cn(
                                    "px-2 py-0.5 rounded text-[10px] font-bold border block text-center uppercase tracking-wide",
                                    statusColor
                                  )}>
                                    {status}
                                  </span>
                                </TableCell>
                              </>
                            );
                          } else {
                            return (
                              <>
                                <TableCell colSpan={3} className="py-1.5 px-1 border-l border-r border-slate-100 text-center">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-slate-200 bg-slate-50 text-slate-400 uppercase tracking-wide inline-flex items-center justify-center">
                                    UNASSIGNED
                                  </span>
                                </TableCell>
                              </>
                            );
                          }
                        })()}

                        {(() => {
                          const pending = pendingAssignments[shift.shift_id]?.type === "standby" ? pendingAssignments[shift.shift_id] : undefined;
                          const standbyData = shift.secondary_guard || shift.standby_guard || shift.qc_guard || (shift.standby_guards && shift.standby_guards[0]);

                          if (standbyData || pending) {
                            const actualGuard = standbyData?.guard || standbyData;
                            const name = pending
                              ? pending.guard_name
                              : (actualGuard?.guard_name || `${actualGuard?.first_name || ""} ${actualGuard?.last_name || ""}`.trim() || actualGuard?.name || "Unknown");
                            const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=f1f5f9&color=334155`;

                            const isSeen = pending ? false : (standbyData?.is_seen === true || standbyData?.notification_seen === true);
                            const isResponded = pending ? false : (standbyData?.is_responded === true || standbyData?.responded === true || (standbyData?.status && standbyData?.status.toLowerCase() !== "pending" && standbyData?.status.toLowerCase() !== "unassigned"));
                            const status = pending ? "PENDING" : (standbyData?.status || "PENDING").toUpperCase();

                            let statusColor = "bg-amber-50 text-amber-600 border-amber-100";
                            if (status.includes("ACCEPT") || status.includes("ACTIVE") || status.includes("SITE") || status.includes("ARRIVED") || status.includes("WORKING")) {
                              statusColor = "bg-purple-50 text-purple-600 border-purple-100";
                            } else if (status.includes("DECLINE") || status.includes("REJECT") || status.includes("CANCEL")) {
                              statusColor = "bg-red-50 text-red-600 border-red-100";
                            }

                            return (
                              <>
                                <TableCell className="py-2 px-1">
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-5 h-5 rounded-full bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center border border-slate-200">
                                      <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex flex-col min-w-0 max-w-[90px]">
                                      <span className={cn(
                                        "text-[11px] font-semibold truncate",
                                        pending ? "text-[#0064cb] animate-pulse" : "text-slate-800"
                                      )}>
                                        {name}
                                      </span>
                                      {actualGuard?.phone_number && (
                                        <span className="text-[10px] text-slate-500 truncate mt-0.5">
                                          {actualGuard.phone_number}
                                        </span>
                                      )}
                                    </div>
                                    {pending ? (
                                      <button
                                        onClick={() => onRemovePendingAssignment?.(shift.shift_id)}
                                        className="w-4 h-4 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-all cursor-pointer ml-auto"
                                        title="Remove Selection"
                                      >
                                        <X className="w-2.5 h-2.5 stroke-[3]" />
                                      </button>
                                    ) : (standbyData?.standby_id || standbyData?.offer_id) && (
                                      <button
                                        onClick={() => onUnassignGuard(standbyData.standby_id || standbyData.offer_id, "standby_guard")}
                                        className="w-4 h-4 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-full transition-all cursor-pointer shadow-sm shadow-red-500/20 ml-auto"
                                        title="Delete Standby Request"
                                      >
                                        <X className="w-2.5 h-2.5 stroke-[3]" />
                                      </button>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="py-2 px-1 text-center">
                                  <span className={cn(
                                    "text-xs font-bold",
                                    isSeen ? "text-green-600" : "text-red-500"
                                  )}>
                                    {isSeen ? "Yes" : "No"}
                                  </span>
                                </TableCell>
                                <TableCell className="py-2 px-1 border-r border-slate-100">
                                  <span className={cn(
                                    "px-2 py-0.5 rounded text-[10px] font-bold border block text-center uppercase tracking-wide",
                                    statusColor
                                  )}>
                                    {status}
                                  </span>
                                </TableCell>
                              </>
                            );
                          } else {
                            return (
                              <>
                                <TableCell colSpan={3} className="py-1.5 px-1 border-r border-slate-100 text-center">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-slate-200 bg-slate-50 text-slate-400 uppercase tracking-wide inline-flex items-center justify-center">
                                    UNASSIGNED
                                  </span>
                                </TableCell>
                              </>
                            );
                          }
                        })()}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={12} className="py-8 text-center text-slate-700">No shifts available to assign</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-6 w-full">
            <Button
              variant="outline"
              onClick={onBack}
              className="px-6 h-11 rounded-lg font-bold text-slate-600 border-slate-200 hover:bg-slate-50 transition-all cursor-pointer w-full sm:w-auto text-center"
            >
              Back
            </Button>
            <Button
              onClick={() => onAdd(shiftRates, () => setSelectedShifts([]))}
              disabled={isAssigning || Object.keys(pendingAssignments).length === 0}
              className="bg-[#0064cb] hover:bg-[#0052ae] text-white px-8 h-11 rounded-lg font-bold shadow-lg shadow-[#0064cb]/20 transition-all cursor-pointer min-w-[120px] w-full sm:w-auto flex justify-center items-center"
            >
              {isAssigning ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
