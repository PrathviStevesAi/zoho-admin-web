"use client";

import { useSearchParams } from "next/navigation";
import Accepted from "./accepted";

export default function AcceptedPage() {
    const searchParams = useSearchParams();
    const view = searchParams.get("view");
    const currentView = view || "guard-management";
    const emptyPagination = { page: 1, limit: 10, total: 0, total_pages: 0 };
    return <Accepted initialData={[]} pagination={emptyPagination} />;
}
