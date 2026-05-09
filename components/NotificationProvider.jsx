"use client";

import { useEffect } from "react";
import { generateToken, onMessageListener } from "@/lib/firebase";
import { toast } from "sonner";

import { updateFcmTokenAction } from "@/actions/notification.actions";

import { useRouter } from "next/navigation";

export default function NotificationProvider() {
    const router = useRouter();

    useEffect(() => {
        // Request token on mount
        const handleToken = async () => {
            const token = await generateToken();
            if (token) {
                console.log("FCM Token generated, updating on server...");
                await updateFcmTokenAction(token);
            }
        };

        handleToken();

        // Set up foreground message listener
        onMessageListener((payload) => {
            console.log("Foreground message received:", payload);
            if (payload?.notification) {
                toast(payload.notification.title || "New Notification", {
                    description: payload.notification.body || "",
                    duration: 3000,
                    style: {
                        borderRadius: '16px',
                        padding: '16px',
                    },
                    icon: <div className="p-2 bg-blue-50 rounded-full text-blue-600 mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                    </div>,
                    action: {
                        label: "View",
                        onClick: () => {
                            const notificationId = payload.data?.notification_id;
                            if (notificationId) {
                                router.push(`/notifications/view?id=${notificationId}`);
                            } else {
                                router.push(`/notifications/view`);
                            }
                        },
                    },
                });
            }
        });
    }, [router]);

    return null;
}