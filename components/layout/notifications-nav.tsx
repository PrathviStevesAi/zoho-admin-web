"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, ChevronLeft, ChevronRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { Notification } from "@/types/notification.types";
import { markNotificationAsReadAction } from "@/actions/notification.actions";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { onMessageListener } from "@/lib/firebase";

export function NotificationsNav() {
  const { status } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const limit = 10;

  const loadNotifications = useCallback(async (page: number) => {
    console.log("[NotificationsNav] Attempting load, status:", status);
    if (status !== "authenticated") return;

    setLoading(true);
    console.log("[NotificationsNav] Fetching notifications...");
    try {
      const response = await fetch(`/api/notifications?page=${page}&t=${Date.now()}`);
      const res = await response.json();
      if (res.success) {
        // Sort: Unread (is_seen: false) first within the page
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

  // Initial load when the component mounts or when manually changing pages
  useEffect(() => {
    loadNotifications(currentPage);
  }, [loadNotifications, currentPage]);

  // Real-time updates via Firebase Cloud Messaging
  useEffect(() => {
    const unsubscribe = onMessageListener((payload: any) => {
      console.log("[NotificationsNav] FCM message received in foreground:", payload);
      // Refresh the first page to show the latest notification
      console.log("[NotificationsNav] Refreshing notifications list and count...");
      loadNotifications(1);
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [loadNotifications]);

  const hasMore = currentPage * limit < totalNotifications;
  const hasPrevious = currentPage > 1;

  const handleNextPage = () => {
    if (hasMore) loadNotifications(currentPage + 1);
  };

  const handlePreviousPage = () => {
    if (hasPrevious) loadNotifications(currentPage - 1);
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-[#474d56] hover:text-primary transition-colors h-10 w-10 rounded-full"
        >
          <Bell className="size-[22px] stroke-[1.5px]" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex items-center justify-center min-w-[19px] h-[19px] bg-[#ff4d4f] text-white text-[10px] font-bold rounded-full border-[1.5px] border-white shadow-sm">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[380px] p-0 mt-2 bg-card border-border shadow-xl rounded-sm animate-in fade-in-0 zoom-in-95"
      >
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <h3 className="font-semibold text-slate-700">Notifications</h3>
        </div>

        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
          {loading && notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No notifications yet.
            </div>
          ) : (
            <div className={cn("transition-opacity", loading && "opacity-50")}>
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 border-b border-border/40 last:border-0 hover:bg-slate-50/50 transition-colors flex gap-3",
                    !notification.is_seen && "bg-sky-50/10"
                  )}
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-[14px] font-bold text-[#0064cb] leading-tight cursor-pointer hover:underline">
                        <Link
                          href={notification.data?.shift_id ? `/notifications/view?shift_id=${notification.data.shift_id}` : `/notifications/view`}
                          onClick={() => {
                            if (!notification.is_seen) {
                              markNotificationAsReadAction(notification.id);
                            }
                          }}
                        >
                          {notification.title}
                        </Link>
                      </h4>
                    </div>
                    <p className="text-[13px] text-slate-500 leading-normal">
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-400">
                        {new Date(notification.created_at).toLocaleString("en-GB", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }).replace(",", "")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
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
                className="cursor-pointer text-[13px] text-[#0064cb] hover:text-[#0052ae] hover:bg-white font-semibold"
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
                className="cursor-pointer text-[13px] text-[#0064cb] hover:text-[#0052ae] hover:bg-white font-semibold"
              >
                See More
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
