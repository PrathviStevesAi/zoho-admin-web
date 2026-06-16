"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  UserPlus,
  X,
  Minimize2,
  Maximize2,
  Loader2,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";

// Server Actions
import {
  startVideoCallAction,
  joinVideoCallAction,
  activeVideoCallsAction,
  inviteMemberAction,
  leaveVideoCallAction,
  endVideoCallAction
} from "@/actions/vc.actions";
import { fetchMembersAction } from "@/actions/auth.actions";

interface VideoCallContextType {
  activeCall: any | null;
  incomingCall: any | null;
  startCall: (shiftId: string) => Promise<void>;
  joinCall: (callId: string) => Promise<void>;
  declineIncomingCall: () => void;
  leaveCall: () => Promise<void>;
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
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [isZegoLoading, setIsZegoLoading] = useState(false);
  const [isActionPending, setIsActionPending] = useState(false);

  const zegoContainerRef = useRef<HTMLDivElement | null>(null);
  const zegoInstanceRef = useRef<any | null>(null);

  // 0. Suppress Zego SDK unmount telemetry bug (createSpan of null)
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

    // Monkey-patch console.error to intercept React's internal logging of unhandled lifecycle exceptions
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      const argStr = args.map(a => {
        if (!a) return "";
        if (a instanceof Error) return a.stack || a.message;
        if (typeof a === "object") {
          try { return JSON.stringify(a); } catch (e) { return String(a); }
        }
        return String(a);
      }).join(" ");

      if (argStr.includes("createSpan") || argStr.includes("Cannot read properties of null (reading 'createSpan')")) {
        console.warn("[VideoCall] Suppressed Zego SDK unmount console.error:", ...args);
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

  // 1. Fetch active calls and team members on auth load
  useEffect(() => {
    if (authStatus !== "authenticated") return;

    // Load members
    fetchMembersAction().then((res) => {
      if (res.success && res.data) {
        setMembers(res.data);
      }
    });

    // Check for active calls
    const checkActiveCalls = async () => {
      try {
        const res = await activeVideoCallsAction();
        if (res.success && res.data && res.data.length > 0) {
          const call = res.data[0];
          console.log("[VideoCall] Active call detected on mount:", call);

          // Verify if we are already in this call or if we should display invitation popup
          // (Incoming call popup disabled as only admins & members initiate calls)
        }
      } catch (err) {
        console.error("Failed to fetch active calls on mount:", err);
      }
    };

    checkActiveCalls();
  }, [authStatus]);

  // 2. Listen to custom FCM event for foreground incoming video calls
  useEffect(() => {
    if (typeof window === "undefined") return;

    // FCM event listener for incoming calls disabled as only admins & members initiate calls
  }, []);

  // 3. Initialize Zego Room when activeCall is set and zegoContainerRef is available
  useEffect(() => {
    if (!activeCall || !zegoContainerRef.current) return;

    let active = true;

    const initZego = async () => {
      setIsZegoLoading(true);
      try {
        // Dynamically import Zego to prevent SSR compilation errors
        const { ZegoUIKitPrebuilt } = await import("@zegocloud/zego-uikit-prebuilt");

        if (!active) return;

        // Always generate Zego Kit Token on client to prevent credential mismatches with backend ngrok environment
        console.log("[VideoCall] Generating Zego Kit Token on client...");
        const appID = Number(process.env.NEXT_PUBLIC_ZEGO_APP_ID || 727438037);
        const serverSecret = process.env.NEXT_PUBLIC_ZEGO_SERVER_SECRET || "dd1d31a37620b0d4a6cc9c237a7cd370";
        const roomID = activeCall.room_id;
        const userID = activeCall.user_id || session?.user?.id || `user_${Math.floor(Math.random() * 10000)}`;
        const userName = session?.user?.name || session?.user?.email || "Administrator";

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
          token: finalToken ? `${finalToken.slice(0, 20)}...` : "null"
        });

        const zp = ZegoUIKitPrebuilt.create(finalToken);
        zegoInstanceRef.current = zp;

        zp.joinRoom({
          container: zegoContainerRef.current,
          sharedLinks: [
            {
              name: "Join Link",
              url: `${window.location.origin}/shift/view?shift_id=${activeCall.shift_id}`
            }
          ],
          scenario: {
            mode: ZegoUIKitPrebuilt.GroupCall,
          },
          showPreJoinView: false,
          turnOnCameraWhenJoining: false,
          turnOnMicrophoneWhenJoining: false,
          showScreenSharingButton: true,
          showUserList: true,
          showLayoutButton: true,
          onLeaveRoom: () => {
            console.log("[VideoCall] Left Zego room callback");
            // If user leaves through Zego built-in leave, clean up call state
            handleCleanupState();
          }
        });
      } catch (err) {
        console.error("Zego initialization error:", err);
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
    setIsInviteOpen(false);
    zegoInstanceRef.current = null;
  };

  // --- ACTIONS ---

  // Start video call
  const startCall = async (shiftId: string) => {
    if (activeCall) {
      toast.warning("You are already in an active call");
      return;
    }

    setIsActionPending(true);
    const toastId = toast.loading("Initiating video call...");
    try {
      const res = await startVideoCallAction(shiftId);
      if (res.success && res.data) {
        // Fallback: If token is mock or invalid (doesn't start with Zego kit token signature '04'), call join to get real token
        const isTokenMock = !res.data.token || res.data.token === "zego_token" || !res.data.token.startsWith("04");

        if (isTokenMock) {
          console.log("[VideoCall] Received mock token from start call, automatically joining to fetch real Zego token...");
          const joinRes = await joinVideoCallAction(res.data.call_id);
          if (joinRes.success && joinRes.data) {
            toast.success("Call room created and joined successfully", { id: toastId });
            setActiveCall({
              ...joinRes.data,
              shift_id: shiftId
            });
          } else {
            toast.error(joinRes.error || "Failed to fetch Zego token via join endpoint", { id: toastId });
          }
        } else {
          toast.success("Call room created successfully", { id: toastId });
          setActiveCall({
            ...res.data,
            shift_id: shiftId
          });
        }
      } else {
        toast.error(res.error || "Failed to start call", { id: toastId });
      }
    } catch (err) {
      console.error("Error starting video call:", err);
      toast.error("An unexpected error occurred", { id: toastId });
    } finally {
      setIsActionPending(false);
    }
  };

  // Join existing call
  const joinCall = async (callId: string) => {
    setIsActionPending(true);
    const toastId = toast.loading("Connecting to call...");
    try {
      const res = await joinVideoCallAction(callId);
      if (res.success && res.data) {
        toast.success("Connected!", { id: toastId });
        setActiveCall({
          ...res.data,
          shift_id: incomingCall?.shift_id || ""
        });
        setIncomingCall(null);
      } else {
        toast.error(res.error || "Failed to join call", { id: toastId });
      }
    } catch (err) {
      console.error("Error joining video call:", err);
      toast.error("An unexpected error occurred", { id: toastId });
    } finally {
      setIsActionPending(false);
    }
  };

  // Decline/Dismiss incoming call
  const declineIncomingCall = () => {
    setIncomingCall(null);
    toast.info("Call invitation dismissed");
  };

  // Leave active call (current user only)
  const leaveCall = async () => {
    if (!activeCall) return;

    setIsActionPending(true);
    const toastId = toast.loading("Leaving call...");
    try {
      const res = await leaveVideoCallAction(activeCall.call_id);
      if (res.success) {
        toast.success(res.message || "You left the call", { id: toastId });
        if (zegoInstanceRef.current) {
          try {
            zegoInstanceRef.current.destroy();
          } catch (e) { }
        }
        handleCleanupState();
      } else {
        toast.error(res.error || "Failed to leave call", { id: toastId });
      }
    } catch (err) {
      console.error("Error leaving call:", err);
      toast.error("An unexpected error occurred", { id: toastId });
    } finally {
      setIsActionPending(false);
    }
  };

  // End active call (for everyone)
  const endCall = async () => {
    if (!activeCall) return;

    setIsActionPending(true);
    const toastId = toast.loading("Ending call for everyone...");
    try {
      const res = await endVideoCallAction(activeCall.call_id);
      if (res.success) {
        toast.success(res.message || "Call ended successfully", { id: toastId });
        if (zegoInstanceRef.current) {
          try {
            zegoInstanceRef.current.destroy();
          } catch (e) { }
        }
        handleCleanupState();
      } else {
        toast.error(res.error || "Failed to end call", { id: toastId });
      }
    } catch (err) {
      console.error("Error ending call:", err);
      toast.error("An unexpected error occurred", { id: toastId });
    } finally {
      setIsActionPending(false);
    }
  };

  // Invite another administrator/member to call
  const inviteMember = async (memberId: string) => {
    if (!activeCall) return;

    const toastId = toast.loading("Sending invitation...");
    try {
      const res = await inviteMemberAction(activeCall.call_id, memberId);
      if (res.success) {
        toast.success("Invitation sent successfully", { id: toastId });
        setIsInviteOpen(false);
      } else {
        toast.error(res.error || "Failed to send invitation", { id: toastId });
      }
    } catch (err) {
      console.error("Error sending invitation:", err);
      toast.error("An unexpected error occurred", { id: toastId });
    }
  };

  // 4. Auto end call after 60 seconds
  useEffect(() => {
    if (!activeCall) return;

    console.log("[VideoCall] Setting auto-end timer for 60 seconds for call ID:", activeCall.call_id);

    const timer = setTimeout(() => {
      console.log("[VideoCall] 60 seconds elapsed. Auto-ending call...");
      toast.info("Call auto-ended after 60 seconds");
      endCall();
    }, 60000);

    return () => {
      console.log("[VideoCall] Clearing auto-end timer for call ID:", activeCall?.call_id);
      clearTimeout(timer);
    };
  }, [activeCall?.call_id]);

  return (
    <VideoCallContext.Provider value={{
      activeCall,
      incomingCall,
      startCall,
      joinCall,
      declineIncomingCall,
      leaveCall,
      endCall,
      inviteMember,
      isMinimized,
      setIsMinimized,
      members
    }}>
      {children}



      {/* --- ACTIVE FLOATING VIDEO CALL OVERLAY --- */}
      {activeCall && (
        <div
          className={cn(
            "fixed bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl z-[990] transition-all duration-300 overflow-hidden flex flex-col",
            isMinimized
              ? "bottom-4 right-4 w-72 h-14"
              : "bottom-4 right-4 w-[90vw] sm:w-[450px] md:w-[640px] h-[500px]"
          )}
        >
          {/* Active Call Header */}
          <div className="h-14 px-4 bg-slate-950 flex items-center justify-between border-b border-slate-800 select-none shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center">
                <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse mr-1" />
                <span className="text-white text-xs font-bold uppercase tracking-wider">Live Call</span>
              </div>
              <span className="text-slate-700 text-xs font-bold hidden sm:inline">|</span>
              <span className="text-slate-700 text-xs font-medium">Shift ID: #{activeCall.shift_id.slice(0, 8)}...</span>
            </div>

            {/* Header Control Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsInviteOpen(!isInviteOpen)}
                className="p-2 text-slate-700 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                title="Invite Member"
              >
                <UserPlus className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-2 text-slate-700 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                title={isMinimized ? "Maximize Window" : "Minimize Window"}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={leaveCall}
                disabled={isActionPending}
                className="p-2 text-slate-700 hover:text-red-500 hover:bg-white/10 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                title="Leave Call"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Members Invite Popover Panel */}
          {isInviteOpen && !isMinimized && (
            <div className="absolute top-14 left-0 right-0 max-h-[200px] overflow-y-auto bg-slate-950 border-b border-slate-800 z-50 p-3 space-y-2 custom-scrollbar">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Invite Team Members
                </span>
                <button
                  onClick={() => setIsInviteOpen(false)}
                  className="text-slate-700 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-1">
                {members.length === 0 ? (
                  <p className="text-xs text-slate-700 italic text-center py-2">No other members available</p>
                ) : (
                  members
                    .filter(m => m.id !== activeCall.user_id && m.member_id !== activeCall.user_id)
                    .map((member) => (
                      <div key={member.id || member.member_id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                        <span className="text-xs text-white font-medium">
                          {member.first_name} {member.last_name} ({member.email})
                        </span>
                        <button
                          onClick={() => inviteMember(member.id || member.member_id)}
                          disabled={isActionPending}
                          className="bg-[#0064cb] hover:bg-[#0052ae] text-white px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-colors disabled:opacity-50"
                        >
                          Invite
                        </button>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}

          {/* ZEGO Cloud SDK DOM Node Container */}
          <div className={cn("w-full flex-1 relative bg-slate-950", isMinimized ? "hidden" : "block")}>
            {isZegoLoading && (
              <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center space-y-3 z-10">
                <Loader2 className="w-8 h-8 text-[#0064cb] animate-spin" />
                <span className="text-slate-700 font-medium text-xs">Connecting to secure server...</span>
              </div>
            )}
            <div ref={zegoContainerRef} className="w-full h-full text-white" />
          </div>

          {/* Call Footer (End Call action button for active call) */}
          {!isMinimized && (
            <div className="h-14 bg-slate-950 border-t border-slate-800 px-4 flex items-center justify-end gap-3 shrink-0">
              <button
                onClick={leaveCall}
                disabled={isActionPending}
                className="bg-slate-700 hover:bg-slate-600 text-white px-4 h-9 rounded-lg text-xs font-bold cursor-pointer transition-colors disabled:opacity-50"
              >
                Leave
              </button>
              <button
                onClick={endCall}
                disabled={isActionPending}
                className="bg-red-500 hover:bg-red-600 text-white px-4 h-9 rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-md shadow-red-900/10 disabled:opacity-50"
              >
                End Call
              </button>
            </div>
          )}
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
