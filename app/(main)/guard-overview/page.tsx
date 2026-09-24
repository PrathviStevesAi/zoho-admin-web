"use client";

import {
  ShieldCheck,
  Clock,
  Activity,
  Star,
  Calendar,
  Building2,
  User,
  CheckCircle2,
  ChevronRight,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/table/pagination";
import {
  clientFetchGuardSummaryAction,
  clientFetchGuardReviewsSummaryAction,
  clientFetchGuardReviewsAction,
  GuardReviewItem
} from "@/lib/client-actions";

function GuardOverviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const guardId = searchParams.get("guard_id") || searchParams.get("id") || "";
  const [backUrl, setBackUrl] = useState("/users-directory/guards");
  const [activeTab, setActiveTab] = useState<"all" | "customer" | "fastguard">("all");

  const [summary, setSummary] = useState<{
    complete_shifts: number;
    scheduled_shifts: number;
    active_shifts: number;
  }>({
    complete_shifts: 0,
    scheduled_shifts: 0,
    active_shifts: 0,
  });
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  const [reviewSummary, setReviewSummary] = useState<{
    overall_rating: number;
    total_reviews: number;
    rating_counts: {
      [key: string]: number;
    };
    customer_reviews_count: number;
    fastguard_reviews_count: number;
  }>({
    overall_rating: 0,
    total_reviews: 0,
    rating_counts: {
      "1": 0,
      "2": 0,
      "3": 0,
      "4": 0,
      "5": 0,
    },
    customer_reviews_count: 0,
    fastguard_reviews_count: 0,
  });
  const [isLoadingReviewsSummary, setIsLoadingReviewsSummary] = useState(false);

  const [reviews, setReviews] = useState<GuardReviewItem[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<{
    total: number;
    total_pages: number;
    page_size: number;
  } | null>(null);

  useEffect(() => {
    const returnTo = searchParams.get("returnTo");
    if (returnTo) {
      setBackUrl(returnTo);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!guardId) return;

    let isMounted = true;
    const fetchSummary = async () => {
      setIsLoadingSummary(true);
      const res = await clientFetchGuardSummaryAction(guardId);
      if (isMounted) {
        if (res.success && res.data) {
          setSummary({
            complete_shifts: res.data.complete_shifts ?? 0,
            scheduled_shifts: res.data.scheduled_shifts ?? 0,
            active_shifts: res.data.active_shifts ?? 0,
          });
        }
        setIsLoadingSummary(false);
      }
    };

    fetchSummary();

    return () => {
      isMounted = false;
    };
  }, [guardId]);

  useEffect(() => {
    let isMounted = true;
    const fetchReviewsSummary = async () => {
      setIsLoadingReviewsSummary(true);
      const res = await clientFetchGuardReviewsSummaryAction({
        guard_id: guardId || undefined,
        filter_type: "summary",
      });
      if (isMounted) {
        if (res.success && res.data) {
          setReviewSummary({
            overall_rating: res.data.overall_rating ?? 0,
            total_reviews: res.data.total_reviews ?? 0,
            rating_counts: res.data.rating_counts || {
              "1": 0,
              "2": 0,
              "3": 0,
              "4": 0,
              "5": 0,
            },
            customer_reviews_count: res.data.customer_reviews_count ?? 0,
            fastguard_reviews_count: res.data.fastguard_reviews_count ?? 0,
          });
        }
        setIsLoadingReviewsSummary(false);
      }
    };

    fetchReviewsSummary();

    return () => {
      isMounted = false;
    };
  }, [guardId]);

  const loadReviews = async (page: number = 1, tab: "all" | "customer" | "fastguard" = activeTab) => {
    setIsLoadingReviews(true);
    const res = await clientFetchGuardReviewsAction({
      guard_id: guardId || undefined,
      filter_type: tab,
      page,
      page_size: 10,
    });
    if (res.success && res.data) {
      setReviews(res.data);
      setPagination({
        total: res.total ?? 0,
        total_pages: res.total_pages ?? 1,
        page_size: res.page_size ?? 10,
      });
      setCurrentPage(page);
    } else {
      setReviews([]);
      setPagination(null);
    }
    setIsLoadingReviews(false);
  };

  useEffect(() => {
    loadReviews(1, activeTab);
  }, [guardId, activeTab]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "";
      return d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "";
    }
  };

  const formatTimeRange = (startStr?: string, endStr?: string) => {
    const start = formatTime(startStr);
    const end = formatTime(endStr);
    if (start && end) return `${start} - ${end}`;
    return start || end || "";
  };

  const renderRatingStars = (rating: number) => {
    return [1, 2, 3, 4, 5].map((i) => {
      if (rating >= i) {
        return <Star key={i} className="w-6 h-6 fill-amber-400 text-amber-400" />;
      } else if (rating > i - 1) {
        const percentage = Math.max(0, Math.min(100, Math.round((rating - (i - 1)) * 100)));
        return (
          <div key={i} className="relative">
            <Star className="w-6 h-6 text-slate-200 fill-slate-200" />
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${percentage}%` }}
            >
              <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
            </div>
          </div>
        );
      } else {
        return <Star key={i} className="w-6 h-6 text-slate-200 fill-slate-200" />;
      }
    });
  };

  return (
    <div className="p-4 md:p-6 max-w-[1200px] mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="space-y-1 mb-6">
        <div className="flex items-center gap-2 text-slate-700 text-[13px] mb-1">
          <Link href="/dashboard" className="hover:text-[#0064cb] transition-colors">Dashboard</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/users-directory/guards" className="hover:text-[#0064cb] transition-colors">Guards</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-600 font-medium">Guard Overview</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push(backUrl)} className="p-2 bg-white rounded-lg border border-slate-200 text-slate-700 hover:text-[#0064cb] transition-all cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-2xl font-bold text-slate-900">Guard Overview</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          onClick={() =>
            router.push(
              `/guard-overview/shifts?guard_id=${guardId}&type=complete_shifts&returnTo=${encodeURIComponent(
                typeof window !== "undefined"
                  ? window.location.pathname + window.location.search
                  : `/guard-overview?guard_id=${guardId}`
              )}`
            )
          }
          className="shadow-sm border-slate-100 hover:border-emerald-200 hover:shadow-md transition-all cursor-pointer group"
        >
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Completed Shifts </p>
                {isLoadingSummary ? (
                  <Skeleton className="h-9 w-16 my-0.5" />
                ) : (
                  <h3 className="text-3xl font-bold text-slate-900">{summary.complete_shifts}</h3>
                )}
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
          </CardContent>
        </Card>

        <Card
          onClick={() =>
            router.push(
              `/guard-overview/shifts?guard_id=${guardId}&type=scheduled_shifts&returnTo=${encodeURIComponent(
                typeof window !== "undefined"
                  ? window.location.pathname + window.location.search
                  : `/guard-overview?guard_id=${guardId}`
              )}`
            )
          }
          className="shadow-sm border-slate-100 hover:border-amber-200 hover:shadow-md transition-all cursor-pointer group"
        >
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Clock className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Scheduled Shifts</p>
                {isLoadingSummary ? (
                  <Skeleton className="h-9 w-16 my-0.5" />
                ) : (
                  <h3 className="text-3xl font-bold text-slate-900">{summary.scheduled_shifts}</h3>
                )}
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
          </CardContent>
        </Card>

        <Card
          onClick={() =>
            router.push(
              `/guard-overview/shifts?guard_id=${guardId}&type=active_shifts&returnTo=${encodeURIComponent(
                typeof window !== "undefined"
                  ? window.location.pathname + window.location.search
                  : `/guard-overview?guard_id=${guardId}`
              )}`
            )
          }
          className="shadow-sm border-slate-100 hover:border-emerald-200 hover:shadow-md transition-all cursor-pointer group"
        >
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Activity className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Active Shifts</p>
                {isLoadingSummary ? (
                  <Skeleton className="h-9 w-16 my-0.5" />
                ) : (
                  <h3 className="text-3xl font-bold text-slate-900">{summary.active_shifts}</h3>
                )}
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-slate-100 overflow-hidden">
        <div className="p-6 pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-slate-900">Guard Reviews</h2>
        </div>

        <div className="p-6">
          <div className="border border-slate-100 rounded-xl p-6 flex flex-col md:flex-row gap-8 items-center bg-slate-50/50 mb-8">
            <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left w-full">
              <h3 className="text-sm font-bold text-slate-800 mb-2">Overall Rating</h3>
              <div className="flex items-end gap-3 mb-2">
                {isLoadingReviewsSummary ? (
                  <Skeleton className="h-12 w-20" />
                ) : (
                  <span className="text-5xl font-bold text-slate-900 leading-none">
                    {reviewSummary.overall_rating > 0
                      ? Number(reviewSummary.overall_rating.toFixed(1))
                      : "0.0"}
                  </span>
                )}
                <div className="flex pb-1">
                  {isLoadingReviewsSummary ? (
                    <Skeleton className="h-6 w-32" />
                  ) : (
                    renderRatingStars(reviewSummary.overall_rating)
                  )}
                </div>
              </div>
              {isLoadingReviewsSummary ? (
                <Skeleton className="h-4 w-28 mt-1" />
              ) : (
                <p className="text-xs text-slate-500 font-medium">
                  {`Based on ${reviewSummary.total_reviews} ${reviewSummary.total_reviews === 1 ? "review" : "reviews"}`}
                </p>
              )}
            </div>

            <div className="flex-[1.5] w-full max-w-md space-y-2">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count =
                  reviewSummary.rating_counts?.[stars.toString()] ??
                  reviewSummary.rating_counts?.[stars] ??
                  0;
                const percent =
                  reviewSummary.total_reviews > 0
                    ? Math.round((count / reviewSummary.total_reviews) * 100)
                    : 0;
                return (
                  <div key={stars} className="flex items-center gap-3 text-xs font-bold text-slate-700">
                    <div className="w-6 flex items-center gap-1 justify-end">
                      {stars} <Star className="w-3 h-3 fill-slate-700" />
                    </div>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="w-4 text-right text-slate-500 font-medium">
                      {isLoadingReviewsSummary ? "-" : count}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-6 border-b border-slate-100 mb-6">
            <button
              onClick={() => setActiveTab("all")}
              className={cn(
                "pb-3 text-sm font-bold transition-all cursor-pointer",
                activeTab === "all"
                  ? "text-[#0064cb] border-b-2 border-[#0064cb]"
                  : "text-slate-500 hover:text-slate-700 border-b-2 border-transparent font-medium"
              )}
            >
              All Reviews ({reviewSummary.total_reviews})
            </button>
            <button
              onClick={() => setActiveTab("customer")}
              className={cn(
                "pb-3 text-sm font-bold transition-all cursor-pointer",
                activeTab === "customer"
                  ? "text-[#0064cb] border-b-2 border-[#0064cb]"
                  : "text-slate-500 hover:text-slate-700 border-b-2 border-transparent font-medium"
              )}
            >
              Customer Reviews ({reviewSummary.customer_reviews_count})
            </button>
            <button
              onClick={() => setActiveTab("fastguard")}
              className={cn(
                "pb-3 text-sm font-bold transition-all cursor-pointer",
                activeTab === "fastguard"
                  ? "text-[#0064cb] border-b-2 border-[#0064cb]"
                  : "text-slate-500 hover:text-slate-700 border-b-2 border-transparent font-medium"
              )}
            >
              FastGuard Reviews ({reviewSummary.fastguard_reviews_count})
            </button>
          </div>

          {isLoadingReviews ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col md:flex-row gap-4 md:gap-6 pb-6 border-b border-slate-100">
                  <div className="md:w-44 shrink-0">
                    <Skeleton className="h-6 w-28 rounded" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-64" />
                  </div>
                  <div className="md:w-36 flex flex-col justify-between items-end gap-4">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm font-medium">
              No reviews found.
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((item, index) => {
                const isCustomer = item.review_type === "customer";
                const shiftDate = formatDate(item.local_start_time || item.date);
                const reviewDate = formatDate(item.date);
                const timeRange = formatTimeRange(item.local_start_time, item.local_end_time);

                return (
                  <div
                    key={item.id || `${item.shift_no}-${index}`}
                    className={cn(
                      "flex flex-col md:flex-row gap-4 md:gap-6 pb-6 border-b border-slate-100",
                      index === reviews.length - 1 && "border-b-0 pb-2"
                    )}
                  >
                    <div className="md:w-44 shrink-0">
                      <span
                        className={cn(
                          "inline-block px-2.5 py-1 text-[10px] font-bold rounded uppercase tracking-wider",
                          isCustomer
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-blue-100 text-[#0064cb]"
                        )}
                      >
                        {isCustomer ? "CUSTOMER REVIEW" : "FASTGUARD REVIEW"}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex mb-2">
                        {[1, 2, 3, 4, 5].map((starIndex) => (
                          <Star
                            key={starIndex}
                            className={cn(
                              "w-4 h-4",
                              starIndex <= (item.rating || 0)
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-200 fill-slate-200"
                            )}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-slate-800 font-medium mb-4 whitespace-pre-line">
                        {item.review_text || "---"}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
                        {item.customer_name && (
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 shrink-0" />
                            <span>{item.customer_name}</span>
                          </div>
                        )}
                        {!isCustomer && item.reviewed_by && (
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 shrink-0" />
                            <span>Reviewed by: {item.reviewed_by}</span>
                          </div>
                        )}
                        {shiftDate && (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 shrink-0" />
                            <span>{shiftDate}</span>
                          </div>
                        )}
                        {timeRange && (
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            <span>{timeRange}</span>
                          </div>
                        )}
                        {item.shift_no && (
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>Shift #{item.shift_no}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end justify-between shrink-0 md:w-36">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-4 md:mb-0">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span>{reviewDate || shiftDate}</span>
                      </div>
                      {item.shift_id ? (
                        <Link
                          href={`/shift/view?shift_id=${item.shift_id}`}
                          className="text-xs font-bold text-[#0064cb] hover:underline flex items-center whitespace-nowrap"
                        >
                          View Shift Report <ChevronRight className="w-3.5 h-3.5 ml-0.5 shrink-0" />
                        </Link>
                      ) : (
                        <span />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {pagination && pagination.total > 0 && pagination.total_pages > 1 && (
          <div className="border-t border-slate-100">
            <Pagination
              page={currentPage}
              totalPages={pagination.total_pages}
              totalItems={pagination.total}
              limit={pagination.page_size}
              onPageChange={(p) => loadReviews(p, activeTab)}
              isPending={isLoadingReviews}
            />
          </div>
        )}
      </Card>
    </div>
  );
}

export default function GuardOverviewPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 md:p-6 max-w-[1200px] mx-auto space-y-6">
          <div className="h-10 w-48 bg-slate-100 rounded-lg animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      }
    >
      <GuardOverviewContent />
    </Suspense>
  );
}

