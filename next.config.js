/** @type {import('next').NextConfig} */
const nextConfig = {
  // Proxy to backend (used in development)
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/:path*`,
        // This is overridden by the API Route files in production
      },
    ];
  },
};

module.exports = nextConfig;
