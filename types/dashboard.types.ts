export type InvoiceHistory = {
  details: any;
  created_at: string;
  action_name: string;
  performed_by: string | null;
};

export type ShippingAddress = {
  zip?: string;
  city?: string;
  state?: string;
  street?: string;
  address?: string;
  country?: string;
};

export type InvoiceData = {
  id: string;
  invoice_no: string;
  customer_name: string;
  status: string;
  created_at: string;
  zoho_invoice_id?: string;
  invoice_amount?: number;
  description?: string;
  invoice_description?: string;
  shift_description?: string | null;
  payment_status?: string | null;
  reminder_date?: string | null;
  per_hour_rate?: number | null;
  per_shift_rate?: number | null;
  shipping_address?: string | ShippingAddress;
  service_address?: string;
  timezone?: string | null;
  history?: InvoiceHistory[];
  type?: string | null;
  actions?: {
    is_update_payment?: boolean;
    is_schedule_shift?: boolean;
    is_find_guards?: boolean;
    is_assigned_guards?: boolean;
    is_open_crm?: boolean;
    is_cancel_service?: boolean;
    is_location_edit?: boolean;
    is_customer_name_edit?: boolean;
    is_invoice_details_edit?: boolean;
    is_shift_details_edit?: boolean;
  };
};

export type Record = {
  id: string;
  invoice_no: string;
  shift_no: number;
  customer_name: string;
  status: string;
  start_time: string;
  service_address?: string;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
};

export type BaseApiResponse<T> = {
  data: T[];
  pagination: Pagination;
};

export type FetchResponse<T> =
  | {
      success: true;
      data: T[];
      pagination: Pagination;
    }
  | {
      success: false;
      error: string;
    };

export type SingleFetchResponse<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: string;
    };
