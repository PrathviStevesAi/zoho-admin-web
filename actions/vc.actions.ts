"use server";

import { apiFetch } from "@/lib/api";

export async function startVideoCallAction(shiftId: string): Promise<{
  success: boolean;
  data?: {
    call_id: string;
    room_id: string;
    token: string;
    user_id: string;
    status: string;
  };
  error?: string;
}> {
  try {
    const res = await apiFetch<any>(`/api/v1/vc/start`, {
      method: "POST",
      body: JSON.stringify({ shift_id: shiftId }),
    });
    return { success: true, data: res.data };
  } catch (error: any) {
    const message = error.message || "Failed to start video call";
    return { success: false, error: message };
  }
}

export async function joinVideoCallAction(callId: string): Promise<{
  success: boolean;
  data?: {
    call_id: string;
    room_id: string;
    token: string;
    user_id: string;
    status: string;
  };
  error?: string;
}> {
  try {
    const res = await apiFetch<any>(`/api/v1/vc/join`, {
      method: "POST",
      body: JSON.stringify({ call_id: callId }),
    });
    return { success: true, data: res.data };
  } catch (error: any) {
    const message = error.message || "Failed to join video call";
    return { success: false, error: message };
  }
}

export async function activeVideoCallsAction(): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    const res = await apiFetch<any>(`/api/v1/vc/active`);
    return { success: true, data: res.data };
  } catch (error: any) {
    const message = error.message || "Failed to fetch active calls";
    return { success: false, error: message };
  }
}

export async function inviteMemberAction(callId: string, memberId: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const res = await apiFetch<any>(`/api/v1/vc/invite`, {
      method: "POST",
      body: JSON.stringify({ call_id: callId, member_id: memberId }),
    });
    return { success: true, message: res.message || "Invitation sent successfully" };
  } catch (error: any) {
    const message = error.message || "Failed to invite member";
    return { success: false, error: message };
  }
}

export async function endVideoCallAction(callId: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const res = await apiFetch<any>(`/api/v1/vc/end`, {
      method: "POST",
      body: JSON.stringify({ call_id: callId }),
    });
    return { success: true, message: res.message || "Ended call successfully" };
  } catch (error: any) {
    const message = error.message || "Failed to end call";
    return { success: false, error: message };
  }
}
