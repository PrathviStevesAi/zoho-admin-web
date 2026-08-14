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
  XCircle,
  FileEdit,
  Settings,
} from "lucide-react";

interface InvoiceHeaderProps {
  invoiceNo: string;
  customerName: string;
  zohoInvoiceId?: string;
  description: string;
  shippingAddress?: any;
  onOpenPayment: () => void;
  onOpenSchedule: () => void;
  onOpenShiftDetail?: () => void;
  onOpenAssignGuard: () => void;
  onOpenAvailableGuards: () => void;
  onOpenSettings?: () => void;
  onResetView: () => void;
  onCancelService: () => void;
  currentView?: string;
  status?: string;
  actions?: {
    is_update_payment?: boolean;
    is_schedule_shift?: boolean;
    is_find_guards?: boolean;
    is_assigned_guards?: boolean;
    is_open_crm?: boolean;
    is_cancel_service?: boolean;
    is_config_settings?: boolean;
  };
  type?: string | null;
}

export function InvoiceHeader({
  invoiceNo,
  customerName,
  zohoInvoiceId,
  description,
  shippingAddress,
  onOpenPayment,
  onOpenSchedule,
  onOpenShiftDetail,
  onOpenAssignGuard,
  onOpenAvailableGuards,
  onOpenSettings,
  onResetView,
  onCancelService,
  currentView,
  status,
  actions,
  type
}: InvoiceHeaderProps) {
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
  const handleOpenCRM = () => {
    if (zohoInvoiceId) {
      window.open(`https://books.zoho.com/app/678357323#/invoices/${zohoInvoiceId}`, '_blank');
    }
  };

  const formatDescription = (text: string) => {
    if (!text) return null;

    if (!text.includes('*')) {
      return (
        <div className="text-slate-200 whitespace-pre-wrap leading-relaxed">
          {text}
        </div>
      );
    }

    const sections = text.split('*').map(s => s.trim()).filter(Boolean);

    return (
      <div className="space-y-3">
        {sections.map((section, idx) => {
          if (section.includes('PM') || section.includes('AM')) {
            return (
              <div key={idx} className="flex items-start gap-2 bg-slate-800/50 p-2 rounded-lg border border-slate-700/50">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                <span className="text-slate-200">{section}</span>
              </div>
            );
          }

          const lines = section.split(/(?=[A-Z][a-z]+ [a-z]*:)|(?=Total [A-Z][a-z]+:)/g);

          return (
            <div key={idx} className="space-y-1.5">
              {lines.map((line, lIdx) => {
                const parts = line.split(':');
                if (parts.length > 1) {
                  return (
                    <div key={lIdx} className="flex justify-between gap-4 border-b border-slate-800/50 pb-1 last:border-0">
                      <span className="text-slate-200 font-medium whitespace-nowrap">{parts[0].trim()}:</span>
                      <span className="text-slate-200 text-right">{parts.slice(1).join(':').trim()}</span>
                    </div>
                  );
                }
                return <p key={lIdx} className="text-slate-200">{line.trim()}</p>;
              })}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-start lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-slate-700 text-[13px] mb-1">
            <Link href="/dashboard" className="hover:text-[#0064cb] transition-colors whitespace-nowrap">Dashboard</Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <span
              className={`transition-colors whitespace-nowrap cursor-pointer hover:text-[#0064cb] ${!currentView ? 'text-slate-600 font-medium' : 'hover:text-[#0064cb]'}`}
              onClick={onResetView}
            >
              Invoices
            </span>
            {currentView && (
              <>
                <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                <span className="text-slate-600 font-medium whitespace-nowrap capitalize">
                  {currentView}
                </span>
              </>
            )}
          </div>
          <div className="flex items-start sm:items-center gap-3">
            <Link href="/dashboard" className="p-2 bg-white rounded-lg border border-slate-200 text-slate-700 hover:text-[#0064cb] transition-all shrink-0 mt-0.5 sm:mt-0">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="group relative">
              <h1
                className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 flex flex-wrap items-center gap-x-2 gap-y-1 cursor-pointer hover:text-[#0064cb] transition-all"
                onClick={onResetView}
              >
                <span>{customerName}</span>
                <span className="text-slate-700 font-normal whitespace-nowrap"> [ #{invoiceNo} ]</span>
              </h1>

              {description && (
                <div className="absolute left-0 top-full mt-2 w-80 p-4 bg-slate-900 text-white text-[11px] rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[70] border border-slate-800 shadow-blue-900/20">
                  <div className="absolute -top-1.5 left-6 w-3 h-3 bg-slate-900 rotate-45 border-l border-t border-slate-800" />
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800">
                    <p className="font-bold text-blue-400">Invoice Description</p>
                  </div>
                  <div className="max-h-[250px] overflow-y-auto custom-scrollbar pr-1 mb-3">
                    {formatDescription(description)}
                  </div>
                  {shippingAddress && (
                    <div className="pt-2 border-t border-slate-800 space-y-1">
                      <p className="font-bold text-blue-400 uppercase tracking-wider text-[9px]">Location</p>
                      <p className="text-slate-300 leading-normal">
                        {formatAddress(shippingAddress)}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {type && (
          <div className="shrink-0 pt-1 md:pt-4 lg:pt-0 flex items-center gap-2">
            <span className="text-slate-800 text-sm font-bold tracking-tight">Source :</span>
            <div className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 cursor-default text-white text-[13px] font-semibold rounded-lg shadow-sm shadow-orange-500/20 capitalize tracking-wide flex items-center justify-center transition-colors">
              {type.replace(/_/g, " ")}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 py-4">
        {!status?.toLowerCase().includes('cancelled') && (
          <>
            {actions?.is_update_payment && (
              <>
                <div className="flex flex-col items-center gap-1.5 group cursor-pointer" onClick={onOpenPayment}>
                  <div className="w-12 h-12 rounded-full border-2 border-emerald-500 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-50 transition-colors shadow-sm">
                    <RefreshCcw className="w-5.5 h-5.5" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase text-center leading-[1.2] tracking-tight">Update<br />payment status</span>
                  <span className="text-xs font-bold text-slate-900 mt-0.5">Step-1</span>
                </div>

                <div
                  className="flex flex-col items-center gap-1.5 group cursor-pointer"
                  onClick={() => {
                    if (onOpenShiftDetail) {
                      onOpenShiftDetail();
                    } else {
                      const element = document.getElementById("shift-detail-section");
                      if (element) {
                        element.scrollIntoView({ behavior: "smooth" });
                      }
                    }
                  }}
                >
                  <div className="w-12 h-12 rounded-full border-2 border-purple-500 flex items-center justify-center text-purple-500 group-hover:bg-purple-50 transition-colors shadow-sm">
                    <FileEdit className="w-5.5 h-5.5" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase text-center leading-[1.2] tracking-tight">Update<br />Shift Detail</span>
                  <span className="text-xs font-bold text-slate-900 mt-0.5">Step-2</span>
                </div>
              </>
            )}

            {actions?.is_schedule_shift && (
              <div className="flex flex-col items-center gap-1.5 group cursor-pointer" onClick={onOpenSchedule}>
                <div className="w-12 h-12 rounded-full border-2 border-[#0064cb] flex items-center justify-center text-[#0064cb] group-hover:bg-blue-50 transition-colors shadow-sm">
                  <Calendar className="w-5.5 h-5.5" />
                </div>
                <span className="text-[10px] font-bold text-slate-600 uppercase text-center leading-[1.2] tracking-tight">Schedule<br />Shift</span>
                <span className="text-xs font-bold text-slate-900 mt-0.5">Step-3</span>
              </div>
            )}

            {actions?.is_find_guards && (
              <div className="flex flex-col items-center gap-1.5 group cursor-pointer" onClick={onOpenAvailableGuards}>
                <div className="w-12 h-12 rounded-full border-2 border-orange-500 flex items-center justify-center text-orange-500 group-hover:bg-orange-50 transition-colors shadow-sm">
                  <Search className="w-5.5 h-5.5" />
                </div>
                <span className="text-[10px] font-bold text-slate-600 uppercase text-center leading-[1.2] tracking-tight">Find Available<br />Guard</span>
                <span className="text-xs font-bold text-slate-900 mt-0.5">Step-5 ( Optional )</span>
              </div>
            )}

            {actions?.is_assigned_guards && (
              <div className="flex flex-col items-center gap-1.5 group cursor-pointer" onClick={onOpenAssignGuard}>
                <div className="w-12 h-12 rounded-full border-2 border-indigo-500 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-50 transition-colors shadow-sm">
                  <UserPlus className="w-5.5 h-5.5" />
                </div>
                <span className="text-[10px] font-bold text-slate-600 uppercase text-center leading-[1.2] tracking-tight">Assign<br />Guard</span>
                <span className="text-xs font-bold text-slate-900 mt-0.5">Step-4</span>
              </div>
            )}

            {actions?.is_config_settings && onOpenSettings && (
              <div className="flex flex-col items-center gap-1.5 group cursor-pointer" onClick={onOpenSettings}>
                <div className="w-12 h-12 rounded-full border-2 border-slate-500 flex items-center justify-center text-slate-500 group-hover:bg-slate-50 transition-colors shadow-sm">
                  <Settings className="w-5.5 h-5.5" />
                </div>
                <span className="text-[10px] font-bold text-slate-600 uppercase text-center leading-[1.2] tracking-tight">Settings</span>
                <span className="text-xs font-bold text-slate-900 mt-0.5">Step-5</span>
              </div>
            )}

            {actions?.is_open_crm && (
              <div className="flex flex-col items-center gap-1.5 group cursor-pointer" onClick={handleOpenCRM}>
                <div className="w-12 h-12 rounded-full border-2 border-slate-400 flex items-center justify-center text-slate-800 group-hover:bg-slate-50 transition-colors shadow-sm">
                  <ExternalLink className="w-5.5 h-5.5" />
                </div>
                <span className="text-[10px] font-bold text-slate-600 uppercase text-center leading-[1.2] tracking-tight">Open in<br />CRM</span>
              </div>
            )}

            {actions?.is_cancel_service && (
              <div className="flex flex-col items-center gap-1.5 group cursor-pointer" onClick={onCancelService}>
                <div className="w-12 h-12 rounded-full border-2 border-red-400 flex items-center justify-center text-red-500 group-hover:bg-red-50 transition-colors shadow-sm">
                  <XCircle className="w-5.5 h-5.5" />
                </div>
                <span className="text-[10px] font-bold text-slate-600 uppercase text-center leading-[1.2] tracking-tight">Cancel<br />Service</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
