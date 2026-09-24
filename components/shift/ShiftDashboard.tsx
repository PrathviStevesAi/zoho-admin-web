"use client";

import {
  clientFetchShiftDetailsAction,
  clientFetchCommentsAction,
  clientFetchGuardTrackingAction
} from "@/lib/client-actions";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

import {
  updateShiftDetailsAction,
  cancelShiftServiceAction,
  manualStartShiftAction,
  assignGuardToShiftAction,
  reassignGuardToShiftAction,
  assignLeadGuardAction,
  assignStandbyGuardAction,
  reassignLeadGuardAction,
  reassignStandbyGuardAction,
  verifyGuardAssignmentAction,
  sendShiftReportAction,
  approveShiftAction,
  notApproveShiftAction,
} from "@/actions/dashboard.actions";
import { generateUploadUrlAction, fetchProfileAction } from "@/actions/profile.actions";
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
import { CallRecordingsCard } from "./CallRecordingsCard";
import { Shift, ShiftReports, PreviewFile, Address } from "./types";
import { useVideoCall } from "@/context/VideoCallContext";

interface ShiftDashboardProps {
  shiftId: string;
  notificationId?: string | null;
}

export function ShiftDashboard({ shiftId, notificationId }: ShiftDashboardProps) {
  const router = useRouter();
  const { startCall } = useVideoCall();
  const { data: session } = useSession();
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);

  useEffect(() => {
    fetchProfileAction().then((res) => {
      if (res.success && res.data) {
        setCurrentUserProfile(res.data);
      }
    });
  }, []);

  const token = (session as any)?.accessToken;
  const commentsWsRef = useRef<WebSocket | null>(null);
  const shiftRef = useRef<Shift | null>(null);
  const lastSubmittedRecipientRef = useRef<string | null>(null);

  const [shift, setShift] = useState<Shift | null>(null);

  useEffect(() => {
    shiftRef.current = shift;
  }, [shift]);
  const [reports, setReports] = useState<ShiftReports | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentsRecipient, setCommentsRecipient] = useState<"lead" | "standby">("lead");
  const commentsRecipientRef = useRef<"lead" | "standby">("lead");

  useEffect(() => {
    commentsRecipientRef.current = commentsRecipient;
  }, [commentsRecipient]);

  const [dashboardActiveTab, setDashboardActiveTab] = useState<string>("");
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
  const [isCallRecordingsOpen, setIsCallRecordingsOpen] = useState(false);
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

  const loadComments = useCallback(async (
    silent: boolean = false,
    targetRecipient?: "lead" | "standby",
    shiftOverride?: Shift | null
  ) => {
    if (!shiftId) return;

    const currentShift = shiftOverride !== undefined ? shiftOverride : shiftRef.current;
    const hasLead = Boolean(currentShift?.lead_guard && (currentShift.lead_guard.guard_id || currentShift.lead_guard.first_name || Object.keys(currentShift.lead_guard).length > 0));
    const hasStandby = Boolean(currentShift?.standby_guard && (currentShift.standby_guard.guard_id || currentShift.standby_guard.first_name || Object.keys(currentShift.standby_guard).length > 0));

    // If neither lead guard nor standby guard is assigned, do not call the GET comments API
    if (!hasLead && !hasStandby) {
      setComments([]);
      if (!silent) setIsCommentsLoading(false);
      return;
    }

    const recipient = targetRecipient || commentsRecipientRef.current;
    const guardParam = recipient === "lead" ? "lead_guard" : "standby_guard";

    // If the selected guard role is not assigned, empty the comments without fetching
    if ((recipient === "lead" && !hasLead) || (recipient === "standby" && !hasStandby)) {
      setComments([]);
      if (!silent) setIsCommentsLoading(false);
      return;
    }

    if (!silent) setIsCommentsLoading(true);
    setCommentsError(null);
    const res = await clientFetchCommentsAction(shiftId, guardParam);
    if (res.success && res.data) {
      setComments(res.data);
    } else {
      setCommentsError(res.error || "Failed to load comments");
    }
    if (!silent) setIsCommentsLoading(false);
  }, [shiftId]);

  const loadShiftDetails = useCallback(async () => {
    if (!shiftId) return;
    setIsLoading(true);
    const res = await clientFetchShiftDetailsAction(shiftId, notificationId || undefined);
    if (res.success) {
      setShift(res.data);
      shiftRef.current = res.data;
      setError(null);
      const hasLead = Boolean(res.data?.lead_guard && (res.data.lead_guard.guard_id || res.data.lead_guard.first_name || Object.keys(res.data.lead_guard).length > 0));
      const hasStandby = Boolean(res.data?.standby_guard && (res.data.standby_guard.guard_id || res.data.standby_guard.first_name || Object.keys(res.data.standby_guard).length > 0));
      if (hasLead || hasStandby) {
        const initialRecipient = hasLead ? "lead" : "standby";
        setCommentsRecipient(initialRecipient);
        loadComments(false, initialRecipient, res.data);
      } else {
        setComments([]);
      }
    } else {
      setError(res.error || "Shift not found");
    }
    setIsLoading(false);
  }, [shiftId, notificationId, loadComments]);

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

  useEffect(() => {
    loadShiftDetails();
    loadReportsDetails();
  }, [loadShiftDetails, loadReportsDetails]);

  const handleRecipientChange = (newRecipient: "lead" | "standby") => {
    setCommentsRecipient(newRecipient);
    loadComments(false, newRecipient);
  };

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

  const trackingGuardId = shift?.lead_guard?.guard_id ||
    (shift?.assigned_guard
      ? (typeof shift.assigned_guard === "object"
        ? shift.assigned_guard.id || shift.assigned_guard.guard_id
        : shift.assigned_guard)
      : null);
  const currentTrackingShiftId = shift?.shift_id;

  useEffect(() => {
    if (currentTrackingShiftId && trackingGuardId) {
      clientFetchGuardTrackingAction(trackingGuardId, currentTrackingShiftId).then((res) => {
        if (res.success && res.data && res.data.path) {
          const mappedPath = res.data.path.map((p: any) => [p.latitude, p.longitude]);
          setTrackingPath(mappedPath);
        }
      });

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://fastguard.securityguardbank.com";
      const cleanBase = baseUrl.replace(/\/+$/, "");
      const wsProtocol = cleanBase.startsWith("https") ? "wss" : "ws";
      const wsHost = cleanBase.replace(/^https?:\/\//, "").split("/")[0];
      const wsUrl = `${wsProtocol}://${wsHost}/api/v1/tracking/ws/admin/shift/${currentTrackingShiftId}`;

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
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.close();
          }
        };
      }
  }, [currentTrackingShiftId, trackingGuardId]);

  useEffect(() => {
    console.log("[Comments WebSocket] useEffect triggered. shiftId:", shiftId, "dashboardActiveTab:", dashboardActiveTab);
    if (shiftId && token && dashboardActiveTab === "comment") {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://fastguard.securityguardbank.com";
      const cleanBase = baseUrl.replace(/\/+$/, "");
      const wsProtocol = cleanBase.startsWith("https") ? "wss" : "ws";
      const wsHost = cleanBase.replace(/^https?:\/\//, "").split("/")[0];
      const wsUrl = `${wsProtocol}://${wsHost}/api/v1/ws/comment/shift/${shiftId}/admin-guard?token=${token}`;

      console.log("[Comments WebSocket] Connecting to:", wsUrl);
      let ws: WebSocket;
      try {
        ws = new WebSocket(wsUrl);
      } catch (err) {
        console.error("[Comments WebSocket] Error initializing:", err);
        return;
      }

      ws.onopen = () => {
        console.log("[Comments WebSocket] Connection established successfully!");
      };

      ws.onmessage = (event) => {
        try {
          console.log("[Comments WebSocket] Received message:", event.data);
          const parsed = JSON.parse(event.data);

          if (parsed && typeof parsed === "object") {
            const commentData = ["new_comment", "create_comment", "comment_created"].includes(parsed.event) ? parsed.data : parsed;

            // If the received data looks like a comment object, append it directly
            if (commentData && (commentData.id || commentData.user_message || commentData.attach_file_url)) {
              const uniqueId = commentData.id || commentData.comment_id || commentData._id || `ws-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

              const currentShift = shiftRef.current;
              const userRole = (commentData.user_role || commentData.sender_role || commentData.role || "").toLowerCase();
              const isFromGuard = userRole === "guard" || Boolean(commentData.guard) || Boolean(commentData.guard_id);

              let sentTo = commentData.sent_to || commentData.send_to;
              if (!sentTo && !isFromGuard) {
                const targetRole = commentData.guard_role || commentData.recipient || lastSubmittedRecipientRef.current;
                if (targetRole === "lead_guard" || targetRole === "lead") {
                  sentTo = currentShift?.lead_guard?.first_name || "Lead Guard";
                } else if (targetRole === "standby_guard" || targetRole === "standby") {
                  sentTo = currentShift?.standby_guard?.first_name || "Standby Guard";
                } else if (targetRole === "both" || targetRole === "both_guards") {
                  sentTo = "Both Guards";
                }
              }

              // Reset last submitted recipient ref after receiving
              lastSubmittedRecipientRef.current = null;

              const normalizedComment = {
                ...commentData,
                id: uniqueId,
                ...(sentTo ? { sent_to: sentTo } : {}),
              };

              setComments((prev) => {
                // If comment with this id already exists, don't duplicate
                if (prev.some((c) => c.id === uniqueId)) return prev;

                // Match and replace any optimistic temp comment
                const tempIndex = prev.findIndex((c) => {
                  if (typeof c.id !== "string" || !c.id.startsWith("temp-")) return false;
                  const msg1 = (c.user_message || "").trim();
                  const msg2 = (normalizedComment.user_message || "").trim();
                  if (msg1 && msg2) return msg1 === msg2;
                  if (c.attach_file_url || normalizedComment.attach_file_url) return true;
                  return msg1 === msg2;
                });

                if (tempIndex !== -1) {
                  const next = [...prev];
                  if (prev[tempIndex]?.attach_file_url?.startsWith("blob:")) {
                    try {
                      URL.revokeObjectURL(prev[tempIndex].attach_file_url);
                    } catch {
                      // ignore revoke errors
                    }
                  }
                  next[tempIndex] = normalizedComment;
                  return next;
                }

                // If same message content and created_at already exists, don't duplicate
                const normMsg = (normalizedComment.user_message || "").trim();
                if (
                  normalizedComment.created_at &&
                  prev.some(
                    (c) =>
                      (c.user_message || "").trim() === normMsg &&
                      c.created_at === normalizedComment.created_at
                  )
                ) {
                  return prev;
                }
                return [...prev, normalizedComment];
              });
              return;
            }
          }
        } catch (err) {
          console.error("[Comments WebSocket] Error handling message:", err);
        }
      };

      ws.onerror = (error) => {
        console.warn("[Comments WebSocket] Connection error:", error);
      };

      ws.onclose = (event) => {
        console.log("[Comments WebSocket] Connection closed.", event.reason, event.code);
      };

      commentsWsRef.current = ws;

      return () => {
        console.log("[Comments WebSocket] Cleanup called, closing connection if open.");
        if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
          ws.close();
        }
        commentsWsRef.current = null;
      };
    } else {
      console.log("[Comments WebSocket] Not connecting. dashboardActiveTab:", dashboardActiveTab);
      if (commentsWsRef.current && commentsWsRef.current.readyState === WebSocket.OPEN) {
        console.log("[Comments WebSocket] Closing existing connection due to tab change.");
        commentsWsRef.current.close();
      }
      commentsWsRef.current = null;
    }
  }, [shiftId, token, dashboardActiveTab, loadComments]);

  useEffect(() => {
    const handlePushNotification = (e: any) => {
      if (e.detail?.shiftId === shiftId && dashboardActiveTab === "comment") {
        console.log("[Comments] Received push notification for this shift, silently reloading comments.");
        loadComments(true, commentsRecipientRef.current);
      }
    };
    window.addEventListener("fcm-notification-received", handlePushNotification);
    return () => window.removeEventListener("fcm-notification-received", handlePushNotification);
  }, [shiftId, dashboardActiveTab, loadComments]);

  useEffect(() => {
    if (shift) {
      document.title = `Shift ${shift.shift_no}`;
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
      await Promise.all([loadShiftDetails(), loadReportsDetails()]);
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
      Promise.all([loadShiftDetails(), loadReportsDetails()]);
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
      Promise.all([loadShiftDetails(), loadReportsDetails()]);
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
        Promise.all([loadShiftDetails(), loadReportsDetails()]);
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
        Promise.all([loadShiftDetails(), loadReportsDetails()]);
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
    let optimisticId: string | null = null;
    try {
      let attachFileUrl = null;
      let localBlobUrl: string | null = null;
      if (file) {
        try {
          localBlobUrl = URL.createObjectURL(file);
        } catch {
          localBlobUrl = null;
        }
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

      let guard_role: string | null = null;
      if (recipient === "lead") guard_role = "lead_guard";
      else if (recipient === "standby") guard_role = "standby_guard";

      let sentTo: string | undefined = undefined;
      if (recipient === "lead") {
        sentTo = shift?.lead_guard?.first_name || "Lead Guard";
      } else if (recipient === "standby") {
        sentTo = shift?.standby_guard?.first_name || "Standby Guard";
      }

      const adminName =
        currentUserProfile?.first_name ||
        (session as any)?.user?.first_name ||
        currentUserProfile?.name ||
        session?.user?.name ||
        "Admin";

      optimisticId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const optimisticComment = {
        id: optimisticId,
        shift_id: shiftId,
        type,
        user_message: text.trim() || null,
        attach_file_url: localBlobUrl || attachFileUrl || null,
        user_role: "admin",
        sender_role: "admin",
        send_by: adminName,
        sender_name: adminName,
        created_at: new Date().toISOString(),
        guard_role: guard_role || undefined,
        sent_to: sentTo,
        is_pending: true,
      };

      // Instantly display message in UI (optimistic update)
      setComments((prev) => [...prev, optimisticComment]);

      const payload = {
        event: "create_comment",
        data: {
          user_message: text.trim() || null,
          type,
          attach_file_url: attachFileUrl || null,
          guard_role,
        }
      };

      lastSubmittedRecipientRef.current = recipient || (guard_role === "lead_guard" ? "lead" : guard_role === "standby_guard" ? "standby" : "lead");

      if (commentsWsRef.current && commentsWsRef.current.readyState === WebSocket.OPEN) {
        commentsWsRef.current.send(JSON.stringify(payload));
        return true;
      } else {
        if (optimisticId) {
          setComments((prev) => prev.filter((c) => c.id !== optimisticId));
        }
        toast.error("WebSocket is not connected. Unable to send comment in real-time.");
        return false;
      }
    } catch (err: unknown) {
      if (optimisticId) {
        setComments((prev) => prev.filter((c) => c.id !== optimisticId));
      }
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
        Promise.all([loadShiftDetails(), loadReportsDetails()]);
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
        Promise.all([loadShiftDetails(), loadReportsDetails()]);
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
        setIsSettingsOpen={(open) => { setIsSettingsOpen(open); if (open) { setIsNewAssignOpen(false); setIsStandbyGuardsOpen(false); setIsSendReportOpen(false); setIsApproveShiftOpen(false); setIsNotApproveShiftOpen(false); setIsCallRecordingsOpen(false); } }}
        isNewAssignOpen={isNewAssignOpen}
        isStandbyGuardsOpen={isStandbyGuardsOpen}
        isSendReportOpen={isSendReportOpen}
        isApproveShiftOpen={isApproveShiftOpen}
        isNotApproveShiftOpen={isNotApproveShiftOpen}
        isCallRecordingsOpen={isCallRecordingsOpen}
        isReassign={isReassign}
        onCloseNewAssign={() => setIsNewAssignOpen(false)}
        onCloseStandbyGuards={() => setIsStandbyGuardsOpen(false)}
        onCloseSendReport={() => setIsSendReportOpen(false)}
        onCloseApproveShift={() => setIsApproveShiftOpen(false)}
        onCloseNotApproveShift={() => setIsNotApproveShiftOpen(false)}
        onCloseCallRecordings={() => setIsCallRecordingsOpen(false)}
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
        onCallRecording={() => { setIsCallRecordingsOpen(!isCallRecordingsOpen); setIsNewAssignOpen(false); setIsSettingsOpen(false); setIsSendReportOpen(false); }}
        showSettingBtn={showSettingBtn}
        onStartVideoCall={() => {
          const guardId = shift?.lead_guard?.guard_id ||
            (typeof shift?.assigned_guard === 'object'
              ? shift?.assigned_guard?.id || shift?.assigned_guard?.guard_id
              : shift?.assigned_guard);

          if (!guardId) {
            toast.error("No guard assigned to this shift yet.");
            return;
          }
          startCall(guardId as string, shiftId);
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
                await Promise.all([loadShiftDetails(), loadReportsDetails()]);
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
      ) : isCallRecordingsOpen ? (
        <CallRecordingsCard
          isOpen={isCallRecordingsOpen}
          onClose={() => setIsCallRecordingsOpen(false)}
          shift={shift}
        />
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
                  setDashboardActiveTab(tabId);
                  if (tabId === "comment") loadComments(false, commentsRecipientRef.current);
                }}
                setPreviewFile={setPreviewFile}
                securityServiceId={shift?.security_service_id}
                isLoading={isLoading}
                hasLeadGuard={!!(shift?.lead_guard && Object.keys(shift.lead_guard).length > 0)}
                hasStandbyGuard={!!(shift?.standby_guard && Object.keys(shift.standby_guard).length > 0)}
                leadGuardStatus={shift?.lead_guard?.shift_status}
                standbyGuardStatus={shift?.standby_guard?.shift_status}
                leadGuardName={shift?.lead_guard?.first_name}
                standbyGuardName={shift?.standby_guard?.first_name}
                activeRecipient={commentsRecipient}
                onRecipientChange={handleRecipientChange}
                timezone={shift?.shipping_location?.timezone}
                shiftExtensionRequests={shift?.shift_extension_requests || []}
                shiftId={shiftId}
                onRefresh={loadShiftDetails}
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
                setDashboardActiveTab(tabId);
                if (tabId === "comment") loadComments(false, commentsRecipientRef.current);
              }}
              setPreviewFile={setPreviewFile}
              securityServiceId={shift?.security_service_id}
              isLoading={isLoading}
              hasLeadGuard={!!(shift?.lead_guard && Object.keys(shift.lead_guard).length > 0)}
              hasStandbyGuard={!!(shift?.standby_guard && Object.keys(shift.standby_guard).length > 0)}
              leadGuardStatus={shift?.lead_guard?.shift_status}
              standbyGuardStatus={shift?.standby_guard?.shift_status}
              leadGuardName={shift?.lead_guard?.first_name}
              standbyGuardName={shift?.standby_guard?.first_name}
              activeRecipient={commentsRecipient}
              onRecipientChange={handleRecipientChange}
              timezone={shift?.shipping_location?.timezone}
              shiftExtensionRequests={shift?.shift_extension_requests || []}
              shiftId={shiftId}
              onRefresh={loadShiftDetails}
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
        onConfirm={(reason) => handleCancelServiceConfirm(reason)}
        isSaving={isCancellingService}
        note="Note: Once shift is cancelled, no longer accessible."
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
