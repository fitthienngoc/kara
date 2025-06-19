/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  distDir: 'out',
  assetPrefix: './',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
