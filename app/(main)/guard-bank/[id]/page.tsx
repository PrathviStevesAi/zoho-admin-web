"use client";

import { getSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
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
import { Plus, Check, Crop, X } from "lucide-react";
import { generateUploadUrlAction } from "@/actions/subcontractor.actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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

  // Badge UI & functionality states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isGeneratingBadge, setIsGeneratingBadge] = useState(false);
  const [isDeletingBadge, setIsDeletingBadge] = useState(false);

  // Badge Form states
  const [badgeName, setBadgeName] = useState("");
  const [badgeType, setBadgeType] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [badgeEmail, setBadgeEmail] = useState("");
  const [hasHeadshot, setHasHeadshot] = useState(true);
  const [selectedHeadshotFile, setSelectedHeadshotFile] = useState<File | null>(null);
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    badgeType?: string;
    issueDate?: string;
    expiryDate?: string;
    headshot?: string;
  }>({});
  
  // Crop Image Modal states & ref
  const cropImageRef = useRef<HTMLImageElement>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string>("");
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Fetch guard details
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
        
        // Populate Badge Form Default Values
        setBadgeName(`${data.data.first_name || ""} ${data.data.last_name || ""}`.trim());
        setBadgeEmail(data.data.email || "");
        setHasHeadshot(!!data.data.headshot_image_url);
        
        // Set Default Issue Date as Today YYYY-MM-DD
        const today = new Date().toISOString().split("T")[0];
        setIssueDate(today);
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

  // Handle status update (Approve/Decline)
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

  // Handle delete application
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

  // Save notes
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

  const handleOpenCrop = () => {
    let src = "";
    if (selectedHeadshotFile) {
      src = URL.createObjectURL(selectedHeadshotFile);
    } else if (guard?.headshot_image_url) {
      src = guard.headshot_image_url;
    }
    if (src) {
      setCropImageSrc(src);
      setIsCropModalOpen(true);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    } else {
      toast.error("No image available to crop");
    }
  };

  const handleNameChange = (val: string) => {
    setBadgeName(val);
    if (formErrors.name) {
      setFormErrors(prev => ({ ...prev, name: undefined }));
    }
  };

  const handleBadgeTypeChange = (val: string) => {
    setBadgeType(val);
    if (formErrors.badgeType) {
      setFormErrors(prev => ({ ...prev, badgeType: undefined }));
    }
  };

  const handleIssueDateChange = (val: string) => {
    setIssueDate(val);
    if (formErrors.issueDate) {
      setFormErrors(prev => ({ ...prev, issueDate: undefined }));
    }
  };

  const handleExpiryDateChange = (val: string) => {
    setExpiryDate(val);
    if (formErrors.expiryDate) {
      setFormErrors(prev => ({ ...prev, expiryDate: undefined }));
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    setOffset({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleApplyCrop = () => {
    const img = cropImageRef.current;
    if (!img) return;

    const container = img.parentElement;
    if (!container) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    const cropWidth = 180;
    const cropHeight = 240;
    
    const cropLeft = (containerWidth - cropWidth) / 2;
    const cropTop = (containerHeight - cropHeight) / 2;
    
    const renderedWidth = img.clientWidth;
    const renderedHeight = img.clientHeight;
    
    const scaledWidth = renderedWidth * zoom;
    const scaledHeight = renderedHeight * zoom;
    
    const imageCenterX = containerWidth / 2 + offset.x;
    const imageCenterY = containerHeight / 2 + offset.y;
    
    const imageLeft = imageCenterX - scaledWidth / 2;
    const imageTop = imageCenterY - scaledHeight / 2;
    
    const sx = (cropLeft - imageLeft) * (img.naturalWidth / scaledWidth);
    const sy = (cropTop - imageTop) * (img.naturalHeight / scaledHeight);
    
    const sWidth = cropWidth * (img.naturalWidth / scaledWidth);
    const sHeight = cropHeight * (img.naturalHeight / scaledHeight);
    
    const canvas = document.createElement("canvas");
    canvas.width = 360;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    try {
      ctx.drawImage(
        img,
        sx,
        sy,
        sWidth,
        sHeight,
        0,
        0,
        canvas.width,
        canvas.height
      );
      
      canvas.toBlob((blob) => {
        if (blob) {
          const croppedFile = new File([blob], "cropped_headshot.jpg", {
            type: "image/jpeg",
            lastModified: Date.now()
          });
          
          setSelectedHeadshotFile(croppedFile);
          setHasHeadshot(true);
          setIsCropModalOpen(false);
          if (formErrors.headshot) {
            setFormErrors(prev => ({ ...prev, headshot: undefined }));
          }
          toast.success("Image cropped successfully!");
        }
      }, "image/jpeg", 0.9);
    } catch (error) {
      console.error("Canvas drawing failed:", error);
      toast.error("Failed to crop image. If it's a remote image, please upload a local file to crop.");
    }
  };

  // Create generated badge ID image and save the path to `guard_badge_url`
  const handleCreateBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors: typeof formErrors = {};
    if (!badgeName.trim()) {
      errors.name = "Name is required";
    }
    if (!badgeType.trim()) {
      errors.badgeType = "Badge type is required";
    }
    if (!issueDate) {
      errors.issueDate = "Issue date is required";
    }
    if (!expiryDate) {
      errors.expiryDate = "Expiry date is required";
    }
    if (!hasHeadshot || (!selectedHeadshotFile && !guard?.headshot_image_url)) {
      errors.headshot = "A passport headshot is required";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error("Please fill in all required fields");
      return;
    }

    setFormErrors({});
    setIsGeneratingBadge(true);
    try {
      let fileToUpload: Blob | File;
      if (selectedHeadshotFile) {
        fileToUpload = selectedHeadshotFile;
      } else if (guard.headshot_image_url) {
        // Fetch original headshot URL as blob to upload
        const response = await fetch(guard.headshot_image_url);
        fileToUpload = await response.blob();
      } else {
        toast.error("Please upload a passport image");
        return;
      }

      const formData = new FormData();
      formData.append("passport_image", fileToUpload, selectedHeadshotFile?.name || "headshot.png");
      formData.append("name", badgeName);
      formData.append("badge", badgeType);
      formData.append("date_new", issueDate);
      formData.append("expiry_new", expiryDate);
      formData.append("email", badgeEmail);

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
        setIsCreateModalOpen(false);
        setSelectedHeadshotFile(null);
        fetchGuardDetails();
      } else {
        toast.error(getErrorMessage(data, "Failed to create badge ID"));
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "An error occurred while creating the badge ID");
    } finally {
      setIsGeneratingBadge(false);
    }
  };

  // Remove the badge URL link from the guard application
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

  // Force download the badge image block cross-origin
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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteConfirmOpen(true)}
            className="text-red-500 hover:text-red-600 hover:bg-red-50 h-9 w-9 rounded-lg cursor-pointer"
          >
            <Trash2 className="w-5 h-5" />
          </Button>
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
                <div className="relative group w-full aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                  <img
                    src={guard.driver_license_url}
                    alt="Driver License"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <a
                    href={guard.driver_license_url}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity font-semibold gap-1 text-sm rounded-xl"
                  >
                    <Eye className="w-4 h-4" /> View Full
                  </a>
                </div>
              ) : (
                <div className="w-full aspect-video rounded-xl border border-dashed border-slate-350 bg-slate-100 flex items-center justify-center text-slate-400 font-medium text-sm">
                  Not Provided
                </div>
              )}
            </div>
            <div className="bg-slate-50 rounded-2xl border border-slate-200/60 p-4 flex flex-col items-center justify-center space-y-3">
              <span className="text-xs text-slate-600 font-bold block text-center">Security Guard License</span>
              {guard.security_guard_license_url ? (
                <div className="relative group w-full aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                  <img
                    src={guard.security_guard_license_url}
                    alt="Security Guard License"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <a
                    href={guard.security_guard_license_url}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity font-semibold gap-1 text-sm rounded-xl"
                  >
                    <Eye className="w-4 h-4" /> View Full
                  </a>
                </div>
              ) : (
                <div className="w-full aspect-video rounded-xl border border-dashed border-slate-350 bg-slate-100 flex items-center justify-center text-slate-400 font-medium text-sm">
                  Not Provided
                </div>
              )}
            </div>
            <div className="bg-slate-50 rounded-2xl border border-slate-200/60 p-4 flex flex-col items-center justify-center space-y-3">
              <span className="text-xs text-slate-600 font-bold block text-center">Headshot Image</span>
              {guard.headshot_image_url ? (
                <div className="relative group w-full aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                  <img
                    src={guard.headshot_image_url}
                    alt="Headshot Image"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <a
                    href={guard.headshot_image_url}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity font-semibold gap-1 text-sm rounded-xl"
                  >
                    <Eye className="w-4 h-4" /> View Full
                  </a>
                </div>
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

        {/* 9. FAST GUARD BADGE ID (Dynamically shown based on eligibility or active badge) */}
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

      {/* Creation Modal Flow (Image 4 reference) */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-xl bg-white p-6 rounded-lg shadow-xl font-sans overflow-y-auto max-h-[90vh] border border-slate-100">
          <DialogHeader className="border-b border-slate-100 pb-3 flex flex-row items-center justify-between">
            <DialogTitle className="text-lg font-bold text-slate-800">Upload FAST GUARD BADGE ID</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleCreateBadge} className="space-y-5 pt-3">
            <div className="space-y-2">
              <label className={cn("text-xs font-bold block", formErrors.headshot ? "text-red-500" : "text-slate-700")}>Passport Image:</label>
              {hasHeadshot && (selectedHeadshotFile || guard.headshot_image_url) ? (
                <div className={cn("bg-slate-50 border rounded-lg p-4 flex items-start gap-4 transition-colors", formErrors.headshot ? "border-red-500" : "border-slate-200")}>
                  <img 
                    src={selectedHeadshotFile ? URL.createObjectURL(selectedHeadshotFile) : guard.headshot_image_url} 
                    alt="Passport Headshot" 
                    className="w-20 h-24 rounded border border-slate-200 object-cover"
                  />
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-1.5 text-xs text-green-700 font-semibold bg-green-50 px-2 py-1 rounded w-fit">
                      <Check className="w-4 h-4 text-green-600" />
                      {selectedHeadshotFile ? "Headshot Selected" : "Headshot Auto-loaded"}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleOpenCrop}
                        className="h-8 text-xs font-semibold flex items-center gap-1 px-3 border-blue-200 text-[#0064cb] hover:bg-blue-50 cursor-pointer"
                      >
                        <Crop className="w-3.5 h-3.5" />
                        Crop
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setHasHeadshot(false);
                          setSelectedHeadshotFile(null);
                        }}
                        className="h-8 text-xs font-semibold flex items-center gap-1 px-3 border-red-200 text-red-500 hover:bg-red-50 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={cn("border border-dashed rounded-lg p-6 bg-slate-50 flex flex-col items-center justify-center gap-2 transition-colors", formErrors.headshot ? "border-red-500" : "border-slate-300")}>
                  <span className="text-xs text-slate-500 font-medium">Headshot image not loaded</span>
                  <label className="h-8 text-xs font-semibold px-3 py-1.5 border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-700 bg-white shadow-sm flex items-center justify-center cursor-pointer transition-all hover:scale-[1.01] active:scale-95">
                    Upload Headshot Image
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSelectedHeadshotFile(file);
                          setHasHeadshot(true);
                          if (formErrors.headshot) {
                            setFormErrors(prev => ({ ...prev, headshot: undefined }));
                          }
                        }
                      }}
                    />
                  </label>
                </div>
              )}
              {formErrors.headshot && (
                <p className="text-[10px] font-bold text-red-500 mt-1">{formErrors.headshot}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className={cn("text-xs font-bold block", formErrors.name ? "text-red-500" : "text-slate-700")}>Name</label>
                <input 
                  type="text" 
                  placeholder="Enter name"
                  value={badgeName} 
                  onChange={(e) => handleNameChange(e.target.value)} 
                  className={cn(
                    "w-full text-sm font-semibold p-2 border rounded focus:outline-none focus:ring-2 transition-all",
                    formErrors.name ? "border-red-500 focus:ring-red-500/20" : "border-slate-200 focus:ring-[#0064cb]/20"
                  )}
                />
                {formErrors.name && (
                  <p className="text-[10px] font-bold text-red-500 mt-0.5">{formErrors.name}</p>
                )}
              </div>
              
              <div className="space-y-1">
                <label className={cn("text-xs font-bold block", formErrors.badgeType ? "text-red-500" : "text-slate-700")}>Badge Type:</label>
                <input 
                  type="text" 
                  placeholder="Enter badge type"
                  value={badgeType} 
                  onChange={(e) => handleBadgeTypeChange(e.target.value)} 
                  className={cn(
                    "w-full text-sm font-semibold p-2 border rounded focus:outline-none focus:ring-2 transition-all",
                    formErrors.badgeType ? "border-red-500 focus:ring-red-500/20" : "border-slate-200 focus:ring-[#0064cb]/20"
                  )}
                />
                {formErrors.badgeType && (
                  <p className="text-[10px] font-bold text-red-500 mt-0.5">{formErrors.badgeType}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className={cn("text-xs font-bold block", formErrors.issueDate ? "text-red-500" : "text-slate-700")}>Issue Date:</label>
                <input 
                  type="date" 
                  value={issueDate} 
                  onChange={(e) => handleIssueDateChange(e.target.value)} 
                  className={cn(
                    "w-full text-sm font-semibold p-2 border rounded focus:outline-none focus:ring-2 transition-all",
                    formErrors.issueDate ? "border-red-500 focus:ring-red-500/20" : "border-slate-200 focus:ring-[#0064cb]/20"
                  )}
                />
                {formErrors.issueDate && (
                  <p className="text-[10px] font-bold text-red-500 mt-0.5">{formErrors.issueDate}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className={cn("text-xs font-bold block", formErrors.expiryDate ? "text-red-500" : "text-slate-700")}>Expiry Date:</label>
                <input 
                  type="date" 
                  value={expiryDate} 
                  onChange={(e) => handleExpiryDateChange(e.target.value)} 
                  className={cn(
                    "w-full text-sm font-semibold p-2 border rounded focus:outline-none focus:ring-2 transition-all",
                    formErrors.expiryDate ? "border-red-500 focus:ring-red-500/20" : "border-slate-200 focus:ring-[#0064cb]/20"
                  )}
                />
                {formErrors.expiryDate && (
                  <p className="text-[10px] font-bold text-red-500 mt-0.5">{formErrors.expiryDate}</p>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Email:</label>
              <input 
                type="email" 
                placeholder="Enter email"
                value={badgeEmail} 
                disabled 
                className="w-full text-sm font-semibold p-2 border border-slate-200 rounded bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>

            <Button
              type="submit"
              disabled={isGeneratingBadge}
              className="w-full h-11 bg-[#0064cb] hover:bg-[#0052ae] text-white font-bold rounded-lg flex items-center justify-center gap-2 shadow cursor-pointer transition-all active:scale-[0.99] border-none"
            >
              {isGeneratingBadge ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Badge...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 rotate-180" />
                  Submit
                </>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Large View Modal Flow (Image 3 reference) */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-md bg-white p-6 rounded-lg shadow-xl font-sans flex flex-col items-center border border-slate-100">
          <DialogHeader className="border-b border-slate-100 pb-3 w-full flex flex-row items-center justify-between">
            <DialogTitle className="text-lg font-bold text-slate-800">Badge ID</DialogTitle>
          </DialogHeader>
          
          <div className="py-6 flex flex-col items-center justify-center">
            {guard.guard_badge_url && (
              <img 
                src={guard.guard_badge_url} 
                alt="Guard Badge ID Large View" 
                className="w-64 h-auto rounded border border-slate-200 shadow-md"
              />
            )}
          </div>
          
          <div className="flex gap-4 w-full">
            <Button
              onClick={handleDownloadBadge}
              className="flex-1 h-11 bg-[#0f766e] hover:bg-[#0d5e58] text-white font-bold rounded flex items-center justify-center gap-1.5 shadow cursor-pointer transition-all border-none"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
            <Button
              onClick={handleDeleteBadge}
              disabled={isDeletingBadge}
              className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white font-bold rounded flex items-center justify-center gap-1.5 shadow cursor-pointer transition-all border-none"
            >
              {isDeletingBadge ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Free Crop Image Dialog */}
      <Dialog open={isCropModalOpen} onOpenChange={setIsCropModalOpen}>
        <DialogContent className="max-w-md bg-white p-6 rounded-lg shadow-xl font-sans border border-slate-100">
          <DialogHeader className="border-b border-slate-100 pb-3 flex flex-row items-center justify-between">
            <DialogTitle className="text-lg font-bold text-slate-800">Free Crop Image</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 pt-4">
            <div 
              className="w-full h-[300px] bg-[#9e9e9e] relative overflow-hidden select-none cursor-move rounded-lg"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {cropImageSrc && (
                <img 
                  ref={cropImageRef}
                  src={cropImageSrc}
                  alt="Crop Source"
                  crossOrigin="anonymous"
                  className="absolute pointer-events-none max-w-none origin-center"
                  style={{
                    left: "50%",
                    top: "50%",
                    transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${zoom})`,
                    width: "auto",
                    height: "240px",
                    objectFit: "contain",
                  }}
                />
              )}
              
              {/* Spotlight overlay with crop box container and grid lines */}
              <div 
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[180px] h-[240px] border border-white/95 pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] rounded-sm"
              >
                {/* 3x3 Grid Lines */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                  <div className="border-r border-b border-white/30 col-span-1 row-span-1"></div>
                  <div className="border-r border-b border-white/30 col-span-1 row-span-1"></div>
                  <div className="border-b border-white/30 col-span-1 row-span-1"></div>
                  <div className="border-r border-b border-white/30 col-span-1 row-span-1"></div>
                  <div className="border-r border-b border-white/30 col-span-1 row-span-1"></div>
                  <div className="border-b border-white/30 col-span-1 row-span-1"></div>
                  <div className="border-r border-white/30 col-span-1 row-span-1"></div>
                  <div className="border-r border-white/30 col-span-1 row-span-1"></div>
                  <div className="col-span-1 row-span-1"></div>
                </div>
              </div>
            </div>
            
            {/* Zoom Slider */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-800">
                Zoom: {Math.round(zoom * 100)}%
              </div>
              <input
                type="range"
                min="1"
                max="3"
                step="0.01"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0064cb]"
              />
            </div>
            
            {/* Action buttons */}
            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCropModalOpen(false)}
                className="h-10 px-5 text-slate-700 border-slate-200 hover:bg-slate-50 font-semibold cursor-pointer rounded-lg"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleApplyCrop}
                className="h-10 px-5 bg-[#0064cb] hover:bg-[#0052ae] text-white font-semibold flex items-center gap-1.5 cursor-pointer rounded-lg border-none"
              >
                <Check className="w-4 h-4" />
                Apply Crop
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Action Approve / Decline / CRM buttons (Dynamically rendered) */}
      {(guard.action?.is_approved || guard.action?.is_disqualified || guard.action?.is_open_crm) && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-sm mx-auto pt-0">
          {guard.action?.is_approved && (
            <Button
              onClick={() => handleUpdateStatus("approved")}
              disabled={isUpdatingStatus !== null}
              className="w-full h-12 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-100 cursor-pointer transition-all hover:scale-[1.01] active:scale-95 border-none"
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
              className="w-full h-12 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-100 cursor-pointer transition-all hover:scale-[1.01] active:scale-95 border-none"
            >
              {isUpdatingStatus === "disqualified" ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
              Decline
            </Button>
          )}

          {guard.action?.is_open_crm && (
            <Button
              onClick={() => {
                toast.info("Opening CRM...");
              }}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-100 cursor-pointer transition-all hover:scale-[1.01] active:scale-95 border-none"
            >
              Open CRM
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
