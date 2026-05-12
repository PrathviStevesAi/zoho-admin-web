import { apiFetch } from "@/lib/api";
import { NextResponse } from "next/server";

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const response = await apiFetch(`/api/v1/notification/fcm-token`, {
            method: "PUT",
            body: JSON.stringify(body),
        });
        return NextResponse.json(response);
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
