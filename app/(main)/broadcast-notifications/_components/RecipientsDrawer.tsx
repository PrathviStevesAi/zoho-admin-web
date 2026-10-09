"use client";

import { useEffect, useState, useCallback } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Users,
  MapPin,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  fetchBroadcastRecipientsAction,
  BroadcastRecipientItem,
} from "@/actions/notification.actions";

interface RecipientsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messageId: string | null;
  messageSnippet?: string;
  initialTotalCount?: number;
}

export function RecipientsDrawer({
  isOpen,
  onClose,
  messageId,
  messageSnippet,
  initialTotalCount,
}: RecipientsDrawerProps) {
  const [recipients, setRecipients] = useState<BroadcastRecipientItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(initialTotalCount || 0);
  const limit = 20;

  const loadRecipients = useCallback(
    async (pageToLoad: number) => {
      if (!messageId) return;
      setIsLoading(true);
      try {
        const res = await fetchBroadcastRecipientsAction(messageId, pageToLoad, limit);
        if (res.success && Array.isArray(res.data)) {
          setRecipients(res.data);
          setTotalCount(res.pagination?.total ?? res.data.length);
          setCurrentPage(res.pagination?.page ?? pageToLoad);
        } else {
          setRecipients([]);
        }
      } catch (err) {
        console.error("Failed to load broadcast recipients:", err);
        setRecipients([]);
      } finally {
        setIsLoading(false);
      }
    },
    [messageId, limit]
  );

  useEffect(() => {
    if (isOpen && messageId) {
      setCurrentPage(1);
      if (typeof initialTotalCount === "number") {
        setTotalCount(initialTotalCount);
      }
      loadRecipients(1);
    } else {
      setRecipients([]);
    }
  }, [isOpen, messageId, initialTotalCount, loadRecipients]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  const startRecord = totalCount === 0 ? 0 : (currentPage - 1) * limit + 1;
  const endRecord = Math.min(currentPage * limit, totalCount);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  const getInitials = (name?: string) => {
    if (!name) return "GD";
    return (
      name
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "GD"
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      <div
        className="fixed inset-0 bg-slate-900/30 transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-8">
        <div className="w-screen max-w-md sm:max-w-[460px] bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-300">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                Recipients{" "}
                <span className="text-[#0064cb]">
                  ({totalCount} {totalCount === 1 ? "Guard" : "Guards"})
                </span>
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-3 divide-y divide-slate-100">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={`skel-${i}`} className="py-3.5 flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-3 w-28 shrink-0 hidden sm:block" />
                </div>
              ))
            ) : recipients.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16 px-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                  <Users className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">
                  No recipients found
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  There are no guard recipient records available for this broadcast message.
                </p>
              </div>
            ) : (
              recipients.map((guard, idx) => {
                const initials = getInitials(guard.name);
                return (
                  <div
                    key={guard.id || `recipient-${idx}`}
                    className="py-3.5 flex items-center gap-3 hover:bg-slate-50/70 -mx-2 px-2 rounded-xl transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-[#0064cb] border border-blue-100 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                      {initials}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-[13px] font-bold text-slate-900 truncate group-hover:text-[#0064cb] transition-colors">
                          {guard.name || "Guard"}
                        </h4>
                        {guard.address && (
                          <span
                            className="text-[11px] text-slate-400 font-medium truncate max-w-[170px] text-right hidden sm:inline-block"
                            title={guard.address}
                          >
                            {guard.address}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p className="text-xs text-slate-500 truncate font-normal">
                          {guard.email || "-"}
                        </p>
                        {guard.address && (
                          <span
                            className="text-[11px] text-slate-400 font-medium truncate sm:hidden flex items-center gap-1"
                            title={guard.address}
                          >
                            <MapPin className="w-3 h-3 shrink-0" />
                            {guard.address}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {!isLoading && totalCount > 0 && (
            <div className="px-6 py-4 border-t border-slate-100 bg-white shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="text-xs text-slate-500 font-medium">
                Showing <span className="font-bold text-slate-700">{startRecord}</span> to{" "}
                <span className="font-bold text-slate-700">{endRecord}</span> of{" "}
                <span className="font-bold text-slate-700">{totalCount}</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => {
                    const next = Math.max(1, currentPage - 1);
                    setCurrentPage(next);
                    loadRecipients(next);
                  }}
                  className="w-7 h-7 flex items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {getPageNumbers().map((pageNum, pIdx) => {
                  if (pageNum === "...") {
                    return (
                      <span
                        key={`dots-${pIdx}`}
                        className="w-7 h-7 flex items-center justify-center text-slate-400 font-bold tracking-widest select-none text-xs"
                      >
                        ...
                      </span>
                    );
                  }
                  const isCurrent = pageNum === currentPage;
                  return (
                    <button
                      key={`page-${pageNum}`}
                      type="button"
                      onClick={() => {
                        const next = Number(pageNum);
                        setCurrentPage(next);
                        loadRecipients(next);
                      }}
                      className={cn(
                        "w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold transition-all duration-200 cursor-pointer",
                        isCurrent
                          ? "bg-[#0064cb] text-white border border-[#0064cb] shadow-sm shadow-blue-200/50"
                          : "border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => {
                    const next = Math.min(totalPages, currentPage + 1);
                    setCurrentPage(next);
                    loadRecipients(next);
                  }}
                  className="w-7 h-7 flex items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
