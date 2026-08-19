import { Download, Maximize2, FileText } from "lucide-react";
import { DateTime } from "luxon";
import { formatDate } from "@/lib/utils";

export const toUTCISO = (localDateTimeStr: string, timezone?: string) => {
  if (!localDateTimeStr) return null;
  try {
    const isoString = localDateTimeStr.replace(' ', 'T');
    const dt = DateTime.fromISO(isoString, { zone: timezone || 'local' });
    if (!dt.isValid) return null;
    return dt.toUTC().toISO();
  } catch {
    return null;
  }
};

export const toLocalDateTimeString = (isoStr: string) => {
  if (!isoStr) return "";
  try {
    const isoString = isoStr.replace(' ', 'T');
    const dt = DateTime.fromISO(isoString, { setZone: true });
    if (!dt.isValid) return "";
    return dt.toFormat("yyyy-MM-dd'T'HH:mm");
  } catch {
    return "";
  }
};

export const getFileNameFromUrl = (urlStr: string, fallback: string) => {
  try {
    const url = new URL(urlStr);
    const pathname = url.pathname;
    const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
    return filename || fallback;
  } catch {
    return fallback;
  }
};

export const getContentTypeFromUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.toLowerCase();
    if (pathname.endsWith(".pdf")) return "application/pdf";
    if (pathname.endsWith(".jpg") || pathname.endsWith(".jpeg")) return "image/jpeg";
    if (pathname.endsWith(".png")) return "image/png";
    if (pathname.endsWith(".gif")) return "image/gif";
    if (pathname.endsWith(".mp4") || pathname.endsWith(".mov")) return "video/mp4";
  } catch {
    // Ignore URL parsing errors
  }
  const lower = url.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".mp4") || lower.endsWith(".mov")) return "video/mp4";
  return "application/octet-stream";
};

export const triggerFileDownload = async (url: string, fileName: string) => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Network response was not ok");
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const getCommentAuthorName = (comment: any) => {
  if (!comment) return "User";

  let sendBy = "";
  if (typeof comment.send_by === "string" && comment.send_by.trim()) {
    sendBy = comment.send_by.trim();
  } else if (typeof comment.send_by === "object" && comment.send_by) {
    sendBy = (comment.send_by.first_name || comment.send_by.name || comment.send_by.user_name || "").trim();
  }

  if (sendBy) {
    if (sendBy === sendBy.toLowerCase()) {
      return sendBy.charAt(0).toUpperCase() + sendBy.slice(1);
    }
    return sendBy;
  }

  if (comment.first_name || comment.last_name) {
    return `${comment.first_name || ""} ${comment.last_name || ""}`.trim();
  }
  if (comment.user_name) return comment.user_name;
  if (comment.created_by_name) return comment.created_by_name;
  if (comment.name) return comment.name;
  if (comment.user) {
    if (comment.user.first_name || comment.user.last_name) {
      return `${comment.user.first_name || ""} ${comment.user.last_name || ""}`.trim();
    }
    if (comment.user.name) return comment.user.name;
    if (comment.user.user_name) return comment.user.user_name;
  }
  if (comment.created_by) {
    if (typeof comment.created_by === "object") {
      if (comment.created_by.first_name || comment.created_by.last_name) {
        return `${comment.created_by.first_name || ""} ${comment.created_by.last_name || ""}`.trim();
      }
      if (comment.created_by.name) return comment.created_by.name;
    } else if (typeof comment.created_by === "string") {
      return comment.created_by;
    }
  }
  if (comment.guard) {
    if (typeof comment.guard === "object") {
      if (comment.guard.first_name || comment.guard.last_name) {
        return `${comment.guard.first_name || ""} ${comment.guard.last_name || ""}`.trim();
      }
      if (comment.guard.name) return comment.guard.name;
    }
  }
  if (comment.admin) {
    if (typeof comment.admin === "object") {
      if (comment.admin.first_name || comment.admin.last_name) {
        return `${comment.admin.first_name || ""} ${comment.admin.last_name || ""}`.trim();
      }
      if (comment.admin.name) return comment.admin.name;
    }
  }

  if (comment.user_role) {
    return comment.user_role.charAt(0).toUpperCase() + comment.user_role.slice(1);
  }

  return "User";
};

export const getSendByDisplay = (comment: any) => {
  if (!comment) return null;
  const raw = comment.sent_to || comment.send_to || comment.guard_role || comment.recipient;
  if (!raw) return null;
  const lower = String(raw).toLowerCase().trim();
  if (lower === "lead_guard" || lower === "lead") return "Lead Guard";
  if (lower === "standby_guard" || lower === "standby") return "Standby Guard";
  if (lower === "both" || lower === "both_guards" || lower === "both guards") return "Both Guards";
  return String(raw);
};

export const formatDescription = (text: string) => {
  if (!text) return null;
  const sections = text.split('*').map(s => s.trim()).filter(Boolean);
  return (
    <div className="space-y-3">
      {sections.map((section, idx) => {
        if (section.includes('PM') || section.includes('AM')) {
          return (
            <div key={idx} className="flex items-start gap-2 bg-slate-800/50 p-2 rounded-lg border border-slate-700/50">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
              <span className="text-slate-200">{section}</span>
            </div>
          );
        }
        const lines = section.split(/(?=[A-Z][a-z]+ [a-z]*:)|(?=Total [A-Z][a-z]+:)/g);
        return (
          <div key={idx} className="space-y-1.5">
            {lines.map((line, lIdx) => {
              const parts = line.split(':');
              if (parts.length > 1) {
                return (
                  <div key={lIdx} className="flex justify-between gap-4 border-b border-slate-800/50 pb-1 last:border-0">
                    <span className="text-white font-medium whitespace-nowrap">{parts[0].trim()}:</span>
                    <span className="text-slate-200 text-right">{parts.slice(1).join(':').trim()}</span>
                  </div>
                );
              }
              return <p key={lIdx} className="text-slate-200">{line.trim()}</p>;
            })}
          </div>
        );
      })}
    </div>
  );
};

export const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'shift_created': return 'bg-slate-100 text-slate-700 border-slate-200';
    case 'shift_planned': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'shift_accepted': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'shift_pre_check_in': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'shift_in_progress': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    case 'shift_finished': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'shift_approved': return 'bg-green-100 text-green-700 border-green-200';
    case 'shift_not_approved': return 'bg-red-100 text-red-700 border-red-200';
    case 'shift_refused': return 'bg-red-100 text-red-700 border-red-200';
    case 'shift_abandon': return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'shift_arrival': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
    default: return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

export const formatStatus = (status: string) => {
  if (!status) return 'N/A';
  return status.replace(/_/g, ' ').toUpperCase();
};

export const formatDateTime = (dateStr: string) => {
  if (!dateStr) return 'N/A';
  try {
    const isoString = dateStr.replace(' ', 'T');
    return formatDate(isoString, true);
  } catch {
    return 'N/A';
  }
};

export const FileAttachmentCard = ({
  url,
  label,
  fallbackName = "Attachment",
  contentType: propContentType,
  onPreview,
}: {
  url: string;
  label?: string;
  fallbackName?: string;
  contentType?: string;
  onPreview: (url: string, title: string, contentType: string) => void;
}) => {
  const fileName = getFileNameFromUrl(url, fallbackName);
  const contentType = propContentType || getContentTypeFromUrl(url);
  const isImg = contentType.startsWith("image/");
  const isVid = contentType.startsWith("video/");

  if (!isImg && !isVid) {
    return (
      <div className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-sm group hover:border-[#0064cb] transition-all">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-700 group-hover:text-[#0064cb] transition-colors flex-shrink-0">
            <FileText className="w-4.5 h-4.5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-bold text-slate-700 truncate max-w-[200px]" title={fileName}>
              {fileName}
            </span>
            {label && <span className="text-[9px] text-slate-500 font-medium">{label}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => triggerFileDownload(url, fileName)}
            className="p-1.5 rounded-lg hover:bg-blue-50 text-[#0064cb] transition-all cursor-pointer border-none bg-transparent"
            title="Download"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onPreview(url, fileName, contentType)}
            className="p-1.5 rounded-lg hover:bg-blue-50 text-[#0064cb] transition-all cursor-pointer border-none bg-transparent"
            title="Preview"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  let line1 = fileName;
  let line2 = label || "";

  if (!label && fileName.length > 25) {
    line1 = fileName.slice(0, 25);
    line2 = fileName.slice(25);
  } else if (!label) {
    line2 = isVid ? "Video Attachment" : "Image Attachment";
  }

  return (
    <div className="p-3 bg-white border border-slate-200 rounded-[1.25rem] flex items-center justify-between shadow-sm group hover:border-[#0064cb] transition-all gap-3">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-12 h-14 rounded-lg bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0 border border-slate-100 relative">
          {isImg ? (
            <img
              src={url}
              alt={fileName}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full relative">
              <video
                src={url}
                className="object-cover w-full h-full"
                preload="metadata"
                muted
                playsInline
              />
              <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-black/40 flex items-center justify-center text-white backdrop-blur-[1px]">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 translate-x-[0.5px]">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-[11px] font-bold text-slate-800 truncate" title={fileName}>
            {line1}
          </span>
          <span className="text-[9px] text-slate-500 font-medium truncate" title={line2}>
            {line2}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => triggerFileDownload(url, fileName)}
          className="p-1.5 rounded-lg hover:bg-blue-50 text-[#0064cb] transition-all cursor-pointer border-none bg-transparent"
          title="Download"
        >
          <Download className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPreview(url, fileName, contentType)}
          className="p-1.5 rounded-lg hover:bg-blue-50 text-[#0064cb] transition-all cursor-pointer border-none bg-transparent"
          title="Preview"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
