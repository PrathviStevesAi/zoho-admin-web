import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Edit2, Loader2, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Shift } from "./types";
import {
  toLocalDateTimeString,
  toUTCISO,
  getStatusColor,
  formatStatus,
  formatDateTime
} from "./utils";

interface ShiftDetailsCardProps {
  shift: Shift | null;
  isLoading: boolean;
  error: string | null;
  isSavingDetails: boolean;
  onSaveDetails: (payload: any) => Promise<void>;
  isAddressEditable: boolean;
  setIsEditLocationOpen: (open: boolean) => void;
}

export function ShiftDetailsCard({
  shift,
  isLoading,
  error,
  isSavingDetails,
  onSaveDetails,
  isAddressEditable,
  setIsEditLocationOpen,
}: ShiftDetailsCardProps) {
  const router = useRouter();
  
  type EditingField = 
    | "shift_description" 
    | "scheduled_for" 
    | "execution_time" 
    | "per_hour_rate" 
    | "per_shift_rate" 
    | "travel_fee" 
    | null;
  const [editingField, setEditingField] = useState<EditingField>(null);

  const isPerHourRateSet = shift?.per_hour_rate !== null && shift?.per_hour_rate !== undefined && Number(shift.per_hour_rate) > 0;
  const isPerShiftRateSet = shift?.per_shift_rate !== null && shift?.per_shift_rate !== undefined && Number(shift.per_shift_rate) > 0;

  const formatPrice = (val: any) => {
    if (val === null || val === undefined || val === "") return "----";
    const num = Number(val);
    if (isNaN(num)) return "----";
    return `$${num.toFixed(2)}`;
  };

  const [editDetailsForm, setEditDetailsForm] = useState({
    shift_description: "",
    shift_start_time: "",
    shift_end_time: "",
    guard_shift_started_at: "",
    guard_shift_ended_at: "",
    per_hour_rate: "",
    per_shift_rate: "",
    travel_fee: "",
  });

  const [minDateTime, setMinDateTime] = useState("");

  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    setMinDateTime(`${year}-${month}-${day}T${hours}:${minutes}`);
  }, []);

  useEffect(() => {
    if (shift) {
      setEditDetailsForm({
        shift_description: shift.shift_description || "",
        shift_start_time: toLocalDateTimeString(shift.scheduled_for?.shift_start_time || ""),
        shift_end_time: toLocalDateTimeString(shift.scheduled_for?.shift_end_time || ""),
        guard_shift_started_at: toLocalDateTimeString(shift.execution_time?.guard_shift_started_at || ""),
        guard_shift_ended_at: toLocalDateTimeString(shift.execution_time?.guard_shift_ended_at || ""),
        per_hour_rate: shift.per_hour_rate !== null && shift.per_hour_rate !== undefined ? String(shift.per_hour_rate) : "",
        per_shift_rate: shift.per_shift_rate !== null && shift.per_shift_rate !== undefined ? String(shift.per_shift_rate) : "",
        travel_fee: shift.travel_fee !== null && shift.travel_fee !== undefined ? String(shift.travel_fee) : "",
      });
    }
  }, [shift]);

  if (isLoading) {
    return (
      <Card className="border-slate-200 shadow-sm overflow-hidden rounded-xl bg-white p-6 space-y-6 animate-pulse">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="h-7 w-32 bg-slate-200 rounded-lg" />
          <div className="h-8 w-24 bg-slate-100/80 rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-20 bg-slate-200 rounded" />
          <div className="h-4 w-72 bg-slate-100/80 rounded" />
        </div>
        <div className="space-y-4 pt-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="grid grid-cols-4 py-2 border-b border-slate-55 last:border-none items-center gap-4">
              <div className="h-3.5 bg-slate-200 rounded w-24" />
              <div className="col-span-3 h-4 bg-slate-100/80 rounded w-1/2" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (!shift) {
    return (
      <Card className="border-slate-200 shadow-sm rounded-xl bg-white p-10 text-center">
        <XCircle className="w-12 h-12 text-red-200 mx-auto mb-4" />
        <p className="text-sm font-bold text-slate-600 mb-1">{error || "No shift data found"}</p>
        <p className="text-xs text-slate-700 font-medium">The shift may have been deleted or the ID is invalid.</p>
        <Button
          variant="outline"
          className="cursor-pointer mt-6 h-9 rounded-xl text-xs font-bold text-[#0064cb] border-blue-100 hover:bg-blue-50"
          onClick={() => router.push("/dashboard")}
        >
          Return to Dashboard
        </Button>
      </Card>
    );
  }

  const handleSaveField = async (field: Exclude<EditingField, null>) => {
    const payload: any = {};
    let dirty = false;

    switch (field) {
      case "shift_description":
        if (editDetailsForm.shift_description !== (shift.shift_description || "")) {
          payload.shift_description = editDetailsForm.shift_description;
          dirty = true;
        }
        break;
      case "scheduled_for":
        const initialScheduledStart = toLocalDateTimeString(shift.scheduled_for?.shift_start_time || "");
        const initialScheduledEnd = toLocalDateTimeString(shift.scheduled_for?.shift_end_time || "");
        if (
          editDetailsForm.shift_start_time !== initialScheduledStart ||
          editDetailsForm.shift_end_time !== initialScheduledEnd
        ) {
          const tz = shift.shipping_location?.timezone;
          payload.shift_time = {
            start_time: toUTCISO(editDetailsForm.shift_start_time, tz),
            end_time: toUTCISO(editDetailsForm.shift_end_time, tz)
          };
          dirty = true;
        }
        break;
      case "execution_time":
        const initialExecStart = toLocalDateTimeString(shift.execution_time?.guard_shift_started_at || "");
        const initialExecEnd = toLocalDateTimeString(shift.execution_time?.guard_shift_ended_at || "");
        if (
          editDetailsForm.guard_shift_started_at !== initialExecStart ||
          editDetailsForm.guard_shift_ended_at !== initialExecEnd
        ) {
          const tz = shift.shipping_location?.timezone;
          payload.shift_execution_time = {
            guard_shift_started_at: toUTCISO(editDetailsForm.guard_shift_started_at, tz),
            guard_shift_ended_at: toUTCISO(editDetailsForm.guard_shift_ended_at, tz),
            start_time: toUTCISO(editDetailsForm.guard_shift_started_at, tz),
            end_time: toUTCISO(editDetailsForm.guard_shift_ended_at, tz),
            total_break_duration_min: shift.execution_time?.total_break_duration_min ?? 0
          };
          dirty = true;
        }
        break;
      case "per_hour_rate":
        const initialPerHourRate = shift.per_hour_rate !== null && shift.per_hour_rate !== undefined ? String(shift.per_hour_rate) : "";
        if (editDetailsForm.per_hour_rate !== initialPerHourRate) {
          const newRate = editDetailsForm.per_hour_rate === "" ? 0 : Number(editDetailsForm.per_hour_rate);
          payload.per_hour_rate = newRate;
          if (newRate > 0) {
            payload.per_shift_rate = 0;
          }
          dirty = true;
        }
        break;
      case "per_shift_rate":
        const initialPerShiftRate = shift.per_shift_rate !== null && shift.per_shift_rate !== undefined ? String(shift.per_shift_rate) : "";
        if (editDetailsForm.per_shift_rate !== initialPerShiftRate) {
          const newRate = editDetailsForm.per_shift_rate === "" ? 0 : Number(editDetailsForm.per_shift_rate);
          payload.per_shift_rate = newRate;
          if (newRate > 0) {
            payload.per_hour_rate = 0;
          }
          dirty = true;
        }
        break;
      case "travel_fee":
        const initialTravelFee = shift.travel_fee !== null && shift.travel_fee !== undefined ? String(shift.travel_fee) : "";
        if (editDetailsForm.travel_fee !== initialTravelFee) {
          payload.travel_fee = editDetailsForm.travel_fee === "" ? 0 : Number(editDetailsForm.travel_fee);
          dirty = true;
        }
        break;
    }

    if (!dirty) {
      setEditingField(null);
      return;
    }

    payload.shift_description = editDetailsForm.shift_description;
    await onSaveDetails(payload);
    setEditingField(null);
  };

  const renderEditButtons = (field: Exclude<EditingField, null>, onCancel: () => void) => {
    return (
      <div className="flex items-center gap-2 mt-2 self-end">
        <Button
          variant="outline"
          onClick={onCancel}
          className="px-3 h-8 rounded-lg font-bold border-slate-200 text-[10px] text-slate-800 hover:bg-slate-50 transition-all cursor-pointer"
        >
          Cancel
        </Button>
        <Button
          onClick={() => handleSaveField(field)}
          disabled={isSavingDetails}
          className="bg-[#0064cb] hover:bg-[#0052ae] text-white px-3 h-8 rounded-lg font-bold text-[10px] shadow-md shadow-blue-100 transition-all active:scale-95 flex gap-1.5 cursor-pointer"
        >
          {isSavingDetails ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
        </Button>
      </div>
    );
  };

  const renderEditIcon = (field: Exclude<EditingField, null>, isAllowed: boolean, isDisabled?: boolean, disabledTooltip?: string) => {
    const isEffectivelyDisabled = !isAllowed || isDisabled;
    const tooltipText = !isAllowed 
      ? "Once a shift is execute, its details cannot be updated." 
      : (isDisabled ? disabledTooltip : `Edit ${field.replace("_", " ")}`);

    return (
      <div title={tooltipText} className={cn("inline-block ml-2", isEffectivelyDisabled && "cursor-not-allowed")}>
        <Button
          variant="outline"
          size="icon"
          disabled={isEffectivelyDisabled}
          onClick={() => !isEffectivelyDisabled && setEditingField(field)}
          className={cn(
            "h-7 w-7 rounded-lg shrink-0 transition-all",
            isEffectivelyDisabled
              ? "text-slate-400 bg-slate-50 border-slate-200 pointer-events-none"
              : "text-slate-400 hover:text-[#0064cb] bg-white border border-slate-200 hover:bg-slate-50 cursor-pointer shadow-sm"
          )}
        >
          <Edit2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    );
  };

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden rounded-xl bg-white">
      <CardContent className="p-0">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-slate-700">#SH-{shift.shift_no}</span>
            <Button
              variant="outline"
              disabled={!isAddressEditable}
              onClick={() => {
                if (isAddressEditable) {
                  setIsEditLocationOpen(true);
                }
              }}
              title={isAddressEditable ? "Edit location" : "Location editing is only allowed for: Created, Planned, Accepted, Refused statuses"}
              className={cn(
                "h-8 rounded-lg font-bold text-[10px] flex gap-1.5 px-3 transition-all active:scale-95",
                isAddressEditable
                  ? "text-[#0064cb] border-[#0064cb]/20 hover:bg-blue-50 cursor-pointer"
                  : "text-slate-400 border-slate-200 bg-slate-50 cursor-not-allowed opacity-60"
              )}
            >
              <Edit2 className="w-3 h-3" />
              Edit Location
            </Button>
          </div>

          {shift.shipping_location?.location && (
            <div className="space-y-1">
              <p className="text-slate-600 font-bold text-sm">
                Location - <span className="text-[#0064cb] cursor-pointer hover:underline">
                  {[
                    shift.shipping_location.location.street,
                    shift.shipping_location.location.city,
                    shift.shipping_location.location.state,
                    shift.shipping_location.location.country,
                    shift.shipping_location.location.zip,
                  ].filter(Boolean).join(", ")}
                </span>
              </p>
              {shift.shipping_location.timezone && (
                <p className="text-slate-600 font-bold text-md">
                  Timezone: <span className="text-slate-800 font-medium">{shift.shipping_location.timezone}</span>
                </p>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 divide-y divide-slate-100">
          <div className="flex flex-col md:grid md:grid-cols-4 p-4 items-start md:items-center gap-2 md:gap-0">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">CUSTOMER NAME:</span>
            <div className="w-full md:col-span-3 text-sm font-medium">
              {shift.customer_id ? (
                <Link href={`/users-directory/customers/${shift.customer_id}`} className="text-[#0064cb] hover:underline">
                  {shift.customer_name}
                </Link>
              ) : (
                <span className="text-slate-800">{shift.customer_name}</span>
              )}
            </div>
          </div>

          {shift.invoice_no && (
            <div className="flex flex-col md:grid md:grid-cols-4 p-4 items-start md:items-center gap-2 md:gap-0">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">INVOICE NO:</span>
              <div className="w-full md:col-span-3 text-sm text-slate-800 font-medium">{shift.invoice_no}</div>
            </div>
          )}

          {shift.invoice_description && (
            <div className="flex flex-col md:grid md:grid-cols-4 p-4 items-start gap-2 md:gap-0">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-tight pt-1">INVOICE DETAILS:</span>
              <div className="w-full md:col-span-3 text-sm text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                {shift.invoice_description}
              </div>
            </div>
          )}

          <div className="flex flex-col md:grid md:grid-cols-4 p-4 items-start gap-2 md:gap-0">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-tight pt-1">SHIFT DETAILS:</span>
            <div className="w-full md:col-span-3">
              {editingField === "shift_description" ? (
                <div className="w-full flex flex-col gap-2">
                  <textarea
                    rows={4}
                    value={editDetailsForm.shift_description}
                    onChange={(e) => setEditDetailsForm(prev => ({ ...prev, shift_description: e.target.value }))}
                    placeholder="Enter shift details..."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0064cb]/5 focus-visible:border-[#0064cb] transition-all min-h-[100px] resize-none text-slate-800"
                  />
                  {renderEditButtons("shift_description", () => {
                    setEditDetailsForm(prev => ({ ...prev, shift_description: shift.shift_description || "" }));
                    setEditingField(null);
                  })}
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="text-sm text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                    {shift.shift_description || "No shift details provided."}
                  </div>
                  {renderEditIcon("shift_description", !!shift.action?.is_shift_details_edit)}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col md:grid md:grid-cols-4 p-4 items-start md:items-center gap-2 md:gap-0">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">ASSIGNED GUARD:</span>
            <div className="w-full md:col-span-3 text-sm font-medium">
              {(() => {
                if (!shift.assigned_guard) {
                  return <span className="text-slate-700">No guard assigned</span>;
                }
                const guard = shift.assigned_guard;
                const isObject = typeof guard === 'object' && guard !== null;
                const guardId = isObject ? ((guard as any).guard_id || (guard as any).id) : null;
                const guardName = isObject 
                  ? (`${(guard as any).first_name || ""} ${(guard as any).last_name || ""}`.trim() || (guard as any).name || "Unknown Guard")
                  : (guard as string);

                return <span className="text-slate-800">{guardName}</span>;
              })()}
            </div>
          </div>

          <div className="flex flex-col md:grid md:grid-cols-4 p-4 items-start md:items-center gap-2 md:gap-0">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">STATUS:</span>
            <div className="w-full md:col-span-3">
              <span className={cn(
                "text-[10px] font-bold px-2.5 py-1 rounded-full border",
                getStatusColor(shift.status)
              )}>
                {formatStatus(shift.status)}
              </span>
            </div>
          </div>

          <div className="flex flex-col md:grid md:grid-cols-4 p-4 items-start md:items-center gap-2 md:gap-0">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">SCHEDULED FOR:</span>
            <div className="w-full md:col-span-3">
              {editingField === "scheduled_for" ? (
                <div className="w-full flex flex-col gap-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-slate-700 uppercase">Start Time</Label>
                      <Input
                        type="datetime-local"
                        min={minDateTime}
                        value={editDetailsForm.shift_start_time}
                        onChange={(e) => setEditDetailsForm(prev => ({ ...prev, shift_start_time: e.target.value }))}
                        className="h-10 bg-slate-50 border-slate-200 focus:bg-white focus:ring-[#0064cb]/5 focus:border-[#0064cb] rounded-lg text-sm text-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-slate-700 uppercase">End Time</Label>
                      <Input
                        type="datetime-local"
                        min={editDetailsForm.shift_start_time || minDateTime}
                        value={editDetailsForm.shift_end_time}
                        onChange={(e) => setEditDetailsForm(prev => ({ ...prev, shift_end_time: e.target.value }))}
                        className="h-10 bg-slate-50 border-slate-200 focus:bg-white focus:ring-[#0064cb]/5 focus:border-[#0064cb] rounded-lg text-sm text-slate-800"
                      />
                    </div>
                  </div>
                  {renderEditButtons("scheduled_for", () => {
                    setEditDetailsForm(prev => ({
                      ...prev,
                      shift_start_time: toLocalDateTimeString(shift.scheduled_for?.shift_start_time || ""),
                      shift_end_time: toLocalDateTimeString(shift.scheduled_for?.shift_end_time || ""),
                    }));
                    setEditingField(null);
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    {shift.scheduled_for?.shift_start_time && (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-700 uppercase font-bold w-12">Start:</span>
                        <span className="text-sm text-slate-800 font-medium">{formatDateTime(shift.scheduled_for.shift_start_time)}</span>
                      </div>
                    )}
                    {shift.scheduled_for?.shift_end_time && (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-700 uppercase font-bold w-12">End:</span>
                        <span className="text-sm text-slate-800 font-medium">{formatDateTime(shift.scheduled_for.shift_end_time)}</span>
                      </div>
                    )}
                    {!shift.scheduled_for?.shift_start_time && !shift.scheduled_for?.shift_end_time && (
                      <span className="text-sm text-slate-700 font-medium">N/A</span>
                    )}
                  </div>
                  {renderEditIcon("scheduled_for", !!shift.action?.is_schedule_for_edit)}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col md:grid md:grid-cols-4 p-4 items-start md:items-center gap-2 md:gap-0">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">EXECUTION TIME:</span>
            <div className="w-full md:col-span-3">
              {editingField === "execution_time" ? (
                <div className="w-full flex flex-col gap-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-slate-700 uppercase">Actual Start Time</Label>
                      <Input
                        type="datetime-local"
                        min={minDateTime}
                        value={editDetailsForm.guard_shift_started_at}
                        onChange={(e) => setEditDetailsForm(prev => ({ ...prev, guard_shift_started_at: e.target.value }))}
                        className="h-10 bg-slate-50 border-slate-200 focus:bg-white focus:ring-[#0064cb]/5 focus:border-[#0064cb] rounded-lg text-sm text-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-slate-700 uppercase">Actual End Time</Label>
                      <Input
                        type="datetime-local"
                        min={editDetailsForm.guard_shift_started_at || minDateTime}
                        value={editDetailsForm.guard_shift_ended_at}
                        onChange={(e) => setEditDetailsForm(prev => ({ ...prev, guard_shift_ended_at: e.target.value }))}
                        className="h-10 bg-slate-50 border-slate-200 focus:bg-white focus:ring-[#0064cb]/5 focus:border-[#0064cb] rounded-lg text-sm text-slate-800"
                      />
                    </div>
                  </div>
                  {renderEditButtons("execution_time", () => {
                    setEditDetailsForm(prev => ({
                      ...prev,
                      guard_shift_started_at: toLocalDateTimeString(shift.execution_time?.guard_shift_started_at || ""),
                      guard_shift_ended_at: toLocalDateTimeString(shift.execution_time?.guard_shift_ended_at || ""),
                    }));
                    setEditingField(null);
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    {shift.execution_time?.guard_shift_started_at && (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-700 uppercase font-bold w-12">Start:</span>
                        <span className="text-sm text-slate-800 font-medium">{formatDateTime(shift.execution_time.guard_shift_started_at)}</span>
                      </div>
                    )}
                    {shift.execution_time?.guard_shift_ended_at && (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-700 uppercase font-bold w-12">End:</span>
                        <span className="text-sm text-slate-800 font-medium">{formatDateTime(shift.execution_time.guard_shift_ended_at)}</span>
                      </div>
                    )}
                    {shift.execution_time?.total_break_duration_min && shift.execution_time.total_break_duration_min > 0 ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-700 uppercase font-bold w-12">Break:</span>
                        <span className="text-sm text-slate-800 font-medium">
                          {(() => {
                            const mins = shift.execution_time.total_break_duration_min;
                            if (mins < 60) {
                              return `${mins} min`;
                            }
                            const hrs = mins / 60;
                            return mins % 60 === 0 ? `${hrs.toFixed(1)} hr` : `${hrs.toFixed(2)} hr`;
                          })()}
                        </span>
                      </div>
                    ) : null}
                    {!shift.execution_time?.guard_shift_started_at && !shift.execution_time?.guard_shift_ended_at && (
                      <span className="text-sm text-slate-700 font-medium">N/A</span>
                    )}
                  </div>
                  {renderEditIcon("execution_time", !!shift.action?.is_execution_time_edit)}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col md:grid md:grid-cols-4 p-4 items-start md:items-center gap-2 md:gap-0">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">Hourly rate paid to guard:</span>
            <div className="w-full md:col-span-3">
              {editingField === "per_hour_rate" ? (
                <div className="w-full flex flex-col gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={editDetailsForm.per_hour_rate}
                    onChange={(e) => setEditDetailsForm(prev => ({ ...prev, per_hour_rate: e.target.value }))}
                    className="h-10 bg-slate-50 border-slate-200 focus:bg-white focus:ring-[#0064cb]/5 focus:border-[#0064cb] rounded-lg text-sm text-slate-800"
                  />
                  {renderEditButtons("per_hour_rate", () => {
                    setEditDetailsForm(prev => ({ ...prev, per_hour_rate: shift.per_hour_rate !== null && shift.per_hour_rate !== undefined ? String(shift.per_hour_rate) : "" }));
                    setEditingField(null);
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-slate-800 font-medium">
                    {shift ? formatPrice(shift.per_hour_rate) : "----"}
                  </span>
                  {renderEditIcon("per_hour_rate", !!shift.action?.is_hourly_rate_edit, isPerShiftRateSet, "Clear Flat Rate paid to guard first to edit Hourly Rate")}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col md:grid md:grid-cols-4 p-4 items-start md:items-center gap-2 md:gap-0">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">Flat rate paid to guard:</span>
            <div className="w-full md:col-span-3">
              {editingField === "per_shift_rate" ? (
                <div className="w-full flex flex-col gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={editDetailsForm.per_shift_rate}
                    onChange={(e) => setEditDetailsForm(prev => ({ ...prev, per_shift_rate: e.target.value }))}
                    className="h-10 bg-slate-50 border-slate-200 focus:bg-white focus:ring-[#0064cb]/5 focus:border-[#0064cb] rounded-lg text-sm text-slate-800"
                  />
                  {renderEditButtons("per_shift_rate", () => {
                    setEditDetailsForm(prev => ({ ...prev, per_shift_rate: shift.per_shift_rate !== null && shift.per_shift_rate !== undefined ? String(shift.per_shift_rate) : "" }));
                    setEditingField(null);
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-slate-800 font-medium">
                    {shift ? formatPrice(shift.per_shift_rate) : "----"}
                  </span>
                  {renderEditIcon("per_shift_rate", !!shift.action?.is_flat_rate_edit, isPerHourRateSet, "Clear Hourly Rate paid to guard first to edit Flat Rate")}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col md:grid md:grid-cols-4 p-4 items-start md:items-center gap-2 md:gap-0">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">Travel Fees:</span>
            <div className="w-full md:col-span-3">
              {editingField === "travel_fee" ? (
                <div className="w-full flex flex-col gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={editDetailsForm.travel_fee}
                    onChange={(e) => setEditDetailsForm(prev => ({ ...prev, travel_fee: e.target.value }))}
                    className="h-10 bg-slate-50 border-slate-200 focus:bg-white focus:ring-[#0064cb]/5 focus:border-[#0064cb] rounded-lg text-sm text-slate-800"
                  />
                  {renderEditButtons("travel_fee", () => {
                    setEditDetailsForm(prev => ({ ...prev, travel_fee: shift.travel_fee !== null && shift.travel_fee !== undefined ? String(shift.travel_fee) : "" }));
                    setEditingField(null);
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-slate-800 font-medium">
                    {shift ? formatPrice(shift.travel_fee) : "----"}
                  </span>
                  {renderEditIcon("travel_fee", !!shift.action?.is_travel_fee_edit)}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
