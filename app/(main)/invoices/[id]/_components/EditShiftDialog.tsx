"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateTime } from "luxon";

interface EditShiftDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (data: {
    shift_id: string;
    service_id: string;
    start_time: string;
    end_time: string;
  }) => Promise<void>;
  initialShift: any;
  services: any[];
  isSaving: boolean;
  timezone: string;
}

export function EditShiftDialog({
  isOpen,
  onClose,
  onUpdate,
  initialShift,
  services,
  isSaving,
  timezone,
}: EditShiftDialogProps) {
  const [serviceId, setServiceId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const toLocalString = (isoStr: string, tz: string) => {
    if (!isoStr) return "";
    const dt = DateTime.fromISO(isoStr, { zone: tz });
    return dt.isValid ? dt.toFormat("yyyy-MM-dd'T'HH:mm") : "";
  };

  const toUtcIso = (localStr: string, tz: string) => {
    if (!localStr) return "";
    const dt = DateTime.fromISO(localStr, { zone: tz });
    return dt.isValid ? dt.toUTC().toISO({ suppressMilliseconds: true }) || "" : "";
  };

  useEffect(() => {
    if (isOpen && initialShift) {
      setServiceId(initialShift.service_id || initialShift.security_service_id || "");
      setStartTime(toLocalString(initialShift.start_time, timezone));
      setEndTime(toLocalString(initialShift.end_time, timezone));
    }
  }, [isOpen, initialShift, timezone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceId || !startTime || !endTime) return;

    await onUpdate({
      shift_id: initialShift.shift_id,
      service_id: serviceId,
      start_time: toUtcIso(startTime, timezone),
      end_time: toUtcIso(endTime, timezone),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0 overflow-visible border-none shadow-2xl rounded-2xl bg-white">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white rounded-t-2xl">
          <div>
            <DialogTitle className="text-xl font-bold text-slate-900">Edit Shift</DialogTitle>
            <DialogDescription className="text-xs text-slate-600 mt-1">
              Update service type, start date/time, and end date/time for Shift #{initialShift?.shift_no || ""}.
            </DialogDescription>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">Select Service</Label>
            <Select value={serviceId} onValueChange={setServiceId}>
              <SelectTrigger className="w-full !h-12 bg-slate-50 border-slate-200 focus:bg-white focus:ring-[#0064cb]/5 focus:border-[#0064cb] rounded-xl text-sm px-4">
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 shadow-xl z-[100]">
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id} className="cursor-pointer py-2.5 px-4">
                    {service.service_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">Start Date & Time</Label>
            <Input
              type="datetime-local"
              value={startTime}
              required
              onChange={(e) => setStartTime(e.target.value)}
              className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-[#0064cb]/5 focus:border-[#0064cb] rounded-xl text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">End Date & Time</Label>
            <Input
              type="datetime-local"
              value={endTime}
              required
              min={startTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-[#0064cb]/5 focus:border-[#0064cb] rounded-xl text-sm"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-11 px-8 rounded-xl font-bold text-slate-800 hover:bg-slate-50 border-slate-200 transition-all active:scale-95 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="h-11 px-8 rounded-xl font-bold bg-[#0064cb] hover:bg-[#0052ae] text-white shadow-lg shadow-[#0064cb]/20 transition-all active:scale-95 flex gap-2 cursor-pointer"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
