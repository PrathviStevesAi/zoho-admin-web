import { apiFetch } from "@/lib/api";
import Accepted from "./accepted";
import { BaseApiResponse, Record } from "@/types/dashboard.types";

export default async function AcceptedPage() {
    const response = await apiFetch<BaseApiResponse<Record>>("/api/v1/shift/list?page=1&status=shift_accepted");

    return <Accepted initialData={response.data} pagination={response.pagination} />;
}
