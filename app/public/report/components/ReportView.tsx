"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { DateTime } from "luxon";
import {
  User,
  FileText,
  UserCheck,
  MapPin,
  Clock,
  ChevronRight,
  ClipboardList,
  AlertTriangle,
  History,
  ShieldAlert
} from "lucide-react";
import Image from "next/image";
import { DynamicShiftMap } from "@/components/map/DynamicShiftMap";
import { ShiftDARReportTab } from "@/components/shift/tabs/ShiftDARReportTab";
import { ShiftIncidentReportsTab } from "@/components/shift/tabs/ShiftIncidentReportsTab";
import { ShiftCheckpointsTab } from "@/components/shift/tabs/ShiftCheckpointsTab";
import { ShiftHistoryTab } from "@/components/shift/tabs/ShiftHistoryTab";
import { FilePreviewDialog } from "@/components/shift/dialogs/FilePreviewDialog";
import { PreviewFile } from "@/components/shift/types";
import { cn } from "@/lib/utils";

interface ReportViewProps {
  data: any;
}

export default function ReportView({ data }: ReportViewProps) {
  const [activeTab, setActiveTab] = useState<string>("");
  const [previewFile, setPreviewFile] = useState<PreviewFile | null>(null);

  const formatTime = (timeString: string) => {
    if (!timeString) return "-";
    try {
      return DateTime.fromISO(timeString).toFormat("MMM dd, yyyy hh:mm a");
    } catch (e) {
      return timeString;
    }
  };

  const getDuration = (start: string, end: string) => {
    if (!start || !end) return "";
    try {
      const startTime = DateTime.fromISO(start);
      const endTime = DateTime.fromISO(end);
      const diff = endTime.diff(startTime, ['hours', 'minutes']);
      return `${Math.floor(diff.hours)}h ${Math.floor(diff.minutes)}m`;
    } catch (e) {
      return "";
    }
  };

  const statusLabel = data.status === "shift_finished" ? "COMPLETED" : data.status?.toUpperCase() || "UNKNOWN";
  const statusColor = data.status === "shift_finished" ? "text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-950/50" : "text-slate-700 bg-slate-100 dark:text-slate-400 dark:bg-slate-800";
  const statusDot = data.status === "shift_finished" ? "bg-emerald-500" : "bg-slate-500";

  const checkpoints = data.guard_location
    ? data.guard_location.map((loc: any) => [loc.latitude, loc.longitude])
    : undefined;

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-700">
      {/* Header */}
      <div className="w-full flex flex-col items-center justify-center py-6 pb-2 gap-2">
        <Image
          src="/images/website-logo.png"
          alt="Fast Guard Security Service"
          width={250}
          height={60}
          className="object-contain mb-2"
          priority
          style={{ width: "auto", height: "auto" }}
        />
        <h2 className="text-2xl md:text-4xl font-bold tracking-tight mt-1 text-slate-900 dark:text-white">
          Shift {data.shift_no} Report
        </h2>
        <div className="w-24 h-1 bg-amber-400 mt-2"></div>
      </div>

      {/* Stats Card */}
      <div className="w-full bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Customer Name */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
              <User className="text-slate-500 dark:text-slate-400" size={24} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Customer Name</span>
              <span className="text-lg font-bold text-slate-900 dark:text-white mt-1">{data.customer_name || "-"}</span>
            </div>
          </div>

          {/* Invoice No */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
              <FileText className="text-slate-500 dark:text-slate-400" size={24} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Invoice No</span>
              <span className="text-lg font-bold text-slate-900 dark:text-white mt-1">[{data.invoice_no || "-"}]</span>
            </div>
          </div>

          {/* Assigned To */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
              <UserCheck className="text-slate-500 dark:text-slate-400" size={24} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Assigned To</span>
              <span className="text-lg font-bold text-slate-900 dark:text-white mt-1">{data.assigned_to || "-"}</span>
            </div>
          </div>

          {/* Shift Location */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
              <MapPin className="text-slate-500 dark:text-slate-400" size={24} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Shift Location</span>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-1 leading-snug max-w-[280px]">
                {data.shift_location || "-"}
              </span>
            </div>
          </div>

          {/* Shift Time */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
              <Clock className="text-slate-500 dark:text-slate-400" size={24} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Shift Time</span>
              <div className="flex flex-col mt-1">
                <span className="text-sm font-bold text-slate-900 dark:text-white">{formatTime(data.start_time)}</span>
                <span className="text-sm text-slate-500 my-0.5">-</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{formatTime(data.end_time)}</span>
                <span className="text-xs font-medium text-slate-500 mt-1">
                  ( {getDuration(data.start_time, data.end_time)} )
                </span>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
              <div className={`w-3 h-3 rounded-full ${statusDot}`}></div>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</span>
              <div className="mt-2">
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${statusColor}`}>
                  {statusLabel}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Map */}
        <div className="lg:col-span-3 lg:sticky lg:top-6 self-start">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 p-2 overflow-hidden">
            <DynamicShiftMap checkpoints={checkpoints} className="mt-0 border-none shadow-none bg-transparent" heightClass="h-[290px]" />
          </div>
        </div>

        {/* Right: Reports & Actions */}
        <div className="lg:col-span-2 h-fit flex flex-col bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
          {/* Daily Activity Report */}
          <div className="border-b border-slate-200 dark:border-slate-800">
            <button 
              onClick={() => setActiveTab(activeTab === 'dar' ? '' : 'dar')}
              className={cn("w-full flex items-center justify-between p-5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group", activeTab === 'dar' && "bg-slate-50 dark:bg-slate-800/50")}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <ClipboardList className={cn("size-5", activeTab === 'dar' ? "text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-400")} />
                </div>
                <span className={cn("font-bold text-sm uppercase tracking-wide", activeTab === 'dar' ? "text-blue-600 dark:text-blue-400" : "text-slate-800 dark:text-slate-200")}>Daily Activity Report</span>
              </div>
              <ChevronRight className={cn("transition-transform duration-300", activeTab === 'dar' ? "rotate-90 text-blue-600 dark:text-blue-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200")} />
            </button>
            {activeTab === 'dar' && (
              <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2 duration-300">
                <ShiftDARReportTab reports={data} isReportsLoading={false} reportsError={null} setPreviewFile={setPreviewFile} />
              </div>
            )}
          </div>

          {/* Incident Report */}
          {data?.incident_report && data.incident_report.length > 0 && (
            <div className="border-b border-slate-200 dark:border-slate-800">
              <button 
                onClick={() => setActiveTab(activeTab === 'incident' ? '' : 'incident')}
                className={cn("w-full flex items-center justify-between p-5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group", activeTab === 'incident' && "bg-slate-50 dark:bg-slate-800/50")}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <AlertTriangle className={cn("size-5", activeTab === 'incident' ? "text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-400")} />
                  </div>
                  <span className={cn("font-bold text-sm uppercase tracking-wide", activeTab === 'incident' ? "text-blue-600 dark:text-blue-400" : "text-slate-800 dark:text-slate-200")}>Incident Report</span>
                </div>
                <ChevronRight className={cn("transition-transform duration-300", activeTab === 'incident' ? "rotate-90 text-blue-600 dark:text-blue-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200")} />
              </button>
              {activeTab === 'incident' && (
                <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2 duration-300">
                  <ShiftIncidentReportsTab reports={data} isReportsLoading={false} reportsError={null} setPreviewFile={setPreviewFile} />
                </div>
              )}
            </div>
          )}

          {/* Check Point */}
          <div className="border-b border-slate-200 dark:border-slate-800">
            <button 
              onClick={() => setActiveTab(activeTab === 'checkpoint' ? '' : 'checkpoint')}
              className={cn("w-full flex items-center justify-between p-5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group", activeTab === 'checkpoint' && "bg-slate-50 dark:bg-slate-800/50")}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <MapPin className={cn("size-5", activeTab === 'checkpoint' ? "text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-400")} />
                </div>
                <span className={cn("font-bold text-sm uppercase tracking-wide", activeTab === 'checkpoint' ? "text-blue-600 dark:text-blue-400" : "text-slate-800 dark:text-slate-200")}>Check Point</span>
              </div>
              <ChevronRight className={cn("transition-transform duration-300", activeTab === 'checkpoint' ? "rotate-90 text-blue-600 dark:text-blue-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200")} />
            </button>
            {activeTab === 'checkpoint' && (
              <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2 duration-300">
                <ShiftCheckpointsTab reports={data} isReportsLoading={false} reportsError={null} setPreviewFile={setPreviewFile} />
              </div>
            )}
          </div>

          {/* History Of Changes */}
          <div>
            <button 
              onClick={() => setActiveTab(activeTab === 'history' ? '' : 'history')}
              className={cn("w-full flex items-center justify-between p-5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group", activeTab === 'history' && "bg-slate-50 dark:bg-slate-800/50")}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <History className={cn("size-5", activeTab === 'history' ? "text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-400")} />
                </div>
                <span className={cn("font-bold text-sm uppercase tracking-wide", activeTab === 'history' ? "text-blue-600 dark:text-blue-400" : "text-slate-800 dark:text-slate-200")}>History Of Changes</span>
              </div>
              <ChevronRight className={cn("transition-transform duration-300", activeTab === 'history' ? "rotate-90 text-blue-600 dark:text-blue-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200")} />
            </button>
            {activeTab === 'history' && (
              <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2 duration-300">
                <ShiftHistoryTab reports={data} isReportsLoading={false} reportsError={null} setPreviewFile={setPreviewFile} />
              </div>
            )}
          </div>
        </div>
      </div>
      <FilePreviewDialog previewFile={previewFile} setPreviewFile={setPreviewFile} />
    </div>
  );
}
