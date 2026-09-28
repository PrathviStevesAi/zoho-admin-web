import { apiFetch } from "@/lib/api";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const session = (await auth()) as any;
    if (!session?.accessToken || (session?.user?.role !== "admin" && session?.user?.role !== "member")) {
      return NextResponse.json({ success: false, has_active_call: false, data: null });
    }

    const response = await apiFetch<any>(`/api/v1/twilio/video/active`, {
      method: "GET",
      headers: {
        "x-api-key": "trk_live_7f9c2a4d8b1e5f6a9c3d2e7f8a1b4c6d",
      },
    });
    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, has_active_call: false, error: error.message },
      { status: 200 }
    );
  }
}
