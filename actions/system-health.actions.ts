"use server";

import { apiFetch } from "@/lib/api";

export interface ServiceStatus {
  status: "healthy" | "failed" | "unhealthy" | "degraded" | string;
  error?: string;
}

export interface SystemHealthResponse {
  success: boolean;
  overall_status: "healthy" | "failed" | "unhealthy" | "degraded" | string;
  services: {
    supabase_database?: ServiceStatus;
    supabase_storage?: ServiceStatus;
    redis?: ServiceStatus;
    "redis-celery"?: ServiceStatus;
    firebase?: ServiceStatus;
    smtp?: ServiceStatus;
    google_maps?: ServiceStatus;
    zegocloud?: ServiceStatus;
    [key: string]: ServiceStatus | undefined;
  };
}

export async function fetchSystemHealthAction(): Promise<{
  success: boolean;
  data?: SystemHealthResponse;
  error?: string;
}> {
  try {
    const data = await apiFetch<SystemHealthResponse>("/api/v1/system-health");
    return { success: true, data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch system health";
    return { success: false, error: message };
  }
}
