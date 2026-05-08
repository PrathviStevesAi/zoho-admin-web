"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-slate-700">{item.action_name}</h3>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">
                        {new Date(item.created_at).toLocaleString()}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[11px] text-slate-500 font-bold uppercase flex items-center gap-2">
                        Performed by: <span className="text-slate-800 font-bold normal-case">{item.performed_by || "System"}</span>
                      </p>

                      {item.details.Customer && (
                        <div className="flex items-center gap-2">
                          <p className="text-[11px] text-slate-500 font-bold uppercase">Customer:</p>
                          <span className="text-sm font-bold text-[#0064cb]">{item.details.Customer}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 gap-2 pt-1">
                        {item.details["Invoice Amount"] && (
                          <div className="flex items-center gap-2">
                            <p className="text-[11px] text-slate-500 font-bold uppercase">Invoice Amount:</p>
                            <span className="text-sm text-slate-700 font-bold">${item.details["Invoice Amount"]}</span>
                          </div>
                        )}
                        {item.details["Invoice Number"] && (
                          <div className="flex items-center gap-2">
                            <p className="text-[11px] text-slate-500 font-bold uppercase">Invoice Number:</p>
                            <span className="text-sm text-slate-700 font-bold">{item.details["Invoice Number"]}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )) || (
                <p className="text-center text-slate-400 py-8 italic font-medium">No history available</p>
              )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
