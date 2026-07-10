"use server";

import { apiFetch } from "@/lib/api";
import { revalidatePath } from "next/cache";
import {
  FetchResponse,
  BaseApiResponse,
  InvoiceData,
  Record,
  SingleFetchResponse,
} from "@/types/dashboard.types";

export async function fetchInvoicesAction(
  page: number,
  search: string = "",
  date_from: string = "",
  date_to: string = "",
  status: string = "new_project"
): Promise<FetchResponse<InvoiceData>> {
  const query = encodeURIComponent(search);
  let url = `/api/v1/invoice/${status}/list?search=${query}`;

  if (!date_from && !date_to) {
    url += `&page=${page}`;
  }
  if (date_from) url += `&date_from=${date_from}`;
  if (date_to) url += `&date_to=${date_to}`;

  try {
    const data = await apiFetch<BaseApiResponse<InvoiceData>>(url);
    return { success: true, data: data.data, pagination: data.pagination };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    return { success: false, error: message };
  }
}

export async function fetchPreShiftCheckInAction(
  page: number,
  search: string = "",
  date_from: string = "",
  date_to: string = "",
): Promise<FetchResponse<Record>> {
  const query = encodeURIComponent(search);
  let url = `/api/v1/shift/list?status=shift_pre_check_in&search=${query}`;

  if (!date_from && !date_to) {
    url += `&page=${page}`;
  }
  if (date_from) url += `&date_from=${date_from}`;
  if (date_to) url += `&date_to=${date_to}`;

  try {
    const data = await apiFetch<BaseApiResponse<Record>>(url);
    return { success: true, data: data.data, pagination: data.pagination };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    return { success: false, error: message };
  }
}

export async function fetchInProgressShiftAction(
  page: number,
  search: string = "",
  date_from: string = "",
  date_to: string = "",
): Promise<FetchResponse<Record>> {
  const query = encodeURIComponent(search);
  let url = `/api/v1/shift/list?status=shift_in_progress&search=${query}`;

  if (!date_from && !date_to) {
    url += `&page=${page}`;
  }
  if (date_from) url += `&date_from=${date_from}`;
  if (date_to) url += `&date_to=${date_to}`;

  try {
    const data = await apiFetch<BaseApiResponse<Record>>(url);
    return { success: true, data: data.data, pagination: data.pagination };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    return { success: false, error: message };
  }
}

export async function fetchFinishedShiftAction(
  page: number,
  search: string = "",
  date_from: string = "",
  date_to: string = "",
): Promise<FetchResponse<Record>> {
  const query = encodeURIComponent(search);
  let url = `/api/v1/shift/list?status=shift_finished&search=${query}`;

  if (!date_from && !date_to) {
    url += `&page=${page}`;
  }
  if (date_from) url += `&date_from=${date_from}`;
  if (date_to) url += `&date_to=${date_to}`;

  try {
    const data = await apiFetch<BaseApiResponse<Record>>(url);
    return { success: true, data: data.data, pagination: data.pagination };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    return { success: false, error: message };
  }
}

export async function fetchPlannedShiftAction(
  page: number,
  search: string = "",
  date_from: string = "",
  date_to: string = "",
): Promise<FetchResponse<Record>> {
  const query = encodeURIComponent(search);
  let url = `/api/v1/shift/list?status=shift_planned&search=${query}`;

  if (!date_from && !date_to) {
    url += `&page=${page}`;
  }
  if (date_from) url += `&date_from=${date_from}`;
  if (date_to) url += `&date_to=${date_to}`;

  try {
    const data = await apiFetch<BaseApiResponse<Record>>(url);
    return { success: true, data: data.data, pagination: data.pagination };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    return { success: false, error: message };
  }
}

export async function fetchArrivalShiftAction(
  page: number,
  search: string = "",
  date_from: string = "",
  date_to: string = "",
): Promise<FetchResponse<Record>> {
  const query = encodeURIComponent(search);
  let url = `/api/v1/shift/list?status=shift_arrival&search=${query}`;

  if (!date_from && !date_to) {
    url += `&page=${page}`;
  }
  if (date_from) url += `&date_from=${date_from}`;
  if (date_to) url += `&date_to=${date_to}`;

  try {
    const data = await apiFetch<BaseApiResponse<Record>>(url);
    return { success: true, data: data.data, pagination: data.pagination };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    return { success: false, error: message };
  }
}

export async function fetchCreatedShiftAction(
  page: number,
  search: string = "",
  date_from: string = "",
  date_to: string = "",
): Promise<FetchResponse<Record>> {
  const query = encodeURIComponent(search);
  let url = `/api/v1/shift/list?status=shift_created&search=${query}`;

  if (!date_from && !date_to) {
    url += `&page=${page}`;
  }
  if (date_from) url += `&date_from=${date_from}`;
  if (date_to) url += `&date_to=${date_to}`;

  try {
    const data = await apiFetch<BaseApiResponse<Record>>(url);
    return { success: true, data: data.data, pagination: data.pagination };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    return { success: false, error: message };
  }
}

export async function fetchAcceptedShiftAction(
  page: number,
  search: string = "",
  date_from: string = "",
  date_to: string = "",
): Promise<FetchResponse<Record>> {
  const query = encodeURIComponent(search);
  let url = `/api/v1/shift/list?status=shift_accepted&search=${query}`;

  if (!date_from && !date_to) {
    url += `&page=${page}`;
  }
  if (date_from) url += `&date_from=${date_from}`;
  if (date_to) url += `&date_to=${date_to}`;

  try {
    const data = await apiFetch<BaseApiResponse<Record>>(url);
    return { success: true, data: data.data, pagination: data.pagination };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    return { success: false, error: message };
  }
}

export async function fetchRefusedShiftAction(
  page: number,
  search: string = "",
  date_from: string = "",
  date_to: string = "",
): Promise<FetchResponse<Record>> {
  const query = encodeURIComponent(search);
  let url = `/api/v1/shift/list?status=shift_refused&search=${query}`;

  if (!date_from && !date_to) {
    url += `&page=${page}`;
  }
  if (date_from) url += `&date_from=${date_from}`;
  if (date_to) url += `&date_to=${date_to}`;

  try {
    const data = await apiFetch<BaseApiResponse<Record>>(url);
    return { success: true, data: data.data, pagination: data.pagination };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    return { success: false, error: message };
  }
}

export async function fetchAbandonShiftAction(
  page: number,
  search: string = "",
  date_from: string = "",
  date_to: string = "",
): Promise<FetchResponse<Record>> {
  const query = encodeURIComponent(search);
  let url = `/api/v1/shift/list?status=shift_abandon&search=${query}`;

  if (!date_from && !date_to) {
    url += `&page=${page}`;
  }
  if (date_from) url += `&date_from=${date_from}`;
  if (date_to) url += `&date_to=${date_to}`;

  try {
    const data = await apiFetch<BaseApiResponse<Record>>(url);
    return { success: true, data: data.data, pagination: data.pagination };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    return { success: false, error: message };
  }
}

export async function fetchApprovedShiftAction(
  page: number,
  search: string = "",
  date_from: string = "",
  date_to: string = "",
): Promise<FetchResponse<Record>> {
  const query = encodeURIComponent(search);
  let url = `/api/v1/shift/list?status=shift_approved&search=${query}`;

  if (!date_from && !date_to) {
    url += `&page=${page}`;
  }
  if (date_from) url += `&date_from=${date_from}`;
  if (date_to) url += `&date_to=${date_to}`;

  try {
    const data = await apiFetch<BaseApiResponse<Record>>(url);
    return { success: true, data: data.data, pagination: data.pagination };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    return { success: false, error: message };
  }
}

export async function fetchNotApprovedShiftAction(
  page: number,
  search: string = "",
  date_from: string = "",
  date_to: string = "",
): Promise<FetchResponse<Record>> {
  const query = encodeURIComponent(search);
  let url = `/api/v1/shift/list?status=shift_not_approved&search=${query}`;

  if (!date_from && !date_to) {
    url += `&page=${page}`;
  }
  if (date_from) url += `&date_from=${date_from}`;
  if (date_to) url += `&date_to=${date_to}`;

  try {
    const data = await apiFetch<BaseApiResponse<Record>>(url);
    return { success: true, data: data.data, pagination: data.pagination };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    return { success: false, error: message };
  }
}

export async function fetchInvoiceDetailsAction(
  id: string,
): Promise<SingleFetchResponse<InvoiceData>> {
  try {
    const data = await apiFetch<{ success: boolean; data: InvoiceData }>(
      `/api/v1/invoice/${id}`,
    );
    return { success: true, data: data.data };
  } catch (error: any) {
    const message = error.message || "Something went wrong";
    return { success: false, error: message };
  }
}

export async function updateInvoicePaymentStatusAction(payload: {
  invoice_id: string;
  payment_status: string;
  reminder_date?: string;
  per_hour_rate?: number | string;
  per_shift_rate?: number | string;
}): Promise<{ success: boolean; error?: string }> {
  console.log("[updateInvoicePaymentStatusAction] Called with payload:", payload);
  try {
    const res = await apiFetch(`/api/v1/invoice/payment-status`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    console.log("[updateInvoicePaymentStatusAction] API success response:", res);
    return { success: true };
  } catch (error: any) {
    console.error("[updateInvoicePaymentStatusAction] API error:", error);
    const message = error.message || "Something went wrong";
    return { success: false, error: message };
  }
}

export async function fetchInvoiceShiftsAction(
  invoiceId: string,
  view: string = "schedule"
): Promise<{ success: boolean; data?: any[]; error?: string }> {
  const url = `/api/v1/invoice/${invoiceId}/shifts?view=${view}`;
  console.log("Fetching invoice shifts from:", url);
  try {
    const data = await apiFetch<{ success: boolean; data: any[] }>(url);
    console.log("Invoice shifts response data:", data);
    return { success: true, data: data.data };
  } catch (error: unknown) {
    console.error("Error fetching invoice shifts:", error);
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    return { success: false, error: message };
  }
}

export async function fetchShiftDetailsAction(
  shiftId: string,
  notificationId?: string,
): Promise<SingleFetchResponse<any>> {
  try {
    const endpoint = notificationId
      ? `/api/v1/shift/${shiftId}?notification_id=${notificationId}`
      : `/api/v1/shift/${shiftId}`;
    const fullUrl = `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`;
    console.log("fetchShiftDetailsAction: Requesting URL:", fullUrl);

    const data = await apiFetch<{ success: boolean; data: any }>(endpoint);
    console.log("fetchShiftDetailsAction: Response data:", data);

    if (data.success && data.data && data.data.invoice_no) {
      try {
        console.log(`fetchShiftDetailsAction: Looking up invoice ID for ${data.data.invoice_no}`);
        const searchRes = await apiFetch<{ success: boolean; data: any[] }>(
          `/api/v1/invoice/global-search?search=${encodeURIComponent(data.data.invoice_no)}`
        );
        if (searchRes.success && searchRes.data) {
          const match = searchRes.data.find(
            (item: any) =>
              item.type === "invoice" &&
              item.invoice_no?.toLowerCase() === data.data.invoice_no.toLowerCase()
          );
          if (match && match.invoice_id) {
            data.data.invoice_id = match.invoice_id;
            console.log(`fetchShiftDetailsAction: Successfully injected invoice_id: ${match.invoice_id}`);
          } else {
            console.warn(`fetchShiftDetailsAction: No matching invoice found in search results for: ${data.data.invoice_no}`);
          }
        }
      } catch (searchErr) {
        console.error("fetchShiftDetailsAction: Failed to fetch matching invoice details during lookup:", searchErr);
      }
    }

    return { success: true, data: data.data };
  } catch (error: any) {
    console.error("fetchShiftDetailsAction: Error:", error);
    const message = error.message || "Something went wrong";
    return { success: false, error: message };
  }
}

export async function deleteShiftAction(
  shiftId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await apiFetch(`/api/v1/shift/${shiftId}`, {
      method: "DELETE",
    });
    return { success: true };
  } catch (error: any) {
    const message = error.message || "Something went wrong";
    return { success: false, error: message };
  }
}

export async function fetchSecurityServicesAction(): Promise<{ success: boolean; data?: any[]; error?: string }> {
  const endpoint = `/api/v1/security-service`;
  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || ""}${endpoint}`;
  console.log("[fetchSecurityServicesAction] API URL:", apiUrl);
  try {
    const data = await apiFetch<{ success: boolean; data: any[] }>(endpoint);
    console.log("[fetchSecurityServicesAction] Response data:", data);
    return { success: true, data: data.data };
  } catch (error: any) {
    const message = error.message || "Something went wrong";
    console.error("[fetchSecurityServicesAction] Error fetching security services:", message);
    return { success: false, error: message };
  }
}

export async function createShiftAction(payload: {
  invoice_id: string;
  service_id: string;
  schedule: {
    start_date: string;
    end_date: string;
    total_hr: number;
  }[];
}): Promise<{ success: boolean; error?: string }> {
  try {
    await apiFetch(`/api/v1/shift/create`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    console.log("Shift created successfully", payload);
    return { success: true };
  } catch (error: any) {
    const message = error.message || "Something went wrong";
    return { success: false, error: message };
  }
}
export async function fetchLocationAction(country?: string, state?: string, status?: string): Promise<{ success: boolean; data?: { countries: string[], states: string[], cities: string[] }; error?: string }> {
  try {
    let url = `/api/v1/guard/location`;
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (country && country !== "All Country") params.append("country", country);
    if (state && state !== "All State") params.append("state", state);
    const qs = params.toString();
    if (qs) url += `?${qs}`;

    const data = await apiFetch<{ success: boolean; data: { countries: string[], states: string[], cities: string[] } }>(url);
    return { success: true, data: data.data };
  } catch (error: any) {
    const message = error.message || "Something went wrong";
    return { success: false, error: message };
  }
}

export async function fetchGuardsAction(params: {
  page?: number | null;
  search?: string;
  status?: string;
  city?: string;
  state?: string;
  country?: string;
  armed?: string;
  unarmed?: string;
  invoice_id?: string;
  radius_miles?: string | number;
}): Promise<FetchResponse<any>> {
  const {
    page = 1,
    search = "",
    status = "",
    city = "",
    state = "",
    country = "",
    armed = "",
    unarmed = "",
    invoice_id = "",
    radius_miles = ""
  } = params;
  const query = new URLSearchParams();
  if (page !== null) {
    query.append("page", page.toString());
  }
  if (search) query.append("search", search);
  if (status) query.append("status", status);
  if (city && city !== "All City") query.append("city", city);
  if (state && state !== "All State") query.append("state", state);
  if (country && country !== "All Country") query.append("country", country);
  if (armed) query.append("armed", armed);
  if (unarmed) query.append("unarmed", unarmed);
  if (invoice_id) query.append("invoice_id", invoice_id);
  if (radius_miles) query.append("radius_miles", radius_miles.toString());

  try {
    const data = await apiFetch<BaseApiResponse<any>>(
      `/api/v1/guard/list?${query.toString()}`
    );
    return { success: true, data: data.data, pagination: data.pagination };
  } catch (error: any) {
    const message = error.message || "Something went wrong";
    return { success: false, error: message };
  }
}

export async function assignGuardsAction(payload: {
  invoice_id: string;
  per_hour_rate?: number | null;
  per_shift_rate?: number | null;
  assignments: {
    guard_id: string;
    shift_ids: string[];
    per_hour_rate?: number | null;
    per_shift_rate?: number | null;
    travel_fee?: number | null;
  }[];
}): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await apiFetch<{ success: boolean; message?: string }>(
      `/api/v1/shift/assign-guard`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
    return { success: true, message: res.message };
  } catch (error: any) {
    const message = error.message || "Something went wrong";
    return { success: false, error: message };
  }
}

export async function assignGuardToShiftAction(payload: {
  invoice_id: string;
  guard_id: string;
  shift_id: string;
  per_hour_rate?: number;
  per_shift_rate?: number;
  travel_fee?: number;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const body: any = {
      invoice_id: payload.invoice_id,
      assignments: [
        {
          guard_id: payload.guard_id,
          shift_ids: [payload.shift_id],
        },
      ],
    };
    if (payload.per_hour_rate) {
      body.per_hour_rate = payload.per_hour_rate;
      body.assignments[0].per_hour_rate = payload.per_hour_rate;
    }
    if (payload.per_shift_rate) {
      body.per_shift_rate = payload.per_shift_rate;
      body.assignments[0].per_shift_rate = payload.per_shift_rate;
    }
    if (payload.travel_fee) {
      body.assignments[0].travel_fee = payload.travel_fee;
    }
    const res = await apiFetch<{ success: boolean; message?: string }>(
      `/api/v1/shift/assign-guard`,
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    );
    return { success: true, message: res.message };
  } catch (error: any) {
    const message = error.message || "Something went wrong";
    return { success: false, error: message };
  }
}

export async function reassignGuardToShiftAction(payload: {
  shift_id: string;
  guard_id: string;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await apiFetch<{ success: boolean; message?: string }>(
      `/api/v1/shift/reassign-guard`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
    return { success: true, message: res.message };
  } catch (error: any) {
    const message = error.message || "Something went wrong";
    return { success: false, error: message };
  }
}

export async function unassignGuardAction(shift_offer_id: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await apiFetch<{ success: boolean; message?: string }>(
      `/api/v1/shift/assign-guard`,
      {
        method: "DELETE",
        body: JSON.stringify({ shift_offer_id }),
      }
    );
    return { success: true, message: res.message };
  } catch (error: any) {
    const message = error.message || "Something went wrong";
    return { success: false, error: message };
  }
}

export async function fetchShiftCountsAction(): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const data = await apiFetch<{ success: boolean; data: any }>(
      `/api/v1/shift/total/counts`
    );
    return { success: true, data: data.data };
  } catch (error: any) {
    const message = error.message || "Something went wrong";
    return { success: false, error: message };
  }
}

export async function cancelInvoiceServiceAction(payload: {
  invoice_id: string;
  reason: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("[Server Action] Starting cancelInvoiceServiceAction for:", payload.invoice_id);
    const result = await apiFetch(`/api/v1/invoice/service/cancelled`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    console.log("[Server Action] apiFetch completed successfully:", result);
    revalidatePath(`/invoices/${payload.invoice_id}`);
    return { success: true };
  } catch (error: any) {
    console.error("[Server Action] Cancellation error:", error);
    const message = error.message || "Something went wrong";
    return { success: false, error: message };
  }
}

export async function cancelShiftServiceAction(payload: {
  shift_id: string;
  reason: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("[Server Action] Starting cancelShiftServiceAction for:", payload.shift_id);
    const result = await apiFetch(`/api/v1/shift/service/cancelled`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    console.log("[Server Action] apiFetch completed successfully:", result);
    return { success: true };
  } catch (error: any) {
    console.error("[Server Action] Shift cancellation error:", error);
    const message = error.message || "Something went wrong";
    return { success: false, error: message };
  }
}

export async function updateInvoiceDetailsAction(payload: {
  invoice_id: string;
  customer_name?: string;
  invoice_description?: string;
  shift_description?: string;
  shipping_address?: any;
}): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("[Server Action] Updating invoice details:", payload);
    const result = await apiFetch(`/api/v1/invoice/details`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    revalidatePath(`/invoices/${payload.invoice_id}`);
    return { success: true };
  } catch (error: any) {
    console.error("[Server Action] Update error:", error);
    const message = error.message || "Something went wrong";
    return { success: false, error: message };
  }
}
export async function fetchAvailableGuardsAction(
  invoiceId: string
): Promise<{ success: boolean; data?: any[]; total_guards?: number; error?: string }> {
  try {
    const data = await apiFetch<{ success: boolean; data: any[]; total_guards: number }>(
      `/api/v1/invoice/${invoiceId}/available-guards`
    );
    return { success: true, data: data.data, total_guards: data.total_guards };
  } catch (error: any) {
    const message = error.message || "Something went wrong";
    return { success: false, error: message };
  }
}

export async function findAvailableGuardsAction(payload: {
  invoice_id: string;
  shift_ids: string[];
  guard_ids: string[];
}): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await apiFetch<{ success: boolean; message?: string }>(
      `/api/v1/invoice/find-available-guards`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
    return { success: true, message: res.message };
  } catch (error: any) {
    const message = error.message || "Something went wrong";
    return { success: false, error: message };
  }
}

export async function fetchCalendarShiftsAction(
  from_date: string,
  to_date: string
): Promise<{ success: boolean; data?: any[]; count?: number; error?: string }> {
  try {
    const data = await apiFetch<{ success: boolean; count: number; data: any[] }>(
      `/api/v1/calender/shifts?from_date=${from_date}&to_date=${to_date}`
    );
    console.log("[fetchCalendarShiftsAction] Response from /api/v1/calender/shifts:", data);
    return { success: true, data: data.data, count: data.count };
  } catch (error: any) {
    const message = error.message || "Something went wrong";
    return { success: false, error: message };
  }
}

export interface Comment {
  id: string;
  shift_id: string;
  type: "internal" | "external";
  user_message: string | null;
  attach_file_url: string | null;
  user_role?: string;
  created_at: string;
  updated_at: string;
}

export async function fetchCommentsAction(
  shiftId: string
): Promise<{ success: boolean; data?: Comment[]; error?: string }> {
  try {
    const data = await apiFetch<{ success: boolean; data?: Comment[] } | Comment[]>(`/api/v1/shift/comment/${shiftId}`);
    const commentsList = Array.isArray(data) ? data : (data.data || []);
    return { success: true, data: commentsList };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    return { success: false, error: message };
  }
}

export async function addCommentAction(payload: {
  shift_id: string;
  type: "internal" | "external";
  user_message: string | null;
  attach_file_url: string | null;
}): Promise<{ success: boolean; data?: unknown; error?: string }> {
  try {
    const data = await apiFetch<unknown>(`/api/v1/shift/comment`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return { success: true, data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    return { success: false, error: message };
  }
}

export async function updateShiftDetailsAction(payload: {
  shift_id: string;
  shift_description?: string;
  shipping_address?: any;
  shift_time?: any;
  shift_execution_time?: any;
  checkpoint_create_interval?: number;
  guard_break_max_duration?: number;
  break_max_time?: number;
  guard_break_limit?: number;
  total_break_limit?: number;
  per_hour_rate?: number;
  per_shift_rate?: number;
  travel_fee?: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("[Server Action] updateShiftDetailsAction PATCH Payload to /api/v1/shift/details:", JSON.stringify(payload, null, 2));
    const result = await apiFetch<any>(`/api/v1/shift/details`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    console.log("[Server Action] updateShiftDetailsAction PATCH Response from /api/v1/shift/details:", JSON.stringify(result, null, 2));
    return { success: true };
  } catch (error: any) {
    console.error("[Server Action] updateShiftDetailsAction PATCH error for /api/v1/shift/details:", error);
    const message = error.message || "Something went wrong";
    return { success: false, error: message };
  }
}

export async function manualStartShiftAction(payload: {
  shift_id: string;
  reason: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("[Server Action] manualStartShiftAction POST Payload to /api/v1/shift/manual-shift-start:", payload);
    const result = await apiFetch<any>(`/api/v1/shift/manual-shift-start`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    console.log("[Server Action] manualStartShiftAction POST Response:", result);
    return { success: true };
  } catch (error: any) {
    console.error("[Server Action] manualStartShiftAction error:", error);
    const message = error.message || "Something went wrong";
    return { success: false, error: message };
  }
}

export async function fetchGuardTrackingAction(guard_id: string, shift_id: string): Promise<SingleFetchResponse<any>> {
  try {
    const data = await apiFetch<any>(`/api/v1/tracking/guard/${guard_id}/shift/${shift_id}`);
    return { success: true, data: data };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch guard tracking data" };
  }
}

export async function globalSearchAction(
  search: string
): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const data = await apiFetch<{ success: boolean; data: any[] }>(
      `/api/v1/invoice/global-search?search=${encodeURIComponent(search)}`
    );
    return { success: true, data: data.data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    return { success: false, data: [], error: message };
  }
}

export async function createManualInvoiceAction(payload: {
  customer_id?: string;
  customer_name: string;
  customer_email: string;
  invoice_no: string;
  invoice_description: string;
  invoice_amount: number;
  shipping_address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    address: string;
  };
}): Promise<{ success: boolean; invoice_id?: string; error?: string }> {
  try {
    console.log("[Server Action] createManualInvoiceAction POST Payload to /api/v1/invoice/manual:", JSON.stringify(payload, null, 2));
    const result = await apiFetch<any>(`/api/v1/invoice/manual`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    console.log("[Server Action] createManualInvoiceAction POST Response:", result);
    // Support nested or direct structures:
    const invoice_id = result?.invoice_id || result?.data?.invoice_id || result?.data?.id || result?.id;
    return { success: true, invoice_id };
  } catch (error: any) {
    console.error("[Server Action] createManualInvoiceAction error:", error);
    const message = error.message || "Something went wrong";
    return { success: false, error: message };
  }
}

export async function verifyInvoiceNumberAction(invoice_no: string): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await apiFetch<any>(`/api/v1/invoice/${invoice_no}/verify`, {
      method: "GET",
    });
    return { success: true };
  } catch (error: any) {
    const message = error.message || "Invoice number already exists or is invalid.";
    return { success: false, error: message };
  }
}

export async function fetchDispatchViewShiftsAction(
  type?: string,
  page: number = 1,
  search: string = "",
): Promise<FetchResponse<any>> {
  const query = new URLSearchParams();
  if (type) query.append("type", type);
  query.append("page", page.toString());
  if (search) query.append("search", search);

  try {
    const data = await apiFetch<BaseApiResponse<any>>(
      `/api/v1/shift/dispatch-view?${query.toString()}`
    );
    return { success: true, data: data.data, pagination: data.pagination };
  } catch (error: any) {
    const message = error.message || "Something went wrong";
    return { success: false, error: message };
  }
}
