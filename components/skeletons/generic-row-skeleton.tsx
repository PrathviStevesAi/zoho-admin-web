import { cn } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";
import { SkeletonColumn } from "@/types/skeleton.types";

export function GenericRowSkeleton({
  columns,
  className,
}: {
  columns: SkeletonColumn[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-4 items-center px-7 py-6 border-b border-border",
        className
      )}
      style={{
        gridTemplateColumns: columns.map(col => col.width || "1fr").join(" "),
      }}
    >
      {columns.map((col, i) => (
        <div
          key={i}
          className={cn(
            col.align === "right" && "flex justify-end",
            col.align === "center" && "flex justify-center"
          )}
        >
          <Skeleton className={cn(col.height || "h-4", "w-full")} />
        </div>
      ))}
    </div>
  );
}
