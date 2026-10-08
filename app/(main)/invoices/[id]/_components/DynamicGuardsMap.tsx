"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const GuardsMap = dynamic(() => import("./GuardsMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[360px] w-full rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center">
      <Loader2 className="w-8 h-8 text-[#0064cb] animate-spin mb-2" />
      <span className="text-slate-500 font-medium text-xs">Loading map preview...</span>
    </div>
  ),
});

export function DynamicGuardsMap(props: any) {
  return <GuardsMap {...props} />;
}
