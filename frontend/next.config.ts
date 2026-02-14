import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";
const API_BACKEND = process.env.API_BACKEND_URL || (isDev ? "http://localhost:8000" : "http://api:8000");
const AI_BACKEND = process.env.AI_BACKEND_URL || (isDev ? "http://localhost:8081" : "http://ai-orchestrator:8081");

const nextConfig: NextConfig = {
  // Turbopack enabled via CLI flag --turbopack
  output: "standalone",
  transpilePackages: ["@pdms/shared-types"],
  allowedDevOrigins: ["192.168.1.4", "localhost"],
  devIndicators: false,
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${API_BACKEND}/api/:path*` },
      { source: "/ws/:path*", destination: `${API_BACKEND}/ws/:path*` },
      { source: "/media/:path*", destination: `${API_BACKEND}/media/:path*` },
      { source: "/ai/:path*", destination: `${AI_BACKEND}/:path*` },
    ];
  },
};

export default nextConfig;
