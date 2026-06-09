import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  const [isEditDetailsOpen, setIsEditDetailsOpen] = useState(false);

  const formatPrice = (val: any) => {
    if (val === null || val === undefined || val === "") return "----";
    const num = Number(val);
    if (isNaN(num)) return "----";
    return `$${num.toFixed(2)}`;
  };

  const isDetailsEditable = shift
    ? ["shift_created", "shift_planned", "shift_accepted", "shift_refused", "shift_arrival", "shift_pre_check_in"].includes(
      shift.status?.toLowerCase()
    )
    : false;

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
      <Card className="border-slate-200 shadow-sm rounded-xl bg-white p-20 text-center">
        <XCircle className="w-12 h-12 text-red-200 mx-auto mb-4" />
        <p className="text-sm font-bold text-slate-600 mb-1">{error || "No shift data found"}</p>
        <p className="text-xs text-slate-700 font-medium">The shift may have been deleted or the ID is invalid.</p>
        <Button
          variant="outline"
          className="mt-6 h-9 rounded-xl text-xs font-bold text-[#0064cb] border-blue-100 hover:bg-blue-50"
          onClick={() => router.push("/dashboard")}
        >
          Return to Dashboard
        </Button>
      </Card>
    );
  }

  const handleSaveDetails = async () => {
    const payload: any = {};
    let dirty = false;

    // 1. Shift Duties
    if (editDetailsForm.shift_description !== (shift.shift_description || "")) {
      payload.shift_description = editDetailsForm.shift_description;
      dirty = true;
    }

    // 2. Scheduled For
    const initialScheduledStart = toLocalDateTimeString(shift.scheduled_for?.shift_start_time || "");
    const initialScheduledEnd = toLocalDateTimeString(shift.scheduled_for?.shift_end_time || "");
    if (
      editDetailsForm.shift_start_time !== initialScheduledStart ||
      editDetailsForm.shift_end_time !== initialScheduledEnd
    ) {
      payload.shift_time = {
        shift_start_time: toUTCISO(editDetailsForm.shift_start_time),
        shift_end_time: toUTCISO(editDetailsForm.shift_end_time),
        start_time: toUTCISO(editDetailsForm.shift_start_time),
        end_time: toUTCISO(editDetailsForm.shift_end_time)
      };
      dirty = true;
    }

    // 3. Execution Time
    const initialExecStart = toLocalDateTimeString(shift.execution_time?.guard_shift_started_at || "");
    const initialExecEnd = toLocalDateTimeString(shift.execution_time?.guard_shift_ended_at || "");

    if (
      editDetailsForm.guard_shift_started_at !== initialExecStart ||
      editDetailsForm.guard_shift_ended_at !== initialExecEnd
    ) {
      payload.shift_execution_time = {
        guard_shift_started_at: toUTCISO(editDetailsForm.guard_shift_started_at),
        guard_shift_ended_at: toUTCISO(editDetailsForm.guard_shift_ended_at),
        start_time: toUTCISO(editDetailsForm.guard_shift_started_at),
        end_time: toUTCISO(editDetailsForm.guard_shift_ended_at),
        total_break_duration_min: shift.execution_time?.total_break_duration_min ?? 0
      };
      dirty = true;
    }

    // 4. Per Hour Rate
    const initialPerHourRate = shift.per_hour_rate !== null && shift.per_hour_rate !== undefined ? String(shift.per_hour_rate) : "";
    if (editDetailsForm.per_hour_rate !== initialPerHourRate) {
      payload.per_hour_rate = editDetailsForm.per_hour_rate === "" ? 0 : Number(editDetailsForm.per_hour_rate);
      dirty = true;
    }

    // 5. Flat Rate (per_shift_rate)
    const initialPerShiftRate = shift.per_shift_rate !== null && shift.per_shift_rate !== undefined ? String(shift.per_shift_rate) : "";
    if (editDetailsForm.per_shift_rate !== initialPerShiftRate) {
      payload.per_shift_rate = editDetailsForm.per_shift_rate === "" ? 0 : Number(editDetailsForm.per_shift_rate);
      dirty = true;
    }

    // 6. Travel Fee
    const initialTravelFee = shift.travel_fee !== null && shift.travel_fee !== undefined ? String(shift.travel_fee) : "";
    if (editDetailsForm.travel_fee !== initialTravelFee) {
      payload.travel_fee = editDetailsForm.travel_fee === "" ? 0 : Number(editDetailsForm.travel_fee);
      dirty = true;
    }

    if (!dirty) {
      setIsEditDetailsOpen(false);
      return;
    }

    await onSaveDetails(payload);
    setIsEditDetailsOpen(false);
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
            <div className="w-full md:col-span-3 flex items-center justify-between gap-4">
              <div className="text-sm text-slate-800 font-medium">{shift.customer_name}</div>
              <div className="flex items-center gap-2">
                {isEditDetailsOpen ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditDetailsOpen(false)}
                      className="px-3 h-8 rounded-lg font-bold border-slate-200 text-[10px] text-slate-800 hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveDetails}
                      disabled={isSavingDetails}
                      className="bg-[#0064cb] hover:bg-[#0052ae] text-white px-3 h-8 rounded-lg font-bold text-[10px] shadow-md shadow-blue-100 transition-all active:scale-95 flex gap-1.5 cursor-pointer"
                    >
                      {isSavingDetails ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    disabled={!isDetailsEditable}
                    onClick={() => {
                      if (isDetailsEditable) {
                        setIsEditDetailsOpen(true);
                      }
                    }}
                    title={isDetailsEditable ? "Edit details" : "Editing details is only allowed for Created, Planned, Accepted, Refused, Arrival, and Pre-check-in statuses"}
                    className={cn(
                      "h-8 rounded-lg font-bold text-[10px] flex gap-1.5 px-3 transition-all",
                      isDetailsEditable
                        ? "text-[#0064cb] border-[#0064cb]/20 hover:bg-blue-50 active:scale-95 cursor-pointer"
                        : "text-slate-400 border-slate-200 bg-slate-50 cursor-not-allowed opacity-60"
                    )}
                  >
                    <Edit2 className="w-3 h-3" />
                    Edit Details
                  </Button>
                )}
              </div>
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
              {isEditDetailsOpen ? (
                <textarea
                  rows={4}
                  value={editDetailsForm.shift_description}
                  onChange={(e) => setEditDetailsForm(prev => ({ ...prev, shift_description: e.target.value }))}
                  placeholder="Enter shift details..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0064cb]/5 focus-visible:border-[#0064cb] transition-all min-h-[100px] resize-none text-slate-800"
                />
              ) : (
                <div className="text-sm text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                  {shift.shift_description || "No shift details provided."}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col md:grid md:grid-cols-4 p-4 items-start md:items-center gap-2 md:gap-0">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">ASSIGNED GUARD:</span>
            <div className="w-full md:col-span-3 text-sm text-slate-800 font-medium">
              {shift.assigned_guard ? (
                typeof shift.assigned_guard === 'object'
                  ? `${shift.assigned_guard.first_name} ${shift.assigned_guard.last_name}`
                  : shift.assigned_guard
              ) : (
                <span className="text-slate-700">No guard assigned</span>
              )}
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
              {isEditDetailsOpen ? (
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
              ) : (
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
              )}
            </div>
          </div>

          <div className="flex flex-col md:grid md:grid-cols-4 p-4 items-start md:items-center gap-2 md:gap-0">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">EXECUTION TIME:</span>
            <div className="w-full md:col-span-3">
              {isEditDetailsOpen ? (
                <div className="space-y-3">
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
                </div>
              ) : (
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
              )}
            </div>
          </div>

          <div className="flex flex-col md:grid md:grid-cols-4 p-4 items-start md:items-center gap-2 md:gap-0">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">Hourly rate paid to guard:</span>
            <div className="w-full md:col-span-3">
              {isEditDetailsOpen ? (
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={editDetailsForm.per_hour_rate}
                  onChange={(e) => setEditDetailsForm(prev => ({ ...prev, per_hour_rate: e.target.value }))}
                  className="h-10 bg-slate-50 border-slate-200 focus:bg-white focus:ring-[#0064cb]/5 focus:border-[#0064cb] rounded-lg text-sm text-slate-800"
                />
              ) : (
                <span className="text-sm text-slate-800 font-medium">
                  {shift ? formatPrice(shift.per_hour_rate) : "----"}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col md:grid md:grid-cols-4 p-4 items-start md:items-center gap-2 md:gap-0">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">Flat rate paid to guard:</span>
            <div className="w-full md:col-span-3">
              {isEditDetailsOpen ? (
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={editDetailsForm.per_shift_rate}
                  onChange={(e) => setEditDetailsForm(prev => ({ ...prev, per_shift_rate: e.target.value }))}
                  className="h-10 bg-slate-50 border-slate-200 focus:bg-white focus:ring-[#0064cb]/5 focus:border-[#0064cb] rounded-lg text-sm text-slate-800"
                />
              ) : (
                <span className="text-sm text-slate-800 font-medium">
                  {shift ? formatPrice(shift.per_shift_rate) : "----"}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col md:grid md:grid-cols-4 p-4 items-start md:items-center gap-2 md:gap-0">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">Travel Fees:</span>
            <div className="w-full md:col-span-3">
              {isEditDetailsOpen ? (
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={editDetailsForm.travel_fee}
                  onChange={(e) => setEditDetailsForm(prev => ({ ...prev, travel_fee: e.target.value }))}
                  className="h-10 bg-slate-50 border-slate-200 focus:bg-white focus:ring-[#0064cb]/5 focus:border-[#0064cb] rounded-lg text-sm text-slate-800"
                />
              ) : (
                <span className="text-sm text-slate-800 font-medium">
                  {shift ? formatPrice(shift.travel_fee) : "----"}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
