import { apiFetch } from "@/lib/api";
import { NextResponse } from "next/server";

// Prevent Next.js from caching this route - notifications must always be fresh
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || "1";
    
    try {
        const response = await apiFetch(`/api/v1/notification/?page=${page}`);
        return NextResponse.json(response);
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
