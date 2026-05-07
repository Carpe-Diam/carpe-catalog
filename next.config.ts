import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Cloudflare R2 public bucket (primary image source)
      ...(process.env.R2_PUBLIC_URL
        ? [
            {
              protocol: "https" as const,
              hostname: new URL(process.env.R2_PUBLIC_URL).hostname,
              pathname: "/**",
            },
          ]
        : []),
      // Fallback: Zoho domains (used by image proxy before R2 sync)
      {
        protocol: "https",
        hostname: "**.zoho.in",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.zoho.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
