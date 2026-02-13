import type { NextConfig } from "next";

const API_BACKEND = process.env.API_BACKEND_URL || "http://api:8000";
const AI_BACKEND = process.env.AI_BACKEND_URL || "http://ai-orchestrator:8081";

const nextConfig: NextConfig = {
  // Turbopack enabled via CLI flag --turbopack
  output: "standalone",
  transpilePackages: ["@pdms/shared-types"],
  allowedDevOrigins: ["192.168.1.4", "localhost"],
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${API_BACKEND}/api/:path*` },
      { source: "/ws/:path*", destination: `${API_BACKEND}/ws/:path*` },
      { source: "/ai/:path*", destination: `${AI_BACKEND}/:path*` },
    ];
  },
};

export default nextConfig;
