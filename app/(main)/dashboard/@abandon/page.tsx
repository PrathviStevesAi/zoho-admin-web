"use client";

import { useSearchParams } from "next/navigation";
import Abandon from "./abandon";

export default function AbandonPage() {
    const searchParams = useSearchParams();
    const view = searchParams.get("view");
    const currentView = view || "guard-management";
    const emptyPagination = { page: 1, limit: 10, total: 0, total_pages: 0 };
    return <Abandon initialData={[]} pagination={emptyPagination} />;
}
