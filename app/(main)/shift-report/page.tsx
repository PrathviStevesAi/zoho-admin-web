"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Download,
  Calendar,
  MapPin,
  ChevronRight,
  ArrowLeft,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { clientFetchShiftReportsAction, ShiftReportItem } from "@/lib/client-actions";

type DateFilterOption = "today" | "yesterday" | "last_7_days" | "custom";

function ShiftReportContent() {
  const router = useRouter();
  const [reports, setReports] = useState<ShiftReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilterOption>("today");

  const formatDateToYMD = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayStr = formatDateToYMD(new Date());
  const [customStartDate, setCustomStartDate] = useState(todayStr);
  const [customEndDate, setCustomEndDate] = useState(todayStr);
  const [totalCount, setTotalCount] = useState(0);

  const getDateParams = () => {
    const today = new Date();

    switch (dateFilter) {
      case "today": {
        const todayFormatted = formatDateToYMD(today);
        return { start_date: todayFormatted, end_date: todayFormatted };
      }
      case "yesterday": {
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        const yStr = formatDateToYMD(yesterday);
        return { start_date: yStr, end_date: yStr };
      }
      case "last_7_days": {
        const last7 = new Date();
        last7.setDate(today.getDate() - 7);
        return { start_date: formatDateToYMD(last7), end_date: formatDateToYMD(today) };
      }
      case "custom": {
        const currentToday = formatDateToYMD(today);
        return {
          start_date: customStartDate || currentToday,
          end_date: customEndDate || currentToday,
        };
      }
      default: {
        const todayFormatted = formatDateToYMD(today);
        return { start_date: todayFormatted, end_date: todayFormatted };
      }
    }
  };

  const loadReports = async () => {
    setIsLoading(true);
    const dateParams = getDateParams();
    const res = await clientFetchShiftReportsAction({
      start_date: dateParams.start_date,
      end_date: dateParams.end_date,
      search: searchQuery.trim() || undefined,
    });

    if (res.success && res.data) {
      setReports(res.data);
      const total = res.total ?? res.data.length;
      setTotalCount(total);
    } else {
      setReports([]);
      setTotalCount(0);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (dateFilter === "custom" && (!customStartDate || !customEndDate)) {
      return;
    }

    const timer = setTimeout(() => {
      loadReports();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, dateFilter, customStartDate, customEndDate]);

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return { date: "---", time: "---" };

    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/);
    if (match) {
      const yearFull = match[1];
      const yearShort = yearFull.slice(-2);
      const month = match[2];
      const day = match[3];

      const hour24 = parseInt(match[4], 10);
      const minute = match[5];
      const ampm = hour24 >= 12 ? "PM" : "AM";
      const hour12 = hour24 % 12 || 12;
      const hourFormatted = String(hour12).padStart(2, "0");

      return {
        date: `${month} / ${day} / ${yearShort}`,
        time: `${hourFormatted} : ${minute} ${ampm}`,
      };
    }

    const dateMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (dateMatch) {
      const yearShort = dateMatch[1].slice(-2);
      const month = dateMatch[2];
      const day = dateMatch[3];
      return {
        date: `${month} / ${day} / ${yearShort}`,
        time: "---",
      };
    }

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
        return { date: `${month} / ${day} / ${yearShort}`, time };
      }
    } catch { }

    return { date: dateStr, time: "" };
  };

  const handleExport = () => {
    if (!reports || reports.length === 0) {
      return;
    }

    const headers = [
      "Shift No",
      "Guard Name",
      "Invoice No",
      "Company",
      "Shift Start",
      "Shift End",
      "Location",
    ];

    const rows = reports.map((r) => {
      const startFmt = formatDateTime(r.start_time || r.shift_start);
      const endFmt = formatDateTime(r.end_time || r.shift_end);
      const shiftStartStr = startFmt.date !== "---" ? `${startFmt.date} ${startFmt.time}` : "";
      const shiftEndStr = endFmt.date !== "---" ? `${endFmt.date} ${endFmt.time}` : "";
      const shiftNo = r.shift_no ? String(r.shift_no) : "";
      const guardName = (r.assigned_guard_name || r.guard_name || "").replace(/"/g, '""');
      const invoiceNo = (r.invoice_no || "").replace(/"/g, '""');
      const company = (r.company_name || r.company || "").replace(/"/g, '""');
      const location = (r.shift_location || r.location || "").replace(/"/g, '""');

      return [
        `"${shiftNo}"`,
        `"${guardName}"`,
        `"${invoiceNo}"`,
        `"${company}"`,
        `"${shiftStartStr}"`,
        `"${shiftEndStr}"`,
        `"${location}"`,
      ].join(",");
    });

    const csvString = [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob(["\uFEFF" + csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `shift_reports_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-0 sm:p-4 md:p-6 max-w-[1500px] mx-auto space-y-8 animate-in fade-in duration-500">
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
        <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-white min-h-[600px] flex flex-col !gap-0 !py-0">
          <CardHeader className="p-4 sm:p-5 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 border-b border-slate-100 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-[#0064cb] shrink-0 border border-blue-100/60">
                <FileText className="w-4 h-4 text-[#0064cb]" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-slate-900">Shift Reports</CardTitle>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {totalCount} Total Reports
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto mt-2 xl:mt-0">
              <div className="w-full sm:w-[145px]">
                <Select
                  value={dateFilter}
                  onValueChange={(val: DateFilterOption) => {
                    setDateFilter(val);
                    if (val === "custom") {
                      const nowStr = formatDateToYMD(new Date());
                      setCustomStartDate(nowStr);
                      setCustomEndDate(nowStr);
                    }
                  }}
                >
                  <SelectTrigger className="h-9 sm:h-10 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:ring-1 focus:ring-[#0064cb]/20 focus:border-[#0064cb] transition-colors">
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-slate-200 shadow-xl rounded-lg p-1 min-w-[145px] z-[100]">
                    <SelectItem value="today" className="text-xs py-2 px-2.5 rounded-md cursor-pointer text-slate-700 hover:bg-slate-50 focus:bg-blue-50 focus:text-[#0064cb] font-medium">
                      Today
                    </SelectItem>
                    <SelectItem value="yesterday" className="text-xs py-2 px-2.5 rounded-md cursor-pointer text-slate-700 hover:bg-slate-50 focus:bg-blue-50 focus:text-[#0064cb] font-medium">
                      Yesterday
                    </SelectItem>
                    <SelectItem value="last_7_days" className="text-xs py-2 px-2.5 rounded-md cursor-pointer text-slate-700 hover:bg-slate-50 focus:bg-blue-50 focus:text-[#0064cb] font-medium">
                      Last 7 days
                    </SelectItem>
                    <SelectItem value="custom" className="text-xs py-2 px-2.5 rounded-md cursor-pointer text-slate-700 hover:bg-slate-50 focus:bg-blue-50 focus:text-[#0064cb] font-medium">
                      Custom Dates
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {dateFilter === "custom" && (
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="h-9 sm:h-10 w-36 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 shadow-sm focus:border-[#0064cb] focus:ring-1 focus:ring-[#0064cb]/20"
                    placeholder="Start Date"
                  />
                  <span className="text-xs text-slate-400 font-medium">to</span>
                  <Input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="h-9 sm:h-10 w-36 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 shadow-sm focus:border-[#0064cb] focus:ring-1 focus:ring-[#0064cb]/20"
                    placeholder="End Date"
                  />
                </div>
              )}

              <div className="relative flex-1 sm:w-[260px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search shift no, guard, invoice..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 sm:h-10 pl-9 pr-3 bg-white border border-slate-200 rounded-lg shadow-sm focus:ring-1 focus:ring-[#0064cb]/20 focus:border-[#0064cb] transition-all text-xs font-medium text-slate-800 placeholder:text-slate-400"
                />
              </div>

              <Button
                onClick={handleExport}
                className="h-9 sm:h-10 px-4 bg-[#0064cb] hover:bg-[#0052ae] text-white rounded-lg text-xs font-semibold shadow-sm transition-all active:scale-95 flex items-center gap-2 cursor-pointer shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0 flex-1 flex flex-col">
            <div className="overflow-x-auto flex-1">
              <Table className="min-w-[900px]">
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-slate-100">
                    <TableHead className="py-4 px-6 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      #
                    </TableHead>
                    <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Shift No.
                    </TableHead>
                    <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Guard Name
                    </TableHead>
                    <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Invoice No.
                    </TableHead>
                    <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Company
                    </TableHead>
                    <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Shift Start
                    </TableHead>
                    <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Shift End
                    </TableHead>
                    <TableHead className="py-4 px-6 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Location
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i} className="hover:bg-transparent border-slate-50">
                        <TableCell className="px-6 py-4">
                          <Skeleton className="h-4 w-4 bg-slate-100" />
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <Skeleton className="h-4 w-20 bg-slate-100" />
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
                        <TableCell className="px-4 py-4">
                          <Skeleton className="h-8 w-24 bg-slate-100" />
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <Skeleton className="h-8 w-24 bg-slate-100" />
                        </TableCell>
                        <TableCell className="px-4 py-6">
                          <Skeleton className="h-4 w-48 bg-slate-100" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : reports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-12 text-center text-sm font-medium text-slate-500">
                        No shift reports found for the selected date range.
                      </TableCell>
                    </TableRow>
                  ) : (
                    reports.map((item, index) => {
                      const startFormatted = formatDateTime(item.start_time || item.shift_start);
                      const endFormatted = formatDateTime(item.end_time || item.shift_end);
                      const shiftId = item.shift_id || item.id;

                      return (
                        <TableRow
                          key={shiftId || index}
                          onClick={() => {
                            if (shiftId) {
                              router.push(`/shift/view?shift_id=${shiftId}`);
                            }
                          }}
                          className="hover:bg-slate-50/70 border-b border-slate-50 transition-colors cursor-pointer group"
                        >
                          <TableCell className="px-6 py-4 text-xs text-slate-500 font-medium">
                            {index + 1}
                          </TableCell>

                          <TableCell className="px-4 py-4 text-xs font-semibold text-slate-900 whitespace-nowrap group-hover:text-[#0064cb] transition-colors">
                            #{item.shift_no}
                          </TableCell>

                          <TableCell className="px-4 py-4 text-xs font-medium text-slate-800 whitespace-nowrap">
                            {item.assigned_guard_name || item.guard_name || "---"}
                          </TableCell>

                          <TableCell className="px-4 py-4 text-xs font-medium text-slate-700 whitespace-nowrap">
                            {item.invoice_no || "---"}
                          </TableCell>

                          <TableCell className="px-4 py-4 text-xs font-medium text-slate-800 whitespace-nowrap">
                            {item.company_name || item.company || "---"}
                          </TableCell>

                          <TableCell className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-start gap-2">
                              <Calendar className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                              <div className="flex flex-col">
                                <span className="text-xs font-medium text-slate-800">
                                  {startFormatted.date}
                                </span>
                                <span className="text-[11px] text-slate-500">
                                  {startFormatted.time}
                                </span>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-start gap-2">
                              <Calendar className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                              <div className="flex flex-col">
                                <span className="text-xs font-medium text-slate-800">
                                  {endFormatted.date}
                                </span>
                                <span className="text-[11px] text-slate-500">
                                  {endFormatted.time}
                                </span>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="px-4 py-6">
                            <div className="flex items-start gap-1.5 max-w-xs">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
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
            </div>
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
        <div className="p-6 max-w-[1500px] mx-auto space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      }
    >
      <ShiftReportContent />
    </Suspense>
  );
}
