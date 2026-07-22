"use client";

import { useState, useEffect } from "react";
import { Users, CheckCircle, Clock, XCircle, UserCheck, RefreshCcw, Eye, EyeOff, Info, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Shift } from "./types";
import {
  clientFetchStandbyGuardsAction,
  clientFindStandbyGuardsAction,
  clientAssignStandbyGuardAction,
  clientDeleteStandbyRequestAction
} from "@/lib/client-actions";
import { Skeleton } from "@/components/ui/skeleton";
import { SelectGuardsDialog } from "@/app/(main)/broadcast-notifications/_components/SelectGuardsDialog";
import { ConfirmationDialog } from "@/app/(main)/invoices/[id]/_components/ConfirmationDialog";
import { toast } from "sonner";

interface StandbyGuardsPanelProps {
  shift?: Shift | null;
  onClose: () => void;
}

export function StandbyGuardsPanel({ shift }: StandbyGuardsPanelProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [timeFrom, setTimeFrom] = useState("");
  const [timeTo, setTimeTo] = useState("");
  const [payPerHour, setPayPerHour] = useState("");
  const [isSelectGuardsOpen, setIsSelectGuardsOpen] = useState(false);
  const [selectedGuardIds, setSelectedGuardIds] = useState<string[]>([]);
  const [isFinding, setIsFinding] = useState(false);

  const [assignConfirm, setAssignConfirm] = useState<{ isOpen: boolean; guard: any | null }>({ isOpen: false, guard: null });
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; guard: any | null }>({ isOpen: false, guard: null });
  const [isAssigning, setIsAssigning] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const minToday = now.toISOString().slice(0, 16);

  const fetchGuards = async () => {
    if (!shift?.shift_id) return;
    setIsLoading(true);
    const res = await clientFetchStandbyGuardsAction(shift.shift_id);
    if (res.success && res.data) {
      setData(res.data.data || []);
      setSummary(res.data.summary || null);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchGuards();
  }, [shift?.shift_id]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchGuards();
    setIsRefreshing(false);
  };

  const handleFind = async () => {
    if (!shift?.shift_id || !timeFrom || !timeTo || !payPerHour || selectedGuardIds.length === 0) return;
    setIsFinding(true);

    try {
      const start_time = new Date(timeFrom).toISOString();
      const end_time = new Date(timeTo).toISOString();

      const startMs = new Date(start_time).getTime();
      const endMs = new Date(end_time).getTime();
      const total_hours = Math.max(0, (endMs - startMs) / (1000 * 60 * 60));

      const res = await clientFindStandbyGuardsAction({
        shift_id: shift.shift_id,
        guard_ids: selectedGuardIds,
        start_time,
        end_time,
        hourly_rate: Number(payPerHour),
        total_hours: Number(total_hours.toFixed(2))
      });

      if (res.success) {
        if (res.data?.guards_notified === 0) {
          toast.error(res.data?.message || "Standby requests already sent to these guards.");
        } else {
          toast.success(res.data?.message || "Standby requests sent successfully.");
        }
        setTimeFrom("");
        setTimeTo("");
        setPayPerHour("");
        setSelectedGuardIds([]);
        await fetchGuards();
      } else {
        toast.error(res.error || "Failed to find standby guards.");
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsFinding(false);
    }
  };

  const handleAssignClick = (guard: any) => {
    setAssignConfirm({ isOpen: true, guard });
  };

  const handleAssignConfirm = async () => {
    if (!assignConfirm.guard) return;
    setIsAssigning(true);

    const payload = {
      shift_id: assignConfirm.guard.shift_id,
      standby_id: assignConfirm.guard.standby_id,
    };
    console.log("Assign Standby Guard Payload:", payload);

    const res = await clientAssignStandbyGuardAction(payload);
    console.log("Assign Standby Guard Response:", res);

    setIsAssigning(false);

    if (res.success) {
      toast.success(res.data?.message || "Guard assigned successfully");
      setAssignConfirm({ isOpen: false, guard: null });
      await fetchGuards();
    } else {
      toast.error(res.error || "Failed to assign guard");
    }
  };

  const handleDeleteClick = (guard: any) => {
    setDeleteConfirm({ isOpen: true, guard });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.guard) return;
    setIsDeleting(true);

    const standby_id = deleteConfirm.guard.standby_id;
    console.log("Delete Standby Request Payload:", { standby_id });

    const res = await clientDeleteStandbyRequestAction(standby_id);
    console.log("Delete Standby Request Response:", res);

    setIsDeleting(false);

    if (res.success) {
      toast.success(res.data?.message || "Standby request deleted successfully");
      setDeleteConfirm({ isOpen: false, guard: null });
      await fetchGuards();
    } else {
      toast.error(res.error || "Failed to delete standby request");
    }
  };

  const stats = [
    { label: "Total Requested", value: summary?.total_request || 0, icon: Users, color: "blue", bg: "bg-blue-50", text: "text-blue-600" },
    { label: "Accepted", value: summary?.available || 0, icon: CheckCircle, color: "green", bg: "bg-green-50", text: "text-green-600" },
    { label: "Pending", value: summary?.pending || 0, icon: Clock, color: "yellow", bg: "bg-amber-50", text: "text-amber-500" },
    { label: "Declined", value: summary?.not_available || 0, icon: XCircle, color: "red", bg: "bg-red-50", text: "text-red-500" },
    { label: "Assigned", value: summary?.assigned_shift || 0, icon: UserCheck, color: "indigo", bg: "bg-indigo-50", text: "text-indigo-500" },
  ];

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true
      }).format(date);
    } catch {
      return "-";
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm flex flex-wrap items-end gap-4">
        {/* Time From */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
          <label className="text-[14px] font-bold text-black">Standby Time From</label>
          <input
            type="datetime-local"
            min={minToday}
            value={timeFrom}
            onChange={(e) => setTimeFrom(e.target.value)}
            className="h-10 px-3 rounded-lg border border-slate-200 text-[13px] outline-none focus:border-[#0064cb] focus:ring-1 focus:ring-[#0064cb] transition-shadow text-slate-700"
          />
        </div>

        {/* Time To */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
          <label className="text-[14px] font-bold text-black">Standby Time To</label>
          <input
            type="datetime-local"
            min={timeFrom || minToday}
            value={timeTo}
            onChange={(e) => setTimeTo(e.target.value)}
            className="h-10 px-3 rounded-lg border border-slate-200 text-[13px] outline-none focus:border-[#0064cb] focus:ring-1 focus:ring-[#0064cb] transition-shadow text-slate-700"
          />
        </div>

        {/* Pay Per Hour */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
          <label className="text-[14px] font-bold text-black">Pay Per Hour</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-[13px] pointer-events-none">$</span>
            <input
              type="number"
              placeholder="0.00"
              value={payPerHour}
              onChange={(e) => setPayPerHour(e.target.value)}
              className="h-10 pl-7 pr-3 w-full rounded-lg border border-slate-200 text-[13px] outline-none focus:border-[#0064cb] focus:ring-1 focus:ring-[#0064cb] transition-shadow text-slate-700"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
          <button
            onClick={() => setIsSelectGuardsOpen(true)}
            className="cursor-pointer h-10 flex-1 md:flex-none px-6 rounded-lg border border-slate-200 text-slate-700 text-[13px] font-bold hover:bg-slate-50 transition-colors whitespace-nowrap shadow-sm"
          >
            Select Guard {selectedGuardIds.length > 0 && `(${selectedGuardIds.length})`}
          </button>
          <button
            disabled={!timeFrom || !timeTo || !payPerHour || selectedGuardIds.length === 0 || isFinding}
            onClick={handleFind}
            className="flex items-center justify-center gap-2 h-10 flex-1 md:flex-none px-8 rounded-lg bg-[#0064cb] text-white text-[13px] font-bold hover:bg-[#0052ae] transition-colors whitespace-nowrap shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isFinding ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Finding...
              </>
            ) : "Find"}
          </button>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm flex items-center gap-4">
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", stat.bg, stat.text)}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-slate-700">{stat.label}</p>
              {isLoading ? (
                <Skeleton className="h-7 w-12 mt-1" />
              ) : (
                <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{stat.value}</h3>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Main List Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Standby Guards List</h2>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 h-9 px-4 rounded-lg border border-blue-100 text-[#0064cb] text-sm font-semibold hover:bg-blue-50 transition-colors cursor-pointer"
          >
            <RefreshCcw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <Table className="border-collapse w-full min-w-[1000px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-slate-100">
                <TableHead className="py-4 px-6 text-[12px] font-bold text-slate-800 bg-slate-50">Guard Name</TableHead>
                <TableHead className="py-4 px-6 text-[12px] font-bold text-slate-800 bg-slate-50">Standby Time</TableHead>
                <TableHead className="py-4 px-6 text-[12px] font-bold text-slate-800 bg-slate-50">Total Hours</TableHead>
                <TableHead className="py-4 px-6 text-[12px] font-bold text-slate-800 bg-slate-50">Pay Per Hour</TableHead>
                <TableHead className="py-4 px-6 text-[12px] font-bold text-slate-800 bg-slate-50">Total Pay</TableHead>
                <TableHead className="py-4 px-6 text-[12px] font-bold text-slate-800 bg-slate-50">Response</TableHead>
                <TableHead className="py-4 px-6 text-[12px] font-bold text-slate-800 bg-slate-50">Seen</TableHead>
                <TableHead className="py-4 px-6 text-[12px] font-bold text-slate-800 bg-slate-50 text-center">Action</TableHead>
                <TableHead className="py-4 px-6 text-[12px] font-bold text-slate-800 bg-slate-50 text-center w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <TableRow key={idx} className="border-b border-slate-50">
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                        <div>
                          <Skeleton className="h-4 w-24 mb-1" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6"><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell className="py-4 px-6"><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell className="py-4 px-6"><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell className="py-4 px-6"><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell className="py-4 px-6"><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                    <TableCell className="py-4 px-6"><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell className="py-4 px-6 text-center">
                      <Skeleton className="h-8 w-24 mx-auto rounded-lg" />
                    </TableCell>
                    <TableCell className="py-4 px-6 text-center">
                      <Skeleton className="h-8 w-8 mx-auto rounded-lg" />
                    </TableCell>
                  </TableRow>
                ))
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-slate-500">
                    No standby guards found.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((guard) => {
                  const startTimeStr = formatDateTime(guard.start_time);
                  const endTimeStr = formatDateTime(guard.end_time);

                  // Response Badge Logic
                  let responseLabel = "No Response";
                  let responseColor = "bg-slate-100 text-slate-500 border-slate-200";
                  if (guard.status === "available" || guard.status === "accepted") {
                    responseLabel = "Accepted";
                    responseColor = "bg-green-50 text-green-600 border-green-100";
                  } else if (guard.status === "not_available" || guard.status === "declined") {
                    responseLabel = "Declined";
                    responseColor = "bg-red-50 text-red-500 border-red-100";
                  } else if (guard.status === "pending") {
                    responseLabel = "No Response";
                  }

                  const isRowAssigned = guard.action?.assigned_guard_on_shift;

                  return (
                    <TableRow
                      key={guard.standby_id}
                      className={cn(
                        "border-b border-slate-50 transition-colors",
                        isRowAssigned ? "bg-green-100 hover:bg-green-100/50" : "hover:bg-slate-50/50"
                      )}
                    >
                      <TableCell className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center border border-slate-200">
                            <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(guard.guard_name || "Unknown")}&background=f1f5f9&color=334155`} alt={guard.guard_name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <div className="text-[14px] font-bold text-slate-800">{guard.guard_name || "Unknown"}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-6 text-[13px] font-semibold text-slate-700 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span>{startTimeStr}</span>
                          <span className="text-slate-500">{endTimeStr}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-6 text-[13px] font-semibold text-slate-700">
                        {guard.total_hours} hr
                      </TableCell>
                      <TableCell className="py-4 px-6 text-[13px] font-semibold text-slate-700">
                        ${guard.hourly_rate?.toFixed(2) || "0.00"}
                      </TableCell>
                      <TableCell className="py-4 px-6 text-[13px] font-semibold text-slate-700">
                        ${guard.total_pay?.toFixed(2) || "0.00"}
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <span className={cn(
                          "inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold border",
                          responseColor
                        )}>
                          {responseLabel}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        {guard.is_notification_seen ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-600 text-[11px] font-bold border border-green-100">
                            <CheckCircle className="w-3.5 h-3.5" /> Seen
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-[11px] font-bold border border-slate-200">
                            <EyeOff className="w-3.5 h-3.5" /> Not Seen
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-4 px-6 text-center">
                        {guard.action?.assigned_guard_on_shift ? (
                          <span className="text-green-600 font-bold text-[13px]">Assigned</span>
                        ) : guard.action?.is_assigned_shift ? (
                          <button
                            onClick={() => handleAssignClick(guard)}
                            className="h-8 px-4 rounded-lg bg-[#0064cb] hover:bg-[#0052ae] text-white text-[12px] font-bold transition-colors cursor-pointer shadow-sm"
                          >
                            Assign
                          </button>
                        ) : (
                          <span className="text-slate-400 font-bold">-</span>
                        )}
                      </TableCell>
                      <TableCell className="py-4 px-6 text-center">
                        <button
                          onClick={() => handleDeleteClick(guard)}
                          className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Info Alert Footer */}
      <div className="bg-[#f5f8ff] rounded-xl p-5 flex items-start gap-4 border border-blue-100 shadow-sm">
        <div className="w-8 h-8 rounded-full bg-[#0064cb] text-white flex items-center justify-center shrink-0 mt-0.5">
          <Info className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <h3 className="text-[15px] font-bold text-slate-900">How Standby Works</h3>
          <p className="text-[13px] text-slate-600 mt-1.5 leading-relaxed">
            Standby guards have been requested to wait during the standby window. If the main guard does not attend the shift, you can assign the shift to one of the accepted standby guards.
          </p>
        </div>
      </div>

      {isSelectGuardsOpen && (
        <SelectGuardsDialog
          isOpen={isSelectGuardsOpen}
          onClose={() => setIsSelectGuardsOpen(false)}
          initialSelectedIds={selectedGuardIds}
          onConfirm={(ids) => {
            setSelectedGuardIds(ids);
            setIsSelectGuardsOpen(false);
          }}
        />
      )}

      <ConfirmationDialog
        isOpen={assignConfirm.isOpen}
        onClose={() => setAssignConfirm({ isOpen: false, guard: null })}
        onConfirm={handleAssignConfirm}
        title="Assign Standby Guard"
        description={`Are you sure you want to assign ${assignConfirm.guard?.guard_name || "this guard"} to the shift?`}
        confirmText="Yes, Assign"
        isDanger={false}
        isLoading={isAssigning}
      />

      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, guard: null })}
        onConfirm={handleDeleteConfirm}
        title="Delete Standby Request?"
        description="Are you sure you want to delete this standby request? This action cannot be undone."
        confirmText="Yes, delete it"
        isDanger={true}
        isLoading={isDeleting}
      />
    </div>
  );
}
