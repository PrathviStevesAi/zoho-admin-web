"use client";
import { useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

export function AuthErrorHandler() {
    const { data: session } = useSession();
    const pathname = usePathname();

    useEffect(() => {
        if (session?.error === "RefreshAccessTokenError") {
            if (pathname === "/admin-login") {
                // If we are already on the login page, clear the cookies/session without redirecting
                signOut({ redirect: false });
            } else {
                // If we are on dashboard or any other route, redirect to login
                signOut({ callbackUrl: "/admin-login" });
            }
        }
    }, [session, pathname]);

    return null;
}
