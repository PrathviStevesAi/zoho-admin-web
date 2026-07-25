"use client";

import { useSearchParams } from "next/navigation";
import Planned from "./planned";
import { useDashboard } from "../dashboard-context";

export default function PlannedPage() {
    const searchParams = useSearchParams();
    const view = searchParams.get("view");
    const currentView = view || "guard-management";
    const { operationData } = useDashboard();

    if (currentView !== "guard-management") return null;

    const categoryData = operationData?.shift_planned;
    const initialData = categoryData?.data || [];
    const pagination = categoryData?.pagination || { page: 1, limit: 10, total: 0, total_pages: 0 };

    return <Planned initialData={initialData} pagination={pagination} />;
}
