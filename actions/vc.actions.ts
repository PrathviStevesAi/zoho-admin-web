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

export async function joinVideoCallAction(
  payload: TwilioStartVideoCallPayload
): Promise<TwilioStartVideoCallResponse> {
  try {
    const res = await apiFetch<any>(`/api/v1/twilio/video/join`, {
      method: "POST",
      headers: {
        "x-api-key": "trk_live_7f9c2a4d8b1e5f6a9c3d2e7f8a1b4c6d",
      },
      body: JSON.stringify({
        shift_id: payload.shift_id,
        guard_id: payload.guard_id,
      }),
    });
    return {
      success: true,
      message: res.message || "Video call joined.",
      room_name: res.room_name,
      token: res.token,
    };
  } catch (error: any) {
    const message = error.message || "Failed to join video call";
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

export interface ActiveVideoCallData {
  id?: string;
  shift_id?: string;
  started_by?: string;
  status?: string;
  initiated_at?: string;
  ended_at?: string | null;
  shift_no?: number | string;
  guard_id?: string;
}

export interface GetActiveVideoCallResponse {
  success: boolean;
  has_active_call: boolean;
  data?: ActiveVideoCallData | null;
  error?: string;
}

import { auth } from "@/lib/auth";

export async function getActiveVideoCallAction(): Promise<GetActiveVideoCallResponse> {
  try {
    const session = (await auth()) as any;
    if (!session?.accessToken || (session?.user?.role !== "admin" && session?.user?.role !== "member")) {
      return { success: false, has_active_call: false, data: null };
    }

    const res = await apiFetch<any>(`/api/v1/twilio/video/active`, {
      method: "GET",
      headers: {
        "x-api-key": "trk_live_7f9c2a4d8b1e5f6a9c3d2e7f8a1b4c6d",
      },
    });
    return {
      success: true,
      has_active_call: Boolean(res?.has_active_call),
      data: res?.data || null,
    };
  } catch (error: any) {
    return {
      success: false,
      has_active_call: false,
      error: error.message || "Failed to check active video call",
    };
  }
}

export async function getShiftGuardIdAction(shiftId: string): Promise<string | null> {
  try {
    const res = await apiFetch<any>(`/api/v1/shift/${shiftId}`);
    const data = res?.data || res;
    const guardId =
      data?.lead_guard?.guard_id ||
      data?.lead_guard?.id ||
      (typeof data?.assigned_guard === "object"
        ? data?.assigned_guard?.id || data?.assigned_guard?.guard_id
        : data?.assigned_guard) ||
      data?.guard_id ||
      null;
    return guardId;
  } catch {
    return null;
  }
}
