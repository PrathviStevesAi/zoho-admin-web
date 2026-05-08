"use server";

import { apiFetch } from "@/lib/api";
import { NotificationResponse } from "@/types/notification.types";

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
