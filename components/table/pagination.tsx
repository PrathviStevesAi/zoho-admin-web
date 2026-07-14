"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  limit: number;
  onPageChange: (page: number) => void;
  isPending?: boolean;
}

export function Pagination({
  page,
  totalPages,
  totalItems,
  limit,
  onPageChange,
  isPending = false,
}: PaginationProps) {
  const activeTotalPages = Math.max(totalPages, 1);
  const activePage = page;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (activeTotalPages <= 5) {
      for (let i = 1; i <= activeTotalPages; i++) pages.push(i);
    } else {
      if (activePage <= 3) {
        pages.push(1, 2, 3, 4, "...", activeTotalPages);
      } else if (activePage >= activeTotalPages - 2) {
        pages.push(1, "...", activeTotalPages - 3, activeTotalPages - 2, activeTotalPages - 1, activeTotalPages);
      } else {
        pages.push(1, "...", activePage - 1, activePage, activePage + 1, "...", activeTotalPages);
      }
    }
    return pages;
  };

  const startItem = totalItems === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-border bg-card shrink-0 select-none">
      <div className="text-[13px] text-muted-foreground font-medium">
        Showing <span className="font-semibold text-foreground">{startItem}</span> to{" "}
        <span className="font-semibold text-foreground">{endItem}</span> of{" "}
        <span className="font-semibold text-foreground">{totalItems}</span> entries
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-md cursor-pointer disabled:cursor-not-allowed"
          onClick={() => onPageChange(activePage - 1)}
          disabled={activePage === 1 || isPending}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1 mx-1">
          {getPageNumbers().map((p, idx) => {
            if (p === "...") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="w-8 h-8 flex items-center justify-center text-muted-foreground text-sm"
                >
                  ...
                </span>
              );
            }
            const pageNum = p as number;
            return (
              <Button
                key={`page-${pageNum}`}
                variant={activePage === pageNum ? "primary" : "outline"}
                className={`h-8 w-8 p-0 text-sm font-semibold rounded-md transition-all ${activePage === pageNum
                    ? "shadow-sm shadow-primary/20 cursor-default"
                    : "hover:bg-slate-50 cursor-pointer"
                  }`}
                onClick={() => onPageChange(pageNum)}
                disabled={isPending || totalItems === 0}
              >
                {pageNum}
              </Button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-md cursor-pointer disabled:cursor-not-allowed"
          onClick={() => onPageChange(activePage + 1)}
          disabled={activePage >= activeTotalPages || isPending}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
