"use client";

import { useSearchParams } from "next/navigation";
import Invoice from "./invoice";
import { useDashboard } from "../dashboard-context";

export default function InvoicePage() {
    const searchParams = useSearchParams();
    const view = searchParams.get("view");
    const currentView = view || "guard-management";
    const { operationData } = useDashboard();

    if (currentView !== "guard-management") return null;

    const categoryData = operationData?.new_project;
    const initialData = categoryData?.data || [];
    const pagination = categoryData?.pagination || { page: 1, limit: 10, total: 0, total_pages: 0 };

    return <Invoice initialData={initialData} pagination={pagination} />;
}
