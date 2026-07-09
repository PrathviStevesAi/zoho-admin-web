export type { Comment } from "@/actions/dashboard.actions";

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

export interface ShippingLocation {
  latitude?: number | string;
  longitude?: number | string;
  timezone?: string;
  location?: Address;
}

export interface ShiftTime {
  shift_start_time?: string;
  shift_end_time?: string;
}

export interface ExecutionTime {
  guard_shift_started_at?: string;
  guard_shift_ended_at?: string;
  total_break_duration_min?: number;
}

export interface ShiftActions {
  is_reassigned?: boolean;
  is_new_assigned?: boolean;
  is_manual_start_shift?: boolean;
  is_config_settings?: boolean;
  is_cancel_service?: boolean;
  is_edit_schedule?: boolean;
  is_vc_start?: boolean;
  is_location_edit?: boolean;
  is_shift_details_edit?: boolean;
  is_schedule_for_edit?: boolean;
  is_execution_time_edit?: boolean;
  is_hourly_rate_edit?: boolean;
  is_flat_rate_edit?: boolean;
  is_travel_fee_edit?: boolean;
  is_join_vc_call?: boolean;
  call_id?: string;
}

export interface AssignedGuard {
  id?: string;
  guard_id?: string;
  first_name?: string;
  last_name?: string;
  name?: string;
}

export interface Shift {
  shift_id: string;
  shift_no: string;
  customer_name?: string;
  customer_id?: string;
  invoice_id?: string;
  invoice_no?: string;
  invoice_description?: string;
  shift_description?: string;
  status: string;
  payment_status?: string;
  assigned_guard?: string | AssignedGuard;
  scheduled_for?: ShiftTime;
  execution_time?: ExecutionTime;
  shipping_location?: ShippingLocation;
  action?: ShiftActions;
  guard_break_max_duration?: number;
  guard_break_limit?: number;
  geofence_radius?: number;
  checkpoint_create_interval?: number;
  break_max_time?: number;
  total_break_limit?: number;
  per_hour_rate?: number | null;
  per_shift_rate?: number | null;
  travel_fee?: number | null;
  security_service_id?: string | null;
  call_id?: string | null;
}

export interface ShiftHistoryEvent {
  action_name: string;
  created_at: string;
  performed_by?: string;
  assigned_to?: string;
  details?: Record<string, any>;
  media_urls?: Record<string, { url: string; content_type?: string }>;
}

export interface IncidentReport {
  created_at: string;
  report_pdf?: { url: string; content_type?: string };
  attach_file?: { url: string; content_type?: string };
}

export interface Checkpoint {
  checkpoint_no?: number;
  status?: string;
  sent_at?: string;
  complete_at?: string;
  comment?: string;
  activity?: string;
  site_photo?: { url: string; content_type?: string };
}

export interface ShiftReports {
  shift_history?: ShiftHistoryEvent[];
  dar_report?: { url: string; content_type?: string };
  incident_report?: IncidentReport[];
  checkpoints?: Checkpoint[];
}

export interface PreviewFile {
  url: string;
  title: string;
  contentType: string;
}
