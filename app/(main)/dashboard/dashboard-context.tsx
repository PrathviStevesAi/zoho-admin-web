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
    const [fetchedViews, setFetchedViews] = useState<Set<string>>(new Set());

    useEffect(() => {
        async function fetchDashboardData() {
            try {
                if (currentView === "guard-management" && !fetchedViews.has("guard-management")) {
                    setIsInitialLoading(true);
                    const operationRes = await clientFetchOperationDashboardAction();
                    if (operationRes.success && operationRes.data) {
                        setOperationData(operationRes.data);
                    }
                    setFetchedViews(prev => new Set(prev).add("guard-management"));
                } else if (currentView === "shift-management" && !fetchedViews.has("shift-management")) {
                    setIsInitialLoading(true);
                    const dispatchRes = await clientFetchDispatchDashboardAction();
                    if (dispatchRes.success && dispatchRes.data) {
                        setDispatchData(dispatchRes.data);
                    }
                    setFetchedViews(prev => new Set(prev).add("shift-management"));
                }
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setIsInitialLoading(false);
            }
        }

        fetchDashboardData();
    }, [currentView]);

    return (
        <DashboardContext.Provider value={{
            isPending, startTransition, loadingMessage, setLoadingMessage,
            isFetching, setIsFetching,
            operationData, dispatchData, isInitialLoading
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
