"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Users,
  Check,
  Send,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AvailableGuardItem } from "@/lib/client-actions";
import {
  MatrixAvailabilityType,
  AvailableInvoiceShift,
} from "./types";
import {
  MATRIX_AVATAR_COLORS,
  getMatrixInitials,
  formatShiftDisplayDate,
  formatShiftDisplayTime,
} from "./utils";
import { MatrixStatusBadge } from "./MatrixStatusBadge";

interface AvailableGuardsMatrixViewProps {
  isSentShiftsLoading: boolean;
  selectedMatrixShifts: AvailableInvoiceShift[];
  availableInvoiceShifts: AvailableInvoiceShift[];
  selectedMatrixShiftIds: string[];
  onToggleMatrixShift: (id: string) => void;
  onRemoveMatrixShift: (id: string) => void;

  matrixAvailabilityType: MatrixAvailabilityType;
  onMatrixAvailabilityTypeChange: (val: MatrixAvailabilityType) => void;

  isMatrixLoading: boolean;
  onSearch: (page?: number) => void;

  matrixGuards: AvailableGuardItem[];
  displayedShiftNos: string[];
  matrixTotalGuards: number;
  matrixTotalPages: number;
  matrixCurrentPage: number;
  hasMatrixSearched: boolean;
  onPageChange: (page: number) => void;
}

export function AvailableGuardsMatrixView({
  isSentShiftsLoading,
  selectedMatrixShifts,
  availableInvoiceShifts,
  selectedMatrixShiftIds,
  onToggleMatrixShift,
  onRemoveMatrixShift,
  matrixAvailabilityType,
  onMatrixAvailabilityTypeChange,
  isMatrixLoading,
  onSearch,
  matrixGuards,
  displayedShiftNos,
  matrixTotalGuards,
  matrixTotalPages,
  matrixCurrentPage,
  hasMatrixSearched,
  onPageChange,
}: AvailableGuardsMatrixViewProps) {
  const router = useRouter();
  const [isShiftDropdownOpen, setIsShiftDropdownOpen] = useState(false);
  const shiftDropdownRef = useRef<HTMLDivElement>(null);

  const selectedMatrixShiftIdsSet = useMemo(
    () => new Set(selectedMatrixShiftIds),
    [selectedMatrixShiftIds]
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shiftDropdownRef.current && !shiftDropdownRef.current.contains(event.target as Node)) {
        setIsShiftDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div>
      <div className="px-6 pt-6 pb-4 border-b border-slate-100 bg-white">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Available Guards List
        </h1>
        <p className="text-sm text-slate-500 mt-1 font-normal">
          Find guards based on their responses for the selected shifts.
        </p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end mb-6">
          <div className="md:col-span-6 relative" ref={shiftDropdownRef}>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              <span className="inline-flex items-center gap-1">
                Select shifts for which requests were sent
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </span>
            </label>
            <div
              onClick={() => setIsShiftDropdownOpen(!isShiftDropdownOpen)}
              className="min-h-[42px] px-2.5 py-1.5 border border-slate-200 rounded-lg flex flex-wrap items-center gap-1.5 bg-white cursor-pointer hover:border-slate-300 transition-colors"
            >
              {isSentShiftsLoading ? (
                <span className="text-xs text-slate-400 flex items-center gap-1.5 py-1">
                  <Loader2 className="w-3 h-3 animate-spin text-[#0064cb]" /> Loading shifts...
                </span>
              ) : selectedMatrixShifts.length > 0 ? (
                selectedMatrixShifts.map((s, sIdx) => (
                  <span
                    key={`pill-${s.shift_id}-${sIdx}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#e8f1fc] text-[#0064cb] text-xs font-bold"
                  >
                    {s.shift_no}
                    {selectedMatrixShifts.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveMatrixShift(s.shift_id);
                        }}
                        className="hover:text-blue-800 transition-colors cursor-pointer"
                        title="Remove shift"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400">Select shifts...</span>
              )}
              <ChevronDown className="w-4 h-4 text-slate-400 ml-auto shrink-0" />
            </div>

            {isShiftDropdownOpen && (
              <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl p-2 max-h-60 overflow-y-auto space-y-1">
                {isSentShiftsLoading ? (
                  <div className="py-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#0064cb]" /> Loading shifts...
                  </div>
                ) : (
                  availableInvoiceShifts.map((s, sIdx) => {
                    const isSelected = selectedMatrixShiftIdsSet.has(s.shift_id);
                    return (
                      <div
                        key={`dropdown-shift-${s.shift_id}-${sIdx}`}
                        onClick={() => onToggleMatrixShift(s.shift_id)}
                        className={cn(
                          "px-3 py-2 rounded-md flex items-center justify-between text-xs cursor-pointer transition-colors",
                          isSelected ? "bg-blue-50 text-[#0064cb] font-semibold" : "hover:bg-slate-50 text-slate-700"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => { }}
                            className="rounded border-slate-300 text-[#0064cb] focus:ring-[#0064cb]"
                          />
                          <span className="font-bold">{s.shift_no}</span>
                          <span className="text-slate-500 font-normal">
                            ({formatShiftDisplayDate(s.start_time)})
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {formatShiftDisplayTime(s.start_time, s.end_time)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <div className="md:col-span-4">
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Availability Type
            </label>
            <Select
              value={matrixAvailabilityType}
              onValueChange={(val: any) => onMatrixAvailabilityTypeChange(val)}
            >
              <SelectTrigger className="h-[42px] rounded-lg border-slate-200 text-xs font-semibold text-slate-800 bg-white cursor-pointer">
                <SelectValue placeholder="Availability Type" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 shadow-xl z-50">
                <SelectItem value="all" className="cursor-pointer py-2.5">
                  <div className="flex items-center gap-2.5 font-medium text-xs">
                    <Users className="w-4 h-4 text-slate-700 shrink-0" />
                    <span>All</span>
                  </div>
                </SelectItem>
                <SelectItem value="available_all" className="cursor-pointer py-2.5">
                  <div className="flex items-center gap-2.5 font-medium text-xs">
                    <Check className="w-4 h-4 text-emerald-600 stroke-[2.5] shrink-0" />
                    <span>Available for All Selected Shifts</span>
                  </div>
                </SelectItem>
                <SelectItem value="available_any" className="cursor-pointer py-2.5">
                  <div className="flex items-center gap-2.5 font-medium text-xs">
                    <Check className="w-4 h-4 text-emerald-600 stroke-[2.5] shrink-0" />
                    <span>Available for Any Selected Shifts</span>
                  </div>
                </SelectItem>
                <SelectItem value="willing_to_travel_all" className="cursor-pointer py-2.5">
                  <div className="flex items-center gap-2.5 font-medium text-xs">
                    <Send className="w-3.5 h-3.5 text-blue-500 shrink-0 -rotate-45" />
                    <span>Willing to Travel for All Selected Shifts</span>
                  </div>
                </SelectItem>
                <SelectItem value="willing_to_travel_any" className="cursor-pointer py-2.5">
                  <div className="flex items-center gap-2.5 font-medium text-xs">
                    <Send className="w-3.5 h-3.5 text-blue-500 shrink-0 -rotate-45" />
                    <span>Willing to Travel for Any Selected Shifts</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2">
            <Button
              type="button"
              onClick={() => onSearch(1)}
              disabled={isMatrixLoading || selectedMatrixShifts.length === 0 || isSentShiftsLoading}
              className="w-full h-[42px] rounded-lg bg-[#0064cb] hover:bg-[#0052a8] text-white font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-[#0064cb]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isMatrixLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Search className="w-3.5 h-3.5" />
              )}
              Search
            </Button>
          </div>
        </div>

        {selectedMatrixShifts.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-bold text-slate-900 mb-2.5">
              Selected Shifts ({selectedMatrixShifts.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
              {selectedMatrixShifts.map((shift, idx) => (
                <div
                  key={`card-${shift.shift_id}-${idx}`}
                  className="border border-blue-100 bg-[#f8fbff] rounded-xl p-3 flex items-start justify-between relative shadow-sm"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#e8f1fc] text-[#0064cb] flex items-center justify-center shrink-0 mt-0.5">
                      <CalendarDays className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-[#0064cb]">
                        {shift.shift_no}
                      </div>
                      <div className="text-[11px] text-slate-700 font-medium mt-0.5">
                        {formatShiftDisplayDate(shift.start_time)}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {formatShiftDisplayTime(shift.start_time, shift.end_time)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-2.5">
          {isMatrixLoading ? (
            <Skeleton className="h-4 w-36 bg-slate-200 rounded" />
          ) : (
            <p className="text-xs font-medium text-slate-600">
              Showing {matrixGuards.length} of {matrixTotalGuards} guards
            </p>
          )}
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
          <div className="overflow-x-auto custom-scrollbar w-full">
            <Table className="min-w-[850px] md:min-w-full">
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="text-[11px] font-bold text-slate-900 uppercase py-3.5 px-4">
                    GUARD NAME
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-900 uppercase py-3.5 px-4">
                    EMAIL
                  </TableHead>
                  {(displayedShiftNos.length > 0
                    ? displayedShiftNos
                    : isMatrixLoading
                      ? ["...", "..."]
                      : []
                  ).map((shiftNo, idx) => (
                    <TableHead
                      key={`th-shift-${shiftNo}-${idx}`}
                      className="text-[11px] font-bold text-slate-900 uppercase py-3.5 px-4 text-center"
                    >
                      {shiftNo === "..." ? (
                        <Skeleton className="h-3 w-12 mx-auto bg-slate-200" />
                      ) : (
                        `#${shiftNo.replace(/^#/, "")}`
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isMatrixLoading ? (
                  Array.from({ length: 8 }).map((_, rIdx) => (
                    <TableRow
                      key={`matrix-skel-row-${rIdx}`}
                      className="border-slate-50 hover:bg-transparent"
                    >
                      <TableCell className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <Skeleton className="w-7 h-7 rounded-full bg-slate-200 shrink-0" />
                          <Skeleton
                            className={cn(
                              "h-4 rounded bg-slate-200",
                              rIdx % 3 === 0
                                ? "w-28"
                                : rIdx % 3 === 1
                                  ? "w-36"
                                  : "w-24"
                            )}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5 px-4">
                        <Skeleton
                          className={cn(
                            "h-4 rounded bg-slate-200",
                            rIdx % 2 === 0 ? "w-40" : "w-32"
                          )}
                        />
                      </TableCell>
                      {(displayedShiftNos.length > 0
                        ? displayedShiftNos
                        : ["1", "2"]
                      ).map((_, sIdx) => (
                        <TableCell
                          key={`matrix-skel-cell-${rIdx}-${sIdx}`}
                          className="py-3.5 px-4 text-center"
                        >
                          <Skeleton className="w-6 h-6 rounded-full mx-auto bg-slate-200" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : matrixGuards.length > 0 ? (
                  matrixGuards.map((guard: any, idx: number) => {
                    const guardId = guard.guard_id || guard.notification_id || `g-${idx}`;
                    const targetId = guard.application_id || guard.guard_id || guard.id;
                    const name = guard.guard_name || guard.name || "Guard";
                    const initials = getMatrixInitials(name);
                    const avatarColor = MATRIX_AVATAR_COLORS[initials] || "bg-indigo-100 text-indigo-700";

                    return (
                      <TableRow
                        key={`guard-${guardId}-${idx}`}
                        className={cn(
                          "border-slate-50 transition-colors group",
                          targetId ? "cursor-pointer hover:bg-slate-50/80" : "hover:bg-slate-50/50"
                        )}
                        onClick={() => {
                          if (targetId) {
                            router.push(`/guard-bank/${targetId}`);
                          }
                        }}
                        title={targetId ? `Click to view ${name} details` : undefined}
                      >
                        <TableCell className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={cn(
                                "w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0",
                                avatarColor
                              )}
                            >
                              {initials}
                            </div>
                            <span className="font-bold text-sm text-slate-900 group-hover:text-[#0064cb] transition-colors">
                              {name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-4 text-sm text-slate-600 font-normal">
                          {guard.email || "-"}
                        </TableCell>
                        {displayedShiftNos.map((shiftNo, sIdx) => {
                          const cleanNo = shiftNo.replace(/^#/, "").trim();
                          const status =
                            guard.shifts_data?.[cleanNo] ||
                            guard.shifts_data?.[`#${cleanNo}`] ||
                            "not_sent";

                          return (
                            <TableCell key={`cell-${guardId}-${cleanNo}-${sIdx}`} className="py-3 px-4 text-center">
                              <MatrixStatusBadge status={status} />
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={2 + displayedShiftNos.length}
                      className="py-10 text-center text-slate-600 font-medium"
                    >
                      {!hasMatrixSearched
                        ? 'Click "Search" to view available guards for the selected shift(s).'
                        : "No guards found matching the selected criteria."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="border-t border-slate-100 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 bg-white">
            <div className="text-xs text-slate-500 font-medium">
              {isMatrixLoading ? (
                <Skeleton className="h-4 w-40 bg-slate-200 rounded" />
              ) : (
                `Showing ${matrixGuards.length > 0 ? (matrixCurrentPage - 1) * 15 + 1 : 0} to ${Math.min(matrixCurrentPage * 15, matrixTotalGuards)} of ${matrixTotalGuards} guards`
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="w-8 h-8 p-0 text-slate-600 border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                disabled={matrixCurrentPage <= 1 || isMatrixLoading}
                onClick={() => onPageChange(matrixCurrentPage - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {Array.from({ length: Math.max(1, matrixTotalPages) }, (_, p) => p + 1).map((pg) => (
                <Button
                  key={`page-${pg}`}
                  size="sm"
                  variant={pg === matrixCurrentPage ? "primary" : "outline"}
                  className={cn(
                    "w-8 h-8 p-0 font-bold text-xs cursor-pointer",
                    pg === matrixCurrentPage
                      ? "bg-[#0064cb] text-white hover:bg-[#0052a8]"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  )}
                  onClick={() => onPageChange(pg)}
                  disabled={isMatrixLoading}
                >
                  {pg}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-8 h-8 p-0 text-slate-600 border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                disabled={matrixCurrentPage >= matrixTotalPages || isMatrixLoading}
                onClick={() => onPageChange(matrixCurrentPage + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-4 bg-slate-50/70 border border-slate-200/80 px-4 py-2 rounded-xl text-xs font-medium text-slate-700">
              <div className="flex items-center gap-1.5">
                <MatrixStatusBadge status="available" />
                <span className="text-xs text-slate-600 font-medium">Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MatrixStatusBadge status="unavailable" />
                <span className="text-xs text-slate-600 font-medium">Unavailable</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MatrixStatusBadge status="pending" />
                <span className="text-xs text-slate-600 font-medium">Pending</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MatrixStatusBadge status="willing_to_travel" />
                <span className="text-xs text-slate-600 font-medium">Willing to Travel</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MatrixStatusBadge status="not_sent" />
                <span className="text-xs text-slate-600 font-medium">Not Sent</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
