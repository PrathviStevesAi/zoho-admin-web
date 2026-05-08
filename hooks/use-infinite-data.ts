"use client";

import { useState, useEffect, useTransition, useRef, useCallback } from "react";
import { toast } from "sonner";
import useDebounceValue from "@/hooks/use-debounce";
import { FetchResponse } from "@/types/dashboard.types";

interface PaginationBase {
  page: number;
  total_pages: number;
}

export function useInfiniteSearch<T>(
  initialData: T[],
  pagination: PaginationBase,
  fetchAction: (
    page: number,
    query?: string,
    status?: string,
  ) => Promise<FetchResponse<T>>,
  debounceMs: number = 500,
) {
  const [data, setData] = useState<T[]>(initialData);
  const [searchResults, setSearchResults] = useState<T[]>([]);
  const [page, setPage] = useState(pagination.page);
  const [hasMore, setHasMore] = useState(
    pagination.page < pagination.total_pages,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [isPending, startTransition] = useTransition();
  const debouncedValue = useDebounceValue(searchTerm, debounceMs);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);
  const isSearching = !!debouncedValue;

  // Load More Logic
  const loadMore = useCallback(async () => {
    if (isPending || !hasMore || isSearching || loadingRef.current) return;

    const nextPage = page + 1;
    loadingRef.current = true;

    startTransition(async () => {
      const res = await fetchAction(nextPage, debouncedValue);
      if (!res.success) {
        toast.error(res.error);
      } else if (res?.data && res.pagination) {
        setData((prev) => [...prev, ...res.data]);
        setPage(nextPage);
        setHasMore(nextPage < res.pagination.total_pages);
      }
      loadingRef.current = false;
    });
  }, [isPending, hasMore, isSearching, page, debouncedValue, fetchAction]);

  // Search Logic
  useEffect(() => {
    if (!debouncedValue) {
      setSearchResults([]);
      return;
    }

    startTransition(async () => {
      const res = await fetchAction(1, debouncedValue);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      setSearchResults(res.data);
    });
  }, [debouncedValue, fetchAction]);

  // Observer Logic
  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "100px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [loadMore]);

  return {
    displayedData: isSearching ? searchResults : data,
    searchTerm,
    setSearchTerm,
    isPending,
    hasMore,
    isSearching,
    loadMoreRef,
  };
}
