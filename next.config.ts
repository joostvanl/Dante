import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone is for Docker/Pi; Vercel uses its own bundler.
  ...(process.env.DOCKER === "1" ? { output: "standalone" as const } : {}),
};

export default nextConfig;
