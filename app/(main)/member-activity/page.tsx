"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ChevronRight, ArrowLeft, Eye, UserCheck, UserX, ChevronLeft, CalendarClock, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ActivityFilters, ActivityFilterState } from "./components/activity-filters";
import { ActivityCard } from "./components/activity-card";

export default function MemberActivityPage() {
  const { data: session, status } = useSession();
  const token = (session as any)?.accessToken;
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    record_touched: 0,
    approved: 0,
    disqualified: 0,
  });

  const [filters, setFilters] = useState<ActivityFilterState>({
    searchEmail: "",
    memberEmail: "all",
    status: "all",
    dateFilter: "all_time",
    startDate: "",
    endDate: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  const getDateParams = (currentFilters = filters) => {
    const format = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    const today = new Date();

    switch (currentFilters.dateFilter) {
      case 'today':
        return { start_date: format(today), end_date: format(today) };
      case 'yesterday':
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        return { start_date: format(yesterday), end_date: format(yesterday) };
      case 'last_7_days':
        const last7 = new Date();
        last7.setDate(today.getDate() - 7);
        return { start_date: format(last7), end_date: format(today) };
      case 'custom':
        return { start_date: currentFilters.startDate, end_date: currentFilters.endDate };
      default:
        return { start_date: "", end_date: "" };
    }
  };

  const fetchActivities = async (page: number | null = 1, currentFilters = filters) => {
    setLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const dateParams = getDateParams(currentFilters);
      const queryParams = new URLSearchParams();
      if (page) {
        queryParams.append("page", page.toString());
        queryParams.append("limit", pageSize.toString());
      }

      if (currentFilters.searchEmail) {
        queryParams.append("user_email", currentFilters.searchEmail);
      } else if (currentFilters.memberEmail && currentFilters.memberEmail !== "all") {
        queryParams.append("user_email", currentFilters.memberEmail);
      }
      if (currentFilters.status && currentFilters.status !== "all") {
        queryParams.append("status", currentFilters.status);
      }
      if (dateParams.start_date) {
        queryParams.append("start_date", dateParams.start_date);
      }
      if (dateParams.end_date) {
        queryParams.append("end_date", dateParams.end_date);
      }

      const url = `${baseUrl}/api/v1/guard/bank/user/activity?${queryParams.toString()}`;
      console.log("Fetching activities from:", url);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          "ngrok-skip-browser-warning": "true",
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });

      clearTimeout(timeoutId);

      console.log("Fetch activities response status:", res.status);
      const data = await res.json();
      console.log("Fetch activities response data:", data);

      if (data.success) {
        setActivities(data.data || []);
        if (data.summary) setSummary(data.summary);
        if (data.pagination) setTotalCount(data.pagination.total || 0);
      } else {
        toast.error(data.message || "Failed to fetch activities");
      }
    } catch (error: any) {
      console.error("Failed to fetch activities:", error);
      if (error.name === 'AbortError') {
        toast.error("Request timed out. The server took too long to respond.");
      } else {
        toast.error("An error occurred while fetching activities");
      }
    } finally {
      setLoading(false);
    }
  };

  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (mounted && status !== "loading") {
      fetchActivities(null);
      setCurrentPage(1);
    }
  }, [mounted, status, token]);

  const handleSearch = async () => {
    setHasSearched(true);
    setIsSearching(true);
    setCurrentPage(1);
    await fetchActivities(1);
    setIsSearching(false);
  };

  const handleReset = () => {
    const defaultFilters = {
      searchEmail: "",
      memberEmail: "all",
      status: "all",
      dateFilter: "all_time",
      startDate: "",
      endDate: "",
    };
    setFilters(defaultFilters);
    setCurrentPage(1);
    setHasSearched(false);
    fetchActivities(null, defaultFilters);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchActivities(newPage);
  };

  const renderPagination = () => {
    if (totalCount === 0) return null;
    const totalPages = Math.ceil(totalCount / pageSize);
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalCount);

    const getPages = () => {
      const pages = [];
      if (totalPages <= 5) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
      } else {
        if (currentPage <= 3) {
          pages.push(1, 2, 3, 4, '...', totalPages);
        } else if (currentPage >= totalPages - 2) {
          pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
        } else {
          pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
        }
      }
      return pages;
    };

    return (
      <div className="flex items-center justify-between pt-6 mt-auto">
        <div className="text-sm font-medium text-slate-500">
          Showing <span className="font-bold text-slate-700">{start}</span> to <span className="font-bold text-slate-700">{end}</span> of <span className="font-bold text-slate-700">{totalCount}</span> entries
        </div>
        <div className="flex items-center gap-1">
          <button
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {getPages().map((p, i) => (
            p === '...' ? (
              <span key={`dots-${i}`} className="w-8 h-8 flex items-center justify-center text-slate-400 font-bold tracking-widest">...</span>
            ) : (
              <button
                key={p}
                onClick={() => handlePageChange(p as number)}
                className={cn(
                  "w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold transition-all duration-200",
                  currentPage === p
                    ? "bg-[#0064cb] text-white border border-[#0064cb] shadow-md shadow-blue-200/50"
                    : "border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                {p}
              </button>
            )
          ))}

          <button
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-0 sm:p-4 md:p-6 max-w-[1500px] mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-slate-700 text-[13px] mb-1">
          <Link href="/dashboard" className="hover:text-[#0064cb] transition-colors">Dashboard</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-600 font-medium">Guard Management</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-600 font-medium">Member Activity</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 bg-white rounded-lg border border-slate-200 text-slate-700 hover:text-[#0064cb] transition-all">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Member Activity</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Total Touched Guards</p>
            <h3 className="text-2xl font-bold text-slate-800">{summary.record_touched}</h3>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Total Approved Guards</p>
            <h3 className="text-2xl font-bold text-slate-800">{summary.approved}</h3>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <UserX className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Total Disqualified Guards</p>
            <h3 className="text-2xl font-bold text-slate-800">{summary.disqualified}</h3>
          </div>
        </div>
      </div>

      <ActivityFilters
        filters={filters}
        setFilters={setFilters}
        onSearch={handleSearch}
        onReset={handleReset}
        loading={isSearching}
        mounted={mounted}
      />

      {hasSearched && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col min-h-[500px]">
          <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-[#0064cb]" />
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">Activity Log</h2>
            </div>

            {(activities.length > 0 || filters.searchEmail) && (
              <div className="relative w-64 animate-in fade-in zoom-in duration-300">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search by email..."
                  value={filters.searchEmail}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchEmail: e.target.value }))}
                  className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-[#0064cb]/20 h-10"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex gap-4">
                    <Skeleton className="w-14 h-14 rounded-full shrink-0" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-10 w-full mt-2" />
                    </div>
                  </div>
                </div>
              ))
            ) : activities.length === 0 ? (
              <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-400">
                <CalendarClock className="w-12 h-12 mb-4 text-slate-300" />
                <p className="text-lg font-medium text-slate-500">No activities found</p>
                <p className="text-sm">Try adjusting your filters to see more results.</p>
              </div>
            ) : (
              activities.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))
            )}
          </div>

          <div className="mt-auto">
            {renderPagination()}
          </div>
        </div>
      )}

    </div>
  );
}
