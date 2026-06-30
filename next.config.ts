import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    // Use webpack bundler for stable Vercel production builds
    // Turbopack is only used in dev mode via `next dev --turbopack`
  },
};

export default nextConfig;
