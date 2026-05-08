export interface LoginResponse {
    success: boolean;
    data: {
        user_id: string;
    };
    access_token: string;
    refresh_token: string;
    role: string;
    message?: string;
}