"use client";

import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";

export function LogoutButton() {
    const handleLogout = async () => {
        await signOut({
            callbackUrl: "/admin-login",
            redirect: true
        });
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