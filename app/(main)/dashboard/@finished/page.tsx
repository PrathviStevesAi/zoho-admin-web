import { apiFetch } from "@/lib/api";
import Finished from "./finished";
import { BaseApiResponse, Record } from "@/types/dashboard.types";

export default async function FinishedPage() {
    const response = await apiFetch<BaseApiResponse<Record>>("/api/v1/shift/list?page=1&status=shift_finished");

    return <Finished initialData={response.data} pagination={response.pagination} />;
}
