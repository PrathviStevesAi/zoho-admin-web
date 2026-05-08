"use client";

import Link from "next/link";
import {
  ChevronRight,
  ArrowLeft,
  RefreshCcw,
  Calendar,
  Search,
  UserPlus,
  ExternalLink,
  XCircle
} from "lucide-react";

interface InvoiceHeaderProps {
  invoiceNo: string;
  onOpenPayment: () => void;
  onOpenSchedule: () => void;
  onOpenAssignGuard: () => void;
  onResetView: () => void;
}

export function InvoiceHeader({
  invoiceNo,
  onOpenPayment,
  onOpenSchedule,
  onOpenAssignGuard,
  onResetView
}: InvoiceHeaderProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-slate-400 text-[13px] mb-1">
            <Link href="/dashboard" className="hover:text-[#0064cb] transition-colors">Dashboard</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-600 font-medium">Invoices</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="p-2 bg-white rounded-lg border border-slate-200 text-slate-400 hover:text-[#0064cb] transition-all">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1
              className="text-2xl font-bold text-slate-900 cursor-pointer hover:text-[#0064cb] transition-all"
              onClick={onResetView}
            >
              Invoice Details <span className="text-slate-400 font-normal ml-2">#{invoiceNo}</span>
            </h1>
          </div>
        </div>
      </div>

      {/* Action Icons */}
      <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 py-4">
        <div className="flex flex-col items-center gap-1.5 group cursor-pointer" onClick={onOpenPayment}>
          <div className="w-12 h-12 rounded-full border-2 border-emerald-500 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-50 transition-colors shadow-sm">
            <RefreshCcw className="w-5.5 h-5.5" />
          </div>
          <span className="text-[10px] font-bold text-slate-600 uppercase text-center leading-[1.2] tracking-tight">Update<br />payment status</span>
        </div>

        <div className="flex flex-col items-center gap-1.5 group cursor-pointer" onClick={onOpenSchedule}>
          <div className="w-12 h-12 rounded-full border-2 border-[#0064cb] flex items-center justify-center text-[#0064cb] group-hover:bg-blue-50 transition-colors shadow-sm">
            <Calendar className="w-5.5 h-5.5" />
          </div>
          <span className="text-[10px] font-bold text-slate-600 uppercase text-center leading-[1.2] tracking-tight">Schedule<br />Shift</span>
        </div>

        <div className="flex flex-col items-center gap-1.5 group cursor-pointer">
          <div className="w-12 h-12 rounded-full border-2 border-orange-500 flex items-center justify-center text-orange-500 group-hover:bg-orange-50 transition-colors shadow-sm">
            <Search className="w-5.5 h-5.5" />
          </div>
          <span className="text-[10px] font-bold text-slate-600 uppercase text-center leading-[1.2] tracking-tight">Find Available<br />Guard</span>
        </div>

        <div className="flex flex-col items-center gap-1.5 group cursor-pointer" onClick={onOpenAssignGuard}>
          <div className="w-12 h-12 rounded-full border-2 border-indigo-500 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-50 transition-colors shadow-sm">
            <UserPlus className="w-5.5 h-5.5" />
          </div>
          <span className="text-[10px] font-bold text-slate-600 uppercase text-center leading-[1.2] tracking-tight">Assign<br />Guard</span>
        </div>

        <div className="flex flex-col items-center gap-1.5 group cursor-pointer">
          <div className="w-12 h-12 rounded-full border-2 border-slate-400 flex items-center justify-center text-slate-500 group-hover:bg-slate-50 transition-colors shadow-sm">
            <ExternalLink className="w-5.5 h-5.5" />
          </div>
          <span className="text-[10px] font-bold text-slate-600 uppercase text-center leading-[1.2] tracking-tight">Open in<br />CRM</span>
        </div>

        <div className="flex flex-col items-center gap-1.5 group cursor-pointer">
          <div className="w-12 h-12 rounded-full border-2 border-red-400 flex items-center justify-center text-red-500 group-hover:bg-red-50 transition-colors shadow-sm">
            <XCircle className="w-5.5 h-5.5" />
          </div>
          <span className="text-[10px] font-bold text-slate-600 uppercase text-center leading-[1.2] tracking-tight">Cancel<br />Service</span>
        </div>
      </div>
    </div>
  );
}
