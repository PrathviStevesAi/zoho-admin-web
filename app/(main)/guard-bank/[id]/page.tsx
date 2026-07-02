"use client";

import { getSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  Trash2,
  User,
  MapPin,
  Mail,
  Phone,
  FileText,
  Video,
  CheckCircle2,
  XCircle,
  Eye,
  Loader2,
  Shield,
  NotebookText,
  Download,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmationDialog } from "../components/confirmation-dialog";
import { Plus } from "lucide-react";
import { BadgeCreateDialog } from "../components/badge-create-dialog";
import { BadgeViewDialog } from "../components/badge-view-dialog";
import { ImagePreview } from "../components/image-preview";

export default function GuardDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [guard, setGuard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isGeneratingBadge, setIsGeneratingBadge] = useState(false);
  const [isDeletingBadge, setIsDeletingBadge] = useState(false);

  const fetchGuardDetails = async () => {
    setLoading(true);
    try {
      const session = await getSession() as any;
      const token = session?.accessToken;
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const url = `${baseUrl}/api/v1/guard/bank/application/${id}`;

      const res = await fetch(url, {
        headers: {
          "ngrok-skip-browser-warning": "true",
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setGuard(data.data);
        setNotes(data.data.notes || data.data.admin_notes || "");
      } else {
        toast.error("Failed to fetch guard details");
        router.push("/guard-bank");
      }
    } catch (error) {
      console.error("Failed to fetch guard details:", error);
      toast.error("An error occurred while fetching details");
      router.push("/guard-bank");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchGuardDetails();
    }
  }, [id]);

  const handleUpdateStatus = async (newStatus: "approved" | "disqualified") => {
    setIsUpdatingStatus(newStatus);
    try {
      const session = await getSession() as any;
      const token = session?.accessToken;
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const url = `${baseUrl}/api/v1/guard/bank/application/${id}/status/${newStatus}`;

      const res = await fetch(url, {
        method: "PUT",
        headers: {
          "ngrok-skip-browser-warning": "true",
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(`Application ${newStatus === "approved" ? "Approved" : "Declined"} successfully`);
        router.push("/guard-bank");
      } else {
        toast.error(getErrorMessage(data, `Failed to update status to ${newStatus}`));
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("An error occurred while updating status");
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const handleDeleteApplication = async () => {
    setIsDeleting(true);
    try {
      const session = await getSession() as any;
      const token = session?.accessToken;
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const url = `${baseUrl}/api/v1/guard/bank/application/${id}`;

      const res = await fetch(url, {
        method: "DELETE",
        headers: {
          "ngrok-skip-browser-warning": "true",
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });

      if (res.ok) {
        toast.success("Guard application deleted successfully");
        setDeleteConfirmOpen(false);
        router.push("/guard-bank");
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(getErrorMessage(data, "Failed to delete guard application"));
      }
    } catch (error) {
      console.error("Failed to delete guard:", error);
      toast.error("An error occurred while deleting the guard application");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      const session = await getSession() as any;
      const token = session?.accessToken;
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const url = `${baseUrl}/api/v1/guard/bank/application/${id}`;

      const res = await fetch(url, {
        method: "PATCH",
        headers: {
          "ngrok-skip-browser-warning": "true",
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({ notes })
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        console.log("Notes saved successfully");
      } else {
        console.error("Failed to save notes:", data.message || data.detail);
      }
    } catch (error) {
      console.error("Failed to save notes:", error);
      toast.error("An error occurred while saving notes");
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleCreateBadgeSubmit = async (formData: FormData): Promise<boolean> => {
    setIsGeneratingBadge(true);
    try {
      const session = await getSession() as any;
      const token = session?.accessToken;
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const url = `${baseUrl}/api/v1/guard/fastguard-badge`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "ngrok-skip-browser-warning": "true",
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: formData
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success("Badge ID created successfully!");
        fetchGuardDetails();
        return true;
      } else {
        toast.error(getErrorMessage(data, "Failed to create badge ID"));
        return false;
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "An error occurred while creating the badge ID");
      return false;
    } finally {
      setIsGeneratingBadge(false);
    }
  };

  const handleDeleteBadge = async () => {
    setIsDeletingBadge(true);
    try {
      const session = await getSession() as any;
      const token = session?.accessToken;
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const deleteUrl = `${baseUrl}/api/v1/guard/${id}/fastguard-badge`;

      const deleteRes = await fetch(deleteUrl, {
        method: "DELETE",
        headers: {
          "ngrok-skip-browser-warning": "true",
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });

      if (!deleteRes.ok) {
        const errData = await deleteRes.json().catch(() => ({}));
        throw new Error(getErrorMessage(errData, "Failed to delete badge ID"));
      }

      toast.success("Badge ID deleted successfully");
      setIsViewModalOpen(false);
      fetchGuardDetails();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to delete badge ID");
    } finally {
      setIsDeletingBadge(false);
    }
  };

  const handleDownloadBadge = async () => {
    if (!guard.guard_badge_url) return;
    try {
      const res = await fetch(guard.guard_badge_url);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${guard.first_name || "guard"}_badge.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Badge downloaded successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to download badge image");
    }
  };

  if (loading) {
    return (
      <div className="p-0 sm:p-4 md:p-6 max-w-[1200px] mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
        {/* Header skeleton */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
              <Skeleton className="h-8 w-44" />
            </div>
            <Skeleton className="h-10 w-10 rounded-lg" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden divide-y divide-slate-100">
          {/* Title banner */}
          <div className="px-6 py-5 flex items-center gap-3">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-6 w-48" />
          </div>

          {/* Personal Details skeleton */}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 pb-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-5 w-36" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-5 w-32" />
                </div>
              ))}
            </div>
          </div>

          {/* Contact Info skeleton */}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 pb-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-5 w-28" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-5 w-36" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Address skeleton */}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 pb-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-5 w-20" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <div className="space-y-1.5 sm:col-span-2 md:col-span-3">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-5 w-64" />
              </div>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-5 w-28" />
                </div>
              ))}
            </div>
          </div>

          {/* Preferences skeleton */}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 pb-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-5 w-28" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-6 w-10 rounded-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Images skeleton */}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 pb-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-5 w-52" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-slate-50 rounded-2xl border border-slate-200/60 p-4 space-y-3">
                  <Skeleton className="h-4 w-32 mx-auto" />
                  <Skeleton className="w-full aspect-video rounded-xl" />
                </div>
              ))}
            </div>
          </div>

          {/* Video skeleton */}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 pb-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-5 w-40" />
            </div>
            <Skeleton className="max-w-2xl mx-auto w-full aspect-video rounded-2xl" />
          </div>

          {/* Resume skeleton */}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 pb-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-5 w-40" />
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/70">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-24 rounded-lg" />
                <Skeleton className="h-9 w-28 rounded-lg" />
              </div>
            </div>
          </div>

          {/* Admin Notes skeleton */}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 pb-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-5 w-28" />
            </div>
            <Skeleton className="w-full h-32 rounded-xl" />
            <div className="flex justify-end">
              <Skeleton className="h-9 w-28 rounded-lg" />
            </div>
          </div>
        </div>

        {/* Approve / Decline buttons skeleton */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-xs mx-auto">
          <Skeleton className="w-full h-12 rounded-xl" />
          <Skeleton className="w-full h-12 rounded-xl" />
        </div>

        {/* Footer skeleton */}
        <div className="text-center space-y-2 pt-4 border-t border-slate-100">
          <Skeleton className="h-3.5 w-56 mx-auto" />
          <Skeleton className="h-3.5 w-44 mx-auto" />
        </div>
      </div>
    );
  }

  if (!guard) return null;

  const getBadgeValue = (val: any) => {
    const isTrue = val === true || val === "yes";
    return (
      <span className={cn(
        "px-2.5 py-1 rounded-full text-xs font-bold shadow-sm inline-block",
        isTrue ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
      )}>
        {isTrue ? "Yes" : "No"}
      </span>
    );
  };

  const getErrorMessage = (data: any, fallback: string): string => {
    if (!data) return fallback;
    if (typeof data === "string") return data;

    // Handle detail field
    if (data.detail !== undefined && data.detail !== null) {
      if (typeof data.detail === "string") return data.detail;
      if (typeof data.detail.error === "string") return data.detail.error;
      if (typeof data.detail.message === "string") return data.detail.message;
      if (Array.isArray(data.detail) && data.detail[0]?.msg) return data.detail[0].msg;
      return JSON.stringify(data.detail);
    }

    // Handle error field
    if (data.error !== undefined && data.error !== null) {
      if (typeof data.error === "string") return data.error;
      if (typeof data.error.message === "string") return data.error.message;
      return JSON.stringify(data.error);
    }

    // Handle message field
    if (typeof data.message === "string") return data.message;

    return fallback;
  };

  const getDocumentFilename = (url?: string) => {
    if (!url) return "Document";
    const parts = url.split("/");
    const last = parts[parts.length - 1];
    return decodeURIComponent(last).substring(0, 30) + (last.length > 30 ? "..." : "");
  };

  return (
    <div className="p-0 sm:p-4 md:p-6 max-w-[1200px] mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Breadcrumbs & Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-slate-700 text-[13px] mb-1">
          <Link href="/dashboard" className="hover:text-[#0064cb] transition-colors">Dashboard</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/guard-bank" className="hover:text-[#0064cb] transition-colors">Guard Bank</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-600 font-medium">Guard Details</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/guard-bank" className="p-2 bg-white rounded-lg border border-slate-200 text-slate-700 hover:text-[#0064cb] transition-all">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Guard Details</h1>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden divide-y divide-slate-100">

        {/* Title Banner */}
        <div className="px-6 py-5 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-[#0064cb]" />
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">
              {`${guard.first_name || ""} ${guard.last_name || ""}`.trim() || "Guard Application"}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            {guard.action?.is_open_crm && (
              <Button
                size="sm"
                onClick={() => window.open(`https://crm.zoho.com/crm/org677245190/tab/Vendors/${guard.vendor_id}`, "_blank")}
                className="bg-[#0064cb] hover:bg-[#0064cb]/90 text-white text-xs px-4 h-8 rounded-md min-w-[110px] cursor-pointer"
              >
                Open CRM
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteConfirmOpen(true)}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 h-9 w-9 rounded-lg cursor-pointer"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* 1. Personal Details */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
            <User className="w-4 h-4 text-[#0064cb]" />
            <h3 className="font-bold text-slate-800 text-[14px]">Personal Details</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 font-semibold">First Name</span>
              <p className="text-sm font-bold text-slate-800">{guard.first_name || "N/A"}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-slate-500 font-semibold">Last Name</span>
              <p className="text-sm font-bold text-slate-800">{guard.last_name || "N/A"}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-slate-500 font-semibold">Full Name</span>
              <p className="text-sm font-bold text-slate-800">{`${guard.first_name || ""} ${guard.last_name || ""}`.trim() || "N/A"}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-slate-500 font-semibold">Gender</span>
              <p className="text-sm font-bold text-slate-800 capitalize">{guard.gender || "N/A"}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-slate-500 font-semibold">Ethnicity</span>
              <p className="text-sm font-bold text-slate-800 capitalize">{guard.ethnicity || "N/A"}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-slate-500 font-semibold">Veteran Status</span>
              <p className="text-sm font-bold text-slate-800 capitalize">{guard.veteran_status || "N/A"}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-slate-500 font-semibold">Disability Status</span>
              <p className="text-sm font-bold text-slate-800 capitalize">{guard.disability_status || "N/A"}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-slate-500 font-semibold">Background Check consent?</span>
              <p className="text-sm font-bold text-slate-800">{guard.background === true || guard.background === "yes" ? "Yes" : "No"}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-slate-500 font-semibold">Has Security License?</span>
              <p className="text-sm font-bold text-slate-800">{guard.license === true || guard.license === "yes" ? "Yes" : "No"}</p>
            </div>
          </div>
        </div>

        {/* 2. Contact Info */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
            <Mail className="w-4 h-4 text-[#0064cb]" />
            <h3 className="font-bold text-slate-800 text-[14px]">Contact Info</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#0064cb] flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Email Address</span>
                <a href={`mailto:${guard.email}`} className="text-sm font-bold text-slate-850 hover:text-[#0064cb] block truncate">{guard.email || "N/A"}</a>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="w-10 h-10 rounded-lg bg-[#0064cb]/10 text-[#0064cb] flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Cell Phone</span>
                <a href={`tel:${guard.phone_number}`} className="text-sm font-bold text-slate-850 hover:text-[#0064cb] block">{guard.phone_number || "N/A"}</a>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Address */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
            <MapPin className="w-4 h-4 text-[#0064cb]" />
            <h3 className="font-bold text-slate-800 text-[14px]">Address</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <div className="space-y-1 sm:col-span-2 md:col-span-3">
              <span className="text-xs text-slate-500 font-semibold">Street Address</span>
              <p className="text-sm font-bold text-slate-800 leading-relaxed">{guard.street_address || "N/A"}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-slate-500 font-semibold">City</span>
              <p className="text-sm font-bold text-slate-800">{guard.city || "N/A"}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-slate-500 font-semibold">State</span>
              <p className="text-sm font-bold text-slate-800">{guard.state || "N/A"}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-slate-500 font-semibold">Zip Code</span>
              <p className="text-sm font-bold text-slate-800">{guard.zip_code || "N/A"}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-slate-500 font-semibold">Country</span>
              <p className="text-sm font-bold text-slate-800">{guard.country || "N/A"}</p>
            </div>
          </div>
        </div>

        {/* 4. Job Preferences */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
            <Shield className="w-4 h-4 text-[#0064cb]" />
            <h3 className="font-bold text-slate-800 text-[14px]">Preferences</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-600 font-semibold">On Call</span>
              {getBadgeValue(guard.on_call)}
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-600 font-semibold">Job Alerts</span>
              {getBadgeValue(guard.job_alerts)}
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-600 font-semibold">Smartphone</span>
              {getBadgeValue(guard.smartphone)}
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-600 font-semibold">Transport</span>
              {getBadgeValue(guard.transport)}
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-600 font-semibold">Armed Security</span>
              {getBadgeValue(guard.armed)}
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-600 font-semibold">Unarmed Security</span>
              {getBadgeValue(guard.unarmed)}
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-600 font-semibold">Speaking English</span>
              {getBadgeValue(guard.english_language)}
            </div>
            <div className="space-y-1 p-3">
              <span className="text-xs text-slate-500 font-semibold block">Referral</span>
              <p className="text-sm font-bold text-slate-800">{guard.referral || "N/A"}</p>
            </div>
            <div className="space-y-1 p-3">
              <span className="text-xs text-slate-500 font-semibold block">License Number</span>
              <p className="text-sm font-bold text-slate-800">{guard.license_number || "N/A"}</p>
            </div>
            <div className="space-y-1 p-3">
              <span className="text-xs text-slate-500 font-semibold block">Expiration Date</span>
              <p className="text-sm font-bold text-slate-800">
                {guard.license_expiration_date ? new Date(guard.license_expiration_date).toLocaleDateString() : "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* 5. Uploaded Images */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
            <FileText className="w-4 h-4 text-[#0064cb]" />
            <h3 className="font-bold text-slate-800 text-[14px]">Uploaded Credentials Images</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50 rounded-2xl border border-slate-200/60 p-4 flex flex-col items-center justify-center space-y-3">
              <span className="text-xs text-slate-600 font-bold block text-center">Driver License</span>
              {guard.driver_license_url ? (
                <ImagePreview url={guard.driver_license_url} alt="Driver License" />
              ) : (
                <div className="w-full aspect-video rounded-xl border border-dashed border-slate-350 bg-slate-100 flex items-center justify-center text-slate-400 font-medium text-sm">
                  Not Provided
                </div>
              )}
            </div>
            <div className="bg-slate-50 rounded-2xl border border-slate-200/60 p-4 flex flex-col items-center justify-center space-y-3">
              <span className="text-xs text-slate-600 font-bold block text-center">Security Guard License</span>
              {guard.security_guard_license_url ? (
                <ImagePreview url={guard.security_guard_license_url} alt="Security Guard License" />
              ) : (
                <div className="w-full aspect-video rounded-xl border border-dashed border-slate-350 bg-slate-100 flex items-center justify-center text-slate-400 font-medium text-sm">
                  Not Provided
                </div>
              )}
            </div>
            <div className="bg-slate-50 rounded-2xl border border-slate-200/60 p-4 flex flex-col items-center justify-center space-y-3">
              <span className="text-xs text-slate-600 font-bold block text-center">Headshot Image</span>
              {guard.headshot_image_url ? (
                <ImagePreview url={guard.headshot_image_url} alt="Headshot Image" />
              ) : (
                <div className="w-full aspect-video rounded-xl border border-dashed border-slate-350 bg-slate-100 flex items-center justify-center text-slate-400 font-medium text-sm">
                  Not Provided
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 6. Verification Video */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
            <Video className="w-4 h-4 text-[#0064cb]" />
            <h3 className="font-bold text-slate-800 text-[14px]">Verification Video</h3>
          </div>
          {guard.verification_video_url ? (
            <div className="max-w-2xl mx-auto rounded-2xl overflow-hidden shadow-md border border-slate-200 bg-black">
              <video
                src={guard.verification_video_url}
                controls
                className="w-full h-auto aspect-video object-contain"
              />
            </div>
          ) : (
            <div className="h-40 rounded-xl border border-dashed border-slate-350 bg-slate-50 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <Video className="w-8 h-8 text-slate-300 animate-pulse" />
              <span className="text-sm font-medium">No Verification Video Uploaded</span>
            </div>
          )}
        </div>

        {/* 7. Resume Document */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
            <FileText className="w-4 h-4 text-[#0064cb]" />
            <h3 className="font-bold text-slate-800 text-[14px]">Resume Document</h3>
          </div>
          {guard.resume_url ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/70">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-blue-50 text-[#0064cb] rounded-lg flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate" title={guard.resume_url}>
                    {getDocumentFilename(guard.resume_url)}
                  </p>
                  <span className="text-xs text-slate-500 font-semibold block">PDF/Word Document</span>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="flex-1 sm:flex-none h-9 rounded-lg border-slate-200 hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer"
                >
                  <a href={guard.resume_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" /> Preview
                  </a>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="flex-1 sm:flex-none h-9 rounded-lg border-slate-200 hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer"
                >
                  <a href={guard.resume_url} download className="flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5" /> Download
                  </a>
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-24 rounded-xl border border-dashed border-slate-350 bg-slate-50 flex items-center justify-center text-slate-400 text-sm font-medium">
              No Resume Uploaded
            </div>
          )}
        </div>

        {/* 8. Admin Notes */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
            <NotebookText className="w-4 h-4 text-[#0064cb]" />
            <h3 className="font-bold text-slate-800 text-[14px]">Admin Notes</h3>
          </div>
          <div className="space-y-4">
            <textarea
              placeholder="Write your notes here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[120px] w-full rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0064cb]/20 p-4 text-sm font-medium bg-white"
            />
            <div className="flex justify-end">
              <Button
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
                className="bg-[#0064cb] hover:bg-[#0052ae] text-white px-5 rounded-lg h-9 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-200/50 cursor-pointer"
              >
                {isSavingNotes ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Saving Note
                  </>
                ) : (
                  <>
                    <NotebookText className="w-3.5 h-3.5" />
                    Save Note
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {(guard.action?.is_generate_badge_id || guard.guard_badge_url) && (
          <div className="p-6 space-y-4 font-sans">
            <div className="flex items-center justify-between pb-2 border-b border-slate-50">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#0064cb]" />
                <h3 className="font-bold text-slate-800 text-[14px]">FAST GUARD BADGE ID</h3>
              </div>
              {!guard.guard_badge_url && (
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-[#0064cb] hover:bg-[#0052ae] text-white text-xs font-bold py-1.5 px-3 rounded flex items-center gap-1.5 cursor-pointer h-8 border-none"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Badge ID
                </Button>
              )}
            </div>

            {!guard.guard_badge_url ? (
              <div className="text-center py-6 text-slate-500 font-medium text-sm">
                Badge ID not available
              </div>
            ) : (
              <div className="flex flex-col items-center py-4">
                {/* Badge card image container */}
                <div
                  onClick={() => setIsViewModalOpen(true)}
                  className="cursor-pointer border border-slate-200 rounded-lg p-2 bg-slate-50 hover:shadow-md transition-shadow"
                >
                  <img
                    src={guard.guard_badge_url}
                    alt="Guard Badge ID"
                    className="w-48 h-auto rounded object-contain border border-slate-200"
                  />
                </div>

                {/* Delete button below card */}
                <Button
                  onClick={handleDeleteBadge}
                  variant="outline"
                  className="mt-4 border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 text-xs font-bold h-9 px-6 rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <BadgeCreateDialog
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        defaultName={`${guard.first_name || ""} ${guard.last_name || ""}`.trim()}
        defaultEmail={guard.email || ""}
        defaultHeadshotUrl={guard.headshot_image_url || ""}
        onSubmit={handleCreateBadgeSubmit}
        isSubmitting={isGeneratingBadge}
      />

      <BadgeViewDialog
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        badgeUrl={guard.guard_badge_url || ""}
        onDownload={handleDownloadBadge}
        onDelete={handleDeleteBadge}
        isDeleting={isDeletingBadge}
      />

      {(guard.action?.is_approved || guard.action?.is_disqualified) && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mx-auto pt-0">
          {guard.action?.is_approved && (
            <Button
              onClick={() => handleUpdateStatus("approved")}
              disabled={isUpdatingStatus !== null}
              className="w-[180px] max-w-[200px] h-12 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-100 cursor-pointer transition-all hover:scale-[1.01] active:scale-95 border-none"
            >
              {isUpdatingStatus === "approved" ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
              Approve
            </Button>
          )}

          {guard.action?.is_disqualified && (
            <Button
              onClick={() => handleUpdateStatus("disqualified")}
              disabled={isUpdatingStatus !== null}
              className="w-[160px] h-12 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-100 cursor-pointer transition-all hover:scale-[1.01] active:scale-95 border-none"
            >
              {isUpdatingStatus === "disqualified" ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
              Decline
            </Button>
          )}
        </div>
      )}

      {/* Footer Info */}
      <div className="text-center text-xs text-slate-500 space-y-1 pt-0 border-t border-slate-100">
        {guard.performed_by && (
          <p className="font-semibold">Record touch by : <span className="text-slate-700">{guard.performed_by}</span></p>
        )}
        {guard.created_at && (
          <p className="font-semibold">Form submit on : <span className="text-slate-700">{new Date(guard.created_at).toLocaleDateString()}</span></p>
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteApplication}
        title="Delete Guard Application?"
        description="Are you sure you want to delete this guard application? This action cannot be undone."
        confirmText="Yes, delete it"
        isDanger={true}
        isLoading={isDeleting}
      />
    </div>
  );
}
