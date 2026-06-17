"use client";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useDashboard } from "./dashboard-context";
import { PeriodFilter } from "./_components/period-filter";

export function DashboardHeader() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { isPending, startTransition, setLoadingMessage } = useDashboard();

    const currentView = searchParams.get("view") || "guard-management";

    // Only show the dashboard-specific header on the main dashboard page
    if (pathname !== "/dashboard") return null;

    const handleValueChange = (value: string) => {
        setLoadingMessage("Switching Dashboards...");
        startTransition(() => {
            const params = new URLSearchParams(searchParams.toString());
            params.set("view", value);
            router.push(`${pathname}?${params.toString()}`);
        });
    };


    return (
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-0 md:mb-10 border-b border-border pb-4 md:pb-8 gap-6">
            {/* TYPOGRAPHY SECTION */}
            <div className="space-y-1.5 w-full md:w-auto">
                <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-3">
                    {currentView === "guard-management" ? "Operation Dashboard" : "Dispatch View Dashboard"}
                </h1>
                <p className="text-muted-foreground text-[14px] max-w-2xl font-medium">
                    {currentView === "guard-management"
                        ? "Real-time status of current operations and guard deployments."
                        : "Overview of shift acceptance, approvals, and dispatch status."}
                </p>
            </div>

            {/* FILTERS SECTION */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 w-full md:w-auto">
                {/* CREATE DROPDOWN */}
                <div className="flex flex-col gap-1 w-full sm:w-auto">
                    <span className="text-[14px] font-semibold text-slate-600 tracking-tight ml-1 h-[21px] block sm:block select-none" aria-hidden="true">&nbsp;</span>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                className="cursor-pointer !h-[42px] w-full sm:w-[130px] bg-primary hover:bg-primary/90 text-primary-foreground rounded-sm text-sm font-semibold shadow-sm focus:ring-2 focus:ring-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                Create
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="start"
                            className="rounded-sm border-border bg-card shadow-lg p-1 animate-in fade-in-0 zoom-in-95 min-w-[140px]"
                        >
                            <div className="p-1">
                                <DropdownMenuItem
                                    className="h-8 px-3 rounded-sm text-xs font-medium cursor-pointer focus:bg-primary focus:text-primary-foreground transition-colors flex items-center whitespace-nowrap"
                                    onClick={() => router.push("/dashboard/new-work-order")}
                                >
                                    New Work Order
                                </DropdownMenuItem>
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <PeriodFilter />

                <div className="flex flex-col gap-1 w-full sm:w-auto">
                    <span className="text-[14px] font-semibold text-slate-600 tracking-tight ml-1">View</span>
                    <Select value={currentView} onValueChange={handleValueChange} disabled={isPending}>
                        <SelectTrigger
                            className="cursor-pointer !h-[42px] w-full sm:w-[220px] bg-card border-border rounded-sm text-xs font-semibold shadow-sm focus:ring-2 focus:ring-primary/20 transition-all hover:bg-surface active:scale-[0.98]"
                        >
                            <div className="flex items-center gap-2">
                                <SelectValue placeholder="Select View" />
                            </div>
                        </SelectTrigger>

                        <SelectContent
                            className="rounded-sm border-border bg-card shadow-lg p-1 animate-in fade-in-0 zoom-in-95"
                        >
                            <div className="p-1">
                                <SelectItem
                                    value="guard-management"
                                    className="h-8 px-3 rounded-sm text-xs font-medium cursor-pointer focus:bg-primary focus:text-primary-foreground transition-colors"
                                >
                                    Operation Dashboard
                                </SelectItem>

                                <SelectItem
                                    value="shift-management"
                                    className="h-8 px-3 rounded-sm text-xs font-medium cursor-pointer focus:bg-primary focus:text-primary-foreground transition-colors"
                                >
                                    Dispatch View Dashboard
                                </SelectItem>
                            </div>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
}
