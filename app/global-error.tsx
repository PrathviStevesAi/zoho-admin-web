"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Error Boundary caught an error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-[100dvh] flex-col items-center justify-center bg-slate-50 p-4 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
          <svg
            className="w-8 h-8 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-3 text-slate-800">Critical Application Error</h2>
        <div className="text-slate-600 mb-8 max-w-md bg-white p-4 rounded-lg shadow-sm border border-slate-200">
          <span className="font-semibold block mb-2 text-slate-700">Error Details:</span>
          <code className="text-sm text-red-600 break-words">{error.message || "An unexpected error occurred. Please try again."}</code>
          {error.digest && (
            <div className="mt-2 text-xs text-slate-500">Digest: {error.digest}</div>
          )}
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-[#0064cb] hover:bg-[#0052ae] text-white rounded-md font-medium transition-colors"
          >
            Try again
          </button>
          <a
            href="/dashboard"
            className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-md font-medium transition-colors"
          >
            Go to Dashboard
          </a>
        </div>
      </body>
    </html>
  );
}
