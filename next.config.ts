import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true, // optional, recommended
  swcMinify: true,       // optional, enables faster minification
  images: {
    domains: ["picsum.photos"], // allow loading images from this external host
  },
};

export default nextConfig;
