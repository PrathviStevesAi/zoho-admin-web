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
    }>(`/api/v1/membership/list`);

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
): Promise<{ success: boolean; data?: any; membership_id?: string; message?: string; error?: string }> {
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
    const membership_id =
      res?.membership_id ||
      res?.data?.membership_id ||
      res?.data?.id ||
      res?.id;
    return {
      success: res?.success ?? true,
      membership_id,
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

export async function fetchMembershipByIdAction(
  membership_id: string
): Promise<{ success: boolean; data?: MembershipBenefitItem; error?: string }> {
  try {
    const res = await apiFetch<any>(`/api/v1/membership/${membership_id}`);
    const data = res?.data || res;
    if (data && (data.id || data.benefit_name)) {
      return {
        success: res?.success ?? true,
        data,
      };
    }
    // If response does not contain data, fallback to list search
    const listRes = await fetchMembershipsAction();
    if (listRes.success && Array.isArray(listRes.data)) {
      const found = listRes.data.find(
        (item: any) => item.id === membership_id || item.membership_id === membership_id
      );
      if (found) {
        return { success: true, data: found };
      }
    }
    return {
      success: res?.success ?? true,
      data,
    };
  } catch (error: unknown) {
    // If /api/v1/membership/{id} returns 404 or fails, fallback to fetching all memberships
    try {
      const listRes = await fetchMembershipsAction();
      if (listRes.success && Array.isArray(listRes.data)) {
        const found = listRes.data.find(
          (item: any) => item.id === membership_id || item.membership_id === membership_id
        );
        if (found) {
          return { success: true, data: found };
        }
      }
    } catch {
    }
    const message =
      error instanceof Error ? error.message : "Failed to fetch membership details";
    return { success: false, error: message };
  }
}

export async function updateMembershipAction(
  membership_id: string,
  payload: Partial<CreateMembershipPayload>
): Promise<{ success: boolean; data?: any; message?: string; error?: string }> {
  try {
    const res = await apiFetch<any>(`/api/v1/membership/${membership_id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return {
      success: res?.success ?? true,
      data: res?.data || res,
      message: res?.message || "Membership updated successfully",
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to update membership benefit";
    return { success: false, error: message };
  }
}

export async function deleteMembershipAction(
  membership_id: string
): Promise<{ success: boolean; data?: any; message?: string; error?: string }> {
  try {
    const res = await apiFetch<any>(`/api/v1/membership/${membership_id}`, {
      method: "DELETE",
    });
    return {
      success: res?.success ?? true,
      data: res?.data || res,
      message: res?.message || "Membership deleted successfully",
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to delete membership benefit";
    return { success: false, error: message };
  }
}

export async function assignGuardsToMembershipAction(
  membership_id: string,
  guard_ids: string[]
): Promise<{ success: boolean; data?: any; message?: string; error?: string }> {
  try {
    const res = await apiFetch<any>(`/api/v1/membership/assign-guards`, {
      method: "POST",
      body: JSON.stringify({
        membership_id,
        guard_ids,
      }),
    });
    return {
      success: res?.success ?? true,
      data: res?.data || res,
      message: res?.message || "Guards assigned successfully",
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to assign guards";
    return { success: false, error: message };
  }
}

export async function removeGuardFromMembershipAction(
  membership_id: string,
  guard_id: string,
  action: "remove_guard" | "remove_qr" = "remove_guard"
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await apiFetch<any>(
      `/api/v1/membership/${membership_id}/guard/${guard_id}?action=${action}`,
      {
        method: "DELETE",
      }
    );
    return {
      success: res?.success ?? true,
      message:
        res?.message ||
        (action === "remove_qr"
          ? "QR code removed successfully"
          : "Guard removed successfully"),
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : action === "remove_qr"
          ? "Failed to remove QR code"
          : "Failed to remove guard";
    return { success: false, error: message };
  }
}

export async function uploadGuardQrAction(
  membership_id: string,
  guard_id: string,
  qr_code_url: string
): Promise<{ success: boolean; data?: any; message?: string; error?: string }> {
  try {
    const res = await apiFetch<any>(`/api/v1/membership/upload-qr`, {
      method: "POST",
      body: JSON.stringify({
        membership_id,
        guard_id,
        qr_code_url,
      }),
    });
    return {
      success: res?.success ?? true,
      data: res?.data || res,
      message: res?.message || "QR code uploaded successfully",
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to upload QR code";
    return { success: false, error: message };
  }
}

export interface MembershipAssignedGuardItem {
  guard_id: string;
  full_name: string;
  email: string;
  qr_code_url: string | null;
  status: string;
}

export interface FetchMembershipGuardsResponse {
  success: boolean;
  page?: number | null;
  page_size?: number | null;
  total?: number;
  data: MembershipAssignedGuardItem[];
  error?: string;
}

export async function fetchMembershipGuardsAction(
  membership_id: string,
  params?: {
    search?: string;
    status?: string;
    page?: number;
    page_size?: number;
  }
): Promise<FetchMembershipGuardsResponse> {
  try {
    const query = new URLSearchParams();
    if (params?.search) query.append("search", params.search);
    if (params?.status && params.status !== "all_guards") query.append("status", params.status);
    if (params?.page) query.append("page", String(params.page));
    if (params?.page_size) query.append("page_size", String(params.page_size));

    const qs = query.toString() ? `?${query.toString()}` : "";
    const res = await apiFetch<any>(`/api/v1/membership/${membership_id}/guards${qs}`);
    const data = Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res)
        ? res
        : [];
    const total = typeof res?.total === "number" ? res.total : data.length;

    return {
      success: res?.success ?? true,
      page: res?.page ?? params?.page ?? 1,
      page_size: res?.page_size ?? params?.page_size ?? 10,
      total,
      data,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch membership guards";
    return {
      success: false,
      total: 0,
      data: [],
      error: message,
    };
  }
}

