import { apiFetch } from "@/lib/api";
import Approved from "./approved";
import { BaseApiResponse, Record } from "@/types/dashboard.types";

export default async function ApprovedPage() {
    const response = await apiFetch<BaseApiResponse<Record>>("/api/v1/shift/list?page=1&status=shift_approved");

    return <Approved initialData={response.data} pagination={response.pagination} />;
}
