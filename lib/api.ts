import { auth } from "@/lib/auth";

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

      if (session?.error === "RefreshAccessTokenError") {
        console.warn(`[apiFetch] Refresh token expired for ${endpoint}.`);
        throw new Error("Session expired. Please log in again.");
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
        if (response.status === 401 && i < retries - 1) {
          const delay = (i + 1) * 1000 + Math.random() * 500;
          console.warn(`[apiFetch] 401 Unauthorized for ${endpoint}. Retrying (Attempt ${i + 2}/${retries}) in ${Math.round(delay)}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        const errorText = await response.text().catch(() => "");
        let errorData: any = {};
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText || `API Request Failed with status ${response.status}` };
        }
        console.error(`[apiFetch] ERROR [${response.status}] ${url}:`, errorData);
        throw new Error(errorData.detail?.error || errorData.message || `API Request Failed with status ${response.status}`);
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
