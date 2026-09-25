"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Download,
  Calendar,
  Clock,
  CheckCircle2,
  MapPin,
  ChevronRight,
  ArrowLeft,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { clientFetchShiftReportsAction, ShiftReportItem } from "@/lib/client-actions";

function formatHoursToHAndM(decimalHours?: number | null) {
  if (decimalHours === undefined || decimalHours === null || isNaN(decimalHours)) return "0h 00m";
  const totalMinutes = Math.round(decimalHours * 60);
  const h = Math.floor(Math.abs(totalMinutes) / 60);
  const m = Math.abs(totalMinutes) % 60;
  const sign = totalMinutes < 0 ? "-" : "";
  return `${sign}${h}h ${String(m).padStart(2, "0")}m`;
}

function formatDateToYMD(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(ymd: string) {
  if (!ymd) return "";
  const parts = ymd.split("-");
  if (parts.length === 3) {
    return `${parts[1]}/${parts[2]}/${parts[0]}`;
  }
  return ymd;
}

function formatDateTime(dateStr?: string) {
  if (!dateStr) return { date: "---", time: "---" };

  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const yearShort = String(d.getFullYear()).slice(-2);
      const time = d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      return { date: `${month}/${day}/${yearShort}`, time };
    }
  } catch { }

  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/);
  if (match) {
    const yearShort = match[1].slice(-2);
    const month = match[2];
    const day = match[3];
    const hour24 = parseInt(match[4], 10);
    const minute = match[5];
    const ampm = hour24 >= 12 ? "PM" : "AM";
    const hour12 = hour24 % 12 || 12;
    const hourFormatted = String(hour12).padStart(2, "0");

    return {
      date: `${month}/${day}/${yearShort}`,
      time: `${hourFormatted}:${minute} ${ampm}`,
    };
  }

  return { date: dateStr, time: "---" };
}

function formatStatus(status?: string) {
  if (!status) return "---";
  return status
    .replace(/^shift_/, "")
    .replace(/_/g, " ")
    .toUpperCase();
}

function getStatusBadgeClass(status?: string) {
  const s = (status || "").toLowerCase();
  if (s.includes("finish") || s.includes("complete") || s.includes("approved")) {
    return "bg-emerald-50 text-emerald-600 border-emerald-200/80 font-bold";
  }
  if (s.includes("progress") || s.includes("active") || s.includes("arrival") || s.includes("accepted")) {
    return "bg-blue-50 text-blue-600 border-blue-200/80 font-bold";
  }
  if (s.includes("scheduled") || s.includes("pending")) {
    return "bg-amber-50 text-amber-600 border-amber-200/80 font-bold";
  }
  if (s.includes("cancel") || s.includes("refused") || s.includes("reject")) {
    return "bg-rose-50 text-rose-600 border-rose-200/80 font-bold";
  }
  return "bg-slate-50 text-slate-600 border-slate-200 font-bold";
}

function getLastSunday(date: Date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
  const diff = day === 0 ? 7 : day;
  d.setDate(d.getDate() - diff);
  return d;
}

function ShiftReportContent() {
  const router = useRouter();
  const [summary, setSummary] = useState({
    total_shifts: 0,
    total_scheduled_hours: 0,
    total_actual_hours: 0,
    variance: 0,
    variance_percentage: 0,
  });

  const [allReports, setAllReports] = useState<ShiftReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters: start date defaults to last Sunday, end date to current date
  const [startDate, setStartDate] = useState(() => formatDateToYMD(getLastSunday()));
  const [endDate, setEndDate] = useState(() => formatDateToYMD(new Date()));
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [invoiceQuery, setInvoiceQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const loadReports = async () => {
    setIsLoading(true);
    const res = await clientFetchShiftReportsAction({
      start_date: startDate,
      end_date: endDate,
      search: searchQuery.trim() || undefined,
      invoice_no: invoiceQuery.trim() || undefined,
    });

    if (res.success && res.data) {
      setAllReports(res.data);
      setSummary({
        total_shifts: res.total_shifts ?? res.data.length,
        total_scheduled_hours: res.total_scheduled_hours ?? 0,
        total_actual_hours: res.total_actual_hours ?? 0,
        variance: res.variance ?? 0,
        variance_percentage: res.variance_percentage ?? 0,
      });
    } else {
      setAllReports([]);
      setSummary({
        total_shifts: 0,
        total_scheduled_hours: 0,
        total_actual_hours: 0,
        variance: 0,
        variance_percentage: 0,
      });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadReports();
    }, 350);
    return () => clearTimeout(timer);
  }, [startDate, endDate, invoiceQuery, searchQuery]);

  const handleExport = () => {
    if (!allReports || allReports.length === 0) return;

    const headers = [
      "Shift No",
      "Guard Name",
      "Invoice No",
      "Company",
      "Status",
      "Scheduled Start",
      "Scheduled End",
      "Scheduled Hours",
      "Actual Clock In",
      "Actual Clock Out",
      "Actual Hours Worked",
      "Location",
    ];

    const rows = allReports.map((r) => {
      const startFmt = formatDateTime(r.start_time || r.shift_start);
      const endFmt = formatDateTime(r.end_time || r.shift_end);
      const clockInFmt = formatDateTime(r.clock_in);
      const clockOutFmt = formatDateTime(r.clock_out);

      return [
        `"${r.shift_no || ""}"`,
        `"${(r.assigned_guard_name || r.guard_name || "").replace(/"/g, '""')}"`,
        `"${(r.invoice_no || "").replace(/"/g, '""')}"`,
        `"${(r.company_name || r.company || "").replace(/"/g, '""')}"`,
        `"${(formatStatus(r.status) || "").replace(/"/g, '""')}"`,
        `"${startFmt.date !== "---" ? `${startFmt.date} ${startFmt.time}` : ""}"`,
        `"${endFmt.date !== "---" ? `${endFmt.date} ${endFmt.time}` : ""}"`,
        `"${r.duration ?? ""}"`,
        `"${clockInFmt.date !== "---" ? `${clockInFmt.date} ${clockInFmt.time}` : ""}"`,
        `"${clockOutFmt.date !== "---" ? `${clockOutFmt.date} ${clockOutFmt.time}` : ""}"`,
        `"${r.actual_hours ?? ""}"`,
        `"${(r.shift_location || r.location || "").replace(/"/g, '""')}"`,
      ].join(",");
    });

    const csvString = [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob(["\uFEFF" + csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `shift_reports_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-0 sm:p-4 md:p-6 max-w-[1550px] mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-slate-700 text-[13px] mb-1">
          <Link href="/dashboard" className="hover:text-[#0064cb] transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-700">Security Management</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-600 font-medium">Shift Report</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 bg-white rounded-lg border border-slate-200 text-slate-700 hover:text-[#0064cb] transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Shift Report</h1>
        </div>
      </div>

      <div className="w-full">
        <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-white flex flex-col !gap-0 !py-0">
          <CardHeader className="p-4 sm:p-6 pb-4 border-b border-slate-100 bg-white">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Title & Badge */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0064cb]/10 flex items-center justify-center text-[#0064cb] shrink-0 border border-blue-100">
                  <FileText className="w-5 h-5 text-[#0064cb]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Shift Reports</h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {summary.total_shifts} Total Reports
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-end gap-3 w-full lg:w-auto">
                <div className="flex flex-col gap-1 w-full sm:w-auto relative">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Date Range
                  </span>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                      className="flex items-center gap-2.5 h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100/70 transition-colors cursor-pointer shadow-sm min-w-[210px]"
                    >
                      <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{formatDisplayDate(startDate)} - {formatDisplayDate(endDate)}</span>
                    </button>

                    {isDatePickerOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setIsDatePickerOpen(false)}
                        />
                        <div className="absolute top-full left-0 mt-2 p-4 bg-white border border-slate-200 rounded-xl shadow-xl z-50 animate-in fade-in duration-100 min-w-[300px] space-y-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-slate-500">Start Date</label>
                            <Input
                              type="date"
                              value={startDate}
                              onChange={(e) => setStartDate(e.target.value)}
                              className="h-9 bg-slate-50 border-slate-200 rounded-lg text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-slate-500">End Date</label>
                            <Input
                              type="date"
                              value={endDate}
                              onChange={(e) => setEndDate(e.target.value)}
                              className="h-9 bg-slate-50 border-slate-200 rounded-lg text-xs"
                            />
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setStartDate(formatDateToYMD(getLastSunday()));
                                setEndDate(formatDateToYMD(new Date()));
                              }}
                              className="text-xs text-slate-500 hover:text-slate-800 h-8 px-2"
                            >
                              Reset to Last Sunday
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => setIsDatePickerOpen(false)}
                              className="bg-[#0064cb] hover:bg-[#0052ae] text-white text-xs h-8 px-3 rounded-lg font-bold"
                            >
                              Apply
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1 w-full sm:w-[190px]">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Invoice No.
                  </span>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search invoice no..."
                      value={invoiceQuery}
                      onChange={(e) => setInvoiceQuery(e.target.value)}
                      className="h-10 pl-9 pr-3 bg-slate-50 border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:ring-[#0064cb]/10 focus:border-[#0064cb]"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1 w-full sm:w-[260px]">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Search
                  </span>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="shift no, guard, company..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-10 pl-9 pr-3 bg-slate-50 border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:ring-[#0064cb]/10 focus:border-[#0064cb]"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleExport}
                  className="cursor-pointer h-10 px-5 bg-[#0064cb] hover:bg-[#0052ae] text-white rounded-xl font-bold text-xs shadow-md shadow-blue-200 transition-all active:scale-95 flex items-center gap-2 shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-blue-50/80 border border-blue-100 flex items-center justify-center text-[#0064cb] shrink-0">
                  <Calendar className="w-6 h-6 text-[#0064cb]" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-slate-500">Total Shifts</p>
                  <p className="text-2xl font-bold text-slate-900">{summary.total_shifts}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-slate-500">Total Scheduled Hours</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {formatHoursToHAndM(summary.total_scheduled_hours)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <Clock className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-slate-500">Total Actual Hours</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {formatHoursToHAndM(summary.total_actual_hours)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-teal-600" />
                </div>
                <div className="space-y-0.5 flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-500">Variance</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-2xl font-bold text-slate-900">
                      {Number(summary.variance) >= 0 ? `+${Number(summary.variance).toFixed(2)}` : Number(summary.variance).toFixed(2)} hrs
                    </span>
                    <span
                      className={cn(
                        "text-[11px] font-bold px-2 py-0.5 rounded-full border",
                        Number(summary.variance_percentage) >= 0
                          ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                          : "bg-rose-50 text-rose-600 border-rose-200"
                      )}
                    >
                      {Number(summary.variance_percentage) >= 0 ? `+${Number(summary.variance_percentage)}%` : `${Number(summary.variance_percentage)}%`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 flex flex-col min-h-0">
            <Table
              className="min-w-[1250px] border-collapse"
              containerClassName={
                allReports.length > 15
                  ? "max-h-[780px] overflow-y-auto custom-scrollbar"
                  : "overflow-y-visible"
              }
            >
              <TableHeader className="bg-[#f8fafc] sticky top-0 z-20 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
                <TableRow className="border-b border-slate-200/80 bg-[#f8fafc] hover:bg-[#f8fafc]">
                  <TableHead rowSpan={2} className="w-12 text-center text-[11px] font-bold text-slate-700 uppercase tracking-wider py-3 border-r border-slate-200/60 bg-[#f8fafc]">
                    #
                  </TableHead>
                  <TableHead rowSpan={2} className="text-[11px] font-bold text-slate-700 uppercase tracking-wider py-3 px-4 border-r border-slate-200/60 bg-[#f8fafc]">
                    Shift No.
                  </TableHead>
                  <TableHead rowSpan={2} className="text-[11px] font-bold text-slate-700 uppercase tracking-wider py-3 px-4 border-r border-slate-200/60 bg-[#f8fafc]">
                    Guard Name
                  </TableHead>
                  <TableHead rowSpan={2} className="text-[11px] font-bold text-slate-700 uppercase tracking-wider py-3 px-4 border-r border-slate-200/60 bg-[#f8fafc]">
                    Invoice No.
                  </TableHead>
                  <TableHead rowSpan={2} className="text-[11px] font-bold text-slate-700 uppercase tracking-wider py-3 px-4 border-r border-slate-200/60 bg-[#f8fafc]">
                    Company
                  </TableHead>
                  <TableHead colSpan={3} className="text-center text-[11px] font-bold text-slate-700 uppercase tracking-wider py-2.5 px-4 bg-[#f1f5f9] border-r border-slate-200">
                    Scheduled Shift
                  </TableHead>
                  <TableHead colSpan={3} className="text-center text-[11px] font-bold text-slate-700 uppercase tracking-wider py-2.5 px-4 bg-[#f1f5f9] border-r border-slate-200">
                    Actual Worked
                  </TableHead>
                  <TableHead rowSpan={2} className="text-center text-[11px] font-bold text-slate-700 uppercase tracking-wider py-3 px-4 border-r border-slate-200/60 bg-[#f8fafc]">
                    Status
                  </TableHead>
                  <TableHead rowSpan={2} className="text-[11px] font-bold text-slate-700 uppercase tracking-wider py-3 px-4 bg-[#f8fafc]">
                    Location
                  </TableHead>
                </TableRow>

                <TableRow className="border-b border-slate-200 bg-[#f8fafc] hover:bg-[#f8fafc]">
                  <TableHead className="text-center text-[10px] font-bold text-slate-600 uppercase py-2 px-3 border-r border-slate-200/60 bg-[#f1f5f9]">
                    Start
                  </TableHead>
                  <TableHead className="text-center text-[10px] font-bold text-slate-600 uppercase py-2 px-3 border-r border-slate-200/60 bg-[#f1f5f9]">
                    End
                  </TableHead>
                  <TableHead className="text-center text-[10px] font-bold text-slate-600 uppercase py-2 px-3 border-r border-slate-200 bg-[#f1f5f9]">
                    Duration
                  </TableHead>
                  <TableHead className="text-center text-[10px] font-bold text-slate-600 uppercase py-2 px-3 border-r border-slate-200/60 bg-[#f1f5f9]">
                    Clock In
                  </TableHead>
                  <TableHead className="text-center text-[10px] font-bold text-slate-600 uppercase py-2 px-3 border-r border-slate-200/60 bg-[#f1f5f9]">
                    Clock Out
                  </TableHead>
                  <TableHead className="text-center text-[10px] font-bold text-slate-600 uppercase py-2 px-3 border-r border-slate-200 bg-[#f1f5f9]">
                    Actual Hours
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="hover:bg-transparent border-slate-100">
                      <TableCell className="px-4 py-4 text-center">
                        <Skeleton className="h-4 w-4 mx-auto bg-slate-100" />
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <Skeleton className="h-4 w-16 bg-slate-100" />
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <Skeleton className="h-4 w-28 bg-slate-100" />
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <Skeleton className="h-4 w-20 bg-slate-100" />
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <Skeleton className="h-4 w-32 bg-slate-100" />
                      </TableCell>
                      <TableCell className="px-3 py-4 text-center">
                        <Skeleton className="h-8 w-20 mx-auto bg-slate-100" />
                      </TableCell>
                      <TableCell className="px-3 py-4 text-center">
                        <Skeleton className="h-8 w-20 mx-auto bg-slate-100" />
                      </TableCell>
                      <TableCell className="px-3 py-4 text-center">
                        <Skeleton className="h-4 w-12 mx-auto bg-slate-100" />
                      </TableCell>
                      <TableCell className="px-3 py-4 text-center">
                        <Skeleton className="h-8 w-20 mx-auto bg-slate-100" />
                      </TableCell>
                      <TableCell className="px-3 py-4 text-center">
                        <Skeleton className="h-8 w-20 mx-auto bg-slate-100" />
                      </TableCell>
                      <TableCell className="px-3 py-4 text-center">
                        <Skeleton className="h-4 w-12 mx-auto bg-slate-100" />
                      </TableCell>
                      <TableCell className="px-4 py-4 text-center">
                        <Skeleton className="h-6 w-20 mx-auto rounded-full bg-slate-100" />
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <Skeleton className="h-4 w-40 bg-slate-100" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : allReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={13} className="py-16 text-center text-sm font-medium text-slate-500">
                      No shift reports found for the selected criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  allReports.map((item, index) => {
                    const startFmt = formatDateTime(item.start_time || item.shift_start);
                    const endFmt = formatDateTime(item.end_time || item.shift_end);
                    const clockInFmt = formatDateTime(item.clock_in);
                    const clockOutFmt = formatDateTime(item.clock_out);
                    const shiftId = item.shift_id || item.id;
                    const globalIndex = index + 1;

                    return (
                      <TableRow
                        key={shiftId || index}
                        onClick={() => {
                          if (shiftId) {
                            router.push(`/shift/view?shift_id=${shiftId}`);
                          }
                        }}
                        className="hover:bg-slate-50/70 border-b border-slate-100 transition-colors cursor-pointer group"
                      >
                        <TableCell className="px-4 py-3.5 text-center text-xs text-slate-500 font-medium border-r border-slate-100">
                          {globalIndex}
                        </TableCell>

                        <TableCell className="px-4 py-3.5 text-xs font-bold text-[#0064cb] whitespace-nowrap border-r border-slate-100">
                          #{item.shift_no}
                        </TableCell>

                        <TableCell className="px-4 py-3.5 text-xs font-semibold text-slate-800 whitespace-nowrap border-r border-slate-100">
                          {item.assigned_guard_name || item.guard_name || "---"}
                        </TableCell>

                        <TableCell className="px-4 py-3.5 text-xs font-medium text-slate-700 whitespace-nowrap border-r border-slate-100">
                          {item.invoice_no || "---"}
                        </TableCell>

                        <TableCell className="px-4 py-3.5 text-xs font-semibold text-slate-800 whitespace-nowrap border-r border-slate-100">
                          {item.company_name || item.company || "---"}
                        </TableCell>

                        <TableCell className="px-3 py-3.5 whitespace-nowrap border-r border-slate-100 bg-[#fafcff]/50">
                          <div className="flex items-center justify-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <div className="flex flex-col text-left">
                              <span className="text-[11px] font-medium text-slate-700">{startFmt.date}</span>
                              <span className="text-[10px] text-slate-500">{startFmt.time}</span>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="px-3 py-3.5 whitespace-nowrap border-r border-slate-100 bg-[#fafcff]/50">
                          <div className="flex items-center justify-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <div className="flex flex-col text-left">
                              <span className="text-[11px] font-medium text-slate-700">{endFmt.date}</span>
                              <span className="text-[10px] text-slate-500">{endFmt.time}</span>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="px-3 py-3.5 text-center text-xs font-semibold text-slate-800 whitespace-nowrap border-r border-slate-200 bg-[#fafcff]/50">
                          {item.duration !== undefined && item.duration !== null
                            ? formatHoursToHAndM(item.duration)
                            : "---"}
                        </TableCell>

                        <TableCell className="px-3 py-3.5 whitespace-nowrap border-r border-slate-100 bg-[#f8fafc]/50">
                          {item.clock_in ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <div className="flex flex-col text-left">
                                <span className="text-[11px] font-medium text-slate-700">{clockInFmt.date}</span>
                                <span className="text-[10px] text-slate-500">{clockInFmt.time}</span>
                              </div>
                            </div>
                          ) : (
                            <span className="block text-center text-xs text-slate-400">---</span>
                          )}
                        </TableCell>

                        <TableCell className="px-3 py-3.5 whitespace-nowrap border-r border-slate-100 bg-[#f8fafc]/50">
                          {item.clock_out ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <div className="flex flex-col text-left">
                                <span className="text-[11px] font-medium text-slate-700">{clockOutFmt.date}</span>
                                <span className="text-[10px] text-slate-500">{clockOutFmt.time}</span>
                              </div>
                            </div>
                          ) : (
                            <span className="block text-center text-xs text-slate-400">---</span>
                          )}
                        </TableCell>

                        <TableCell className="px-3 py-3.5 text-center text-xs font-bold text-slate-900 whitespace-nowrap border-r border-slate-200 bg-[#f8fafc]/50">
                          {item.actual_hours !== undefined && item.actual_hours !== null
                            ? formatHoursToHAndM(item.actual_hours)
                            : "---"}
                        </TableCell>

                        <TableCell className="px-4 py-3.5 text-center whitespace-nowrap border-r border-slate-100">
                          <span
                            className={cn(
                              "inline-block px-3 py-1 rounded-full text-[10px] tracking-wider border",
                              getStatusBadgeClass(item.status)
                            )}
                          >
                            {formatStatus(item.status)}
                          </span>
                        </TableCell>

                        {/* Location */}
                        <TableCell className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5 max-w-[220px]">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span
                              className="text-xs text-slate-600 truncate"
                              title={item.shift_location || item.location}
                            >
                              {item.shift_location || item.location || "---"}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ShiftReportPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 max-w-[1550px] mx-auto space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      }
    >
      <ShiftReportContent />
    </Suspense>
  );
}
