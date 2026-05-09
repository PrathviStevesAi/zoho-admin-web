import { apiFetch } from "@/lib/api";
import Invoice from "./invoice";
import { BaseApiResponse, InvoiceData } from "@/types/dashboard.types";

export default async function InvoicePage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { view } = await searchParams;
    const currentView = view || "guard-management";

    if (currentView !== "guard-management") return null;

    const response = await apiFetch<BaseApiResponse<InvoiceData>>("/api/v1/invoice/list?page=1");

    return <Invoice initialData={response.data} pagination={response.pagination} />;
}
