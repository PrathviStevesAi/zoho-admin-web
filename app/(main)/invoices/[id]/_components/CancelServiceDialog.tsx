"use client";

import { useState } from "react";
import { X, Loader2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CancelServiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  isSaving: boolean;
}

export function CancelServiceDialog({
  isOpen,
  onClose,
  onConfirm,
  isSaving
}: CancelServiceDialogProps) {
  const [reason, setReason] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    await onConfirm(reason);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl bg-white">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900">Cancel Service ?</DialogTitle>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-amber-50/50 border border-amber-100/50 p-4 rounded-xl flex gap-3 items-start">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-[12px] text-amber-700 font-medium leading-relaxed">
              Note: All shifts related to this invoice will be canceled and no longer accessible.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Cancellation Reason</label>
            <textarea
              required
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide a reason for canceling..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/10 focus-visible:border-red-400 transition-all min-h-[120px] resize-none"
            />
          </div>

          <div className="flex items-center justify-center gap-4 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-11 rounded-xl font-bold text-slate-500 hover:bg-slate-50 border-slate-200 transition-all active:scale-95 cursor-pointer"
            >
              No, Keep it
            </Button>
            <Button
              type="submit"
              disabled={isSaving || !reason.trim()}
              className="flex-1 h-11 rounded-xl font-bold bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 transition-all active:scale-95 flex gap-2 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <span>Cancelling..</span>
                  <Loader2 className="w-4 h-4 animate-spin" />
                </>
              ) : "Yes, Cancel"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
