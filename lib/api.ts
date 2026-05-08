import { auth } from "@/lib/auth";

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  retries: number = 3
): Promise<T> {
  const session = await auth();
  const token = session?.accessToken;
  console.log("Authorization Token:", token);

  const url = `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`;
  
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Fetching API (Attempt ${i + 1}): ${url}`);
      const response = await fetch(
        url,
        {
          ...options,
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`API Error [${response.status}] ${endpoint}:`, errorData);
        throw new Error(errorData.message || `API Request Failed with status ${response.status}`);
      }
      return response.json();
    } catch (error: any) {
      lastError = error;
      // Check if it's a network error that we should retry (like ECONNRESET)
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
