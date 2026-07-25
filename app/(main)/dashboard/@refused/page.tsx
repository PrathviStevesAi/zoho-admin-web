"use client";

import { useSearchParams } from "next/navigation";
import Refused from "./refused";
import { useDashboard } from "../dashboard-context";

export default function RefusedPage() {
    const searchParams = useSearchParams();
    const view = searchParams.get("view");
    const currentView = view || "guard-management";
    const { dispatchData } = useDashboard();

    const categoryData = dispatchData?.shift_refused;
    const initialData = categoryData?.data || [];
    const pagination = categoryData?.pagination || { page: 1, limit: 10, total: 0, total_pages: 0 };

    return <Refused initialData={initialData} pagination={pagination} />;
}
