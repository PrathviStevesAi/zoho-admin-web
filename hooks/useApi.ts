"use client";

import useSWR from 'swr';
import { useSession } from 'next-auth/react';

const fetcher = async ([url, token]: [string, string]) => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
      "Authorization": `Bearer ${token}`
    }
  });

  if (!response.ok) {
    if (response.status === 401) {
      window.location.href = "/admin-login";
    }
    const errorText = await response.text().catch(() => "");
    let errorData: any = {};
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { message: errorText || `API Request Failed with status ${response.status}` };
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

  return response.json();
};

export function useApi<T>(endpoint: string | null) {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken;
  const key = (endpoint && token) ? [endpoint, token] : null;

  const { data, error, isLoading, mutate } = useSWR<T>(key, fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false
  });

  return {
    data,
    isLoading,
    isError: error,
    mutate
  };
}
