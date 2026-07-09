"use client";

import { useState } from "react";
import { Edit2, Loader2, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InvoiceData } from "@/types/dashboard.types";
import { formatStatus, cn } from "@/lib/utils";
import Link from "next/link";

interface InvoiceDetailsCardProps {
  invoice: InvoiceData;
  isEditOpen: boolean;
  setIsEditOpen: (open: boolean) => void;
  isSaving: boolean;
  formData: { title: string; description: string; shift_description: string };
  setFormData: (data: any) => void;
  onSave: () => Promise<void> | void;
  onEditLocation: () => void;
}

export function InvoiceDetailsCard({
  invoice,
  isSaving,
  formData,
  setFormData,
  onSave,
  onEditLocation
}: InvoiceDetailsCardProps) {
  const [activeEditField, setActiveEditField] = useState<'title' | 'description' | 'shift_description' | null>(null);

  const handleSaveField = async () => {
    await onSave();
    setActiveEditField(null);
  };
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xl font-bold text-slate-700">#{invoice.invoice_no || "N/A"}</span>
            <div className="flex items-center gap-2">
              {!invoice.status?.toLowerCase().includes('cancelled') && (
                <Button
                  variant="outline"
                  onClick={onEditLocation}
                  disabled={invoice.actions?.is_location_edit === false}
                  className="h-8 rounded-lg font-bold text-[10px] text-[#0064cb] border-[#0064cb]/20 hover:bg-blue-50 transition-all active:scale-95 flex gap-1.5 cursor-pointer px-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Edit2 className="w-3 h-3" />
                  Edit Location
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-slate-600 font-bold text-sm font-medium">
              Location - <span className="text-[#0064cb] cursor-pointer cursor-underline">{formatAddress(invoice.shipping_address)}</span>
            </p>
            {invoice.timezone && (
              <p className="text-slate-600 font-bold text-sm font-medium">
                Timezone - <span className="text-slate-800 font-medium">{invoice.timezone.replace(/_/g, ' ')}</span>
              </p>
            )}
          </div>
        </div>

        <div className="border-t border-slate-100 divide-y divide-slate-100">
          <div className="flex flex-col md:grid md:grid-cols-4 p-4 gap-2 md:gap-0 items-start md:items-center">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">Company Name:</span>
            </div>
            <div className="w-full md:col-span-3 flex items-center justify-between gap-4">
              <div className="flex-1">
                {activeEditField === 'title' ? (
                  <div className="space-y-3">
                    <Input
                      value={formData.title}
                      disabled={invoice.actions?.is_customer_name_edit === false || isSaving}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, title: e.target.value }))}
                      className="h-10 bg-slate-50 border-slate-200 focus:bg-white focus:ring-[#0064cb]/5 focus:border-[#0064cb] rounded-lg px-3 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setActiveEditField(null)} disabled={isSaving} className="h-8 text-xs">Cancel</Button>
                      <Button size="sm" onClick={handleSaveField} disabled={isSaving} className="h-8 text-xs bg-[#0064cb] hover:bg-[#0052ae] text-white">
                        {isSaving && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
                        Save
                      </Button>
                    </div>
                  </div>
                ) : invoice.customer_id ? (
                  <Link href={`/users-directory/customers/${invoice.customer_id}`} className="text-sm font-medium text-[#0064cb] hover:underline">
                    {invoice.customer_name}
                  </Link>
                ) : (
                  <span className="text-sm font-medium text-slate-800">
                    {invoice.customer_name}
                  </span>
                )}
              </div>
              {activeEditField !== 'title' && !invoice.status?.toLowerCase().includes('cancelled') && (
                <button
                  disabled={invoice.actions?.is_customer_name_edit === false}
                  onClick={() => setActiveEditField('title')}
                  className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col md:grid md:grid-cols-4 p-4 gap-2 md:gap-0 items-start">
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">Invoice Details:</span>
              <div className="group relative">
                <Info className="cursor-pointer w-5 h-5 text-[#0064cb] hover:text-[#0052ae] transition-colors cursor-help" />
                <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-52 p-2.5 bg-slate-800 text-white text-[11px] leading-relaxed font-medium rounded-lg shadow-xl z-50 text-left md:text-center normal-case pointer-events-none before:content-[''] before:absolute before:top-full before:left-4 md:before:left-1/2 md:before:-translate-x-1/2 before:border-4 before:border-transparent before:border-t-slate-800">
                  Invoice details are visible only to admins. Guards cannot view invoice information.
                </div>
              </div>
            </div>
            <div className="w-full md:col-span-3 flex items-start justify-between gap-4">
              <div className="flex-1">
                {activeEditField === 'description' ? (
                  <div className="space-y-3">
                    <textarea
                      rows={10}
                      placeholder="Enter invoice description..."
                      value={formData.description}
                      disabled={invoice.actions?.is_invoice_details_edit === false || isSaving}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, description: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0064cb]/5 focus-visible:border-[#0064cb] transition-all min-h-[220px] resize-y disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setActiveEditField(null)} disabled={isSaving} className="h-8 text-xs">Cancel</Button>
                      <Button size="sm" onClick={handleSaveField} disabled={isSaving} className="h-8 text-xs bg-[#0064cb] hover:bg-[#0052ae] text-white">
                        {isSaving && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                    {invoice.invoice_description || invoice.description || "No invoice description provided."}
                  </div>
                )}
              </div>
              {activeEditField !== 'description' && !invoice.status?.toLowerCase().includes('cancelled') && (
                <button
                  disabled={invoice.actions?.is_invoice_details_edit === false}
                  onClick={() => setActiveEditField('description')}
                  className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col md:grid md:grid-cols-4 p-4 gap-2 md:gap-0 items-start border-t border-slate-50">
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">Shift Detail:</span>
              <div className="group relative">
                <Info className="cursor-pointer w-5 h-5 text-[#0064cb] hover:text-[#0052ae] transition-colors cursor-help" />
                <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-56 p-2.5 bg-slate-800 text-white text-[11px] leading-relaxed font-medium rounded-lg shadow-xl z-50 text-left md:text-center normal-case pointer-events-none before:content-[''] before:absolute before:top-full before:left-4 md:before:left-1/2 md:before:-translate-x-1/2 before:border-4 before:border-transparent before:border-t-slate-800">
                  Shift details are visible to guards. You can add post orders, duties, instructions, and shift-related information here.
                </div>
              </div>
            </div>
            <div className="w-full md:col-span-3 flex items-start justify-between gap-4">
              <div className="flex-1">
                {activeEditField === 'shift_description' ? (
                  <div className="space-y-3">
                    <textarea
                      rows={10}
                      placeholder="Enter shift description..."
                      value={formData.shift_description}
                      disabled={invoice.actions?.is_shift_details_edit === false || isSaving}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, shift_description: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0064cb]/5 focus-visible:border-[#0064cb] transition-all min-h-[220px] resize-y disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setActiveEditField(null)} disabled={isSaving} className="h-8 text-xs">Cancel</Button>
                      <Button size="sm" onClick={handleSaveField} disabled={isSaving} className="h-8 text-xs bg-[#0064cb] hover:bg-[#0052ae] text-white">
                        {isSaving && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                    {invoice.shift_description || "No shift detail provided."}
                  </div>
                )}
              </div>
              {activeEditField !== 'shift_description' && !invoice.status?.toLowerCase().includes('cancelled') && (
                <button
                  disabled={invoice.actions?.is_shift_details_edit === false}
                  onClick={() => setActiveEditField('shift_description')}
                  className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col md:grid md:grid-cols-4 p-4 gap-1 md:gap-0 items-start md:items-center">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">Status:</span>
            <span className={cn("w-full md:col-span-3 text-sm font-bold", invoice.status?.toLowerCase().includes('cancelled') ? "text-red-600" : "text-slate-800")}>
              {formatStatus(invoice.status)}
            </span>
          </div>

          <div className="flex flex-col md:grid md:grid-cols-4 p-4 gap-1 md:gap-0 items-start md:items-center">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">Invoice/Estimate Number:</span>
            <span className="w-full md:col-span-3 text-sm text-slate-800 font-medium">{invoice.invoice_no}</span>
          </div>

          <div className="flex flex-col md:grid md:grid-cols-4 p-4 gap-1 md:gap-0 items-start md:items-center">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">Invoice Amount:</span>
            <span className="w-full md:col-span-3 text-sm text-slate-800 font-medium">{invoice.invoice_amount || "0"}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
