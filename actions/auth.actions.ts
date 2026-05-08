"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function loginAction(formData: { email: string; password: string }) {
    try {
        await signIn("credentials", {
            email: formData.email,
            password: formData.password,
            redirect: false,
        });
        return { success: true };
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return { success: false, error: "Invalid email or password." };
                default:
                    return { success: false, error: "Something went wrong." };
            }
        }

        return { success: false, error: "An unexpected error occurred." };
    }
}

export async function forgotPasswordAction(email: string) {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/user/forgot-password`, {
            method: "POST",
            body: JSON.stringify({ email }),
            headers: {
                "Content-Type": "application/json",
                "ngrok-skip-browser-warning": "true",
            },
        });

        const result = await response.json();

        if (response.ok) {
            return { success: true, message: result.message || "Password reset link sent to your email." };
        } else {
            return { success: false, error: result.message || "Failed to process request." };
        }
    } catch (error) {
        console.error("Forgot Password Error:", error);
        return { success: false, error: "An unexpected error occurred." };
    }
}