"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function GuardBankErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Guard Bank Error Boundary caught an error:", error);
  }, [error]);

  const errorMessage =
    typeof error?.message === "string"
      ? error.message
      : typeof error === "object" && error !== null
      ? (error as any).error || "Failed to load Guard Bank data."
      : "An unexpected error occurred while loading Guard Bank.";

  return (
    <div className="flex h-[calc(100vh-140px)] w-full flex-col items-center justify-center p-4 text-center">
      <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-5 border border-red-100 shadow-sm">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      <h2 className="text-xl font-bold mb-2 text-slate-900">Guard Bank Encountered an Error</h2>
      <p className="text-slate-600 mb-6 max-w-md text-sm">
        We ran into a problem while loading the guards data. You can retry or return to the dashboard.
      </p>
      <div className="text-slate-600 mb-6 max-w-md w-full bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-left">
        <span className="text-xs font-bold block mb-1 text-slate-700">Error Details:</span>
        <code className="text-xs text-red-600 break-words font-mono block">
          {errorMessage}
        </code>
      </div>
      <div className="flex items-center gap-3">
        <Button
          onClick={() => reset()}
          className="bg-[#0064cb] hover:bg-[#0052ae] text-white flex items-center gap-2 px-5 h-10 rounded-xl font-semibold shadow-sm cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          Try again
        </Button>
        <Link href="/dashboard">
          <Button
            variant="outline"
            className="border-slate-200 text-slate-700 hover:bg-slate-50 h-10 rounded-xl font-semibold cursor-pointer"
          >
            Go to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
