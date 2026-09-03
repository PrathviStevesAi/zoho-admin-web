"use client";

import { useState, KeyboardEvent } from "react";
import { Loader2, Mail, Users, Info, X } from "lucide-react";
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
    customer_email?: string;
    customer_recepients?: string[];
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

  const initialPrimaryEmail = initialSettings?.customer_email || "";
  const initialCcEmails = initialSettings?.customer_recepients || [];

  const [primaryEmail, setPrimaryEmail] = useState(initialPrimaryEmail);
  const [ccEmails, setCcEmails] = useState<string[]>(initialCcEmails);
  const [ccInput, setCcInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

  const handleCcKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const parts = ccInput.split(/[\s,]+/).filter(Boolean);
      const newEmails = [...ccEmails];
      let hasError = false;

      for (const part of parts) {
        if (emailRegex.test(part)) {
          if (!newEmails.includes(part)) {
            newEmails.push(part);
          }
        } else {
          toast.error(`Invalid email: ${part}`);
          hasError = true;
        }
      }

      if (!hasError || parts.length > 0) {
        setCcEmails(newEmails);
        setCcInput("");
      }
    } else if (e.key === "Backspace" && ccInput === "" && ccEmails.length > 0) {
      setCcEmails(ccEmails.slice(0, -1));
    }
  };

  const removeCcEmail = (emailToRemove: string) => {
    setCcEmails(ccEmails.filter(email => email !== emailToRemove));
  };

  const preventInvalidKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "-" || e.key === "e" || e.key === ".") e.preventDefault();
  };

  const handleChange = (key: keyof typeof form, val: string) => {
    if (val.includes("-") || val.includes(".")) return;
    setForm(prev => ({ ...prev, [key]: val }));
  };

  const handleSave = async () => {
    const payload: Partial<{
      checkpoint_create_interval: number;
      break_max_time: number;
      total_break_limit: number;
      geofence_radius: number;
      customer_email: string;
      customer_recepients: string[];
    }> = {};

    if (form.checkpoint_create_interval && form.checkpoint_create_interval !== initialSettings?.checkpoint_create_interval?.toString()) {
      payload.checkpoint_create_interval = parseInt(form.checkpoint_create_interval, 10);
    }
    if (form.break_max_time && form.break_max_time !== initialSettings?.break_max_time?.toString()) {
      payload.break_max_time = parseInt(form.break_max_time, 10);
    }
    if (form.total_break_limit && form.total_break_limit !== initialSettings?.total_break_limit?.toString()) {
      payload.total_break_limit = parseInt(form.total_break_limit, 10);
    }
    if (form.geofence_radius && form.geofence_radius !== initialSettings?.geofence_radius?.toString()) {
      payload.geofence_radius = parseInt(form.geofence_radius, 10);
    }

    const trimmedPrimary = primaryEmail.trim();
    if (trimmedPrimary !== (initialSettings?.customer_email || "")) {
      if (trimmedPrimary) {
        if (emailRegex.test(trimmedPrimary)) {
          payload.customer_email = trimmedPrimary;
        } else {
          toast.error("Primary email is invalid.");
          return;
        }
      } else {
        payload.customer_email = "";
      }
    }

    const finalCcInput = ccInput.trim();
    const emailsToAdd = [...ccEmails];
    if (finalCcInput) {
      const parts = finalCcInput.split(/[\s,]+/).filter(Boolean);
      for (const part of parts) {
        if (emailRegex.test(part) && !emailsToAdd.includes(part)) {
          emailsToAdd.push(part);
        }
      }
    }

    const initialCc = initialSettings?.customer_recepients || [];
    const isCcChanged = emailsToAdd.length !== initialCc.length ||
      !emailsToAdd.every((val, index) => val === initialCc[index]);

    if (isCcChanged) {
      payload.customer_recepients = emailsToAdd;
    }

    if (Object.keys(payload).length === 0) {
      toast.info("No settings to update");
      onCancel();
      return;
    }

    console.log("Saving Shift Settings payload:", payload);

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

            <div className="mt-3 text-blue-800 flex gap-2 text-xs">
              <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p>
                  <span className="font-bold">Note:</span> These settings will apply to all shifts related to this invoice that are
                  <span className="font-semibold"> Created, Planned, Accepted,</span> or <span className="font-semibold">Refused</span> by the guard.
                  Shifts that are already <span className="font-semibold">In Progress</span> or <span className="font-semibold">Completed</span> will continue using their existing settings.
                  If you want to change the settings for a specific shift, you can update them directly from the Shift page.
                </p>
              </div>
            </div>
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
                    min="1"
                    value={form.break_max_time}
                    onKeyDown={preventInvalidKeys}
                    onChange={(e) => {
                      if (e.target.value === "0") return;
                      handleChange("break_max_time", e.target.value);
                    }}
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
                  min="1"
                  value={form.total_break_limit}
                  onKeyDown={preventInvalidKeys}
                  onChange={(e) => {
                    if (e.target.value === "0") return;
                    handleChange("total_break_limit", e.target.value);
                  }}
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

            <div className="pt-4 space-y-4">
              <div className="flex flex-col gap-1 mb-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase">REPORT EMAIL RECIPIENTS</h3>
                <p className="text-xs text-slate-500">Reports will be sent to the email addresses below.</p>
              </div>

              <div className="flex flex-col md:flex-row md:items-start gap-4 p-4 border border-slate-100 rounded-xl bg-slate-50/50">
                <div className="flex-none flex items-center justify-center w-12 h-12 bg-blue-50 text-blue-600 rounded-xl">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-bold text-slate-800">To (Primary Email)</Label>
                    <Info className="w-4 h-4 text-slate-400" />
                  </div>
                  <p className="text-xs text-slate-500 pb-1">The shift report will be sent to this email as the primary recipient.</p>
                </div>
                <div className="flex-[2] relative">
                  <Input
                    type="email"
                    value={primaryEmail}
                    onChange={(e) => setPrimaryEmail(e.target.value.replace(/[\s,]/g, ''))}
                    onKeyDown={(e) => {
                      if (e.key === "," || e.key === " ") e.preventDefault();
                    }}
                    placeholder="example@company.com"
                    className="w-full h-11 bg-white border-slate-200 rounded-lg pr-12"
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded uppercase">To</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-start gap-4 p-4 border border-slate-100 rounded-xl bg-slate-50/50">
                <div className="flex-none flex items-center justify-center w-12 h-12 bg-purple-50 text-purple-600 rounded-xl">
                  <Users className="w-5 h-5" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-bold text-slate-800">CC (Additional Emails)</Label>
                    <Info className="w-4 h-4 text-slate-400" />
                  </div>
                  <p className="text-xs text-slate-500 pb-1">Additional recipients will receive the shift report in CC.</p>
                </div>
                <div className="flex-[2]">
                  <div className="min-h-[44px] bg-white border border-slate-200 rounded-lg p-2 flex flex-wrap gap-2 focus-within:ring-2 focus-within:ring-slate-400 focus-within:ring-offset-2 transition-all">
                    {ccEmails.map((email, idx) => (
                      <div key={idx} className="flex items-center gap-1 bg-slate-100 text-slate-700 text-xs px-2.5 py-1.5 rounded-md font-medium">
                        {email}
                        <button
                          type="button"
                          onClick={() => removeCcEmail(email)}
                          className="text-slate-400 hover:text-slate-600 focus:outline-none"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <input
                      type="text"
                      value={ccInput}
                      onChange={(e) => setCcInput(e.target.value)}
                      onKeyDown={handleCcKeyDown}
                      placeholder={ccEmails.length === 0 ? "Add email and press Enter" : ""}
                      className="flex-1 min-w-[150px] bg-transparent outline-none text-sm text-slate-800 placeholder:text-slate-400 py-1 px-1"
                    />
                  </div>
                </div>
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
