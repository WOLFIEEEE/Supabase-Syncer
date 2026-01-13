import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker/Coolify deployment
  // This creates a minimal production build that includes only necessary files
  output: process.env.DOCKER_BUILD === 'true' ? 'standalone' : undefined,
  
  // SECURITY: Remove X-Powered-By header to hide framework information
  poweredByHeader: false,
  
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
  
  // SECURITY: Additional headers for suparbase.com production domain
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        // Static assets - more permissive caching but still secure
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
