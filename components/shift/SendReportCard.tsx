"use client";

import { FileText, Eye, Link as LinkIcon, Send, Info, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shift } from "./types";

interface SendReportCardProps {
  isOpen: boolean;
  onClose: () => void;
  shift: Shift | null;
  onSend: () => Promise<void>;
  isSending: boolean;
}

export function SendReportCard({
  isOpen,
  onClose,
  shift,
  onSend,
  isSending,
}: SendReportCardProps) {
  if (!isOpen || !shift) return null;

  const publicReportUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/public/report?shift_id=${shift.shift_id}&report_token=${shift.report_token}`
    : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicReportUrl);
    toast.success("Link copied to clipboard!");
  };

  const handleViewReport = () => {
    window.open(publicReportUrl, '_blank');
  };

  const handleSend = async () => {
    await onSend();
    onClose();
  };

  return (
    <Card className="border-slate-200 shadow-sm rounded-xl bg-white mb-6 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-white">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-slate-900">Send Report</h2>
          <p className="text-sm text-slate-500 font-medium">View the Shift Report, copy the link and send it to the recipients.</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 flex flex-col md:flex-row gap-6 bg-slate-50/30">
        <div className="w-full md:w-5/12 bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center gap-6 shadow-sm">
          <h4 className="text-[13px] font-bold text-blue-600 uppercase tracking-wide">Shift Report</h4>

          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 shadow-sm">
            <FileText className="w-8 h-8" />
          </div>

          <div className="flex flex-wrap w-full items-center justify-center gap-3">
            <Button
              variant="outline"
              onClick={handleViewReport}
              className="flex-1 min-w-[130px] rounded-lg border-slate-200 text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 h-10 px-3"
            >
              <Eye className="w-4 h-4 shrink-0" />
              <span className="truncate">View Report</span>
            </Button>
            <Button
              variant="outline"
              onClick={handleCopyLink}
              className="flex-1 min-w-[130px] rounded-lg border-slate-200 text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 h-10 px-3"
            >
              <LinkIcon className="w-4 h-4 shrink-0" />
              <span className="truncate">Copy Link</span>
            </Button>
          </div>
        </div>

        <div className="w-full md:w-7/12 bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-6 shadow-sm">
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">To (Primary Email)</h4>
            <div className="w-full bg-slate-50 border border-slate-100 rounded-lg p-3 flex items-center justify-between min-h-[46px] gap-2">
              <span
                className="text-sm text-slate-700 font-medium truncate"
                title={shift.customer_email || ""}
              >
                {shift.customer_email || "No primary email set"}
              </span>
              {shift.customer_email && (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full shrink-0">
                  Primary
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">CC (Additional Emails)</h4>
            <div className="w-full bg-slate-50 border border-slate-100 rounded-lg p-3 flex flex-wrap gap-2 min-h-[80px] content-start">
              {shift.customer_recepients && shift.customer_recepients.length > 0 ? (
                shift.customer_recepients.map((email: string, idx: number) => (
                  <span
                    key={idx}
                    className="text-xs font-medium text-slate-600 bg-slate-200/60 px-3 py-1.5 rounded-md truncate max-w-full"
                    title={email}
                  >
                    {email}
                  </span>
                ))
              ) : (
                <span className="text-sm text-slate-400 font-medium italic mt-1">
                  Add recipients in cc from Invoice main order.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 pt-0 space-y-6 bg-slate-50/30">
        {shift.is_report_send && (
          <div className="w-full bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-start gap-3 mt-4 md:mt-0">
            <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-emerald-800">
              <span className="font-bold">Note:</span> The report is already sent to the customer, if you want to send again you can send it.
            </p>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="px-6 h-11 rounded-lg font-bold text-slate-800 hover:bg-slate-50 border-slate-200 transition-all active:scale-95 cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSend}
            disabled={isSending || (!shift.customer_email && (shift.customer_recepients?.length ?? 0) === 0)}
            className="px-6 h-11 rounded-lg font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-2 cursor-pointer border-none"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>{isSending ? "Sending..." : "Send"}</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}
