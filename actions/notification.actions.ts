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
export async function fetchNotificationByIdAction(id: string): Promise<{ success: boolean; data?: Notification }> {
    try {
        const response = await apiFetch<Notification>(`/api/v1/notification/${id}/`);
        return { success: true, data: response };
    } catch (error) {
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
    } catch (error) {
        console.error(`Error marking notification ${id} as read:`, error);
        return { success: false };
    }
}
