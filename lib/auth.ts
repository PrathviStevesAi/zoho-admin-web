import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

console.log("AUTH_SECRET exists:", !!process.env.AUTH_SECRET);
console.log("NEXTAUTH_SECRET exists:", !!process.env.NEXTAUTH_SECRET);

export const { handlers, auth, signIn, signOut } = NextAuth({
    trustHost: true,
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                try {
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/user/login`, {
                        method: "POST",
                        body: JSON.stringify({
                            email: credentials.email,
                            password: credentials.password,
                        }),
                        headers: {
                            "Content-Type": "application/json",
                            "ngrok-skip-browser-warning": "true"
                        },
                    });

                    const text = await res.text();

                    if (!res.ok) {
                        const trimmedText = text.trim().toLowerCase();
                        if (trimmedText.startsWith("<!doctype") || trimmedText.startsWith("<html") || res.status >= 500) {
                            throw new Error("Service is currently unreachable. Please check your connection or try again later.");
                        }

                        let result: any = null;
                        try {
                            result = JSON.parse(text);
                        } catch { }

                        const errorMsg = result?.detail?.error || result?.message || result?.error || "Invalid email or password.";
                        throw new Error(errorMsg);
                    }

                    let result: any = null;
                    try {
                        result = JSON.parse(text);
                    } catch (err) {
                        console.error("Auth login JSON parse error. Response starts with:", text.substring(0, 200));
                        throw new Error("Service is currently unreachable. Please check your connection or try again later.");
                    }

                    if (result && result.data) {
                        return {
                            id: result.data.user_id,
                            accessToken: result.access_token,
                            refreshToken: result.refresh_token,
                            role: result.data.role || result.role,
                            email: credentials.email as string,
                        };
                    }
                    return null;
                } catch (error: any) {
                    if (error.message?.includes("fetch failed") || error.code === "ECONNRESET" || error.cause?.code === "ECONNRESET") {
                        throw new Error("Service is currently unreachable. Please check your connection or try again later.");
                    }
                    throw error;
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {

                return {
                    ...token,
                    accessToken: user.accessToken,
                    refreshToken: user.refreshToken,
                    role: user.role,
                    expiresAt: Math.floor(Date.now() / 1000) + 3600,
                };
            }

            if (Date.now() < (token.expiresAt as number) * 1000) {
                return token;
            }

            return await refreshAccessToken(token);
        },
        async session({ session, token }) {
            if (token) {

                session.accessToken = token.accessToken;
                session.user.id = token.sub as string;
                session.user.role = token.role;
                session.error = token.error;
            }
            return session;
        },
    },
    pages: {
        signIn: "/admin-login",
    },
    // local & production
    secret: process.env.AUTH_SECRET,
});


const refreshPromises = new Map<string, Promise<any>>();

async function refreshAccessToken(token: any) {
    const key = token.refreshToken;

    if (key && refreshPromises.has(key)) {
        try {
            const newTokens = await refreshPromises.get(key);
            return {
                ...token,
                accessToken: newTokens.accessToken,
                expiresAt: newTokens.expiresAt,
                refreshToken: newTokens.refreshToken,
            };
        } catch (err) {
            return { ...token, error: "RefreshAccessTokenError" };
        }
    }

    const promise = (async () => {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/user/refresh`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "ngrok-skip-browser-warning": "true"
            },
            body: JSON.stringify({ refresh_token: token.refreshToken }),
        });

        const text = await response.text();
        let refreshedTokens: any = null;
        try {
            refreshedTokens = JSON.parse(text);
        } catch (err) {
            console.error("Auth refresh token JSON parse error. Response starts with:", text.substring(0, 200));
            throw new Error("Invalid refresh token response format");
        }

        if (!response.ok) throw refreshedTokens;

        const newAccessToken = refreshedTokens.data?.access_token || refreshedTokens.access_token;
        const newRefreshToken = refreshedTokens.data?.refresh_token || refreshedTokens.refresh_token || token.refreshToken;

        return {
            accessToken: newAccessToken,
            expiresAt: Math.floor(Date.now() / 1000) + 3600,
            refreshToken: newRefreshToken,
        };
    })();

    if (key) {
        refreshPromises.set(key, promise);
    }

    try {
        const newTokens = await promise;
        if (key) setTimeout(() => refreshPromises.delete(key), 10000);
        return {
            ...token,
            accessToken: newTokens.accessToken,
            expiresAt: newTokens.expiresAt,
            refreshToken: newTokens.refreshToken,
        };
    } catch (error) {
        if (key) setTimeout(() => refreshPromises.delete(key), 10000);
        return { ...token, error: "RefreshAccessTokenError" };
    }
}
