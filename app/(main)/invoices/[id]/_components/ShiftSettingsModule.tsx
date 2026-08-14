"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface ShiftSettingsModuleProps {
  title?: string;
  description?: string;
  initialSettings?: {
    checkpoint_create_interval?: number | null;
    break_max_time?: number | null;
    total_break_limit?: number | null;
    geofence_radius?: number | null;
  };
  onCancel: () => void;
  onSave?: (payload: any) => Promise<void>;
}

export function ShiftSettingsModule({ title = "Shift Settings", description = "Configure intervals, break durations and limits for this shift.", initialSettings, onCancel, onSave }: ShiftSettingsModuleProps) {
  const [form, setForm] = useState({
    checkpoint_create_interval:
      initialSettings?.checkpoint_create_interval !== undefined && initialSettings?.checkpoint_create_interval !== null
        ? String(initialSettings.checkpoint_create_interval)
        : "15",
    break_max_time: initialSettings?.break_max_time?.toString() || "10",
    total_break_limit: initialSettings?.total_break_limit?.toString() || "1",
    geofence_radius: initialSettings?.geofence_radius?.toString() || "500",
  });
  const [isSaving, setIsSaving] = useState(false);

  const preventInvalidKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "-" || e.key === "e" || e.key === ".") e.preventDefault();
  };

  const handleChange = (key: keyof typeof form, val: string) => {
    if (val.includes("-") || val.includes(".")) return;
    setForm(prev => ({ ...prev, [key]: val }));
  };

  const handleSave = async () => {
    const payload: any = {};

    if (form.checkpoint_create_interval) {
      payload.checkpoint_create_interval = parseInt(form.checkpoint_create_interval, 10);
    }
    if (form.break_max_time) {
      payload.break_max_time = parseInt(form.break_max_time, 10);
    }
    if (form.total_break_limit) {
      payload.total_break_limit = parseInt(form.total_break_limit, 10);
    }
    if (form.geofence_radius) {
      payload.geofence_radius = parseInt(form.geofence_radius, 10);
    }

    if (Object.keys(payload).length === 0) {
      toast.info("No settings to update");
      onCancel();
      return;
    }

    if (onSave) {
      setIsSaving(true);
      await onSave(payload);
      setIsSaving(false);
    } else {
      toast.success("Settings saved successfully.");
      onCancel();
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <Card className="border-slate-200 shadow-sm overflow-hidden rounded-xl bg-white max-w-7xl mx-auto">
        <CardContent className="p-0">
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col gap-1">
            <h2 className="text-xl font-bold text-slate-900">{title}</h2>
            <p className="text-slate-600 text-sm">{description}</p>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-slate-800 uppercase">Create Checkpoint Interval</Label>
                <Select
                  value={form.checkpoint_create_interval}
                  onValueChange={(val) => setForm(prev => ({ ...prev, checkpoint_create_interval: val }))}
                >
                  <SelectTrigger className="w-full h-11 bg-white border-slate-200 rounded-lg">
                    <SelectValue placeholder="Select interval" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 shadow-xl z-[100]">
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 relative">
                <Label className="text-[11px] font-bold text-slate-800 uppercase">Guard Break Max Duration</Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    value={form.break_max_time}
                    onKeyDown={preventInvalidKeys}
                    onChange={(e) => handleChange("break_max_time", e.target.value)}
                    className="w-full h-11 bg-white border-slate-200 rounded-lg pr-12"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-sm text-slate-500">Mins</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-slate-800 uppercase">Guard Break Limit (Count)</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.total_break_limit}
                  onKeyDown={preventInvalidKeys}
                  onChange={(e) => handleChange("total_break_limit", e.target.value)}
                  className="w-full h-11 bg-white border-slate-200 rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-slate-800 uppercase">Geofence Radius (Meters)</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.geofence_radius}
                  onKeyDown={preventInvalidKeys}
                  onChange={(e) => handleChange("geofence_radius", e.target.value)}
                  className="w-full h-11 bg-white border-slate-200 rounded-lg"
                />
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={onCancel}
              className="px-6 h-10 rounded-lg font-bold text-slate-600 border-slate-200 hover:bg-slate-50 transition-all cursor-pointer w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-[#0064cb] hover:bg-[#0052ae] text-white px-8 h-10 rounded-lg font-bold shadow-md shadow-[#0064cb]/10 transition-all cursor-pointer w-full sm:w-auto flex gap-2 items-center justify-center"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Settings"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
