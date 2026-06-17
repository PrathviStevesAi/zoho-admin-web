"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App Error Boundary caught an error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-slate-50 p-4 text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      <h2 className="text-2xl font-bold mb-3 text-slate-800">Something went wrong!</h2>
      <div className="text-slate-600 mb-8 max-w-md bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <span className="font-semibold block mb-2 text-slate-700">Error Details:</span>
        <code className="text-sm text-red-600 break-words">{error.message || "An unexpected error occurred. Please try again."}</code>
        {error.digest && (
          <div className="mt-2 text-xs text-slate-500">Digest: {error.digest}</div>
        )}
      </div>
      <div className="flex gap-4">
        <Button onClick={() => reset()} className="bg-[#0064cb] hover:bg-[#0052ae] text-white">
          Try again
        </Button>
        <Link href="/dashboard">
          <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-100">
            Go to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
