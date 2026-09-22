"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Clock,
  Activity,
  ChevronRight,
  ArrowLeft,
  Calendar,
  MapPin,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/table/pagination";
import { cn } from "@/lib/utils";
import {
  clientFetchGuardShiftsAction,
  GuardShiftRecord
} from "@/lib/client-actions";

type ShiftType = "complete_shifts" | "scheduled_shifts" | "active_shifts";

const shiftTypeConfig: Record<
  ShiftType,
  {
    title: string;
    description: string;
    icon: any;
    color: string;
    badgeBg: string;
    badgeText: string;
  }
> = {
  complete_shifts: {
    title: "Completed Shifts",
    description: "All successfully completed guard shifts",
    icon: ShieldCheck,
    color: "text-[#0064cb]",
    badgeBg: "bg-emerald-50",
    badgeText: "text-emerald-600"
  },
  scheduled_shifts: {
    title: "Scheduled Shifts",
    description: "Upcoming scheduled shifts for this guard",
    icon: Clock,
    color: "text-[#0064cb]",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-600"
  },
  active_shifts: {
    title: "Active Shifts",
    description: "Currently live and in-progress shifts",
    icon: Activity,
    color: "text-[#0064cb]",
    badgeBg: "bg-emerald-50",
    badgeText: "text-emerald-600"
  }
};

function GuardShiftsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const guardId = searchParams.get("guard_id") || searchParams.get("id") || "";
  const currentType = (searchParams.get("type") as ShiftType) || "complete_shifts";
  const activeType: ShiftType = ["complete_shifts", "scheduled_shifts", "active_shifts"].includes(currentType)
    ? currentType
    : "complete_shifts";
  const [backUrl, setBackUrl] = useState("/guard-overview");

  const [shifts, setShifts] = useState<GuardShiftRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<{
    total: number;
    total_pages: number;
    page_size: number;
  } | null>(null);

  useEffect(() => {
    const returnTo = searchParams.get("returnTo");
    if (returnTo) {
      setBackUrl(returnTo);
    } else if (guardId) {
      setBackUrl(`/guard-overview?guard_id=${guardId}`);
    }
  }, [searchParams, guardId]);

  const loadShifts = async (page: number = 1) => {
    if (!guardId) return;
    setIsLoading(true);
    const res = await clientFetchGuardShiftsAction({
      guard_id: guardId,
      type: activeType,
      page,
      page_size: 20
    });
    if (res.success && res.data) {
      setShifts(res.data);
      setPagination({
        total: res.total ?? 0,
        total_pages: res.total_pages ?? 1,
        page_size: res.page_size ?? 20
      });
      setCurrentPage(page);
    } else {
      setShifts([]);
      setPagination(null);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadShifts(1);
  }, [guardId, activeType]);

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
    } catch {}

    return { date: dateStr, time: "" };
  };

  const formatStatus = (status?: string) => {
    if (!status) return "---";
    return status
      .replace(/^shift_/, "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getStatusBadgeClass = (status?: string) => {
    const s = (status || "").toLowerCase();
    if (s.includes("finish") || s.includes("complete") || s.includes("approved")) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
    if (s.includes("progress") || s.includes("active")) {
      return "bg-blue-50 text-blue-700 border-blue-200";
    }
    if (s.includes("scheduled") || s.includes("planned")) {
      return "bg-amber-50 text-amber-700 border-amber-200";
    }
    if (s.includes("cancel") || s.includes("refused") || s.includes("abandon")) {
      return "bg-rose-50 text-rose-700 border-rose-200";
    }
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  const currentConfig = shiftTypeConfig[activeType] || shiftTypeConfig.complete_shifts;
  const TypeIcon = currentConfig.icon;

  return (
    <div className="p-0 sm:p-4 md:p-6 max-w-[1500px] mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-slate-700 text-[13px] mb-1">
          <Link href="/dashboard" className="hover:text-[#0064cb] transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/users-directory/guards" className="hover:text-[#0064cb] transition-colors">
            Guards
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link
            href={guardId ? `/guard-overview?guard_id=${guardId}` : "/guard-overview"}
            className="hover:text-[#0064cb] transition-colors"
          >
            Guard Overview
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-600 font-medium">{currentConfig.title}</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(backUrl)}
            className="p-2 bg-white rounded-lg border border-slate-200 text-slate-700 hover:text-[#0064cb] transition-all cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-2xl font-bold text-slate-900">
            {currentConfig.title}
          </h1>
        </div>
      </div>

      <div className="w-full">
        <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-white min-h-[600px] flex flex-col !gap-0 !py-0">
          <CardHeader className="p-4 sm:p-5 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 border-b border-slate-100 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-[#0064cb] shrink-0 border border-blue-100/60">
                <TypeIcon className="w-4 h-4 text-[#0064cb]" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-slate-900">{currentConfig.title}</CardTitle>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {pagination?.total ?? shifts.length} Total Shifts
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 flex-1 flex flex-col">
            <div className={cn("overflow-x-auto flex-1", shifts.length > 10 && "max-h-[620px] overflow-y-auto")}>
              <Table className="min-w-[900px]">
                <TableHeader className={cn("bg-[#f0f4f8]", shifts.length > 10 && "sticky top-0 z-10 shadow-[0_1px_2px_rgba(0,0,0,0.05)]")}>
                  <TableRow className="hover:bg-transparent border-slate-100 bg-[#f0f4f8]">
                    <TableHead className="py-4 px-6 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      #
                    </TableHead>
                    <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Shift No.
                    </TableHead>
                    <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Role
                    </TableHead>
                    <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Status
                    </TableHead>
                    <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Company / Invoice
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
                    Array.from({ length: 5 }).map((_, idx) => (
                      <TableRow key={idx} className="hover:bg-transparent border-slate-50">
                        <TableCell className="px-6 py-4"><Skeleton className="h-4 w-4 bg-slate-100" /></TableCell>
                        <TableCell className="px-4 py-4"><Skeleton className="h-4 w-20 bg-slate-100" /></TableCell>
                        <TableCell className="px-4 py-4"><Skeleton className="h-4 w-20 bg-slate-100" /></TableCell>
                        <TableCell className="px-4 py-4"><Skeleton className="h-5 w-20 rounded-full bg-slate-100" /></TableCell>
                        <TableCell className="px-4 py-4"><Skeleton className="h-8 w-28 bg-slate-100" /></TableCell>
                        <TableCell className="px-4 py-4"><Skeleton className="h-8 w-24 bg-slate-100" /></TableCell>
                        <TableCell className="px-4 py-4"><Skeleton className="h-8 w-24 bg-slate-100" /></TableCell>
                        <TableCell className="px-6 py-4"><Skeleton className="h-4 w-48 bg-slate-100" /></TableCell>
                      </TableRow>
                    ))
                  ) : shifts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-slate-500 text-sm font-medium">
                        No shifts found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    shifts.map((shift, index) => {
                      const startFormatted = formatDateTime(shift.start_time);
                      const endFormatted = formatDateTime(shift.end_time);
                      const shiftId = shift.shift_id || shift.id;
                      const rowNumber = (currentPage - 1) * (pagination?.page_size || 20) + index + 1;

                      return (
                        <TableRow
                          key={shiftId || shift.shift_no || index}
                          onClick={() => {
                            if (shiftId) {
                              router.push(`/shift/view?shift_id=${shiftId}`);
                            }
                          }}
                          className="hover:bg-slate-50/70 border-b border-slate-50 transition-colors cursor-pointer group"
                        >
                          <TableCell className="px-6 py-4 text-xs text-slate-500 font-medium">
                            {rowNumber}
                          </TableCell>

                          <TableCell className="px-4 py-4 text-xs font-semibold text-slate-900 whitespace-nowrap group-hover:text-[#0064cb] transition-colors">
                            #{shift.shift_no}
                          </TableCell>

                          <TableCell className="px-4 py-4 text-xs font-medium text-slate-800 whitespace-nowrap">
                            {shift.role || "---"}
                          </TableCell>

                          <TableCell className="px-4 py-4 whitespace-nowrap">
                            <span
                              className={cn(
                                "inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border",
                                getStatusBadgeClass(shift.status)
                              )}
                            >
                              {formatStatus(shift.status)}
                            </span>
                          </TableCell>

                          <TableCell className="px-4 py-4 min-w-[150px]">
                            <div className="font-semibold text-xs text-slate-900 group-hover:text-[#0064cb] transition-colors">
                              {shift.company_name || "---"}
                            </div>
                            {shift.invoice_no && (
                              <div className="text-[11px] text-slate-500 font-medium">
                                {shift.invoice_no}
                              </div>
                            )}
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

                          <TableCell className="px-6 py-4">
                            <div className="flex items-start gap-1.5 max-w-xs">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                              <span
                                className="text-xs text-slate-600 truncate"
                                title={shift.shift_location}
                              >
                                {shift.shift_location || "---"}
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

            {pagination && pagination.total > 0 && pagination.total_pages > 1 && (
              <div className="border-t border-slate-100 p-4">
                <Pagination
                  page={currentPage}
                  totalPages={pagination.total_pages}
                  totalItems={pagination.total}
                  limit={pagination.page_size}
                  onPageChange={(p) => loadShifts(p)}
                  isPending={isLoading}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function GuardShiftsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 md:p-6 max-w-[1400px] mx-auto space-y-6">
          <div className="h-10 w-48 bg-slate-100 rounded-lg animate-pulse" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      }
    >
      <GuardShiftsContent />
    </Suspense>
  );
}
