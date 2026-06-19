"use client";

import { Button } from "@/components/ui/button";
import { logoutAction } from "@/actions/auth.actions";

export function LogoutButton() {
    return (
        <Button
            className="cursor-pointer"
            variant="destructive"
            size="lg"
            onClick={() => logoutAction()}
        >
            Logout
        </Button>
    );
}