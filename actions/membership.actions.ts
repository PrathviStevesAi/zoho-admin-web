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

    const rawData = Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res)
        ? res
        : [];
    const data = rawData.map((item: any) => {
      const logo =
        item.business_logo || item.image_url || item.logo || item.image || item.imageUrl || "";
      return {
        ...item,
        business_logo: logo,
        image_url: logo,
      };
    });
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

function extractFilePath(urlOrPath?: string): string {
  if (!urlOrPath) return "";
  const trimmed = urlOrPath.trim();
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return trimmed.split("?")[0].replace(/^\/+/, "");
  }
  const cleanUrl = trimmed.split("?")[0];
  const benefitsIdx = cleanUrl.indexOf("benefits/");
  if (benefitsIdx !== -1) {
    return cleanUrl.slice(benefitsIdx);
  }
  const qrIdx = cleanUrl.indexOf("qr-codes/");
  if (qrIdx !== -1) {
    return cleanUrl.slice(qrIdx);
  }
  const match = cleanUrl.match(/\/storage\/v1\/object\/(?:sign|public)\/[^/]+\/(.+)$/);
  if (match && match[1]) {
    return match[1];
  }
  return cleanUrl;
}

export async function createMembershipAction(
  payload: CreateMembershipPayload
): Promise<{ success: boolean; data?: any; membership_id?: string; message?: string; error?: string }> {
  try {
    const cleanLogo = extractFilePath(payload.business_logo || "");
    const body = {
      benefit_name: payload.benefit_name,
      category: payload.category,
      business_partner_name: payload.business_partner_name,
      business_logo: cleanLogo,
      description: payload.description,
      location: payload.location,
      start_date: payload.start_date,
      expiry_date: payload.expiry_date,
      status: payload.status.toLowerCase(),
    };
    console.log("===> [createMembershipAction POST API Payload]:", {
      url: `/api/v1/membership`,
      body,
    });
    const res = await apiFetch<any>(`/api/v1/membership`, {
      method: "POST",
      body: JSON.stringify(body),
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

function sanitizeStorageFolderName(name?: string): string {
  if (!name || typeof name !== "string") return "benefits";
  const cleaned = name
    .replace(/%/g, "percent")
    .replace(/[#?&+\\/:*?"<>|]/g, "")
    .replace(/[^a-zA-Z0-9_\-\s]/g, "")
    .trim()
    .replace(/\s+/g, "_");
  return cleaned || "benefits";
}

function sanitizeStorageFileName(fileName: string): string {
  if (!fileName || typeof fileName !== "string") return "file";
  const lastDot = fileName.lastIndexOf(".");
  if (lastDot === -1) {
    return fileName.replace(/%/g, "percent").replace(/[^a-zA-Z0-9._\-]/g, "_");
  }
  const base = fileName.slice(0, lastDot);
  const ext = fileName.slice(lastDot);
  const cleanBase = base
    .replace(/%/g, "percent")
    .replace(/[^a-zA-Z0-9_\-]/g, "_")
    .replace(/_+/g, "_");
  return `${cleanBase || "file"}${ext}`;
}

export async function uploadFileToSignedUrlAction(
  signedUrl: string,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const file = formData.get("file") as File;
    if (!file) {
      return { success: false, error: "No file provided for upload" };
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadRes = await fetch(signedUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
      body: buffer,
    });
    if (!uploadRes.ok) {
      const errText = await uploadRes.text().catch(() => "");
      return {
        success: false,
        error: `Storage upload failed with status ${uploadRes.status}${errText ? `: ${errText}` : ""}`,
      };
    }
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to upload file to storage";
    return { success: false, error: msg };
  }
}

export async function generateBenefitImageUploadUrlAction(payload: {
  file_name: string;
  type?: string;
  folder_name?: string;
  guard_id?: string;
  guard_email?: string;
  shift_id?: string;
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
    const cleanFileName = sanitizeStorageFileName(payload.file_name);
    const cleanFolderName = sanitizeStorageFolderName(payload.folder_name);

    const body: Record<string, any> = {
      file_name: cleanFileName,
      type: payload.type || "benefit",
      folder_name: cleanFolderName,
    };
    if (payload.guard_id) body.guard_id = payload.guard_id;
    if (payload.guard_email) body.guard_email = payload.guard_email;
    if (payload.shift_id) body.shift_id = payload.shift_id;

    const res = await apiFetch<any>(`/api/v1/shift/media/generate-upload-url`, {
      method: "POST",
      body: JSON.stringify(body),
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
    const rawData = res?.data || res;
    if (rawData && (rawData.id || rawData.benefit_name || rawData.business_partner_name)) {
      const logo =
        rawData.business_logo ||
        rawData.image_url ||
        rawData.logo ||
        rawData.image ||
        rawData.imageUrl ||
        "";
      const data: MembershipBenefitItem = {
        ...rawData,
        business_logo: logo,
        image_url: logo,
      };
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
        const logo =
          found.business_logo ||
          found.image_url ||
          (found as any).logo ||
          (found as any).image ||
          (found as any).imageUrl ||
          "";
        return {
          success: true,
          data: { ...found, business_logo: logo, image_url: logo },
        };
      }
    }
    return {
      success: res?.success ?? true,
      data: rawData,
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
          const logo =
            found.business_logo ||
            found.image_url ||
            (found as any).logo ||
            (found as any).image ||
            (found as any).imageUrl ||
            "";
          return {
            success: true,
            data: { ...found, business_logo: logo, image_url: logo },
          };
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
  payload: Partial<CreateMembershipPayload> & { image_url?: string }
): Promise<{ success: boolean; data?: any; message?: string; error?: string }> {
  try {
    const logo =
      payload.business_logo !== undefined
        ? payload.business_logo
        : payload.image_url !== undefined
          ? payload.image_url
          : undefined;
    const cleanLogo = logo !== undefined ? extractFilePath(logo) : undefined;
    const bodyPayload: any = {
      ...payload,
      ...(cleanLogo !== undefined ? { business_logo: cleanLogo, image_url: cleanLogo } : {}),
    };
    console.log("===> [updateMembershipAction PATCH API Payload]:", {
      url: `/api/v1/membership/${membership_id}`,
      body: bodyPayload,
    });
    const res = await apiFetch<any>(`/api/v1/membership/${membership_id}`, {
      method: "PATCH",
      body: JSON.stringify(bodyPayload),
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

export async function removeGuardsFromMembershipAction(
  membership_id: string,
  guard_ids: string[],
  action: "remove_guard" | "remove_qr" = "remove_guard"
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const params = new URLSearchParams();
    guard_ids.forEach((id) => params.append("guard_ids", id));
    params.append("action", action);

    const res = await apiFetch<any>(
      `/api/v1/membership/${membership_id}/guards?${params.toString()}`,
      {
        method: "DELETE",
      }
    );
    return {
      success: res?.success ?? true,
      message:
        res?.message ||
        (action === "remove_qr"
          ? guard_ids.length > 1
            ? "QR codes removed successfully"
            : "QR code removed successfully"
          : guard_ids.length > 1
            ? "Guards removed successfully"
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

export async function removeGuardFromMembershipAction(
  membership_id: string,
  guard_id: string,
  action: "remove_guard" | "remove_qr" = "remove_guard"
): Promise<{ success: boolean; message?: string; error?: string }> {
  return removeGuardsFromMembershipAction(membership_id, [guard_id], action);
}

export async function uploadGuardQrAction(
  membership_id: string,
  guard_id: string,
  qr_code_url: string
): Promise<{ success: boolean; data?: any; message?: string; error?: string }> {
  try {
    const cleanQr = extractFilePath(qr_code_url);
    const res = await apiFetch<any>(`/api/v1/membership/upload-qr`, {
      method: "POST",
      body: JSON.stringify({
        membership_id,
        guard_id,
        qr_code_url: cleanQr,
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

