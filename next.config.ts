import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'www.eafit.edu.co' },
      { protocol: 'https', hostname: 'universidadeafit.widen.net' },
      { protocol: 'https', hostname: 'content01.widen.net' },
      { protocol: 'https', hostname: 'content02.widen.net' },
    ],
  },
};

export default nextConfig;
