"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Bell, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "next-auth/react";
import { Notification } from "@/types/notification.types";
import { markNotificationAsReadAction } from "@/actions/notification.actions";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { onMessageListener } from "@/lib/firebase";

const formatHeaderDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  } catch (e) {
    return dateStr;
  }
};

export function NotificationsNav({ priority = "normal" }: { priority?: "normal" | "critical" }) {
  const { status } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [open, setOpen] = useState(false);
  const limit = 10;
  const loadRef = useRef<((page: number) => Promise<void>) | null>(null);

  const fetchCount = useCallback(async () => {
    if (status !== "authenticated") return;
    try {
      const response = await fetch(`/api/notifications?count_only=true`);
      const res = await response.json();
      if (res.success && res.data) {
        setUnreadCount(priority === "normal" ? res.data.normal : res.data.critical);
      }
    } catch (error) {
      console.error("Error loading notification count:", error);
    }
  }, [status, priority]);

  const loadNotifications = useCallback(async (page: number) => {
    console.log("[NotificationsNav] Attempting load, status:", status);
    if (status !== "authenticated") return;

    setLoading(true);
    console.log(`[NotificationsNav] Fetching ${priority} notifications...`);
    try {
      const response = await fetch(`/api/notifications?page=${page}&priority=${priority}&count_only=false`);
      const res = await response.json();
      if (res.success) {
        const sorted = [...res.data].sort((a, b) => {
          if (a.is_seen === b.is_seen) return 0;
          return a.is_seen ? 1 : -1;
        });
        setNotifications(sorted);
        setUnreadCount(res.unread_count);
        setTotalNotifications(res.pagination.total);
        setCurrentPage(res.pagination.page);
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
    setLoading(false);
  }, [status]);

  useEffect(() => {
    loadRef.current = loadNotifications;
  }, [loadNotifications]);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  useEffect(() => {
    const handleFCMMessage = (payload: any) => {
      if (payload?._focusRefresh) return;
      console.log("[NotificationsNav] FCM message received in foreground:", payload);
      console.log("[NotificationsNav] Refreshing notifications list and count...");
      if (loadRef.current) {
        loadRef.current(1);
      }
    };

    const unsubscribe = onMessageListener(handleFCMMessage);
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const hasMore = currentPage * limit < totalNotifications;
  const hasPrevious = currentPage > 1;

  const handleNextPage = () => {
    if (hasMore) loadNotifications(currentPage + 1);
  };

  const handlePreviousPage = () => {
    if (hasPrevious) loadNotifications(currentPage - 1);
  };

  const dates = Array.from(new Set(notifications.map((n) => formatHeaderDate(n.created_at))));

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          onClick={() => loadNotifications(1)}
          className="relative transition-colors h-10 w-10 p-0 flex items-center justify-center rounded-[10px] border border-slate-200 cursor-pointer outline-none hover:bg-slate-50 shrink-0"
        >
          {priority === "normal" ? (
            <Bell className="size-[20px] stroke-[2px] text-[#0064cb]" />
          ) : (
            <AlertTriangle className="size-[20px] stroke-[2px] text-[#e11d48]" />
          )}
          {unreadCount > 0 && (
            <span className={cn(
              "absolute -top-2 -right-2 flex items-center justify-center min-w-[20px] px-1 h-[20px] text-white text-[11px] font-bold rounded-full shadow-sm z-10",
              priority === "normal" ? "bg-[#0064cb]" : "bg-[#e11d48]"
            )}>
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="center"
        collisionPadding={16}
        className="w-[calc(100vw-32px)] sm:w-[380px] p-0 mt-2 bg-card border-border shadow-xl rounded-sm animate-in fade-in-0 zoom-in-95"
      >
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <h3 className="font-semibold text-slate-700">
            {priority === "normal" ? "Normal Notifications" : "Critical Notifications"}
          </h3>
        </div>

        <div className="max-h-[400px] overflow-y-auto custom-scrollbar bg-[#f8fafc] p-3">
          {loading && notifications.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] p-3 flex gap-3 relative overflow-hidden">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4 rounded-sm" />
                    <Skeleton className="h-3 w-full rounded-sm" />
                    <Skeleton className="h-3 w-5/6 rounded-sm" />
                    <div className="pt-2">
                      <Skeleton className="h-3 w-1/4 rounded-sm" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No notifications yet.
            </div>
          ) : (
            <div className={cn("transition-opacity space-y-4", loading && "opacity-50")}>
              {dates.map((dateKey) => {
                const group = notifications.filter((n) => formatHeaderDate(n.created_at) === dateKey);
                return (
                  <div key={dateKey} className="space-y-2">
                    <div className="text-[12px] font-bold text-black">
                      {dateKey}
                    </div>
                    <div className="space-y-3">
                      {group.map((notification) => {
                        const isUnread = !notification.is_seen;
                        return (
                          <div
                            key={notification.id}
                            className={cn(
                              "bg-white rounded-l-lg rounded-r-none border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] p-3 flex gap-3 relative transition-all duration-200 overflow-hidden",
                              isUnread
                                ? priority === "normal" ? "border-l-[4px] border-l-[#0064cb]" : "border-l-[4px] border-l-[#e11d48]"
                                : "border-l-[4px] border-l-transparent"
                            )}
                          >
                            <div className="flex-1 space-y-1">
                              <div className="flex items-start justify-between gap-2">
                                <h4
                                  className={cn(
                                    "text-[14px] leading-tight cursor-pointer hover:underline",
                                    isUnread
                                      ? priority === "normal" ? "font-bold text-[#0064cb]" : "font-bold text-[#e11d48]"
                                      : "font-medium text-slate-400"
                                  )}
                                >
                                  <Link
                                    href={
                                      notification.data?.view === "shift_invoice_view" && notification.data?.invoice_id
                                        ? `/invoices/${notification.data.invoice_id}?notification_id=${notification.id}`
                                        : notification.data?.shift_id
                                          ? `/notifications/view?shift_id=${notification.data.shift_id}&notification_id=${notification.id}`
                                          : `/notifications/view`
                                    }
                                    onClick={() => {
                                      if (isUnread) {
                                        markNotificationAsReadAction(notification.id);
                                      }
                                      setOpen(false);
                                    }}
                                  >
                                    {notification.title}
                                  </Link>
                                </h4>
                              </div>
                              <p
                                className={cn(
                                  "text-[13px] leading-normal",
                                  isUnread ? "text-slate-800" : "text-slate-400"
                                )}
                              >
                                {notification.message}
                              </p>
                              <div className="flex items-center justify-between pt-1">
                                <span
                                  className={cn(
                                    "text-[11px]",
                                    isUnread ? "text-slate-700" : "text-slate-400"
                                  )}
                                >
                                  {new Date(notification.created_at)
                                    .toLocaleString("en-GB", {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                    .replace(",", "")}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {(hasMore || hasPrevious) && (
          <div className="p-3 border-t border-border/50 flex items-center justify-center gap-4 bg-slate-50/50">
            {hasPrevious && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePreviousPage}
                className={cn(
                  "cursor-pointer text-[13px] hover:bg-white font-semibold",
                  priority === "normal" ? "text-[#0064cb] hover:text-[#0052ae]" : "text-[#e11d48] hover:text-[#be123c]"
                )}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
            )}
            {hasMore && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNextPage}
                className={cn(
                  "cursor-pointer text-[13px] hover:bg-white font-semibold",
                  priority === "normal" ? "text-[#0064cb] hover:text-[#0052ae]" : "text-[#e11d48] hover:text-[#be123c]"
                )}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
