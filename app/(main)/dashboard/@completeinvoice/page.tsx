"use client";

import { useSearchParams } from "next/navigation";
import CompleteInvoice from "./complete-invoice";
import { useDashboard } from "../dashboard-context";

export default function CompleteInvoicePage() {
    const searchParams = useSearchParams();
    const view = searchParams.get("view");
    const currentView = view || "guard-management";
    const { dispatchData } = useDashboard();

    if (currentView === "guard-management") return null;

    const categoryData = dispatchData?.complete;
    const initialData = categoryData?.data || [];
    const pagination = categoryData?.pagination || { page: 1, limit: 10, total: 0, total_pages: 0 };

    return <CompleteInvoice initialData={initialData} pagination={pagination} />;
}
