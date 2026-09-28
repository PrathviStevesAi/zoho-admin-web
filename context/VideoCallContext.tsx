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
} from "@/actions/vc.actions";

interface VideoCallContextType {
  startCall: (guardId: string, shiftId: string) => Promise<void>;
  endCall: () => void;
  forceEndCall: (shiftId: string) => Promise<void>;
  isCalling: boolean;
}

const VideoCallContext = createContext<VideoCallContextType | undefined>(undefined);

export function VideoCallProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  const [isCallOpen, setIsCallOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [remoteParticipant, setRemoteParticipant] = useState<any | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [roomName, setRoomName] = useState<string>("");

  const activeShiftIdRef = useRef<string | null>(null);
  const activeRoomRef = useRef<any | null>(null);
  const isCallEndingRef = useRef<boolean>(false);
  const videoWsRef = useRef<WebSocket | null>(null);
  const screenTrackRef = useRef<any | null>(null);
  const localVideoRef = useRef<HTMLDivElement | null>(null);
  const remoteVideoRef = useRef<HTMLDivElement | null>(null);
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
    if (audioContainerRef.current) {
      audioContainerRef.current.innerHTML = "";
    }

    setRemoteParticipant(null);
    setIsScreenSharing(false);
    setIsMicMuted(false);
    setIsVideoMuted(false);
  }, []);

  const handleCallEnd = useCallback(
    async (notifyServer: boolean = true, customMessage?: string) => {
      if (isCallEndingRef.current) return;
      isCallEndingRef.current = true;

      const shiftId = activeShiftIdRef.current;
      cleanupTracksAndRoom();
      setIsCallOpen(false);
      setIsConnecting(false);

      if (customMessage) {
        toast.info(customMessage);
      } else if (shiftId && notifyServer) {
        try {
          const res = await endVideoCallAction({
            shift_id: shiftId,
            user_id: rawUserId,
            status: "ended",
          });
          if (res.success && res.message) {
            toast.success(res.message);
          }
        } catch {
          // Handled silently
        }
      }

      activeShiftIdRef.current = null;
    },
    [cleanupTracksAndRoom, rawUserId]
  );

  const endCall = useCallback(() => {
    handleCallEnd(true);
  }, [handleCallEnd]);

  const forceEndCall = useCallback(
    async (shiftId: string) => {
      cleanupTracksAndRoom();
      setIsCallOpen(false);
      setIsConnecting(false);
      isCallEndingRef.current = true;
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
      }
    },
    [cleanupTracksAndRoom, rawUserId]
  );

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

  const handleParticipant = (participant: any) => {
    setRemoteParticipant(participant);

    participant.tracks.forEach((publication: any) => {
      if (publication.isSubscribed && publication.track) {
        if (publication.track.kind === "video" && remoteVideoRef.current) {
          attachTrack(publication.track, remoteVideoRef.current);
        } else if (publication.track.kind === "audio" && audioContainerRef.current) {
          attachTrack(publication.track, audioContainerRef.current);
        }
      }
    });

    participant.on("trackSubscribed", (track: any) => {
      if (track.kind === "video" && remoteVideoRef.current) {
        attachTrack(track, remoteVideoRef.current);
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
            handleCallEnd(false, "Video call ended by guard");
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

  const startCall = async (guardId: string, shiftId: string) => {
    if (!shiftId) {
      toast.error("Shift ID is required to start a video call.");
      return;
    }
    if (!guardId) {
      toast.error("No guard assigned to this shift.");
      return;
    }

    try {
      isCallEndingRef.current = false;
      setIsCallOpen(true);
      setIsConnecting(true);
      activeShiftIdRef.current = shiftId;

      toast.info("Connecting video call...");

      // 1. Connect the WebSocket for real-time call termination
      connectVideoWebSocket(shiftId);

      let apiRes = await startVideoCallAction({
        shift_id: shiftId,
        guard_id: guardId,
      });

      // If already on call, reset the previous call and retry once
      if (!apiRes.success && apiRes.error && apiRes.error.toLowerCase().includes("already on call")) {
        console.warn("User already marked on call. Attempting auto-reset of previous call...");
        await endVideoCallAction({
          shift_id: shiftId,
          user_id: rawUserId,
          status: "ended",
        });

        // Retry start call
        apiRes = await startVideoCallAction({
          shift_id: shiftId,
          guard_id: guardId,
        });
      }

      if (!apiRes.success || !apiRes.token) {
        const errorMsg = apiRes.error || apiRes.message || "Failed to obtain video call token.";
        toast.error(errorMsg);
        setIsCallOpen(false);
        setIsConnecting(false);
        activeShiftIdRef.current = null;
        if (videoWsRef.current) {
          try { videoWsRef.current.close(); } catch (e) {}
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupTracksAndRoom();
    };
  }, [cleanupTracksAndRoom]);

  return (
    <VideoCallContext.Provider
      value={{
        startCall,
        endCall,
        forceEndCall,
        isCalling: isCallOpen,
      }}
    >
      {children}

      {/* Hidden audio receiver container for remote participants */}
      <div ref={audioContainerRef} className="hidden" aria-hidden="true" />

      {/* Twilio Video Call Modal UI */}
      {isCallOpen && (
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
                    FastGuard Video Call
                  </h3>
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    Live
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono">
                  {roomName ? `Room: ${roomName}` : "Twilio Secure Room"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="px-3.5 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700/50 text-slate-200 text-xs sm:text-sm font-mono tracking-wider flex items-center gap-2 shadow-inner">
                <Signal className="w-3.5 h-3.5 text-emerald-400" />
                <span>{formatDuration(callDuration)}</span>
              </div>
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
                    Connecting to Twilio Room...
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
