"use client";

import { useSearchParams } from "next/navigation";
import Planned from "./planned";

export default function PlannedPage() {
    const searchParams = useSearchParams();
    const view = searchParams.get("view");
    const currentView = view || "guard-management";

    if (currentView !== "guard-management") return null;

    const emptyPagination = { page: 1, limit: 10, total: 0, total_pages: 0 };
    return <Planned initialData={[]} pagination={emptyPagination} />;
}
