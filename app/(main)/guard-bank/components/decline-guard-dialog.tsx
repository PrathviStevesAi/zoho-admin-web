"use client";

import { Loader2, Mail, Phone, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface GuardInfo {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
}

interface DeclineGuardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  guard: GuardInfo | null;
  isLoading?: boolean;
}

export function DeclineGuardDialog({
  isOpen,
  onClose,
  onConfirm,
  guard,
  isLoading = false
}: DeclineGuardDialogProps) {
  const getInitials = (first: string, last: string) => {
    return `${(first || "").charAt(0)}${(last || "").charAt(0)}`.toUpperCase();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!isLoading && !open) {
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-[600px] w-[95vw] max-h-[90vh] flex flex-col p-0 gap-0 border-none shadow-2xl rounded-2xl bg-white overflow-hidden" hideCloseButton>
        <div className="px-6 pt-6 pb-2 bg-white relative shrink-0">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-[22px] h-[22px] rounded-full bg-red-50 text-red-500 flex items-center justify-center border border-red-100 shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <DialogTitle className="text-xl font-bold text-slate-800 tracking-tight">Decline Application</DialogTitle>
          </div>
          <DialogDescription className="text-[13px] text-slate-500 font-medium ml-[30px] leading-relaxed pr-4">
            Please confirm that you want to decline this application.<br />
            The applicant will be notified about the decision.
          </DialogDescription>
        </div>

        <div className="px-6 py-4 space-y-6 flex-1 overflow-y-auto">
          <div className="bg-[#f8fafc] border border-slate-200/60 rounded-[14px] p-4 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-[#0064cb] text-white flex items-center justify-center font-bold text-[17px] shrink-0">
              {guard ? getInitials(guard.first_name, guard.last_name) : "G"}
            </div>
            <div className="space-y-0.5 min-w-0">
              <h4 className="font-bold text-slate-900 text-[14px] truncate tracking-tight">
                {guard ? `${guard.first_name || ""} ${guard.last_name || ""}`.trim() : "Guard Name"}
              </h4>
              <div className="flex items-center gap-4 text-[12px] text-slate-500 font-medium pt-0.5">
                <div className="flex items-center gap-1.5 truncate">
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{guard?.email || "N/A"}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Phone className="w-3.5 h-3.5 shrink-0" />
                  <span>{guard?.phone_number || "N/A"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 bg-white flex items-center gap-3 rounded-b-2xl shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 h-11 rounded-xl font-bold text-slate-700 bg-white hover:bg-slate-50 border-slate-200 transition-all active:scale-95 cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 h-11 rounded-xl font-bold text-white bg-[#e11d48] hover:bg-[#be123c] transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-none shadow-sm shadow-red-600/20"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 14L21 3M18 21L22 17M10 14L3 21M10 14L3 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="hidden" />
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Confirm & Decline
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
