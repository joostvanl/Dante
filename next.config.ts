import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone is for Docker/Pi; Vercel uses its own bundler.
  ...(process.env.DOCKER === "1" ? { output: "standalone" as const } : {}),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "aurora-api.joostvanleeuwaarden.com",
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;
