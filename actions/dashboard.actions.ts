"use server";

import { apiFetch } from "@/lib/api";
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
): Promise<FetchResponse<InvoiceData>> {
  const query = encodeURIComponent(search);
  try {
    const data = await apiFetch<BaseApiResponse<InvoiceData>>(
      `/api/v1/invoice/list?page=${page}&search=${query}`,
    );

    return { success: true, data: data.data, pagination: data.pagination };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    return { success: false, error: message };
  }
}

export async function fetchPreShiftCheckInAction(
  page: number,
  search: string = "",
): Promise<FetchResponse<Record>> {
  const query = encodeURIComponent(search);
  try {
    const data = await apiFetch<BaseApiResponse<Record>>(
      `/api/v1/shift/list?page=${page}&status=shift_pre_check_in&search=${query}`,
    );

    return { success: true, data: data.data, pagination: data.pagination };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    return { success: false, error: message };
  }
}

export async function fetchInProgressShiftAction(
  page: number,
  search: string = "",
): Promise<FetchResponse<Record>> {
  const query = encodeURIComponent(search);
  try {
    const data = await apiFetch<BaseApiResponse<Record>>(
      `/api/v1/shift/list?page=${page}&status=shift_in_progress&search=${query}`,
    );

    return { success: true, data: data.data, pagination: data.pagination };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    return { success: false, error: message };
  }
}

export async function fetchFinishedShiftAction(
  page: number,
  search: string = "",
): Promise<FetchResponse<Record>> {
  const query = encodeURIComponent(search);
  try {
    const data = await apiFetch<BaseApiResponse<Record>>(
      `/api/v1/shift/list?page=${page}&status=shift_finished&search=${query}`,
    );

    return { success: true, data: data.data, pagination: data.pagination };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    return { success: false, error: message };
  }
}

export async function fetchPlannedShiftAction(
  page: number,
  search: string = "",
): Promise<FetchResponse<Record>> {
  const query = encodeURIComponent(search);
  try {
    const data = await apiFetch<BaseApiResponse<Record>>(
      `/api/v1/shift/list?page=${page}&status=shift_planned&search=${query}`,
    );

    return { success: true, data: data.data, pagination: data.pagination };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    return { success: false, error: message };
  }
}

export async function fetchArrivalShiftAction(
  page: number,
  search: string = "",
): Promise<FetchResponse<Record>> {
  const query = encodeURIComponent(search);
  try {
    const data = await apiFetch<BaseApiResponse<Record>>(
      `/api/v1/shift/list?page=${page}&status=shift_arrival&search=${query}`,
    );

    return { success: true, data: data.data, pagination: data.pagination };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    return { success: false, error: message };
  }
}

export async function fetchCreatedShiftAction(
  page: number,
  search: string = "",
): Promise<FetchResponse<Record>> {
  const query = encodeURIComponent(search);
  try {
    const data = await apiFetch<BaseApiResponse<Record>>(
      `/api/v1/shift/list?page=${page}&status=shift_created&search=${query}`,
    );

    return { success: true, data: data.data, pagination: data.pagination };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    return { success: false, error: message };
  }
}

export async function fetchAcceptedShiftAction(
  page: number,
  search: string = "",
): Promise<FetchResponse<Record>> {
  const query = encodeURIComponent(search);
  try {
    const data = await apiFetch<BaseApiResponse<Record>>(
      `/api/v1/shift/list?page=${page}&status=shift_accepted&search=${query}`,
    );

    return { success: true, data: data.data, pagination: data.pagination };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    return { success: false, error: message };
  }
}

export async function fetchRefusedShiftAction(
  page: number,
  search: string = "",
): Promise<FetchResponse<Record>> {
  const query = encodeURIComponent(search);
  try {
    const data = await apiFetch<BaseApiResponse<Record>>(
      `/api/v1/shift/list?page=${page}&status=shift_refused&search=${query}`,
    );

    return { success: true, data: data.data, pagination: data.pagination };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    return { success: false, error: message };
  }
}

export async function fetchAbandonShiftAction(
  page: number,
  search: string = "",
): Promise<FetchResponse<Record>> {
  const query = encodeURIComponent(search);
  try {
    const data = await apiFetch<BaseApiResponse<Record>>(
      `/api/v1/shift/list?page=${page}&status=shift_abandon&search=${query}`,
    );

    return { success: true, data: data.data, pagination: data.pagination };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    return { success: false, error: message };
  }
}

export async function fetchApprovedShiftAction(
  page: number,
  search: string = "",
): Promise<FetchResponse<Record>> {
  const query = encodeURIComponent(search);
  try {
    const data = await apiFetch<BaseApiResponse<Record>>(
      `/api/v1/shift/list?page=${page}&status=shift_approved&search=${query}`,
    );

    return { success: true, data: data.data, pagination: data.pagination };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    return { success: false, error: message };
  }
}

export async function fetchNotApprovedShiftAction(
  page: number,
  search: string = "",
): Promise<FetchResponse<Record>> {
  const query = encodeURIComponent(search);
  try {
    const data = await apiFetch<BaseApiResponse<Record>>(
      `/api/v1/shift/list?page=${page}&status=shift_not_approved&search=${query}`,
    );

    return { success: true, data: data.data, pagination: data.pagination };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
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
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    return { success: false, error: message };
  }
}

export async function updateInvoicePaymentStatusAction(payload: {
  invoice_id: string;
  payment_status: string;
  reminder_date: string;
  per_hour_rate: number;
  per_shift_rate: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await apiFetch(`/api/v1/invoice/payment-status`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return { success: true };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
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

export async function deleteShiftAction(
  shiftId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await apiFetch(`/api/v1/shift/${shiftId}`, {
      method: "DELETE",
    });
    return { success: true };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    return { success: false, error: message };
  }
}

export async function fetchSecurityServicesAction(): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const data = await apiFetch<{ success: boolean; data: any[] }>(
      `/api/v1/security-service`,
    );
    return { success: true, data: data.data };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
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
    return { success: true };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    return { success: false, error: message };
  }
}
export async function fetchLocationAction(): Promise<{ success: boolean; data?: { countries: string[], states: string[], cities: string[] }; error?: string }> {
  try {
    const data = await apiFetch<{ success: boolean; data: { countries: string[], states: string[], cities: string[] } }>(
      `/api/v1/guards/location`
    );
    return { success: true, data: data.data };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    return { success: false, error: message };
  }
}

export async function fetchGuardsAction(params: {
  page?: number;
  search?: string;
  status?: string;
  city?: string;
  state?: string;
  country?: string;
  armed?: string;
  unarmed?: string;
}): Promise<FetchResponse<any>> {
  const { page = 1, search = "", status = "", city = "", state = "", country = "", armed = "", unarmed = "" } = params;
  const query = new URLSearchParams();
  query.append("page", page.toString());
  if (search) query.append("search", search);
  if (status) query.append("status", status);
  if (city && city !== "All City") query.append("city", city);
  if (state && state !== "All State") query.append("state", state);
  if (country && country !== "All Country") query.append("country", country);
  if (armed) query.append("armed", armed);
  if (unarmed) query.append("unarmed", unarmed);

  try {
    const data = await apiFetch<BaseApiResponse<any>>(
      `/api/v1/guards/list?${query.toString()}`
    );
    return { success: true, data: data.data, pagination: data.pagination };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    return { success: false, error: message };
  }
}

export async function assignGuardsAction(payload: {
  invoice_id: string;
  per_hour_rate: number;
  per_shift_rate: number;
  assignments: {
    guard_id: string;
    shift_ids: string[];
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
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
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
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    return { success: false, error: message };
  }
}
