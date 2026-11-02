"use client";

import { useState } from "react";
import { Square, Loader2, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ManualEndShiftDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  isSaving: boolean;
}

export function ManualEndShiftDialog({
  isOpen,
  onClose,
  onConfirm,
  isSaving,
}: ManualEndShiftDialogProps) {
  const [reason, setReason] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    await onConfirm(reason.trim());
    setReason("");
  };

  const handleClose = () => {
    if (isSaving) return;
    setReason("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl bg-white">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
              <Square className="w-5 h-5 fill-current" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900">Manual Shift End</DialogTitle>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 pt-2">
          <div className="bg-red-50/60 border border-red-100 p-4 rounded-xl flex gap-3 items-start">
            <Info className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-[12px] text-red-700 font-medium leading-relaxed">
              Note: This action will manually end the shift immediately. A reason is required for administrative tracking.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">
              Reason to End Shift <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide a reason for manually ending the shift..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/10 focus-visible:border-red-400 transition-all min-h-[120px] resize-none"
            />
          </div>

          <div className="flex items-center justify-center gap-4 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSaving}
              className="flex-1 h-11 rounded-xl font-bold text-slate-800 hover:bg-slate-50 border-slate-200 transition-all active:scale-95 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving || !reason.trim()}
              className="flex-1 h-11 rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20 transition-all active:scale-95 flex gap-2 cursor-pointer border-none disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <span>Submitting...</span>
                  <Loader2 className="w-4 h-4 animate-spin" />
                </>
              ) : (
                "Submit"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
