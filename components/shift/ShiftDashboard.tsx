"use client";

import {
  clientFetchShiftDetailsAction,
  clientFetchCommentsAction,
  clientFetchGuardTrackingAction
} from "@/lib/client-actions";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  addCommentAction,
  updateShiftDetailsAction,
  cancelShiftServiceAction,
  manualStartShiftAction,
  assignLeadGuardAction,
  assignStandbyGuardAction,
  reassignLeadGuardAction,
  reassignStandbyGuardAction,
  verifyGuardAssignmentAction,
  sendShiftReportAction,
  approveShiftAction,
  notApproveShiftAction,
} from "@/actions/dashboard.actions";
import { generateUploadUrlAction } from "@/actions/profile.actions";
import { fetchShiftReportsAction } from "@/actions/notification.actions";
import { CancelServiceDialog } from "@/app/(main)/invoices/[id]/_components/CancelServiceDialog";
import { VerifyWarningDialog } from "@/app/(main)/invoices/[id]/_components/VerifyWarningDialog";
import { ActionErrorDialog } from "@/app/(main)/invoices/[id]/_components/ActionErrorDialog";
import { ShiftHeader } from "./ShiftHeader";
import { ShiftDetailsCard } from "./ShiftDetailsCard";
import { ShiftExpensesCard } from "./ShiftExpensesCard";
import { ShiftProgressStepper } from "./ShiftProgressStepper";
import { ShiftMapCard } from "./ShiftMapCard";
import { ShiftSettingsCard } from "./ShiftSettingsCard";
import { ShiftTabsModule } from "./ShiftTabsModule";
import { NewAssignGuardPanel } from "./NewAssignGuardPanel";
import { StandbyGuardsPanel } from "./StandbyGuardsPanel";
import { EditShiftLocationDialog } from "./dialogs/EditShiftLocationDialog";
import { ManualStartShiftDialog } from "./dialogs/ManualStartShiftDialog";
import { FilePreviewDialog } from "./dialogs/FilePreviewDialog";
import { SendReportCard } from "./SendReportCard";
import { ApproveShiftCard } from "./ApproveShiftCard";
import { NotApproveShiftCard } from "./NotApproveShiftCard";
import { Shift, ShiftReports, PreviewFile, Address } from "./types";
import { useVideoCall } from "@/context/VideoCallContext";

interface ShiftDashboardProps {
  shiftId: string;
  notificationId?: string | null;
}

export function ShiftDashboard({ shiftId, notificationId }: ShiftDashboardProps) {
  const router = useRouter();
  const { startCall } = useVideoCall();
  const [shift, setShift] = useState<Shift | null>(null);
  const [reports, setReports] = useState<ShiftReports | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReportsLoading, setIsReportsLoading] = useState(false);
  const [isCommentsLoading, setIsCommentsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportsError, setReportsError] = useState<string | null>(null);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [trackingPath, setTrackingPath] = useState<[number, number][]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number] | undefined>(undefined);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNewAssignOpen, setIsNewAssignOpen] = useState(false);
  const [isStandbyGuardsOpen, setIsStandbyGuardsOpen] = useState(false);
  const [isReassign, setIsReassign] = useState(false);
  const [assignRole, setAssignRole] = useState<"lead_guard" | "standby_guard">("lead_guard");
  const [isEditLocationOpen, setIsEditLocationOpen] = useState(false);
  const [isCancelServiceOpen, setIsCancelServiceOpen] = useState(false);
  const [isManualStartOpen, setIsManualStartOpen] = useState(false);
  const [isSendReportOpen, setIsSendReportOpen] = useState(false);
  const [isApproveShiftOpen, setIsApproveShiftOpen] = useState(false);
  const [isNotApproveShiftOpen, setIsNotApproveShiftOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<PreviewFile | null>(null);
  const [isStartingShift, setIsStartingShift] = useState(false);
  const [isSendingReport, setIsSendingReport] = useState(false);
  const [isApprovingShift, setIsApprovingShift] = useState(false);
  const [isNotApprovingShift, setIsNotApprovingShift] = useState(false);
  const [isCancellingService, setIsCancellingService] = useState(false);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isAssigningGuard, setIsAssigningGuard] = useState<string | null>(null);
  const [verifyWarning, setVerifyWarning] = useState<{
    isOpen: boolean;
    warnings: string[];
    pendingArgs?: {
      guard: any;
      rates: { per_hour_rate?: number; per_shift_rate?: number; travel_fee?: number; qc_flat_rate?: number };
    };
  }>({ isOpen: false, warnings: [] });
  const [actionError, setActionError] = useState<{ isOpen: boolean, message: string }>({ isOpen: false, message: "" });

  const loadShiftDetails = useCallback(async () => {
    if (!shiftId) return;
    setIsLoading(true);
    const res = await clientFetchShiftDetailsAction(shiftId, notificationId || undefined);
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
    const res = await clientFetchCommentsAction(shiftId);
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
    loadComments();
  }, [loadShiftDetails, loadReportsDetails, loadComments]);

  useEffect(() => {
    const handleCallEnded = (e: any) => {
      if (e.detail?.shiftId === shiftId) {
        console.log("[ShiftDashboard] Call ended, refreshing shift details...");
        loadShiftDetails();
      }
    };

    window.addEventListener("videoCallEnded", handleCallEnded);
    return () => window.removeEventListener("videoCallEnded", handleCallEnded);
  }, [shiftId, loadShiftDetails]);

  useEffect(() => {
    if (shift && shift.shift_id) {
      const guardId = shift.lead_guard?.guard_id ||
        (shift.assigned_guard
          ? (typeof shift.assigned_guard === "object"
            ? shift.assigned_guard.id || shift.assigned_guard.guard_id
            : shift.assigned_guard)
          : null);

      if (guardId) {
        clientFetchGuardTrackingAction(guardId, shift.shift_id).then((res) => {
          if (res.success && res.data && res.data.path) {
            const mappedPath = res.data.path.map((p: any) => [p.latitude, p.longitude]);
            setTrackingPath(mappedPath);
          }
        });

        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://clanking-bagginess-flammable.ngrok-free.dev";
        const cleanBase = baseUrl.replace(/\/+$/, "");
        const wsProtocol = cleanBase.startsWith("https") ? "wss" : "ws";
        const wsHost = cleanBase.replace(/^https?:\/\//, "").split("/")[0];
        const wsUrl = `${wsProtocol}://${wsHost}/api/v1/tracking/ws/admin/shift/${shift.shift_id}`;

        console.log("[WebSocket] Connecting to:", wsUrl);
        let ws: WebSocket;
        try {
          ws = new WebSocket(wsUrl);
        } catch (err) {
          console.error("[WebSocket] Security or initialization error (likely Mixed Content blocked by browser):", err);
          return;
        }

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

  const handleSaveDetails = async (payload: any) => {
    setIsSavingDetails(true);
    const detailsPayload = { ...payload, shift_id: shiftId };
    console.log("[ShiftDashboard] handleSaveDetails - Payload:", detailsPayload);
    const res = await updateShiftDetailsAction(detailsPayload);
    if (res.success) {
      toast.success("Details updated successfully");
      await loadShiftDetails();
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
    checkpoint_create_interval: string;
    guard_break_max_duration: string;
    guard_break_limit: string;
    geofence_radius: string;
  }) => {
    setIsSavingSettings(true);

    const initialCheckpointCreateInterval =
      shift?.checkpoint_create_interval !== undefined &&
        shift?.checkpoint_create_interval !== null &&
        [15, 30, 60].includes(Number(shift.checkpoint_create_interval))
        ? String(shift.checkpoint_create_interval)
        : "0";
    const initialGuardBreakMaxDuration =
      shift?.break_max_time !== undefined && shift?.break_max_time !== null
        ? String(shift.break_max_time)
        : "";
    const initialGuardBreakLimit =
      shift?.total_break_limit !== undefined && shift?.total_break_limit !== null
        ? String(shift.total_break_limit)
        : "";
    const initialGeofenceRadius =
      shift?.geofence_radius !== undefined && shift?.geofence_radius !== null
        ? String(shift.geofence_radius)
        : "150";

    const payload: any = {
      shift_id: shiftId,
      shift_description: shift?.shift_description || "",
    };

    let dirty = false;

    if (settings.checkpoint_create_interval !== initialCheckpointCreateInterval) {
      const val = settings.checkpoint_create_interval === "" ? 0 : Number(settings.checkpoint_create_interval);
      payload.checkpoint_create_interval = val;
      dirty = true;
    }
    if (settings.guard_break_max_duration !== initialGuardBreakMaxDuration) {
      const val = settings.guard_break_max_duration === "" ? 0 : Number(settings.guard_break_max_duration);
      payload.guard_break_max_duration = val;
      payload.break_max_time = val;
      dirty = true;
    }
    if (settings.guard_break_limit !== initialGuardBreakLimit) {
      const val = settings.guard_break_limit === "" ? 0 : Number(settings.guard_break_limit);
      payload.guard_break_limit = val;
      payload.total_break_limit = val;
      dirty = true;
    }
    if (settings.geofence_radius !== initialGeofenceRadius) {
      payload.geofence_radius =
        settings.geofence_radius === "" ? 150 : Number(settings.geofence_radius);
      dirty = true;
    }

    if (!dirty) {
      toast.info("No settings were changed");
      setIsSettingsOpen(false);
      setIsSavingSettings(false);
      return;
    }

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

  const handleManualStartShiftConfirm = async (reason: string) => {
    setIsStartingShift(true);
    try {
      const res = await manualStartShiftAction({
        shift_id: shiftId,
        reason,
      });
      if (res.success) {
        toast.success("Shift manually started successfully");
        setIsManualStartOpen(false);
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

  const handleCommentSubmit = async (text: string, type: "internal" | "external", file: File | null, recipient?: string) => {
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

      let guard_role = undefined;
      if (recipient === "lead") guard_role = "lead_guard";
      else if (recipient === "standby") guard_role = "standby_guard";
      else if (recipient === "both") guard_role = "both";

      const res = await addCommentAction({
        shift_id: shiftId,
        type,
        user_message: text.trim() || null,
        attach_file_url: attachFileUrl,
        guard_role,
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
    if (!paymentStatus || paymentStatus === "pending" || paymentStatus === "unpaid") {
      toast.error("The payment status should be Paid or Net term client to assign the shift to Guard.", {
        duration: 5000,
      });
      return;
    }
    setIsNewAssignOpen(true);
    setIsReassign(true);
    setIsSettingsOpen(false);
    setIsStandbyGuardsOpen(false);
  };

  const handleNewAssignGuard = () => {
    if (!shift) return;
    const paymentStatus = shift.payment_status?.toLowerCase();
    if (!paymentStatus || paymentStatus === "pending" || paymentStatus === "unpaid") {
      toast.error("The payment status should be Paid or Net term client to assign the shift to Guard.", {
        duration: 5000,
      });
      return;
    }
    setIsNewAssignOpen(true);
    setIsReassign(false);
    setIsSettingsOpen(false);
    setIsStandbyGuardsOpen(false);
  };

  const handleAssignLeadGuard = () => {
    if (!shift) return;
    const paymentStatus = shift.payment_status?.toLowerCase();
    if (!paymentStatus || paymentStatus === "pending" || paymentStatus === "unpaid") {
      toast.error("The payment status should be Paid or Net term client to assign the shift to Guard.", { duration: 5000 });
      return;
    }
    setAssignRole("lead_guard");
    setIsReassign(false);
    setIsNewAssignOpen(true);
    setIsSettingsOpen(false);
    setIsStandbyGuardsOpen(false);
  };

  const handleAssignStandbyGuard = () => {
    if (!shift) return;
    const paymentStatus = shift.payment_status?.toLowerCase();
    if (!paymentStatus || paymentStatus === "pending" || paymentStatus === "unpaid") {
      toast.error("The payment status should be Paid or Net term client to assign the shift to Guard.", { duration: 5000 });
      return;
    }
    setAssignRole("standby_guard");
    setIsReassign(false);
    setIsNewAssignOpen(true);
    setIsSettingsOpen(false);
    setIsStandbyGuardsOpen(false);
  };

  const handleReassignLeadGuard = () => {
    if (!shift) return;
    const paymentStatus = shift.payment_status?.toLowerCase();
    if (!paymentStatus || paymentStatus === "pending" || paymentStatus === "unpaid") {
      toast.error("The payment status should be Paid or Net term client to assign the shift to Guard.", { duration: 5000 });
      return;
    }
    setAssignRole("lead_guard");
    setIsReassign(true);
    setIsNewAssignOpen(true);
    setIsSettingsOpen(false);
    setIsStandbyGuardsOpen(false);
  };

  const handleReassignStandbyGuard = () => {
    if (!shift) return;
    const paymentStatus = shift.payment_status?.toLowerCase();
    if (!paymentStatus || paymentStatus === "pending" || paymentStatus === "unpaid") {
      toast.error("The payment status should be Paid or Net term client to assign the shift to Guard.", { duration: 5000 });
      return;
    }
    setAssignRole("standby_guard");
    setIsReassign(true);
    setIsNewAssignOpen(true);
    setIsSettingsOpen(false);
    setIsStandbyGuardsOpen(false);
  };

  const handleNewAssignSelect = async (guard: any, rates: { per_hour_rate?: number; per_shift_rate?: number; travel_fee?: number; qc_flat_rate?: number }) => {
    const targetGuardId = guard.id || guard.guard_id;
    if (!shift) return;
    const invoiceId = shift.invoice_id;
    if (!invoiceId) {
      toast.error("Invoice ID not found for this shift.");
      return;
    }
    setIsAssigningGuard(targetGuardId);

    const verifyPayload = {
      invoice_id: invoiceId,
      assignments: [
        {
          guard_id: targetGuardId,
          shift_ids: [shiftId]
        }
      ]
    };

    const verifyRes = await verifyGuardAssignmentAction(verifyPayload);
    if (!verifyRes.success) {
      setIsAssigningGuard(null);
      let warnings: string[] = [];
      if (Array.isArray(verifyRes.data)) {
        warnings = verifyRes.data.map(String);
      } else if (verifyRes.error) {
        warnings = [verifyRes.error];
      } else {
        warnings = ["There are scheduling conflicts for the selected guards."];
      }

      setVerifyWarning({
        isOpen: true,
        warnings,
        pendingArgs: { guard, rates }
      });
      return;
    }

    await executeAssignment(guard, rates);
  };

  const executeAssignment = async (guard: any, rates: { per_hour_rate?: number; per_shift_rate?: number; travel_fee?: number; qc_flat_rate?: number }) => {
    const targetGuardId = guard.id || guard.guard_id;
    if (!shift || !shift.invoice_id) return;
    const invoiceId = shift.invoice_id;
    setIsAssigningGuard(targetGuardId);

    if (isReassign) {
      const payload = { shift_id: shiftId, guard_id: targetGuardId };
      const res = assignRole === "standby_guard"
        ? await reassignStandbyGuardAction(payload)
        : await reassignLeadGuardAction(payload);

      if (res.success) {
        toast.success(res.message || "Shift reassigned successfully");
        setIsNewAssignOpen(false);
        loadShiftDetails();
      } else {
        setActionError({ isOpen: true, message: res.error || "Failed to reassign guard" });
      }
    } else {
      const actionPayload: any = {
        invoice_id: invoiceId,
        guard_id: targetGuardId,
        shift_id: shiftId,
      };
      if (rates.per_hour_rate && rates.per_hour_rate > 0) actionPayload.per_hour_rate = rates.per_hour_rate;
      if (rates.travel_fee && rates.travel_fee > 0) actionPayload.travel_fee = rates.travel_fee;
      if (rates.qc_flat_rate && rates.qc_flat_rate > 0) actionPayload.qc_flat_rate = rates.qc_flat_rate;

      const res = assignRole === "standby_guard"
        ? await assignStandbyGuardAction(actionPayload)
        : await assignLeadGuardAction(actionPayload);

      if (res.success) {
        toast.success(res.message || "Guard assigned successfully");
        setIsNewAssignOpen(false);
        loadShiftDetails();
      } else {
        setActionError({ isOpen: true, message: res.error || "Failed to assign guard" });
      }
    }
    setIsAssigningGuard(null);
  };

  const showSettingBtn = shift
    ? ["shift_created", "shift_planned", "shift_accepted", "shift_refused", "shift_abandon", "shift_arrival", "shift_pre_check_in"].includes(
      shift.status?.toLowerCase()
    )
    : false;

  const isAddressEditable = shift?.action
    ? !!shift.action.is_location_edit
    : (shift
      ? ["shift_created", "shift_planned", "shift_accepted", "shift_refused", "shift_abandon"].includes(shift.status?.toLowerCase())
      : false);

  const settingsFormState = {
    checkpoint_create_interval:
      shift?.checkpoint_create_interval !== undefined &&
        shift?.checkpoint_create_interval !== null &&
        [15, 30, 60].includes(Number(shift.checkpoint_create_interval))
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
      <ShiftHeader
        shift={shift}
        shiftId={shiftId}
        notificationId={notificationId}
        isSettingsOpen={isSettingsOpen}
        setIsSettingsOpen={(open) => { setIsSettingsOpen(open); if (open) { setIsNewAssignOpen(false); setIsStandbyGuardsOpen(false); setIsSendReportOpen(false); setIsApproveShiftOpen(false); setIsNotApproveShiftOpen(false); } }}
        isNewAssignOpen={isNewAssignOpen}
        isStandbyGuardsOpen={isStandbyGuardsOpen}
        isSendReportOpen={isSendReportOpen}
        isApproveShiftOpen={isApproveShiftOpen}
        isNotApproveShiftOpen={isNotApproveShiftOpen}
        isReassign={isReassign}
        onCloseNewAssign={() => setIsNewAssignOpen(false)}
        onCloseStandbyGuards={() => setIsStandbyGuardsOpen(false)}
        onCloseSendReport={() => setIsSendReportOpen(false)}
        onCloseApproveShift={() => setIsApproveShiftOpen(false)}
        onCloseNotApproveShift={() => setIsNotApproveShiftOpen(false)}
        isStartingShift={isStartingShift}
        onManualStart={() => setIsManualStartOpen(true)}
        onAssignGuard={handleAssignGuard}
        onNewAssignGuard={handleNewAssignGuard}
        onAssignLeadGuard={handleAssignLeadGuard}
        onAssignStandbyGuard={handleAssignStandbyGuard}
        onReassignLeadGuard={handleReassignLeadGuard}
        onReassignStandbyGuard={handleReassignStandbyGuard}
        onFindStandbyGuard={() => { setIsStandbyGuardsOpen(true); setIsNewAssignOpen(false); setIsSettingsOpen(false); }}
        onCancelService={() => setIsCancelServiceOpen(true)}
        showSettingBtn={showSettingBtn}
        onStartVideoCall={() => {
          const guardData = shift?.lead_guard || (typeof shift?.assigned_guard === 'object' ? shift?.assigned_guard : null);
          const guardId = guardData?.guard_id || (guardData as any)?.id || (typeof shift?.assigned_guard === 'string' ? shift?.assigned_guard : null);
          console.log("Whole lead_guard / guardData object:", guardData);

          if (!guardId) {
            toast.error("No guard assigned to this shift yet.");
            return;
          }
          const shiftZegoConfig = guardData?.zego_cloud;
          const formattedGuardId = (guardId as string).replace(/-/g, "");
          console.log("Starting Video Call with guardId:", formattedGuardId, "and zegoConfig:", shiftZegoConfig);
          startCall(formattedGuardId, shiftId, 1, shiftZegoConfig);
        }}
        onJoinVideoCall={async () => {
          toast.info("Incoming/Outgoing calls are now managed automatically.");
        }}
        onSendReport={() => setIsSendReportOpen(true)}
        onApproveShift={() => setIsApproveShiftOpen(true)}
        onNotApproveShift={() => setIsNotApproveShiftOpen(true)}
        isLoading={isLoading}
      />

      {isNewAssignOpen ? (
        <NewAssignGuardPanel
          onSelect={handleNewAssignSelect}
          onClose={() => setIsNewAssignOpen(false)}
          assigningGuardId={isAssigningGuard}
          isReassign={isReassign}
          assignRole={assignRole}
          initialRates={{
            per_hour_rate: shift?.per_hour_rate ?? undefined,
            per_shift_rate: shift?.per_shift_rate ?? undefined,
            travel_fee: shift?.travel_fee ?? undefined,
            qc_flat_rate: shift?.qc_flat_rate ?? undefined,
          }}
        />
      ) : isSettingsOpen ? (
        <ShiftSettingsCard
          isOpen={isSettingsOpen}
          initialSettings={settingsFormState}
          onSave={handleSaveSettings}
          onClose={() => setIsSettingsOpen(false)}
          isSaving={isSavingSettings}
        />
      ) : isSendReportOpen ? (
        <SendReportCard
          isOpen={isSendReportOpen}
          onClose={() => setIsSendReportOpen(false)}
          shift={shift}
          isSending={isSendingReport}
          onSend={async () => {
            if (!shift) return;
            setIsSendingReport(true);
            try {
              const res = await sendShiftReportAction(shift.shift_id);
              if (res.success) {
                toast.success(res.message || "Report email successfully sent");

                // Refresh shift details to get updated `is_report_send` status
                await loadShiftDetails();
              } else {
                toast.error(res.error || "Failed to send report.");
              }
            } catch (error: any) {
              toast.error(error?.message || "Failed to send report.");
            } finally {
              setIsSendingReport(false);
              setIsSendReportOpen(false);
            }
          }}
        />
      ) : isApproveShiftOpen ? (
        <ApproveShiftCard
          isOpen={isApproveShiftOpen}
          onClose={() => setIsApproveShiftOpen(false)}
          shift={shift}
          isApproving={isApprovingShift}
          onApprove={async (rating, comment) => {
            if (!shift) return;
            setIsApprovingShift(true);
            try {
              const res = await approveShiftAction({
                shift_id: shift.shift_id,
                guard_rating: rating,
                guard_performance_comment: comment,
              });
              if (res.success) {
                toast.success(res.message || "Shift approved successfully.");
                setIsApproveShiftOpen(false);
                await Promise.all([
                  loadShiftDetails(),
                  loadReportsDetails(),
                  loadComments()
                ]);
              } else {
                toast.error(res.error || "Failed to approve shift.");
              }
            } catch (error: any) {
              toast.error(error?.message || "Failed to approve shift.");
            } finally {
              setIsApprovingShift(false);
            }
          }}
        />
      ) : isNotApproveShiftOpen ? (
        <NotApproveShiftCard
          isOpen={isNotApproveShiftOpen}
          onClose={() => setIsNotApproveShiftOpen(false)}
          shift={shift}
          isNotApproving={isNotApprovingShift}
          onNotApprove={async (comment) => {
            if (!shift) return;
            setIsNotApprovingShift(true);
            try {
              const res = await notApproveShiftAction({
                shift_id: shift.shift_id,
                comment: comment,
              });
              if (res.success) {
                toast.success(res.message || "Shift not approved.");
                setIsNotApproveShiftOpen(false);
                await Promise.all([
                  loadShiftDetails(),
                  loadReportsDetails(),
                  loadComments()
                ]);
              } else {
                toast.error(res.error || "Failed to submit not approved status.");
              }
            } catch (error: any) {
              toast.error(error?.message || "Failed to submit not approved status.");
            } finally {
              setIsNotApprovingShift(false);
            }
          }}
        />
      ) : isStandbyGuardsOpen ? (
        <StandbyGuardsPanel shift={shift} onClose={() => setIsStandbyGuardsOpen(false)} />
      ) : !isLoading && !shift ? (
        <div className="max-w-2xl mx-auto w-full">
          <ShiftDetailsCard
            shift={shift}
            isLoading={isLoading}
            error={error}
            isSavingDetails={isSavingDetails}
            onSaveDetails={handleSaveDetails}
            isAddressEditable={isAddressEditable}
            setIsEditLocationOpen={setIsEditLocationOpen}
          />
          <ShiftExpensesCard
            shift={shift}
            isSavingDetails={isSavingDetails}
            onSaveDetails={handleSaveDetails}
          />
        </div>
      ) : (
        <>
          <div className="hidden lg:grid grid-cols-12 gap-6">
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
              <ShiftExpensesCard
                shift={shift}
                isLoading={isLoading}
                isSavingDetails={isSavingDetails}
                onSaveDetails={handleSaveDetails}
              />

              {!isLoading && shift && (
                <>
                  <ShiftProgressStepper shift={shift} />
                  <ShiftMapCard shift={shift} trackingPath={trackingPath} mapCenter={mapCenter} />
                </>
              )}
            </div>

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
                securityServiceId={shift?.security_service_id}
                isLoading={isLoading}
                hasLeadGuard={!!(shift?.lead_guard && Object.keys(shift.lead_guard).length > 0)}
                hasStandbyGuard={!!(shift?.standby_guard && Object.keys(shift.standby_guard).length > 0)}
                leadGuardStatus={shift?.lead_guard?.shift_status}
                standbyGuardStatus={shift?.standby_guard?.shift_status}
                timezone={shift?.shipping_location?.timezone}
              />
            </div>
          </div>

          <div className="lg:hidden flex flex-col gap-6">
            <ShiftDetailsCard
              shift={shift}
              isLoading={isLoading}
              error={error}
              isSavingDetails={isSavingDetails}
              onSaveDetails={handleSaveDetails}
              isAddressEditable={isAddressEditable}
              setIsEditLocationOpen={setIsEditLocationOpen}
            />
            <ShiftExpensesCard
              shift={shift}
              isSavingDetails={isSavingDetails}
              onSaveDetails={handleSaveDetails}
            />

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
              securityServiceId={shift?.security_service_id}
              isLoading={isLoading}
              hasLeadGuard={!!(shift?.lead_guard && Object.keys(shift.lead_guard).length > 0)}
              hasStandbyGuard={!!(shift?.standby_guard && Object.keys(shift.standby_guard).length > 0)}
              leadGuardStatus={shift?.lead_guard?.shift_status}
              standbyGuardStatus={shift?.standby_guard?.shift_status}
              timezone={shift?.shipping_location?.timezone}
            />

            {!isLoading && shift && (
              <ShiftMapCard shift={shift} trackingPath={trackingPath} mapCenter={mapCenter} />
            )}

            {!isLoading && shift && (
              <ShiftProgressStepper shift={shift} />
            )}
          </div>
        </>
      )}

      <FilePreviewDialog previewFile={previewFile} setPreviewFile={setPreviewFile} />

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

      <CancelServiceDialog
        isOpen={isCancelServiceOpen}
        onClose={() => setIsCancelServiceOpen(false)}
        onConfirm={handleCancelServiceConfirm}
        isSaving={isCancellingService}
      />

      <VerifyWarningDialog
        isOpen={verifyWarning.isOpen}
        warnings={verifyWarning.warnings}
        onClose={() => setVerifyWarning({ isOpen: false, warnings: [] })}
        onConfirm={() => {
          setVerifyWarning(prev => ({ ...prev, isOpen: false }));
          if (verifyWarning.pendingArgs) {
            executeAssignment(
              verifyWarning.pendingArgs.guard,
              verifyWarning.pendingArgs.rates
            );
          }
        }}
      />

      <ManualStartShiftDialog
        isOpen={isManualStartOpen}
        onClose={() => setIsManualStartOpen(false)}
        onConfirm={handleManualStartShiftConfirm}
        isSaving={isStartingShift}
      />

      <ActionErrorDialog
        isOpen={actionError.isOpen}
        onClose={() => setActionError({ isOpen: false, message: "" })}
        message={actionError.message}
      />
    </div>
  );
}
