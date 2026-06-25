import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @ts-ignore
  allowedDevOrigins: ['192.168.1.59', '10.12.20.171', 'smooth-papayas-decide.loca.lt', 'wet-files-kick.loca.lt'],
  // output: 'export', // Required for Capacitor native bundle, but disabled here because we use Next.js API routes (/api/*). 
  // In a real production environment with Capacitor, API routes must be hosted externally.
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
