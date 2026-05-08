import { apiFetch } from "@/lib/api";
import Created from "./planned";
import { BaseApiResponse, Record } from "@/types/dashboard.types";

export default async function CreatedPage() {
    const response = await apiFetch<BaseApiResponse<Record>>("/api/v1/shift/list?page=1&status=shift_created");

    return <Created initialData={response.data} pagination={response.pagination} />;
}
