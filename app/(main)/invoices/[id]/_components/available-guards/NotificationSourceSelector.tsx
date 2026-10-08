"use client";

import { Smartphone, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationSourceType } from "./types";

interface NotificationSourceSelectorProps {
  notificationSource: NotificationSourceType;
  onChange: (source: NotificationSourceType) => void;
}

export function NotificationSourceSelector({
  notificationSource,
  onChange,
}: NotificationSourceSelectorProps) {
  return (
    <div className="px-6 py-4 border-b border-slate-100 bg-white">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-0.5 lg:max-w-xs shrink-0">
          <h3 className="text-sm font-bold text-slate-900">Notification Source</h3>
          <p className="text-xs text-slate-500">
            Select how you want to send the job opportunity to guards.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 max-w-4xl">
          <div
            onClick={() => onChange("in_app")}
            className={cn(
              "p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5",
              notificationSource === "in_app"
                ? "border-2 border-[#0064cb] bg-blue-50/20"
                : "border-slate-200 bg-white hover:border-slate-300"
            )}
          >
            <div className="flex items-center gap-2.5">
              <Smartphone
                className={cn(
                  "w-5 h-5 shrink-0",
                  notificationSource === "in_app" ? "text-[#0064cb]" : "text-slate-600"
                )}
              />
              <div>
                <p
                  className={cn(
                    "text-xs font-bold leading-tight",
                    notificationSource === "in_app" ? "text-[#0064cb]" : "text-slate-800"
                  )}
                >
                  In App Notification
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Send notification inside the Fast Guard app
                </p>
              </div>
            </div>
            <div
              className={cn(
                "w-4 h-4 rounded-full border shrink-0 flex items-center justify-center",
                notificationSource === "in_app"
                  ? "border-2 border-[#0064cb]"
                  : "border-slate-300"
              )}
            >
              {notificationSource === "in_app" && (
                <div className="w-2 h-2 rounded-full bg-[#0064cb]" />
              )}
            </div>
          </div>

          <div
            onClick={() => onChange("sms")}
            className={cn(
              "p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5",
              notificationSource === "sms"
                ? "border-2 border-[#0064cb] bg-blue-50/20"
                : "border-slate-200 bg-white hover:border-slate-300"
            )}
          >
            <div className="flex items-center gap-2.5">
              <MessageSquare
                className={cn(
                  "w-5 h-5 shrink-0",
                  notificationSource === "sms" ? "text-[#0064cb]" : "text-slate-600"
                )}
              />
              <div>
                <p
                  className={cn(
                    "text-xs font-bold leading-tight",
                    notificationSource === "sms" ? "text-[#0064cb]" : "text-slate-800"
                  )}
                >
                  SMS (Text Message)
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Send SMS with job link (deep link to app)
                </p>
              </div>
            </div>
            <div
              className={cn(
                "w-4 h-4 rounded-full border shrink-0 flex items-center justify-center",
                notificationSource === "sms"
                  ? "border-2 border-[#0064cb]"
                  : "border-slate-300"
              )}
            >
              {notificationSource === "sms" && (
                <div className="w-2 h-2 rounded-full bg-[#0064cb]" />
              )}
            </div>
          </div>

          <div
            onClick={() => onChange("both")}
            className={cn(
              "p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5",
              notificationSource === "both"
                ? "border-2 border-[#0064cb] bg-blue-50/20"
                : "border-slate-200 bg-white hover:border-slate-300"
            )}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  "flex items-center -space-x-1 shrink-0",
                  notificationSource === "both" ? "text-[#0064cb]" : "text-slate-600"
                )}
              >
                <Smartphone className="w-4 h-4" />
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <p
                  className={cn(
                    "text-xs font-bold leading-tight",
                    notificationSource === "both" ? "text-[#0064cb]" : "text-slate-800"
                  )}
                >
                  Both (Recommended)
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Send in-app notification and SMS with job link
                </p>
              </div>
            </div>
            <div
              className={cn(
                "w-4 h-4 rounded-full border shrink-0 flex items-center justify-center",
                notificationSource === "both"
                  ? "border-2 border-[#0064cb]"
                  : "border-slate-300"
              )}
            >
              {notificationSource === "both" && (
                <div className="w-2 h-2 rounded-full bg-[#0064cb]" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
