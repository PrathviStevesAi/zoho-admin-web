"use client";

import React, { createContext, useContext, useTransition } from "react";

interface DashboardContextType {
    isPending: boolean;
    startTransition: React.TransitionStartFunction;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
    const [isPending, startTransition] = useTransition();

    return (
        <DashboardContext.Provider value={{ isPending, startTransition }}>
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
