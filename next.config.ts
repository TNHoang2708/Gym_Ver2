import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: 'export', // Required for Capacitor native bundle, but disabled here because we use Next.js API routes (/api/*). 
  // In a real production environment with Capacitor, API routes must be hosted externally.
};

export default nextConfig;
