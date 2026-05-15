"use client";

import { useSearchParams, usePathname } from "next/navigation";
import { useDashboard } from "./dashboard-context";
import { Loader2 } from "lucide-react";
import { DispatchSummary } from "./_components/dispatch-summary";


interface DashboardViewProps {
    invoice: React.ReactNode;
    precheck: React.ReactNode;
    inprogress: React.ReactNode;
    finished: React.ReactNode;
    planned: React.ReactNode;
    arrival: React.ReactNode;
    created: React.ReactNode;
    accepted: React.ReactNode;
    refused: React.ReactNode;
    abandon: React.ReactNode;
    approved: React.ReactNode;
    notapproved: React.ReactNode;
}

export function DashboardView({
    invoice,
    precheck,
    inprogress,
    finished,
    planned,
    arrival,
    created,
    accepted,
    refused,
    abandon,
    approved,
    notapproved,
}: DashboardViewProps) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { isPending, loadingMessage } = useDashboard();
    const currentView = searchParams.get("view") || "guard-management";

    // Only show the dashboard tables grid on the main dashboard page
    if (pathname !== "/dashboard") return null;

    return (
        <div className="relative">
            {/* Loading Overlay */}
            {isPending && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/40 transition-all animate-in fade-in-0">
                    <div className="flex flex-col items-center gap-3 bg-card p-6 rounded-xl shadow-xl border border-border">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p className="text-sm font-semibold text-foreground animate-pulse">
                            {loadingMessage}
                        </p>
                    </div>
                </div>
            )}

            {/* Dispatch View Summary Cards */}
            {currentView !== "guard-management" && <DispatchSummary />}

            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 transition-all duration-300 ${isPending ? 'opacity-40 blur-[2px] pointer-events-none' : ''}`}>

                {currentView === "guard-management" ? (
                    <>
                        <div key="invoice">{invoice}</div>
                        <div key="created">{created}</div>
                        <div key="planned">{planned}</div>
                        <div key="arrival">{arrival}</div>
                        <div key="precheck">{precheck}</div>
                        <div key="inprogress">{inprogress}</div>
                        <div key="finished">{finished}</div>
                    </>
                ) : (
                    <>
                        <div key="refused">{refused}</div>
                        <div key="abandon">{abandon}</div>
                        <div key="accepted">{accepted}</div>
                        <div key="approved">{approved}</div>
                        <div key="notapproved">{notapproved}</div>
                    </>
                )}
            </div>
        </div>
    );
}

