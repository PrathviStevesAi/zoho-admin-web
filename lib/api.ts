import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  retries: number = 5
): Promise<T> {
  const url = `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`;
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      const session = await auth() as any;
      const token = session?.accessToken;
      console.log('token', token);

      if (!token) console.warn(`[apiFetch] No token found for ${endpoint}`);

      if (session?.user?.role && session.user.role !== "admin" && session.user.role !== "member") {
        // Silently abort the fetch for non-admins to prevent 12 parallel routes from 
        // throwing 403 errors in the server console, since the layout already blocks the UI.
        return { success: false, data: [], pagination: { page: 1, limit: 10, total: 0, total_pages: 0 } } as any;
      }

      if (session?.error === "RefreshAccessTokenError") {
        console.warn(`[apiFetch] Refresh token expired for ${endpoint}. Redirecting to login.`);
        redirect("/admin-login");
      }

      const response = await fetch(
        url,
        {
          ...options,
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
          },
        },
      );

      if (!response.ok) {
        if (response.status === 401) {
          if (i < retries - 1) {
            const delay = (i + 1) * 1000 + Math.random() * 500;
            console.warn(`[apiFetch] 401 Unauthorized for ${endpoint}. Retrying (Attempt ${i + 2}/${retries}) in ${Math.round(delay)}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          } else {
            console.warn(`[apiFetch] 401 Unauthorized persisted after ${retries} attempts for ${endpoint}. Redirecting to login.`);
            redirect("/admin-login");
          }
        }

        const errorText = await response.text().catch(() => "");
        let errorData: any = {};
        try {
          errorData = JSON.parse(errorText);
        } catch {
          if (errorText.trim().toLowerCase().startsWith("<!doctype") || errorText.trim().toLowerCase().startsWith("<html")) {
            errorData = { message: `Service is currently unreachable (Status ${response.status}). Please check your connection or try again later.` };
          } else {
            errorData = { message: errorText || `API Request Failed with status ${response.status}` };
          }
        }
        let detailMessage = "";
        if (typeof errorData.detail === "string") {
          try {
            const repairedStr = errorData.detail
              .replace(/'/g, '"')
              .replace(/\bFalse\b/g, "false")
              .replace(/\bTrue\b/g, "true")
              .replace(/\bNone\b/g, "null");
            const parsedDetail = JSON.parse(repairedStr);
            detailMessage = parsedDetail.error || parsedDetail.message || errorData.detail;
          } catch (e) {
            detailMessage = errorData.detail;
          }
        } else {
          detailMessage = errorData.detail?.error || errorData.detail?.message || errorData.message || `API Request Failed with status ${response.status}`;
        }
        throw new Error(detailMessage);
      }
      const successText = await response.text();
      let data: any;
      try {
        data = JSON.parse(successText);
      } catch (err) {
        console.error(`[apiFetch] Failed to parse JSON response from ${url}. Response text starts with:`, successText.substring(0, 200));
        throw new Error(`Invalid response format from server (expected JSON but got: ${successText.substring(0, 100)}...)`);
      }
      console.log(`[apiFetch] SUCCESS [${response.status}] ${url}:`, data);
      return data;
    } catch (error: any) {
      lastError = error;
      if (error.message?.includes('fetch failed') || error.code === 'ECONNRESET' || error.cause?.code === 'ECONNRESET') {
        console.warn(`Network reset detected for ${endpoint}, retrying in ${500 * (i + 1)}ms...`);
        await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}
