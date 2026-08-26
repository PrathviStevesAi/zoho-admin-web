"use server";

export async function getPublicShiftReportAction(shiftId: string, reportToken: string) {
  try {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/shift/public/${shiftId}/reports/${reportToken}`;
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
      "x-api-key": "trk_live_7f9c2a4d8b1e5f6a9c3d2e7f8a1b4c6d",
    };

    const res = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return { success: false, error: errorData.message || "Failed to fetch report" };
    }

    const data = await res.json();
    return { success: true, data: data?.data || data };
  } catch (error: any) {
    return { success: false, error: error.message || "Network error" };
  }
}
