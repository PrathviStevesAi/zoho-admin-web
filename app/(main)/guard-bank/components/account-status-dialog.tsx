"use client";

import { useState, useEffect } from "react";
import { Loader2, X, Ban, Archive, Unlock, ArchiveRestore, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export type AccountStatusActionType = "blocked" | "archived" | "unblocked" | "unarchived" | "active" | "";

interface AccountStatusDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => Promise<boolean | void> | boolean | void;
  actionType: AccountStatusActionType;
  guardName?: string;
  isLoading?: boolean;
}

export function AccountStatusDialog({
  isOpen,
  onClose,
  onConfirm,
  actionType,
  guardName,
  isLoading = false
}: AccountStatusDialogProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setReason("");
      setError("");
    }
  }, [isOpen]);

  const isReasonRequired = actionType === "blocked";

  const getDialogDetails = () => {
    switch (actionType) {
      case "blocked":
        return {
          title: "Block Guard",
          description: `Please enter the reason for blocking ${guardName ? guardName : "this guard"}.`,
          icon: <Ban className="w-5 h-5 text-red-600" />,
          iconBg: "bg-red-50 border-red-200",
          submitBtnClass: "bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-200",
          placeholder: "Enter reason for blocking..."
        };
      case "archived":
        return {
          title: "Archive Guard",
          description: `Are you sure you want to archive ${guardName ? guardName : "this guard"}?`,
          icon: <Archive className="w-5 h-5 text-slate-700" />,
          iconBg: "bg-slate-100 border-slate-200",
          submitBtnClass: "bg-slate-800 hover:bg-slate-900 text-white shadow-sm shadow-slate-200",
          placeholder: ""
        };
      case "unblocked":
        return {
          title: "Unblock Guard",
          description: `Are you sure you want to unblock ${guardName ? guardName : "this guard"} and change account status to Active?`,
          icon: <Unlock className="w-5 h-5 text-emerald-600" />,
          iconBg: "bg-emerald-50 border-emerald-200",
          submitBtnClass: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200",
          placeholder: ""
        };
      case "unarchived":
        return {
          title: "Unarchive Guard",
          description: `Are you sure you want to unarchive ${guardName ? guardName : "this guard"} and change account status to Active?`,
          icon: <ArchiveRestore className="w-5 h-5 text-blue-600" />,
          iconBg: "bg-blue-50 border-blue-200",
          submitBtnClass: "bg-[#0064cb] hover:bg-[#0052ae] text-white shadow-sm shadow-blue-200",
          placeholder: ""
        };
      case "active":
        return {
          title: "Activate Guard",
          description: `Are you sure you want to change ${guardName ? guardName : "this guard"}'s account status to Active?`,
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
          iconBg: "bg-emerald-50 border-emerald-200",
          submitBtnClass: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200",
          placeholder: ""
        };
      default:
        return {
          title: "Change Account Status",
          description: "Are you sure you want to proceed?",
          icon: null,
          iconBg: "bg-slate-100 border-slate-200",
          submitBtnClass: "bg-[#0064cb] hover:bg-[#0052ae] text-white",
          placeholder: ""
        };
    }
  };

  const details = getDialogDetails();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReasonRequired && !reason.trim()) {
      setError("Please provide a reason to continue.");
      return;
    }
    setError("");
    await onConfirm(isReasonRequired ? reason.trim() : undefined);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!isLoading && !open) {
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-[480px] w-[95vw] p-0 gap-0 border border-slate-200 shadow-xl rounded-2xl bg-white overflow-hidden" hideCloseButton>
        <div className="p-6 pb-4 bg-white relative">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-3.5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${details.iconBg}`}>
              {details.icon}
            </div>
            <div className="space-y-1 pr-6">
              <DialogTitle className="text-lg font-bold text-slate-900 tracking-tight">
                {details.title}
              </DialogTitle>
              <DialogDescription className="text-[13px] text-slate-500 font-medium leading-relaxed">
                {details.description}
              </DialogDescription>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {isReasonRequired && (
            <div className="px-6 py-2 space-y-2">
              <label className="text-[12px] font-semibold text-slate-700 block">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (error) setError("");
                }}
                disabled={isLoading}
                rows={4}
                placeholder={details.placeholder}
                className={`w-full p-3 text-[13px] rounded-lg border bg-slate-50/50 focus:bg-white text-slate-900 placeholder:text-slate-400 transition-all resize-none focus:outline-none focus:ring-2 ${
                  error
                    ? "border-red-400 focus:ring-red-100 focus:border-red-500"
                    : "border-slate-200 focus:ring-blue-100 focus:border-[#0064cb]"
                }`}
              />
              {error && (
                <p className="text-[12px] font-medium text-red-500">{error}</p>
              )}
            </div>
          )}

          <div className="px-6 py-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-end gap-3 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="h-10 px-5 rounded-xl font-bold text-slate-700 bg-white hover:bg-slate-100 border-slate-200 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className={`h-10 px-6 rounded-xl font-bold cursor-pointer transition-all border-none ${details.submitBtnClass}`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
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
