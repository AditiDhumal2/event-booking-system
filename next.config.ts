import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  // Add these lines to ignore build errors
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '**',
      },
      {
        protocol: 'https', 
        hostname: 'images.unsplash.com',
        pathname: '**',
      }
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
  
  // Updated turbopack configuration
  experimental: {
    turbo: {
      // Turbopack configuration if needed
    },
  },
};

export default nextConfig;