import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker/Coolify deployment
  // This creates a minimal production build that includes only necessary files
  output: process.env.DOCKER_BUILD === 'true' ? 'standalone' : undefined,
  
  // Suppress experimental warnings
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  
  // Optimize images for production
  images: {
    unoptimized: process.env.NODE_ENV === "development",
  },
  
  // Environment variables validation
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || (process.env.NODE_ENV === 'production' ? "https://suparbase.com" : "http://localhost:3000"),
  },
};

export default nextConfig;
