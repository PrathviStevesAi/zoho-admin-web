import { apiFetch } from "@/lib/api";
import Abandon from "./abandon";
import { BaseApiResponse, Record } from "@/types/dashboard.types";

export default async function AbondonPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { view } = await searchParams;
    const currentView = view || "guard-management";

    if (currentView !== "shift-management") return null;

    const response = await apiFetch<BaseApiResponse<Record>>("/api/v1/shift/list?page=1&status=shift_abandon");

    return <Abandon initialData={response.data} pagination={response.pagination} />;
}
