"use client";

import { useEffect } from "react";

import { useSearchParams } from "next/navigation";
import { Pagination, Record } from "@/types/dashboard.types";
import { Loader2, Search } from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/table/data-table";
import { ExportButton } from "@/components/table/export-button";
import { invoiceSkeletonColumns } from "@/features/invoice/invoice.skeleton";
import { useInfiniteSearch } from "@/hooks/use-infinite-data";
import { clientFetchFinishedShiftAction } from "@/lib/client-actions";
import { GenericRowSkeleton } from "@/components/skeletons/generic-row-skeleton";
import { precheckTableColumns } from "@/features/invoice/precheck.table";
import { useDashboard } from "../dashboard-context";
import { Pagination as PaginationComponent } from "@/components/table/pagination";

export default function Finished({ initialData, pagination }: { initialData: Record[]; pagination: Pagination }) {
  const searchParams = useSearchParams();
  const { isPending: isDashboardPending, setIsFetching } = useDashboard();
  const dateFrom = searchParams.get("date_from") || "";
  const dateTo = searchParams.get("date_to") || "";

  const {
    displayedData,
    searchTerm,
    setSearchTerm,
    isPending,
    page,
    totalPages,
    total,
    limit,
    goToPage,
  } = useInfiniteSearch<Record>(
    initialData,
    pagination,
    clientFetchFinishedShiftAction,
    500,
    dateFrom,
    dateTo
  );


  useEffect(() => {
    if (setIsFetching) setIsFetching(isPending);
  }, [isPending, setIsFetching]);

  return (
    <Card className="w-full h-[510px] border-border rounded-sm bg-card shadow-sm flex flex-col gap-2">
      <CardHeader className="flex flex-row items-center justify-between px-7 py-2">
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <CardTitle className="text-[19px] font-bold shrink-0">Finished Shifts</CardTitle>
            <span className="text-xs text-gray-500 font-normal">( Need approval )</span>
          </div>
          <span className="text-[19px] text-slate-900">
            [ {total} ]
          </span>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="relative w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="pl-9 h-10 w-full"
            />
          </div>
          <ExportButton data={displayedData} columns={precheckTableColumns} fileName="Finished_Shifts" />
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1 flex flex-col min-h-0">
        {isPending || isDashboardPending ? (
          Array.from({ length: 5 }).map((_, i) => (
            <GenericRowSkeleton
              key={i}
              columns={invoiceSkeletonColumns}
            />
          ))
        ) : (
          <DataTable columns={precheckTableColumns} data={displayedData} emptyMessage="No shifts found." />
        )}
      </CardContent>
      <PaginationComponent
        page={page}
        totalPages={totalPages}
        totalItems={total}
        limit={limit}
        onPageChange={goToPage}
        isPending={isPending}
      />
    </Card>
  );
}
