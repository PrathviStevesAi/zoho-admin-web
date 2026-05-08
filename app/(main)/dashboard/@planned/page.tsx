import { apiFetch } from "@/lib/api";
import Planned from "./planned";
import { BaseApiResponse, Record } from "@/types/dashboard.types";

export default async function PlannedPage() {
    const response = await apiFetch<BaseApiResponse<Record>>("/api/v1/shift/list?page=1&status=shift_finished");

    return <Planned initialData={response.data} pagination={response.pagination} />;
}
