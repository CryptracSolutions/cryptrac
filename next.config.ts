import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    dynamic: "force-dynamic", // Disable static rendering globally (safe for auth-heavy app)
  },
};

export default nextConfig;