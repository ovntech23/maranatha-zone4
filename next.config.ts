process.env.PRISMA_CLIENT_ENGINE_TYPE = "library";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
