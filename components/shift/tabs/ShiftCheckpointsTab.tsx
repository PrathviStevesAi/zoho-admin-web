import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatStatus, formatDateTime, FileAttachmentCard } from "../utils";
import { ShiftReports, PreviewFile } from "../types";

interface ShiftCheckpointsTabProps {
  reports: ShiftReports | null;
  isReportsLoading: boolean;
  reportsError: string | null;
  setPreviewFile: (file: PreviewFile | null) => void;
}

export function ShiftCheckpointsTab({
  reports,
  isReportsLoading,
  reportsError,
  setPreviewFile,
}: ShiftCheckpointsTabProps) {
  if (isReportsLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-3">
            <div className="grid grid-cols-1 gap-2.5">
              {[...Array(4)].map((_, j) => (
                <div
                  key={j}
                  className="flex justify-between items-center text-xs border-b border-slate-100/50 pb-1.5 last:border-0 last:pb-0"
                >
                  <div className="h-3 bg-slate-200 rounded w-20" />
                  <div className="h-3 bg-slate-100/80 rounded w-24" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (reports?.checkpoints && reports.checkpoints.length > 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-slate-50">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-tight">Check Points</h3>
          <span className="text-[10px] font-bold text-[#0064cb] bg-blue-50 px-2 py-1 rounded-lg">
            {reports.checkpoints.length} {reports.checkpoints.length === 1 ? "Checkpoint" : "Checkpoints"}
          </span>
        </div>

        <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {reports.checkpoints.map((cp: any, idx: number) => {
            const items = [];
            if (cp.checkpoint_no !== null && cp.checkpoint_no !== undefined) {
              items.push({ label: "Checkpoint No", value: `#${cp.checkpoint_no}` });
            }
            if (cp.status !== null && cp.status !== undefined) {
              items.push({
                label: "Status",
                value: (
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold border",
                      cp.status === "completed"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    )}
                  >
                    {formatStatus(cp.status)}
                  </span>
                ),
              });
            }
            if (cp.sent_at !== null && cp.sent_at !== undefined) {
              items.push({ label: "Sent At", value: formatDateTime(cp.sent_at) });
            }
            if (cp.complete_at !== null && cp.complete_at !== undefined) {
              items.push({ label: "Completed At", value: formatDateTime(cp.complete_at) });
            }
            if (cp.comment !== null && cp.comment !== undefined && cp.comment !== "") {
              items.push({ label: "Comment", value: cp.comment });
            }
            if (cp.activity !== null && cp.activity !== undefined && cp.activity !== "") {
              items.push({ label: "Activity", value: cp.activity });
            }

            return (
              <div key={idx} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-3">
                <div className="grid grid-cols-1 gap-2.5">
                  {items.map((item, iIdx) => (
                    <div
                      key={iIdx}
                      className="flex justify-between items-center text-xs border-b border-slate-100/50 pb-1.5 last:border-0 last:pb-0"
                    >
                      <span className="text-[10px] font-bold text-slate-900">{item.label}:</span>
                      <span className="text-slate-800 font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>

                {cp.site_photo && cp.site_photo.url && (
                  <div className="pt-2 border-t border-slate-100/50">
                    <FileAttachmentCard
                      url={cp.site_photo.url}
                      label="Site Photo"
                      fallbackName="site_photo.jpg"
                      contentType={cp.site_photo.content_type || "image/jpeg"}
                      onPreview={(url, title, contentType) =>
                        setPreviewFile({
                          url,
                          title: `Checkpoint #${cp.checkpoint_no} Site Photo`,
                          contentType,
                        })
                      }
                    />
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
        <MapPin className="w-6 h-6 text-slate-200" />
      </div>
      {reportsError ? (
        <>
          <p className="text-xs font-bold text-red-500 uppercase tracking-tight">Failed to load Checkpoints</p>
          <p className="text-[11px] text-slate-500 font-mono break-all">{reportsError}</p>
        </>
      ) : (
        <p className="text-xs font-medium text-slate-700">No Checkpoint data available yet.</p>
      )}
    </div>
  );
}
