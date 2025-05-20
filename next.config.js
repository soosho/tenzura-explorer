/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  
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
  
  // Image configuration - add GitHub raw content domain
  images: {
    domains: [
      'chain.tenzura.io',
      'raw.githubusercontent.com'  // Added this domain
    ],
  },
  
  swcMinify: true,
};

module.exports = nextConfig;