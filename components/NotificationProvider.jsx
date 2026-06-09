"use client";

import { useEffect } from "react";
import { generateToken, onMessageListener } from "@/lib/firebase";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { fetchNotificationByIdAction } from "@/actions/notification.actions";

export default function NotificationProvider() {
    const router = useRouter();
    const { status } = useSession();

    useEffect(() => {
        console.log("[NotificationProvider] Status change:", status);

        if (typeof window !== "undefined") {
            console.log("[NotificationProvider] Current Permission:", Notification.permission);
        }

        if (status !== "authenticated") return;

        console.log("[NotificationProvider] Authenticated! Syncing FCM...");
        const handleToken = async () => {
            const token = await generateToken();
            if (token) {
                console.log("[NotificationProvider] FCM Token generated. Syncing with server...");
                try {
                    const res = await fetch("/api/fcm-token", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ fcm_token: token }),
                    });

                    if (res.ok) {
                        localStorage.setItem("last_fcm_token", token);
                        console.log("[NotificationProvider] FCM Token synced to server successfully.");
                    } else {
                        console.warn("[NotificationProvider] Failed to sync FCM token to server, status:", res.status);
                    }
                } catch (err) {
                    console.error("[NotificationProvider] Error syncing FCM token to server:", err);
                }
            }
        };

        handleToken();

        const unsubscribe = onMessageListener((payload) => {
            console.log("[NotificationProvider] Foreground message received:", payload);
            if (payload?._focusRefresh) return;
            const title = payload?.notification?.title || payload?.data?.title || "New Notification";
            const body = payload?.notification?.body || payload?.data?.body || payload?.notification?.message || payload?.data?.message || payload?.message || "You have a new message.";
            const notificationId = payload?.data?.notification_id || payload?.data?.notificationId || payload?.data?.id || payload?.id || payload?.notification_id || payload?.notificationId;
            const shiftId = payload?.data?.shift_id || payload?.data?.shiftId || payload?.shift_id || payload?.shiftId;
            const invoiceId = payload?.data?.invoice_id || payload?.data?.invoiceId || payload?.invoice_id || payload?.invoiceId;
            const view = payload?.data?.view || payload?.view;

            console.log("[NotificationProvider] Processing toast:", { title, body, notificationId, shiftId, invoiceId, view });

            if (title || body) {
                toast(title, {
                    description: body,
                    duration: 8000,
                    icon: (
                        <div className="h-6 w-6 rounded-full bg-[#0064cb]/10 flex items-center justify-center shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0064cb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                        </div>
                    ),
                    /* action: {
                        label: "View Details",
                        onClick: async () => {
                let targetShiftId = shiftId;
                let targetInvoiceId = invoiceId;
                let targetView = view;
                            if ((!targetShiftId || !targetView || !targetInvoiceId) && notificationId) {
                    try {
                        const res = await fetchNotificationByIdAction(notificationId);
                                    if (res.success) {
                                        if (res.data?.data?.shift_id) {
                                targetShiftId = res.data.data.shift_id;
                            }
                                        if (res.data?.data?.invoice_id) {
                                targetInvoiceId = res.data.data.invoice_id;
                            }
                                        if (res.data?.data?.view) {
                                targetView = res.data.data.view;
                            }
                        }
                    } catch (err) {
                        console.error("Failed to fetch notification details:", err);
                    }
                }

                if (targetView === "shift_invoice_view" && targetInvoiceId && notificationId) {
                    router.push(`/invoices/${targetInvoiceId}?notification_id=${notificationId}`);
                } else if (targetShiftId && notificationId) {
                    router.push(`/notifications/view?shift_id=${targetShiftId}&notification_id=${notificationId}`);
                } else if (targetShiftId) {
                    router.push(`/notifications/view?shift_id=${targetShiftId}`);
                } else if (notificationId) {
                    router.push(`/notifications/view?notification_id=${notificationId}`);
                } else {
                    router.push(`/notifications/view`);
                }
                        },
                    }, */
                    cancel: {
                        label: "Dismiss",
                        onClick: () => toast.dismiss(),
                    },
                    actionButtonStyle: {
                        background: '#0064cb',
                        color: 'white',
                    },
                    style: {
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        padding: '12px 16px',
                    },
                    className: "group font-montserrat",
                });

                // Show Google Notification toaster (native browser notification)
                if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
                    try {
                        const nativeNotification = new Notification(title, {
                            body: body,
                            icon: "/images/website-logo.png",
                        });

                        nativeNotification.onclick = () => {
                            window.focus();
                            let targetShiftId = shiftId;
                            let targetInvoiceId = invoiceId;
                            let targetView = view;

                            if (targetView === "shift_invoice_view" && targetInvoiceId && notificationId) {
                                router.push(`/invoices/${targetInvoiceId}?notification_id=${notificationId}`);
                            } else if (targetShiftId && notificationId) {
                                router.push(`/notifications/view?shift_id=${targetShiftId}&notification_id=${notificationId}`);
                            } else if (targetShiftId) {
                                router.push(`/notifications/view?shift_id=${targetShiftId}`);
                            } else if (notificationId) {
                                router.push(`/notifications/view?notification_id=${notificationId}`);
                            } else {
                                router.push(`/notifications/view`);
                            }
                        };
                    } catch (err) {
                        console.error("Failed to show native browser notification:", err);
                    }
                }
            }
        });

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [router, status]);

    return null;
}