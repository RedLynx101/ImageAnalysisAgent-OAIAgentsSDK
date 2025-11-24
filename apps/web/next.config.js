/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@repo/shared', '@repo/agent', '@repo/pdf', '@repo/email']
};

module.exports = nextConfig;
