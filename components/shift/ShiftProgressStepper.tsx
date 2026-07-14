import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Shift } from "./types";

interface ShiftProgressStepperProps {
  shift: Shift | null;
}

const STATUS_STEPS_MAP: Record<string, string[]> = {
  shift_created: ["shift_created"],
  shift_planned: ["shift_created", "shift_planned"],
  shift_accepted: ["shift_created", "shift_planned", "shift_accepted"],
  shift_refused: ["shift_created", "shift_planned", "shift_refused"],
  shift_arrival: ["shift_created", "shift_planned", "shift_accepted", "shift_arrival"],
  shift_pre_check_in: ["shift_created", "shift_planned", "shift_accepted", "shift_arrival", "shift_pre_check_in"],
  shift_in_progress: ["shift_created", "shift_planned", "shift_accepted", "shift_arrival", "shift_pre_check_in", "shift_in_progress"],
  shift_in_break: ["shift_created", "shift_planned", "shift_accepted", "shift_arrival", "shift_pre_check_in", "shift_in_break"],
  shift_finished: ["shift_created", "shift_planned", "shift_accepted", "shift_arrival", "shift_pre_check_in", "shift_in_progress", "shift_finished"],
  shift_approved: ["shift_created", "shift_planned", "shift_accepted", "shift_arrival", "shift_pre_check_in", "shift_in_progress", "shift_finished", "shift_approved"],
  shift_not_approved: ["shift_created", "shift_planned", "shift_accepted", "shift_arrival", "shift_pre_check_in", "shift_in_progress", "shift_finished", "shift_not_approved"],
  shift_cancelled: ["shift_cancelled"],
};

const STATUS_LABELS: Record<string, string> = {
  shift_created: "Shift Created",
  shift_planned: "Shift Planned",
  shift_accepted: "Shift Accepted",
  shift_refused: "Shift Refused",
  shift_arrival: "Shift Arrival",
  shift_pre_check_in: "Pre-shift Check-in completed",
  shift_in_progress: "Shift In Progress",
  shift_in_break: "Shift In Break",
  shift_finished: "Shift Finished",
  shift_approved: "Shift Approved",
  shift_not_approved: "Shift Not Approved",
  shift_cancelled: "Shift Cancelled",
};

export function ShiftProgressStepper({ shift }: ShiftProgressStepperProps) {
  const currentStatus = shift?.status?.toLowerCase() || "shift_created";
  const statusSteps = STATUS_STEPS_MAP[currentStatus] || [currentStatus];

  const steps = statusSteps.map((statusName, idx) => {
    return {
      label: STATUS_LABELS[statusName] || statusName,
      status: "completed" as "completed" | "current" | "upcoming",
    };
  });

  const activeIndex = steps.findIndex(s => s.status === "current");
  const lastCompletedIndex = steps.reduce((acc, s, idx) => s.status === "completed" ? idx : acc, -1);
  const progressIndex = activeIndex !== -1 ? activeIndex : lastCompletedIndex;

  const progressPercentage = steps.length > 1 ? (Math.max(0, progressIndex) / (steps.length - 1)) * 100 : 0;
  const startPercent = steps.length > 0 ? 50 / steps.length : 0;
  const fillWidthPercent = steps.length > 1 ? progressPercentage * ((steps.length - 1) / steps.length) : 0;

  return (
    <Card className="border-slate-200 shadow-sm rounded-xl bg-white p-6 md:p-8">
      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-tight mb-6">Progress</h3>

      <div className="relative md:px-4">
        <div
          className="hidden md:block absolute top-4 h-[3px] bg-slate-100 rounded-full"
          style={{ left: `${startPercent}%`, right: `${startPercent}%` }}
        />
        <div
          className="hidden md:block absolute top-4 h-[3px] bg-gradient-to-r from-[#0064cb] to-[#3b82f6] rounded-full transition-all duration-500"
          style={{ left: `${startPercent}%`, width: `${fillWidthPercent}%` }}
        />
        <div className="md:hidden absolute left-4 top-3 bottom-3 w-[3px] bg-slate-100 rounded-full" />
        <div
          className="md:hidden absolute left-4 top-3 w-[3px] bg-gradient-to-b from-[#0064cb] to-[#3b82f6] rounded-full transition-all duration-500"
          style={{ height: `${progressPercentage}%` }}
        />
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-start relative gap-6 md:gap-0">
          {steps.map((step, idx) => (
            <div key={idx} className="flex flex-row md:flex-col items-center md:items-center flex-1 group gap-4 md:gap-0">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center relative z-10 transition-all duration-300 shrink-0",
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
              <div className="md:mt-4 px-1 text-left md:text-center flex-1">
                <span className={cn(
                  "text-[11px] font-bold block leading-snug transition-colors",
                  step.status === "completed" && "text-slate-800",
                  step.status === "current" && "text-[#0064cb] font-extrabold",
                  step.status === "upcoming" && "text-slate-500"
                )}>
                  {step.label}
                </span>
                <div className="flex items-center gap-1.5 mt-0.5 justify-start md:justify-center">
                  {step.status === "completed" && (
                    <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Completed</span>
                  )}
                  {step.status === "current" && (
                    <span className="text-[9px] font-bold text-[#0064cb] uppercase tracking-wider animate-pulse">Active</span>
                  )}
                  {step.status === "upcoming" && (
                    <span className="text-[9px] font-bold text-slate-700 uppercase tracking-wider">Pending</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
