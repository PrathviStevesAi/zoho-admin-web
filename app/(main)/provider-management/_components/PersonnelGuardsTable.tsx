"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  Search,
  RotateCcw,
  XCircle,
  Mail,
  Phone,
  Plus,
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
import {
  clientFetchPersonnelProfileSubdataAction,
  clientAddGuardsToPersonnelProfileAction,
} from "@/lib/client-actions";
import { SelectGuardsDialog } from "@/app/(main)/broadcast-notifications/_components/SelectGuardsDialog";

export interface PersonnelGuardItem {
  guard_name?: string;
  application_id?: string;
  guard_id?: string | null;
  email?: string;
  phone_no?: string;
  first_name?: string;
  last_name?: string;
  status?: string;
  account_status?: string;
  [key: string]: any;
}

interface PersonnelGuardsTableProps {
  profileId: string;
  entityLabel: string;
  onCountChange?: (count: number) => void;
}

export function PersonnelGuardsTable({
  profileId,
  entityLabel,
  onCountChange,
}: PersonnelGuardsTableProps) {
  const router = useRouter();
  const PAGE_SIZE = 15;
  const [guards, setGuards] = useState<PersonnelGuardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounceValue(searchQuery, 400);
  const [isAddGuardsOpen, setIsAddGuardsOpen] = useState(false);

  const loadGuards = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await clientFetchPersonnelProfileSubdataAction<PersonnelGuardItem>(
        profileId,
        "guards",
        currentPage,
        debouncedSearch,
        PAGE_SIZE
      );

      if (res.success && res.data) {
        setGuards(res.data);
        const count = typeof res.total === "number" ? res.total : res.data.length;
        setTotalCount(count);
        setPageSize(PAGE_SIZE);
        if (onCountChange && !debouncedSearch) {
          onCountChange(count);
        }
      } else {
        toast.error(res.error || "Failed to load guards");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to load guards");
    } finally {
      setIsLoading(false);
    }
  }, [profileId, currentPage, debouncedSearch, onCountChange]);

  const displayedGuards = useMemo(() => {
    if (guards.length > pageSize) {
      const startIndex = (currentPage - 1) * pageSize;
      return guards.slice(startIndex, startIndex + pageSize);
    }
    return guards;
  }, [guards, currentPage, pageSize]);

  const handleAddGuards = async (guardIds: string[]) => {
    if (!guardIds || guardIds.length === 0) {
      toast.error("Please select at least one guard to add");
      throw new Error("No guards selected");
    }

    try {
      const res = await clientAddGuardsToPersonnelProfileAction({
        personnel_profile_id: profileId,
        guard_ids: guardIds,
      });

      if (res.success) {
        toast.success(res.message || "Guards added successfully");
        await loadGuards();
      } else {
        toast.error(res.error || "Failed to add guards");
        throw new Error(res.error || "Failed to add guards");
      }
    } catch (err: any) {
      if (err?.message !== "No guards selected") {
        toast.error(err?.message || "Failed to add guards");
      }
      throw err;
    }
  };

  useEffect(() => {
    loadGuards();
  }, [loadGuards]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const formatStatusBadge = (status?: string) => {
    const raw = String(status || "").toLowerCase().trim();
    if (raw === "approved") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          Approved
        </span>
      );
    }
    if (raw === "record_touched") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          Record Touched
        </span>
      );
    }
    if (raw === "pending") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          Pending
        </span>
      );
    }
    if (raw === "rejected" || raw === "declined") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
          Rejected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 capitalize">
        {raw ? raw.replace(/_/g, " ") : "N/A"}
      </span>
    );
  };

  const formatAccountStatusBadge = (status?: string) => {
    const raw = String(status || "").toLowerCase().trim();
    if (raw === "active") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Active
        </span>
      );
    }
    if (raw === "archived") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          Archived
        </span>
      );
    }
    if (raw === "suspended" || raw === "inactive") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          {raw === "suspended" ? "Suspended" : "Inactive"}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 capitalize">
        {raw ? raw.replace(/_/g, " ") : "N/A"}
      </span>
    );
  };

  const getInitials = (guard: PersonnelGuardItem) => {
    const name = guard.guard_name || `${guard.first_name || ""} ${guard.last_name || ""}`.trim();
    if (!name) return "G";
    const parts = name.split(" ").filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden bg-white min-h-[480px] flex flex-col !gap-0 !py-0">
      <CardHeader className="p-4 sm:p-6 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#0064cb]">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-base sm:text-lg font-bold text-slate-800">
              Guards Directory
            </CardTitle>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {totalCount} Total {totalCount === 1 ? "Guard" : "Guards"} Registered under this {entityLabel}
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
              className="h-9 px-3 text-xs font-semibold rounded-md text-slate-600 hover:text-red-600 hover:border-red-200 cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </Button>
          )}

          <Button
            onClick={() => setIsAddGuardsOpen(true)}
            className="h-9 px-4 bg-[#0064cb] hover:bg-[#0052ae] text-white font-semibold rounded-md cursor-pointer text-xs shadow-sm transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Guard</span>
          </Button>
        </div>
      </CardHeader>

      <div className="p-4 sm:px-6 py-3 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-[340px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search guards by name or email..."
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
          Showing <span className="font-semibold text-slate-700">{displayedGuards.length}</span> of{" "}
          <span className="font-semibold text-slate-700">{totalCount}</span> guards
        </div>
      </div>

      <CardContent className="p-0 flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <Table className="min-w-[850px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent border-slate-100 bg-slate-50/30">
                <TableHead className="py-3.5 px-6 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Guard Name
                </TableHead>
                <TableHead className="py-3.5 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Email Address
                </TableHead>
                <TableHead className="py-3.5 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Phone Number
                </TableHead>
                <TableHead className="py-3.5 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-wider text-center">
                  Status
                </TableHead>
                <TableHead className="py-3.5 px-6 text-[11px] font-bold text-slate-600 uppercase tracking-wider text-center">
                  Account Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="hover:bg-transparent border-slate-50">
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-9 h-9 rounded-full bg-slate-100" />
                        <Skeleton className="h-4 w-32 bg-slate-100" />
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-4">
                      <Skeleton className="h-4 w-36 bg-slate-100" />
                    </TableCell>
                    <TableCell className="py-4 px-4">
                      <Skeleton className="h-4 w-28 bg-slate-100" />
                    </TableCell>
                    <TableCell className="py-4 px-4 text-center">
                      <Skeleton className="h-6 w-20 mx-auto rounded-full bg-slate-100" />
                    </TableCell>
                    <TableCell className="py-4 px-6 text-center">
                      <Skeleton className="h-6 w-16 mx-auto rounded-full bg-slate-100" />
                    </TableCell>
                  </TableRow>
                ))
              ) : displayedGuards.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-72 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-1">
                        <Shield className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-slate-800">
                        {searchQuery ? "No matching guards found" : "No guards assigned"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {searchQuery
                          ? `We couldn't find any guards matching "${searchQuery}". Try a different keyword.`
                          : `There are currently no guards associated with this ${entityLabel.toLowerCase()}.`}
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
                displayedGuards.map((guard, idx) => {
                  const displayName =
                    guard.guard_name ||
                    `${guard.first_name || ""} ${guard.last_name || ""}`.trim() ||
                    "Unnamed Guard";
                  const targetId = guard.application_id || guard.guard_id;
                  const targetUrl = targetId ? `/guard-bank/${targetId}` : null;

                  return (
                    <TableRow
                      key={guard.guard_id || guard.application_id || idx}
                      onClick={() => {
                        if (targetUrl) router.push(targetUrl);
                      }}
                      className={cn(
                        "group hover:bg-slate-50/80 border-slate-100 transition-colors",
                        targetUrl && "cursor-pointer"
                      )}
                    >
                      <TableCell className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-50 text-[#0064cb] border border-blue-100 font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                            {getInitials(guard)}
                          </div>
                          <p className="text-sm font-bold text-slate-900 group-hover:text-[#0064cb] transition-colors truncate">
                            {displayName}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell className="py-3.5 px-4">
                        {guard.email ? (
                          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[220px]">
                              {guard.email}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">---</span>
                        )}
                      </TableCell>

                      <TableCell className="py-3.5 px-4">
                        {guard.phone_no ? (
                          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{guard.phone_no}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">---</span>
                        )}
                      </TableCell>

                      <TableCell className="py-3.5 px-4 text-center">
                        {formatStatusBadge(guard.status)}
                      </TableCell>

                      <TableCell className="py-3.5 px-6 text-center">
                        {formatAccountStatusBadge(guard.account_status)}
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

      {isAddGuardsOpen && (
        <SelectGuardsDialog
          isOpen={isAddGuardsOpen}
          onClose={() => setIsAddGuardsOpen(false)}
          onConfirm={handleAddGuards}
          initialSelectedIds={[]}
        />
      )}
    </Card>
  );
}
