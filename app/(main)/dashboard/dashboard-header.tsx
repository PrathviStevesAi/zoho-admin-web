"use client";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useDashboard } from "./dashboard-context";
import { Loader2 } from "lucide-react";

export function DashboardHeader() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { isPending, startTransition } = useDashboard();

    const currentView = searchParams.get("view") || "guard-management";

    // Only show the dashboard-specific header on the main dashboard page
    if (pathname !== "/dashboard") return null;

    const handleValueChange = (value: string) => {
        startTransition(() => {
            const params = new URLSearchParams(searchParams.toString());
            params.set("view", value);
            router.push(`${pathname}?${params.toString()}`);
        });
    };


    return (
        <div className="flex flex-col md:flex-row items-baseline justify-between mb-10 border-b border-border pb-8 gap-4">
            {/* TYPOGRAPHY SECTION */}
            <div className="space-y-1.5">
                <h1 className="text-2xl font-bold text-foreground tracking-tight">
                    {currentView === "guard-management" ? "Operation Dashboard" : "Dispatch View Dashboard"}
                </h1>
                <p className="text-muted-foreground text-[14px] max-w-2xl font-medium">
                    {currentView === "guard-management"
                        ? "Real-time status of current operations and guard deployments."
                        : "Overview of shift acceptance, approvals, and dispatch status."}
                </p>
            </div>

            {/* SELECT SECTION */}
            <div className="flex flex-col items-start md:items-end gap-2">
                <Select value={currentView} onValueChange={handleValueChange} disabled={isPending}>
                    <SelectTrigger
                        className="h-10 w-[220px] bg-card border-border rounded-sm text-sm font-semibold shadow-sm focus:ring-2 focus:ring-primary/20 transition-all hover:bg-surface active:scale-[0.98]"
                    >
                        <div className="flex items-center gap-2">
                            {isPending && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                            <SelectValue placeholder="Select Management" />
                        </div>
                    </SelectTrigger>

                    <SelectContent
                        className="rounded-sm border-border bg-card shadow-lg p-1 animate-in fade-in-0 zoom-in-95"
                    >
                        <div className="p-1">
                            <SelectItem
                                value="guard-management"
                                className="h-9 px-3 rounded-sm text-sm font-medium cursor-pointer focus:bg-primary focus:text-primary-foreground transition-colors"
                            >
                                Operation Dashboard
                            </SelectItem>

                            <SelectItem
                                value="shift-management"
                                className="h-9 px-3 rounded-sm text-sm font-medium cursor-pointer focus:bg-primary focus:text-primary-foreground transition-colors"
                            >
                                Dispatch View Dashboard
                            </SelectItem>
                        </div>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
