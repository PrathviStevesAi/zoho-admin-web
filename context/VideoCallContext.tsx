"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Minimize2,
  Maximize2,
  Loader2,
  Minus
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  startVideoCallAction,
  joinVideoCallAction,
  activeVideoCallsAction,
  inviteMemberAction,
  endVideoCallAction
} from "@/actions/vc.actions";
import { fetchMembersAction } from "@/actions/auth.actions";
import { fetchShiftDetailsAction } from "@/actions/dashboard.actions";

interface VideoCallContextType {
  activeCall: any | null;
  incomingCall: any | null;
  startCall: (shiftId: string, shiftNo?: string) => Promise<void>;
  joinCall: (callId: string, shiftNo?: string) => Promise<void>;
  declineIncomingCall: () => void;
  endCall: () => Promise<void>;
  inviteMember: (memberId: string) => Promise<void>;
  isMinimized: boolean;
  setIsMinimized: (val: boolean) => void;
  members: any[];
}

const VideoCallContext = createContext<VideoCallContextType | undefined>(undefined);

export function VideoCallProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status: authStatus } = useSession();
  const [activeCall, setActiveCall] = useState<any | null>(null);
  const [incomingCall, setIncomingCall] = useState<any | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [isZegoLoading, setIsZegoLoading] = useState(false);
  const [isActionPending, setIsActionPending] = useState(false);

  const zegoContainerRef = useRef<HTMLDivElement | null>(null);
  const zegoInstanceRef = useRef<any | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleGlobalError = (event: ErrorEvent) => {
      const isZegoBug =
        (event.message && event.message.includes("createSpan")) ||
        (event.error && event.error.message && event.error.message.includes("createSpan"));

      if (isZegoBug) {
        console.warn("[VideoCall] Suppressed Zego SDK unmount error:", event.error || event.message);
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const isZegoBug =
        event.reason &&
        event.reason.message &&
        event.reason.message.includes("createSpan");

      if (isZegoBug) {
        console.warn("[VideoCall] Suppressed Zego SDK unmount rejection:", event.reason);
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };

    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      const argStr = args
        .map((a) => {
          if (!a) return "";
          if (a instanceof Error) return a.stack || a.message;
          if (typeof a === "object") {
            try {
              return JSON.stringify(a);
            } catch {
              return String(a);
            }
          }
          return String(a);
        })
        .join(" ");

      if (
        argStr.includes("createSpan") ||
        argStr.includes("Cannot read properties of null (reading 'createSpan')") ||
        argStr.includes("installations/app-offline")
      ) {
        console.warn("[VideoCall] Suppressed known unmount/offline console.error:", ...args);
        return;
      }
      originalConsoleError.apply(console, args);
    };

    window.addEventListener("error", handleGlobalError, true);
    window.addEventListener("unhandledrejection", handleUnhandledRejection, true);

    return () => {
      window.removeEventListener("error", handleGlobalError, true);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection, true);
      console.error = originalConsoleError;
    };
  }, []);

  useEffect(() => {
    if (authStatus !== "authenticated") return;

    fetchMembersAction().then((res) => {
      if (res.success && res.data) {
        setMembers(res.data);
      }
    });

    const checkActiveCalls = async () => {
      try {
        const res = await activeVideoCallsAction();
        if (res.success && res.data && res.data.length > 0) {
          let call = res.data[0];
          console.log("[VideoCall] Active call detected on mount:", call);

          if (!call.shift_no && call.shift_id) {
            try {
              const shiftRes = await fetchShiftDetailsAction(call.shift_id);
              if (shiftRes.success && shiftRes.data) {
                call.shift_no = shiftRes.data.shift_no;
              }
            } catch (e) {
              console.error("[VideoCall] Failed to fetch shift details for active call:", e);
            }
          }

          setActiveCall(call);
          setIsMinimized(true);
        }
      } catch (err) {
        console.error("[VideoCall] Failed to fetch active calls on mount:", err);
      }
    };

    checkActiveCalls();
  }, [authStatus]);

  useEffect(() => {
    if (typeof window === "undefined") return;
  }, []);

  useEffect(() => {
    if (!activeCall || !zegoContainerRef.current) return;

    let active = true;

    const initZego = async () => {
      setIsZegoLoading(true);
      try {
        const { ZegoUIKitPrebuilt } = await import("@zegocloud/zego-uikit-prebuilt");

        if (
          ZegoUIKitPrebuilt &&
          ZegoUIKitPrebuilt.prototype &&
          !(ZegoUIKitPrebuilt.prototype as any).__patchedDestroy
        ) {
          const originalDestroy = ZegoUIKitPrebuilt.prototype.destroy;
          ZegoUIKitPrebuilt.prototype.destroy = function (this: any) {
            if (this.root) {
              console.log("[VideoCall] Pre-emptively unmounting Zego React root safely...");
              try {
                this.root.unmount();
              } catch (e) {
                console.warn("[VideoCall] Error during safe pre-unmount:", e);
              }
              this.root.unmount = () => { };
            }
            try {
              return originalDestroy.apply(this);
            } catch (err: any) {
              if (err?.message?.includes("createSpan") || err?.stack?.includes("createSpan")) {
                console.warn("[VideoCall] Caught expected Zego createSpan error on destroy.");
              } else {
                throw err;
              }
            }
          };
          (ZegoUIKitPrebuilt.prototype as any).__patchedDestroy = true;
        }

        if (!active) return;

        console.log("[VideoCall] Generating Zego Kit Token on client...");
        const appID = Number(process.env.NEXT_PUBLIC_ZEGO_APP_ID || 727438037);
        const serverSecret =
          process.env.NEXT_PUBLIC_ZEGO_SERVER_SECRET || "dd1d31a37620b0d4a6cc9c237a7cd370";
        const roomID = String(activeCall.call_id || activeCall.room_id || activeCall.id || activeCall._id || "");
        if (!roomID) {
          console.error("[VideoCall] ERROR: roomID is empty! activeCall object:", JSON.stringify(activeCall));
          toast.error("Failed to join video call: Missing room ID.");
          setActiveCall(null);
          return;
        }
        const userID =
          activeCall.user_id ||
          session?.user?.id ||
          `user_${Math.floor(Math.random() * 10000)}`;
        const userName =
          session?.user?.name || session?.user?.email || "Administrator";

        const finalToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          appID,
          serverSecret,
          roomID,
          userID,
          userName
        );

        console.log("[VideoCall] Initializing Zego with details:", {
          call_id: activeCall.call_id,
          room_id: activeCall.room_id,
          user_id: activeCall.user_id,
          token: finalToken ? `${finalToken.slice(0, 20)}...` : "null",
        });

        const zp = ZegoUIKitPrebuilt.create(finalToken);
        zegoInstanceRef.current = zp;

        zp.joinRoom({
          container: zegoContainerRef.current,
          sharedLinks: [
            {
              name: "Join Link",
              url: `${window.location.origin}/shift/view?shift_id=${activeCall.shift_id}`,
            },
          ],
          scenario: {
            mode: ZegoUIKitPrebuilt.GroupCall,
          },
          autoHideFooter: false,
          showPreJoinView: false,
          turnOnCameraWhenJoining: false,
          turnOnMicrophoneWhenJoining: false,
          showScreenSharingButton: true,
          showUserList: true,
          showLayoutButton: true,
          showTextChat: false,
          onLeaveRoom: () => {
            console.log("[VideoCall] Left Zego room via built-in button - Ending call for everyone");
            endCall();
          },
        });
      } catch (err) {
        console.error("[VideoCall] Zego initialization error:", err);
        toast.error("Failed to initialize video call room");
        setActiveCall(null);
      } finally {
        setIsZegoLoading(false);
      }
    };

    initZego();

    return () => {
      active = false;
    };
  }, [activeCall, zegoContainerRef.current]);

  const handleCleanupState = () => {
    setActiveCall(null);
    setIncomingCall(null);
    setIsMinimized(false);
    setIsFullscreen(false);
    zegoInstanceRef.current = null;
  };

  const startCall = async (shiftId: string, shiftNo?: string) => {
    if (activeCall) {
      toast.warning("You are already in an active call");
      return;
    }

    setIsActionPending(true);
    const toastId = toast.loading("Initiating video call...");
    try {
      const res = await startVideoCallAction(shiftId);
      if (res.success && res.data) {
        const isTokenMock =
          !res.data.token ||
          res.data.token === "zego_token" ||
          !res.data.token.startsWith("04");

        if (isTokenMock) {
          console.log(
            "[VideoCall] Mock token received from start — auto-joining to fetch real token..."
          );
          const joinRes = await joinVideoCallAction(res.data.call_id);
          if (joinRes.success && joinRes.data) {
            toast.success("Call room created and joined successfully", { id: toastId });
            setActiveCall({ ...joinRes.data, shift_id: shiftId, shift_no: shiftNo });
          } else {
            toast.error(joinRes.error || "Failed to fetch Zego token via join endpoint", {
              id: toastId,
            });
          }
        } else {
          toast.success("Call room created successfully", { id: toastId });
          setActiveCall({ ...res.data, shift_id: shiftId, shift_no: shiftNo });
        }
      } else {
        toast.error(res.error || "Failed to start call", { id: toastId });
      }
    } catch (err) {
      console.error("[VideoCall] Error starting call:", err);
      toast.error("An unexpected error occurred", { id: toastId });
    } finally {
      setIsActionPending(false);
    }
  };

  const joinCall = async (callId: string, shiftNo?: string) => {
    if (activeCall) {
      const activeCallId = activeCall.call_id || activeCall.id || activeCall._id || activeCall.room_id;
      if (activeCallId === callId) {
        toast.info("You are already connected to this call");
        setIsMinimized(false);
      } else {
        toast.warning("You are already in a different active call");
      }
      return;
    }

    setIsActionPending(true);
    const toastId = toast.loading("Connecting to call...");
    try {
      const res = await joinVideoCallAction(callId);
      if (res.success && res.data) {
        toast.success("Connected!", { id: toastId });
        setActiveCall({ ...res.data, shift_id: incomingCall?.shift_id || "", shift_no: shiftNo || incomingCall?.shift_no || "" });
        setIncomingCall(null);
      } else {
        toast.error(res.error || "Failed to join call", { id: toastId });
      }
    } catch (err) {
      console.error("[VideoCall] Error joining call:", err);
      toast.error("An unexpected error occurred", { id: toastId });
    } finally {
      setIsActionPending(false);
    }
  };

  const declineIncomingCall = () => {
    setIncomingCall(null);
    toast.info("Call invitation dismissed");
  };


  const endCall = async () => {
    if (!activeCall) return;

    const callIdToUse = activeCall.call_id || activeCall.id || activeCall._id || activeCall.room_id;
    if (!callIdToUse) {
      toast.error("Cannot end call: Missing call ID");
      handleCleanupState();
      return;
    }

    setIsActionPending(true);
    const toastId = toast.loading("Ending call for everyone...");
    try {
      const res = await endVideoCallAction(callIdToUse);
      if (res.success) {
        toast.success(res.message || "Call ended successfully", { id: toastId });
        
        // Notify other components (like ShiftDashboard) to refresh data
        if (typeof window !== "undefined" && activeCall?.shift_id) {
          window.dispatchEvent(
            new CustomEvent("videoCallEnded", { detail: { shiftId: activeCall.shift_id } })
          );
        }
      } else {
        toast.error(res.error || "Failed to end call", { id: toastId });
      }
    } catch (err) {
      console.error("[VideoCall] Error ending call:", err);
      toast.error("An unexpected error occurred", { id: toastId });
    } finally {
      setIsActionPending(false);
      if (zegoInstanceRef.current) {
        try {
          zegoInstanceRef.current.destroy();
        } catch { }
      }
      handleCleanupState();
    }
  };

  const inviteMember = async (memberId: string) => {
    if (!activeCall) return;

    const toastId = toast.loading("Sending invitation...");
    try {
      const res = await inviteMemberAction(activeCall.call_id, memberId);
      if (res.success) {
        toast.success("Invitation sent successfully", { id: toastId });
      } else {
        toast.error(res.error || "Failed to send invitation", { id: toastId });
      }
    } catch (err) {
      console.error("[VideoCall] Error sending invitation:", err);
      toast.error("An unexpected error occurred", { id: toastId });
    }
  };

  return (
    <VideoCallContext.Provider
      value={{
        activeCall,
        incomingCall,
        startCall,
        joinCall,
        declineIncomingCall,
        endCall,
        inviteMember,
        isMinimized,
        setIsMinimized,
        members,
      }}
    >
      {children}

      {activeCall && (
        <div
          className={cn(
            "fixed bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl z-[990] transition-all duration-300 overflow-hidden flex flex-col",
            isMinimized
              ? "bottom-4 right-4 w-72 h-14"
              : isFullscreen
                ? "inset-4"
                : "bottom-4 right-4 w-[90vw] sm:w-[500px] md:w-[720px] h-[600px] max-h-[calc(100dvh-2rem)]"
          )}
        >
          <div className="h-14 px-4 bg-slate-950 flex items-center justify-between border-b border-slate-800 select-none shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center">
                <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse mr-1" />
                <span className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  Live Call {activeCall?.shift_no && <span className="text-[#e2e8f0] opacity-90">#SH-{activeCall.shift_no}</span>}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setIsMinimized(!isMinimized);
                  setIsFullscreen(false);
                }}
                className="p-2 text-slate-700 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                title={isMinimized ? "Maximize Window" : "Minimize Window"}
              >
                {isMinimized ? (
                  <Maximize2 className="w-4 h-4" />
                ) : (
                  <Minus className="w-4 h-4" />
                )}
              </button>

              {!isMinimized && (
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-2 text-slate-700 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                  title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          </div>

          <div
            className={cn(
              "w-full flex-1 relative bg-slate-950 min-h-0 overflow-hidden",
              isMinimized ? "hidden" : "block"
            )}
          >
            {isZegoLoading && (
              <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center space-y-3 z-10">
                <Loader2 className="w-8 h-8 text-[#0064cb] animate-spin" />
                <span className="text-slate-700 font-medium text-xs">
                  Connecting to secure server...
                </span>
              </div>
            )}
            <div ref={zegoContainerRef} className="w-full h-full text-white" />
          </div>

        </div>
      )}
    </VideoCallContext.Provider>
  );
}

export function useVideoCall() {
  const context = useContext(VideoCallContext);
  if (context === undefined) {
    throw new Error("useVideoCall must be used within a VideoCallProvider");
  }
  return context;
}
