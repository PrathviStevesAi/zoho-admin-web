"use client";

import { usePathname } from "next/navigation";
import { DashboardHeader } from "./dashboard-header";
import { DashboardView } from "./dashboard-view";
import { DashboardProvider } from "./dashboard-context";
import { Suspense } from "react";

export default function DashboardLayout({
    children,
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
}: {
    children: React.ReactNode;
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
}) {
    const pathname = usePathname();
    const isDashboardRoot = pathname === "/dashboard";

    return (
        <DashboardProvider>
            {isDashboardRoot && (
                <div className="min-h-screen">
                    {/* Header Section */}
                    <Suspense fallback={<div className="h-20 animate-pulse bg-muted rounded-sm mb-10" />}>
                        <DashboardHeader />
                    </Suspense>

                    {/* View Switcher Section */}
                    <Suspense fallback={<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-pulse">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-[510px] bg-muted rounded-sm" />
                        ))}
                    </div>}>
                        <DashboardView
                            invoice={invoice}
                            precheck={precheck}
                            inprogress={inprogress}
                            finished={finished}
                            planned={planned}
                            arrival={arrival}
                            created={created}
                            accepted={accepted}
                            refused={refused}
                            abandon={abandon}
                            approved={approved}
                            notapproved={notapproved}
                        />
                    </Suspense>
                </div>
            )}

            {/* This renders the children (page.tsx) if needed */}
            <div>{children}</div>
        </DashboardProvider>
    )
}



