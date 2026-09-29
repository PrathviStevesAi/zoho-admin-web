"use server";

import { apiFetch } from "@/lib/api";

export interface MembershipBenefitItem {
  id: string;
  benefit_name: string;
  category: string;
  business_partner_name?: string;
  provider?: string;
  business_logo?: string;
  image_url?: string;
  assigned_guards?: number | any[];
  status: string;
  description?: string;
  discount_value?: string;
  location?: string;
  start_date?: string;
  expiry_date?: string;
  startDate?: string;
  expiryDate?: string;
}

export interface FetchMembershipsResponse {
  success: boolean;
  total: number;
  data: MembershipBenefitItem[];
  error?: string;
}

export async function fetchMembershipsAction(): Promise<FetchMembershipsResponse> {
  try {
    const res = await apiFetch<{
      success: boolean;
      total: number;
      data: MembershipBenefitItem[];
      message?: string;
    }>(`/api/v1/membership`);

    const data = Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res)
      ? res
      : [];
    const total = typeof res?.total === "number" ? res.total : data.length;

    return {
      success: res?.success ?? true,
      total,
      data,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load memberships";
    return {
      success: false,
      total: 0,
      data: [],
      error: message,
    };
  }
}

export interface CreateMembershipPayload {
  benefit_name: string;
  category: string;
  business_partner_name: string;
  business_logo: string;
  description: string;
  location: string;
  start_date: string;
  expiry_date: string;
  status: string;
}

export async function createMembershipAction(
  payload: CreateMembershipPayload
): Promise<{ success: boolean; data?: any; message?: string; error?: string }> {
  try {
    const res = await apiFetch<any>(`/api/v1/membership`, {
      method: "POST",
      body: JSON.stringify({
        benefit_name: payload.benefit_name,
        category: payload.category,
        business_partner_name: payload.business_partner_name,
        business_logo: payload.business_logo || "",
        description: payload.description,
        location: payload.location,
        start_date: payload.start_date,
        expiry_date: payload.expiry_date,
        status: payload.status.toLowerCase(),
      }),
    });
    return {
      success: res?.success ?? true,
      data: res?.data || res,
      message: res?.message || "Membership created successfully",
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create membership benefit";
    return { success: false, error: message };
  }
}

export async function generateBenefitImageUploadUrlAction(payload: {
  file_name: string;
  type?: string;
  folder_name?: string;
}): Promise<{
  success: boolean;
  data?: {
    signed_url: string;
    file_path: string;
    public_url?: string;
    [key: string]: any;
  };
  error?: string;
}> {
  try {
    const res = await apiFetch<any>(`/api/v1/shift/media/generate-upload-url`, {
      method: "POST",
      body: JSON.stringify({
        file_name: payload.file_name,
        type: payload.type || "common",
        folder_name: payload.folder_name || "benefits",
      }),
    });

    const data = res?.data || res;
    return {
      success: true,
      data,
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to generate upload URL";
    return { success: false, error: message };
  }
}


