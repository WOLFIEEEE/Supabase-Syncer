import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Note: output: "standalone" is only for Docker deployment
  // Vercel uses its own build system, so we don't set it here
  // If deploying to Docker, uncomment: output: "standalone",
  
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
