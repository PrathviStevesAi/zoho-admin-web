import { History } from "lucide-react";
import { formatDateTime, FileAttachmentCard } from "../utils";
import { ShiftReports, PreviewFile } from "../types";

interface ShiftHistoryTabProps {
  reports: ShiftReports | null;
  isReportsLoading: boolean;
  reportsError: string | null;
  setPreviewFile: (file: PreviewFile | null) => void;
}

export function ShiftHistoryTab({
  reports,
  isReportsLoading,
  reportsError,
  setPreviewFile,
}: ShiftHistoryTabProps) {
  if (isReportsLoading) {
    return (
      <div className="space-y-6 relative before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 animate-pulse">
        {[...Array(3)].map((_, idx) => (
          <div key={idx} className="relative pl-8">
            <div className="absolute left-0 top-1.5 w-5 h-5 rounded-full border-4 border-white bg-slate-200 shadow-sm z-10" />
            <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 space-y-3">
              <div className="flex justify-between items-start">
                <div className="h-3.5 bg-slate-200 rounded w-24" />
                <div className="h-3 bg-slate-100/80 rounded w-16" />
              </div>
              <div className="space-y-1.5 pt-1.5 border-t border-slate-100/50">
                <div className="h-3 bg-slate-100/80 rounded w-32" />
                <div className="h-3 bg-slate-100/80 rounded w-28" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (reports?.shift_history && reports.shift_history.length > 0) {
    return (
      <div className="space-y-6 relative before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {reports.shift_history.map((event: any, idx: number) => {
          const metaItems = [];
          if (event.performed_by !== null && event.performed_by !== undefined) {
            metaItems.push({ label: "Performed By", value: event.performed_by });
          }
          if (event.assigned_to !== null && event.assigned_to !== undefined) {
            metaItems.push({ label: "Assigned To", value: event.assigned_to });
          }

          if (event.details && typeof event.details === "object") {
            Object.entries(event.details).forEach(([key, val]) => {
              if (val !== null && val !== undefined && val !== "") {
                const formattedLabel = key
                  .replace(/_/g, " ")
                  .split(" ")
                  .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(" ");
                metaItems.push({ label: formattedLabel, value: String(val) });
              }
            });
          }

          const mediaList: { key: string; label: string; file: any }[] = [];
          if (event.media_urls && typeof event.media_urls === "object") {
            Object.entries(event.media_urls).forEach(([key, val]) => {
              if (val && typeof val === "object" && (val as any).url) {
                const label = key
                  .split("_")
                  .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(" ");
                mediaList.push({ key, label, file: val });
              }
            });
          }

          return (
            <div key={idx} className="relative pl-8">
              <div className="absolute left-0 top-1.5 w-5 h-5 rounded-full border-4 border-white bg-[#0064cb] shadow-sm z-10" />
              <div className="p-4 bg-[#f1f8ff] rounded-xl border border-[#e1f0ff] space-y-3">
                <div className="flex justify-between items-start">
                  <h4 className="text-[12px] font-bold text-slate-800">{event.action_name}</h4>
                  <span className="text-[10px] text-slate-700">{formatDateTime(event.created_at)}</span>
                </div>

                {metaItems.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-[#e1f0ff]">
                    {metaItems.map((item, mIdx) => (
                      <div
                        key={mIdx}
                        className="flex justify-between items-start gap-4 text-xs border-b border-[#e1f0ff]/50 pb-1.5 last:border-0 last:pb-0"
                      >
                        <span className="text-[10px] font-bold text-slate-900 leading-snug">{item.label}:</span>
                        <span className="text-slate-800 font-medium text-[11px] text-right break-words">{item.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {mediaList.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-[#e1f0ff]">
                    {mediaList.map((media, mIdx) => (
                      <FileAttachmentCard
                        key={mIdx}
                        url={media.file.url}
                        label={media.label}
                        fallbackName={media.key}
                        contentType={
                          media.file.content_type || (media.key.includes("video") ? "video/mp4" : undefined)
                        }
                        onPreview={(url, title, contentType) => setPreviewFile({ url, title, contentType })}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="p-8 text-center space-y-3">
      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto">
        <History className="w-6 h-6 text-slate-200" />
      </div>
      {reportsError ? (
        <>
          <p className="text-xs font-bold text-red-500 uppercase tracking-tight">Failed to load history</p>
          <p className="text-[11px] text-slate-500 font-mono break-all">{reportsError}</p>
        </>
      ) : (
        <p className="text-xs font-medium text-slate-700 italic">No history data available yet.</p>
      )}
    </div>
  );
}
