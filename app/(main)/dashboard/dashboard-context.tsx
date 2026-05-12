"use client";

import React, { createContext, useContext, useTransition, useState } from "react";

interface DashboardContextType {
    isPending: boolean;
    startTransition: React.TransitionStartFunction;
    loadingMessage: string;
    setLoadingMessage: (msg: string) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
    const [isPending, startTransition] = useTransition();
    const [loadingMessage, setLoadingMessage] = useState("Updating Dashboard...");

    return (
        <DashboardContext.Provider value={{ isPending, startTransition, loadingMessage, setLoadingMessage }}>
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
