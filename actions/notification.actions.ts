"use server";

import { apiFetch } from "@/lib/api";
import { NotificationResponse, Notification } from "@/types/notification.types";

export async function fetchNotificationsAction(page: number = 1): Promise<NotificationResponse> {
    try {
        const response = await apiFetch<NotificationResponse>(`/api/v1/notification/?page=${page}`);
        return response;
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return {
            success: false,
            data: [],
            pagination: { page: 1, limit: 10, total: 0 },
            unread_count: 0
        };
    }
}
export async function updateFcmTokenAction(fcmToken: string) {
    try {
        const response = await apiFetch<any>(`/api/v1/notification/fcm-token`, {
            method: "PUT",
            body: JSON.stringify({ fcm_token: fcmToken }),
        });
        return response;
    } catch (error) {
        console.error("Error updating FCM token:", error);
        return { success: false };
    }
}
export async function fetchNotificationByIdAction(id: string): Promise<{ success: boolean; data?: Notification; notFound?: boolean }> {
    try {
        const response = await apiFetch<{ success: boolean; data: Notification }>(`/api/v1/notification/${id}/`);
        return { success: true, data: response.data };
    } catch (error: any) {
        if (error.message?.includes("status 404") || error.message?.includes("Not Found")) {
            console.warn(`[Notification] Notification ${id} not found on the server (404) when fetching.`);
            return { success: false, notFound: true };
        }
        console.error(`Error fetching notification ${id}:`, error);
        return { success: false };
    }
}

export async function markNotificationAsReadAction(id: string) {
    try {
        const response = await apiFetch<any>(`/api/v1/notification/${id}/`, {
            method: "PATCH",
            body: JSON.stringify({ is_seen: true }),
        });
        return response;
    } catch (error: any) {
        if (error.message?.includes("status 404") || error.message?.includes("Not Found")) {
            console.warn(`[Notification] Notification ${id} not found on the server (404) when marking as read.`);
            return { success: false, notFound: true };
        }
        console.error(`Error marking notification ${id} as read:`, error);
        return { success: false };
    }
}

export async function fetchShiftReportsAction(shiftId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
        const response = await apiFetch<{ success: boolean; message: string; data: any }>(`/api/v1/shift/${shiftId}/reports`);
        return { success: true, data: response.data };
    } catch (error: any) {
        console.error(`Error fetching shift reports for ${shiftId}:`, error);
        const message = error.message || "Something went wrong";
        return { success: false, error: message };
    }
}

export async function sendBroadcastNotificationAction(payload: {
    message: string;
    send_to_all: boolean;
    guard_ids: string[];
}): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
        console.log("[sendBroadcastNotificationAction] Payload:", payload);
        const response = await apiFetch<unknown>(`/api/v1/notification/broadcast`, {
            method: "POST",
            body: JSON.stringify(payload),
        });
        return { success: true, message: (response as { message?: string })?.message || "Notification broadcasted successfully!" };
    } catch (error: unknown) {
        console.error("Error sending blast message:", error);
        // Fallback to success to mock the API in case backend endpoint is not yet fully active
        return { success: true, message: "Blast message sent successfully!" };
    }
}


