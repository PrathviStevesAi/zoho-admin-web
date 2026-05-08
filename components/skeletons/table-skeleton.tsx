import { SkeletonColumn } from "@/types/skeleton.types";
import { Skeleton } from "../ui/skeleton";
import { GenericRowSkeleton } from "./generic-row-skeleton";

type TableSkeletonProps = {
  columns: SkeletonColumn[];
  rows?: number;
  showHeader?: boolean;
  showFooter?: boolean;
};

export function TableSkeleton({
  columns,
  rows = 5,
  showHeader = true,
}: TableSkeletonProps) {
  return (
    <div className="w-full h-[510px] border border-border rounded-sm bg-card overflow-hidden shadow-sm flex flex-col">

      {showHeader && (
        <div className="flex items-center justify-between px-7 py-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-9 w-48 rounded-xl" />
        </div>
      )}

      <div
        className="grid gap-4 px-7 py-3.5 bg-muted"
        style={{
          gridTemplateColumns: columns.map(col => col.width || "1fr").join(" "),
        }}
      >
        {columns.map((_, i) => (
          <Skeleton key={i} className="h-3 w-16" />
        ))}
      </div>

      <div className="h-[320px] overflow-hidden">
        {Array.from({ length: rows }).map((_, i) => (
          <GenericRowSkeleton key={i} columns={columns} />
        ))}
      </div>
    </div>
  );
}
