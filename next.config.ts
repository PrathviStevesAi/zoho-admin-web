import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    AUTH_SECRET: process.env.AUTH_SECRET,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    AUTH_URL: process.env.AUTH_URL,
    AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST,
  },
};

export default nextConfig;