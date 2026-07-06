"use client";

import { useSearchParams } from "next/navigation";
import InProgressInvoice from "./planned";

export default function InProgressInvoicePage() {
    const searchParams = useSearchParams();
    const view = searchParams.get("view");
    const currentView = view || "guard-management";

    if (currentView !== "guard-management") return null;

    const emptyPagination = { page: 1, limit: 10, total: 0, total_pages: 0 };
    return <InProgressInvoice initialData={[]} pagination={emptyPagination} />;
}
