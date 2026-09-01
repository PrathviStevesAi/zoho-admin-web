"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { startVideoCallAction, endVideoCallAction } from "@/actions/vc.actions";

interface VideoCallContextType {
  startCall: (guardId: string, shiftId?: string, type?: number, shiftZegoConfig?: any) => Promise<void>;
  endCall: () => void;
  isCalling: boolean;
  isCallAccepted: boolean;
}

const VideoCallContext = createContext<VideoCallContextType | undefined>(undefined);

function toZimUserId(uuid: string): string {
  if (!uuid) return "";
  return uuid.replace(/-/g, "");
}

export function VideoCallProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [zpInstance, setZpInstance] = useState<any>(null);
  const activeShiftIdRef = useRef<string | null>(null);
  const rawUserId = session?.user?.id || "";
  const USER_ID = toZimUserId(rawUserId);
  const USER_NAME = session?.user?.name || session?.user?.email || "Admin";
  const activeZegoAppIdRef = useRef<number | null>(null);

  const startCall = async (guardId: string, shiftId?: string, type: number = 1, shiftZegoConfig?: any) => {
    let currentZp = zpInstance;

    if (shiftZegoConfig && shiftZegoConfig.app_id) {
      const callAppId = Number(shiftZegoConfig.app_id);
      const callAppSign = shiftZegoConfig.server_secret;

      // Only re-initialize if the App ID is actually different
      if (callAppId !== activeZegoAppIdRef.current || !currentZp) {
        if (currentZp) {
          currentZp.destroy();
        }

        const toastId = toast.loading("Connecting to guard's calling service...");
        try {
          const { ZIM } = await import("zego-zim-web");
          const { ZegoUIKitPrebuilt } = await import("@zegocloud/zego-uikit-prebuilt");

          const token = ZegoUIKitPrebuilt.generateKitTokenForTest(
            callAppId,
            callAppSign,
            "admin_dashboard_room",
            USER_ID,
            USER_NAME,
          );

          currentZp = ZegoUIKitPrebuilt.create(token);
          currentZp.addPlugins({ ZIM });

          const handleCallEnd = (...args: any[]) => {
            console.log("[ZegoUIKit] Call ended/rejected. Event args:", ...args);
            if (currentZp && typeof currentZp.hangUp === "function") {
              try { currentZp.hangUp(); } catch (err) { }
            }
            if (activeShiftIdRef.current) {
              endVideoCallAction(activeShiftIdRef.current)
                .then((res) => {
                  if (res.success) {
                    toast.success(res.message || "Call ended successfully.");
                  }
                })
                .catch(console.error);
              activeShiftIdRef.current = null;
            }
          };

          currentZp.setCallInvitationConfig({
            enableNotifyWhenAppRunningInBackgroundOrQuit: true,
            ringtoneConfig: { incomingCallUrl: '', outgoingCallUrl: '' },
            onCallInvitationEnded: handleCallEnd,
            onOutgoingCallDeclined: handleCallEnd,
            onOutgoingCallTimeout: handleCallEnd,
            onOutgoingCallRejected: handleCallEnd,
            onSetRoomConfigBeforeJoining: () => ({
              onUserLeave: () => handleCallEnd()
            })
          });

          setZpInstance(currentZp);
          activeZegoAppIdRef.current = callAppId;
          await new Promise(resolve => setTimeout(resolve, 1000));

          toast.dismiss(toastId);
        } catch (err: any) {
          toast.dismiss(toastId);
          toast.error("Failed to initialize guard's calling service");
          return;
        }
      }
    }

    if (!currentZp) {
      toast.error("Call service is still initializing. Please try again.");
      return;
    }

    if (!guardId) {
      toast.error("No guard selected to call.");
      return;
    }

    let roomID = "";
    if (shiftId) {
      const toastId = toast.loading("Initializing call...");
      try {
        const apiRes = await startVideoCallAction(shiftId);
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

    try {
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
