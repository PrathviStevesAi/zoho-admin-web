import NextAuth, { type DefaultSession } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
    interface Session {
        accessToken?: string;
        error?: "RefreshAccessTokenError";
        user: {
            id: string;
            role: string;
        } & DefaultSession["user"]
    }

    interface User {
        role?: string;
        accessToken?: string;
        refreshToken?: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        accessToken: string;
        refreshToken: string;
        expiresAt: number;
        role: string;
        error?: "RefreshAccessTokenError";
    }
}