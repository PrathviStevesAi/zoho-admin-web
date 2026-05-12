"use client";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect, useTransition } from "react";
import { DateTime } from "luxon";
import { Calendar as CalendarIcon, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDashboard } from "../dashboard-context";

export function PeriodFilter() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { isPending, startTransition, setLoadingMessage } = useDashboard();

    const period = searchParams.get("period") || "all_time";
    const dateFrom = searchParams.get("date_from") || "";
    const dateTo = searchParams.get("date_to") || "";

    const [isCustom, setIsCustom] = useState(period === "custom");
    const [tempDates, setTempDates] = useState({ start: dateFrom, end: dateTo });

    useEffect(() => {
        setIsCustom(period === "custom");
    }, [period]);

    const handlePeriodChange = (value: string) => {
        setLoadingMessage("Updating Dashboards...");
        startTransition(() => {
            const params = new URLSearchParams(searchParams.toString());
            params.set("period", value);

            if (value === "today") {
                const today = DateTime.now().toISODate();
                params.set("date_from", today!);
                params.set("date_to", today!);
                setIsCustom(false);
            } else if (value === "yesterday") {
                const yesterday = DateTime.now().minus({ days: 1 }).toISODate();
                params.set("date_from", yesterday!);
                params.set("date_to", yesterday!);
                setIsCustom(false);
            } else if (value === "all_time") {
                params.delete("date_from");
                params.delete("date_to");
                setIsCustom(false);
            } else if (value === "custom") {
                setIsCustom(true);
                return; // Don't push yet, let user pick dates
            }

            router.push(`${pathname}?${params.toString()}`);
        });
    };

    const handleApplyCustom = () => {
        setLoadingMessage("Updating Dashboards...");
        startTransition(() => {
            const params = new URLSearchParams(searchParams.toString());
            params.set("period", "custom");
            params.set("date_from", tempDates.start);
            params.set("date_to", tempDates.end);
            router.push(`${pathname}?${params.toString()}`);
        });
    };

    return (
        <div className="flex flex-col md:flex-row items-end gap-3">
            {isCustom && (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-300">
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight ml-1">From</span>
                        <Input
                            type="date"
                            disabled={isPending}
                            value={tempDates.start}
                            onChange={(e) => setTempDates(prev => ({ ...prev, start: e.target.value }))}
                            className="h-[42px] w-[140px] bg-card border-border rounded-sm text-xs font-medium"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight ml-1">To</span>
                        <Input
                            type="date"
                            disabled={isPending}
                            value={tempDates.end}
                            onChange={(e) => setTempDates(prev => ({ ...prev, end: e.target.value }))}
                            className="h-[42px] w-[140px] bg-card border-border rounded-sm text-xs font-medium"
                        />
                    </div>
                    <Button
                        size="sm"
                        onClick={handleApplyCustom}
                        disabled={isPending}
                        className="cursor-pointer h-[42px] mt-5 px-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-sm transition-all"
                    >
                        Apply
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        disabled={isPending}
                        onClick={() => {
                            setIsCustom(false);
                            handlePeriodChange("all_time");
                        }}
                        className="h-[42px] w-9 mt-5 text-slate-400 hover:text-slate-600"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}

            <div className="flex flex-col gap-1">
                <span className="text-[14px] font-semibold text-slate-600 tracking-tight ml-1">Period</span>
                <Select value={period} onValueChange={handlePeriodChange} disabled={isPending}>
                    <SelectTrigger
                        className="!h-[42px] w-[150px] bg-card border-border rounded-sm text-xs font-semibold shadow-sm focus:ring-2 focus:ring-primary/20 transition-all hover:bg-surface active:scale-[0.98]"
                    >
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="h-3.5 w-3.5 text-slate-400" />
                            <SelectValue placeholder="Select Period" />
                        </div>
                    </SelectTrigger>

                    <SelectContent
                        className="rounded-sm border-border bg-card shadow-lg p-1 animate-in fade-in-0 zoom-in-95"
                    >
                        <div className="p-1">
                            <SelectItem
                                value="all_time"
                                className="h-8 px-3 rounded-sm text-xs font-medium cursor-pointer focus:bg-primary focus:text-primary-foreground transition-colors"
                            >
                                All Time
                            </SelectItem>
                            <SelectItem
                                value="today"
                                className="h-8 px-3 rounded-sm text-xs font-medium cursor-pointer focus:bg-primary focus:text-primary-foreground transition-colors"
                            >
                                Today
                            </SelectItem>
                            <SelectItem
                                value="yesterday"
                                className="h-8 px-3 rounded-sm text-xs font-medium cursor-pointer focus:bg-primary focus:text-primary-foreground transition-colors"
                            >
                                Yesterday
                            </SelectItem>
                            <SelectItem
                                value="custom"
                                className="h-8 px-3 rounded-sm text-xs font-medium cursor-pointer focus:bg-primary focus:text-primary-foreground transition-colors"
                            >
                                Custom
                            </SelectItem>
                        </div>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
