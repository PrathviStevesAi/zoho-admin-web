"use server";

import { apiFetch } from "@/lib/api";

export interface TwilioStartVideoCallPayload {
  shift_id: string;
  guard_id: string;
}

export interface TwilioStartVideoCallResponse {
  success: boolean;
  message?: string;
  room_name?: string;
  token?: string;
  error?: string;
}

export interface TwilioEndVideoCallPayload {
  shift_id: string;
  user_id?: string;
  status?: string;
}

export interface TwilioEndVideoCallResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export async function startVideoCallAction(
  payload: TwilioStartVideoCallPayload
): Promise<TwilioStartVideoCallResponse> {
  try {
    const res = await apiFetch<any>(`/api/v1/twilio/video/start`, {
      method: "POST",
      body: JSON.stringify({
        shift_id: payload.shift_id,
        guard_id: payload.guard_id,
      }),
    });
    return {
      success: true,
      message: res.message || "Video call initiated.",
      room_name: res.room_name,
      token: res.token,
    };
  } catch (error: any) {
    const message = error.message || "Failed to start video call";
    return { success: false, error: message };
  }
}

export async function endVideoCallAction(
  payload: TwilioEndVideoCallPayload
): Promise<TwilioEndVideoCallResponse> {
  try {
    const res = await apiFetch<any>(`/api/v1/twilio/video/end`, {
      method: "POST",
      headers: {
        "x-api-key": "trk_live_7f9c2a4d8b1e5f6a9c3d2e7f8a1b4c6d",
      },
      body: JSON.stringify({
        shift_id: payload.shift_id,
        user_id: payload.user_id || "",
        status: payload.status || "ended",
      }),
    });
    return {
      success: true,
      message: typeof res === "string" ? res : res?.message || "Video call ended successfully.",
    };
  } catch (error: any) {
    const message = error.message || "Failed to end video call";
    return { success: false, error: message };
  }
}
