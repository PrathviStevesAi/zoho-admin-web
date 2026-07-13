"use server";

import { apiFetch } from "@/lib/api";

export async function getTokenDataAction() {
  try {
    const data = await apiFetch<any>("/api/v1/zoho/keys");
    return {
      success: true,
      data: data.data || data
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch token data" };
  }
}

export async function generateTokenAction(payload: { clientId: string; clientSecret: string; authorizationCode: string }) {
  try {
    const data = await apiFetch<any>("/api/v1/zoho/generate-token", {
      method: "POST",
      body: JSON.stringify({
        client_id: payload.clientId,
        client_secret: payload.clientSecret,
        authorization_code: payload.authorizationCode
      })
    });
    
    return {
      success: true,
      data: data.data || data,
      message: data.message || "Token generated successfully!"
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to generate token" };
  }
}
