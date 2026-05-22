"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchNotificationByIdAction, markNotificationAsReadAction } from "@/actions/notification.actions";
import { Notification } from "@/types/notification.types";
import { Button } from "@/components/ui/button";
import { 
  ChevronRight, 
  ArrowLeft, 
  Bell, 
  Clock, 
  Info, 
  CheckCircle2, 
  Trash2, 
  Archive, 
  ExternalLink,
  Edit2,
  MapPin
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export default function NotificationDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [notification, setNotification] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNotification() {
      if (!id) return;
      setLoading(true);
      const res = await fetchNotificationByIdAction(id as string);
      if (res.success && res.data) {
        setNotification(res.data);
        if (!res.data.is_seen) {
          markNotificationAsReadAction(id as string);
        }
      }
      setLoading(false);
    }
    loadNotification();
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 max-w-[1600px] mx-auto space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-20 bg-slate-100 rounded-xl w-full" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 h-96 bg-slate-50 rounded-2xl" />
            <div className="lg:col-span-4 h-96 bg-slate-50 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!notification) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center space-y-4">
        <Info className="w-16 h-16 text-slate-300 mx-auto" />
        <h2 className="text-2xl font-bold text-slate-800">Notification not found</h2>
        <p className="text-slate-800">The notification you're looking for doesn't exist.</p>
        <Button asChild>
          <Link href="/notifications">Back to Notifications</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Breadcrumbs & Header */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-slate-700 text-[13px] mb-1">
              <Link href="/dashboard" className="hover:text-[#0064cb] transition-colors">Dashboard</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link href="/notifications" className="hover:text-[#0064cb] transition-colors">Notifications</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-slate-600 font-medium">Details</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/notifications" className="p-2 bg-white rounded-lg border border-slate-200 text-slate-700 hover:text-[#0064cb] transition-all">
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <h1 className="text-2xl font-bold text-slate-900 transition-all">
                Notification Details <span className="text-slate-700 font-normal ml-2">#{notification.id.slice(0, 8)}</span>
              </h1>
            </div>
          </div>
        </div>

        {/* Action Icons - Static as requested */}
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 py-4">
          <div className="flex flex-col items-center gap-1.5 group cursor-pointer">
            <div className="w-12 h-12 rounded-full border-2 border-emerald-500 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-50 transition-colors shadow-sm">
              <CheckCircle2 className="w-5.5 h-5.5" />
            </div>
            <span className="text-[10px] font-bold text-slate-600 uppercase text-center leading-[1.2] tracking-tight">Mark as<br />read</span>
          </div>

          <div className="flex flex-col items-center gap-1.5 group cursor-pointer">
            <div className="w-12 h-12 rounded-full border-2 border-[#0064cb] flex items-center justify-center text-[#0064cb] group-hover:bg-blue-50 transition-colors shadow-sm">
              <Archive className="w-5.5 h-5.5" />
            </div>
            <span className="text-[10px] font-bold text-slate-600 uppercase text-center leading-[1.2] tracking-tight">Archive<br />Notification</span>
          </div>

          {notification.data?.shift_id && (
            <Link href={`/notifications/view?shift_id=${notification.data.shift_id}&notification_id=${notification.id}`} className="flex flex-col items-center gap-1.5 group cursor-pointer">
              <div className="w-12 h-12 rounded-full border-2 border-orange-500 flex items-center justify-center text-orange-500 group-hover:bg-orange-50 transition-colors shadow-sm">
                <ExternalLink className="w-5.5 h-5.5" />
              </div>
              <span className="text-[10px] font-bold text-slate-600 uppercase text-center leading-[1.2] tracking-tight">View Related<br />Shift</span>
            </Link>
          )}

          <div className="flex flex-col items-center gap-1.5 group cursor-not-allowed opacity-50">
            <div className="w-12 h-12 rounded-full border-2 border-indigo-500 flex items-center justify-center text-indigo-500 shadow-sm">
              <Bell className="w-5.5 h-5.5" />
            </div>
            <span className="text-[10px] font-bold text-slate-600 uppercase text-center leading-[1.2] tracking-tight">Remind<br />Later</span>
          </div>

          <div className="flex flex-col items-center gap-1.5 group cursor-pointer">
            <div className="w-12 h-12 rounded-full border-2 border-red-400 flex items-center justify-center text-red-500 group-hover:bg-red-50 transition-colors shadow-sm">
              <Trash2 className="w-5.5 h-5.5" />
            </div>
            <span className="text-[10px] font-bold text-slate-600 uppercase text-center leading-[1.2] tracking-tight">Delete<br />Notification</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-500">
        {/* Main Content Card */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-slate-200 shadow-sm overflow-hidden rounded-xl bg-white">
            <CardContent className="p-0">
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-slate-700">#{notification.id.slice(0, 8)}</span>
                  <Button
                    variant="outline"
                    className="h-8 rounded-lg font-bold text-[10px] text-[#0064cb] border-[#0064cb]/20 hover:bg-blue-50 transition-all active:scale-95 flex gap-1.5 cursor-pointer px-3"
                  >
                    <Edit2 className="w-3 h-3" />
                    Edit Details
                  </Button>
                </div>

                <p className="text-slate-600 font-bold text-sm">
                  Location - <span className="text-[#0064cb] cursor-pointer hover:underline flex items-center gap-1 inline-flex">
                    <MapPin className="w-3 h-3" /> Houston, TX, United States - 77001
                  </span>
                </p>
              </div>

              <div className="border-t border-slate-100 divide-y divide-slate-100">
                <div className="grid grid-cols-4 p-4 items-center">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">Title:</span>
                  <div className="col-span-3 text-sm text-slate-800 font-medium">
                    {notification.title}
                  </div>
                </div>

                <div className="grid grid-cols-4 p-4 items-start">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-tight pt-1">Description:</span>
                  <div className="col-span-3 text-sm text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                    {notification.message}
                  </div>
                </div>

                <div className="grid grid-cols-4 p-4 items-center">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">Status:</span>
                  <div className="col-span-3 flex items-center gap-2">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                      notification.is_seen ? "bg-slate-100 text-slate-800" : "bg-blue-100 text-blue-600"
                    )}>
                      {notification.is_seen ? "Read" : "Unread"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-4 p-4 items-center">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">Received At:</span>
                  <span className="col-span-3 text-sm text-slate-800 font-medium">
                    {new Date(notification.created_at).toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <div className="grid grid-cols-4 p-4 items-center">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">Type:</span>
                  <span className="col-span-3 text-sm text-slate-800 font-medium uppercase">{notification.data?.type || "System"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - History of changes style */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-slate-200 shadow-sm overflow-hidden rounded-2xl bg-white sticky top-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-6">Recent Activity</h3>
              <div className="space-y-8 relative before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                <div className="relative pl-8">
                  <div className="absolute left-0 top-1.5 w-5 h-5 rounded-full border-4 border-white bg-[#0064cb] shadow-sm z-10" />
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 space-y-1">
                    <h4 className="text-xs font-bold text-slate-800">Notification Received</h4>
                    <p className="text-[11px] text-slate-800 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Just now
                    </p>
                    <p className="text-[11px] text-slate-600 font-medium pt-1">Delivered via Firebase Cloud Messaging</p>
                  </div>
                </div>

                <div className="relative pl-8">
                  <div className="absolute left-0 top-1.5 w-5 h-5 rounded-full border-4 border-white bg-slate-200 shadow-sm z-10" />
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <h4 className="text-xs font-bold text-slate-800">Marked as Read</h4>
                    <p className="text-[11px] text-slate-800 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-[11px] text-slate-600 font-medium pt-1">PERFORMED BY: System</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
