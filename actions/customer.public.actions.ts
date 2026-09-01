"use server";

export async function publicRegisterCustomerAction(customerData: any) {
    try {
        const apiKey = "trk_live_7f9c2a4d8b1e5f6a9c3d2e7f8a1b4c6d";

        console.log("Sending public customer registration data:", customerData);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/customer/register`, {
            method: "POST",
            body: JSON.stringify(customerData),
            headers: {
                "Content-Type": "application/json",
                "ngrok-skip-browser-warning": "true",
                "x-api-key": apiKey
            },
        });

        console.log("Public Customer Registration API Response Status:", response.status);
        const result = await response.json();

        if (response.ok) {
            return { success: true, data: result };
        } else {
            console.error("Public Customer Registration API Failure Body:", result);
            const errorMsg = result.detail?.error || (typeof result.detail === 'string' ? result.detail : null) || result.error || result.message || result.msg || "Customer registration failed";
            return {
                success: false,
                error: errorMsg
            };
        }
    } catch (error) {
        console.error("Public Customer Registration Error:", error);
        return { success: false, error: "An unexpected error occurred." };
    }
}

export async function verifyCustomerEmailAction(email: string) {
    try {
        const apiKey = "trk_live_7f9c2a4d8b1e5f6a9c3d2e7f8a1b4c6d";
        const url = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/customer/verify/?email=${encodeURIComponent(email)}`;

        console.log("Verifying customer email:", email);
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "ngrok-skip-browser-warning": "true",
                "x-api-key": apiKey
            },
        });

        const result = await response.json();

        if (response.ok && result.success !== false) {
            return { success: true, data: result.data };
        } else {
            console.error("Customer Verification API Failure:", result);
            return { success: false, error: result.detail?.error || result.message || result.msg || "Failed to verify email" };
        }
    } catch (error) {
        console.error("Verify Customer Email Error:", error);
        return { success: false, error: "An unexpected error occurred." };
    }
}
