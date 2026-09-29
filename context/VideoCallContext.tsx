"use client";

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
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

const APP_ID = Number(process.env.NEXT_PUBLIC_ZEGO_APP_ID) || 1217831928;
const APP_SIGN = (process.env.NEXT_PUBLIC_ZEGO_SERVER_SECRET as string) || "4dc19d36df9dead9bff47a9ec0992d07";

function toZimUserId(uuid: string): string {
  if (!uuid) return `admin_${Math.floor(Math.random() * 10000)}`;
  return uuid.replace(/-/g, "");
}

export function VideoCallProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  const [isCallOpen, setIsCallOpen] = useState(false);
  const activeShiftIdRef = useRef<string | null>(null);
  const zpInstanceRef = useRef<any>(null);
  const callContainerRef = useRef<HTMLDivElement | null>(null);

  const rawUserId = session?.user?.id || "";
  const USER_ID = toZimUserId(rawUserId);
  const USER_NAME = session?.user?.name || session?.user?.email || "Admin";

  const handleCallEnd = useCallback(() => {
    const shiftId = activeShiftIdRef.current;
    if (shiftId) {
      endVideoCallAction(shiftId)
        .then((res) => {
          if (res.success) {
            toast.success(res.message || "Call ended successfully.");
          } else {
            toast.info("Call ended.");
          }
        })
        .catch(() => {
          toast.info("Call ended.");
        });
      activeShiftIdRef.current = null;
    } else {
      toast.info("Call ended.");
    }

    zpInstanceRef.current = null;

    // Small delay to allow Zego's internal telemetry & teardown to finish without throwing createSpan on null
    setTimeout(() => {
      setIsCallOpen(false);
      if (callContainerRef.current) {
        callContainerRef.current.innerHTML = "";
      }
    }, 150);
  }, []);

  const endCall = useCallback(() => {
    if (zpInstanceRef.current) {
      try {
        if (typeof zpInstanceRef.current.hangUp === "function") {
          zpInstanceRef.current.hangUp();
        } else if (typeof zpInstanceRef.current.destroy === "function") {
          zpInstanceRef.current.destroy();
        }
      } catch (err) {
        console.warn("Zego endCall:", err);
      }
    }
    handleCallEnd();
  }, [handleCallEnd]);

  const startCall = async (guardId: string, shiftId?: string, type: number = 1) => {
    let roomId = shiftId ? `shift_${shiftId.replace(/-/g, "")}` : `room_${Date.now()}`;

    if (shiftId) {
      activeShiftIdRef.current = shiftId;
      try {
        const apiRes = await startVideoCallAction(shiftId);
        if (apiRes.success && apiRes.data?.room_id) {
          roomId = apiRes.data.room_id;
        }
      } catch (err) {
        console.warn("startVideoCallAction warning:", err);
      }
    }

    setIsCallOpen(true);

    // Give DOM time to mount container
    setTimeout(async () => {
      try {
        const { ZegoUIKitPrebuilt } = await import("@zegocloud/zego-uikit-prebuilt");

        if (!callContainerRef.current) return;

        const token = ZegoUIKitPrebuilt.generateKitTokenForTest(
          APP_ID,
          APP_SIGN,
          roomId,
          USER_ID,
          USER_NAME
        );

        const zp = ZegoUIKitPrebuilt.create(token);
        zpInstanceRef.current = zp;

        zp.joinRoom({
          container: callContainerRef.current,
          scenario: {
            mode: ZegoUIKitPrebuilt.OneONoneCall,
          },
          showPreJoinView: false,
          turnOnMicrophoneWhenJoining: true,
          turnOnCameraWhenJoining: type === 1,
          showMyCameraToggleButton: true,
          showMyMicrophoneToggleButton: true,
          showAudioVideoSettingsButton: true,
          showScreenSharingButton: true,
          showTextChat: false,
          showUserList: false,
          maxUsers: 2,
          layout: "Auto",
          onLeaveRoom: () => {
            handleCallEnd();
          },
        });
      } catch (error: any) {
        console.error("Failed to join Zego call room:", error);
        toast.error("Failed to launch Zego Call screen.");
        setIsCallOpen(false);
      }
    }, 100);
  };

  useEffect(() => {
    return () => {
      if (zpInstanceRef.current) {
        try {
          zpInstanceRef.current.destroy();
        } catch (e) {
          console.warn("Cleanup error:", e);
        }
      }
    };
  }, []);

  return (
    <VideoCallContext.Provider
      value={{
        startCall,
        endCall,
        isCalling: isCallOpen,
        isCallAccepted: isCallOpen,
      }}
    >
      {children}

      {/* Native Zego Cloud Call Screen Modal */}
      {isCallOpen && (
        <div className="fixed inset-0 z-[999999] bg-black/90 flex flex-col items-center justify-center animate-in fade-in duration-200">
          <div
            ref={callContainerRef}
            className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden"
          />
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
