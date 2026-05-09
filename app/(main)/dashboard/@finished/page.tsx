import { apiFetch } from "@/lib/api";
import Finished from "./finished";
import { BaseApiResponse, Record } from "@/types/dashboard.types";

export default async function FinishedPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { view } = await searchParams;
    const currentView = view || "guard-management";

    if (currentView !== "guard-management") return null;

    const response = await apiFetch<BaseApiResponse<Record>>("/api/v1/shift/list?page=1&status=shift_finished");

    return <Finished initialData={response.data} pagination={response.pagination} />;
}
