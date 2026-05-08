import { apiFetch } from "@/lib/api";
import Refused from "./refused";
import { BaseApiResponse, Record } from "@/types/dashboard.types";

export default async function RefusedPage() {
    const response = await apiFetch<BaseApiResponse<Record>>("/api/v1/shift/list?page=1&status=shift_refused");
    console.log("Refused API Response:", response);
    return <Refused initialData={response.data} pagination={response.pagination} />;
}
