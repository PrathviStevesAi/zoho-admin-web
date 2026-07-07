"use client";

import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";

export function LogoutButton() {
    const handleLogout = async () => {
        await signOut({ redirect: false });
        window.location.href = "/admin-login";
    };

    return (
        <Button
            className="cursor-pointer"
            variant="destructive"
            size="lg"
            onClick={handleLogout}
        >
            Logout
        </Button>
    );
}