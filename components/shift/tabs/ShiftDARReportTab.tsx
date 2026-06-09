import { FileText, Download, Maximize2 } from "lucide-react";
import { getFileNameFromUrl } from "../utils";
import { ShiftReports, PreviewFile } from "../types";

interface ShiftDARReportTabProps {
  reports: ShiftReports | null;
  isReportsLoading: boolean;
  reportsError: string | null;
  setPreviewFile: (file: PreviewFile | null) => void;
  securityServiceId?: string | null;
}

export function ShiftDARReportTab({
  reports,
  isReportsLoading,
  reportsError,
  setPreviewFile,
  securityServiceId,
}: ShiftDARReportTabProps) {
  const isFirewatch = securityServiceId === "09af9505-e73d-4cb4-837f-821aaa4bcad6";

  if (isReportsLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="p-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-200 rounded-xl" />
            <div className="space-y-1.5">
              <div className="h-3.5 bg-slate-200 rounded w-28" />
              <div className="h-3 bg-slate-100/80 rounded w-20" />
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 bg-slate-100/80 rounded-lg" />
            <div className="w-7 h-7 bg-slate-100/80 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (reports?.dar_report && reports.dar_report.url) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-slate-50">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-tight">
            {isFirewatch ? "Firewatch Log Report Documents" : "Daily Activity Report Documents"}
          </h3>
          <span className="text-[10px] font-bold text-[#0064cb] bg-blue-50 px-2 py-1 rounded-lg">1 File</span>
        </div>

        <div className="space-y-3">
          <div className="p-3.5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-sm group hover:border-[#0064cb] transition-all">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-700 group-hover:text-[#0064cb] transition-colors">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[12px] font-bold text-slate-700 truncate max-w-[220px]">
                  {getFileNameFromUrl(reports.dar_report.url, "dar_file.pdf")}
                </span>
                <span className="text-[10px] text-slate-700 font-medium italic">
                  {isFirewatch ? "Firewatch Log Report Document" : "Daily Activity Report Document"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <a
                href={reports.dar_report.url}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="p-2 rounded-xl hover:bg-blue-50 text-slate-700 hover:text-[#0064cb] transition-all cursor-pointer"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </a>
              <button
                onClick={() => {
                  setPreviewFile({
                    url: reports.dar_report!.url,
                    title: isFirewatch ? "Firewatch Log Report Document" : "Daily Activity Report Document",
                    contentType: reports.dar_report!.content_type || "application/pdf",
                  });
                }}
                className="p-2 rounded-xl hover:bg-blue-50 text-slate-700 hover:text-[#0064cb] transition-all cursor-pointer border-none bg-transparent"
                title="Preview"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 text-center space-y-3">
      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto">
        <FileText className="w-6 h-6 text-slate-200" />
      </div>
      {reportsError ? (
        <>
          <p className="text-xs font-bold text-red-500 uppercase tracking-tight">
            {isFirewatch ? "Failed to load Firewatch Log Report" : "Failed to load Daily Activity Report"}
          </p>
          <p className="text-[11px] text-slate-500 font-mono break-all">{reportsError}</p>
        </>
      ) : (
        <p className="text-xs font-medium text-slate-700">
          {isFirewatch ? "No Firewatch Log Report data available yet." : "No Daily Activity Report data available yet."}
        </p>
      )}
    </div>
  );
}
