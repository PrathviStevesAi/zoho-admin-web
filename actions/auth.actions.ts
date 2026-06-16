"use server";

import { signIn, auth } from "@/lib/auth";
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

export async function registerUserAction(userData: any) {
    try {
        const session = await auth();
        const token = session?.accessToken;

        const { role, ...cleanUserData } = userData;

        console.log("Sending registration data:", cleanUserData);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/member/register`, {
            method: "POST",
            body: JSON.stringify(cleanUserData),
            headers: {
                "Content-Type": "application/json",
                "ngrok-skip-browser-warning": "true",
                "Authorization": `Bearer ${token}`
            },
        });

        console.log("Registration API Response Status:", response.status);
        const result = await response.json();

        if (response.ok) {
            return { success: true, data: result.data };
        } else {
            console.error("Registration API Failure Body:", result);
            const errorMsg = result.detail?.error || (typeof result.detail === 'string' ? result.detail : null) || result.error || result.message || result.msg || "Registration failed";
            return {
                success: false,
                error: errorMsg
            };
        }
    } catch (error) {
        console.error("Registration Error:", error);
        return { success: false, error: "An unexpected error occurred." };
    }
}

export async function registerGuardAction(guardData: any) {
    try {
        const session = await auth();
        const token = session?.accessToken;

        console.log("Sending guard registration data:", guardData);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/guards/register`, {
            method: "POST",
            body: JSON.stringify(guardData),
            headers: {
                "Content-Type": "application/json",
                "ngrok-skip-browser-warning": "true",
                "Authorization": `Bearer ${token}`
            },
        });

        console.log("Guard Registration API Response Status:", response.status);
        const result = await response.json();

        if (response.ok) {
            return { success: true, data: result };
        } else {
            console.error("Guard Registration API Failure Body:", result);
            const errorMsg = result.detail?.error || (typeof result.detail === 'string' ? result.detail : null) || result.error || result.message || result.msg || "Guard registration failed";
            return {
                success: false,
                error: errorMsg
            };
        }
    } catch (error) {
        console.error("Guard Registration Error:", error);
        return { success: false, error: "An unexpected error occurred." };
    }
}

export async function sendOtpAction(email: string) {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/user/forgot-password/send-otp`, {
            method: "POST",
            body: JSON.stringify({ email }),
            headers: {
                "Content-Type": "application/json",
                "ngrok-skip-browser-warning": "true",
            },
        });

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const result = await response.json();
            if (response.ok) {
                return { success: true, message: result.message || "OTP sent successfully." };
            } else {
                const errorMsg = result.detail?.error || (typeof result.detail === 'string' ? result.detail : null) || result.message || "Failed to send OTP.";
                return { success: false, error: errorMsg };
            }
        } else {
            const text = await response.text();
            console.error("Send OTP Non-JSON response:", text);
            return { success: false, error: `API Error ${response.status}: ${text.includes('ngrok') ? 'ngrok limit reached' : 'Invalid Server Response'}` };
        }
    } catch (error) {
        console.error("Send OTP Error:", error);
        return { success: false, error: "An unexpected error occurred." };
    }
}

export async function verifyOtpAction(email: string, otp: string) {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/user/forgot-password/verify-otp`, {
            method: "POST",
            body: JSON.stringify({ email, otp }),
            headers: {
                "Content-Type": "application/json",
                "ngrok-skip-browser-warning": "true",
            },
        });

        const result = await response.json();
        console.log("Verify OTP API Status:", response.status);
        console.log("Verify OTP API Result:", result);

        if (response.ok) {
            return {
                success: true,
                accessToken: result.data?.access_token || result.access_token,
                refreshToken: result.data?.refresh_token || result.refresh_token
            };
        } else {
            const errorMsg = result.detail?.error || (typeof result.detail === 'string' ? result.detail : null) || result.message || "Invalid OTP.";
            return { success: false, error: errorMsg };
        }
    } catch (error) {
        console.error("Verify OTP Error:", error);
        return { success: false, error: "An unexpected error occurred." };
    }
}

export async function resetPasswordAction(newPassword: string, accessToken: string, refreshToken?: string) {
    try {
        const payload: any = {
            new_password: newPassword,
            access_token: accessToken
        };

        if (refreshToken) {
            payload.refresh_token = refreshToken;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/user/forgot-password/reset`, {
            method: "POST",
            body: JSON.stringify(payload),
            headers: {
                "Content-Type": "application/json",
                "ngrok-skip-browser-warning": "true",
            },
        });

        const result = await response.json();
        console.log("Reset Password API Status:", response.status);
        console.log("Reset Password API Result:", result);

        if (response.ok) {
            return { success: true, message: result.message || "Password reset successfully." };
        } else {
            const errorMsg = result.detail?.error || result.message || "Failed to reset password.";
            return { success: false, error: errorMsg };
        }
    } catch (error) {
        console.error("Reset Password Error:", error);
        return { success: false, error: "An unexpected error occurred." };
    }
}

export async function fetchMembersAction() {
    try {
        const session = await auth();
        const token = session?.accessToken;

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/member/list`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "ngrok-skip-browser-warning": "true",
                "Authorization": `Bearer ${token}`
            },
        });

        const result = await response.json();

        if (response.ok) {
            return { success: true, data: result.data };
        } else {
            return { success: false, error: result.message || "Failed to fetch members" };
        }
    } catch (error) {
        console.error("Fetch Members Error:", error);
        return { success: false, error: "An unexpected error occurred." };
    }
}

export async function deleteMemberAction(memberId: string) {
    try {
        const session = await auth();
        const token = session?.accessToken;

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/member/${memberId}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "ngrok-skip-browser-warning": "true",
                "Authorization": `Bearer ${token}`
            },
        });

        const result = await response.json();
        console.log("Delete Member API Status:", response.status);
        console.log("Delete Member API Result:", result);

        if (response.ok) {
            return { success: true, message: result.message || "Member deleted successfully" };
        } else {
            const errorMsg = result.detail?.error || result.message || "Failed to delete member";
            return { success: false, error: errorMsg };
        }
    } catch (error) {
        console.error("Delete Member Error:", error);
        return { success: false, error: "An unexpected error occurred." };
    }
}