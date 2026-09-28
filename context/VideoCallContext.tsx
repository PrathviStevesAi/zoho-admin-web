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

  // Duration timer
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
    // Close and cleanup WebSocket
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
      // ignore
    }

    setRemoteParticipant(null);
    setIsScreenSharing(false);
    setIsMicMuted(false);
    setIsVideoMuted(false);
    setIsMinimized(false);
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
          // ignore
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

      // Reset UI state immediately
      setServerActiveCall(null);
      setIsCallOpen(false);
      setIsConnecting(false);
      setIsMinimized(false);

      if (customMessage) {
        toast.info(customMessage);
      }

      // Cleanup local tracks and room connection
      cleanupTracksAndRoom();

      // Broadcast to other tabs immediately
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

      // Ensure backend is notified when ending the call
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
        // ignore
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

  // Cross-tab synchronization via BroadcastChannel and StorageEvent
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
        } catch {}
      }
      window.removeEventListener("storage", handleStorage);
    };
  }, [handleCallEnd]);

  const checkActiveCall = useCallback(async () => {
    if (status !== "authenticated" || !session?.user) return;
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
  }, [isCallOpen, isMinimized, status, session?.user?.id]);

  const checkActiveCallRef = useRef(checkActiveCall);
  checkActiveCallRef.current = checkActiveCall;

  useEffect(() => {
    if (status !== "authenticated") return;

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
  }, [status]);

  const expandCall = useCallback(() => {
    setIsMinimized(false);
  }, []);

  const minimizeCall = useCallback(() => {
    setIsMinimized(true);
  }, []);

  // Handle participant track subscription
  const attachTrack = (track: any, container: HTMLElement | null) => {
    if (!container || !track) return;
    const el = track.attach();
    if (track.kind === "video") {
      el.style.width = "100%";
      el.style.height = "100%";
      el.style.objectFit = "cover";
    }
    container.appendChild(el);
  };

  const detachTrack = (track: any) => {
    if (!track) return;
    try {
      const elements = track.detach();
      elements.forEach((el: HTMLElement) => el.remove());
    } catch (e) {
      console.warn("Detach track warning:", e);
    }
  };

  // Reattach tracks whenever minimized state changes so video stream continues uninterrupted
  useEffect(() => {
    if (!remoteParticipant) return;

    remoteParticipant.tracks.forEach((publication: any) => {
      if (publication.isSubscribed && publication.track && publication.track.kind === "video") {
        if (!isMinimized && remoteVideoRef.current) {
          remoteVideoRef.current.innerHTML = "";
          attachTrack(publication.track, remoteVideoRef.current);
        } else if (isMinimized && miniRemoteVideoRef.current) {
          miniRemoteVideoRef.current.innerHTML = "";
          attachTrack(publication.track, miniRemoteVideoRef.current);
        }
      }
    });

    if (activeRoomRef.current && !isMinimized && localVideoRef.current) {
      const localVideoTrackPublication = Array.from(
        activeRoomRef.current.localParticipant.videoTracks.values()
      )[0] as any;
      if (localVideoTrackPublication && localVideoTrackPublication.track) {
        localVideoRef.current.innerHTML = "";
        attachTrack(localVideoTrackPublication.track, localVideoRef.current);
      }
    }
  }, [isMinimized, remoteParticipant]);

  const handleParticipant = (participant: any) => {
    setRemoteParticipant(participant);

    participant.tracks.forEach((publication: any) => {
      if (publication.isSubscribed && publication.track) {
        if (publication.track.kind === "video") {
          if (remoteVideoRef.current) {
            attachTrack(publication.track, remoteVideoRef.current);
          }
          if (miniRemoteVideoRef.current) {
            attachTrack(publication.track, miniRemoteVideoRef.current);
          }
        } else if (publication.track.kind === "audio" && audioContainerRef.current) {
          attachTrack(publication.track, audioContainerRef.current);
        }
      }
    });

    participant.on("trackSubscribed", (track: any) => {
      if (track.kind === "video") {
        if (remoteVideoRef.current) {
          attachTrack(track, remoteVideoRef.current);
        }
        if (miniRemoteVideoRef.current) {
          attachTrack(track, miniRemoteVideoRef.current);
        }
      } else if (track.kind === "audio" && audioContainerRef.current) {
        attachTrack(track, audioContainerRef.current);
      }
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
          // ignore
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

      try {
        localTracks = await Video.createLocalTracks({
          audio: true,
          video: { width: 1280, height: 720 },
        });
        hasAudio = true;
        hasVideo = true;
      } catch (e1: any) {
        console.warn("Could not acquire both camera and microphone, trying audio only:", e1);
        try {
          localTracks = await Video.createLocalTracks({ audio: true });
          hasAudio = true;
          hasVideo = false;
        } catch (e2: any) {
          console.warn("Could not acquire audio, trying video only:", e2);
          try {
            localTracks = await Video.createLocalTracks({
              video: { width: 1280, height: 720 },
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

      setIsMicMuted(!hasAudio);
      setIsVideoMuted(!hasVideo);

      const room = await Video.connect(tokenToUse, {
        name: roomNameToUse,
        tracks: localTracks,
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
        toast.error(err.message || "Could not access microphone device.");
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
        const track = await Video.createLocalVideoTrack({ width: 1280, height: 720 });
        await activeRoomRef.current.localParticipant.publishTrack(track);
        if (localVideoRef.current) {
          localVideoRef.current.innerHTML = "";
          attachTrack(track, localVideoRef.current);
        }
        setIsVideoMuted(false);
        toast.success("Camera turned on");
      } catch (err: any) {
        toast.error(err.message || "Could not access camera device.");
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

      {/* Hidden audio receiver container for remote participants */}
      <div ref={audioContainerRef} className="hidden" aria-hidden="true" />

      {/* 1. Minimized / Background Active Floating Live Screen Widget */}
      {showLiveWidget && (
        <div
          className="fixed bottom-6 right-6 z-[999999] w-80 sm:w-96 rounded-2xl bg-slate-950/95 border border-slate-700/80 shadow-[0_16px_48px_rgba(0,0,0,0.65)] backdrop-blur-xl overflow-hidden animate-in slide-in-from-bottom-6 fade-in duration-300 select-none font-sans"
        >
          {/* Header */}
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

          {/* Mini Live Video Stage */}
          <div
            onClick={handleExpandOrJoin}
            className="relative aspect-video w-full bg-slate-900 flex items-center justify-center cursor-pointer group overflow-hidden"
            title="Click to expand video call"
          >
            {/* Connecting State */}
            {isConnecting && (
              <div className="flex flex-col items-center justify-center gap-2 text-center p-4">
                <div className="w-8 h-8 rounded-full border-2 border-orange-500/20 border-t-orange-500 animate-spin" />
                <p className="text-xs text-slate-300 font-medium">Connecting call...</p>
              </div>
            )}

            {/* Remote Video Container (Guard) */}
            <div
              ref={miniRemoteVideoRef}
              className={`w-full h-full absolute inset-0 flex items-center justify-center overflow-hidden [&>video]:w-full [&>video]:h-full [&>video]:object-cover ${
                !remoteParticipant || isConnecting ? "hidden" : ""
              }`}
            />

            {/* If call is active locally but waiting for guard */}
            {isCallOpen && !isConnecting && !remoteParticipant && (
              <div className="flex flex-col items-center justify-center gap-2 text-center p-4">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                  <UserCheck className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-xs text-slate-300 font-medium">Waiting for guard to join...</p>
              </div>
            )}

            {/* If call is active on server from duplicate/reopened tab */}
            {!isCallOpen && Boolean(serverActiveCall) && !isConnecting && (
              <div className="flex flex-col items-center justify-center gap-2 text-center p-4">
                <div className="w-10 h-10 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <p className="text-xs text-slate-200 font-medium">Active Call In Progress</p>
                <p className="text-[11px] text-slate-400">Click anywhere to open call</p>
              </div>
            )}

            {/* Hover overlay hint to expand */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-semibold backdrop-blur-[1px]">
              <Maximize2 className="w-4 h-4" />
              <span>Click to Expand Screen</span>
            </div>

            {/* Room / Shift Tag */}
            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-[10px] font-mono text-slate-300 pointer-events-none">
              {displayRoomTitle}
            </div>
          </div>
        </div>
      )}

      {/* 2. Full Modal Video Call View */}
      {isCallOpen && !isMinimized && (
        <div
          ref={callModalRef}
          className="fixed inset-0 z-[999999] bg-slate-950 flex flex-col items-center justify-between p-4 sm:p-6 select-none animate-in fade-in duration-300 backdrop-blur-md"
        >
          {/* Header Bar */}
          <div className="w-full max-w-7xl flex items-center justify-between z-20 px-4 py-3 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-800/80 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 shadow-inner">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-white text-sm sm:text-base font-semibold tracking-wide">
                    Video Call
                  </h3>
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    Live
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono">
                  {displayRoomTitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="px-3.5 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700/50 text-slate-200 text-xs sm:text-sm font-mono tracking-wider flex items-center gap-2 shadow-inner">
                <Signal className="w-3.5 h-3.5 text-emerald-400" />
                <span>{formatDuration(callDuration)}</span>
              </div>

              {/* Fullscreen button */}
              <button
                type="button"
                onClick={toggleFullscreen}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
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

          {/* Main Video Stage */}
          <div className="w-full max-w-7xl flex-1 my-4 relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800/80 shadow-2xl flex items-center justify-center">
            {/* Connecting State */}
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

            {/* Remote Video Container (Guard) */}
            <div
              ref={remoteVideoRef}
              className={`w-full h-full absolute inset-0 flex items-center justify-center overflow-hidden [&>video]:w-full [&>video]:h-full [&>video]:object-cover ${
                !remoteParticipant || isConnecting ? "hidden" : ""
              }`}
            />

            {/* Waiting for Guard Placeholder */}
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

            {/* Local Video Inset (Picture in Picture - Admin) */}
            <div className="absolute bottom-4 right-4 z-20 w-36 sm:w-56 aspect-video rounded-2xl overflow-hidden bg-slate-800/90 border-2 border-slate-700 shadow-2xl backdrop-blur-md transition-all duration-300 hover:scale-105">
              <div
                ref={localVideoRef}
                className={`w-full h-full [&>video]:w-full [&>video]:h-full [&>video]:object-cover ${
                  isVideoMuted ? "hidden" : ""
                }`}
              />
              {isVideoMuted && (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800/95 text-slate-400">
                  <VideoOff className="w-6 h-6 mb-1 text-slate-500" />
                  <span className="text-[11px] font-medium">Camera Off</span>
                </div>
              )}
              <div className="absolute bottom-1.5 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] font-semibold text-white tracking-wide">
                You (Admin)
              </div>
            </div>
          </div>

          {/* Bottom Action Control Bar */}
          <div className="w-full max-w-md flex items-center justify-center gap-4 z-20 px-6 py-4 rounded-3xl bg-slate-900/90 backdrop-blur-xl border border-slate-800 shadow-2xl">
            {/* Mic Toggle */}
            <button
              type="button"
              onClick={toggleMic}
              className={`p-3.5 sm:p-4 rounded-2xl transition-all cursor-pointer shadow-lg active:scale-95 ${
                isMicMuted
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30"
                  : "bg-slate-800 text-white border border-slate-700 hover:bg-slate-700"
              }`}
              title={isMicMuted ? "Unmute Microphone" : "Mute Microphone"}
            >
              {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Camera Toggle */}
            <button
              type="button"
              onClick={toggleVideo}
              className={`p-3.5 sm:p-4 rounded-2xl transition-all cursor-pointer shadow-lg active:scale-95 ${
                isVideoMuted
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30"
                  : "bg-slate-800 text-white border border-slate-700 hover:bg-slate-700"
              }`}
              title={isVideoMuted ? "Turn Camera On" : "Turn Camera Off"}
            >
              {isVideoMuted ? (
                <VideoOff className="w-5 h-5" />
              ) : (
                <VideoIcon className="w-5 h-5" />
              )}
            </button>

            {/* Screen Share Toggle */}
            <button
              type="button"
              onClick={toggleScreenShare}
              className={`p-3.5 sm:p-4 rounded-2xl transition-all cursor-pointer shadow-lg active:scale-95 ${
                isScreenSharing
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
                  : "bg-slate-800 text-white border border-slate-700 hover:bg-slate-700"
              }`}
              title={isScreenSharing ? "Stop Screen Share" : "Share Screen"}
            >
              {isScreenSharing ? (
                <MonitorX className="w-5 h-5" />
              ) : (
                <MonitorUp className="w-5 h-5" />
              )}
            </button>

            {/* End Call Button */}
            <button
              type="button"
              onClick={endCall}
              className="px-6 py-3.5 sm:py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-medium flex items-center gap-2.5 transition-all cursor-pointer shadow-xl shadow-rose-600/30 active:scale-95 ml-2"
              title="End Video Call"
            >
              <PhoneOff className="w-5 h-5" />
              <span className="text-sm font-semibold tracking-wide">End Call</span>
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
