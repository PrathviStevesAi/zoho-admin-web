"use client";

import { useSearchParams } from "next/navigation";
import InProgress from "./inprogress";
import { useDashboard } from "../dashboard-context";

export default function InProgressPage() {
    const searchParams = useSearchParams();
    const view = searchParams.get("view");
    const currentView = view || "guard-management";
    const { operationData } = useDashboard();

    if (currentView !== "guard-management") return null;

    const categoryData = operationData?.shift_in_progress;
    const initialData = categoryData?.data || [];
    const pagination = categoryData?.pagination || { page: 1, limit: 10, total: 0, total_pages: 0 };

    return <InProgress initialData={initialData} pagination={pagination} />;
}
