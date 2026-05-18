"use client";

import { Edit2, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InvoiceData } from "@/types/dashboard.types";
import { formatStatus, cn } from "@/lib/utils";

interface InvoiceDetailsCardProps {
  invoice: InvoiceData;
  isEditOpen: boolean;
  setIsEditOpen: (open: boolean) => void;
  isSaving: boolean;
  formData: { title: string; description: string };
  setFormData: (data: any) => void;
  onSave: () => void;
  onEditLocation: () => void;
}

export function InvoiceDetailsCard({
  invoice,
  isEditOpen,
  setIsEditOpen,
  isSaving,
  formData,
  setFormData,
  onSave,
  onEditLocation
}: InvoiceDetailsCardProps) {
  const formatAddress = (addr: any) => {
    if (!addr) return "N/A";
    if (typeof addr === 'string') return addr;
    const parts = [
      addr.street,
      addr.address,
      addr.city,
      addr.state,
      addr.zip,
      addr.country
    ].filter(Boolean);
    return parts.join(", ");
  };

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden rounded-xl bg-white">
      <CardContent className="p-0">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-slate-700">#{invoice.invoice_no || "N/A"}</span>
            <div className="flex items-center gap-2">
              {!invoice.status?.toLowerCase().includes('cancelled') && (
                <Button
                  variant="outline"
                  onClick={onEditLocation}
                  className="h-8 rounded-lg font-bold text-[10px] text-[#0064cb] border-[#0064cb]/20 hover:bg-blue-50 transition-all active:scale-95 flex gap-1.5 cursor-pointer px-3"
                >
                  <Edit2 className="w-3 h-3" />
                  Edit Location
                </Button>
              )}
            </div>
          </div>

          <p className="text-slate-600 font-bold text-sm font-medium">
            Location - <span className="text-[#0064cb] cursor-pointer cursor-underline">{formatAddress(invoice.shipping_address)}</span>
          </p>
        </div>

        <div className="border-t border-slate-100 divide-y divide-slate-100">
          <div className="grid grid-cols-4 p-4 items-center">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">Customer Name:</span>
            <div className="col-span-3 flex items-center justify-between gap-4">
              <div className="flex-1">
                {isEditOpen ? (
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, title: e.target.value }))}
                    className="h-10 bg-slate-50 border-slate-200 focus:bg-white focus:ring-[#0064cb]/5 focus:border-[#0064cb] rounded-lg px-3 text-sm font-medium transition-all"
                  />
                ) : (
                  <span className="text-sm text-slate-800 font-medium">
                    {invoice.customer_name}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {!invoice.status?.toLowerCase().includes('cancelled') && (
                  isEditOpen ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditOpen(false)}
                        className="px-3 h-8 rounded-lg font-bold border-slate-200 text-[10px] text-slate-800 hover:bg-slate-50 transition-all cursor-pointer"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={onSave}
                        disabled={isSaving}
                        className="bg-[#0064cb] hover:bg-[#0052ae] text-white px-3 h-8 rounded-lg font-bold text-[10px] shadow-md shadow-blue-100 transition-all active:scale-95 flex gap-1.5 cursor-pointer"
                      >
                        {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => setIsEditOpen(true)}
                      className="h-8 rounded-lg font-bold text-[10px] text-[#0064cb] border-[#0064cb]/20 hover:bg-blue-50 transition-all active:scale-95 flex gap-1.5 cursor-pointer px-3"
                    >
                      <Edit2 className="w-3 h-3" />
                      Edit Details
                    </Button>
                  )
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 p-4 items-start">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-tight pt-1">Description:</span>
            <div className="col-span-3">
              {isEditOpen ? (
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0064cb]/5 focus-visible:border-[#0064cb] transition-all min-h-[100px] resize-none"
                />
              ) : (
                <div className="text-sm text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                  {invoice.description || "No description provided."}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 p-4 items-center">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">Status:</span>
            <span className={cn("col-span-3 text-sm font-bold", invoice.status?.toLowerCase().includes('cancelled') ? "text-red-600" : "text-slate-800")}>
              {formatStatus(invoice.status)}
            </span>
          </div>

          <div className="grid grid-cols-4 p-4 items-center">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">Invoice/Estimate Number:</span>
            <span className="col-span-3 text-sm text-slate-800 font-medium">{invoice.invoice_no}</span>
          </div>

          <div className="grid grid-cols-4 p-4 items-center">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">Invoice Amount:</span>
            <span className="col-span-3 text-sm text-slate-800 font-medium">{invoice.invoice_amount || "0"}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
