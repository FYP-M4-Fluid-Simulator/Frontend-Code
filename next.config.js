/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {
      // Leaving this empty tells Next.js you acknowledge Turbopack is active
    },
  transpilePackages: [
    'lucide-react',
    'recharts',
    'motion',
  ],
  webpack: (config) => {
    // Handle virtual figma:asset imports
    config.resolve.alias['figma:asset'] = false;
    return config;
  },
};

module.exports = nextConfig;