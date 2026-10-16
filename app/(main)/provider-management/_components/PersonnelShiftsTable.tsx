"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Search,
  RotateCcw,
  XCircle,
  MapPin,
  Clock,
  User,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/table/pagination";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import useDebounceValue from "@/hooks/use-debounce";
import { clientFetchPersonnelProfileSubdataAction } from "@/lib/client-actions";
import { getStatusColor, formatStatus } from "@/components/shift/utils";

export interface PersonnelShiftItem {
  shift_id?: string;
  shift_no?: number | string;
  invoice_no?: string;
  invoice_id?: string;
  customer_name?: string;
  start_time?: string;
  end_time?: string;
  total_hours?: number | string;
  shift_location?: string;
  agreed_rate?: number | string | null;
  assigned_guard?: string;
  status?: string;
  role?: string;
  [key: string]: any;
}

interface PersonnelShiftsTableProps {
  profileId: string;
  entityLabel: string;
  onCountChange?: (count: number) => void;
}

export function PersonnelShiftsTable({
  profileId,
  entityLabel,
  onCountChange,
}: PersonnelShiftsTableProps) {
  const router = useRouter();
  const PAGE_SIZE = 15;
  const [shifts, setShifts] = useState<PersonnelShiftItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounceValue(searchQuery, 400);

  const loadShifts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await clientFetchPersonnelProfileSubdataAction<PersonnelShiftItem>(
        profileId,
        "shifts",
        currentPage,
        debouncedSearch,
        PAGE_SIZE
      );

      if (res.success && res.data) {
        setShifts(res.data);
        const count = typeof res.total === "number" ? res.total : res.data.length;
        setTotalCount(count);
        setPageSize(PAGE_SIZE);
        if (onCountChange && !debouncedSearch) {
          onCountChange(count);
        }
      } else {
        toast.error(res.error || "Failed to load shifts");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to load shifts");
    } finally {
      setIsLoading(false);
    }
  }, [profileId, currentPage, debouncedSearch, onCountChange]);

  const displayedShifts = useMemo(() => {
    if (shifts.length > pageSize) {
      const startIndex = (currentPage - 1) * pageSize;
      return shifts.slice(startIndex, startIndex + pageSize);
    }
    return shifts;
  }, [shifts, currentPage, pageSize]);

  useEffect(() => {
    loadShifts();
  }, [loadShifts]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const formatRole = (role?: string) => {
    if (!role) return "Guard";
    return role
      .replace(/_/g, " ")
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  };

  const formatAgreedRate = (rate?: number | string | null) => {
    if (rate === null || rate === undefined || rate === "") return "---";
    const num = typeof rate === "number" ? rate : parseFloat(String(rate));
    if (isNaN(num)) return "---";
    return `$${num.toFixed(2)}/hr`;
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return <span className="text-xs text-slate-400">---</span>;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return <span className="text-xs text-slate-700">{dateStr}</span>;
      const dateFormatted = d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const timeFormatted = d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      return (
        <div className="space-y-0.5">
          <p className="text-xs font-bold text-slate-800 whitespace-nowrap">{dateFormatted}</p>
          <p className="text-[11px] font-medium text-slate-500 whitespace-nowrap">{timeFormatted}</p>
        </div>
      );
    } catch {
      return <span className="text-xs text-slate-700">{dateStr}</span>;
    }
  };

  return (
    <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden bg-white min-h-[480px] flex flex-col !gap-0 !py-0">
      <CardHeader className="p-4 sm:p-6 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#0064cb]">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-base sm:text-lg font-bold text-slate-800">
              Shifts
            </CardTitle>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {totalCount} Total {totalCount === 1 ? "Shift" : "Shifts"} Scheduled for this {entityLabel}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {searchQuery && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setCurrentPage(1);
              }}
              className="h-9 px-3 text-xs font-semibold rounded-lg text-slate-600 hover:text-red-600 hover:border-red-200 cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </CardHeader>

      <div className="p-4 sm:px-6 py-3 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-[340px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search shift no, invoice, customer..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="h-10 pl-9 pr-9 bg-white border-slate-200 rounded-md text-xs font-medium text-slate-800 focus-visible:ring-1 focus-visible:ring-[#0064cb]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setCurrentPage(1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="text-xs text-slate-500 font-medium self-end sm:self-center">
          Showing <span className="font-semibold text-slate-700">{displayedShifts.length}</span> of{" "}
          <span className="font-semibold text-slate-700">{totalCount}</span> shifts
        </div>
      </div>

      <CardContent className="p-0 flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <Table className="min-w-[1100px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent border-slate-100 bg-slate-50/30">
                <TableHead className="py-3.5 px-6 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Shift / Invoice
                </TableHead>
                <TableHead className="py-3.5 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Customer Name
                </TableHead>
                <TableHead className="py-3.5 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Assigned Guard
                </TableHead>
                <TableHead className="py-3.5 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Start Date/Time
                </TableHead>
                <TableHead className="py-3.5 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  End Date/Time
                </TableHead>
                <TableHead className="py-3.5 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-wider text-center">
                  Total Hours
                </TableHead>
                <TableHead className="py-3.5 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-wider text-center">
                  Agreed Rate
                </TableHead>
                <TableHead className="py-3.5 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Shift Location
                </TableHead>
                <TableHead className="py-3.5 px-6 text-[11px] font-bold text-slate-600 uppercase tracking-wider text-center">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="hover:bg-transparent border-slate-50">
                    <TableCell className="px-6 py-4">
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-20 bg-slate-100" />
                        <Skeleton className="h-3 w-24 bg-slate-100" />
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-4">
                      <Skeleton className="h-4 w-28 bg-slate-100" />
                    </TableCell>
                    <TableCell className="py-4 px-4">
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-24 bg-slate-100" />
                        <Skeleton className="h-3 w-16 bg-slate-100" />
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-4">
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-24 bg-slate-100" />
                        <Skeleton className="h-3 w-16 bg-slate-100" />
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-4">
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-24 bg-slate-100" />
                        <Skeleton className="h-3 w-16 bg-slate-100" />
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-4 text-center">
                      <Skeleton className="h-6 w-16 mx-auto rounded-full bg-slate-100" />
                    </TableCell>
                    <TableCell className="py-4 px-4 text-center">
                      <Skeleton className="h-4 w-16 mx-auto bg-slate-100" />
                    </TableCell>
                    <TableCell className="py-4 px-4">
                      <Skeleton className="h-4 w-36 bg-slate-100" />
                    </TableCell>
                    <TableCell className="py-4 px-6 text-center">
                      <Skeleton className="h-6 w-24 mx-auto rounded-full bg-slate-100" />
                    </TableCell>
                  </TableRow>
                ))
              ) : displayedShifts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-72 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-1">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-slate-800">
                        {searchQuery ? "No matching shifts found" : "No shifts scheduled"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {searchQuery
                          ? `We couldn't find any shifts matching "${searchQuery}". Try a different search term.`
                          : `There are currently no shifts assigned or recorded for this ${entityLabel.toLowerCase()}.`}
                      </p>
                      {searchQuery && (
                        <Button
                          onClick={() => setSearchQuery("")}
                          variant="outline"
                          size="sm"
                          className="mt-2 h-8 text-xs font-bold rounded-lg cursor-pointer"
                        >
                          Clear Search
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                displayedShifts.map((shift, idx) => {
                  const statusClass = getStatusColor(shift.status || "");
                  const invoiceDisplay = shift.invoice_no || (shift.invoice_id ? `INV-${shift.invoice_id.slice(0, 6)}` : null);
                  const targetUrl = shift.shift_id ? `/shift/view?shift_id=${shift.shift_id}` : null;

                  return (
                    <TableRow
                      key={shift.shift_id || idx}
                      onClick={() => {
                        if (targetUrl) router.push(targetUrl);
                      }}
                      className={cn(
                        "group hover:bg-slate-50/80 border-slate-100 transition-colors",
                        targetUrl && "cursor-pointer"
                      )}
                    >
                      <TableCell className="px-6 py-3.5">
                        <div className="space-y-0.5">
                          <p className="font-mono text-xs font-bold text-slate-900 group-hover:text-[#0064cb] transition-colors">
                            #{shift.shift_no || "---"}
                          </p>
                          {invoiceDisplay && (
                            <p className="font-mono text-xs font-medium text-slate-500">
                              {invoiceDisplay}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="py-3.5 px-4">
                        <p className="text-xs font-bold text-slate-900 group-hover:text-[#0064cb] transition-colors capitalize">
                          {shift.customer_name || "N/A"}
                        </p>
                      </TableCell>

                      <TableCell className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[150px]">{shift.assigned_guard || "Unassigned"}</span>
                          </div>
                          {shift.role ? (
                            <span className="inline-block text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                              {formatRole(shift.role)}
                            </span>
                          ) : (
                            <span className="inline-block text-[10px] font-medium text-slate-400">
                              Guard
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="py-3.5 px-4">
                        {formatDateTime(shift.start_time)}
                      </TableCell>

                      <TableCell className="py-3.5 px-4">
                        {formatDateTime(shift.end_time)}
                      </TableCell>

                      <TableCell className="py-3.5 px-4 text-center">
                        {shift.total_hours !== undefined && shift.total_hours !== null ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {shift.total_hours} hrs
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">---</span>
                        )}
                      </TableCell>

                      <TableCell className="py-3.5 px-4 text-center">
                        <span className="text-xs font-bold text-slate-800">
                          {formatAgreedRate(shift.agreed_rate)}
                        </span>
                      </TableCell>

                      <TableCell className="py-3.5 px-4 max-w-[220px]">
                        {shift.shift_location ? (
                          <div
                            className="flex items-center gap-1.5 text-xs text-slate-700 min-w-0"
                            title={shift.shift_location}
                          >
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate block font-medium">
                              {shift.shift_location}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">---</span>
                        )}
                      </TableCell>

                      <TableCell className="py-3.5 px-6 text-center">
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap",
                            statusClass
                          )}
                        >
                          {formatStatus(shift.status || "N/A")}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {totalCount > 0 && (
          <Pagination
            page={currentPage}
            totalPages={totalPages}
            totalItems={totalCount}
            limit={pageSize}
            onPageChange={(page) => setCurrentPage(page)}
            isPending={isLoading}
          />
        )}
      </CardContent>
    </Card>
  );
}
