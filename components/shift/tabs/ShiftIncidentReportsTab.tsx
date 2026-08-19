import { ClipboardList } from "lucide-react";
import { formatDateTime, FileAttachmentCard } from "../utils";
import { ShiftReports, PreviewFile } from "../types";

interface ShiftIncidentReportsTabProps {
  reports: ShiftReports | null;
  isReportsLoading: boolean;
  reportsError: string | null;
  setPreviewFile: (file: PreviewFile | null) => void;
  timezone?: string;
}

export function ShiftIncidentReportsTab({
  reports,
  isReportsLoading,
  reportsError,
  setPreviewFile,
  timezone,
}: ShiftIncidentReportsTabProps) {
  if (isReportsLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-3.5 bg-slate-200 rounded w-20" />
              <div className="h-3 bg-slate-100/80 rounded w-16" />
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-200 rounded-lg" />
                <div className="space-y-1">
                  <div className="h-3 bg-slate-200 rounded w-24" />
                  <div className="h-2.5 bg-slate-100/80 rounded w-16" />
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 bg-slate-100/80 rounded-md" />
                <div className="w-6 h-6 bg-slate-100/80 rounded-md" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (reports?.incident_report && reports.incident_report.length > 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-slate-50">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-tight">Incident Reports</h3>
          <span className="text-[10px] font-bold text-[#0064cb] bg-blue-50 px-2 py-1 rounded-lg">
            {reports.incident_report.length} {reports.incident_report.length === 1 ? "Report" : "Reports"}
          </span>
        </div>

        <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {reports.incident_report.map((report: any, idx: number) => (
            <div key={idx} className="space-y-3 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-800">Incident #{idx + 1}</span>
                <span className="text-[10px] text-slate-700">{formatDateTime(report.created_at, timezone)}</span>
              </div>

              <div className="space-y-2">
                {report.report_pdf && report.report_pdf.url && (
                  <FileAttachmentCard
                    url={report.report_pdf.url}
                    label="PDF Report"
                    fallbackName="incident_report.pdf"
                    contentType={report.report_pdf.content_type || "application/pdf"}
                    onPreview={(url, title, contentType) => setPreviewFile({ url, title, contentType })}
                  />
                )}

                {report.attach_file && report.attach_file.url && (
                  <FileAttachmentCard
                    url={report.attach_file.url}
                    label="Attachment"
                    fallbackName="attachment"
                    contentType={report.attach_file.content_type}
                    onPreview={(url, title, contentType) => setPreviewFile({ url, title, contentType })}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 text-center space-y-3">
      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto">
        <ClipboardList className="w-6 h-6 text-slate-200" />
      </div>
      {reportsError ? (
        <>
          <p className="text-xs font-bold text-red-500 uppercase tracking-tight">Failed to load Reports</p>
          <p className="text-[11px] text-slate-500 font-mono break-all">{reportsError}</p>
        </>
      ) : (
        <p className="text-xs font-medium text-slate-700">No Incident Report data available yet.</p>
      )}
    </div>
  );
}
