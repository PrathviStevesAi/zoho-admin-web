"use server";

import { apiFetch } from "@/lib/api";
import { UserProfile } from "@/types/profile.types";

export async function fetchProfileAction(): Promise<{ success: boolean; data?: UserProfile; error?: string }> {
  try {
    const data = await apiFetch<{ success: boolean; data: UserProfile }>(
      `/api/v1/user/profile`
    );
    return { success: true, data: data.data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    return { success: false, error: message };
  }
}

export async function updateProfileAction(formData: {
  first_name: string;
  last_name: string;
  phone_number?: string;
  old_password?: string;
  new_password?: string;
  profile_img_url?: string;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const data = await apiFetch<any>(`/api/v1/user/profile`, {
      method: "PUT",
      body: JSON.stringify(formData),
    });
    return { success: true, data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update profile";
    return { success: false, error: message };
  }
}

export interface UploadUrlResponse {
  signed_url: string;
  file_path: string;
}

export async function generateUploadUrlAction(
  fileName: string,
  type: string,
  shiftId?: string
): Promise<{ success: boolean; data?: UploadUrlResponse; error?: string }> {
  try {
    const data = await apiFetch<{ success: boolean; data: UploadUrlResponse }>(
      `/api/v1/shift/media/generate-upload-url`,
      {
        method: "POST",
        body: JSON.stringify({
          file_name: fileName,
          type,
          ...(shiftId && { shift_id: shiftId }),
        }),
      }
    );
    return { success: true, data: data.data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate upload URL";
    return { success: false, error: message };
  }
}

