"use client";

import { useEffect } from "react";
import { generateToken, onMessageListener } from "@/lib/firebase";
import { toast } from "sonner";

import { updateFcmTokenAction } from "@/actions/notification.actions";

export default function NotificationProvider() {
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
                toast.success(payload.notification.title || "New Notification", {
                    description: payload.notification.body || "",
                    duration: 5000,
                });
            }
        });
    }, []);

    return null;
}