"use client";

import { useEffect, useRef } from "react";
import { generateToken, onMessageListener } from "@/lib/firebase";
import { toast } from "sonner";
import { useSession } from "next-auth/react";


import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function NotificationProvider() {
    const router = useRouter();
    const { data: session, status } = useSession();

    useEffect(() => {
        console.log("[NotificationProvider] Status change:", status);
        
        if (status !== "authenticated") return;

        console.log("[NotificationProvider] Authenticated! Syncing FCM...");

        // Request token on mount
        const handleToken = async () => {
            const token = await generateToken();
            if (token) {
                console.log("[NotificationProvider] FCM Token generated.");
                const lastToken = localStorage.getItem("last_fcm_token");
                if (lastToken === token) {
                    console.log("[NotificationProvider] FCM Token already synced.");
                } else {
                    const res = await fetch("/api/fcm-token", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ fcm_token: token }),
                    });

                    if (res.ok) {
                        localStorage.setItem("last_fcm_token", token);
                        console.log("[NotificationProvider] FCM Token synced to server.");
                    }
                }
            }
        };

        handleToken();

        // Set up foreground message listener
        const unsubscribe = onMessageListener((payload) => {
            console.log("Foreground message received:", payload);
            if (payload?.notification) {
                toast.custom((t) => (
                    <div className={cn(
                        "w-[380px] bg-white/95 backdrop-blur-md border border-slate-200 shadow-2xl rounded-2xl p-4 flex gap-4 items-start animate-in fade-in slide-in-from-right-8 duration-500",
                        t.visible ? "opacity-100" : "opacity-0"
                    )}>
                        <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0064cb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-[14px] font-bold text-slate-800 leading-tight">
                                {payload.notification.title || "New Notification"}
                            </h4>
                            <p className="text-[12px] text-slate-500 font-medium mt-1 leading-normal">
                                {payload.notification.body || "You have a new message."}
                            </p>
                            <div className="flex items-center gap-3 mt-3">
                                <button
                                    onClick={() => {
                                        toast.dismiss(t.id);
                                        const notificationId = payload.data?.notification_id;
                                        if (notificationId) {
                                            router.push(`/notifications/view?id=${notificationId}`);
                                        } else {
                                            router.push(`/notifications/view`);
                                        }
                                    }}
                                    className="px-4 py-1.5 bg-[#0064cb] hover:bg-[#0052ae] text-white text-[11px] font-bold rounded-lg transition-all shadow-sm active:scale-95"
                                >
                                    View Details
                                </button>
                                <button
                                    onClick={() => toast.dismiss(t.id)}
                                    className="text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>
                        <button 
                            onClick={() => toast.dismiss(t.id)}
                            className="text-slate-300 hover:text-slate-500 transition-colors mt-0.5"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </button>
                    </div>
                ), { duration: 5000 });
            }
        });

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [router, status]);

    return null;
}