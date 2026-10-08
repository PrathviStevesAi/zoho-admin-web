"use client";

import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AvailableGuardsStepperProps {
  activeStep: number;
  onStep1Click: () => void;
  onStep2Click: () => void;
}

export function AvailableGuardsStepper({
  activeStep,
  onStep1Click,
  onStep2Click,
}: AvailableGuardsStepperProps) {
  return (
    <div className="flex items-center justify-center py-2 px-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onStep1Click}
          disabled={activeStep === 1}
          className={cn(
            "flex items-center gap-2.5 px-5 py-2 rounded-full transition-all cursor-pointer shadow-xs",
            activeStep === 1
              ? "bg-[#0064cb] text-white shadow-md shadow-blue-200 border border-[#0064cb]"
              : "bg-white text-slate-800 border border-slate-200 hover:border-[#0064cb] hover:text-[#0064cb]"
          )}
        >
          <div
            className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs",
              activeStep === 1 ? "bg-white/20 text-white" : "bg-[#f0f4f9] text-[#0064cb]"
            )}
          >
            1
          </div>
          <span className="text-sm font-bold tracking-tight">Select Shift</span>
        </button>

        <ChevronRight className="w-4 h-4 text-slate-300" />

        <button
          type="button"
          onClick={onStep2Click}
          disabled={activeStep === 2}
          className={cn(
            "flex items-center gap-2.5 px-5 py-2 rounded-full transition-all cursor-pointer shadow-xs",
            activeStep === 2
              ? "bg-[#0064cb] text-white shadow-md shadow-blue-200 border border-[#0064cb]"
              : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:text-slate-700"
          )}
        >
          <div
            className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs",
              activeStep === 2 ? "bg-white/20 text-white" : "bg-[#f8fafc] text-slate-400"
            )}
          >
            2
          </div>
          <span className="text-sm font-bold tracking-tight">Select Guard</span>
        </button>
      </div>
    </div>
  );
}
