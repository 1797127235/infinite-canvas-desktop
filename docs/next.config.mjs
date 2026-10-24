import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  output: 'standalone',
  reactStrictMode: true,
  async rewrites() {
    return [
      { source: '/', destination: '/zh-CN' },
      { source: '/docs/:path*', destination: '/zh-CN/docs/:path*' },
    ];
  },
};

export default withMDX(config);