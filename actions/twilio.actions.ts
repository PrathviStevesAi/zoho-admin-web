"use server";

import { apiFetch } from "@/lib/api";

export interface TwilioBalanceData {
  balance: string;
  currency: string;
}

export interface TwilioBalanceResponse {
  success: boolean;
  data?: TwilioBalanceData;
  error?: string;
}

export async function getTwilioBalanceAction(): Promise<TwilioBalanceResponse> {
  try {
    const res = await apiFetch<any>(`/api/v1/twilio/balance`);
    console.log("[getTwilioBalanceAction] Response:", res);

    if (res?.data) {
      return {
        success: true,
        data: {
          balance: String(res.data.balance ?? "0"),
          currency: res.data.currency || "USD",
        },
      };
    }

    if (res?.balance !== undefined) {
      return {
        success: true,
        data: {
          balance: String(res.balance ?? "0"),
          currency: res.currency || "USD",
        },
      };
    }

    return {
      success: false,
      error: res?.error || res?.message || "Failed to load Twilio balance",
    };
  } catch (error: any) {
    console.error("Error fetching Twilio balance:", error);
    return {
      success: false,
      error: error.message || "Failed to load Twilio balance",
    };
  }
}
