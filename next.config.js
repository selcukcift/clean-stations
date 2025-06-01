/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      // Backend auth endpoints - need to keep these for login to work
      {
        source: '/api/auth/login',
        destination: 'http://localhost:3004/api/auth/login',
      },
      {
        source: '/api/auth/register',
        destination: 'http://localhost:3004/api/auth/register',
      },
      {
        source: '/api/parts/:path*',
        destination: 'http://localhost:3004/api/parts/:path*', // Backend parts endpoints
      },
      {
        source: '/api/assemblies/:path*',
        destination: 'http://localhost:3004/api/assemblies/:path*', // Backend assemblies endpoints
      },
      {
        source: '/api/categories/:path*',
        destination: 'http://localhost:3004/api/categories/:path*', // Backend categories endpoints
      },
      // Add other specific backend endpoints as needed
      // NOTE: Do not forward /api/configurator, /api/accessories, /api/orders as they are handled by Next.js API routes
    ]
  },
}

module.exports = nextConfig
