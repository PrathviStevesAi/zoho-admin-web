import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface ShiftSettingsForm {
  checkpoint_create_interval: string;
  guard_break_max_duration: string;
  guard_break_limit: string;
  geofence_radius: string;
}

interface ShiftSettingsCardProps {
  isOpen: boolean;
  initialSettings: ShiftSettingsForm;
  onSave: (settings: ShiftSettingsForm) => Promise<void>;
  onClose: () => void;
  isSaving: boolean;
}

export function ShiftSettingsCard({
  isOpen,
  initialSettings,
  onSave,
  onClose,
  isSaving,
}: ShiftSettingsCardProps) {
  const [form, setForm] = useState<ShiftSettingsForm>({
    checkpoint_create_interval: "0",
    guard_break_max_duration: "",
    guard_break_limit: "",
    geofence_radius: "150",
  });

  useEffect(() => {
    if (isOpen) {
      setForm({
        checkpoint_create_interval:
          initialSettings.checkpoint_create_interval !== undefined && initialSettings.checkpoint_create_interval !== null
            ? String(initialSettings.checkpoint_create_interval)
            : "0",
        guard_break_max_duration: initialSettings.guard_break_max_duration || "",
        guard_break_limit: initialSettings.guard_break_limit || "",
        geofence_radius: initialSettings.geofence_radius || "150",
      });
    }
  }, [isOpen, initialSettings]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(form);
  };

  return (
    <Card className="border-slate-200 shadow-sm rounded-xl bg-white mb-6 p-6">
      <div className="border-b border-slate-100 pb-4 mb-6">
        <h2 className="text-lg font-bold text-slate-800">Shift Settings</h2>
        <p className="text-xs text-slate-500 mt-1">Configure intervals, break durations and limits for this shift.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="space-y-1.5">
          <Label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Create Checkpoint Interval</Label>
          <select
            value={form.checkpoint_create_interval}
            onChange={(e) => setForm(prev => ({ ...prev, checkpoint_create_interval: e.target.value }))}
            className="w-full h-11 px-3 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0064cb]/5 focus:border-[#0064cb] rounded-lg text-sm text-slate-800 transition-all cursor-pointer"
          >
            <option value="">Select interval...</option>
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="60">60 minutes</option>
            <option value="0">Not Required</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Guard Break Max Duration</Label>
          <Input
            type="number"
            min={0}
            value={form.guard_break_max_duration}
            onKeyDown={(e) => {
              if (e.key === "-" || e.key === "e") e.preventDefault();
            }}
            onChange={(e) => {
              const val = e.target.value;
              if (val.includes("-")) return;
              setForm(prev => ({ ...prev, guard_break_max_duration: val }));
            }}
            placeholder="e.g. 30"
            className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-[#0064cb]/5 focus:border-[#0064cb] rounded-lg text-sm text-slate-800"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Guard Break Limit (Count)</Label>
          <Input
            type="number"
            min={0}
            value={form.guard_break_limit}
            onKeyDown={(e) => {
              if (e.key === "-" || e.key === "e") e.preventDefault();
            }}
            onChange={(e) => {
              const val = e.target.value;
              if (val.includes("-")) return;
              setForm(prev => ({ ...prev, guard_break_limit: val }));
            }}
            placeholder="e.g. 2"
            className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-[#0064cb]/5 focus:border-[#0064cb] rounded-lg text-sm text-slate-800"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Geofence Radius (Meters)</Label>
          <Input
            type="number"
            min={0}
            value={form.geofence_radius}
            onKeyDown={(e) => {
              if (e.key === "-" || e.key === "e") e.preventDefault();
            }}
            onChange={(e) => {
              const val = e.target.value;
              if (val.includes("-")) return;
              setForm(prev => ({ ...prev, geofence_radius: val }));
            }}
            placeholder="e.g. 150"
            className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-[#0064cb]/5 focus:border-[#0064cb] rounded-lg text-sm text-slate-800"
          />
        </div>
      </div>
      <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="h-11 px-8 rounded-lg font-bold text-slate-800 hover:bg-slate-50 border-slate-200 transition-all active:scale-95 cursor-pointer"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="h-11 px-8 rounded-lg font-bold bg-[#0064cb] hover:bg-[#0052ae] text-white shadow-lg shadow-[#0064cb]/20 transition-all active:scale-95 flex gap-2 cursor-pointer"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Settings"}
        </Button>
      </div>
    </Card>
  );
}
