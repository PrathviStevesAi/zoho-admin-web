"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { 
  Phone, 
  PhoneOff, 
  Video, 
  UserPlus, 
  X, 
  Minimize2, 
  Maximize2, 
  Loader2, 
  Users,
  VideoOff
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
          if (!activeCall && call.status === "initiated") {
            setIncomingCall({
              call_id: call.id,
              shift_id: call.shift_id,
              sender_name: "Security Guard"
            });
          }
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

    const handleIncomingCall = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      console.log("[VideoCall] Foreground FCM Event received:", detail);
      if (detail && detail.call_id) {
        setIncomingCall({
          call_id: detail.call_id,
          shift_id: detail.shift_id,
          sender_name: "Security Guard"
        });
      }
    };

    window.addEventListener("incoming-vc-call", handleIncomingCall);
    return () => {
      window.removeEventListener("incoming-vc-call", handleIncomingCall);
    };
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

        let finalToken = activeCall.token;
        const isValidToken = finalToken && finalToken !== "zego_token" && finalToken.startsWith("04");

        if (!isValidToken) {
          console.log("[VideoCall] ActiveCall token is mock or invalid. Generating Kit Token on client...");
          const appID = Number(process.env.NEXT_PUBLIC_ZEGO_APP_ID || 295132678);
          const serverSecret = process.env.NEXT_PUBLIC_ZEGO_SERVER_SECRET || "4f14aa5614176cc292e876da6fb92b6e";
          const roomID = activeCall.room_id;
          const userID = activeCall.user_id || session?.user?.id || `user_${Math.floor(Math.random() * 10000)}`;
          const userName = session?.user?.name || session?.user?.email || "Administrator";
          
          finalToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
            appID,
            serverSecret,
            roomID,
            userID,
            userName
          );
        }

        console.log("[VideoCall] Initializing Zego with details:", {
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
        toast.success("You left the call", { id: toastId });
        if (zegoInstanceRef.current) {
          try {
            zegoInstanceRef.current.destroy();
          } catch (e) {}
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
        toast.success("Call ended successfully", { id: toastId });
        if (zegoInstanceRef.current) {
          try {
            zegoInstanceRef.current.destroy();
          } catch (e) {}
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

      {/* --- INCOMING CALL MODAL POPUP --- */}
      {incomingCall && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[999] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm border border-slate-100 shadow-2xl flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 duration-300">
            <div className="relative">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 shadow-inner">
                <Video className="w-10 h-10 animate-bounce" />
              </div>
              <div className="absolute inset-0 rounded-full border-4 border-emerald-500/30 animate-ping" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-800">Incoming Video Call</h3>
              <p className="text-sm text-slate-700 font-medium">From: {incomingCall.sender_name || "Security Guard"}</p>
              <p className="text-xs text-slate-700">Shift ID: #{incomingCall.shift_id.slice(0, 8)}...</p>
            </div>

            <div className="flex w-full gap-4 pt-2">
              <button
                onClick={declineIncomingCall}
                disabled={isActionPending}
                className="flex-1 h-12 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-red-200 hover:shadow-lg hover:shadow-red-300 active:scale-95 transition-all disabled:opacity-50"
              >
                <PhoneOff className="w-5 h-5" />
                Decline
              </button>
              <button
                onClick={() => joinCall(incomingCall.call_id)}
                disabled={isActionPending}
                className="flex-1 h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-200 hover:shadow-lg hover:shadow-emerald-300 active:scale-95 transition-all disabled:opacity-50"
              >
                <Phone className="w-5 h-5" />
                Accept
              </button>
            </div>
          </div>
        </div>
      )}

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
                className="p-2 text-slate-700 hover:text-red-500 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
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
                          className="bg-[#0064cb] hover:bg-[#0052ae] text-white px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-colors"
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
                className="bg-slate-700 hover:bg-slate-600 text-white px-4 h-9 rounded-lg text-xs font-bold cursor-pointer transition-colors"
              >
                Leave
              </button>
              <button
                onClick={endCall}
                className="bg-red-500 hover:bg-red-600 text-white px-4 h-9 rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-md shadow-red-900/10"
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
