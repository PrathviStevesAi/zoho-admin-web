import { AvailableGuardItem } from "@/lib/client-actions";

export type MatrixShiftStatus =
  | "available"
  | "unavailable"
  | "not_available"
  | "pending"
  | "willing_to_travel"
  | "not_sent"
  | string;

export type MatrixAvailabilityType =
  | "all"
  | "available_all"
  | "available_any"
  | "willing_to_travel_all"
  | "willing_to_travel_any";

export type LocationType =
  | "radius"
  | "city"
  | "state"
  | "country"
  | "all_guard"
  | "all";

export type ServiceFilterType = "all" | "both" | "armed" | "unarmed";

export type NotificationSourceType = "in_app" | "sms" | "both";

export interface AvailableInvoiceShift {
  shift_id: string;
  shift_no: string;
  start_time: string;
  end_time: string;
}

export interface AvailableGuardsModuleProps {
  invoiceId: string;
  invoice?: any;
  guards: any[];
  shifts: any[];
  isLoading: boolean;
  onBack: () => void;
  onRefresh: () => void;
  totalGuards: number;
}

export interface LocationsState {
  countries: string[];
  states: string[];
  cities: string[];
}
