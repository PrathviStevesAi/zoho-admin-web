"use client";

import { useState } from "react";
import Link from "next/link";
import {
  SendHorizontal,
  Loader2,
  Filter,
  Users,
  Smartphone,
  MessageSquare,
  Check,
  Pencil,
  History,
  ChevronRight,
  ArrowLeft,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { sendBroadcastNotificationAction } from "@/actions/notification.actions";
import { SelectGuardsDialog } from "./_components/SelectGuardsDialog";
import { BroadcastHistoryTable } from "./_components/BroadcastHistoryTable";

export default function BroadcastNotificationsPage() {
  const [activeTab, setActiveTab] = useState<"compose" | "history">("compose");
  const [historyTotalCount, setHistoryTotalCount] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [sendViaInApp, setSendViaInApp] = useState(false);
  const [sendViaSms, setSendViaSms] = useState(false);
  const [recipientType, setRecipientType] = useState<"all" | "filter">("all");
  const [isSending, setIsSending] = useState(false);
  const [selectedGuardIds, setSelectedGuardIds] = useState<string[]>([]);
  const [isSelectGuardsDialogOpen, setIsSelectGuardsDialogOpen] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error("Please enter a blast message");
      return;
    }

    if (!sendViaInApp && !sendViaSms) {
      toast.error("Please select at least one sending method (In-App Notification or Twilio SMS)");
      return;
    }

    if (recipientType === "filter" && selectedGuardIds.length === 0) {
      toast.error("Please select at least one guard to send the blast message to");
      return;
    }

    setIsSending(true);
    try {
      const res = await sendBroadcastNotificationAction({
        title: "Broadcast Notification",
        message,
        send_to_all: recipientType === "all",
        guard_ids: recipientType === "all" ? [] : selectedGuardIds,
        send_in_app: sendViaInApp,
        send_sms: sendViaSms,
      });

      if (res.success) {
        toast.success(res.message || "Blast message sent successfully!");
        setMessage("");
        setSendViaInApp(false);
        setSendViaSms(false);
        setRecipientType("all");
        setSelectedGuardIds([]);
        setHistoryTotalCount((prev) => (prev !== null ? prev + 1 : 1));
      } else {
        toast.error(res.error || "Failed to send blast message");
      }
    } catch {
      toast.error("An error occurred while sending the blast message");
    } finally {
      setIsSending(false);
    }
  };

  const handleResetForm = () => {
    setMessage("");
    setSendViaInApp(false);
    setSendViaSms(false);
    setRecipientType("all");
    setSelectedGuardIds([]);
  };

  const hasFormContent =
    message.trim().length > 0 ||
    sendViaInApp ||
    sendViaSms ||
    selectedGuardIds.length > 0;

  return (
    <div className="p-0 sm:p-4 md:p-6 max-w-[1500px] mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-500 font-sans">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-slate-700 text-[13px] mb-1">
          <Link href="/dashboard" className="hover:text-[#0064cb] transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-600 font-medium">Blast Messages</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 bg-white rounded-lg border border-slate-200 text-slate-700 hover:text-[#0064cb] transition-all cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Blast Messages</h1>
            <p className="text-xs sm:text-sm text-slate-500 font-normal">
              Send important announcements and updates to guards in real-time.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-8 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("compose")}
          className={cn(
            "cursor-pointer flex items-center gap-2 pb-3.5 px-1 font-semibold transition-all whitespace-nowrap text-sm relative -mb-[1px]",
            activeTab === "compose"
              ? "text-[#0064cb]"
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          <Pencil className="w-4 h-4" />
          <span>Compose Message</span>
          {activeTab === "compose" && (
            <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#0064cb] rounded-t-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={cn(
            "cursor-pointer flex items-center gap-2 pb-3.5 px-1 font-semibold transition-all whitespace-nowrap text-sm relative -mb-[1px]",
            activeTab === "history"
              ? "text-[#0064cb]"
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          <History className="w-4 h-4" />
          <span>Manage History</span>
          {historyTotalCount !== null && (
            <span
              className={cn(
                "text-[11px] px-2 py-0.5 rounded-full font-bold transition-colors",
                activeTab === "history"
                  ? "bg-blue-100 text-[#0064cb]"
                  : "bg-slate-100 text-slate-600"
              )}
            >
              {historyTotalCount}
            </span>
          )}
          {activeTab === "history" && (
            <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#0064cb] rounded-t-full" />
          )}
        </button>
      </div>

      {activeTab === "compose" && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 sm:p-8 space-y-8 w-full">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="notification-message"
                  className="text-sm font-bold text-slate-900 block"
                >
                  Message
                </label>
                <span className="text-xs text-slate-400 font-medium">
                  Compose announcements, urgent alerts or briefing updates
                </span>
              </div>
              <div className="relative">
                <textarea
                  id="notification-message"
                  value={message}
                  onChange={(e) => {
                    if (e.target.value.length <= 1000) {
                      setMessage(e.target.value);
                    }
                  }}
                  placeholder="Enter your blast message here..."
                  rows={6}
                  className="w-full p-4 bg-white border border-slate-200 focus:border-[#0064cb] focus:ring-4 focus:ring-[#0064cb]/10 focus:outline-none rounded-xl text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 transition-all duration-200 resize-none pr-4 pb-12 shadow-2xs"
                />
                <div className="absolute bottom-3.5 right-4 text-xs font-semibold text-slate-400 select-none">
                  <span className={cn(message.length >= 950 && "text-amber-600 font-bold")}>
                    {message.length}
                  </span>{" "}
                  / 1,000
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                Send Via{" "}
                <span className="text-xs text-slate-500 font-normal">
                  (Select one or both)
                </span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  onClick={() => setSendViaInApp(!sendViaInApp)}
                  className={cn(
                    "relative flex items-start gap-4 p-5 rounded-xl border-[1.5px] transition-all duration-200 cursor-pointer select-none",
                    sendViaInApp
                      ? "border-[#0064cb] bg-blue-50/20 shadow-xs"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/40"
                  )}
                >
                  <div
                    className={cn(
                      "w-11 h-11 shrink-0 rounded-xl flex items-center justify-center transition-colors",
                      sendViaInApp
                        ? "bg-blue-100/70 text-[#0064cb]"
                        : "bg-slate-100 text-slate-500"
                    )}
                  >
                    <Smartphone className="w-5 h-5" strokeWidth={2} />
                  </div>
                  <div className="space-y-1 flex-1 pr-6">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-900">
                        In-App Notification
                      </h3>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
                        Recommended
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-500 font-medium">
                      Send a push notification to all guards through the app.
                    </p>
                  </div>
                  <div className="absolute top-5 right-5">
                    <div
                      className={cn(
                        "w-5 h-5 rounded-md flex items-center justify-center transition-colors",
                        sendViaInApp
                          ? "bg-[#0064cb] text-white"
                          : "bg-slate-100 border border-slate-300"
                      )}
                    >
                      {sendViaInApp && (
                        <Check className="w-3.5 h-3.5 stroke-[3px]" />
                      )}
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => setSendViaSms(!sendViaSms)}
                  className={cn(
                    "relative flex items-start gap-4 p-5 rounded-xl border-[1.5px] transition-all duration-200 cursor-pointer select-none",
                    sendViaSms
                      ? "border-[#0064cb] bg-blue-50/20 shadow-xs"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/40"
                  )}
                >
                  <div
                    className={cn(
                      "w-11 h-11 shrink-0 rounded-xl flex items-center justify-center transition-colors",
                      sendViaSms
                        ? "bg-blue-100/70 text-[#0064cb]"
                        : "bg-slate-100 text-slate-500"
                    )}
                  >
                    <MessageSquare className="w-5 h-5" strokeWidth={2} />
                  </div>
                  <div className="space-y-1 flex-1 pr-6">
                    <h3 className="text-sm font-bold text-slate-900">Twilio SMS</h3>
                    <p className="text-xs leading-relaxed text-slate-500 font-medium">
                      Send a text message to guards mobile numbers.
                    </p>
                  </div>
                  <div className="absolute top-5 right-5">
                    <div
                      className={cn(
                        "w-5 h-5 rounded-md flex items-center justify-center transition-colors",
                        sendViaSms
                          ? "bg-[#0064cb] text-white"
                          : "bg-slate-100 border border-slate-300"
                      )}
                    >
                      {sendViaSms && (
                        <Check className="w-3.5 h-3.5 stroke-[3px]" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-900 block">
                Recipient Selection
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  onClick={() => setRecipientType("all")}
                  className={cn(
                    "relative flex items-start gap-4 p-5 rounded-xl border-[1.5px] transition-all duration-200 cursor-pointer select-none",
                    recipientType === "all"
                      ? "border-[#0064cb] bg-blue-50/20 shadow-xs"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/40"
                  )}
                >
                  <div
                    className={cn(
                      "w-11 h-11 shrink-0 rounded-xl flex items-center justify-center transition-colors",
                      recipientType === "all"
                        ? "bg-blue-100/70 text-[#0064cb]"
                        : "bg-slate-100 text-slate-500"
                    )}
                  >
                    <Users className="w-5 h-5" strokeWidth={2} />
                  </div>
                  <div className="space-y-1 flex-1 pr-6">
                    <h3 className="text-sm font-bold text-slate-900">
                      Send to All Guards
                    </h3>
                    <p className="text-xs leading-relaxed text-slate-500 font-medium">
                      Deliver this blast message to every active guard in the system.
                    </p>
                  </div>
                  <div className="absolute top-5 right-5">
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center shrink-0 transition-colors",
                        recipientType === "all"
                          ? "border-[#0064cb]"
                          : "border-slate-300"
                      )}
                    >
                      {recipientType === "all" && (
                        <div className="w-2.5 h-2.5 rounded-full bg-[#0064cb]" />
                      )}
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => {
                    setRecipientType("filter");
                    setIsSelectGuardsDialogOpen(true);
                  }}
                  className={cn(
                    "relative flex items-start gap-4 p-5 rounded-xl border-[1.5px] transition-all duration-200 cursor-pointer select-none",
                    recipientType === "filter"
                      ? "border-[#0064cb] bg-blue-50/20 shadow-xs"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/40"
                  )}
                >
                  <div
                    className={cn(
                      "w-11 h-11 shrink-0 rounded-xl flex items-center justify-center transition-colors",
                      recipientType === "filter"
                        ? "bg-blue-100/70 text-[#0064cb]"
                        : "bg-slate-100 text-slate-500"
                    )}
                  >
                    <Filter className="w-5 h-5" strokeWidth={2} />
                  </div>
                  <div className="space-y-1 flex-1 pr-6">
                    <h3 className="text-sm font-bold text-slate-900">
                      Filter Guards
                    </h3>
                    <p className="text-xs leading-relaxed text-slate-500 font-medium">
                      Select specific guards based on location, services or distance.
                    </p>
                    {recipientType === "filter" && selectedGuardIds.length > 0 && (
                      <div className="pt-2 flex items-center gap-2">
                        <span className="text-[11px] font-bold text-[#0064cb] bg-blue-100/70 px-2.5 py-0.5 rounded-full border border-blue-200">
                          {selectedGuardIds.length} guards selected
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsSelectGuardsDialogOpen(true);
                          }}
                          className="cursor-pointer text-xs font-bold text-[#0064cb] hover:underline"
                        >
                          Edit Selection
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="absolute top-5 right-5">
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center shrink-0 transition-colors",
                        recipientType === "filter"
                          ? "border-[#0064cb]"
                          : "border-slate-300"
                      )}
                    >
                      {recipientType === "filter" && (
                        <div className="w-2.5 h-2.5 rounded-full bg-[#0064cb]" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50/70 border-t border-slate-100 px-6 sm:px-8 py-4.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-500 font-medium flex items-center gap-2">
              {sendViaInApp || sendViaSms ? (
                <span className="inline-flex items-center gap-1.5 text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Ready to send via{" "}
                  <strong className="text-slate-900">
                    {[sendViaInApp && "In-App", sendViaSms && "Twilio SMS"]
                      .filter(Boolean)
                      .join(" & ")}
                  </strong>{" "}
                  to{" "}
                  <strong className="text-slate-900">
                    {recipientType === "all"
                      ? "All Guards"
                      : `${selectedGuardIds.length} Selected Guards`}
                  </strong>
                </span>
              ) : (
                <span className="text-slate-400">
                  Select at least one sending method to enable dispatch
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 justify-end">
              {hasFormContent && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResetForm}
                  disabled={isSending}
                  className="h-11 px-4 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                  Reset
                </Button>
              )}

              <Button
                type="button"
                onClick={handleSend}
                disabled={isSending}
                className="h-11 px-6 bg-[#0064cb] hover:bg-[#0052ae] text-white font-semibold text-sm rounded-lg flex items-center gap-2 shadow-sm shadow-blue-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <SendHorizontal className="w-4 h-4" />
                    <span>Send Blast Message</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <BroadcastHistoryTable
          onComposeNew={() => setActiveTab("compose")}
          onTotalCountChange={(count) => setHistoryTotalCount(count)}
        />
      )}

      {isSelectGuardsDialogOpen && (
        <SelectGuardsDialog
          isOpen={isSelectGuardsDialogOpen}
          onClose={() => setIsSelectGuardsDialogOpen(false)}
          initialSelectedIds={selectedGuardIds}
          onConfirm={(ids) => setSelectedGuardIds(ids)}
        />
      )}
    </div>
  );
}
