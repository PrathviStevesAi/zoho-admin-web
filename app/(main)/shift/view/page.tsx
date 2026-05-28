"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ShiftDashboard } from "@/components/shift/ShiftDashboard";

function ShiftViewContent() {
  const searchParams = useSearchParams();
  const shiftId = searchParams.get("shift_id") || "";
  const notificationId = searchParams.get("notification_id");

  return <ShiftDashboard shiftId={shiftId} notificationId={notificationId} />;
}

export default function ShiftViewPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-6 flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 animate-spin text-[#0064cb]" />
          <p className="text-slate-700 font-medium animate-pulse mt-4">Loading shift details...</p>
        </div>
      }
    >
      <ShiftViewContent />
    </Suspense>
  );
}