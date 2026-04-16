import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fix workspace root inference issues
  // @ts-ignore - The types might not have caught up with the latest Turbopack config keys
  turbopack: {
    root: ".",
  },
};

export default nextConfig;
