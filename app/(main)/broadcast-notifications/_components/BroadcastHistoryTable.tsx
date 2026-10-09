"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Smartphone,
  MessageSquare,
  Layers,
  ChevronLeft,
  ChevronRight,
  History,
  Send,
  Users,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  fetchBroadcastHistoryAction,
  BroadcastHistoryItem,
} from "@/actions/notification.actions";
import { RecipientsDrawer } from "./RecipientsDrawer";

interface BroadcastHistoryTableProps {
  onComposeNew?: () => void;
  onTotalCountChange?: (count: number) => void;
}

export function BroadcastHistoryTable({
  onComposeNew,
  onTotalCountChange,
}: BroadcastHistoryTableProps) {
  const [historyList, setHistoryList] = useState<BroadcastHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedMessageForRecipients, setSelectedMessageForRecipients] = useState<BroadcastHistoryItem | null>(null);
  const limit = 20;

  const loadHistory = useCallback(
    async (pageToLoad: number) => {
      setIsLoading(true);
      try {
        const res = await fetchBroadcastHistoryAction(pageToLoad, limit);
        if (res.success && Array.isArray(res.data)) {
          setHistoryList(res.data);
          const total = res.pagination?.total ?? res.data.length;
          setTotalCount(total);
          setCurrentPage(res.pagination?.page ?? pageToLoad);
          if (onTotalCountChange) {
            onTotalCountChange(total);
          }
        } else {
          setHistoryList([]);
        }
      } catch (err) {
        console.error("Failed to load broadcast history:", err);
        setHistoryList([]);
      } finally {
        setIsLoading(false);
      }
    },
    [limit, onTotalCountChange]
  );

  useEffect(() => {
    loadHistory(currentPage);
  }, [loadHistory, currentPage]);

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr || "-";
    }
  };

  const renderSourceBadge = (source: string) => {
    const s = String(source || "").toLowerCase();
    if (s === "in_app" || s === "app") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#0064cb] border border-blue-100">
          <Smartphone className="w-3.5 h-3.5" />
          <span>In-App</span>
        </span>
      );
    }
    if (s === "sms") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Twilio SMS</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-100">
        <Layers className="w-3.5 h-3.5" />
        <span>In-App &amp; SMS</span>
      </span>
    );
  };

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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4.5 border-b border-slate-100 bg-white">
        <div>
          <h3 className="text-base font-bold text-slate-900">Broadcast History</h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Logs of all sent announcements, delivery, and total recipient reach.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="hover:bg-transparent border-y border-slate-200 bg-slate-100/70">
              <TableHead className="w-12 text-center text-slate-700 font-bold text-[11px] uppercase tracking-wider py-3.5 px-3">
                No.
              </TableHead>
              <TableHead className="text-slate-700 font-bold text-[11px] uppercase tracking-wider py-3.5 px-3">
                Message
              </TableHead>
              <TableHead className="text-slate-700 font-bold text-[11px] uppercase tracking-wider py-3.5 px-3 w-[150px]">
                Sent By
              </TableHead>
              <TableHead className="text-slate-700 font-bold text-[11px] uppercase tracking-wider py-3.5 px-3 w-[110px]">
                Date
              </TableHead>
              <TableHead className="text-slate-700 font-bold text-[11px] uppercase tracking-wider py-3.5 px-3 w-[110px]">
                Source
              </TableHead>
              <TableHead className="text-slate-700 font-bold text-[11px] uppercase tracking-wider py-3.5 px-3 w-[130px]">
                Recipients
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="[&_tr:last-child]:border-b-0">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`} className="border-b border-slate-100">
                  <TableCell className="px-3 py-3.5 text-center">
                    <Skeleton className="h-4 w-6 mx-auto" />
                  </TableCell>
                  <TableCell className="px-3 py-3.5">
                    <Skeleton className="h-4 w-44" />
                  </TableCell>
                  <TableCell className="px-3 py-3.5">
                    <div className="flex items-center gap-2">
                      <Skeleton className="w-7 h-7 rounded-full" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </TableCell>
                  <TableCell className="px-3 py-3.5">
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell className="px-3 py-3.5">
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </TableCell>
                  <TableCell className="px-3 py-3.5">
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : historyList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center gap-3 py-10 max-w-sm mx-auto">
                    <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                      <History className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-slate-800">
                        No broadcast messages found
                      </h4>
                      <p className="text-xs text-slate-500">
                        Announcements you send to guards will appear here with delivery details.
                      </p>
                    </div>
                    {onComposeNew && (
                      <Button
                        type="button"
                        onClick={onComposeNew}
                        size="sm"
                        className="mt-2 bg-[#0064cb] hover:bg-[#0052ae] text-white font-bold text-xs rounded-xl flex items-center gap-2 px-4 shadow-sm cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Compose First Message
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              historyList.map((item, idx) => {
                const rowNumber = (currentPage - 1) * limit + idx + 1;
                const formattedDate = formatDate(item.send_at);
                const rawSender =
                  typeof item.sent_by === "string"
                    ? item.sent_by.replace(/\s+/g, " ").trim()
                    : typeof item.sent_by === "object" && item.sent_by?.name
                      ? String(item.sent_by.name).replace(/\s+/g, " ").trim()
                      : "Admin";
                const senderName = rawSender || "Admin";
                const initials =
                  senderName
                    .split(" ")
                    .filter(Boolean)
                    .map((n: string) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase() || "AD";

                return (
                  <TableRow
                    key={item.id || `history-${idx}`}
                    className="hover:bg-slate-50/70 border-b border-slate-100 transition-colors group"
                  >
                    <TableCell className="text-center text-sm font-semibold text-slate-500 py-3.5 px-3 w-12">
                      {rowNumber}
                    </TableCell>

                    <TableCell className="py-3.5 px-3 min-w-0">
                      <div className="max-w-[180px] sm:max-w-[220px] md:max-w-[260px] lg:max-w-[300px]">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="text-[13px] font-bold text-slate-900 group-hover:text-[#0064cb] transition-colors truncate block cursor-pointer">
                              {item.message}
                            </p>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            align="start"
                            className="max-w-md px-3.5 py-2.5 bg-slate-900 text-white rounded-md shadow-xl text-xs leading-relaxed whitespace-pre-wrap font-medium break-words z-50 border border-slate-800"
                          >
                            {item.message}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>

                    <TableCell className="py-3.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-[#0064cb] border border-blue-200 flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                          {initials}
                        </div>
                        <span className="text-[13px] font-bold text-slate-800 whitespace-nowrap">
                          {senderName}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="py-3.5 px-3 whitespace-nowrap">
                      <span className="text-xs font-bold text-slate-800">
                        {formattedDate}
                      </span>
                    </TableCell>

                    <TableCell className="py-3.5 px-3 whitespace-nowrap">
                      {renderSourceBadge(item.source)}
                    </TableCell>

                    <TableCell className="py-3.5 px-3 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedMessageForRecipients(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50/80 hover:bg-blue-100 text-[#0064cb] border border-blue-100 transition-colors cursor-pointer"
                        title="View recipient guards"
                      >
                        <Users className="w-3.5 h-3.5 text-[#0064cb]" />
                        {Number(item.recipients_count ?? 0).toLocaleString()} Guards
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {!isLoading && totalCount > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-slate-200 bg-white text-xs">
          <div className="text-sm font-medium text-slate-500">
            Showing <span className="font-bold text-slate-700">{startRecord}</span> to{" "}
            <span className="font-bold text-slate-700">{endRecord}</span> of{" "}
            <span className="font-bold text-slate-700">{totalCount}</span> entries
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {getPageNumbers().map((pageNum, pIdx) => {
              if (pageNum === "...") {
                return (
                  <span
                    key={`ellipsis-${pIdx}`}
                    className="w-8 h-8 flex items-center justify-center text-slate-400 font-bold tracking-widest select-none"
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
                  onClick={() => setCurrentPage(Number(pageNum))}
                  className={cn(
                    "w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold transition-all duration-200 cursor-pointer",
                    isCurrent
                      ? "bg-[#0064cb] text-white border border-[#0064cb] shadow-md shadow-blue-200/50"
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
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <RecipientsDrawer
        isOpen={!!selectedMessageForRecipients}
        onClose={() => setSelectedMessageForRecipients(null)}
        messageId={selectedMessageForRecipients?.id || null}
        messageSnippet={selectedMessageForRecipients?.message}
        initialTotalCount={selectedMessageForRecipients?.recipients_count}
      />
    </div>
  );
}
