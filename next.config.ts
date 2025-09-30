import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Remove swcMinify as it's deprecated
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '**',
      },
    ],
    // This is important for local images in development
    unoptimized: process.env.NODE_ENV === 'development',
  },
  // This ensures static files are served properly
  async headers() {
    return [
      {
        source: '/events/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  // Add turbopack configuration to fix lockfile warning
  experimental: {
    turbo: {
      rules: {
        // Add any turbopack rules if needed
      },
    },
  },
};

export default nextConfig;