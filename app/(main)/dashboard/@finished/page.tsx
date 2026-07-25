"use client";

import { useSearchParams } from "next/navigation";
import Finished from "./finished";
import { useDashboard } from "../dashboard-context";

export default function FinishedPage() {
    const searchParams = useSearchParams();
    const view = searchParams.get("view");
    const currentView = view || "guard-management";
    const { operationData } = useDashboard();

    if (currentView !== "guard-management") return null;

    const categoryData = operationData?.shift_finished;
    const initialData = categoryData?.data || [];
    const pagination = categoryData?.pagination || { page: 1, limit: 10, total: 0, total_pages: 0 };

    return <Finished initialData={initialData} pagination={pagination} />;
}
