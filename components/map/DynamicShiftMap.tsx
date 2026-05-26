"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";

const ShiftMap = dynamic(() => import("./ShiftMap"), {
  ssr: false,
  loading: () => (
    <Card className="border-slate-200 shadow-sm rounded-xl bg-white overflow-hidden p-1 mt-6">
      <div className="h-[400px] w-full rounded-lg bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#0064cb] animate-spin mb-3" />
        <span className="text-slate-500 font-medium text-sm">Loading map...</span>
      </div>
    </Card>
  ),
});

export function DynamicShiftMap(props: any) {
  return <ShiftMap {...props} />;
}
