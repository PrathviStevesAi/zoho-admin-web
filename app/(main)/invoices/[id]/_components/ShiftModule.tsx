"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Trash2,
  Calendar,
  Loader2,
  Pencil,
  Copy,
  Clock
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { FormattedDate } from "@/components/ui/formatted-date";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const getStatusBadge = (status: string) => {
  const normalized = status?.toLowerCase() || "shift_created";
  const statusStyles: Record<string, { label: string; className: string }> = {
    shift_created: {
      label: "Shift Created",
      className: "bg-slate-50 text-slate-600 border-slate-200"
    },
    shift_planned: {
      label: "Shift Planned",
      className: "bg-amber-50 text-amber-700 border-amber-200/60"
    },
    shift_accepted: {
      label: "Shift Accepted",
      className: "bg-blue-50 text-blue-700 border-blue-200/60"
    },
    shift_refused: {
      label: "Shift Refused",
      className: "bg-rose-50 text-rose-700 border-rose-200/60"
    },
    shift_abandon: {
      label: "Shift Abandoned",
      className: "bg-orange-50 text-orange-700 border-orange-200/60"
    },
    shift_arrival: {
      label: "Shift Arrival",
      className: "bg-cyan-50 text-cyan-700 border-cyan-200/60"
    },
    shift_pre_check_in: {
      label: "Pre-Check-In",
      className: "bg-indigo-50 text-indigo-700 border-indigo-200/60"
    },
    shift_in_progress: {
      label: "In Progress",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200/60"
    },
    shift_in_break: {
      label: "In Break",
      className: "bg-amber-100 text-amber-800 border-amber-300"
    },
    shift_finished: {
      label: "Shift Finished",
      className: "bg-purple-50 text-purple-700 border-purple-200/60"
    },
    shift_approved: {
      label: "Shift Completed",
      className: "bg-emerald-800 text-emerald-100 border-emerald-900"
    },
    shift_not_approved: {
      label: "Not Approved",
      className: "bg-rose-100 text-rose-800 border-rose-200"
    },
    shift_cancelled: {
      label: "Cancelled",
      className: "bg-slate-100 text-slate-600 border-slate-200"
    }
  };

  const config = statusStyles[normalized] || {
    label: status ? status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : "Shift Created",
    className: "bg-slate-50 text-slate-600 border-slate-200"
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.className}`}>
      {config.label}
    </span>
  );
};

interface ShiftModuleProps {
  shifts: any[];
  isLoading: boolean;
  isAdding: boolean;
  onAdd: () => void;
  onCancelAdd: () => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onEdit: (id: string) => void;
  onBack: () => void;
  services: any[];
  addShiftData: any;
  setAddShiftData: (data: any) => void;
  rowSchedules: any;
  setRowSchedules?: (schedules: any) => void;
  handleRowChange: (date: string, field: string, val: any) => void;
  getDatesList: (start: string, end: string) => Date[];
  onCreateShifts: (validDateKeys: string[]) => void;
  isCreating: boolean;
  timezone: string;
  selectedShiftIds?: string[];
  setSelectedShiftIds?: (ids: string[] | ((prev: string[]) => string[])) => void;
  onBulkDelete?: () => void;
  isDeletingBulk?: boolean;
}

export function ShiftModule({
  shifts,
  isLoading,
  isAdding,
  onAdd,
  onCancelAdd,
  onDelete,
  onDuplicate,
  onEdit,
  onBack,
  services,
  addShiftData,
  setAddShiftData,
  rowSchedules,
  setRowSchedules,
  handleRowChange,
  getDatesList,
  onCreateShifts,
  isCreating,
  selectedShiftIds,
  setSelectedShiftIds,
  onBulkDelete,
  isDeletingBulk,
  timezone
}: ShiftModuleProps) {
  const getLocalDateString = (date: Date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getLocalTimeString = (date: Date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const getCurrentTimeOnly = (date: Date = new Date()) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [isRepeating, setIsRepeating] = useState(false);
  const [repeatDays, setRepeatDays] = useState<number[]>([]);
  const [repeatStartDate, setRepeatStartDate] = useState(getLocalDateString());
  const [repeatEndDate, setRepeatEndDate] = useState(getLocalDateString());
  const [repeatStartTime, setRepeatStartTime] = useState(getCurrentTimeOnly());
  const [repeatEndTime, setRepeatEndTime] = useState(getCurrentTimeOnly());
  const today = getLocalDateString();
  const now = getLocalTimeString();
  const activeStartDate = isRepeating ? repeatStartDate : addShiftData?.dateFrom;
  const activeEndDate = isRepeating ? repeatEndDate : addShiftData?.dateTo;

  useEffect(() => {
    if (isRepeating && repeatStartDate && repeatEndDate && repeatStartTime && repeatEndTime && activeStartDate && activeEndDate) {
      const startParts = repeatStartTime.split(':');
      const endParts = repeatEndTime.split(':');
      const startHoursInt = parseInt(startParts[0], 10) || 0;
      const startMinsInt = parseInt(startParts[1], 10) || 0;
      const endHoursInt = parseInt(endParts[0], 10) || 0;
      const endMinsInt = parseInt(endParts[1], 10) || 0;

      let diffMinutes = (endHoursInt * 60 + endMinsInt) - (startHoursInt * 60 + startMinsInt);

      if (diffMinutes < 0) {
        diffMinutes += 24 * 60;
      }

      const hoursInt = Math.floor(diffMinutes / 60);
      const minsInt = diffMinutes % 60;
      const hoursStr = `${hoursInt}:${String(minsInt).padStart(2, '0')}`;
      const startHours = String(startHoursInt).padStart(2, '0');
      const startMins = String(startMinsInt).padStart(2, '0');
      const dates = getDatesList(activeStartDate, activeEndDate);
      dates.forEach(date => {
        const dateKey = formatDateKey(date);
        const rowStart = `${dateKey}T${startHours}:${startMins}`;
        const rowStartObj = new Date(rowStart);
        const rowEndObj = new Date(rowStartObj.getTime() + diffMinutes * 60000);
        const rowEndKey = formatDateKey(rowEndObj);
        const rEndHours = String(rowEndObj.getHours()).padStart(2, '0');
        const rEndMins = String(rowEndObj.getMinutes()).padStart(2, '0');
        const rowEnd = `${rowEndKey}T${rEndHours}:${rEndMins}`;

        handleRowChange(dateKey, 'startTime', rowStart);
        handleRowChange(dateKey, 'endTime', rowEnd);
        handleRowChange(dateKey, 'hours', hoursStr);

        if (repeatDays.length > 0) {
          const dayOfWeek = date.getDay();
          handleRowChange(dateKey, 'checked', repeatDays.includes(dayOfWeek));
        }
      });
    }
  }, [repeatStartDate, repeatEndDate, repeatStartTime, repeatEndTime, isRepeating, repeatDays, activeStartDate, activeEndDate]);

  useEffect(() => {
    if (!isAdding) {
      setIsRepeating(false);
      setRepeatDays([]);
      setRepeatStartDate(getLocalDateString());
      setRepeatEndDate(getLocalDateString());
      setRepeatStartTime(getCurrentTimeOnly());
      setRepeatEndTime(getCurrentTimeOnly());
    }
  }, [isAdding]);

  if (!isAdding) {
    return (
      <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
        <Card className="border-slate-200 shadow-sm overflow-hidden rounded-xl bg-white">
          <CardContent className="p-0">
            <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-slate-900">Shift Schedule</h2>
                <p className="text-slate-600 text-sm">View and manage all scheduled shifts for this invoice.</p>
              </div>
              <div className="flex items-center gap-3 justify-start sm:justify-end shrink-0">
                {selectedShiftIds && selectedShiftIds.length > 0 ? (
                  <Button
                    onClick={onBulkDelete}
                    disabled={isDeletingBulk}
                    className="h-10 px-6 rounded-lg font-bold text-white bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/10 transition-all cursor-pointer flex gap-2 items-center"
                  >
                    {isDeletingBulk ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Delete Selected ({selectedShiftIds.length})
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={onBack}
                      className="h-10 px-6 rounded-lg font-bold text-slate-600 border-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={onAdd}
                      className="h-10 px-6 rounded-lg font-bold text-white bg-[#0064cb] hover:bg-[#0052ae] shadow-md shadow-[#0064cb]/10 transition-all cursor-pointer flex gap-2 items-center"
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="p-6">
              <div className="border border-slate-100 rounded-lg overflow-hidden w-full">
                <div className="overflow-x-auto custom-scrollbar">
                  <Table className="min-w-[650px] md:min-w-full">
                    <TableHeader className="bg-slate-50/50">
                      <TableRow className="hover:bg-transparent border-slate-100">
                        <TableHead className="w-12 py-4 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={
                              shifts.length > 0 &&
                              shifts.filter(s => (s.actions ? s.actions.is_shift_delete : true)).length > 0 &&
                              selectedShiftIds?.length === shifts.filter(s => (s.actions ? s.actions.is_shift_delete : true)).length
                            }
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedShiftIds?.(shifts.filter(s => (s.actions ? s.actions.is_shift_delete : true)).map(s => s.shift_id));
                              } else {
                                setSelectedShiftIds?.([]);
                              }
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-[#0064cb] focus:ring-[#0064cb] cursor-pointer"
                          />
                        </TableHead>
                        <TableHead className="text-[11px] font-bold text-slate-800 uppercase py-4 px-6">Shift No.</TableHead>
                        <TableHead className="text-[11px] font-bold text-slate-800 uppercase py-4 px-6">Service Name</TableHead>
                        <TableHead className="text-[11px] font-bold text-slate-800 uppercase py-4 px-6">Start Time</TableHead>
                        <TableHead className="text-[11px] font-bold text-slate-800 uppercase py-4 px-6">End Time</TableHead>
                        <TableHead className="text-[11px] font-bold text-slate-800 uppercase py-4 px-6">Status</TableHead>
                        <TableHead className="text-[11px] font-bold text-slate-800 uppercase py-4 px-6 text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                          <TableRow key={i}>
                            <TableCell colSpan={7} className="py-4 px-6">
                              <Skeleton className="h-4 w-full rounded" />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : shifts.length > 0 ? (
                        shifts.map((shift) => (
                          <TableRow key={shift.shift_id} className="border-slate-50 hover:bg-slate-50/30 transition-colors">
                            <TableCell className="py-4 px-4 text-center">
                              {(() => {
                                const isAllowed = shift.actions ? shift.actions.is_shift_delete : true;
                                if (isAllowed) {
                                  return (
                                    <input
                                      type="checkbox"
                                      checked={selectedShiftIds?.includes(shift.shift_id) || false}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedShiftIds?.(prev => [...(prev || []), shift.shift_id]);
                                        } else {
                                          setSelectedShiftIds?.(prev => (prev || []).filter(id => id !== shift.shift_id));
                                        }
                                      }}
                                      className="w-4 h-4 rounded border-slate-300 text-[#0064cb] focus:ring-[#0064cb] cursor-pointer"
                                    />
                                  );
                                }
                                return null;
                              })()}
                            </TableCell>
                            <TableCell className="text-sm font-bold text-slate-700 py-4 px-6">
                              <Link
                                href={`/shift/view?shift_id=${shift.shift_id}`}
                                className="text-[#0064cb] hover:text-[#0052ae] hover:underline cursor-pointer transition-all"
                              >
                                {shift.shift_no}
                              </Link>
                            </TableCell>
                            <TableCell className="text-sm font-medium text-slate-800 py-4 px-6">{shift.service_name}</TableCell>
                            <TableCell className="text-sm text-slate-800 py-4 px-6">
                              <FormattedDate date={shift.start_time} timezone={timezone} />
                            </TableCell>
                            <TableCell className="text-sm text-slate-800 py-4 px-6">
                              <FormattedDate date={shift.end_time} timezone={timezone} />
                            </TableCell>
                            <TableCell className="py-4 px-6">
                              {getStatusBadge(shift.status)}
                            </TableCell>
                            <TableCell className="py-4 px-6 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {(() => {
                                  const isAllowed = shift.actions ? shift.actions.is_shift_edit : false;
                                  return (
                                    <div title={!isAllowed ? "Once a shift is execute, its details cannot be updated." : "Edit Shift"} className={!isAllowed ? "cursor-not-allowed" : ""}>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        disabled={!isAllowed}
                                        onClick={() => isAllowed && onEdit(shift.shift_id)}
                                        className={`h-8 w-8 rounded-lg transition-all ${!isAllowed
                                          ? "text-slate-400 pointer-events-none"
                                          : "text-[#0064cb] hover:text-[#0052ae] hover:bg-blue-50 cursor-pointer"
                                          }`}
                                      >
                                        <Pencil className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  );
                                })()}

                                {(() => {
                                  const isAllowed = shift.actions ? shift.actions.is_shift_duplicate : false;
                                  return (
                                    <div title={!isAllowed ? "Once a shift is execute,shift cannot be copied." : "Duplicate Shift"} className={!isAllowed ? "cursor-not-allowed" : ""}>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        disabled={!isAllowed}
                                        onClick={() => isAllowed && onDuplicate(shift.shift_id)}
                                        className={`h-8 w-8 rounded-lg transition-all ${!isAllowed
                                          ? "text-slate-400 pointer-events-none"
                                          : "text-slate-600 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                                          }`}
                                      >
                                        <Copy className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  );
                                })()}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="py-12 text-center">
                            <div className="flex flex-col items-center gap-2">
                              <Calendar className="w-8 h-8 text-slate-200" />
                              <p className="text-sm font-medium text-slate-700">No shift schedule yet</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const baseDatesList = getDatesList(activeStartDate, activeEndDate);
  const filteredDatesList = isRepeating && repeatDays.length > 0
    ? baseDatesList.filter(date => repeatDays.includes(date.getDay()))
    : baseDatesList;

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <Card className="border-slate-200 shadow-sm overflow-hidden rounded-xl bg-white max-w-7xl mx-auto">
        <CardContent className="p-0">
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col gap-1">
            <h2 className="text-xl font-bold text-slate-900">Add New Shift</h2>
            <p className="text-slate-600 text-sm">Create and schedule new shifts for this invoice.</p>
          </div>

          <div className="p-6 pb-0 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-slate-800 uppercase">Select Service</Label>
                <Select
                  value={addShiftData.service}
                  onValueChange={(val) => setAddShiftData((prev: any) => ({ ...prev, service: val }))}
                >
                  <SelectTrigger className="w-full !h-11 bg-white border-slate-200 rounded-lg">
                    <SelectValue placeholder="Select the service" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 shadow-xl z-[100]">
                    {!services || services.length === 0 ? (
                      <SelectItem value="none" disabled className="text-slate-500 justify-center">
                        No Security Service found.
                      </SelectItem>
                    ) : (
                      services.map((service) => (
                        <SelectItem key={service.id} value={service.id} className="cursor-pointer">
                          {service.service_name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className={`text-[11px] font-bold uppercase transition-colors ${isRepeating ? "text-slate-400" : "text-slate-800"}`}>Date from</Label>
                <Input
                  type="date"
                  min={today}
                  disabled={isRepeating}
                  className={`w-full h-11 bg-white border-slate-200 rounded-lg ${isRepeating ? "opacity-60 cursor-not-allowed bg-slate-50" : ""}`}
                  value={addShiftData.dateFrom}
                  onChange={(e) => setAddShiftData((prev: any) => ({ ...prev, dateFrom: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label className={`text-[11px] font-bold uppercase transition-colors ${isRepeating ? "text-slate-400" : "text-slate-800"}`}>Date to</Label>
                <Input
                  type="date"
                  min={addShiftData.dateFrom || today}
                  disabled={isRepeating}
                  className={`w-full h-11 bg-white border-slate-200 rounded-lg ${isRepeating ? "opacity-60 cursor-not-allowed bg-slate-50" : ""}`}
                  value={addShiftData.dateTo}
                  onChange={(e) => setAddShiftData((prev: any) => ({ ...prev, dateTo: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-slate-800 uppercase">No of guards required</Label>
                <Input
                  type="number"
                  min="0"
                  className="w-full h-11 bg-white border-slate-200 rounded-lg"
                  value={addShiftData.people}
                  onChange={(e) => setAddShiftData((prev: any) => ({ ...prev, people: Math.max(0, Number(e.target.value)) }))}
                />
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-lg p-6 space-y-6">
              <div className="flex items-center gap-3">
                <div
                  onClick={() => {
                    setIsRepeating(!isRepeating);
                    if (setRowSchedules) setRowSchedules({});
                  }}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${isRepeating ? 'bg-[#0064cb]' : 'bg-slate-300'}`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${isRepeating ? 'translate-x-5' : ''}`}></div>
                </div>
                <span className="text-sm font-bold text-slate-900 cursor-pointer" onClick={() => {
                  setIsRepeating(!isRepeating);
                  if (setRowSchedules) setRowSchedules({});
                }}>Repeat</span>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className={`text-[11px] font-bold uppercase transition-colors ${isRepeating ? "text-slate-800" : "text-slate-400"}`}>Repeat on</Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 1, label: "Monday" },
                      { id: 2, label: "Tuesday" },
                      { id: 3, label: "Wednesday" },
                      { id: 4, label: "Thursday" },
                      { id: 5, label: "Friday" },
                      { id: 6, label: "Saturday" },
                      { id: 0, label: "Sunday" },
                    ].map((day) => (
                      <button
                        key={day.id}
                        type="button"
                        disabled={!isRepeating}
                        onClick={() => {
                          setRepeatDays(prev =>
                            prev.includes(day.id) ? prev.filter(d => d !== day.id) : [...prev, day.id]
                          );
                        }}
                        className={`h-9 px-4 rounded-md text-sm font-semibold transition-all ${!isRepeating
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                          : repeatDays.includes(day.id)
                            ? "bg-[#0064cb] text-white shadow-sm shadow-[#0064cb]/20 cursor-pointer"
                            : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                          }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                  <div className="space-y-2">
                    <Label className={`text-[11px] font-bold uppercase transition-colors ${isRepeating ? "text-slate-800" : "text-slate-400"}`}>Repeat Date From</Label>
                    <Input
                      type="date"
                      disabled={!isRepeating}
                      min={today}
                      value={repeatStartDate}
                      onChange={(e) => {
                        const val = e.target.value;
                        setRepeatStartDate(val);
                      }}
                      className={`w-full h-11 bg-white border-slate-200 rounded-lg ${!isRepeating ? "opacity-60 cursor-not-allowed bg-slate-50" : ""}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className={`text-[11px] font-bold uppercase transition-colors ${isRepeating ? "text-slate-800" : "text-slate-400"}`}>Repeat Date To</Label>
                    <Input
                      type="date"
                      disabled={!isRepeating}
                      min={repeatStartDate || today}
                      value={repeatEndDate}
                      onChange={(e) => {
                        const val = e.target.value;
                        setRepeatEndDate(val);
                      }}
                      className={`w-full h-11 bg-white border-slate-200 rounded-lg ${!isRepeating ? "opacity-60 cursor-not-allowed bg-slate-50" : ""}`}
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="space-y-1">
                    <Label className="text-[14px] font-bold text-slate-900 uppercase tracking-wider">Time for each day</Label>
                    <p className="text-sm text-slate-500">Set the time for one day. It will be the same for all selected dates.</p>
                  </div>
                  <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center max-w-xl">
                    <div className="space-y-2">
                      <Label className={`text-[10px] font-bold uppercase transition-colors ${isRepeating ? "text-slate-800" : "text-slate-400"}`}>Start Time</Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          type="time"
                          disabled={!isRepeating}
                          value={repeatStartTime}
                          onChange={(e) => setRepeatStartTime(e.target.value)}
                          className={`w-full h-11 pl-10 bg-white border-slate-200 rounded-lg ${!isRepeating ? "opacity-60 cursor-not-allowed bg-slate-50" : ""}`}
                        />
                      </div>
                    </div>
                    <div className="text-slate-400 mt-6 font-bold">-</div>
                    <div className="space-y-2">
                      <Label className={`text-[10px] font-bold uppercase transition-colors ${isRepeating ? "text-slate-800" : "text-slate-400"}`}>End Time</Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          type="time"
                          disabled={!isRepeating}
                          value={repeatEndTime}
                          onChange={(e) => setRepeatEndTime(e.target.value)}
                          className={`w-full h-11 pl-10 bg-white border-slate-200 rounded-lg ${!isRepeating ? "opacity-60 cursor-not-allowed bg-slate-50" : ""}`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden md:block border border-slate-100 rounded-lg overflow-hidden w-full relative">
              <div className="overflow-auto max-h-[600px] custom-scrollbar">
                <Table className="min-w-[650px] md:min-w-full">
                  <TableHeader className="bg-slate-50/90 sticky top-0 z-10 backdrop-blur-sm outline outline-1 outline-slate-100/50">
                    <TableRow className="hover:bg-transparent border-slate-100">
                      <TableHead className="text-sm font-bold text-slate-900 py-4 px-6 w-[200px]">Date</TableHead>
                      <TableHead className="text-sm font-bold text-slate-900 py-4 px-6">Hours per Day</TableHead>
                      <TableHead className="text-sm font-bold text-slate-900 py-4 px-6">Start Date & Time</TableHead>
                      <TableHead className="text-sm font-bold text-slate-900 py-4 px-6">End Date & Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDatesList.map((date, i) => {
                      const dateKey = formatDateKey(date);
                      const row = rowSchedules[dateKey] || { checked: true, hours: "", startTime: "", endTime: "" };
                      const rowMin = dateKey === today ? now : `${dateKey}T00:00`;

                      return (
                        <TableRow key={i} className="border-slate-50">
                          <TableCell className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={row.checked}
                                onChange={(e) => handleRowChange(dateKey, 'checked', e.target.checked)}
                                className="w-4 h-4 rounded border-slate-300 text-[#0064cb] focus:ring-[#0064cb] cursor-pointer"
                              />
                              <span className="text-sm font-bold text-slate-700">
                                {formatDate(date, false)} <span className="text-slate-400 font-semibold text-[11px] ml-1">( {date.toLocaleDateString('en-US', { weekday: 'short' })} )</span>
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 px-6">
                            <Input
                              type="text"
                              placeholder="e.g., 8:00"
                              value={row.hours}
                              onChange={(e) => {
                                let val = e.target.value;
                                if (val === "") {
                                  handleRowChange(dateKey, 'hours', "");
                                  return;
                                }
                                val = val.replace(/\./g, ':').replace(/[^0-9:]/g, '');
                                let h = 0, m = 0;
                                if (val.includes(':')) {
                                  const parts = val.split(':');
                                  let hoursPart = parts[0];
                                  let minutesPart = parts.slice(1).join('').substring(0, 2);
                                  h = parseFloat(hoursPart) || 0;
                                  m = parseFloat(minutesPart) || 0;
                                  if (m >= 60) {
                                    h += Math.floor(m / 60);
                                    m = m % 60;
                                    hoursPart = h.toString().padStart(hoursPart.length >= 2 ? 2 : 1, '0');
                                    minutesPart = m.toString().padStart(2, '0');
                                  }
                                  val = `${hoursPart}:${minutesPart}`;
                                } else {
                                  h = parseFloat(val) || 0;
                                }
                                if (h > 24 || (h === 24 && m > 0)) {
                                  val = "24:00";
                                }
                                if (h === 0 && m === 0 && (val === "00:00" || val === "0:00")) {
                                  val = "0:01";
                                }
                                handleRowChange(dateKey, 'hours', val);
                              }}
                              className="h-10 bg-white border-slate-200 focus:border-[#0064cb] focus:ring-[#0064cb]/10 rounded-lg font-medium text-slate-700"
                            />
                          </TableCell>
                          <TableCell className="py-4 px-6">
                            <div className="relative">
                              <Input
                                type="datetime-local"
                                min={rowMin}
                                value={row.startTime}
                                onChange={(e) => handleRowChange(dateKey, 'startTime', e.target.value)}
                                className="h-10 border-slate-200 focus:border-[#0064cb] focus:ring-[#0064cb]/10 rounded-lg"
                              />
                            </div>
                          </TableCell>
                          <TableCell className="py-4 px-6">
                            <div className="relative">
                              <Input
                                type="datetime-local"
                                min={row.startTime || rowMin}
                                value={row.endTime}
                                onChange={(e) => handleRowChange(dateKey, 'endTime', e.target.value)}
                                className="h-10 border-slate-200 focus:border-[#0064cb] focus:ring-[#0064cb]/10 rounded-lg"
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="block md:hidden space-y-4 w-full overflow-auto max-h-[600px] custom-scrollbar pr-1">
              {filteredDatesList.map((date, i) => {
                const dateKey = formatDateKey(date);
                const row = rowSchedules[dateKey] || { checked: true, hours: "", startTime: "", endTime: "" };
                const rowMin = dateKey === today ? now : `${dateKey}T00:00`;

                return (
                  <div key={i} className={`p-4 rounded-xl border transition-all ${row.checked ? 'bg-white border-slate-100 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={row.checked}
                          onChange={(e) => handleRowChange(dateKey, 'checked', e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-[#0064cb] focus:ring-[#0064cb] cursor-pointer"
                        />
                        <span className="text-sm font-bold text-slate-800">
                          {formatDate(date, false)} <span className="text-slate-400 font-semibold text-[11px] ml-1">( {date.toLocaleDateString('en-US', { weekday: 'short' })} )</span>
                        </span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${row.checked ? 'bg-blue-50 text-[#0064cb]' : 'bg-slate-200 text-slate-500'}`}>
                        {row.checked ? 'Active' : 'Skipped'}
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hours per Day</Label>
                        <Input
                          type="text"
                          disabled={!row.checked}
                          placeholder="e.g., 8:00"
                          value={row.hours}
                          onChange={(e) => {
                            let val = e.target.value;
                            if (val === "") {
                              handleRowChange(dateKey, 'hours', "");
                              return;
                            }
                            val = val.replace(/\./g, ':').replace(/[^0-9:]/g, '');
                            let h = 0, m = 0;
                            if (val.includes(':')) {
                              const parts = val.split(':');
                              let hoursPart = parts[0];
                              let minutesPart = parts.slice(1).join('').substring(0, 2);
                              h = parseFloat(hoursPart) || 0;
                              m = parseFloat(minutesPart) || 0;
                              if (m >= 60) {
                                h += Math.floor(m / 60);
                                m = m % 60;
                                hoursPart = h.toString().padStart(hoursPart.length >= 2 ? 2 : 1, '0');
                                minutesPart = m.toString().padStart(2, '0');
                              }
                              val = `${hoursPart}:${minutesPart}`;
                            } else {
                              h = parseFloat(val) || 0;
                            }
                            if (h > 24 || (h === 24 && m > 0)) {
                              val = "24:00";
                            }
                            if (h === 0 && m === 0 && (val === "00:00" || val === "0:00")) {
                              val = "0:01";
                            }
                            handleRowChange(dateKey, 'hours', val);
                          }}
                          className="h-10 bg-white border-slate-200 focus:border-[#0064cb] focus:ring-[#0064cb]/10 rounded-lg font-medium text-slate-700 disabled:bg-slate-100 disabled:text-slate-400"
                        />
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Start Time</Label>
                          <Input
                            type="datetime-local"
                            min={rowMin}
                            disabled={!row.checked}
                            value={row.startTime}
                            onChange={(e) => handleRowChange(dateKey, 'startTime', e.target.value)}
                            className="h-10 border-slate-200 focus:border-[#0064cb] focus:ring-[#0064cb]/10 rounded-lg text-sm disabled:bg-slate-100 disabled:text-slate-400"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">End Time</Label>
                          <Input
                            type="datetime-local"
                            min={row.startTime || rowMin}
                            disabled={!row.checked}
                            value={row.endTime}
                            onChange={(e) => handleRowChange(dateKey, 'endTime', e.target.value)}
                            className="h-10 border-slate-200 focus:border-[#0064cb] focus:ring-[#0064cb]/10 rounded-lg text-sm disabled:bg-slate-100 disabled:text-slate-400"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="sticky bottom-0 z-20 px-6 py-4 bg-white/95 backdrop-blur-sm border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] rounded-b-xl">
            <Button
              variant="outline"
              onClick={onCancelAdd}
              className="px-6 h-10 rounded-lg font-bold text-slate-600 border-slate-200 hover:bg-slate-50 transition-all cursor-pointer w-full sm:w-auto"
            >
              Back
            </Button>
            <Button
              onClick={() => {
                const validKeys = filteredDatesList.map(d => formatDateKey(d));
                onCreateShifts(validKeys);
              }}
              disabled={isCreating}
              className="bg-[#0064cb] hover:bg-[#0052ae] text-white px-8 h-10 rounded-lg font-bold shadow-md shadow-[#0064cb]/10 transition-all min-w-[120px] cursor-pointer w-full sm:w-auto flex justify-center items-center"
            >
              {isCreating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Update"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
