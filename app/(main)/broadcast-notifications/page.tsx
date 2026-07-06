"use client";

import { useState } from "react";
import { SendHorizontal, Loader2, Filter, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { sendBroadcastNotificationAction } from "@/actions/notification.actions";
import { SelectGuardsDialog } from "./_components/SelectGuardsDialog";

export default function BroadcastNotificationsPage() {
  const [message, setMessage] = useState("");
  const [recipientType, setRecipientType] = useState<"all" | "filter">("all");
  const [isSending, setIsSending] = useState(false);
  const [selectedGuardIds, setSelectedGuardIds] = useState<string[]>([]);
  const [isSelectGuardsDialogOpen, setIsSelectGuardsDialogOpen] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error("Please enter a notification message");
      return;
    }

    if (recipientType === "filter" && selectedGuardIds.length === 0) {
      toast.error("Please select at least one guard to send the notification to");
      return;
    }

    setIsSending(true);
    try {
      const res = await sendBroadcastNotificationAction({
        message,
        send_to_all: recipientType === "all",
        guard_ids: recipientType === "all" ? [] : selectedGuardIds,
      });

      if (res.success) {
        toast.success(res.message || "Notification broadcasted successfully!");
        setMessage("");
        if (recipientType === "filter") {
          setSelectedGuardIds([]);
        }
      } else {
        toast.error(res.error || "Failed to send notification");
      }
    } catch {
      toast.error("An error occurred while sending the notification");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="p-0 sm:p-2 md:p-2 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="space-y-1.5 pl-1 sm:pl-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-montserrat mb-0">
          Broadcast Notifications
        </h1>
        <p className="text-[14px] text-slate-500 font-medium leading-relaxed">
          Send important announcements and updates to guards in real-time.
        </p>
      </div>

      <div className="bg-white border border-slate-200/90 rounded-lg shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="p-6 md:p-8 space-y-8">
          <div className="space-y-2.5">
            <label
              htmlFor="notification-message"
              className="text-[14px] font-semibold text-slate-900 tracking-wide block"
            >
              Notification Message
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
                placeholder="Enter your notification message here..."
                rows={6}
                className="w-full p-4 bg-slate-50/55 border border-slate-200/90 focus:border-[#0064cb] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#0064cb]/5 rounded-xl text-[14px] leading-relaxed text-slate-900 placeholder:text-slate-400 transition-all duration-300 resize-none pr-4 pb-8"
              />
              <div className="absolute bottom-3.5 right-4 text-[11px] font-medium text-slate-400 select-none">
                {message.length} / 1000
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[14px] font-semibold text-slate-900 tracking-wide block">
              Recipient Selection
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                onClick={() => setRecipientType("all")}
                className={`flex justify-between items-start p-5 rounded-xl border-2 transition-all duration-200 cursor-pointer ${recipientType === "all"
                  ? "border-[#0064cb] bg-blue-50/10 shadow-[0_2px_8px_rgba(0,100,203,0.04)]"
                  : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
              >
                <div className="space-y-1 pr-4">
                  <h3 className="text-[14px] font-bold text-slate-900 flex items-center gap-2">
                    <Users className={`h-4 w-4 ${recipientType === "all" ? "text-[#0064cb]" : "text-slate-500"}`} />
                    Send to All Guards
                  </h3>
                  <p className="text-[12px] leading-relaxed text-slate-500 font-medium">
                    Deliver this notification to every active guard in the system.
                  </p>
                </div>

                <div className="pt-0.5">
                  <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${recipientType === "all" ? "border-[#0064cb]" : "border-slate-300"
                    }`}>
                    {recipientType === "all" && (
                      <div className="h-2.5 w-2.5 rounded-full bg-[#0064cb]" />
                    )}
                  </div>
                </div>
              </div>

              <div
                onClick={() => {
                  setRecipientType("filter");
                  setIsSelectGuardsDialogOpen(true);
                }}
                className={`flex justify-between items-start p-5 rounded-xl border-2 transition-all duration-200 cursor-pointer ${recipientType === "filter"
                  ? "border-[#0064cb] bg-blue-50/10 shadow-[0_2px_8px_rgba(0,100,203,0.04)]"
                  : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
              >
                <div className="space-y-1.5 pr-4">
                  <h3 className="text-[14px] font-bold text-slate-900 flex items-center gap-2">
                    <Filter className={`h-4 w-4 ${recipientType === "filter" ? "text-[#0064cb]" : "text-slate-500"}`} />
                    Filter Guards
                  </h3>
                  <p className="text-[12px] leading-relaxed text-slate-500 font-medium">
                    Select specific guards based on location, services or distance.
                  </p>
                  {recipientType === "filter" && selectedGuardIds.length > 0 && (
                    <div className="mt-2.5 flex items-center gap-2">
                      <span className="text-[11px] font-bold text-[#0064cb] bg-blue-50 px-2 py-0.5 rounded">
                        {selectedGuardIds.length} guards selected
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsSelectGuardsDialogOpen(true);
                        }}
                        className="cursor-pointer text-[11px] font-bold text-[#0064cb] hover:underline"
                      >
                        Edit Selection
                      </button>
                    </div>
                  )}
                </div>

                <div className="pt-0.5">
                  <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${recipientType === "filter" ? "border-[#0064cb]" : "border-slate-300"
                    }`}>
                    {recipientType === "filter" && (
                      <div className="h-2.5 w-2.5 rounded-full bg-[#0064cb]" />
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        <div className="bg-slate-50/70 border-t border-slate-100 p-5 flex items-center justify-end gap-3.5">
          <Button
            type="button"
            onClick={handleSend}
            disabled={isSending}
            className="h-11 px-6 bg-[#0064cb] hover:bg-[#0052ae] text-white font-bold text-[13px] active:scale-95 transition-all rounded-lg flex items-center gap-2 shadow-sm shadow-blue-500/10 cursor-pointer"
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <SendHorizontal className="h-4 w-4 stroke-[2px]" />
                Send Notification
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
