"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn, formatStatus } from "@/lib/utils";

interface HistoryItem {
  action_name: string;
  created_at: string;
  performed_by: string | null;
  details: {
    Customer?: string;
    "Invoice Amount"?: string;
    "Invoice Number"?: string;
    [key: string]: any;
  };
}

interface InvoiceHistorySidebarProps {
  history?: HistoryItem[];
}

export function InvoiceHistorySidebar({ history }: InvoiceHistorySidebarProps) {
  return (
    <Card className="border-slate-200 shadow-sm relative rounded-xl overflow-hidden bg-white">
      <CardContent className="p-6">
        <h2 className="text-lg font-bold text-slate-700 mb-6">History of changes</h2>

        <div className="max-h-[700px] overflow-y-auto pr-3 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          <div className="space-y-8 relative pb-4 before:absolute before:left-[7px] before:top-2 before:bottom-0 before:w-[1.5px] before:bg-slate-100">
            {history?.map((item, idx) => (
              <div key={idx} className="relative pl-8 group">
                <div className={cn(
                  "absolute left-0 top-[6px] w-[15px] h-[15px] rounded-full border-2 border-white shadow-sm z-10",
                  idx === 0 ? "bg-[#0064cb]" : "bg-white border-[#0064cb]"
                )} />
                <div className={cn(
                  "p-4 rounded-lg border transition-all",
                  idx === 0 ? "bg-blue-50/50 border-blue-100" : "bg-white border-slate-100"
                )}>
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <h3 className="text-sm font-bold text-slate-700 ">{formatStatus(item.action_name)}</h3>
                      <span className="text-[10px] text-slate-500 font-bold uppercase whitespace-nowrap">
                        {new Date(item.created_at).toLocaleString()}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[11px] text-slate-800 font-bold uppercase flex items-center gap-2">
                        Performed by: <span className="text-slate-800 font-medium normal-case">{item.performed_by || "System"}</span>
                      </p>

                      <div className="grid grid-cols-1 gap-2 pt-1">
                        {Object.entries(item.details).map(([key, value]) => {
                          if (!value) return null;

                          const shortenKey = (k: string) => {
                            if (k.includes('Per hour rate paid by the customer')) return 'Per hour rate paid';
                            if (k.includes('Per shift (flat) rate paid by the customer')) return 'Per shift (flat) rate paid';
                            if (k.includes('Send reminder to check the payment status on this date')) return 'Send reminder Date';
                            return k.replace(/:+$/, '');
                          };

                          const displayValue = Array.isArray(value)
                            ? value.join(', ')
                            : typeof value === 'object' && value !== null
                              ? JSON.stringify(value)
                              : value;

                          return (
                            <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 border-b border-slate-50/50 pb-1 last:border-0 last:pb-0">
                              <p className="text-[10px] text-slate-800 font-bold uppercase shrink-0">
                                {formatStatus(shortenKey(key))}:
                              </p>
                              <span className="text-sm text-slate-800 font-medium break-all sm:text-right">
                                {key.toLowerCase().includes('amount') || key.toLowerCase().includes('rate')
                                  ? `$${displayValue}`
                                  : typeof displayValue === 'string' ? formatStatus(displayValue) : String(displayValue)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )) || (
                <p className="text-center text-slate-700 py-8 italic font-medium">No history available</p>
              )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
