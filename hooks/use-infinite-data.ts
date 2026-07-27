"use client";

import { useState, useEffect, useTransition, useCallback, useRef } from "react";
import { toast } from "sonner";
import useDebounceValue from "@/hooks/use-debounce";
import { FetchResponse, Pagination } from "@/types/dashboard.types";
import { useDashboard } from "@/app/(main)/dashboard/dashboard-context";

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

  let isInitialLoading = false;
  let dashboardFailed = false;
  try {
    const dashboardContext = useDashboard();
    isInitialLoading = dashboardContext.isInitialLoading;
    dashboardFailed = dashboardContext.dashboardFailed;
  } catch (error) {
    // Fallback if context is not available
  }

  useEffect(() => {
    if (initialData && initialData.length > 0) {
      setData(initialData);
      setPage(pagination.page);
      setTotalPages(pagination.total_pages);
      setTotal(pagination.total);
      setLimit(pagination.limit);
    }
  }, [initialData, pagination]);

  const [searchTerm, setSearchTerm] = useState("");
  const [isPending, startTransition] = useTransition();
  const debouncedValue = useDebounceValue(searchTerm, debounceMs);

  const prevSearchTerm = useRef(debouncedValue);
  const prevDateFrom = useRef(date_from);
  const prevDateTo = useRef(date_to);

  const hasFetchedInitial = useRef(false);

  useEffect(() => {
    const isInitialEmpty = initialData.length === 0 && page === 1;
    // Only fetch initial fallback if dashboard has finished loading AND failed
    const shouldFetchInitial = isInitialEmpty && !isInitialLoading && dashboardFailed && !hasFetchedInitial.current;

    const hasFiltersChanged =
      prevSearchTerm.current !== debouncedValue ||
      prevDateFrom.current !== date_from ||
      prevDateTo.current !== date_to;

    if (!hasFiltersChanged && !shouldFetchInitial) {
      return;
    }


    prevSearchTerm.current = debouncedValue;
    prevDateFrom.current = date_from;
    prevDateTo.current = date_to;
    if (shouldFetchInitial) hasFetchedInitial.current = true;

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
  }, [
    debouncedValue,
    fetchAction,
    date_from,
    date_to,
    initialData.length,
    page,
    isInitialLoading,
    dashboardFailed,
  ]);

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
