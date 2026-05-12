import { apiFetch } from "@/lib/api";
import Created from "./planned";
import { BaseApiResponse, Record } from "@/types/dashboard.types";

export default async function CreatedPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { view, date_from, date_to } = await searchParams;
    const currentView = view || "guard-management";

    if (currentView !== "guard-management") return null;

    const dateFrom = typeof date_from === "string" ? date_from : "";
    const dateTo = typeof date_to === "string" ? date_to : "";

    const params = [];
    if (!dateFrom && !dateTo) params.push("page=1");
    if (dateFrom) params.push(`date_from=${dateFrom}`);
    if (dateTo) params.push(`date_to=${dateTo}`);

    const url = `/api/v1/shift/list?status=shift_created${params.length > 0 ? '&' + params.join("&") : ""}`;

    let response;
    try {
        response = await apiFetch<BaseApiResponse<Record>>(url);
    } catch (error) {
        console.error("Failed to fetch created shifts:", error);
        response = { data: [], pagination: { page: 1, limit: 10, total: 0, total_pages: 0 } };
    }

    return <Created initialData={response.data} pagination={response.pagination} />;
}
