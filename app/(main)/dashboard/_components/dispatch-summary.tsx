"use client";

import { useEffect, useState } from "react";
import { fetchShiftCountsAction } from "@/actions/dashboard.actions";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SummaryCardProps {
    label: string;
    value: string | number;
    variant?: "default" | "success" | "warning";
}

function SummaryCard({ label, value, variant = "default" }: SummaryCardProps) {
    const variants = {
        default: "bg-slate-50 border-slate-100",
        success: "bg-emerald-50/50 border-emerald-100/50",
        warning: "bg-rose-50/50 border-rose-100/50"
    };

    const textVariants = {
        default: "text-slate-500",
        success: "text-emerald-600",
        warning: "text-rose-600"
    };

    const valueVariants = {
        default: "text-slate-900",
        success: "text-emerald-700",
        warning: "text-rose-700"
    };

    return (
        <Card className={cn("border shadow-none rounded-xl transition-all duration-300 hover:shadow-md hover:-translate-y-1", variants[variant])}>
            <CardContent className="p-5 flex flex-col gap-2">
                <span className={cn("text-sm font-semibold tracking-wider", textVariants[variant])}>
                    {label}
                </span>
                <span className={cn("text-lg font-bold", valueVariants[variant])}>
                    {typeof value === 'number' ? value.toLocaleString() : value}
                </span>
            </CardContent>
        </Card>
    );
}

export function DispatchSummary() {
    const [counts, setCounts] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadCounts() {
            const res = await fetchShiftCountsAction();
            if (res.success) {
                setCounts(res.data);
            }
            setIsLoading(false);
        }
        loadCounts();
    }, []);

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-[100px] w-full rounded-xl" />
                ))}
            </div>
        );
    }

    const data = counts || { scheduled: 0, finished: 0, late_shift_start: 0, late_shift_end: 0, out_of_geofence: 0 };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <SummaryCard label="Scheduled Shifts" value={data.scheduled} variant="default" />
            <SummaryCard label="Finished Shifts" value={data.finished} variant="success" />
            <SummaryCard label="Out of geofence" value={data.out_of_geofence} variant="warning" />
            <SummaryCard label="Late to start" value={data.late_shift_start} variant="warning" />
            <SummaryCard label="Late to clock out" value={data.late_shift_end} variant="warning" />
        </div>
    );
}
