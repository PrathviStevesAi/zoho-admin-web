import { apiFetch } from "@/lib/api";
import Abandon from "./abandon";
import { BaseApiResponse, Record } from "@/types/dashboard.types";

export default async function AbondonPage() {
    const response = await apiFetch<BaseApiResponse<Record>>("/api/v1/shift/list?page=1&status=shift_abandon");

    return <Abandon initialData={response.data} pagination={response.pagination} />;
}
