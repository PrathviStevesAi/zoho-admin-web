import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Shift } from "./types";

interface ShiftProgressStepperProps {
  shift: Shift | null;
}

export function ShiftProgressStepper({ shift }: ShiftProgressStepperProps) {
  const getStepStatus = (stepName: string) => {
    if (!shift) return "upcoming";
    const statusOrder = [
      "shift_planned",
      "shift_accepted",
      "shift_in_progress",
      "shift_finished",
      "shift_approved"
    ];

    const currentStatus = shift.status;
    const currentIndex = statusOrder.indexOf(currentStatus);
    const stepIndex = statusOrder.indexOf(stepName);

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    return "upcoming";
  };

  const steps = [
    { label: "Shift Planned", status: getStepStatus("shift_planned") },
    { label: "Shift Accepted", status: getStepStatus("shift_accepted") },
    { label: "Shift In Progress", status: getStepStatus("shift_in_progress") },
    { label: "Shift Finished", status: getStepStatus("shift_finished") },
    { label: "Shift Approved", status: getStepStatus("shift_approved") },
    { label: "Pre-shift Check-in completed", status: "upcoming" },
  ];

  const activeIndex = steps.findIndex(s => s.status === "current");
  const lastCompletedIndex = steps.reduce((acc, s, idx) => s.status === "completed" ? idx : acc, -1);
  const progressIndex = activeIndex !== -1 ? activeIndex : lastCompletedIndex;
  const progressPercentage = steps.length > 1 ? (Math.max(0, progressIndex) / (steps.length - 1)) * 100 : 0;

  return (
    <Card className="border-slate-200 shadow-sm rounded-xl bg-white p-8">
      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-tight mb-6">Progress</h3>

      <div className="relative px-4">
        {/* Background Track Line */}
        <div className="absolute top-4 left-[8.33%] right-[8.33%] h-[3px] bg-slate-100 rounded-full" />

        {/* Active Progress Fill Line */}
        <div
          className="absolute top-4 left-[8.33%] h-[3px] bg-gradient-to-r from-[#0064cb] to-[#3b82f6] rounded-full transition-all duration-500"
          style={{ width: `${progressPercentage * 0.8333}%` }}
        />

        <div className="flex justify-between items-start relative">
          {steps.map((step, idx) => (
            <div key={idx} className="flex flex-col items-center flex-1 group">
              {/* Circle Indicator */}
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center relative z-10 transition-all duration-300",
                step.status === "completed" && "bg-emerald-500 border border-emerald-500 text-white shadow-md shadow-emerald-100",
                step.status === "current" && "bg-white border-2 border-[#0064cb] text-[#0064cb] shadow-[0_0_0_5px_rgba(0,100,203,0.12)]",
                step.status === "upcoming" && "bg-white border border-slate-200 text-slate-300"
              )}>
                {step.status === "completed" ? (
                  <svg className="w-4 h-4 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : step.status === "current" ? (
                  <span className="w-2.5 h-2.5 bg-[#0064cb] rounded-full animate-pulse" />
                ) : (
                  <span className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
                )}
              </div>

              {/* Label */}
              <div className="mt-4 px-1 text-center">
                <span className={cn(
                  "text-[11px] font-bold block leading-snug transition-colors",
                  step.status === "completed" && "text-slate-800",
                  step.status === "current" && "text-[#0064cb] font-extrabold",
                  step.status === "upcoming" && "text-slate-500"
                )}>
                  {step.label}
                </span>
                {step.status === "completed" && (
                  <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider block mt-0.5">Completed</span>
                )}
                {step.status === "current" && (
                  <span className="text-[9px] font-bold text-[#0064cb] uppercase tracking-wider block mt-0.5 animate-pulse">Active</span>
                )}
                {step.status === "upcoming" && (
                  <span className="text-[9px] font-bold text-slate-700 uppercase tracking-wider block mt-0.5">Pending</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
