"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchNotificationsAction } from "@/actions/notification.actions";
import { Notification } from "@/types/notification.types";
import { cn } from "@/lib/utils";
import { Bell, ChevronLeft, ChevronRight, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const limit = 10;

  const loadNotifications = useCallback(async (page: number) => {
    setLoading(true);
    const res = await fetchNotificationsAction(page);
    if (res.success) {
      setNotifications(res.data);
      setTotalNotifications(res.pagination.total);
      setCurrentPage(res.pagination.page);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadNotifications(1);
  }, [loadNotifications]);

  const totalPages = Math.ceil(totalNotifications / limit);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <Bell className="w-8 h-8 text-primary" />
          Notifications
        </h1>
        <div className="text-sm text-slate-800">
          Showing {notifications.length} of {totalNotifications} notifications
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-100 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-600">No notifications yet</h3>
            <p className="text-slate-700">When you get notifications, they'll show up here.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {notifications.map((notification, index) => (
              <div
                key={notification.id}
                className={cn(
                  "p-6 flex gap-4 transition-colors hover:bg-slate-50",
                  index !== notifications.length - 1 && "border-b border-slate-100",
                  !notification.is_seen && "bg-blue-50/30"
                )}
              >
                <div className={cn(
                  "mt-1 p-2 rounded-full",
                  !notification.is_seen ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-700"
                )}>
                  {notification.is_seen ? <CheckCircle2 className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800">
                        <Link
                          href={
                            notification.data?.view === "shift_invoice_view" && notification.data?.invoice_id
                              ? `/invoices/${notification.data.invoice_id}?notification_id=${notification.id}`
                              : notification.data?.shift_id
                              ? `/notifications/view?shift_id=${notification.data.shift_id}&notification_id=${notification.id}`
                              : `/notifications/view`
                          }
                          className="hover:text-primary transition-colors"
                        >
                          {notification.title}
                        </Link>
                      </h3>
                      <p className="text-slate-600 leading-relaxed">
                        {notification.message}
                      </p>
                    </div>
                    <div className="text-right text-sm text-slate-700 flex items-center gap-1 whitespace-nowrap">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(notification.created_at).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  {notification.data?.view === "shift_invoice_view" && notification.data?.invoice_id ? (
                    <div className="pt-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/invoices/${notification.data.invoice_id}?notification_id=${notification.id}`}>
                          View Invoice Details
                        </Link>
                      </Button>
                    </div>
                  ) : notification.data?.shift_id ? (
                    <div className="pt-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link
                          href={`/notifications/view?shift_id=${notification.data.shift_id}&notification_id=${notification.id}`}
                        >
                          View Shift Details
                        </Link>
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === 1}
              onClick={() => loadNotifications(currentPage - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="text-sm font-medium text-slate-600 mx-2">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === totalPages}
              onClick={() => loadNotifications(currentPage + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
