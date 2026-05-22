"use client";

import { useState, useEffect, useCallback, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ChevronRight,
  ArrowLeft,
  RefreshCcw,
  Calendar,
  Search,
  UserPlus,
  ExternalLink,
  XCircle,
  Edit2,
  MessageSquarePlus,
  FileText,
  ClipboardList,
  MapPin,
  History,
  Paperclip,
  Download,
  Maximize2,
  Loader2,
  Send
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchShiftDetailsAction, fetchCommentsAction, addCommentAction, Comment } from "@/actions/dashboard.actions";
import { generateUploadUrlAction } from "@/actions/profile.actions";
import { fetchShiftReportsAction } from "@/actions/notification.actions";
import { toast } from "sonner";

const getFileNameFromUrl = (urlStr: string, fallback: string) => {
  try {
    const url = new URL(urlStr);
    const pathname = url.pathname;
    const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
    return filename || fallback;
  } catch {
    return fallback;
  }
};

const getContentTypeFromUrl = (url: string) => {
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

const triggerFileDownload = async (url: string, fileName: string) => {
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
    // If CORS or network error occurs, fallback to standard link behavior in new window
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

const FileAttachmentCard = ({
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
          <a
            href={url}
            onClick={(e) => {
              e.preventDefault();
              triggerFileDownload(url, fileName);
            }}
            className="p-1.5 rounded-lg hover:bg-blue-50 text-[#0064cb] transition-all cursor-pointer"
            title="Download"
          >
            <Download className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={() => onPreview(url, fileName, contentType)}
            className="p-1.5 rounded-lg hover:bg-blue-50 text-[#0064cb] transition-all cursor-pointer"
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
        <a
          href={url}
          onClick={(e) => {
            e.preventDefault();
            triggerFileDownload(url, fileName);
          }}
          className="p-1.5 rounded-lg hover:bg-blue-50 text-[#0064cb] transition-all cursor-pointer"
          title="Download"
        >
          <Download className="w-4 h-4" />
        </a>
        <button
          onClick={() => onPreview(url, fileName, contentType)}
          className="p-1.5 rounded-lg hover:bg-blue-50 text-[#0064cb] transition-all cursor-pointer"
          title="Preview"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const getCommentAuthorName = (comment: any) => {
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
    if (typeof comment.created_by === 'object') {
      if (comment.created_by.first_name || comment.created_by.last_name) {
        return `${comment.created_by.first_name || ""} ${comment.created_by.last_name || ""}`.trim();
      }
      if (comment.created_by.name) return comment.created_by.name;
    } else if (typeof comment.created_by === 'string') {
      return comment.created_by;
    }
  }
  if (comment.guard) {
    if (typeof comment.guard === 'object') {
      if (comment.guard.first_name || comment.guard.last_name) {
        return `${comment.guard.first_name || ""} ${comment.guard.last_name || ""}`.trim();
      }
      if (comment.guard.name) return comment.guard.name;
    }
  }
  if (comment.admin) {
    if (typeof comment.admin === 'object') {
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

function ShiftViewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const shiftId = searchParams.get("shift_id");
  const notificationId = searchParams.get("notification_id");
  const [shift, setShift] = useState<any>(null);
  const [reports, setReports] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReportsLoading, setIsReportsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportsError, setReportsError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("");
  const [previewFile, setPreviewFile] = useState<{ url: string; title: string; contentType: string } | null>(null);

  // Comments state
  const [comments, setComments] = useState<Comment[]>([]);
  const [isCommentsLoading, setIsCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [commentType, setCommentType] = useState<"internal" | "external">("internal");
  const [commentText, setCommentText] = useState("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const commentFileInputRef = useRef<HTMLInputElement>(null);

  const loadShiftDetails = useCallback(async () => {
    if (!shiftId) return;
    setIsLoading(true);
    const endpoint = `/api/v1/shift/${shiftId}`;
    const fullUrl = `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`;
    console.log("[ShiftDetailsClient] Requesting URL:", fullUrl);

    const res = await fetchShiftDetailsAction(shiftId);
    console.log("[ShiftDetailsClient] Response data:", res);

    if (res.success) {
      setShift(res.data);
      setError(null);
    } else {
      setError(res.error || "Shift not found");
    }
    setIsLoading(false);
  }, [shiftId]);

  const loadReportsDetails = useCallback(async () => {
    if (!shiftId) return;
    setIsReportsLoading(true);
    setReportsError(null);
    const res = await fetchShiftReportsAction(shiftId);
    console.log("[ShiftReports] API response:", res);
    if (res.success) {
      console.log("[ShiftReports] Data:", res.data);
      setReports(res.data);
    } else {
      setReportsError(res.error || "Failed to load reports");
    }
    setIsReportsLoading(false);
  }, [shiftId]);

  const loadComments = useCallback(async () => {
    if (!shiftId) return;
    setIsCommentsLoading(true);
    setCommentsError(null);
    const res = await fetchCommentsAction(shiftId);
    if (res.success && res.data) {
      setComments(res.data);
    } else {
      setCommentsError(res.error || "Failed to load comments");
    }
    setIsCommentsLoading(false);
  }, [shiftId]);

  useEffect(() => {
    loadShiftDetails();
    loadReportsDetails();
  }, [loadShiftDetails, loadReportsDetails]);

  useEffect(() => {
    if (activeTab === "comment") {
      loadComments();
    }
  }, [activeTab, loadComments]);

  const handleCommentSubmit = async () => {
    if (!commentText.trim() && !attachedFile) {
      toast.error("Please enter a comment message or attach a file.");
      return;
    }
    setIsSubmitting(true);
    try {
      let attachFileUrl = null;
      if (attachedFile) {
        const fileExt = attachedFile.name.split('.').pop();
        const fileNameWithoutExt = attachedFile.name.replace(/\.[^/.]+$/, "");
        const uniqueId = Math.floor(1000 + Math.random() * 9000);
        const uniqueFileName = `${fileNameWithoutExt}_${uniqueId}.${fileExt}`;

        const res = await generateUploadUrlAction(uniqueFileName, "comment", shiftId || undefined);
        if (!res.success || !res.data) {
          throw new Error(res.error || "Failed to generate upload URL");
        }
        const { signed_url, file_path } = res.data;

        const uploadRes = await fetch(signed_url, {
          method: "PUT",
          body: attachedFile,
          headers: {
            "Content-Type": attachedFile.type
          }
        });
        if (!uploadRes.ok) {
          throw new Error("Failed to upload attachment");
        }
        attachFileUrl = file_path;
      }

      const res = await addCommentAction({
        shift_id: shiftId!,
        type: commentType,
        user_message: commentText.trim() || null,
        attach_file_url: attachFileUrl,
      });

      if (res.success) {
        toast.success("Comment added successfully");
        setCommentText("");
        setAttachedFile(null);
        loadComments();
      } else {
        toast.error(res.error || "Failed to add comment");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to submit comment";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDescription = (text: string) => {
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

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'shift_planned': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'shift_accepted': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'shift_in_progress': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'shift_finished': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'shift_approved': return 'bg-sky-100 text-sky-700 border-sky-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const formatStatus = (status: string) => {
    if (!status) return 'N/A';
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleAssignGuard = () => {
    if (!shift) return;
    const paymentStatus = shift.payment_status?.toLowerCase();
    if (paymentStatus === 'pending' || paymentStatus === 'unpaid') {
      toast.error("The payment status should be Paid or Net term client to assign the shift to Guard.", {
        duration: 5000,
      });
      return;
    }
    // Logic for successful assignment redirection or action can go here
    toast.info("Proceeding to assign guard...");
  };

  const getStepStatus = (stepName: string) => {
    if (!shift) return "upcoming";
    const statusOrder = [
      "shift_planned",
      "shift_accepted",
      "shift_in_progress",
      "shift_finished",
      "shift_approved"
    ];

    const currentStatus = shift.status;
    const currentIndex = statusOrder.indexOf(currentStatus);
    const stepIndex = statusOrder.indexOf(stepName);

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    return "upcoming";
  };

  const tabs = [
    { id: "comment", label: "Add Comment", icon: MessageSquarePlus },
    { id: "dar", label: "DAR Report", icon: FileText },
    { id: "report", label: "Report", icon: ClipboardList },
    { id: "checkpoint", label: "Check Point", icon: MapPin },
    { id: "history", label: "History of changes", icon: History },
  ];

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Breadcrumbs & Header */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-slate-700 text-[13px] mb-1">
              <Link href="/dashboard" className="hover:text-[#0064cb] transition-colors">Dashboard</Link>
              {notificationId && (
                <>
                  <ChevronRight className="w-3.5 h-3.5" />
                  <Link href="/notifications" className="hover:text-[#0064cb] transition-colors">Notifications</Link>
                </>
              )}
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-slate-500">Shift View</span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={notificationId ? "/notifications" : "/dashboard"}
                className="p-2 bg-white rounded-lg border border-slate-200 text-slate-700 hover:text-[#0064cb] transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div className="group relative">
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2 cursor-default">
                  {shift ? (
                    <>
                      <span className="hover:text-[#0064cb] transition-colors">{shift.customer_name}</span>
                      <span className="text-slate-700 font-normal ml-1">[ #SH-{shift.shift_no} ]</span>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 animate-pulse py-1">
                      <div className="h-6 w-32 bg-slate-200 rounded-md"></div>
                      <div className="h-6 w-24 bg-slate-100 rounded-md"></div>
                    </div>
                  )}
                </h1>

                {shift?.invoice_description && (
                  <div className="absolute left-0 top-full mt-2 w-80 p-4 bg-slate-900 text-white text-[11px] rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[70] border border-slate-800 shadow-blue-900/20">
                    <div className="absolute -top-1.5 left-6 w-3 h-3 bg-slate-900 rotate-45 border-l border-t border-slate-800" />
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800">
                      <p className="font-bold text-blue-400">Shift Description</p>
                    </div>
                    <div className="max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
                      {formatDescription(shift.invoice_description)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Icons */}
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 py-4">
          {[
            { label: "Update Status", icon: RefreshCcw, color: "emerald", onClick: () => { } },
            { label: "Schedule Shift", icon: Calendar, color: "blue", onClick: () => { } },
            { label: "Find Available Guard", icon: Search, color: "orange", onClick: () => { } },
            { label: "Assign Guard", icon: UserPlus, color: "indigo", onClick: handleAssignGuard },
            { label: "Open in CRM", icon: ExternalLink, color: "slate", onClick: () => { } },
            { label: "Cancel Service", icon: XCircle, color: "red", onClick: () => { } },
          ].filter(action => {
            if (!shift?.payment_status && (action.label === "Find Available Guard" || action.label === "Assign Guard")) {
              return false;
            }
            return true;
          }).map((action, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1.5 group cursor-pointer" onClick={action.onClick}>
              <div className={cn(
                "w-12 h-12 rounded-full border-2 flex items-center justify-center shadow-sm transition-colors",
                action.color === "emerald" && "border-emerald-500 text-emerald-500 group-hover:bg-emerald-50",
                action.color === "blue" && "border-[#0064cb] text-[#0064cb] group-hover:bg-blue-50",
                action.color === "orange" && "border-orange-500 text-orange-500 group-hover:bg-orange-50",
                action.color === "indigo" && "border-indigo-500 text-indigo-500 group-hover:bg-indigo-50",
                action.color === "slate" && "border-slate-400 text-slate-800 group-hover:bg-slate-50",
                action.color === "red" && "border-red-400 text-red-500 group-hover:bg-red-50",
              )}>
                <action.icon className="w-5.5 h-5.5" />
              </div>
              <span className="text-[10px] font-bold text-slate-600 uppercase text-center leading-[1.2] tracking-tight">{action.label.split(' ').join('\n')}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Content Card - Decreased width to 7/12 */}
        <div className="lg:col-span-7 space-y-6">
          {isLoading ? (
            <Card className="border-slate-200 shadow-sm overflow-hidden rounded-xl bg-white p-6 space-y-6 animate-pulse">
              {/* Header Skeleton */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="h-7 w-32 bg-slate-200 rounded-lg" />
                <div className="h-8 w-24 bg-slate-100/80 rounded-lg" />
              </div>

              {/* Location Skeleton */}
              <div className="flex items-center gap-2">
                <div className="h-4 w-20 bg-slate-200 rounded" />
                <div className="h-4 w-72 bg-slate-100/80 rounded" />
              </div>

              {/* Rows Skeleton */}
              <div className="space-y-4 pt-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="grid grid-cols-4 py-2 border-b border-slate-50 last:border-none items-center gap-4">
                    <div className="h-3.5 bg-slate-200 rounded w-24" />
                    <div className="col-span-3 h-4 bg-slate-100/80 rounded w-1/2" />
                  </div>
                ))}
              </div>
            </Card>
          ) : shift ? (
            <Card className="border-slate-200 shadow-sm overflow-hidden rounded-xl bg-white">
              <CardContent className="p-0">
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-slate-700">#SH-{shift.shift_no}</span>
                    <Button
                      variant="outline"
                      className="h-8 rounded-lg font-bold text-[10px] text-[#0064cb] border-[#0064cb]/20 hover:bg-blue-50 transition-all active:scale-95 flex gap-1.5 cursor-pointer px-3"
                    >
                      <Edit2 className="w-3 h-3" />
                      Edit Details
                    </Button>
                  </div>

                  {shift.shipping_location?.location && (
                    <p className="text-slate-600 font-bold text-sm">
                      Location - <span className="text-[#0064cb] cursor-pointer hover:underline">
                        {[
                          shift.shipping_location.location.street,
                          shift.shipping_location.location.city,
                          shift.shipping_location.location.state,
                          shift.shipping_location.location.country,
                          shift.shipping_location.location.zip,
                        ].filter(Boolean).join(", ")}
                      </span>
                    </p>
                  )}
                </div>

                <div className="border-t border-slate-100 divide-y divide-slate-100">
                  <div className="grid grid-cols-4 p-4 items-center">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">CUSTOMER NAME:</span>
                    <div className="col-span-3 text-sm text-slate-800 font-medium">{shift.customer_name}</div>
                  </div>

                  {shift.invoice_no && (
                    <div className="grid grid-cols-4 p-4 items-center">
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">INVOICE NO:</span>
                      <div className="col-span-3 text-sm text-slate-800 font-medium">{shift.invoice_no}</div>
                    </div>
                  )}

                  {shift.invoice_description && (
                    <div className="grid grid-cols-4 p-4 items-start">
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-tight pt-1">DESCRIPTION:</span>
                      <div className="col-span-3 text-sm text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                        {shift.invoice_description}
                      </div>
                    </div>
                  )}

                  {shift.shift_description && (
                    <div className="grid grid-cols-4 p-4 items-start">
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-tight pt-1">SHIFT DUTIES:</span>
                      <div className="col-span-3 text-sm text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                        {shift.shift_description}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-4 p-4 items-center">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">ASSIGNED GUARD:</span>
                    <div className="col-span-3 text-sm text-slate-800 font-medium">
                      {shift.assigned_guard ? (
                        typeof shift.assigned_guard === 'object'
                          ? `${shift.assigned_guard.first_name} ${shift.assigned_guard.last_name}`
                          : shift.assigned_guard
                      ) : (
                        <span className="text-slate-700">No guard assigned</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 p-4 items-center">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">STATUS:</span>
                    <div className="col-span-3">
                      <span className={cn(
                        "text-[10px] font-bold px-2.5 py-1 rounded-full border",
                        getStatusColor(shift.status)
                      )}>
                        {formatStatus(shift.status)}
                      </span>
                    </div>
                  </div>

                  {(shift.scheduled_for?.shift_start_time || shift.scheduled_for?.shift_end_time) && (
                    <div className="grid grid-cols-4 p-4 items-center">
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">SCHEDULED FOR:</span>
                      <div className="col-span-3 flex flex-col gap-1">
                        {shift.scheduled_for?.shift_start_time && (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-700 uppercase font-bold w-12">Start:</span>
                            <span className="text-sm text-slate-800 font-medium">{formatDateTime(shift.scheduled_for.shift_start_time)}</span>
                          </div>
                        )}
                        {shift.scheduled_for?.shift_end_time && (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-700 uppercase font-bold w-12">End:</span>
                            <span className="text-sm text-slate-800 font-medium">{formatDateTime(shift.scheduled_for.shift_end_time)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {(shift.execution_time?.guard_shift_started_at || shift.execution_time?.guard_shift_ended_at) && (
                    <div className="grid grid-cols-4 p-4 items-center">
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">EXECUTION TIME:</span>
                      <div className="col-span-3 flex flex-col gap-1">
                        {shift.execution_time?.guard_shift_started_at && (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-700 uppercase font-bold w-12">Start:</span>
                            <span className="text-sm text-slate-800 font-medium">{formatDateTime(shift.execution_time.guard_shift_started_at)}</span>
                          </div>
                        )}
                        {shift.execution_time?.guard_shift_ended_at && (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-700 uppercase font-bold w-12">End:</span>
                            <span className="text-sm text-slate-800 font-medium">{formatDateTime(shift.execution_time.guard_shift_ended_at)}</span>
                          </div>
                        )}
                        {shift.execution_time?.total_break_duration_min > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-700 uppercase font-bold w-12">Break:</span>
                            <span className="text-sm text-slate-800 font-medium">{shift.execution_time.total_break_duration_min} min</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-slate-200 shadow-sm rounded-xl bg-white p-20 text-center">
              <XCircle className="w-12 h-12 text-red-200 mx-auto mb-4" />
              <p className="text-sm font-bold text-slate-600 mb-1">{error || "No shift data found"}</p>
              <p className="text-xs text-slate-700 font-medium">The shift may have been deleted or the ID is invalid.</p>
              <Button
                variant="outline"
                className="mt-6 h-9 rounded-xl text-xs font-bold text-[#0064cb] border-blue-100 hover:bg-blue-50"
                onClick={() => router.push("/dashboard")}
              >
                Return to Dashboard
              </Button>
            </Card>
          )}

          {/* Progress Stepper Section */}
          <Card className="border-slate-200 shadow-sm rounded-xl bg-white p-8">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-tight mb-6">Progress</h3>

            {(() => {
              const steps = [
                { label: "Shift Planned", status: getStepStatus("shift_planned") },
                { label: "Shift Accepted", status: getStepStatus("shift_accepted") },
                { label: "Shift In Progress", status: getStepStatus("shift_in_progress") },
                { label: "Shift Finished", status: getStepStatus("shift_finished") },
                { label: "Shift Approved", status: getStepStatus("shift_approved") },
                { label: "Pre-shift Check-in completed", status: "upcoming" },
              ];

              const activeIndex = steps.findIndex(s => s.status === "current");
              const lastCompletedIndex = steps.reduce((acc, s, idx) => s.status === "completed" ? idx : acc, -1);
              const progressIndex = activeIndex !== -1 ? activeIndex : lastCompletedIndex;
              const progressPercentage = steps.length > 1 ? (Math.max(0, progressIndex) / (steps.length - 1)) * 100 : 0;

              return (
                <div className="relative px-4">
                  {/* Background Track Line */}
                  <div className="absolute top-4 left-[8.33%] right-[8.33%] h-[3px] bg-slate-100 rounded-full" />

                  {/* Active Progress Fill Line */}
                  <div
                    className="absolute top-4 left-[8.33%] h-[3px] bg-gradient-to-r from-[#0064cb] to-[#3b82f6] rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage * 0.8333}%` }}
                  />

                  <div className="flex justify-between items-start relative">
                    {steps.map((step, idx) => (
                      <div key={idx} className="flex flex-col items-center flex-1 group">
                        {/* Circle Indicator */}
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center relative z-10 transition-all duration-300",
                          step.status === "completed" && "bg-emerald-500 border border-emerald-500 text-white shadow-md shadow-emerald-100",
                          step.status === "current" && "bg-white border-2 border-[#0064cb] text-[#0064cb] shadow-[0_0_0_5px_rgba(0,100,203,0.12)]",
                          step.status === "upcoming" && "bg-white border border-slate-200 text-slate-300"
                        )}>
                          {step.status === "completed" ? (
                            <svg className="w-4 h-4 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : step.status === "current" ? (
                            <span className="w-2.5 h-2.5 bg-[#0064cb] rounded-full animate-pulse" />
                          ) : (
                            <span className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
                          )}
                        </div>

                        {/* Label */}
                        <div className="mt-4 px-1 text-center">
                          <span className={cn(
                            "text-[11px] font-bold block leading-snug transition-colors",
                            step.status === "completed" && "text-slate-800",
                            step.status === "current" && "text-[#0064cb] font-extrabold",
                            step.status === "upcoming" && "text-slate-500"
                          )}>
                            {step.label}
                          </span>
                          {step.status === "completed" && (
                            <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider block mt-0.5">Completed</span>
                          )}
                          {step.status === "current" && (
                            <span className="text-[9px] font-bold text-[#0064cb] uppercase tracking-wider block mt-0.5 animate-pulse">Active</span>
                          )}
                          {step.status === "upcoming" && (
                            <span className="text-[9px] font-bold text-slate-700 uppercase tracking-wider block mt-0.5">Pending</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </Card>
        </div>

        {/* Sidebar with Vertical Tabs - Increased width to 5/12 */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-slate-200 shadow-xl overflow-hidden rounded-[1.5rem] bg-white border-none">
            <CardContent className="p-0">
              <div className="flex flex-col">
                {tabs.map((tab) => (
                  <div key={tab.id} className="border-b border-slate-50 last:border-0">
                    <button
                      onClick={() => setActiveTab(activeTab === tab.id ? "" : tab.id)}
                      className={cn(
                        "w-full flex items-center justify-between p-5 transition-all hover:bg-slate-50/80 cursor-pointer",
                        activeTab === tab.id ? "bg-blue-50 text-[#0064cb]" : "text-slate-600"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg transition-colors",
                          activeTab === tab.id ? "bg-blue-100/50" : "bg-slate-100"
                        )}>
                          <tab.icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold tracking-tight uppercase">{tab.label}</span>
                      </div>
                      <ChevronRight className={cn(
                        "w-4 h-4 transition-transform duration-300",
                        activeTab === tab.id ? "rotate-90 text-[#0064cb]" : "text-slate-300"
                      )} />
                    </button>

                    {activeTab === tab.id && (
                      <div className="p-6 bg-white border-t border-slate-50 animate-in slide-in-from-top-2 duration-300">
                        {tab.id === "history" ? (
                          isReportsLoading ? (
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
                          ) : reports?.shift_history && reports.shift_history.length > 0 ? (
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
                                        .replace(/_/g, ' ')
                                        .split(' ')
                                        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
                                        .join(' ');
                                      metaItems.push({ label: formattedLabel, value: String(val) });
                                    }
                                  });
                                }

                                const mediaList: { key: string; label: string; file: any }[] = [];
                                if (event.media_urls && typeof event.media_urls === "object") {
                                  Object.entries(event.media_urls).forEach(([key, val]) => {
                                    if (val && typeof val === "object" && (val as any).url) {
                                      const label = key.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
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
                                            <div key={mIdx} className="flex justify-between items-center text-xs border-b border-[#e1f0ff]/50 pb-1.5 last:border-0 last:pb-0">
                                              <span className="text-[10px] font-bold text-slate-900">{item.label}:</span>
                                              <span className="text-slate-800 font-medium text-[11px]">{item.value}</span>
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
                                              contentType={media.file.content_type || (media.key.includes("video") ? "video/mp4" : undefined)}
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
                          ) : (
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
                          )
                        ) : tab.id === "comment" ? (
                          <div className="space-y-6">
                            <div className="flex items-center justify-between pb-2">
                              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-tight">General comments</h3>
                            </div>

                            {/* Comment List */}
                            {isCommentsLoading ? (
                              <div className="space-y-6 animate-pulse">
                                {[...Array(3)].map((_, i) => (
                                  <div key={i} className="flex gap-3">
                                    {/* Avatar Skeleton */}
                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0" />
                                    {/* Content Skeleton */}
                                    <div className="space-y-2 flex-1">
                                      <div className="flex items-center gap-2">
                                        <div className="h-3.5 bg-slate-200 rounded w-20" />
                                        <div className="h-3 bg-slate-100/80 rounded w-16" />
                                      </div>
                                      <div className="h-12 bg-slate-50 border border-slate-100 rounded-xl w-full" />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : commentsError ? (
                              <div className="p-8 text-center text-red-500 font-medium text-xs">
                                {commentsError}
                              </div>
                            ) : comments.length === 0 ? (
                              <div className="p-4 text-center text-slate-700 font-medium text-xs">
                                No comments yet. Write one below!
                              </div>
                            ) : (
                              <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {comments.map((comment: any) => {
                                  const authorName = getCommentAuthorName(comment);
                                  const isExternal = comment.type === "external";
                                  return (
                                    <div key={comment.id} className="flex gap-3">
                                      <div className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold",
                                        isExternal ? "bg-slate-100 text-slate-600" : "bg-blue-100 text-blue-600"
                                      )}>
                                        <UserPlus className="w-4 h-4" />
                                      </div>
                                      <div className="space-y-2 flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className="text-[13px] font-bold text-slate-800">{authorName}</span>
                                          <span className="text-[11px] text-slate-700">{formatDateTime(comment.created_at)}</span>
                                        </div>
                                        {comment.user_message && (
                                          <p className="text-[12px] text-slate-600 leading-relaxed whitespace-pre-wrap break-words">
                                            {comment.user_message}
                                          </p>
                                        )}
                                        {comment.attach_file_url && (
                                          <FileAttachmentCard
                                            url={comment.attach_file_url}
                                            label="Attachment"
                                            fallbackName="Attachment"
                                            onPreview={(url, title, contentType) => setPreviewFile({ url, title, contentType })}
                                          />
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Comment Input Area */}
                            <div className="pt-6 flex flex-col md:flex-row gap-3 items-start">
                              {/* Type Selection */}
                              <div className="w-full md:w-28 flex-shrink-0 relative">
                                <span className="absolute -top-2 left-3 px-1.5 bg-white text-[10px] font-bold text-slate-700 uppercase z-10">Type</span>
                                <Select value={commentType} onValueChange={(val: "internal" | "external") => setCommentType(val)}>
                                  <SelectTrigger className="!h-14 bg-white border-slate-200 rounded-lg text-[13px] text-slate-600 focus:ring-[#0064cb]/10 focus:border-[#0064cb] cursor-pointer shadow-sm px-4">
                                    <SelectValue placeholder="Select Type" />
                                  </SelectTrigger>
                                  <SelectContent className="min-w-[var(--radix-select-trigger-width)] w-[var(--radix-select-trigger-width)] rounded-lg border-slate-200 shadow-lg p-1 bg-white">
                                    <SelectItem value="internal" className="text-[13px] cursor-pointer rounded-md hover:bg-slate-50">Internal</SelectItem>
                                    <SelectItem value="external" className="text-[13px] cursor-pointer rounded-md hover:bg-slate-50">External</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Comment Box */}
                              <div className="flex-1 min-w-0 relative w-full">
                                <span className="absolute -top-2 left-4 px-1.5 bg-white text-[10px] font-bold text-slate-700 uppercase z-10">Comment</span>
                                <div className="border border-slate-200 rounded-lg bg-white focus-within:border-[#0064cb] focus-within:ring-4 focus-within:ring-[#0064cb]/5 transition-all p-1.5 pl-3 flex flex-col gap-1.5 shadow-sm min-h-[56px] justify-center">
                                  {attachedFile && (
                                    <div className="flex items-center gap-2 px-2 py-1 bg-slate-50 border border-slate-100 rounded-xl w-fit max-w-full">
                                      <span className="text-[11px] font-medium text-slate-700 truncate max-w-[180px]">
                                        {attachedFile.name}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => setAttachedFile(null)}
                                        className="p-1 rounded-full hover:bg-slate-200 text-slate-700 hover:text-red-500 transition-colors"
                                        title="Remove file"
                                      >
                                        <XCircle className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2 w-full">
                                    <div className="flex items-center">
                                      <input
                                        type="file"
                                        ref={commentFileInputRef}
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) setAttachedFile(file);
                                        }}
                                        className="hidden"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => commentFileInputRef.current?.click()}
                                        disabled={isSubmitting}
                                        className="p-2 rounded-full hover:bg-slate-50 text-[#0064cb] transition-colors cursor-pointer group disabled:opacity-50 flex-shrink-0"
                                        title="Attach file"
                                      >
                                        <Paperclip className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                      </button>
                                    </div>
                                    <textarea
                                      className="flex-1 bg-transparent border-none focus:outline-none outline-none focus:ring-0 p-1 text-[13px] text-slate-700 placeholder:text-slate-700 resize-none py-1.5 min-h-[36px] max-h-[120px] custom-scrollbar"
                                      placeholder="Write comment..."
                                      rows={1}
                                      value={commentText}
                                      onChange={(e) => setCommentText(e.target.value)}
                                      disabled={isSubmitting}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                          e.preventDefault();
                                          handleCommentSubmit();
                                        }
                                      }}
                                    />
                                    <Button
                                      onClick={handleCommentSubmit}
                                      disabled={isSubmitting || (!commentText.trim() && !attachedFile)}
                                      className="bg-[#0064cb] hover:bg-[#0052ae] text-white h-10 w-10 rounded-full flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-md shadow-blue-200/50 flex-shrink-0 p-0"
                                      title="Send comment"
                                    >
                                      {isSubmitting ? (
                                        <Loader2 className="w-4.5 h-4.5 animate-spin" />
                                      ) : (
                                        <Send className="w-4.5 h-4.5" />
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : tab.id === "dar" ? (
                          isReportsLoading ? (
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
                          ) : reports?.dar_report && reports.dar_report.url ? (
                            <div className="space-y-6">
                              <div className="flex items-center justify-between pb-2 border-b border-slate-50">
                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-tight">DAR Report Documents</h3>
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
                                      <span className="text-[10px] text-slate-700 font-medium italic">DAR Report Document</span>
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
                                          url: reports.dar_report.url,
                                          title: "DAR Report Document",
                                          contentType: reports.dar_report.content_type || "application/pdf"
                                        });
                                      }}
                                      className="p-2 rounded-xl hover:bg-blue-50 text-slate-700 hover:text-[#0064cb] transition-all cursor-pointer"
                                      title="Preview"
                                    >
                                      <Maximize2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="p-8 text-center space-y-3">
                              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto">
                                <FileText className="w-6 h-6 text-slate-200" />
                              </div>
                              {reportsError ? (
                                <>
                                  <p className="text-xs font-bold text-red-500 uppercase tracking-tight">Failed to load DAR Report</p>
                                  <p className="text-[11px] text-slate-500 font-mono break-all">{reportsError}</p>
                                </>
                              ) : (
                                <p className="text-xs font-medium text-slate-700">No DAR Report data available yet.</p>
                              )}
                            </div>
                          )
                        ) : tab.id === "report" ? (
                          isReportsLoading ? (
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
                          ) : reports?.incident_report && reports.incident_report.length > 0 ? (
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
                                      <span className="text-[10px] text-slate-700">{formatDateTime(report.created_at)}</span>
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
                          ) : (
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
                                <p className="text-xs font-medium text-slate-700">No Report data available yet.</p>
                              )}
                            </div>
                          )
                        ) : tab.id === "checkpoint" ? (
                          isReportsLoading ? (
                            <div className="space-y-6 animate-pulse">
                              {[...Array(2)].map((_, i) => (
                                <div key={i} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-3">
                                  <div className="grid grid-cols-1 gap-2.5">
                                    {[...Array(4)].map((_, j) => (
                                      <div key={j} className="flex justify-between items-center text-xs border-b border-slate-100/50 pb-1.5 last:border-0 last:pb-0">
                                        <div className="h-3 bg-slate-200 rounded w-20" />
                                        <div className="h-3 bg-slate-100/80 rounded w-24" />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : reports?.checkpoints && reports.checkpoints.length > 0 ? (
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
                                        <span className={cn(
                                          "px-2 py-0.5 rounded text-[10px] font-bold border",
                                          cp.status === "completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                                        )}>
                                          {formatStatus(cp.status)}
                                        </span>
                                      )
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
                                          <div key={iIdx} className="flex justify-between items-center text-xs border-b border-slate-100/50 pb-1.5 last:border-0 last:pb-0">
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
                                            onPreview={(url, title, contentType) => setPreviewFile({
                                              url,
                                              title: `Checkpoint #${cp.checkpoint_no} Site Photo`,
                                              contentType
                                            })}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ) : (
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
                          )
                        ) : (
                          <div className="p-8 text-center space-y-3">
                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto">
                              <tab.icon className="w-6 h-6 text-slate-200" />
                            </div>
                            <p className="text-xs font-medium text-slate-700 italic">No {tab.label} data available yet.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* File Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={(open) => !open && setPreviewFile(null)}>
        <DialogContent className="max-w-4xl w-[90vw] h-[85vh] p-0 bg-slate-900 border-none rounded-2xl flex flex-col gap-0 overflow-hidden [&>button>svg]:text-white [&>button]:z-50">
          <DialogHeader className="p-4 bg-white/5 border-b border-white/10 flex flex-row items-center justify-between">
            <DialogTitle className="text-white text-sm font-medium flex items-center gap-3">
              <FileText className="w-4 h-4 text-blue-400" />
              {previewFile?.title || "File Preview"}
            </DialogTitle>
          </DialogHeader>
          <div className="w-full flex-1 bg-slate-800 p-4 md:p-8 flex items-center justify-center overflow-auto">
            {previewFile ? (
              previewFile.contentType?.startsWith("image/") ? (
                <div className="relative max-w-full max-h-full flex items-center justify-center">
                  <img
                    src={previewFile.url}
                    alt={previewFile.title}
                    className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
                  />
                </div>
              ) : previewFile.contentType?.startsWith("video/") ? (
                <div className="w-full max-w-2xl aspect-video rounded-lg shadow-2xl overflow-hidden bg-black">
                  <video
                    src={previewFile.url}
                    controls
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : previewFile.contentType === "application/pdf" ? (
                <iframe
                  src={`${previewFile.url}#toolbar=0`}
                  className="w-full h-full rounded-lg shadow-2xl border-none bg-white min-h-[65vh]"
                  title={previewFile.title}
                />
              ) : (
                <div className="w-full max-w-2xl aspect-[3/4] bg-white rounded-lg shadow-2xl flex flex-col items-center justify-center p-12 text-center space-y-4">
                  <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                    <FileText className="w-10 h-10 text-[#0064cb]" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">{previewFile.title}</h2>
                  <p className="text-slate-800 text-sm max-w-sm">
                    Preview not directly supported for this file type ({previewFile.contentType}). Please download to view.
                  </p>
                  <div className="pt-6 flex gap-3">
                    <a
                      href={previewFile.url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#0064cb] hover:bg-[#0052ae] text-white rounded-xl px-4 py-2 flex items-center gap-2 text-sm font-bold shadow-md shadow-blue-200/50"
                    >
                      <Download className="w-4 h-4" />
                      Download File
                    </a>
                  </div>
                </div>
              )
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ShiftViewPage() {
  return (
    <Suspense fallback={
      <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-6 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-[#0064cb]" />
        <p className="text-slate-700 font-medium animate-pulse mt-4">Loading shift details...</p>
      </div>
    }>
      <ShiftViewContent />
    </Suspense>
  );
}
