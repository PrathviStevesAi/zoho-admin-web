import { apiFetch } from "@/lib/api";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || "1";
    const priority = searchParams.get("priority");
    const countOnly = searchParams.get("count_only");

    try {
        if (countOnly === "true") {
            const response = await apiFetch(`/api/v1/notification/?count_only=true`);
            return NextResponse.json(response);
        }

        let url = `/api/v1/notification/?page=${page}&count_only=false`;
        if (priority) {
            url += `&priority=${priority}`;
        }
        const response = await apiFetch(url);
        return NextResponse.json(response);
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
