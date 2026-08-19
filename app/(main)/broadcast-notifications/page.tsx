"use client";

import { useState } from "react";
import { SendHorizontal, Loader2, Filter, Users, Smartphone, MessageSquare, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { sendBroadcastNotificationAction } from "@/actions/notification.actions";
import { SelectGuardsDialog } from "./_components/SelectGuardsDialog";

export default function BroadcastNotificationsPage() {
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
      toast.error("Please select at least one sending method (In-App or SMS)");
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
      } as any);

      if (res.success) {
        toast.success(res.message || "Blast message sent successfully!");
        setMessage("");
        if (recipientType === "filter") {
          setSelectedGuardIds([]);
        }
      } else {
        toast.error(res.error || "Failed to send blast message");
      }
    } catch {
      toast.error("An error occurred while sending the blast message");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="p-0 sm:p-2 md:p-2 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 font-montserrat">
      <div className="space-y-1.5 pl-1 sm:pl-2">
        <h1 className="text-[26px] font-bold tracking-tight text-[#0f172a] mb-0">
          Blast Messages
        </h1>
        <p className="text-[14px] text-slate-500 font-medium leading-relaxed">
          Send important announcements and updates to guards in real-time.
        </p>
      </div>

      <div className="bg-white border border-slate-100 rounded-[16px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="p-6 md:p-8 space-y-8">

          <div className="space-y-2.5">
            <label
              htmlFor="notification-message"
              className="text-[14px] font-bold text-[#0f172a] block"
            >
              Message
            </label>
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
                rows={5}
                className="w-full p-4 bg-white border border-slate-200 focus:border-[#0064cb] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#0064cb]/5 rounded-xl text-[14px] leading-relaxed text-slate-900 placeholder:text-slate-400 transition-all duration-300 resize-none pr-4 pb-12"
              />
              <div className="absolute bottom-3.5 right-4 text-[13px] font-medium text-slate-400 select-none">
                {message.length} / 1000
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[14px] font-bold text-[#0f172a] block flex items-center gap-2">
              Send Via <span className="text-[13px] text-slate-500 font-medium font-normal">(Select one or both)</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div
                onClick={() => setSendViaInApp(!sendViaInApp)}
                className={`relative flex items-start gap-4 p-5 rounded-xl border-[1.5px] transition-all duration-200 cursor-pointer ${sendViaInApp
                  ? "border-[#0064cb] shadow-[0_2px_8px_rgba(0,100,203,0.04)]"
                  : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
              >
                <div className="w-12 h-12 shrink-0 rounded-xl bg-blue-50/50 flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-[#0064cb]" strokeWidth={2} />
                </div>
                <div className="space-y-1.5 flex-1 pr-6">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[15px] font-bold text-[#0f172a]">In-App Notification</h3>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Recommended
                    </span>
                  </div>
                  <p className="text-[13px] leading-relaxed text-slate-500 font-medium">
                    Send a push notification to all guards through the app.
                  </p>
                </div>
                <div className="absolute top-5 right-5">
                  <div className={`w-[20px] h-[20px] rounded flex items-center justify-center transition-colors ${sendViaInApp ? "bg-[#0064cb]" : "bg-slate-100 border border-slate-200"
                    }`}>
                    {sendViaInApp && <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />}
                  </div>
                </div>
              </div>

              <div
                onClick={() => setSendViaSms(!sendViaSms)}
                className={`relative flex items-start gap-4 p-5 rounded-xl border-[1.5px] transition-all duration-200 cursor-pointer ${sendViaSms
                  ? "border-emerald-500 shadow-[0_2px_8px_rgba(16,185,129,0.04)]"
                  : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
              >
                <div className="w-12 h-12 shrink-0 rounded-xl bg-emerald-50/50 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-emerald-500" strokeWidth={2.5} />
                </div>
                <div className="space-y-1.5 flex-1 pr-6">
                  <h3 className="text-[15px] font-bold text-[#0f172a]">Twilio SMS</h3>
                  <p className="text-[13px] leading-relaxed text-slate-500 font-medium">
                    Send a text message to guards mobile numbers.
                  </p>
                </div>
                <div className="absolute top-5 right-5">
                  <div className={`w-[20px] h-[20px] rounded flex items-center justify-center transition-colors ${sendViaSms ? "bg-[#0064cb]" : "bg-slate-100 border border-slate-200"
                    }`}>
                    {sendViaSms && <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />}
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[14px] font-bold text-[#0f172a] block">
              Recipient Selection
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div
                onClick={() => setRecipientType("all")}
                className={`relative flex items-start gap-4 p-5 rounded-xl border-[1.5px] transition-all duration-200 cursor-pointer ${recipientType === "all"
                  ? "border-[#0064cb] shadow-[0_2px_8px_rgba(0,100,203,0.04)]"
                  : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
              >
                <div className="w-10 h-10 shrink-0 rounded-full bg-blue-50 flex items-center justify-center">
                  <Users className="w-5 h-5 text-[#0064cb]" strokeWidth={2} />
                </div>
                <div className="space-y-1.5 flex-1 pr-6">
                  <h3 className="text-[15px] font-bold text-[#0f172a]">Send to All Guards</h3>
                  <p className="text-[13px] leading-relaxed text-slate-500 font-medium">
                    Deliver this blast message to every active guard in the system.
                  </p>
                </div>
                <div className="absolute top-[22px] right-5">
                  <div className={`w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center shrink-0 ${recipientType === "all" ? "border-[#0064cb]" : "border-slate-200"
                    }`}>
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
                className={`relative flex items-start gap-4 p-5 rounded-xl border-[1.5px] transition-all duration-200 cursor-pointer ${recipientType === "filter"
                  ? "border-[#0064cb] shadow-[0_2px_8px_rgba(0,100,203,0.04)]"
                  : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
              >
                <div className="w-10 h-10 shrink-0 rounded-full border border-slate-100 flex items-center justify-center">
                  <Filter className={`w-5 h-5 ${recipientType === "filter" ? "text-[#0064cb]" : "text-slate-400"}`} strokeWidth={2} />
                </div>
                <div className="space-y-1.5 flex-1 pr-6">
                  <h3 className="text-[15px] font-bold text-[#0f172a]">Filter Guards</h3>
                  <p className="text-[13px] leading-relaxed text-slate-500 font-medium">
                    Select specific guards based on location, services or distance.
                  </p>
                  {recipientType === "filter" && selectedGuardIds.length > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[11px] font-bold text-[#0064cb] bg-blue-50 px-2.5 py-1 rounded-md">
                        {selectedGuardIds.length} guards selected
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsSelectGuardsDialogOpen(true);
                        }}
                        className="cursor-pointer text-[12px] font-bold text-[#0064cb] hover:underline"
                      >
                        Edit Selection
                      </button>
                    </div>
                  )}
                </div>
                <div className="absolute top-[22px] right-5">
                  <div className={`w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center shrink-0 ${recipientType === "filter" ? "border-[#0064cb]" : "border-slate-200"
                    }`}>
                    {recipientType === "filter" && (
                      <div className="w-2.5 h-2.5 rounded-full bg-[#0064cb]" />
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        <div className="bg-[#f8fafc]/50 border-t border-slate-100 p-5 md:px-8 flex items-center justify-end gap-3.5">
          <Button
            type="button"
            onClick={handleSend}
            disabled={isSending}
            className="h-11 px-6 bg-[#0064cb] hover:bg-[#0052ae] text-white font-bold text-[14px] active:scale-95 transition-all rounded-lg flex items-center gap-2 shadow-sm shadow-blue-500/10 cursor-pointer"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <SendHorizontal className="w-4 h-4 stroke-[2px]" />
                Send Blast Message
              </>
            )}
          </Button>
        </div>

      </div>

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
