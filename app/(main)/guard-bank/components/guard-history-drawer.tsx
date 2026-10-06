"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface GuardHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history?: any[];
}

function formatHistoryDate(dateStr?: string | null): string {
  if (!dateStr) return "-";
  try {
    // Handle MM/DD/YY or MM/DD/YYYY
    const slashMatch = String(dateStr).match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(.*)$/);
    if (slashMatch) {
      const month = parseInt(slashMatch[1], 10) - 1;
      const day = parseInt(slashMatch[2], 10);
      let year = parseInt(slashMatch[3], 10);
      if (year < 100) year += 2000;
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        const monthName = d.toLocaleDateString("en-US", { month: "short" });
        const dayPadded = String(day).padStart(2, "0");
        const rest = slashMatch[4]?.trim();
        return `${monthName} ${dayPadded}, ${year}${rest ? ` ${rest}` : ""}`;
      }
    }

    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      const month = parsed.toLocaleDateString("en-US", { month: "short" });
      const day = String(parsed.getDate()).padStart(2, "0");
      const year = parsed.getFullYear();
      let hours = parsed.getHours();
      const minutes = String(parsed.getMinutes()).padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12;
      const formattedHours = String(hours).padStart(2, "0");
      return `${month} ${day}, ${year} ${formattedHours}:${minutes} ${ampm}`;
    }
  } catch {
    // fallback
  }
  return String(dateStr);
}

export function GuardHistoryDrawer({
  isOpen,
  onClose,
  history = []
}: GuardHistoryDrawerProps) {
  const historyList = Array.isArray(history) ? history : [];

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/20 transition-opacity duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed inset-y-0 right-0 z-50 w-full sm:w-[360px] max-w-[360px] bg-white shadow-2xl border-l border-slate-200 flex flex-col duration-300 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right focus:outline-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white shrink-0">
            <DialogPrimitive.Title className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              History
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only">
              Guard history timeline and activity logs
            </DialogPrimitive.Description>
            <DialogPrimitive.Close
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer focus:outline-none"
            >
              <X className="w-5 h-5" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          </div>

          {/* Scrollable Timeline */}
          <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6">
            {historyList.length > 0 ? (
              <div className="relative pl-6 space-y-6 before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
                {historyList.map((item: any, idx: number) => {
                  const action = item.Action || item.action || item.action_name || "-";
                  const by = item.By || item.by || item.performed_by || "-";
                  const date = formatHistoryDate(item.Date || item.date || item.created_at || item.performed_on);
                  const reason =
                    item.Reason ||
                    item.reason ||
                    item.notes ||
                    item.details?.reason ||
                    item.details?.Reason;
                  const isBlueDot = idx < 2 || action === "Approved" || action === "Record Touched";

                  return (
                    <div key={idx} className="relative group border-b border-slate-100/80 pb-6 last:border-b-0 last:pb-0">
                      {/* Timeline Dot */}
                      <div
                        className={cn(
                          "absolute -left-[25px] top-1 w-3 h-3 rounded-full border-2 border-white ring-2",
                          isBlueDot
                            ? "bg-[#0064cb] ring-blue-100"
                            : "bg-[#94a3b8] ring-slate-100"
                        )}
                      />

                      {/* Content Rows */}
                      <div className="space-y-2">
                        <div className="flex items-start">
                          <span className="text-xs font-bold text-slate-800 w-18 shrink-0">Action</span>
                          <span className="text-xs sm:text-sm font-bold text-slate-900">{action}</span>
                        </div>
                        <div className="flex items-start">
                          <span className="text-xs font-bold text-slate-800 w-18 shrink-0">By</span>
                          <span className="text-xs font-medium text-slate-600 break-all">{by}</span>
                        </div>
                        <div className="flex items-start">
                          <span className="text-xs font-bold text-slate-800 w-18 shrink-0">Date</span>
                          <span className="text-xs font-medium text-slate-600">{date}</span>
                        </div>
                        {reason && (
                          <div className="flex items-start">
                            <span className="text-xs font-bold text-slate-800 w-18 shrink-0">Reason</span>
                            <span className="text-xs font-medium text-slate-600 leading-relaxed">{reason}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-16 text-slate-400">
                <Clock className="w-10 h-10 mb-3 stroke-[1.5] text-slate-300" />
                <p className="text-sm font-medium text-slate-600">No history available</p>
              </div>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
