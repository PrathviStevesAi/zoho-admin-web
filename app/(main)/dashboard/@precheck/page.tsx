import { apiFetch } from "@/lib/api";
import { BaseApiResponse, Record } from "@/types/dashboard.types";
import Precheck from "./precheck";

export default async function PrecheckPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { view } = await searchParams;
    const currentView = view || "guard-management";

    if (currentView !== "guard-management") return null;

    const response = await apiFetch<BaseApiResponse<Record>>("/api/v1/shift/list?page=1&status=shift_pre_check_in");

    return <Precheck initialData={response.data} pagination={response.pagination} />;
}
