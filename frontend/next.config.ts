import type { NextConfig } from "next";

const API_BACKEND = process.env.API_BACKEND_URL || "http://pdms-api:8000";

const nextConfig: NextConfig = {
  // Turbopack enabled via CLI flag --turbopack
  transpilePackages: ["@pdms/shared-types"],
  allowedDevOrigins: ["192.168.1.4", "localhost"],
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${API_BACKEND}/api/:path*` },
      { source: "/ws/:path*", destination: `${API_BACKEND}/ws/:path*` },
    ];
  },
};

export default nextConfig;
