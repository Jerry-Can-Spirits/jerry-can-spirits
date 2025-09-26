import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configure for Cloudflare Pages (full-stack mode)
  trailingSlash: true,

  // Security headers
  headers: async () => {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://static.klaviyo.com https://a.klaviyo.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "media-src 'self' https:",
              "connect-src 'self' https://www.google-analytics.com https://a.klaviyo.com https://cdn.sanity.io https://*.sanity.io wss:",
              "frame-src 'self' https://www.youtube.com https://www.vimeo.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self' https://manage.kmail-lists.com",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests"
            ].join('; ')
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ]
  },

  // Enable build caching
  cacheHandler: undefined, // Use default caching
  cacheMaxMemorySize: 50 * 1024 * 1024, // 50 MB
  
  // Optimize images for better performance
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Disable webpack build cache to prevent large cache files in production
  experimental: {
    webpackBuildWorker: false,
    optimizePackageImports: ['sanity', '@sanity/vision'],
  },
  
  // Webpack optimizations to reduce cache size and improve chunk splitting
  webpack: (config, { dev, isServer }) => {
    // Disable webpack cache in production to prevent large cache files
    if (!dev) {
      config.cache = false;
    }
    
    if (!dev && !isServer) {
      // Advanced bundle splitting for better performance
      config.optimization.splitChunks = {
        chunks: 'all',
        maxSize: 200000, // Smaller chunks for better caching
        minSize: 20000,
        cacheGroups: {
          default: false,
          vendors: false,
          
          // Separate Sanity CMS bundle (largest dependency)
          sanity: {
            test: /[\\/]node_modules[\\/](@sanity|sanity|next-sanity)[\\/]/,
            name: 'sanity',
            chunks: 'all',
            priority: 30,
            maxSize: 200000,
          },
          
          // React and related libraries
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
            name: 'react',
            chunks: 'all',
            priority: 20,
            maxSize: 200000,
          },
          
          // Styled components
          styled: {
            test: /[\\/]node_modules[\\/](styled-components)[\\/]/,
            name: 'styled',
            chunks: 'all',
            priority: 15,
            maxSize: 200000,
          },
          
          // Other vendor libraries
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendor',
            chunks: 'all',
            priority: 10,
            maxSize: 200000,
          },
        },
      };
    }
    
    // Exclude cache directory from being processed
    config.watchOptions = {
      ignored: ['**/cache/**', '**/node_modules/**'],
    };
    
    return config;
  },
};

export default nextConfig;
