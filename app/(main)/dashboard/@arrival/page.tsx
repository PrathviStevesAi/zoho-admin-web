import { apiFetch } from "@/lib/api";
import Arrival from "./arrival";
import { BaseApiResponse, Record } from "@/types/dashboard.types";

export default async function ArrivalPage() {
    const response = await apiFetch<BaseApiResponse<Record>>("/api/v1/shift/list?page=1&status=shift_finished");

    return <Arrival initialData={response.data} pagination={response.pagination} />;
}
