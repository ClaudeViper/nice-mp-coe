import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  // Help Turbopack resolve Radix UI packages that use subpath exports
  transpilePackages: [
    "@radix-ui/react-tabs",
    "@radix-ui/react-progress",
    "@radix-ui/react-select",
    "@radix-ui/react-tooltip",
  ],
};

export default nextConfig;
