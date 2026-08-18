"use client";

import { useSearchParams } from "next/navigation";
import NotApproved from "./notapproved";
import { useDashboard } from "../dashboard-context";

export default function NotApprovedPage() {
    const searchParams = useSearchParams();
    const view = searchParams.get("view");
    const currentView = view || "guard-management";
    const { operationData } = useDashboard();

    if (currentView !== "guard-management") return null;

    const categoryData = operationData?.shift_not_approved;
    const initialData = categoryData?.data || [];
    const pagination = categoryData?.pagination || { page: 1, limit: 10, total: 0, total_pages: 0 };

    return <NotApproved initialData={initialData} pagination={pagination} />;
}
