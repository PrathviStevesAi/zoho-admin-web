"use client";

import { useState, useEffect, useTransition, useCallback, useRef } from "react";
import { toast } from "sonner";
import useDebounceValue from "@/hooks/use-debounce";
import { FetchResponse, Pagination } from "@/types/dashboard.types";

export function useInfiniteSearch<T>(
  initialData: T[],
  pagination: Pagination,
  fetchAction: (
    page: number,
    query?: string,
    date_from?: string,
    date_to?: string,
  ) => Promise<FetchResponse<T>>,
  debounceMs: number = 500,
  date_from: string = "",
  date_to: string = "",
) {
  const [data, setData] = useState<T[]>(initialData);
  const [page, setPage] = useState(pagination.page);
  const [totalPages, setTotalPages] = useState(pagination.total_pages);
  const [total, setTotal] = useState(pagination.total);
  const [limit, setLimit] = useState(pagination.limit);

  // Sync state when initial props change (e.g. on filter change)
  useEffect(() => {
    setData(initialData);
    setPage(pagination.page);
    setTotalPages(pagination.total_pages);
    setTotal(pagination.total);
    setLimit(pagination.limit);
  }, [initialData, pagination]);

  const [searchTerm, setSearchTerm] = useState("");
  const [isPending, startTransition] = useTransition();
  const debouncedValue = useDebounceValue(searchTerm, debounceMs);

  const prevSearchTerm = useRef(debouncedValue);

  // Search Logic
  useEffect(() => {
    // Only fetch if the search term actually changed. 
    // This skips the initial mount (allowing true parallel server loading)
    // and ignores changes to date_from/date_to (which are handled by the server component).
    if (prevSearchTerm.current === debouncedValue) {
      return;
    }
    prevSearchTerm.current = debouncedValue;

    startTransition(async () => {
      const res = await fetchAction(1, debouncedValue, date_from, date_to);
      if (res.success && res.data && res.pagination) {
        setData(res.data);
        setPage(1);
        setTotalPages(res.pagination.total_pages);
        setTotal(res.pagination.total);
        setLimit(res.pagination.limit);
      } else if (!res.success) {
        toast.error(res.error || "Failed to fetch search results");
      }
    });
  }, [debouncedValue, fetchAction, date_from, date_to]);

  // Go to page
  const goToPage = useCallback(async (p: number) => {
    if (p < 1 || p > totalPages || isPending) return;

    startTransition(async () => {
      const res = await fetchAction(p, debouncedValue, date_from, date_to);
      if (res.success && res.data && res.pagination) {
        setData(res.data);
        setPage(p);
        setTotalPages(res.pagination.total_pages);
        setTotal(res.pagination.total);
        setLimit(res.pagination.limit);
      } else if (!res.success) {
        toast.error(res.error || "Failed to fetch page");
      }
    });
  }, [totalPages, isPending, fetchAction, debouncedValue, date_from, date_to]);

  return {
    displayedData: data,
    searchTerm,
    setSearchTerm,
    isPending,
    page,
    totalPages,
    total,
    limit,
    goToPage,
    nextPage: () => goToPage(page + 1),
    prevPage: () => goToPage(page - 1),
  };
}
