"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { startVideoCallAction, endVideoCallAction } from "@/actions/vc.actions";

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

  const rawUserId = session?.user?.id || "";
  const USER_ID = toZimUserId(rawUserId);
  const USER_NAME = session?.user?.name || session?.user?.email || "Admin";

  useEffect(() => {
    // Wait until session is fully loaded and we have a valid USER_ID
    if (typeof window === "undefined" || status === "loading" || !USER_ID) return;

    const initZego = async () => {
      try {
        const { ZIM } = await import("zego-zim-web");
        const { ZegoUIKitPrebuilt } = await import("@zegocloud/zego-uikit-prebuilt");

        // The token must have a room ID for ZegoUIKitPrebuilt's kit token generator.
        const token = ZegoUIKitPrebuilt.generateKitTokenForTest(
          APP_ID,
          APP_SIGN,
          "admin_dashboard_room",
          USER_ID,
          USER_NAME,
        );

        const zp = ZegoUIKitPrebuilt.create(token);

        // Let ZegoUIKitPrebuilt handle the ZIM login and Call Invitation UI automatically!
        zp.addPlugins({ ZIM });

        const handleCallEnd = () => {
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

        zp.setCallInvitationConfig({
          enableNotifyWhenAppRunningInBackgroundOrQuit: true,
          ringtoneConfig: {
            incomingCallUrl: '',
            outgoingCallUrl: ''
          },
          onCallInvitationEnded: handleCallEnd,
          onOutgoingCallDeclined: handleCallEnd,
          onOutgoingCallTimeout: handleCallEnd,
          onOutgoingCallRejected: handleCallEnd,
        });

        setZpInstance(zp);
        console.log("[ZegoUIKit] Call invitation plugins added successfully for user:", USER_ID);
      } catch (err: any) {
        console.error("Failed to initialize Zego plugins", err);
      }
    };

    initZego();

  }, [USER_ID, USER_NAME, status]);

  const startCall = async (guardId: string, shiftId?: string, type: number = 1) => {
    if (!zpInstance) {
      toast.error("Call service is still initializing. Please try again.");
      return;
    }

    if (!guardId) {
      toast.error("No guard selected to call.");
      return;
    }

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
      } catch (err: any) {
        toast.dismiss(toastId);
        toast.error(`Error connecting to call service: ${err.message}`);
        return;
      }
    }

    try {
      const zimGuardId = toZimUserId(guardId);

      const res = await zpInstance.sendCallInvitation({
        callees: [{ userID: zimGuardId, userName: "Guard" }],
        callType: type === 1 ? 1 : 0, // 1 is Video, 0 is Voice in ZegoUIKitPrebuilt
        timeout: 60,
        notificationConfig: {
          resourcesID: "zego_call", // Must exactly match the Resource ID in Zego Console
          title: type === 1 ? "Incoming Video Call" : "Incoming Voice Call",
          message: "Admin is calling",
        }
      });

      console.log(`Call invitation sent to ${zimGuardId}`, res);

      if (res.errorInvitees && res.errorInvitees.length > 0) {
        toast.error(`Guard is offline or unavailable.`);
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
    }
  };

  const endCall = async () => {
    // End call UI is handled natively by ZegoUIKitPrebuilt
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


