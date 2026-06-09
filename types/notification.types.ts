export interface Notification {
    id: string;
    title: string;
    message: string;
    is_seen: boolean;
    created_at: string;
    data: {
        type: string;
        shift_id?: string;
        invoice_id?: string;
        view?: string;
    };
    status: string;
}

export interface NotificationResponse {
    success: boolean;
    data: Notification[];
    pagination: {
        page: number;
        limit: number;
        total: number;
    };
    unread_count: number;
}
