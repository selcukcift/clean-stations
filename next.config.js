/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3004/api/:path*', // Backend server (updated to 3004)
      },
    ]
  },
}

module.exports = nextConfig
