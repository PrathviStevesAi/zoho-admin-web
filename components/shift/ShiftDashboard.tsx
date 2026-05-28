"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, FileText, Download } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Actions
import {
  fetchShiftDetailsAction,
  fetchCommentsAction,
  addCommentAction,
  updateShiftDetailsAction,
  cancelShiftServiceAction,
  manualStartShiftAction,
  assignGuardToShiftAction,
  fetchGuardTrackingAction
} from "@/actions/dashboard.actions";
import { generateUploadUrlAction } from "@/actions/profile.actions";
import { fetchShiftReportsAction } from "@/actions/notification.actions";

// External components
import { CancelServiceDialog } from "@/app/(main)/invoices/[id]/_components/CancelServiceDialog";
import { SelectUserDialog } from "@/app/(main)/invoices/[id]/_components/SelectUserDialog";

// Local Sub-components
import { ShiftHeader } from "./ShiftHeader";
import { ShiftDetailsCard } from "./ShiftDetailsCard";
import { ShiftProgressStepper } from "./ShiftProgressStepper";
import { ShiftMapCard } from "./ShiftMapCard";
import { ShiftSettingsCard } from "./ShiftSettingsCard";
import { ShiftTabsModule } from "./ShiftTabsModule";
import { EditShiftLocationDialog } from "./dialogs/EditShiftLocationDialog";

// Types & Utils
import { Shift, ShiftReports, PreviewFile, Address } from "./types";
import { triggerFileDownload } from "./utils";

interface ShiftDashboardProps {
  shiftId: string;
  notificationId?: string | null;
}

export function ShiftDashboard({ shiftId, notificationId }: ShiftDashboardProps) {
  const router = useRouter();

  // Core Data State
  const [shift, setShift] = useState<Shift | null>(null);
  const [reports, setReports] = useState<ShiftReports | null>(null);
  const [comments, setComments] = useState<any[]>([]);

  // Loading States
  const [isLoading, setIsLoading] = useState(false);
  const [isReportsLoading, setIsReportsLoading] = useState(false);
  const [isCommentsLoading, setIsCommentsLoading] = useState(false);

  // Error States
  const [error, setError] = useState<string | null>(null);
  const [reportsError, setReportsError] = useState<string | null>(null);
  const [commentsError, setCommentsError] = useState<string | null>(null);

  // Map & Live WebSocket Tracking State
  const [trackingPath, setTrackingPath] = useState<[number, number][]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number] | undefined>(undefined);

  // Dialog & Visibility Flags
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEditLocationOpen, setIsEditLocationOpen] = useState(false);
  const [isCancelServiceOpen, setIsCancelServiceOpen] = useState(false);
  const [isSelectGuardOpen, setIsSelectGuardOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<PreviewFile | null>(null);

  // Action Pending States
  const [isStartingShift, setIsStartingShift] = useState(false);
  const [isCancellingService, setIsCancellingService] = useState(false);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isAssigningGuard, setIsAssigningGuard] = useState<string | null>(null);

  // --- API CALLS ---

  const loadShiftDetails = useCallback(async () => {
    if (!shiftId) return;
    setIsLoading(true);
    const res = await fetchShiftDetailsAction(shiftId, notificationId || undefined);
    if (res.success) {
      setShift(res.data);
      setError(null);
    } else {
      setError(res.error || "Shift not found");
    }
    setIsLoading(false);
  }, [shiftId, notificationId]);

  const loadReportsDetails = useCallback(async () => {
    if (!shiftId) return;
    setIsReportsLoading(true);
    setReportsError(null);
    const res = await fetchShiftReportsAction(shiftId);
    if (res.success) {
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

  // Load shift details and reports on mount
  useEffect(() => {
    loadShiftDetails();
    loadReportsDetails();
  }, [loadShiftDetails, loadReportsDetails]);

  // Dynamic geocoding/websocket tracking hook
  useEffect(() => {
    if (shift && shift.shift_id && shift.assigned_guard) {
      const guardId =
        typeof shift.assigned_guard === "object"
          ? shift.assigned_guard.id || shift.assigned_guard.guard_id
          : shift.assigned_guard;

      if (guardId) {
        // 1. Fetch initial tracking history
        fetchGuardTrackingAction(guardId, shift.shift_id).then((res) => {
          if (res.success && res.data && res.data.path) {
            const mappedPath = res.data.path.map((p: any) => [p.latitude, p.longitude]);
            setTrackingPath(mappedPath);
          }
        });

        // 2. Establish live WebSocket connection
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://clanking-bagginess-flammable.ngrok-free.dev";
        const cleanBase = baseUrl.replace(/\/+$/, "");
        const wsProtocol = cleanBase.startsWith("https") ? "wss" : "ws";
        const wsHost = cleanBase.replace(/^https?:\/\//, "").split("/")[0];
        const wsUrl = `${wsProtocol}://${wsHost}/api/v1/tracking/ws/admin/shift/${shift.shift_id}`;

        console.log("[WebSocket] Connecting to:", wsUrl);
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log("[WebSocket] Connection established successfully!");
        };

        ws.onmessage = (event) => {
          try {
            console.log("[WebSocket] Raw message string received:", event.data);
            const message = JSON.parse(event.data);
            if (message) {
              console.log("[WebSocket] Parsed JSON Object:", message);
              const rawLat = message.latitude !== undefined ? message.latitude : message.data?.latitude;
              const rawLon = message.longitude !== undefined ? message.longitude : message.data?.longitude;

              const lat = typeof rawLat === "string" ? parseFloat(rawLat) : rawLat;
              const lon = typeof rawLon === "string" ? parseFloat(rawLon) : rawLon;

              if (typeof lat === "number" && !isNaN(lat) && typeof lon === "number" && !isNaN(lon)) {
                console.log(`%c[WebSocket Tracking] Guard Live Coordinates -> Lat: ${lat}, Lon: ${lon}`, "color: #0064cb; font-weight: bold; font-size: 11px;");
                setTrackingPath((prev) => {
                  if (prev.length > 0) {
                    const last = prev[prev.length - 1];
                    if (last[0] === lat && last[1] === lon) return prev;
                  }
                  return [...prev, [lat, lon]];
                });
              } else if (Array.isArray(message.path)) {
                const freshPath = message.path
                  .map((p: any) => {
                    const pLat = typeof p.latitude === "string" ? parseFloat(p.latitude) : p.latitude;
                    const pLon = typeof p.longitude === "string" ? parseFloat(p.longitude) : p.longitude;
                    return [pLat, pLon];
                  })
                  .filter((p: any) => !isNaN(p[0]) && !isNaN(p[1]));
                console.log("%c[WebSocket Tracking] Full Coordinates Path Array Loaded:", "color: #10b981; font-weight: bold;", freshPath);
                setTrackingPath(freshPath);
              } else if (message.data && Array.isArray(message.data.path)) {
                const freshPath = message.data.path
                  .map((p: any) => {
                    const pLat = typeof p.latitude === "string" ? parseFloat(p.latitude) : p.latitude;
                    const pLon = typeof p.longitude === "string" ? parseFloat(p.longitude) : p.longitude;
                    return [pLat, pLon];
                  })
                  .filter((p: any) => !isNaN(p[0]) && !isNaN(p[1]));
                console.log("%c[WebSocket Tracking] Full Coordinates Path Array Loaded (from data nested):", "color: #10b981; font-weight: bold;", freshPath);
                setTrackingPath(freshPath);
              }
            }
          } catch (err) {
            console.error("[WebSocket] Failed to parse message:", err);
          }
        };

        ws.onerror = (error) => {
          console.warn("[WebSocket] Connection error:", error);
        };

        ws.onclose = (event) => {
          console.log("[WebSocket] Connection closed:", event.reason, "Code:", event.code);
        };

        return () => {
          console.log("[WebSocket] Cleaning up connection...");
          ws.close();
        };
      }
    }
  }, [shift]);

  // Center map using Nominatim or exact location
  useEffect(() => {
    if (shift) {
      if (shift.shipping_location?.latitude !== undefined && shift.shipping_location?.longitude !== undefined) {
        const lat = Number(shift.shipping_location.latitude);
        const lon = Number(shift.shipping_location.longitude);
        if (!isNaN(lat) && !isNaN(lon)) {
          setMapCenter([lat, lon]);
          return;
        }
      }

      if (shift.shipping_location?.location) {
        const addr = shift.shipping_location.location;
        const addressQuery = [addr.street, addr.city, addr.state, addr.country].filter(Boolean).join(", ");

        if (addressQuery) {
          fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressQuery)}`)
            .then((res) => res.json())
            .then((data) => {
              if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                setMapCenter([lat, lon]);
              }
            })
            .catch((err) => {
              console.error("Geocoding error:", err);
            });
        }
      }
    }
  }, [shift]);

  // --- FORM ACTIONS ---

  const handleSaveDetails = async (payload: any) => {
    setIsSavingDetails(true);
    const detailsPayload = { ...payload, shift_id: shiftId };
    console.log("[ShiftDashboard] handleSaveDetails - Payload:", detailsPayload);
    const res = await updateShiftDetailsAction(detailsPayload);
    if (res.success) {
      toast.success("Details updated successfully");
      loadShiftDetails();
    } else {
      toast.error(res.error || "Failed to update details");
    }
    setIsSavingDetails(false);
  };

  const handleSaveLocation = async (address: Address) => {
    setIsSavingLocation(true);
    const payload = {
      shift_id: shiftId,
      shipping_address: {
        street: address.street?.trim() || "",
        city: address.city?.trim() || "",
        state: address.state?.trim() || "",
        zip: address.zip?.trim() || "",
        country: address.country?.trim() || "",
      },
    };

    console.log("[ShiftDashboard] handleSaveLocation - Payload:", payload);
    const res = await updateShiftDetailsAction(payload);
    if (res.success) {
      toast.success("Location updated successfully");
      setIsEditLocationOpen(false);
      loadShiftDetails();
    } else {
      toast.error(res.error || "Failed to update location");
    }
    setIsSavingLocation(false);
  };

  const handleSaveSettings = async (settings: {
    create_checkpoint_interval: string;
    guard_break_max_duration: string;
    guard_break_limit: string;
    geofence_radius: string;
  }) => {
    setIsSavingSettings(true);
    const payload = {
      shift_id: shiftId,
      create_checkpoint_interval:
        settings.create_checkpoint_interval === "" ? 0 : Number(settings.create_checkpoint_interval),
      guard_break_max_duration:
        settings.guard_break_max_duration === "" ? 0 : Number(settings.guard_break_max_duration),
      guard_break_limit: settings.guard_break_limit === "" ? 0 : Number(settings.guard_break_limit),
      geofence_radius: settings.geofence_radius === "" ? 150 : Number(settings.geofence_radius),
    };

    console.log("[ShiftDashboard] handleSaveSettings - Payload:", payload);
    const res = await updateShiftDetailsAction(payload);
    if (res.success) {
      toast.success("Settings updated successfully");
      setIsSettingsOpen(false);
      loadShiftDetails();
    } else {
      toast.error(res.error || "Failed to update settings");
    }
    setIsSavingSettings(false);
  };

  const handleManualStartShift = async () => {
    setIsStartingShift(true);
    try {
      const res = await manualStartShiftAction({ shift_id: shiftId });
      if (res.success) {
        toast.success("Shift manually started successfully");
        loadShiftDetails();
      } else {
        toast.error(res.error || "Failed to start shift");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to start shift");
    } finally {
      setIsStartingShift(false);
    }
  };

  const handleCancelServiceConfirm = async (reason: string) => {
    setIsCancellingService(true);
    try {
      const res = await cancelShiftServiceAction({
        shift_id: shiftId,
        reason,
      });
      if (res.success) {
        toast.success("Service cancelled successfully");
        setIsCancelServiceOpen(false);
        loadShiftDetails();
      } else {
        toast.error(res.error || "Failed to cancel service");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel service");
    } finally {
      setIsCancellingService(false);
    }
  };

  const handleSelectGuard = async (guard: any) => {
    const targetGuardId = guard.id || guard.guard_id;
    console.log("[ShiftDashboard] Selected Guard ID:", targetGuardId);
    if (!shift) return;
    const invoiceId = shift.invoice_id;
    if (!invoiceId) {
      toast.error("Invoice ID not found for this shift.");
      return;
    }
    setIsAssigningGuard(targetGuardId);
    const res = await assignGuardToShiftAction({
      invoice_id: invoiceId,
      guard_id: targetGuardId,
      shift_id: shiftId,
    });
    if (res.success) {
      toast.success("Guard assigned successfully");
      setIsSelectGuardOpen(false);
      loadShiftDetails();
    } else {
      toast.error(res.error || "Failed to assign guard");
    }
    setIsAssigningGuard(null);
  };

  const handleCommentSubmit = async (text: string, type: "internal" | "external", file: File | null) => {
    try {
      let attachFileUrl = null;
      if (file) {
        const fileExt = file.name.split(".").pop();
        const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
        const uniqueId = Math.floor(1000 + Math.random() * 9000);
        const uniqueFileName = `${fileNameWithoutExt}_${uniqueId}.${fileExt}`;

        const res = await generateUploadUrlAction(uniqueFileName, "comment", shiftId || undefined);
        if (!res.success || !res.data) {
          throw new Error(res.error || "Failed to generate upload URL");
        }
        const { signed_url, file_path } = res.data;

        const uploadRes = await fetch(signed_url, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type,
          },
        });
        if (!uploadRes.ok) {
          throw new Error("Failed to upload attachment");
        }
        attachFileUrl = file_path;
      }

      const res = await addCommentAction({
        shift_id: shiftId,
        type,
        user_message: text.trim() || null,
        attach_file_url: attachFileUrl,
      });

      if (res.success) {
        toast.success("Comment added successfully");
        loadComments();
        return true;
      } else {
        toast.error(res.error || "Failed to add comment");
        return false;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to submit comment";
      toast.error(message);
      return false;
    }
  };

  const handleAssignGuard = () => {
    if (!shift) return;
    const paymentStatus = shift.payment_status?.toLowerCase();
    if (paymentStatus === "pending" || paymentStatus === "unpaid") {
      toast.error("The payment status should be Paid or Net term client to assign the shift to Guard.", {
        duration: 5000,
      });
      return;
    }
    setIsSelectGuardOpen(true);
  };

  const showSettingBtn = shift
    ? ["shift_created", "shift_planned", "shift_accepted", "shift_refused", "shift_arrival", "shift_pre_check_in"].includes(
        shift.status?.toLowerCase()
      )
    : false;

  const isAddressEditable = shift
    ? ["shift_created", "shift_planned", "shift_accepted", "shift_refused"].includes(shift.status?.toLowerCase())
    : false;

  const settingsFormState = {
    create_checkpoint_interval:
      shift?.checkpoint_create_interval !== undefined && shift?.checkpoint_create_interval !== null
        ? String(shift.checkpoint_create_interval)
        : "0",
    guard_break_max_duration:
      shift?.break_max_time !== undefined && shift?.break_max_time !== null
        ? String(shift.break_max_time)
        : "",
    guard_break_limit:
      shift?.total_break_limit !== undefined && shift?.total_break_limit !== null
        ? String(shift.total_break_limit)
        : "",
    geofence_radius:
      shift?.geofence_radius !== undefined && shift?.geofence_radius !== null
        ? String(shift.geofence_radius)
        : "150",
  };

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Breadcrumbs & Header Actions */}
      <ShiftHeader
        shift={shift}
        shiftId={shiftId}
        notificationId={notificationId}
        isSettingsOpen={isSettingsOpen}
        setIsSettingsOpen={setIsSettingsOpen}
        isStartingShift={isStartingShift}
        onManualStart={handleManualStartShift}
        onAssignGuard={handleAssignGuard}
        onCancelService={() => setIsCancelServiceOpen(true)}
        showSettingBtn={showSettingBtn}
      />

      {isSettingsOpen ? (
        <ShiftSettingsCard
          isOpen={isSettingsOpen}
          initialSettings={settingsFormState}
          onSave={handleSaveSettings}
          onClose={() => setIsSettingsOpen(false)}
          isSaving={isSavingSettings}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Shift Details & Map columns */}
          <div className="lg:col-span-7 space-y-6">
            <ShiftDetailsCard
              shift={shift}
              isLoading={isLoading}
              error={error}
              isSavingDetails={isSavingDetails}
              onSaveDetails={handleSaveDetails}
              isAddressEditable={isAddressEditable}
              setIsEditLocationOpen={setIsEditLocationOpen}
            />

            {!isLoading && shift && (
              <>
                <ShiftProgressStepper shift={shift} />
                <ShiftMapCard shift={shift} trackingPath={trackingPath} mapCenter={mapCenter} />
              </>
            )}
          </div>

          {/* Sidebar Tab Panels */}
          <div className="lg:col-span-5 space-y-6">
            <ShiftTabsModule
              comments={comments}
              isCommentsLoading={isCommentsLoading}
              commentsError={commentsError}
              onCommentSubmit={handleCommentSubmit}
              reports={reports}
              isReportsLoading={isReportsLoading}
              reportsError={reportsError}
              onTabChange={(tabId) => {
                if (tabId === "comment") loadComments();
              }}
              setPreviewFile={setPreviewFile}
            />
          </div>
        </div>
      )}

      {/* File Preview Dialog Overlay */}
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
                  <video src={previewFile.url} controls className="w-full h-full object-contain" />
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
                    <button
                      onClick={() => triggerFileDownload(previewFile.url, previewFile.title)}
                      className="bg-[#0064cb] hover:bg-[#0052ae] text-white rounded-xl px-4 py-2 flex items-center gap-2 text-sm font-bold shadow-md shadow-blue-200/50 border-none cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      Download File
                    </button>
                  </div>
                </div>
              )
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Location Dialog */}
      <EditShiftLocationDialog
        isOpen={isEditLocationOpen}
        onClose={() => setIsEditLocationOpen(false)}
        initialLocation={{
          street: shift?.shipping_location?.location?.street || "",
          city: shift?.shipping_location?.location?.city || "",
          state: shift?.shipping_location?.location?.state || "",
          zip: shift?.shipping_location?.location?.zip || "",
          country: shift?.shipping_location?.location?.country || "",
        }}
        onSave={handleSaveLocation}
        isSaving={isSavingLocation}
      />

      {/* Cancel Service Dialog */}
      <CancelServiceDialog
        isOpen={isCancelServiceOpen}
        onClose={() => setIsCancelServiceOpen(false)}
        onConfirm={handleCancelServiceConfirm}
        isSaving={isCancellingService}
      />

      {/* Select Guard Dialog */}
      <SelectUserDialog
        isOpen={isSelectGuardOpen}
        onClose={() => setIsSelectGuardOpen(false)}
        onSelect={handleSelectGuard}
        assigningGuardId={isAssigningGuard}
      />
    </div>
  );
}
