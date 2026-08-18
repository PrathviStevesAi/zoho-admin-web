"use client";

import React, { createContext, useContext, useTransition, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { clientFetchOperationDashboardAction, clientFetchDispatchDashboardAction } from "@/lib/client-actions";

interface DashboardDataCategory {
    data: any[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        total_pages: number;
    };
}

interface OperationDashboardData {
    new_project?: DashboardDataCategory;
    in_progress?: DashboardDataCategory;
    shift_planned?: DashboardDataCategory;
    shift_arrival?: DashboardDataCategory;
    shift_pre_check_in?: DashboardDataCategory;
    shift_in_progress?: DashboardDataCategory;
    shift_finished?: DashboardDataCategory;
    shift_approved?: DashboardDataCategory;
    shift_not_approved?: DashboardDataCategory;
}

interface DispatchDashboardData {
    shift_accepted?: DashboardDataCategory;
    shift_refused?: DashboardDataCategory;
    complete?: DashboardDataCategory;
}

interface DashboardContextType {
    isPending: boolean;
    startTransition: React.TransitionStartFunction;
    loadingMessage: string;
    setLoadingMessage: (msg: string) => void;
    isFetching: boolean;
    setIsFetching: (fetching: boolean) => void;
    operationData: OperationDashboardData | null;
    dispatchData: DispatchDashboardData | null;
    isInitialLoading: boolean;
    dashboardFailed: boolean;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
    const searchParams = useSearchParams();
    const currentView = searchParams.get("view") || "guard-management";

    const [isPending, startTransition] = useTransition();
    const [loadingMessage, setLoadingMessage] = useState("Updating Dashboard...");
    const [isFetching, setIsFetching] = useState(false);
    const [operationData, setOperationData] = useState<OperationDashboardData | null>(null);
    const [dispatchData, setDispatchData] = useState<DispatchDashboardData | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [operationFailed, setOperationFailed] = useState(false);
    const [dispatchFailed, setDispatchFailed] = useState(false);

    const dashboardFailed = currentView === "guard-management" ? operationFailed : dispatchFailed;

    useEffect(() => {
        async function fetchDashboardData() {
            try {
                if (currentView === "guard-management") {
                    setIsInitialLoading(true);
                    setOperationFailed(false);
                    const operationRes = await clientFetchOperationDashboardAction();
                    if (operationRes.success && operationRes.data) {
                        setOperationData(operationRes.data);
                        setOperationFailed(false);
                    } else {
                        setOperationFailed(true);
                    }
                } else if (currentView === "shift-management") {
                    setIsInitialLoading(true);
                    setDispatchFailed(false);
                    const dispatchRes = await clientFetchDispatchDashboardAction();
                    if (dispatchRes.success && dispatchRes.data) {
                        setDispatchData(dispatchRes.data);
                        setDispatchFailed(false);
                    } else {
                        setDispatchFailed(true);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
                if (currentView === "guard-management") {
                    setOperationFailed(true);
                } else {
                    setDispatchFailed(true);
                }
            } finally {
                setIsInitialLoading(false);
            }
        }

        fetchDashboardData();
    }, [currentView]);

    return (
        <DashboardContext.Provider value={{
            isPending: isPending || isInitialLoading, startTransition, loadingMessage, setLoadingMessage,
            isFetching, setIsFetching,
            operationData, dispatchData, isInitialLoading, dashboardFailed
        }}>
            {children}
        </DashboardContext.Provider>
    );
}

export function useDashboard() {
    const context = useContext(DashboardContext);
    if (!context) {
        throw new Error("useDashboard must be used within a DashboardProvider");
    }
    return context;
}
