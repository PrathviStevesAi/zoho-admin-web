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
    title: string;
    message: string;
    send_in_app: boolean;
    send_sms: boolean;
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
        return { success: true, message: "Blast message sent successfully!" };
    }
}

export async function deleteNotificationsAction(notificationIds: string[]): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
        const response = await apiFetch<any>(`/api/v1/notification/`, {
            method: "DELETE",
            body: JSON.stringify({ notification_ids: notificationIds }),
        });
        return { success: true, message: response?.message || "Notifications removed" };
    } catch (error: any) {
        console.error(`Error deleting notifications:`, error);
        return { success: false, error: error.message || "Failed to delete notifications" };
    }
}

export interface BroadcastHistoryItem {
    id: string;
    source: string;
    message: string;
    send_at: string;
    recipients_count: number;
    sent_by?: string | { name?: string; role?: string } | null;
}

export interface BroadcastHistoryResponse {
    success: boolean;
    data: BroadcastHistoryItem[];
    pagination: {
        total: number;
        page: number;
        limit: number;
    };
    error?: string;
}

export async function fetchBroadcastHistoryAction(page: number = 1, limit: number = 20): Promise<BroadcastHistoryResponse> {
    try {
        const response = await apiFetch<BroadcastHistoryResponse>(
            `/api/v1/notification/broadcast?type=history&page=${page}&limit=${limit}`
        );
        return response;
    } catch (error: unknown) {
        console.error("Error fetching broadcast history:", error);
        return {
            success: false,
            data: [],
            pagination: { total: 0, page: 1, limit: 20 },
            error: (error as Error)?.message || "Failed to load broadcast history",
        };
    }
}

export interface BroadcastRecipientItem {
    id: string;
    name: string;
    email: string;
    address?: string;
    phone_number?: string;
}

export interface BroadcastRecipientsResponse {
    success: boolean;
    data: BroadcastRecipientItem[];
    pagination: {
        total: number;
        page: number;
        limit: number;
    };
    error?: string;
}

export async function fetchBroadcastRecipientsAction(
    messageId: string,
    page: number = 1,
    limit: number = 20
): Promise<BroadcastRecipientsResponse> {
    try {
        const response = await apiFetch<BroadcastRecipientsResponse>(
            `/api/v1/notification/broadcast?type=recipients&message_id=${messageId}&page=${page}&limit=${limit}`
        );
        return response;
    } catch (error: unknown) {
        console.error("Error fetching broadcast recipients:", error);
        return {
            success: false,
            data: [],
            pagination: { total: 0, page: 1, limit: 20 },
            error: (error as Error)?.message || "Failed to load broadcast recipients",
        };
    }
}


