import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Set root directory to this project
    root: __dirname,
  },
  // Suppress experimental warnings
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
