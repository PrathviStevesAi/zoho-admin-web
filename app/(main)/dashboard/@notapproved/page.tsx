"use client";

import { useSearchParams } from "next/navigation";
import NotApproved from "./notapproved";

export default function NotApprovedPage() {
    const searchParams = useSearchParams();
    const view = searchParams.get("view");
    const currentView = view || "guard-management";

    

    const emptyPagination = { page: 1, limit: 10, total: 0, total_pages: 0 };
    return <NotApproved initialData={[]} pagination={emptyPagination} />;
}
