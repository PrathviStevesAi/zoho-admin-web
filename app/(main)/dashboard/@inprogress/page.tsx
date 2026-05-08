import { apiFetch } from "@/lib/api";
import Inprogress from "./inprogress";
import { BaseApiResponse, Record } from "@/types/dashboard.types";

export default async function InprogressPage() {
    const response = await apiFetch<BaseApiResponse<Record>>("/api/v1/shift/list?page=1&status=shift_in_progress");

    return <Inprogress initialData={response.data} pagination={response.pagination} />;
}
