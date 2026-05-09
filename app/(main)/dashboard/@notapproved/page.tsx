import { apiFetch } from "@/lib/api";
import NotApproved from "./notapproved";
import { BaseApiResponse, Record } from "@/types/dashboard.types";

export default async function NotApprovedPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { view } = await searchParams;
    const currentView = view || "guard-management";

    if (currentView !== "shift-management") return null;

    const response = await apiFetch<BaseApiResponse<Record>>("/api/v1/shift/list?page=1&status=shift_not_approved");

    return <NotApproved initialData={response.data} pagination={response.pagination} />;
}
