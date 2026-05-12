import { apiFetch } from "@/lib/api";
import Invoice from "./invoice";
import { BaseApiResponse, InvoiceData } from "@/types/dashboard.types";

export default async function InvoicePage({
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

    const url = `/api/v1/invoice/list${params.length > 0 ? '?' + params.join("&") : ""}`;

    const response = await apiFetch<BaseApiResponse<InvoiceData>>(url);

    return <Invoice initialData={response.data} pagination={response.pagination} />;
}
