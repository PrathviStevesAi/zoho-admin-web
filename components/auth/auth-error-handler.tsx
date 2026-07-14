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
                signOut({ redirect: false });
            } else {
                signOut({ redirect: false }).then(() => {
                    window.location.href = "/admin-login";
                });
            }
        }
    }, [session, pathname]);

    return null;
}
