"use server";

export async function submitQuoteAction(payload: any) {
  try {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/zoho/automation/estimate`;
    const apiKey = "trk_live_7f9c2a4d8b1e5f6a9c3d2e7f8a1b4c6d";

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.log("Zoho API Error:", errorData);
      
      let errorMessage = "Submission failed";
      if (typeof errorData.detail === "string") {
        errorMessage = errorData.detail;
      } else if (errorData.detail && typeof errorData.detail === "object" && typeof errorData.detail.error === "string") {
        errorMessage = errorData.detail.error;
      } else if (typeof errorData.error === "string") {
        errorMessage = errorData.error;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else {
        errorMessage = `Submission failed: ${JSON.stringify(errorData)}`;
      }
      
      return { success: false, error: errorMessage, rawError: errorData };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || "Network error" };
  }
}
