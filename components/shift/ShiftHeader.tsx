"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, ArrowLeft, Loader2, Play, Settings, XCircle, UserPlus, Video, UserCheck, Send, BadgeCheck, XOctagon, Mic, Clock } from "lucide-react";
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
  isStandbyGuardsOpen?: boolean;
  isSendReportOpen?: boolean;
  isApproveShiftOpen?: boolean;
  isNotApproveShiftOpen?: boolean;
  isCallRecordingsOpen?: boolean;
  isReassign?: boolean;
  onCloseNewAssign: () => void;
  onCloseStandbyGuards?: () => void;
  onCloseSendReport?: () => void;
  onCloseApproveShift?: () => void;
  onCloseNotApproveShift?: () => void;
  onCloseCallRecordings?: () => void;
  isStartingShift: boolean;
  onManualStart: () => void;
  onAssignGuard: () => void;
  onNewAssignGuard: () => void;
  onAssignLeadGuard: () => void;
  onAssignStandbyGuard: () => void;
  onReassignLeadGuard: () => void;
  onReassignStandbyGuard: () => void;
  onFindStandbyGuard?: () => void;
  onCancelService?: () => void;
  onCallRecording?: () => void;
  showSettingBtn: boolean;
  onStartVideoCall: () => void;
  onJoinVideoCall: () => void;
  onSendReport?: () => void;
  onApproveShift?: () => void;
  onNotApproveShift?: () => void;
  isLoading?: boolean;
}

function DigitalClock({ timeZone, city, state }: { timeZone?: string; city?: string; state?: string }) {
  const [dateTime, setDateTime] = useState<string>("");

  useEffect(() => {
    if (!timeZone) return;

    const updateTime = () => {
      try {
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone,
          month: '2-digit',
          day: '2-digit',
          year: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        });

        // The default en-US format is "MM/DD/YY, HH:MM:SS AM/PM"
        setDateTime(formatter.format(new Date()));
      } catch (e) {
        console.error("Invalid timezone", e);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [timeZone]);

  if (!timeZone || !dateTime) return null;

  const [datePart, timePart] = dateTime.split(', ');

  return (
    <div className="flex flex-col items-center md:items-end shrink-0 mt-4 md:mt-0 w-full md:w-auto">
      <div className="flex items-center gap-2 text-base sm:text-md font-bold text-slate-800 tracking-wider font-mono bg-slate-50 px-3 py-1.5 sm:px-4 sm:py-2 rounded-sm border border-slate-200 shadow-sm">
        <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[#0064cb]" />
        {datePart && timePart ? (
          <>
            <span className="text-slate-600 text-sm">{datePart},</span>
            <span className="text-slate-800 text-md">{timePart}</span>
          </>
        ) : (
          dateTime
        )}
      </div>
      {(state || city) && (
        <div className="text-[10px] sm:text-xs text-slate-500 font-medium mt-1 tracking-wide">
          <span className="text-slate-800 font-semibold">Timezone : </span>
          {[state, city].filter(Boolean).join(" / ")}
        </div>
      )}
    </div>
  );
}

export function ShiftHeader({
  shift,
  shiftId,
  notificationId,
  isSettingsOpen,
  setIsSettingsOpen,
  isNewAssignOpen,
  isStandbyGuardsOpen,
  isSendReportOpen,
  isApproveShiftOpen,
  isNotApproveShiftOpen,
  isCallRecordingsOpen,
  isReassign,
  onCloseNewAssign,
  onCloseStandbyGuards,
  onCloseSendReport,
  onCloseApproveShift,
  onCloseNotApproveShift,
  onCloseCallRecordings,
  isStartingShift,
  onManualStart,
  onAssignGuard,
  onNewAssignGuard,
  onAssignLeadGuard,
  onAssignStandbyGuard,
  onReassignLeadGuard,
  onReassignStandbyGuard,
  onFindStandbyGuard,
  onCancelService,
  onCallRecording,
  onStartVideoCall,
  onJoinVideoCall,
  onSendReport,
  onApproveShift,
  onNotApproveShift,
  isLoading,
}: ShiftHeaderProps) {
  const router = useRouter();

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
                if (onCloseStandbyGuards) onCloseStandbyGuards();
                if (onCloseSendReport) onCloseSendReport();
                if (onCloseApproveShift) onCloseApproveShift();
                if (onCloseNotApproveShift) onCloseNotApproveShift();
                if (onCloseCallRecordings) onCloseCallRecordings();
              }}
              className={cn(
                "transition-colors font-medium",
                (isSettingsOpen || isNewAssignOpen || isStandbyGuardsOpen || isSendReportOpen || isApproveShiftOpen || isNotApproveShiftOpen || isCallRecordingsOpen)
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
            {isStandbyGuardsOpen && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-[#0064cb] font-bold">Standby Guard</span>
              </>
            )}
            {isSendReportOpen && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-[#0064cb] font-bold">Send Report</span>
              </>
            )}
            {isApproveShiftOpen && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-[#0064cb] font-bold">Approved Shift</span>
              </>
            )}
            {isNotApproveShiftOpen && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-[#0064cb] font-bold">Not Approved Shift</span>
              </>
            )}
            {isCallRecordingsOpen && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-[#0064cb] font-bold">Call Recording</span>
              </>
            )}
          </div>
          <div className="flex items-start sm:items-center gap-3">
            <button
              onClick={() => router.back()}
              className="cursor-pointer p-2 bg-white rounded-lg border border-slate-200 text-slate-700 hover:text-[#0064cb] transition-all shrink-0 mt-0.5 sm:mt-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
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
                <div className="absolute left-0 top-full mt-2 w-[280px] sm:w-80 md:w-96 p-3 sm:p-4 bg-slate-900 text-white text-[11px] rounded-xl sm:rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[70] border border-slate-800 shadow-blue-900/20">
                  <div className="absolute -top-1.5 left-6 w-3 h-3 bg-slate-900 rotate-45 border-l border-t border-slate-800" />
                  <div className="flex items-center gap-2 mb-2 sm:mb-3 pb-2 border-b border-slate-800">
                    <p className="font-bold text-blue-400">Shift Description</p>
                  </div>
                  <div className="max-h-[250px] sm:max-h-[350px] overflow-y-auto custom-scrollbar pr-1 text-slate-300 leading-relaxed">
                    {formatDescription(shift.invoice_description)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {shift?.action?.is_show_clock && shift?.shipping_location?.timezone && (
          <DigitalClock
            timeZone={shift.shipping_location.timezone}
            city={shift.shipping_location.location?.city}
            state={shift.shipping_location.location?.state}
          />
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-6 md:gap-x-12 gap-y-6 py-4">
        {(() => {
          if (!shift) return null;
          const buttons: any[] = [];

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
            if (act.is_new_lead_assigned) {
              buttons.push({
                label: "Assign New Lead Guard",
                icon: UserPlus,
                color: "blue" as const,
                onClick: onAssignLeadGuard,
              });
            }
            if (act.is_new_standby_assigned) {
              buttons.push({
                label: "Assign New Standby Guard",
                icon: UserPlus,
                color: "yellow" as const,
                onClick: onAssignStandbyGuard,
              });
            }
            if (act.is_lead_reassigned) {
              buttons.push({
                label: "Re-Assign Lead Guard",
                icon: UserPlus,
                color: "indigo" as const,
                onClick: onReassignLeadGuard,
              });
            }
            if (act.is_standby_reassigned) {
              buttons.push({
                label: "Re-Assign Standby Guard",
                icon: UserPlus,
                color: "yellow" as const,
                onClick: onReassignStandbyGuard,
              });
            }
            if (act.is_find_standby_guard) {
              buttons.push({
                label: "Standby Guard",
                icon: UserCheck,
                color: "teal" as const,
                onClick: onFindStandbyGuard || (() => { }),
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
            if (act.is_vc_start) {
              buttons.push({
                label: "Video Call",
                icon: Video,
                color: "orange" as const,
                onClick: onStartVideoCall,
              });
            }
            if (act.is_call_recording) {
              buttons.push({
                label: "Call Recording",
                icon: Mic,
                color: isCallRecordingsOpen ? ("blue" as const) : ("slate" as const),
                onClick: onCallRecording || (() => { }),
              });
            }
            if (act.is_send_report) {
              buttons.push({
                label: "Send Report",
                icon: Send,
                color: "blue" as const,
                onClick: onSendReport || (() => { }),
              });
            }
            if (act.is_approved) {
              buttons.push({
                label: "Approved Shift",
                icon: BadgeCheck,
                color: "emerald" as const,
                onClick: onApproveShift || (() => { }),
              });
            }
            if (act.is_not_approved) {
              buttons.push({
                label: "Not Approved Shift",
                icon: XOctagon,
                color: "red" as const,
                onClick: onNotApproveShift || (() => { }),
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
                  action.color === "yellow" && "border-yellow-500 text-yellow-600 group-hover:bg-yellow-50",
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
