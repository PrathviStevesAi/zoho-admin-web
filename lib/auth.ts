import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

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
                const result = await res.json();

                if (res.ok && result) {
                    return {
                        id: result.data.user_id,
                        accessToken: result.access_token,
                        refreshToken: result.refresh_token,
                        role: result.role,
                        email: credentials.email as string,
                    };
                }
                return null;
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
    secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
});



async function refreshAccessToken(token: any) {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/user/refresh`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "ngrok-skip-browser-warning": "true"
            },
            body: JSON.stringify({ refresh_token: token.refreshToken }),
        });

        const refreshedTokens = await response.json();
        if (!response.ok) throw refreshedTokens;

        const newAccessToken = refreshedTokens.data?.access_token || refreshedTokens.access_token;
        const newRefreshToken = refreshedTokens.data?.refresh_token || refreshedTokens.refresh_token || token.refreshToken;

        return {
            ...token,
            accessToken: newAccessToken,
            expiresAt: Math.floor(Date.now() / 1000) + 3600,
            refreshToken: newRefreshToken,
        };
    } catch (error) {
        return { ...token, error: "RefreshAccessTokenError" };
    }
}