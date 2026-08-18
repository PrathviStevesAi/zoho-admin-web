"use client";

import { useSearchParams, usePathname } from "next/navigation";
import { useDashboard } from "./dashboard-context";
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
    completeinvoice: React.ReactNode;
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
    completeinvoice,
}: DashboardViewProps) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { isPending, isFetching, loadingMessage } = useDashboard();
    const currentView = searchParams.get("view") || "guard-management";

    if (pathname !== "/dashboard") return null;

    return (
        <div className="relative">
            {currentView !== "guard-management" && <DispatchSummary />}
            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 transition-all duration-300`}>

                {currentView === "guard-management" ? (
                    <>
                        <div key="invoice">{invoice}</div>
                        <div key="created">{created}</div>
                        <div key="planned">{planned}</div>
                        <div key="arrival">{arrival}</div>
                        <div key="precheck">{precheck}</div>
                        <div key="inprogress">{inprogress}</div>
                        <div key="finished">{finished}</div>
                        <div key="notapproved">{notapproved}</div>
                        <div key="approved">{approved}</div>
                    </>
                ) : (
                    <>
                        <div key="refused">{refused}</div>
                        <div key="accepted">{accepted}</div>
                        {/* <div key="approved">{approved}</div> */}
                        {/* <div key="notapproved">{notapproved}</div> */}
                        <div key="completeinvoice">{completeinvoice}</div>
                    </>
                )}
            </div>
        </div>
    );
}

