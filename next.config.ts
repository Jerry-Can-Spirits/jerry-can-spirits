import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Configure for Cloudflare Pages (full-stack mode)
  trailingSlash: true,

  // Security headers
  headers: async () => {
    return [
      // Less restrictive CSP for Sanity Studio
      {
        source: '/studio/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: data:",
              "style-src 'self' 'unsafe-inline' https: data:",
              "font-src 'self' https: data:",
              "img-src 'self' data: https: blob:",
              "media-src 'self' https: data:",
              "connect-src 'self' https: wss: ws:",
              "frame-src 'self' https:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self' https:",
              "frame-ancestors 'none'"
            ].join('; ')
          }
        ]
      },
      // Stricter CSP for all other routes
      {
        source: '/((?!studio).*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://*.klaviyo.com https://tagmanager.google.com blob:",
              "script-src-elem 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://*.klaviyo.com https://tagmanager.google.com",
              "worker-src 'self' blob:",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.klaviyo.com",
              "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.klaviyo.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "media-src 'self' https:",
              "connect-src 'self' http://localhost:* https://www.google-analytics.com https://www.googletagmanager.com https://analytics.google.com https://region1.google-analytics.com https://*.klaviyo.com https://cdn.sanity.io https://*.sanity.io https://*.ingest.sentry.io wss: ws:",
              "frame-src 'self' https://www.youtube.com https://www.vimeo.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self' https://manage.kmail-lists.com",
              "frame-ancestors 'none'"
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
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
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
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    qualities: [75, 90, 100],
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

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: "jerry-can-spirits",
  project: "jerry-can-spirits",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Automatically annotate React components to show their full name in breadcrumbs and session replay
  reactComponentAnnotation: {
    enabled: true,
  },

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: false,
});
