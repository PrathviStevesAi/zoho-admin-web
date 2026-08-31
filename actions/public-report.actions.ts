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

export async function submitPublicShiftReviewAction(
  shiftId: string,
  reportToken: string,
  data: {
    customer_service_rating: number;
    customer_service_review: string;
    customer_guard_rating: number;
    customer_guard_review: string;
  }
) {
  try {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/shift/public/${shiftId}/review/${reportToken}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-api-key": "trk_live_7f9c2a4d8b1e5f6a9c3d2e7f8a1b4c6d",
    };

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return { success: false, error: errorData.message || "Failed to submit review" };
    }

    const responseData = await res.json().catch(() => ({}));
    return { success: true, data: responseData };
  } catch (error: any) {
    return { success: false, error: error.message || "Network error" };
  }
}
