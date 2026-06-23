"use server";

export async function verifySubcontractorApplicationAction(email: string, phoneNumber: string) {
  try {
    const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/subcontractor/application/verify`);
    if (email) url.searchParams.append("email", email);
    if (phoneNumber) url.searchParams.append("phone_number", phoneNumber);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
      "x-api-key": "trk_live_7f9c2a4d8b1e5f6a9c3d2e7f8a1b4c6d",
    };

    const res = await fetch(url.toString(), {
      method: "GET",
      headers,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      let errorMessage = "Verification failed";
      if (typeof errorData.detail === "string") {
        errorMessage = errorData.detail;
      } else if (errorData.detail?.error) {
        errorMessage = errorData.detail.error;
      } else if (errorData.detail?.message) {
        errorMessage = errorData.detail.message;
      } else if (typeof errorData.message === "string") {
        errorMessage = errorData.message;
      } else if (errorData.error) {
        errorMessage = typeof errorData.error === "string" ? errorData.error : JSON.stringify(errorData.error);
      } else if (errorData.detail) {
        errorMessage = JSON.stringify(errorData.detail);
      }
      return { success: false, error: errorMessage };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || "Network error" };
  }
}

export async function generateUploadUrlAction(fileName: string, type: string, guardEmail: string) {
  try {
    const apiKey = "trk_live_7f9c2a4d8b1e5f6a9c3d2e7f8a1b4c6d";
    const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/subcontractor/application/generate-upload-url`);
    url.searchParams.append("x_api_key", apiKey);

    const res = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify({
        file_name: fileName,
        type: type,
        guard_email: guardEmail,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      let errorMessage = "Failed to generate upload URL";
      if (typeof errorData.detail === "string") errorMessage = errorData.detail;
      else if (errorData.message) errorMessage = errorData.message;
      return { success: false, error: errorMessage };
    }

    const data = await res.json();
    return { success: true, data: data.data || data };
  } catch (error: any) {
    return { success: false, error: error.message || "Network error" };
  }
}
