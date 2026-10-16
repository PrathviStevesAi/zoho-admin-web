import { getSession, signOut } from "next-auth/react";

export async function clientApiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  retries: number = 3
): Promise<T> {
  const url = `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`;
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      const session = await getSession() as any;
      const token = session?.accessToken;

      if (!token) console.warn(`[clientApiFetch] No token found for ${endpoint}`);

      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          if (typeof window !== "undefined") {
            signOut({ redirect: false }).then(() => {
              window.location.href = "/admin-login";
            });
          }
          throw new Error("Unauthorized");
        }

        const errorText = await response.text().catch(() => "");
        let errorData: any = {};
        try {
          errorData = JSON.parse(errorText);
        } catch {
          if (errorText.trim().toLowerCase().startsWith("<!doctype") || errorText.trim().toLowerCase().startsWith("<html")) {
            errorData = { message: `Service is currently unreachable (Status ${response.status}).` };
          } else {
            errorData = { message: errorText || `API Request Failed with status ${response.status}` };
          }
        }
        
        console.error(`[clientApiFetch] ERROR [${response.status}] ${url}:`, errorText);
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
        } else if (Array.isArray(errorData.detail)) {
          detailMessage = errorData.detail
            .map((e: any) => {
              if (typeof e === "string") return e;
              const field = Array.isArray(e.loc) ? e.loc.filter((l: any) => l !== "body").join(".") : "field";
              return `${field ? field + ": " : ""}${e.msg || e.message || JSON.stringify(e)}`;
            })
            .join("; ");
        } else {
          detailMessage = errorData.detail?.error || errorData.detail?.message || errorData.message || `API Request Failed with status ${response.status}`;
        }
        throw new Error(detailMessage);
      }
      
      const successText = await response.text();
      if (!successText || !successText.trim()) {
        return { success: true } as any;
      }
      let data: any;
      try {
        data = JSON.parse(successText);
      } catch (err) {
        return successText as any;
      }
      return data;
    } catch (error: any) {
      lastError = error;
      if (error.message?.includes('fetch failed') || error.code === 'ECONNRESET' || error.cause?.code === 'ECONNRESET') {
        await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}
