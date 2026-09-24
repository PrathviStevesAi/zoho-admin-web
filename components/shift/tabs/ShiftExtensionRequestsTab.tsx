import { useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateTime } from "../utils";
import { ShiftExtensionRequest } from "../types";
import { shiftExtensionAction } from "@/actions/dashboard.actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface ShiftExtensionRequestsTabProps {
  requests: ShiftExtensionRequest[];
  shiftId: string;
  timezone?: string;
  onRefresh?: () => void;
}

export function ShiftExtensionRequestsTab({
  requests,
  shiftId,
  timezone,
  onRefresh,
}: ShiftExtensionRequestsTabProps) {
  const [loadingState, setLoadingState] = useState<{ id: string; action: "approved" | "rejected" } | null>(null);

  const handleAction = async (id: string, status: "approved" | "rejected") => {
    setLoadingState({ id, action: status });
    try {
      const res = await shiftExtensionAction({ id, shift_id: shiftId, status });
      if (res.success) {
        toast.success(res.message || `Request ${status} successfully.`);
        if (onRefresh) onRefresh();
      } else {
        toast.error(res.error || `Failed to ${status} request.`);
      }
    } catch (error: any) {
      toast.error(error?.message || `Failed to ${status} request.`);
    } finally {
      setLoadingState(null);
    }
  };

  if (requests && requests.length > 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-slate-50">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-tight">Shift Extension Requests</h3>
          <span className="text-[10px] font-bold text-[#0064cb] bg-blue-50 px-2 py-1 rounded-lg">
            {requests.length} {requests.length === 1 ? "Request" : "Requests"}
          </span>
        </div>

        <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {requests.map((req, idx) => {
            const hasAction = req.action && typeof req.action === 'object'
              ? (req.action.is_approved || req.action.is_reject)
              : req.action === true;

            return (
              <div key={req.id || idx} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-3">
                <div className="grid grid-cols-1 gap-2.5">
                  <div className="flex justify-between items-center text-xs border-b border-slate-100/50 pb-1.5 last:border-0 last:pb-0">
                    <span className="text-[10px] font-bold text-slate-900">Requested End Time:</span>
                    <span className="text-slate-800 font-medium">
                      {formatDateTime(req.requested_end_time, timezone)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs border-b border-slate-100/50 pb-1.5 last:border-0 last:pb-0">
                    <span className="text-[10px] font-bold text-slate-900">Reason:</span>
                    <span className="text-slate-800 font-medium">{req.reason || "N/A"}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs border-b border-slate-100/50 pb-1.5 last:border-0 last:pb-0">
                    <span className="text-[10px] font-bold text-slate-900">Status:</span>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold border capitalize",
                        req.status === "approved"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : req.status === "rejected"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                      )}
                    >
                      {req.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs border-b border-slate-100/50 pb-1.5 last:border-0 last:pb-0">
                    <span className="text-[10px] font-bold text-slate-900">Created At:</span>
                    <span className="text-slate-800 font-medium">
                      {formatDateTime(req.created_at, timezone)}
                    </span>
                  </div>
                </div>

                {hasAction && (
                  <div className="pt-3 border-t border-slate-100/50 flex gap-3 justify-center mt-2">
                    {(typeof req.action === 'object' && req.action.is_reject) || req.action === true ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={loadingState?.id === req.id}
                        onClick={() => handleAction(req.id, "rejected")}
                        className="font-semibold text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 cursor-pointer h-8"
                      >
                        {loadingState?.id === req.id && loadingState.action === "rejected" ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                        ) : (
                          'Reject'
                        )}
                      </Button>
                    ) : null}

                    {(typeof req.action === 'object' && req.action.is_approved) || req.action === true ? (
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={loadingState?.id === req.id}
                        onClick={() => handleAction(req.id, "approved")}
                        className="font-semibold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer h-8"
                      >
                        {loadingState?.id === req.id && loadingState.action === "approved" ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                        ) : (
                          'Approve'
                        )}
                      </Button>
                    ) : null}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 text-center space-y-3">
      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto">
        <FileText className="w-6 h-6 text-slate-200" />
      </div>
      <p className="text-xs font-medium text-slate-700">No Shift Extension Requests available.</p>
    </div>
  );
}
