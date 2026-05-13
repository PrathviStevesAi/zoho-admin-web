"use client";

import { useSearchParams } from "next/navigation";
import { Pagination, Record } from "@/types/dashboard.types";
import { Loader2, Search } from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/table/data-table";
import { ExportButton } from "@/components/table/export-button";
import { invoiceSkeletonColumns } from "@/features/invoice/invoice.skeleton";
import { useInfiniteSearch } from "@/hooks/use-infinite-data";
import { fetchApprovedShiftAction } from "@/actions/dashboard.actions";
import { GenericRowSkeleton } from "@/components/skeletons/generic-row-skeleton";
import { precheckTableColumns } from "@/features/invoice/precheck.table";
import { useDashboard } from "../dashboard-context";

export default function Approved({ initialData, pagination }: { initialData: Record[]; pagination: Pagination }) {
  const searchParams = useSearchParams();
  const { isPending: isDashboardPending } = useDashboard();
  const dateFrom = searchParams.get("date_from") || "";
  const dateTo = searchParams.get("date_to") || "";

  const {
    displayedData,
    searchTerm,
    setSearchTerm,
    isPending,
    hasMore,
    isSearching,
    loadMoreRef
  } = useInfiniteSearch<Record>(
    initialData, 
    pagination, 
    fetchApprovedShiftAction,
    500,
    dateFrom,
    dateTo
  );

  return (
    <Card className="w-full h-[510px] border-border rounded-sm bg-card shadow-sm flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between px-7 py-2">
        <CardTitle className="text-[19px] font-bold shrink-0">Approved Shifts</CardTitle>
        
        <div className="flex-1 flex justify-center max-w-[240px] mx-auto">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="pl-9 h-10 w-full"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="text-sm font-medium text-slate-500">
            Total: <span className="text-slate-900 font-bold">{pagination.total}</span>
          </div>
          <ExportButton data={displayedData} columns={precheckTableColumns} fileName="Approved_Shifts" />
        </div>
      </CardHeader>

      <CardContent className="p-0 overflow-y-auto flex-1 custom-scrollbar">
        {(isPending && isSearching) || isDashboardPending ? (
          Array.from({ length: 5 }).map((_, i) => (
            <GenericRowSkeleton
              key={i}
              columns={invoiceSkeletonColumns}
            />
          ))
        ) : (
          <>
            <DataTable columns={precheckTableColumns} data={displayedData} emptyMessage="No shifts found." />
            {!isSearching && hasMore && (
              <div ref={loadMoreRef} className="py-6 flex justify-center">
                <Loader2 className="animate-spin text-primary" />
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
