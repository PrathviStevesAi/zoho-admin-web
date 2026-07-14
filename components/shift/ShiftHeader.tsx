import Link from "next/link";
import { ChevronRight, ArrowLeft, Loader2, Play, Settings, XCircle, UserPlus, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDescription } from "./utils";
import { Shift } from "./types";

interface ShiftHeaderProps {
  shift: Shift | null;
  shiftId: string;
  notificationId?: string | null;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  isNewAssignOpen: boolean;
  isReassign?: boolean;
  onCloseNewAssign: () => void;
  isStartingShift: boolean;
  onManualStart: () => void;
  onAssignGuard: () => void;
  onNewAssignGuard: () => void;
  onCancelService: () => void;
  showSettingBtn: boolean;
  onStartVideoCall: () => void;
  onJoinVideoCall: () => void;
  isLoading?: boolean;
}

export function ShiftHeader({
  shift,
  shiftId,
  notificationId,
  isSettingsOpen,
  setIsSettingsOpen,
  isNewAssignOpen,
  isReassign,
  onCloseNewAssign,
  isStartingShift,
  onManualStart,
  onAssignGuard,
  onNewAssignGuard,
  onCancelService,
  onStartVideoCall,
  onJoinVideoCall,
  isLoading,
}: ShiftHeaderProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-slate-700 text-[13px] mb-1">
            <Link href="/dashboard" className="hover:text-[#0064cb] transition-colors">
              Dashboard
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link
              href={`/shift/view?shift_id=${shiftId}${notificationId ? `&notification_id=${notificationId}` : ""}`}
              onClick={(e) => {
                e.preventDefault();
                setIsSettingsOpen(false);
                onCloseNewAssign();
              }}
              className={cn(
                "transition-colors font-medium",
                (isSettingsOpen || isNewAssignOpen)
                  ? "text-slate-500 hover:text-[#0064cb] cursor-pointer"
                  : "text-[#0064cb] font-bold cursor-default pointer-events-none"
              )}
            >
              Shift View
            </Link>
            {isSettingsOpen && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-[#0064cb] font-bold">Setting</span>
              </>
            )}
            {isNewAssignOpen && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-[#0064cb] font-bold">{isReassign ? "Re-Assign Guard" : "New Assign Guard"}</span>
              </>
            )}
          </div>
          <div className="flex items-start sm:items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 bg-white rounded-lg border border-slate-200 text-slate-700 hover:text-[#0064cb] transition-all shrink-0 mt-0.5 sm:mt-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="group relative">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 flex flex-wrap items-center gap-x-2 gap-y-1 cursor-default">
                {shift ? (
                  <>
                    {shift.customer_id ? (
                      <Link href={`/users-directory/customers/${shift.customer_id}`} className="hover:text-[#0064cb] hover:underline transition-colors text-[#0064cb]">
                        {shift.customer_name}
                      </Link>
                    ) : (
                      <span className="hover:text-[#0064cb] transition-colors">{shift.customer_name}</span>
                    )}
                    {shift.invoice_id ? (
                      <Link
                        href={`/invoices/${shift.invoice_id}`}
                        className="text-slate-700 font-normal hover:text-[#0064cb] hover:underline cursor-pointer whitespace-nowrap"
                      >
                        [ #{shift.invoice_no || "not found"} ]
                      </Link>
                    ) : (
                      <span className="text-slate-700 font-normal whitespace-nowrap">[ #{shift.invoice_no || "not found"} ]</span>
                    )}
                  </>
                ) : isLoading ? (
                  <div className="flex items-center gap-2 animate-pulse py-1">
                    <div className="h-6 w-32 bg-slate-200 rounded-md"></div>
                    <div className="h-6 w-24 bg-slate-100 rounded-md"></div>
                  </div>
                ) : (
                  <span className="hover:text-[#0064cb] transition-colors">Shift View</span>
                )}
              </h1>

              {shift?.invoice_description && (
                <div className="absolute left-0 top-full mt-2 w-80 p-4 bg-slate-900 text-white text-[11px] rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[70] border border-slate-800 shadow-blue-900/20">
                  <div className="absolute -top-1.5 left-6 w-3 h-3 bg-slate-900 rotate-45 border-l border-t border-slate-800" />
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800">
                    <p className="font-bold text-blue-400">Shift Description</p>
                  </div>
                  <div className="max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
                    {formatDescription(shift.invoice_description)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-6 md:gap-x-12 gap-y-6 py-4">
        {(() => {
          if (!shift) return null;
          const buttons: any[] = [];

          console.log("[ShiftHeader] Shift Data Loaded:", shift);
          console.log("[ShiftHeader] shift.action:", shift?.action);
          console.log("[ShiftHeader] shift.action.is_manual_start_shift:", shift?.action?.is_manual_start_shift);

          if (shift.action && typeof shift.action === "object") {
            const act = shift.action;
            if (act.is_reassigned) {
              buttons.push({
                label: "Re-assign Guard",
                icon: UserPlus,
                color: "indigo" as const,
                onClick: onAssignGuard,
              });
            }
            if (act.is_new_assigned) {
              buttons.push({
                label: "Assign New Guard",
                icon: UserPlus,
                color: "blue" as const,
                onClick: onNewAssignGuard,
              });
            }
            if (act.is_manual_start_shift) {
              buttons.push({
                label: "Manual Start Shift",
                icon: Play,
                color: "emerald" as const,
                isLoading: isStartingShift,
                onClick: onManualStart,
              });
            }
            if (act.is_config_settings) {
              buttons.push({
                label: "Setting",
                icon: Settings,
                color: isSettingsOpen ? ("blue" as const) : ("slate" as const),
                onClick: () => setIsSettingsOpen(!isSettingsOpen),
              });
            }
            if (act.is_vc_start || act.is_join_vc_call) {
              buttons.push({
                label: "Video Call",
                icon: Video,
                color: "orange" as const,
                onClick: onStartVideoCall,
              });
            }

            if (act.is_cancel_service) {
              buttons.push({
                label: "Cancel Service",
                icon: XCircle,
                color: "red" as const,
                onClick: onCancelService,
              });
            }
          }

          const formatLabel = (label: string) => {
            const words = label.split(" ");
            if (words.length <= 2) {
              return label.replace(" ", "\n");
            }
            const lastWord = words.pop();
            return `${words.join(" ")}\n${lastWord}`;
          };

          return buttons.map((action, idx) => (
            <button
              key={idx}
              className="flex flex-col items-center gap-1.5 group cursor-pointer border-none bg-transparent focus:outline-none"
              onClick={action.onClick}
              disabled={action.isLoading}
            >
              <div
                className={cn(
                  "w-12 h-12 rounded-full border-2 flex items-center justify-center shadow-sm transition-colors",
                  action.color === "emerald" && "border-emerald-500 text-emerald-500 group-hover:bg-emerald-50",
                  action.color === "blue" &&
                  (isSettingsOpen && action.label === "Setting"
                    ? "border-[#0064cb] text-[#0064cb] bg-blue-50"
                    : "border-[#0064cb] text-[#0064cb] group-hover:bg-blue-50"),
                  action.color === "orange" && "border-orange-500 text-orange-500 group-hover:bg-orange-50",
                  action.color === "indigo" && "border-indigo-500 text-indigo-500 group-hover:bg-indigo-50",
                  action.color === "teal" && "border-teal-500 text-teal-500 group-hover:bg-teal-50",
                  action.color === "slate" && "border-slate-400 text-slate-800 group-hover:bg-slate-50",
                  action.color === "red" && "border-red-400 text-red-500 group-hover:bg-red-50"
                )}
              >
                {action.isLoading ? (
                  <Loader2 className="w-5.5 h-5.5 animate-spin" />
                ) : (
                  <action.icon className="w-5.5 h-5.5" />
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-bold text-slate-600 uppercase text-center leading-[1.2] tracking-tight whitespace-pre-line",
                  isSettingsOpen && action.label === "Setting" && "text-[#0064cb]"
                )}
              >
                {formatLabel(action.label)}
              </span>
            </button>
          ));
        })()}
      </div>
    </div>
  );
}
