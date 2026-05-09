import { apiFetch } from "@/lib/api";
import Planned from "./planned";
import { BaseApiResponse, Record } from "@/types/dashboard.types";

export default async function PlannedPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { view } = await searchParams;
    const currentView = view || "guard-management";

    if (currentView !== "guard-management") return null;

    const response = await apiFetch<BaseApiResponse<Record>>("/api/v1/shift/list?page=1&status=shift_planned");

    return <Planned initialData={response.data} pagination={response.pagination} />;
}
