"use client";

import { useSearchParams } from "next/navigation";
import Arrival from "./arrival";
import { useDashboard } from "../dashboard-context";

export default function ArrivalPage() {
    const searchParams = useSearchParams();
    const view = searchParams.get("view");
    const currentView = view || "guard-management";
    const { operationData } = useDashboard();

    if (currentView !== "guard-management") return null;

    const categoryData = operationData?.shift_arrival;
    const initialData = categoryData?.data || [];
    const pagination = categoryData?.pagination || { page: 1, limit: 10, total: 0, total_pages: 0 };

    return <Arrival initialData={initialData} pagination={pagination} />;
}
