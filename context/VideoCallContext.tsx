"use client";

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  PhoneOff,
  MonitorUp,
  MonitorX,
  Maximize2,
  Minimize2,
  UserCheck,
  Signal,
  ShieldCheck,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";
import {
  startVideoCallAction,
  endVideoCallAction,
  getShiftGuardIdAction,
  ActiveVideoCallData,
} from "@/actions/vc.actions";

interface VideoCallContextType {
  startCall: (
    guardId: string,
    shiftId: string,
    shiftNo?: string | number
  ) => Promise<void>;
  endCall: () => void;
  forceEndCall: (shiftId: string) => Promise<void>;
  isCalling: boolean;
  isMinimized: boolean;
  expandCall: () => void;
  minimizeCall: () => void;
  serverActiveCall: ActiveVideoCallData | null;
}

const VideoCallContext = createContext<VideoCallContextType | undefined>(undefined);

export function VideoCallProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  const [isCallOpen, setIsCallOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [remoteParticipant, setRemoteParticipant] = useState<any | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [roomName, setRoomName] = useState<string>("");
  const [activeShiftNo, setActiveShiftNo] = useState<string | number | null>(null);
  const [serverActiveCall, setServerActiveCall] = useState<ActiveVideoCallData | null>(null);

  // Video Zoom and Pan Controls
  const DEFAULT_ZOOM = 1.0;
  const MIN_ZOOM = 1.0;
  const MAX_ZOOM = 3.0;
  const ZOOM_STEP = 0.15;

  const [zoomLevel, setZoomLevel] = useState<number>(DEFAULT_ZOOM);
  const [videoFitMode, setVideoFitMode] = useState<"contain" | "cover">("contain");
  const [panPosition, setPanPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; panX: number; panY: number }>({
    mouseX: 0,
    mouseY: 0,
    panX: 0,
    panY: 0,
  });
  const videoContainerRef = useRef<HTMLDivElement | null>(null);

  const activeShiftIdRef = useRef<string | null>(null);
  const activeRoomRef = useRef<any | null>(null);
  const isCallEndingRef = useRef<boolean>(false);
  const videoWsRef = useRef<WebSocket | null>(null);
  const screenTrackRef = useRef<any | null>(null);
  const localVideoRef = useRef<HTMLDivElement | null>(null);
  const remoteVideoRef = useRef<HTMLDivElement | null>(null);
  const miniRemoteVideoRef = useRef<HTMLDivElement | null>(null);
  const audioContainerRef = useRef<HTMLDivElement | null>(null);
  const callModalRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const rawUserId = session?.user?.id || "";

  useEffect(() => {
    if (isCallOpen && !isConnecting) {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isCallOpen, isConnecting]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const cleanupTracksAndRoom = useCallback(() => {
    if (videoWsRef.current) {
      try {
        if (
          videoWsRef.current.readyState === WebSocket.OPEN ||
          videoWsRef.current.readyState === WebSocket.CONNECTING
        ) {
          videoWsRef.current.close();
        }
      } catch (e) {
        console.warn("Error closing video WebSocket:", e);
      }
      videoWsRef.current = null;
    }

    if (screenTrackRef.current) {
      try {
        screenTrackRef.current.stop();
      } catch (e) {
        console.warn("Error stopping screen track:", e);
      }
      screenTrackRef.current = null;
    }

    if (activeRoomRef.current) {
      try {
        activeRoomRef.current.localParticipant?.tracks?.forEach((publication: any) => {
          if (publication.track) {
            publication.track.stop();
            const elements = publication.track.detach();
            elements.forEach((el: HTMLElement) => el.remove());
          }
        });
        activeRoomRef.current.disconnect();
      } catch (e) {
        console.warn("Error disconnecting Twilio room:", e);
      }
      activeRoomRef.current = null;
    }

    if (localVideoRef.current) {
      localVideoRef.current.innerHTML = "";
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.innerHTML = "";
    }
    if (miniRemoteVideoRef.current) {
      miniRemoteVideoRef.current.innerHTML = "";
    }
    if (audioContainerRef.current) {
      audioContainerRef.current.innerHTML = "";
    }

    try {
      localStorage.removeItem("fg_active_call_session");
    } catch {
    }

    setRemoteParticipant(null);
    setIsScreenSharing(false);
    setIsMicMuted(false);
    setIsVideoMuted(false);
    setIsMinimized(false);
    setZoomLevel(DEFAULT_ZOOM);
    setVideoFitMode("contain");
    setPanPosition({ x: 0, y: 0 });
    setIsDragging(false);
  }, []);

  const getResolvedShiftId = useCallback(
    (explicitId?: string | null): string | null => {
      if (explicitId) return explicitId;
      if (activeShiftIdRef.current) return activeShiftIdRef.current;
      if (serverActiveCall?.shift_id) return serverActiveCall.shift_id;
      if (roomName && roomName.replace(/^shift_/, "")) return roomName.replace(/^shift_/, "");
      if (activeRoomRef.current?.name) return activeRoomRef.current.name.replace(/^shift_/, "");

      if (typeof window !== "undefined") {
        try {
          const stored =
            localStorage.getItem("fg_current_shift_id") ||
            sessionStorage.getItem("fg_current_shift_id");
          if (stored) return stored;

          const searchParams = new URLSearchParams(window.location.search);
          const urlShiftId = searchParams.get("shift_id") || searchParams.get("id");
          if (urlShiftId) return urlShiftId;
        } catch {
        }
      }
      return null;
    },
    [serverActiveCall?.shift_id, roomName]
  );

  const handleCallEnd = useCallback(
    async (
      notifyServer: boolean = true,
      customMessage?: string,
      explicitShiftId?: string | null
    ) => {
      const shiftId = getResolvedShiftId(explicitShiftId);

      if (isCallEndingRef.current && !notifyServer) {
        return;
      }
      isCallEndingRef.current = true;

      setServerActiveCall(null);
      setIsCallOpen(false);
      setIsConnecting(false);
      setIsMinimized(false);

      if (customMessage) {
        toast.info(customMessage);
      }

      cleanupTracksAndRoom();

      if (notifyServer) {
        try {
          if (typeof window !== "undefined") {
            if ("BroadcastChannel" in window) {
              const bc = new BroadcastChannel("fg_video_call_channel");
              bc.postMessage({ type: "END_CALL", shift_id: shiftId, timestamp: Date.now() });
              bc.close();
            }
            localStorage.setItem(
              "fg_video_call_event",
              JSON.stringify({ type: "END_CALL", shift_id: shiftId, timestamp: Date.now() })
            );
          }
        } catch (e) {
          console.warn("Cross-tab broadcast error:", e);
        }
      }

      if (notifyServer && shiftId) {
        console.log("[VideoCall] Calling endVideoCallAction with shiftId:", shiftId, "userId:", rawUserId);
        try {
          const res = await endVideoCallAction({
            shift_id: shiftId,
            user_id: rawUserId,
            status: "ended",
          });
          if (res.success && res.message) {
            toast.success(res.message);
          } else if (!res.success && res.error) {
            console.warn("[VideoCall] End call API response notice:", res.error);
          }
        } catch (err) {
          console.error("[VideoCall] Failed to call endVideoCallAction:", err);
        }
      }

      activeShiftIdRef.current = null;
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("fg_current_shift_id");
          sessionStorage.removeItem("fg_current_shift_id");
        } catch {
          // ignore
        }
      }

      setTimeout(() => {
        isCallEndingRef.current = false;
      }, 1500);
    },
    [cleanupTracksAndRoom, rawUserId, getResolvedShiftId]
  );

  const endCall = useCallback(async () => {
    const shiftId = getResolvedShiftId();
    console.log("[VideoCall] User explicitly clicked End Call for shift:", shiftId);
    await handleCallEnd(true, undefined, shiftId);
  }, [handleCallEnd, getResolvedShiftId]);

  const forceEndCall = useCallback(
    async (shiftId: string) => {
      isCallEndingRef.current = true;
      setServerActiveCall(null);
      setIsCallOpen(false);
      setIsConnecting(false);
      setIsMinimized(false);
      cleanupTracksAndRoom();

      try {
        if (typeof window !== "undefined") {
          if ("BroadcastChannel" in window) {
            const bc = new BroadcastChannel("fg_video_call_channel");
            bc.postMessage({ type: "END_CALL", shift_id: shiftId, timestamp: Date.now() });
            bc.close();
          }
          localStorage.setItem(
            "fg_video_call_event",
            JSON.stringify({ type: "END_CALL", shift_id: shiftId, timestamp: Date.now() })
          );
        }
      } catch {
      }

      try {
        const res = await endVideoCallAction({
          shift_id: shiftId,
          user_id: rawUserId,
          status: "ended",
        });
        if (res.success) {
          toast.success("Previous call reset successfully.");
        }
      } catch (e) {
        console.warn("forceEndCall error:", e);
      } finally {
        setTimeout(() => {
          isCallEndingRef.current = false;
        }, 1500);
      }
    },
    [cleanupTracksAndRoom, rawUserId]
  );

  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        bc = new BroadcastChannel("fg_video_call_channel");
        bc.onmessage = (event) => {
          if (event.data?.type === "END_CALL") {
            console.log("[VideoCall Context] Cross-tab END_CALL received via BroadcastChannel:", event.data);
            handleCallEnd(false, "Video call ended from another tab");
          }
        };
      }
    } catch (e) {
      console.warn("BroadcastChannel error:", e);
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "fg_video_call_event" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed?.type === "END_CALL") {
            console.log("[VideoCall Context] Cross-tab END_CALL received via StorageEvent:", parsed);
            handleCallEnd(false, "Video call ended from another tab");
          }
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      if (bc) {
        try {
          bc.close();
        } catch { }
      }
      window.removeEventListener("storage", handleStorage);
    };
  }, [handleCallEnd]);

  const pathname = usePathname();

  const isAllowedVideoActiveRoute = Boolean(
    pathname && (
      pathname === "/" ||
      pathname === "/dashboard" ||
      pathname.startsWith("/dashboard/") ||
      pathname === "/shift/view" ||
      pathname.startsWith("/shift/view/") ||
      pathname.startsWith("/shift/view")
    )
  );

  const checkActiveCall = useCallback(async () => {
    if (status !== "authenticated" || !session?.user) return;
    if (!isAllowedVideoActiveRoute) return;
    if (isCallEndingRef.current) return;
    if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
    if (isCallOpen && !isMinimized) return;

    try {
      const res = await fetch("/api/video/active", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (isCallEndingRef.current) return;

      if (data?.has_active_call && data?.data) {
        setServerActiveCall(data.data);
        if (data.data.shift_no) {
          setActiveShiftNo(data.data.shift_no);
        }
        if (data.data.shift_id) {
          activeShiftIdRef.current = data.data.shift_id;
          try {
            localStorage.setItem("fg_current_shift_id", data.data.shift_id);
            sessionStorage.setItem("fg_current_shift_id", data.data.shift_id);
          } catch {
            // ignore
          }
        }
      } else {
        setServerActiveCall((prev) => (prev ? null : prev));
      }
    } catch {
      // Silently handle active check failure
    }
  }, [isCallOpen, isMinimized, status, session?.user?.id, isAllowedVideoActiveRoute]);

  const checkActiveCallRef = useRef(checkActiveCall);
  checkActiveCallRef.current = checkActiveCall;

  useEffect(() => {
    if (status !== "authenticated" || !isAllowedVideoActiveRoute) return;

    checkActiveCallRef.current();
    const interval = setInterval(() => {
      checkActiveCallRef.current();
    }, 10000);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkActiveCallRef.current();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [status, isAllowedVideoActiveRoute]);

  const expandCall = useCallback(() => {
    setIsMinimized(false);
  }, []);

  const minimizeCall = useCallback(() => {
    setIsMinimized(true);
  }, []);

  // Handle participant track subscription
  const attachTrack = (track: any, container: HTMLElement | null) => {
    if (!container || !track) return;

    const trackId = track.sid || track.id || track.name || "";
    // Prevent duplicate track attachment in the same container
    if (trackId && container.querySelector(`[data-track-id="${trackId}"]`)) {
      return;
    }

    // Clear stale video elements to prevent duplicate decoders running concurrently
    if (track.kind === "video") {
      container.innerHTML = "";
    }

    const el = track.attach();
    if (trackId) {
      el.setAttribute("data-track-id", trackId);
    }

    if (track.kind === "video") {
      el.style.width = "100%";
      el.style.height = "100%";
      el.style.objectFit = container === remoteVideoRef.current ? videoFitMode : "cover";
      // Force GPU hardware acceleration for smooth 30-60fps rendering on Desktop, Laptop & Mobile
      el.style.transform = "translateZ(0)";
      el.style.webkitTransform = "translateZ(0)";
      el.style.backfaceVisibility = "hidden";
      el.style.willChange = "transform";
      el.setAttribute("playsinline", "true");
      el.setAttribute("webkit-playsinline", "true");
      el.autoplay = true;
    } else if (track.kind === "audio") {
      el.autoplay = true;
    }

    container.appendChild(el);
  };

  useEffect(() => {
    if (remoteVideoRef.current) {
      const videos = remoteVideoRef.current.querySelectorAll("video");
      videos.forEach((v) => {
        v.style.objectFit = videoFitMode;
      });
    }
  }, [videoFitMode]);

  const detachTrack = (track: any) => {
    if (!track) return;
    try {
      const elements = track.detach();
      elements.forEach((el: HTMLElement) => el.remove());
    } catch (e) {
      console.warn("Detach track warning:", e);
    }
  };

  // Reattach tracks whenever minimized state changes so video stream continues uninterrupted without duplicate decoders
  useEffect(() => {
    if (!remoteParticipant) return;

    remoteParticipant.tracks.forEach((publication: any) => {
      if (publication.isSubscribed && publication.track && publication.track.kind === "video") {
        if (!isMinimized && remoteVideoRef.current) {
          if (miniRemoteVideoRef.current) miniRemoteVideoRef.current.innerHTML = "";
          attachTrack(publication.track, remoteVideoRef.current);
        } else if (isMinimized && miniRemoteVideoRef.current) {
          if (remoteVideoRef.current) remoteVideoRef.current.innerHTML = "";
          attachTrack(publication.track, miniRemoteVideoRef.current);
        }
      }
    });

    if (activeRoomRef.current && !isMinimized && localVideoRef.current) {
      const localVideoTrackPublication = Array.from(
        activeRoomRef.current.localParticipant.videoTracks.values()
      )[0] as any;
      if (localVideoTrackPublication && localVideoTrackPublication.track) {
        attachTrack(localVideoTrackPublication.track, localVideoRef.current);
      }
    }
  }, [isMinimized, remoteParticipant]);

  const handleParticipant = (participant: any) => {
    setRemoteParticipant(participant);

    const subscribeToTrack = (track: any) => {
      try {
        if (typeof track.setPriority === "function") {
          track.setPriority("high");
        }
      } catch (e) {
      }

      if (track.kind === "video") {
        const targetContainer = isMinimized ? miniRemoteVideoRef.current : remoteVideoRef.current;
        if (targetContainer) {
          attachTrack(track, targetContainer);
        }
      } else if (track.kind === "audio" && audioContainerRef.current) {
        attachTrack(track, audioContainerRef.current);
      }
    };

    participant.tracks.forEach((publication: any) => {
      if (publication.isSubscribed && publication.track) {
        subscribeToTrack(publication.track);
      }
    });

    participant.on("trackSubscribed", (track: any) => {
      subscribeToTrack(track);
    });

    participant.on("trackUnsubscribed", (track: any) => {
      detachTrack(track);
    });
  };

  const connectVideoWebSocket = (shiftId: string) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://vitalize-cosmetics-magnetic.ngrok-free.dev";
      const cleanBase = baseUrl.replace(/\/+$/, "");
      const wsProtocol = cleanBase.startsWith("https") ? "wss" : "ws";
      const wsHost = cleanBase.replace(/^https?:\/\//, "").split("/")[0];
      const wsUrl = `${wsProtocol}://${wsHost}/api/v1/twilio/video/ws/end?shift_id=${shiftId}`;

      console.log("[Video WebSocket] Connecting to:", wsUrl);

      if (videoWsRef.current) {
        try {
          videoWsRef.current.close();
        } catch (e) {
        }
      }

      const ws = new WebSocket(wsUrl);
      videoWsRef.current = ws;

      ws.onopen = () => {
        console.log("[Video WebSocket] Connection established for shift:", shiftId);
      };

      ws.onmessage = (event) => {
        try {
          console.log("[Video WebSocket] Received message:", event.data);
          const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
          if (data?.event === "remove_vc_call_view") {
            console.log("[Video WebSocket] remove_vc_call_view event received. Closing call view.");
            handleCallEnd(false, "Video call ended");
          }
        } catch (err) {
          console.error("[Video WebSocket] Failed to parse message:", err);
        }
      };

      ws.onerror = (err) => {
        console.warn("[Video WebSocket] Connection error:", err);
      };

      ws.onclose = (event) => {
        console.log("[Video WebSocket] Connection closed.", event.reason, "Code:", event.code);
      };
    } catch (err) {
      console.error("[Video WebSocket] Error initializing WebSocket:", err);
    }
  };

  const startCall = async (
    guardId: string,
    shiftId: string,
    shiftNo?: string | number
  ) => {
    if (activeRoomRef.current) {
      if (shiftId) {
        activeShiftIdRef.current = shiftId;
      }
      setIsMinimized(false);
      setIsCallOpen(true);
      return;
    }

    if (shiftNo) {
      setActiveShiftNo(shiftNo);
    }
    if (!shiftId) {
      toast.error("Shift ID is required to start a video call.");
      return;
    }

    let targetGuardId = guardId;
    if (!targetGuardId) {
      targetGuardId = (await getShiftGuardIdAction(shiftId)) || "";
    }

    if (!targetGuardId) {
      toast.error("No guard assigned to this shift.");
      return;
    }

    try {
      isCallEndingRef.current = false;
      setIsCallOpen(true);
      setIsConnecting(true);
      activeShiftIdRef.current = shiftId;
      try {
        localStorage.setItem("fg_current_shift_id", shiftId);
        sessionStorage.setItem("fg_current_shift_id", shiftId);
      } catch {
        // ignore
      }

      toast.info("Connecting video call...");

      let apiRes = await startVideoCallAction({
        shift_id: shiftId,
        guard_id: targetGuardId,
      });

      // If already marked on call, reset the previous stale call state and retry start
      if (!apiRes.success && apiRes.error && apiRes.error.toLowerCase().includes("already on call")) {
        console.warn("User already marked on call. Resetting previous call and obtaining fresh token...");
        await endVideoCallAction({
          shift_id: shiftId,
          user_id: rawUserId,
          status: "ended",
        });

        await new Promise((resolve) => setTimeout(resolve, 500));

        apiRes = await startVideoCallAction({
          shift_id: shiftId,
          guard_id: targetGuardId,
        });
      }

      if (!apiRes.success || !apiRes.token) {
        const errorMsg = apiRes.error || apiRes.message || "Failed to obtain video call token.";
        toast.error(errorMsg);
        setIsCallOpen(false);
        setIsConnecting(false);
        activeShiftIdRef.current = null;
        if (videoWsRef.current) {
          try { videoWsRef.current.close(); } catch (e) { }
          videoWsRef.current = null;
        }
        return;
      }

      const tokenToUse = apiRes.token;
      const roomNameToUse = apiRes.room_name || `shift_${shiftId}`;
      setRoomName(roomNameToUse);

      // Dynamic import twilio-video
      const Video = await import("twilio-video");

      // Safely acquire media devices with fallbacks for environments without camera/mic
      let localTracks: any[] = [];
      let hasAudio = false;
      let hasVideo = false;

      const mobileVideoConstraints = {
        facingMode: "user",
        width: { ideal: 1280 },
        height: { ideal: 720 },
      };

      try {
        localTracks = await Video.createLocalTracks({
          audio: true,
          video: mobileVideoConstraints,
        });
        hasAudio = true;
        hasVideo = true;
      } catch (e1: any) {
        console.warn("Could not acquire both camera and microphone with ideal constraints, trying mobile fallback:", e1);
        try {
          localTracks = await Video.createLocalTracks({
            audio: true,
            video: { facingMode: "user" },
          });
          hasAudio = true;
          hasVideo = true;
        } catch (eFallback: any) {
          try {
            localTracks = await Video.createLocalTracks({ audio: true });
            hasAudio = true;
            hasVideo = false;
          } catch (e2: any) {
            console.warn("Could not acquire audio, trying video only:", e2);
            try {
              localTracks = await Video.createLocalTracks({
                video: { facingMode: "user" },
              });
              hasAudio = false;
              hasVideo = true;
            } catch (e3: any) {
              console.warn("No local media devices found or permission not granted. Connecting in receive-only mode:", e3);
              localTracks = [];
              hasAudio = false;
              hasVideo = false;
            }
          }
        }
      }

      setIsMicMuted(!hasAudio);
      setIsVideoMuted(!hasVideo);

      const room = await Video.connect(tokenToUse, {
        name: roomNameToUse,
        tracks: localTracks,
        bandwidthProfile: {
          video: {
            mode: "presentation",
            clientTrackSwitchOffControl: "auto",
            contentPreferencesMode: "auto",
          },
        },
        preferredVideoCodecs: [{ codec: "VP8", simulcast: true }, "H264"],
        maxAudioBitrate: 16000,
        networkQuality: { local: 1, remote: 1 },
        dominantSpeaker: true,
      });

      activeRoomRef.current = room;
      setIsConnecting(false);
      toast.success("Joined video call room.");

      // Connect the WebSocket for real-time call termination ONLY after room is joined
      connectVideoWebSocket(shiftId);

      // Attach Local Video Track if available
      const localVideoTrackPublication = Array.from(
        room.localParticipant.videoTracks.values()
      )[0] as any;
      if (localVideoTrackPublication && localVideoTrackPublication.track && localVideoRef.current) {
        localVideoRef.current.innerHTML = "";
        attachTrack(localVideoTrackPublication.track, localVideoRef.current);
      }

      // Check existing participants
      room.participants.forEach((participant: any) => {
        handleParticipant(participant);
      });

      // Listen for participant connected
      room.on("participantConnected", (participant: any) => {
        toast.success(`Guard connected to call.`);
        handleParticipant(participant);
      });

      // Listen for participant disconnected
      room.on("participantDisconnected", (participant: any) => {
        toast.info("Guard disconnected from call.");
        if (remoteVideoRef.current) {
          remoteVideoRef.current.innerHTML = "";
        }
        setRemoteParticipant(null);
      });

      // Listen for room disconnection
      room.on("disconnected", (roomObj: any, error: any) => {
        if (error) {
          console.warn("Twilio room disconnected with error:", error);
        }
        handleCallEnd(false);
      });
    } catch (error: any) {
      console.error("Twilio Video Call Error:", error);
      toast.error(error.message || "Failed to start Twilio video call.");
      setIsCallOpen(false);
      setIsConnecting(false);
      cleanupTracksAndRoom();
    }
  };

  const toggleMic = async () => {
    if (!activeRoomRef.current) return;
    const audioTracks = Array.from(
      activeRoomRef.current.localParticipant.audioTracks.values()
    ) as any[];

    if (audioTracks.length > 0) {
      audioTracks.forEach((publication) => {
        if (publication.track) {
          if (isMicMuted) {
            publication.track.enable();
          } else {
            publication.track.disable();
          }
        }
      });
      setIsMicMuted(!isMicMuted);
    } else {
      try {
        const Video = await import("twilio-video");
        const track = await Video.createLocalAudioTrack();
        await activeRoomRef.current.localParticipant.publishTrack(track);
        setIsMicMuted(false);
        toast.success("Microphone unmuted");
      } catch (err: any) {
        if (
          err.name === "NotFoundError" ||
          err.name === "DevicesNotFoundError" ||
          err.message?.toLowerCase().includes("not found")
        ) {
          toast.error("No microphone detected. Please plug in a microphone or headset.");
        } else if (
          err.name === "NotAllowedError" ||
          err.name === "PermissionDeniedError" ||
          err.message?.toLowerCase().includes("permission")
        ) {
          toast.error("Microphone permission denied. Tap the settings/tune icon next to the URL in your address bar, open Permissions, and select 'Allow'.", { duration: 6000 });
        } else if (
          err.name === "NotReadableError" ||
          err.name === "TrackStartError"
        ) {
          toast.error("Microphone is currently in use by another application.");
        } else {
          toast.error(err.message || "Could not access microphone device.");
        }
      }
    }
  };

  const toggleVideo = async () => {
    if (!activeRoomRef.current) return;
    const videoTracks = Array.from(
      activeRoomRef.current.localParticipant.videoTracks.values()
    ) as any[];

    if (videoTracks.length > 0) {
      videoTracks.forEach((publication) => {
        if (publication.track) {
          if (isVideoMuted) {
            publication.track.enable();
          } else {
            publication.track.disable();
          }
        }
      });
      setIsVideoMuted(!isVideoMuted);
    } else {
      try {
        const Video = await import("twilio-video");
        let track: any = null;
        try {
          track = await Video.createLocalVideoTrack({
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          });
        } catch {
          try {
            track = await Video.createLocalVideoTrack({ facingMode: "user" });
          } catch {
            track = await Video.createLocalVideoTrack();
          }
        }
        await activeRoomRef.current.localParticipant.publishTrack(track);
        if (localVideoRef.current) {
          localVideoRef.current.innerHTML = "";
          attachTrack(track, localVideoRef.current);
        }
        setIsVideoMuted(false);
        toast.success("Camera turned on");
      } catch (err: any) {
        if (
          err.name === "NotFoundError" ||
          err.name === "DevicesNotFoundError" ||
          err.message?.toLowerCase().includes("not found")
        ) {
          toast.error("No camera detected. Please connect a webcam or enable your camera.");
        } else if (
          err.name === "NotAllowedError" ||
          err.name === "PermissionDeniedError" ||
          err.message?.toLowerCase().includes("permission")
        ) {
          toast.error("Camera permission denied. Tap the settings/tune icon next to the URL in your address bar, open Permissions, and select 'Allow'.", { duration: 6000 });
        } else if (
          err.name === "NotReadableError" ||
          err.name === "TrackStartError"
        ) {
          toast.error("Camera is in use by another application.");
        } else {
          toast.error(err.message || "Could not access camera device.");
        }
      }
    }
  };

  const toggleScreenShare = async () => {
    if (!activeRoomRef.current) return;
    const Video = await import("twilio-video");

    if (isScreenSharing) {
      if (screenTrackRef.current) {
        activeRoomRef.current.localParticipant.unpublishTrack(screenTrackRef.current);
        screenTrackRef.current.stop();
        screenTrackRef.current = null;
      }
      setIsScreenSharing(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = new Video.LocalVideoTrack(stream.getVideoTracks()[0]);
        screenTrackRef.current = screenTrack;

        activeRoomRef.current.localParticipant.publishTrack(screenTrack);
        setIsScreenSharing(true);

        screenTrack.mediaStreamTrack.onended = () => {
          if (activeRoomRef.current && screenTrackRef.current) {
            activeRoomRef.current.localParticipant.unpublishTrack(screenTrackRef.current);
            screenTrackRef.current.stop();
            screenTrackRef.current = null;
          }
          setIsScreenSharing(false);
        };
      } catch (err: any) {
        console.warn("Screen share cancelled or failed:", err);
      }
    }
  };

  const toggleFullscreen = () => {
    if (!callModalRef.current) return;
    if (!document.fullscreenElement) {
      callModalRef.current.requestFullscreen?.().catch((err) => {
        console.warn("Fullscreen request failed:", err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch((err) => {
        console.warn("Exit fullscreen failed:", err);
      });
      setIsFullscreen(false);
    }
  };

  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(MAX_ZOOM, Math.round((prev + ZOOM_STEP) * 100) / 100));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => {
      const next = Math.max(MIN_ZOOM, Math.round((prev - ZOOM_STEP) * 100) / 100);
      if (next <= 1.0) {
        setPanPosition({ x: 0, y: 0 });
      }
      return next;
    });
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoomLevel(DEFAULT_ZOOM);
    setPanPosition({ x: 0, y: 0 });
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 1.0) return;
    if ((e.target as HTMLElement).closest("button")) return;
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      panX: panPosition.x,
      panY: panPosition.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoomLevel <= 1.0) return;
    e.preventDefault();
    const deltaX = e.clientX - dragStartRef.current.mouseX;
    const deltaY = e.clientY - dragStartRef.current.mouseY;

    const container = videoContainerRef.current;
    const width = container ? container.clientWidth : 1200;
    const height = container ? container.clientHeight : 600;
    const maxPanX = Math.max(0, ((zoomLevel - 1) * width) / 2);
    const maxPanY = Math.max(0, ((zoomLevel - 1) * height) / 2);

    const newX = Math.max(-maxPanX, Math.min(maxPanX, dragStartRef.current.panX + deltaX));
    const newY = Math.max(-maxPanY, Math.min(maxPanY, dragStartRef.current.panY + deltaY));

    setPanPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!remoteParticipant || isConnecting) return;
    if ((e.target as HTMLElement).closest("button")) return;
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoomLevel((prev) => Math.min(MAX_ZOOM, Math.round((prev + 0.1) * 100) / 100));
    } else if (e.deltaY > 0) {
      setZoomLevel((prev) => {
        const next = Math.max(MIN_ZOOM, Math.round((prev - 0.1) * 100) / 100);
        if (next <= 1.0) {
          setPanPosition({ x: 0, y: 0 });
        }
        return next;
      });
    }
  };

  useEffect(() => {
    if (zoomLevel <= 1.0) {
      setPanPosition({ x: 0, y: 0 });
      return;
    }
    const container = videoContainerRef.current;
    if (!container) return;
    const maxPanX = Math.max(0, ((zoomLevel - 1) * container.clientWidth) / 2);
    const maxPanY = Math.max(0, ((zoomLevel - 1) * container.clientHeight) / 2);
    setPanPosition((prev) => ({
      x: Math.max(-maxPanX, Math.min(maxPanX, prev.x)),
      y: Math.max(-maxPanY, Math.min(maxPanY, prev.y)),
    }));
  }, [zoomLevel]);

  // Keyboard shortcuts (+ / - to zoom, 0 to reset)
  useEffect(() => {
    if (!isCallOpen || isMinimized) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === "0") {
        e.preventDefault();
        handleResetZoom();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCallOpen, isMinimized, handleZoomIn, handleZoomOut, handleResetZoom]);

  const handleExpandOrJoin = useCallback(async () => {
    if (activeRoomRef.current) {
      setIsMinimized(false);
      setIsCallOpen(true);
      return;
    }
    if (serverActiveCall?.shift_id) {
      await startCall(
        serverActiveCall.guard_id || "",
        serverActiveCall.shift_id,
        serverActiveCall.shift_no
      );
    } else {
      setIsMinimized(false);
      setIsCallOpen(true);
    }
  }, [serverActiveCall, startCall]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupTracksAndRoom();
    };
  }, [cleanupTracksAndRoom]);

  const displayRoomTitle =
    activeShiftNo || serverActiveCall?.shift_no
      ? `Room: #${activeShiftNo || serverActiveCall?.shift_no}`
      : roomName
        ? `Room: ${roomName}`
        : "Twilio Secure Room";

  const showLiveWidget = (isCallOpen && isMinimized) || (!isCallOpen && Boolean(serverActiveCall));

  return (
    <VideoCallContext.Provider
      value={{
        startCall,
        endCall,
        forceEndCall,
        isCalling: isCallOpen,
        isMinimized,
        expandCall,
        minimizeCall,
        serverActiveCall,
      }}
    >
      {children}

      <div ref={audioContainerRef} className="hidden" aria-hidden="true" />

      {showLiveWidget && (
        <div
          className="fixed bottom-6 right-6 z-[999999] w-80 sm:w-96 rounded-2xl bg-slate-950/95 border border-slate-700/80 shadow-[0_16px_48px_rgba(0,0,0,0.65)] backdrop-blur-xl overflow-hidden animate-in slide-in-from-bottom-6 fade-in duration-300 select-none font-sans"
        >
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900/90 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live Call
              </span>
              <div className="flex items-center gap-1 text-slate-300 text-xs font-mono">
                <Signal className="w-3 h-3 text-emerald-400" />
                <span>{callDuration > 0 ? formatDuration(callDuration) : "Active"}</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleExpandOrJoin}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1 text-xs font-medium"
                title="Expand to Full Video Call"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="text-[11px]">Expand</span>
              </button>
            </div>
          </div>

          <div
            onClick={handleExpandOrJoin}
            className="relative aspect-video w-full bg-slate-900 flex items-center justify-center cursor-pointer group overflow-hidden"
            title="Click to expand video call"
          >
            {isConnecting && (
              <div className="flex flex-col items-center justify-center gap-2 text-center p-4">
                <div className="w-8 h-8 rounded-full border-2 border-orange-500/20 border-t-orange-500 animate-spin" />
                <p className="text-xs text-slate-300 font-medium">Connecting call...</p>
              </div>
            )}

            <div
              ref={miniRemoteVideoRef}
              className={`w-full h-full absolute inset-0 flex items-center justify-center overflow-hidden [&>video]:w-full [&>video]:h-full [&>video]:object-cover ${!remoteParticipant || isConnecting ? "hidden" : ""
                }`}
            />

            {isCallOpen && !isConnecting && !remoteParticipant && (
              <div className="flex flex-col items-center justify-center gap-2 text-center p-4">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                  <UserCheck className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-xs text-slate-300 font-medium">Waiting for guard to join...</p>
              </div>
            )}

            {!isCallOpen && Boolean(serverActiveCall) && !isConnecting && (
              <div className="flex flex-col items-center justify-center gap-2 text-center p-4">
                <div className="w-10 h-10 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <p className="text-xs text-slate-200 font-medium">Active Call In Progress</p>
                <p className="text-[11px] text-slate-400">Click anywhere to open call</p>
              </div>
            )}

            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-semibold backdrop-blur-[1px]">
              <Maximize2 className="w-4 h-4" />
              <span>Click to Expand Screen</span>
            </div>

            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-[10px] font-mono text-slate-300 pointer-events-none">
              {displayRoomTitle}
            </div>
          </div>
        </div>
      )}

      {isCallOpen && !isMinimized && (
        <div
          ref={callModalRef}
          className="fixed inset-0 z-[999999] bg-slate-950 flex flex-col items-center justify-between p-2 sm:p-3 select-none animate-in fade-in duration-300 backdrop-blur-md"
        >
          <div className="w-full max-w-7xl flex items-center justify-between z-20 px-3.5 sm:px-4 py-2 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-800/80 shadow-xl">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 shadow-inner">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-white text-xs sm:text-sm font-semibold tracking-wide">
                    Video Call
                  </h3>
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    Live
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono">
                  {displayRoomTitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="px-2.5 sm:px-3 py-1 rounded-lg bg-slate-800/90 border border-slate-700/50 text-slate-200 text-xs font-mono tracking-wider flex items-center gap-1.5 shadow-inner">
                <Signal className="w-3 h-3 text-emerald-400" />
                <span>{formatDuration(callDuration)}</span>
              </div>

              <button
                type="button"
                onClick={toggleFullscreen}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div
            ref={videoContainerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            className={`w-full max-w-7xl flex-1 my-1.5 sm:my-2 relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800/80 shadow-2xl flex items-center justify-center ${zoomLevel > 1.0 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : ""
              }`}
          >
            {isConnecting && (
              <div className="flex flex-col items-center justify-center gap-4 text-center z-10 p-6 animate-in fade-in duration-200">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full border-4 border-orange-500/20 border-t-orange-500 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ShieldCheck className="w-8 h-8 text-orange-400" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h4 className="text-lg font-medium text-white">
                    Connecting to Video Call...
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-400 max-w-sm">
                    Establishing secure encrypted peer connection with the assigned security guard.
                  </p>
                </div>
              </div>
            )}

            <div
              ref={remoteVideoRef}
              style={{
                transform: `translate3d(${panPosition.x}px, ${panPosition.y}px, 0) scale(${zoomLevel})`,
                transformOrigin: "center center",
                transition: isDragging ? "none" : "transform 0.2s cubic-bezier(0.2, 0, 0, 1)",
                willChange: "transform",
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
              }}
              className={`w-full h-full absolute inset-0 flex items-center justify-center overflow-hidden [&>video]:w-full [&>video]:h-full [&>video]:max-w-full [&>video]:max-h-full ${videoFitMode === "contain" ? "[&>video]:object-contain" : "[&>video]:object-cover"
                } ${!remoteParticipant || isConnecting ? "hidden" : ""}`}
            />

            {!isConnecting && !remoteParticipant && (
              <div className="flex flex-col items-center justify-center gap-3 text-center z-10 p-6">
                <div className="w-24 h-24 rounded-full bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 shadow-xl">
                  <UserCheck className="w-12 h-12 text-slate-400" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base sm:text-lg font-medium text-white">
                    Waiting for guard to join...
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-400 max-w-xs">
                    The video call invitation has been dispatched. Waiting for response.
                  </p>
                </div>
              </div>
            )}

            {/* Floating Zoom & Fit Controls */}
            {remoteParticipant && !isConnecting && (
              <div
                className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-slate-700/70 shadow-2xl select-none animate-in fade-in duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setVideoFitMode((prev) => (prev === "contain" ? "cover" : "contain"))}
                  className="px-2 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/50"
                  title={videoFitMode === "contain" ? "Switch to Fill Screen (Cover)" : "Switch to Fit (Show Full Face)"}
                >
                  <Maximize2 className="w-3.5 h-3.5 text-orange-400" />
                  <span className="text-[11px] font-semibold">{videoFitMode === "contain" ? "Fit (Full Face)" : "Fill Screen"}</span>
                </button>

                <div className="w-[1px] h-4 bg-slate-700/80 mx-0.5" />

                <button
                  type="button"
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= MIN_ZOOM}
                  className="p-1 sm:p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-300 transition-all cursor-pointer disabled:cursor-not-allowed active:scale-95"
                  title="Zoom Out (-)"
                >
                  <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="px-2 py-0.5 rounded-lg text-xs font-mono font-medium text-slate-200 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1"
                  title="Click to reset zoom to default (100%)"
                >
                  <span>{Math.round(zoomLevel * 100)}%</span>
                </button>

                <button
                  type="button"
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= MAX_ZOOM}
                  className="p-1 sm:p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-300 transition-all cursor-pointer disabled:cursor-not-allowed active:scale-95"
                  title="Zoom In (+)"
                >
                  <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>

                {(zoomLevel !== DEFAULT_ZOOM || panPosition.x !== 0 || panPosition.y !== 0) && (
                  <button
                    type="button"
                    onClick={handleResetZoom}
                    className="p-1 sm:p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer active:scale-95 border-l border-slate-700/60 ml-0.5 pl-1.5"
                    title="Reset Zoom & Pan"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Helper hint when zoomed in */}
            {remoteParticipant && !isConnecting && zoomLevel > 1.0 && !isDragging && (
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 pointer-events-none px-2.5 py-1 rounded-xl bg-slate-900/70 backdrop-blur-sm border border-slate-800/80 text-[11px] font-sans text-slate-400 shadow-lg animate-in fade-in duration-300">
                Drag video to pan • Scroll wheel to zoom
              </div>
            )}

            <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-20 w-32 sm:w-48 aspect-video rounded-xl sm:rounded-2xl overflow-hidden bg-slate-800/90 border-2 border-slate-700 shadow-2xl backdrop-blur-md transition-all duration-300 hover:scale-105">
              <div
                ref={localVideoRef}
                className={`w-full h-full [&>video]:w-full [&>video]:h-full [&>video]:object-cover ${isVideoMuted ? "hidden" : ""
                  }`}
              />
              {isVideoMuted && (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800/95 text-slate-400">
                  <VideoOff className="w-5 h-5 mb-1 text-slate-500" />
                  <span className="text-[10px] sm:text-[11px] font-medium">Camera Off</span>
                </div>
              )}
              <div className="absolute bottom-1 left-1.5 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[9px] sm:text-[10px] font-semibold text-white tracking-wide">
                You (Admin)
              </div>
            </div>
          </div>

          {/* Compact Bottom Buttons Bar */}
          <div className="flex items-center justify-center gap-2.5 sm:gap-3 z-20 px-4 py-1.5 sm:py-2 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-800 shadow-xl">
            <button
              type="button"
              onClick={toggleMic}
              className={`p-2.5 sm:p-3 rounded-xl transition-all cursor-pointer shadow-md active:scale-95 ${isMicMuted
                ? "bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30"
                : "bg-slate-800 text-white border border-slate-700 hover:bg-slate-700"
                }`}
              title={isMicMuted ? "Unmute Microphone" : "Mute Microphone"}
            >
              {isMicMuted ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>

            <button
              type="button"
              onClick={toggleVideo}
              className={`p-2.5 sm:p-3 rounded-xl transition-all cursor-pointer shadow-md active:scale-95 ${isVideoMuted
                ? "bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30"
                : "bg-slate-800 text-white border border-slate-700 hover:bg-slate-700"
                }`}
              title={isVideoMuted ? "Turn Camera On" : "Turn Camera Off"}
            >
              {isVideoMuted ? (
                <VideoOff className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <VideoIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>

            <button
              type="button"
              onClick={toggleScreenShare}
              className={`p-2.5 sm:p-3 rounded-xl transition-all cursor-pointer shadow-md active:scale-95 ${isScreenSharing
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
                : "bg-slate-800 text-white border border-slate-700 hover:bg-slate-700"
                }`}
              title={isScreenSharing ? "Stop Screen Share" : "Share Screen"}
            >
              {isScreenSharing ? (
                <MonitorX className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <MonitorUp className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>

            <button
              type="button"
              onClick={endCall}
              className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-rose-600/30 active:scale-95 ml-1"
              title="End Video Call"
            >
              <PhoneOff className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              <span className="text-xs sm:text-sm font-semibold tracking-wide">End Call</span>
            </button>
          </div>
        </div>
      )}
    </VideoCallContext.Provider>
  );
}

export const useVideoCall = () => {
  const context = useContext(VideoCallContext);
  if (context === undefined) {
    throw new Error("useVideoCall must be used within a VideoCallProvider");
  }
  return context;
};
