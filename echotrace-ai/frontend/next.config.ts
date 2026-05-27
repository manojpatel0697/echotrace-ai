import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Silence noisy hydration warnings from browser extensions in dev
  reactStrictMode: true,
};

export default nextConfig;
