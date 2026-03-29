import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prisma + monorepo DB package: keep server-side env reads at runtime where possible.
  serverExternalPackages: ['@estateiq/database', 'prisma', '@prisma/client'],

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options',           value: 'DENY'              },
          { key: 'X-Content-Type-Options',    value: 'nosniff'           },
          { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-XSS-Protection',          value: '1; mode=block'     },
        ],
      },
    ]
  },


  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
