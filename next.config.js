/** @type {import('next').NextConfig} */
const nextConfig = {
  // Environment-specific configuration
  env: {
    // These will be available to both server and client side
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Performance optimizations
  experimental: {
    // Enable optimized package imports for better bundle sizes
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self'",
              "connect-src 'self'",
              "media-src 'self'",
              "object-src 'none'",
              "child-src 'none'",
              "worker-src 'self'",
              "frame-ancestors 'none'",
              "form-action 'self'",
              "base-uri 'self'"
            ].join('; '),
          },
        ],
      },
    ];
  },

  // Rewrites for hybrid architecture
  // NOTE: With the dual API client approach (plainNodeApiClient & nextJsApiClient),
  // most API calls are handled directly. These rewrites serve as fallbacks for
  // any server-side requests or edge cases that still need proxy functionality.
  async rewrites() {
    // Only include rewrites if they're actually needed for server-side requests
    // Since client-side code uses explicit API clients, these can be minimal
    return process.env.NODE_ENV === 'development' ? [
      // Development-only rewrites for debugging or fallback scenarios
      // These help during development if any server-side code accidentally
      // tries to call the Plain Node.js backend endpoints
      {
        source: '/api/auth/register',
        destination: 'http://localhost:3004/api/auth/register',
      },
    ] : [
      // Production rewrites (none needed due to explicit API client usage)
    ];
  },

  // TypeScript configuration
  typescript: {
    // Enable type checking during build
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    // Temporarily disable ESLint during build - we have pre-existing linting issues
    ignoreDuringBuilds: true,
  },

  // Image optimization
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
  },

  // Output configuration for production
  output: 'standalone',

  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Disable webpack cache to avoid WSL/Windows file system issues
    config.cache = false;
    
    // Handle missing optional dependencies
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        canvas: false,
        html2canvas: false,
      };
    }
    
    // Handle externals for server-side rendering
    if (isServer) {
      config.externals = [...(config.externals || []), 'canvas', 'html2canvas'];
    }
    
    // Ignore optional html2canvas dynamic imports in jsPDF
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /node_modules\/jspdf/,
        message: /Can't resolve 'html2canvas'/,
      },
    ];
    
    // Add module resolution alias to ignore html2canvas
    config.resolve.alias = {
      ...config.resolve.alias,
      'html2canvas': false,
    };
    
    return config;
  },
}

module.exports = nextConfig
