import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack enabled via CLI flag --turbopack
  transpilePackages: ["@pdms/shared-types"],
  async rewrites() {
    return [
      { source: "/api/:path*", destination: "http://localhost:8000/api/:path*" },
      { source: "/ws/:path*", destination: "http://localhost:8000/ws/:path*" },
    ];
  },
};

export default nextConfig;
