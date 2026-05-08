"use client";
import { useEffect } from "react";
import { useSession, signOut } from "next-auth/react";

export function AuthErrorHandler() {
    const { data: session } = useSession();

    useEffect(() => {
        if (session?.error === "RefreshAccessTokenError") {
            signOut({ callbackUrl: "/admin-login" });
        }
    }, [session]);

    return null; // Ye kuch render nahi karega
}
