import { clientApiFetch } from "@/lib/client-api";
import { FetchResponse, BaseApiResponse, InvoiceData, Record, SingleFetchResponse } from "@/types/dashboard.types";

export async function clientFetchInvoicesAction(
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
    const data = await clientApiFetch<BaseApiResponse<InvoiceData>>(url);
    return { success: true, data: data?.data || data, pagination: data.pagination };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    return { success: false, error: message || "Unknown Error" };
  }
}

export async function clientFetchPreShiftCheckInAction(
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
    const data = await clientApiFetch<BaseApiResponse<Record>>(url);
    return { success: true, data: data?.data || data, pagination: data.pagination };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    return { success: false, error: message || "Unknown Error" };
  }
}

export async function clientFetchInProgressShiftAction(
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
    const data = await clientApiFetch<BaseApiResponse<Record>>(url);
    return { success: true, data: data?.data || data, pagination: data.pagination };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    return { success: false, error: message || "Unknown Error" };
  }
}

export async function clientFetchFinishedShiftAction(
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
    const data = await clientApiFetch<BaseApiResponse<Record>>(url);
    return { success: true, data: data?.data || data, pagination: data.pagination };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    return { success: false, error: message || "Unknown Error" };
  }
}


export async function clientFetchPlannedShiftAction(
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
    const data = await clientApiFetch<BaseApiResponse<Record>>(url);
    return { success: true, data: data?.data || data, pagination: data.pagination };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    return { success: false, error: message || "Unknown Error" };
  }
}


export async function clientFetchArrivalShiftAction(
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
    const data = await clientApiFetch<BaseApiResponse<Record>>(url);
    return { success: true, data: data?.data || data, pagination: data.pagination };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    return { success: false, error: message || "Unknown Error" };
  }
}


export async function clientFetchCreatedShiftAction(
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
    const data = await clientApiFetch<BaseApiResponse<Record>>(url);
    return { success: true, data: data?.data || data, pagination: data.pagination };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    return { success: false, error: message || "Unknown Error" };
  }
}

export async function clientFetchAcceptedShiftAction(
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
    const data = await clientApiFetch<BaseApiResponse<Record>>(url);
    return { success: true, data: data?.data || data, pagination: data.pagination };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    return { success: false, error: message || "Unknown Error" };
  }
}

export async function clientFetchRefusedShiftAction(
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
    const data = await clientApiFetch<BaseApiResponse<Record>>(url);
    return { success: true, data: data?.data || data, pagination: data.pagination };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    return { success: false, error: message || "Unknown Error" };
  }
}

export async function clientFetchAbandonShiftAction(
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
    const data = await clientApiFetch<BaseApiResponse<Record>>(url);
    return { success: true, data: data?.data || data, pagination: data.pagination };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    return { success: false, error: message || "Unknown Error" };
  }
}

export async function clientFetchApprovedShiftAction(
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
    const data = await clientApiFetch<BaseApiResponse<Record>>(url);
    return { success: true, data: data?.data || data, pagination: data.pagination };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    return { success: false, error: message || "Unknown Error" };
  }
}

export async function clientFetchNotApprovedShiftAction(
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
    const data = await clientApiFetch<BaseApiResponse<Record>>(url);
    return { success: true, data: data?.data || data, pagination: data.pagination };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    return { success: false, error: message || "Unknown Error" };
  }
}

export async function clientFetchInvoiceDetailsAction(
  id: string,
): Promise<SingleFetchResponse<InvoiceData>> {
  try {
    const data = await clientApiFetch<{ success: boolean; data: InvoiceData }>(
      `/api/v1/invoice/${id}`,
    );
    return { success: true, data: data?.data || data };
  } catch (error: any) {
    const message = error.message || "Something went wrong";
    return { success: false, error: message || "Unknown Error" };
  }
}

export async function clientFetchInvoiceShiftsAction(
  invoiceId: string,
  view: string = "schedule"
): Promise<{ success: boolean; data?: any[]; error?: string }> {
  const url = `/api/v1/invoice/${invoiceId}/shifts?view=${view}`;
  console.log("Fetching invoice shifts from:", url);
  try {
    const data = await clientApiFetch<{ success: boolean; data: any[] }>(url);
    console.log("Invoice shifts response data:", data);
    return { success: true, data: data?.data || data };
  } catch (error: any) {
    console.error("Error fetching invoice shifts:", error?.message || String(error));
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    return { success: false, error: message || "Unknown Error" };
  }
}

export async function clientFetchShiftDetailsAction(
  shiftId: string,
  notificationId?: string,
): Promise<SingleFetchResponse<any>> {
  try {
    const endpoint = notificationId
      ? `/api/v1/shift/${shiftId}?notification_id=${notificationId}`
      : `/api/v1/shift/${shiftId}`;
    const fullUrl = `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`;
    console.log("fetchShiftDetailsAction: Requesting URL:", fullUrl);

    const data = await clientApiFetch<{ success: boolean; data: any }>(endpoint);
    console.log("fetchShiftDetailsAction: Response data:", data);

    if (data.success && data.data && data.data.invoice_no) {
      try {
        console.log(`fetchShiftDetailsAction: Looking up invoice ID for ${data.data.invoice_no}`);
        const searchRes = await clientApiFetch<{ success: boolean; data: any[] }>(
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
      } catch (searchErr: any) {
        console.error("fetchShiftDetailsAction: Failed to fetch matching invoice details during lookup:", searchErr?.message || String(searchErr));
      }
    }

    return { success: true, data: data?.data || data };
  } catch (error: any) {
    console.error("fetchShiftDetailsAction: Error:", error?.message || String(error));
    const message = error.message || "Something went wrong";
    return { success: false, error: message || "Unknown Error" };
  }
}


export async function clientFetchSecurityServicesAction(): Promise<{ success: boolean; data?: any[]; error?: string }> {
  const endpoint = `/api/v1/security-service`;
  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || ""}${endpoint}`;
  console.log("[fetchSecurityServicesAction] API URL:", apiUrl);
  try {
    const data = await clientApiFetch<{ success: boolean; data: any[] }>(endpoint);
    console.log("[fetchSecurityServicesAction] Response data:", data);
    return { success: true, data: data?.data || data };
  } catch (error: any) {
    const message = error.message || "Something went wrong";
    console.error("[fetchSecurityServicesAction] Error fetching security services:", message);
    return { success: false, error: message || "Unknown Error" };
  }
}


export async function clientFetchLocationAction(country?: string, state?: string, status?: string): Promise<{ success: boolean; data?: { countries: string[], states: string[], cities: string[] }; error?: string }> {
  try {
    let url = `/api/v1/guard/location`;
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (country && country !== "All Country") params.append("country", country);
    if (state && state !== "All State") params.append("state", state);
    const qs = params.toString();
    if (qs) url += `?${qs}`;

    const data = await clientApiFetch<{ success: boolean; data: { countries: string[], states: string[], cities: string[] } }>(url);
    return { success: true, data: data?.data || data };
  } catch (error: any) {
    const message = error.message || "Something went wrong";
    return { success: false, error: message || "Unknown Error" };
  }
}


export async function clientFetchGuardsAction(params: {
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
    const data = await clientApiFetch<BaseApiResponse<any>>(
      `/api/v1/guard/list?${query.toString()}`
    );
    return { success: true, data: data?.data || data, pagination: data.pagination };
  } catch (error: any) {
    const message = error.message || "Something went wrong";
    return { success: false, error: message || "Unknown Error" };
  }
}


export async function clientFetchCustomersAction(params: {
  page?: number | null;
  search?: string;
}): Promise<FetchResponse<any>> {
  const { page = 1, search = "" } = params;
  const query = new URLSearchParams();
  if (page !== null) query.append("page", page.toString());
  if (search) query.append("search", search);

  try {
    const response = await clientApiFetch<any>(
      `/api/v1/customer/list?${query.toString()}`
    );

    const pagination = {
      page: response.page || 1,
      limit: response.page_size || 10,
      total: response.total || 0,
      total_pages: Math.ceil((response.total || 0) / (response.page_size || 10))
    };

    return { success: true, data: response.data || response, pagination };
  } catch (error: any) {
    const message = error.message || "Something went wrong";
    return { success: false, error: message || "Unknown Error" };
  }
}


export async function clientFetchShiftCountsAction(): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const data = await clientApiFetch<{ success: boolean; data: any }>(
      `/api/v1/shift/total/counts`
    );
    return { success: true, data: data?.data || data };
  } catch (error: any) {
    const message = error.message || "Something went wrong";
    return { success: false, error: message || "Unknown Error" };
  }
}


export async function clientFetchAvailableGuardsAction(
  invoiceId: string
): Promise<{ success: boolean; data?: any[]; total_guards?: number; error?: string }> {
  try {
    const data = await clientApiFetch<{ success: boolean; data: any[]; total_guards: number }>(
      `/api/v1/invoice/${invoiceId}/available-guards`
    );
    return { success: true, data: data?.data || data, total_guards: data.total_guards };
  } catch (error: any) {
    const message = error.message || "Something went wrong";
    return { success: false, error: message || "Unknown Error" };
  }
}


export async function clientFetchCalendarShiftsAction(
  from_date: string,
  to_date: string
): Promise<{ success: boolean; data?: any[]; count?: number; error?: string }> {
  try {
    const data = await clientApiFetch<{ success: boolean; count: number; data: any[] }>(
      `/api/v1/calender/shifts?from_date=${from_date}&to_date=${to_date}`
    );
    console.log("[fetchCalendarShiftsAction] Response from /api/v1/calender/shifts:", data);
    return { success: true, data: data?.data || data, count: data.count };
  } catch (error: any) {
    const message = error.message || "Something went wrong";
    return { success: false, error: message || "Unknown Error" };
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


export async function clientFetchCommentsAction(
  shiftId: string
): Promise<{ success: boolean; data?: Comment[]; error?: string }> {
  try {
    const data = await clientApiFetch<{ success: boolean; data?: Comment[] } | Comment[]>(`/api/v1/shift/comment/${shiftId}`);
    const commentsList = Array.isArray(data) ? data : (data.data || []);
    return { success: true, data: commentsList };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    return { success: false, error: message || "Unknown Error" };
  }
}


export async function clientFetchGuardTrackingAction(guard_id: string, shift_id: string): Promise<SingleFetchResponse<any>> {
  try {
    const data = await clientApiFetch<any>(`/api/v1/tracking/guard/${guard_id}/shift/${shift_id}`);
    return { success: true, data: data };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch guard tracking data" };
  }
}

export async function clientFetchCustomerByIdAction(customer_id: string): Promise<SingleFetchResponse<any>> {
  try {
    const data = await clientApiFetch<any>(`/api/v1/customer/${customer_id}`);
    return { success: true, data: data?.data || data };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch customer details" };
  }
}

export async function updateCustomerAction(customer_id: string, payload: any): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const data = await clientApiFetch<any>(`/api/v1/customer/${customer_id}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update customer" };
  }
}
