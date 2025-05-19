/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  
  // Disable static page generation - forces dynamic rendering
  staticPageGenerationTimeout: 0,
  
  // Configure API routes
  api: {
    responseLimit: false,
    externalResolver: true,
  },
  
  // Add experimental options to prevent optimization that could cause caching
  experimental: {
    // Prevents Next.js from static optimization
    enableExperimentalCodeRemoving: false,
  },
  
  // Add headers to all pages
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0, must-revalidate'
          },
          {
            key: 'CDN-Cache-Control',
            value: 'no-store'
          },
          {
            key: 'Vercel-CDN-Cache-Control',
            value: 'no-store'
          },
          {
            key: 'Surrogate-Control',
            value: 'no-store'
          },
          {
            key: 'Pragma',
            value: 'no-cache'
          },
          {
            key: 'Expires',
            value: '0'
          }
        ]
      }
    ];
  },
  
  // Set output directory (optional, uncomment if needed)
  // distDir: 'build',
  
  // Image configuration (optional, adjust as needed)
  images: {
    domains: ['chain.tenzura.io'],
  },
  
  // Enable SWR for client-side data fetching with auto-revalidation
  swcMinify: true,
};

module.exports = nextConfig;