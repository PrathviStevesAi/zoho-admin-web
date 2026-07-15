"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { startVideoCallAction, endVideoCallAction, activeVideoCallsAction } from "@/actions/vc.actions";

interface VideoCallContextType {
  startCall: (guardId: string, shiftId?: string, type?: number) => Promise<void>;
  endCall: () => void;
  isCalling: boolean;
  isCallAccepted: boolean;
}

const VideoCallContext = createContext<VideoCallContextType | undefined>(undefined);

const APP_ID = Number(process.env.NEXT_PUBLIC_ZEGO_APP_ID);
const APP_SIGN = process.env.NEXT_PUBLIC_ZEGO_SERVER_SECRET as string;

function toZimUserId(uuid: string): string {
  if (!uuid) return "";
  return uuid.replace(/-/g, "");
}

export function VideoCallProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  const [zpInstance, setZpInstance] = useState<any>(null);
  const activeShiftIdRef = useRef<string | null>(null);
  const guardHungUpRef = useRef<boolean>(false);

  const rawUserId = session?.user?.id || "";
  const USER_ID = toZimUserId(rawUserId);
  const USER_NAME = session?.user?.name || session?.user?.email || "Admin";

  const initZego = async () => {
    if (typeof window === "undefined" || status === "loading" || !USER_ID) return null;

    try {
      const { ZIM } = await import("zego-zim-web");
      const { ZegoUIKitPrebuilt } = await import("@zegocloud/zego-uikit-prebuilt");

      const token = ZegoUIKitPrebuilt.generateKitTokenForTest(
        APP_ID,
        APP_SIGN,
        "admin_dashboard_room",
        USER_ID,
        USER_NAME,
      );

      const zp = ZegoUIKitPrebuilt.create(token);

      zp.addPlugins({ ZIM });

      const handleApiEndCall = () => {
        if (activeShiftIdRef.current) {
          endVideoCallAction(activeShiftIdRef.current).catch(console.error);
          activeShiftIdRef.current = null;
        }
      };

      zp.setCallInvitationConfig({
        enableNotifyWhenAppRunningInBackgroundOrQuit: true,
        ringtoneConfig: {
          incomingCallUrl: '',
          outgoingCallUrl: ''
        },
        onSetRoomConfigBeforeJoining: (callType: any) => {
          return {
            onUserLeave: (users: any) => {
              console.log("Remote user left the room (Guard hung up)", users);
              guardHungUpRef.current = true;
            },
            onLeaveRoom: () => {
              console.log("Local user left the room");
              if (!guardHungUpRef.current) {
                // Admin clicked Hang up
                handleApiEndCall();
              } else {
                // Guard hung up first, so we just clear the local ref
                activeShiftIdRef.current = null;
              }
              guardHungUpRef.current = false;
            }
          };
        },
        onCallInvitationEnded: (reason: any, data: any) => {
          if (typeof reason === 'string' && reason === 'LeaveRoom') {
            // Handled by onLeaveRoom in room config
            return;
          }
          handleApiEndCall();
        },
        onOutgoingCallDeclined: handleApiEndCall,
        onOutgoingCallTimeout: handleApiEndCall,
        onOutgoingCallRejected: handleApiEndCall,
      });

      setZpInstance(zp);
      console.log("[ZegoUIKit] Call invitation plugins added successfully for user:", USER_ID);
      return zp;
    } catch (err: any) {
      console.error("Failed to initialize Zego plugins", err);
      return null;
    }
  };

  useEffect(() => {
    initZego();
  }, [USER_ID, USER_NAME, status]);

  const startCall = async (guardId: string, shiftId?: string, type: number = 1) => {
    let currentZp = zpInstance;
    if (!currentZp) {
      currentZp = await initZego();
    }
    
    if (!currentZp) {
      toast.error("Call service is still initializing. Please try again.");
      return;
    }

    if (!guardId) {
      toast.error("No guard selected to call.");
      return;
    }

    guardHungUpRef.current = false;

    let roomID = "";
    if (shiftId) {
      const toastId = toast.loading("Initializing call...");
      try {
        let apiRes = await startVideoCallAction(shiftId);
        
        if (!apiRes.success && apiRes.error?.toLowerCase().includes("already on call")) {
          // Attempt to clear stuck calls
          console.log("Detected stuck call state, attempting to auto-clear...");
          const activeCallsRes = await activeVideoCallsAction();
          if (activeCallsRes.success && Array.isArray(activeCallsRes.data)) {
            for (const call of activeCallsRes.data) {
              const stuckShiftId = call?.shift?.id || call?.shift_id || call?.id;
              if (stuckShiftId) {
                await endVideoCallAction(stuckShiftId).catch(console.error);
              }
            }
          }
          // Retry starting the call
          apiRes = await startVideoCallAction(shiftId);
        }

        toast.dismiss(toastId);
        if (!apiRes.success) {
          toast.error(`Failed to initialize call: ${apiRes.error}`);
          return;
        }
        activeShiftIdRef.current = shiftId;
        roomID = apiRes.data?.room_id || "";
      } catch (err: any) {
        toast.dismiss(toastId);
        toast.error(`Error connecting to call service: ${err.message}`);
        return;
      }
    }

    const zimGuardId = toZimUserId(guardId);
    const customDataPayload = JSON.stringify({ shift_id: shiftId || "" });
    const invitationConfig = {
      callees: [{ userID: zimGuardId, userName: "Guard" }],
      callType: type === 1 ? 1 : 0,
      timeout: 60,
      data: customDataPayload,
      notificationConfig: {
        resourcesID: "zego_call",
        title: type === 1 ? "Incoming Video Call" : "Incoming Voice Call",
        message: "Admin is calling",
      }
    };

    try {
      console.log("Zego Web Sending Call Invitation...");
      console.log("target guardId...", zimGuardId);
      console.log("customdata...", customDataPayload);
      console.log("full config...", invitationConfig);

      const res = await currentZp.sendCallInvitation(invitationConfig);

      console.log(`Call invitation sent to ${zimGuardId}`, res);

      if (res.errorInvitees && res.errorInvitees.length > 0) {
        toast.error(`Guard is offline or unavailable.`);
        if (shiftId) {
          endVideoCallAction(shiftId).catch(console.error);
          activeShiftIdRef.current = null;
        }
      }
    } catch (err: any) {
      console.warn("Failed to send call invitation (expected if offline)", err);

      let errorMsg = "Unknown error";
      try {
        const parsedErr = typeof err === "string" ? JSON.parse(err) : err;
        if (parsedErr.code === 6000281) {
          errorMsg = "The guard is currently offline or not logged into the app.";
        } else {
          errorMsg = parsedErr.message || "Failed to start call";
        }
      } catch (e) {
        errorMsg = err?.message || typeof err === "string" ? err : "Unknown error";
      }

      if (errorMsg.toLowerCase().includes("not logged")) {
        console.log("Zego connection stale, attempting to re-initialize and retry...");
        const toastId = toast.loading("Reconnecting to call service...");
        try {
          currentZp = await initZego();
          if (currentZp) {
             let retryRes;
             for (let attempt = 1; attempt <= 3; attempt++) {
               await new Promise(resolve => setTimeout(resolve, 1200));
               try {
                 retryRes = await currentZp.sendCallInvitation(invitationConfig);
                 break;
               } catch (e: any) {
                 const eMsg = e?.message || (typeof e === 'string' ? e : JSON.stringify(e));
                 if (eMsg.toLowerCase().includes("not logged") && attempt < 3) {
                    console.log(`Re-connection attempt ${attempt} failed, retrying...`);
                    continue;
                 }
                 throw e;
               }
             }

             toast.dismiss(toastId);
             console.log(`Retry call invitation sent to ${zimGuardId}`, retryRes);
             if (retryRes?.errorInvitees && retryRes.errorInvitees.length > 0) {
               toast.error(`Guard is offline or unavailable.`);
               if (shiftId) {
                 endVideoCallAction(shiftId).catch(console.error);
                 activeShiftIdRef.current = null;
               }
             }
             return;
          }
        } catch(retryErr: any) {
           toast.dismiss(toastId);
           console.error("Retry failed:", retryErr);
           errorMsg = retryErr?.message || "Failed to start call after reconnecting.";
        }
      }

      toast.error(`Failed to call guard: ${errorMsg}`);

      if (shiftId) {
        endVideoCallAction(shiftId).catch(console.error);
        activeShiftIdRef.current = null;
      }
    }
  };

  const endCall = async () => {
    if (activeShiftIdRef.current) {
      endVideoCallAction(activeShiftIdRef.current)
        .then((res) => {
          if (res.success) {
            toast.success(res.message || "Call ended successfully.");
          } else {
            toast.error(res.error || "Failed to record call end.");
          }
        })
        .catch(console.error);
      activeShiftIdRef.current = null;
    }
  };

  return (
    <VideoCallContext.Provider
      value={{
        startCall,
        endCall,
        isCalling: false,
        isCallAccepted: false
      }}
    >
      {children}
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


