import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Configure for Cloudflare Pages (full-stack mode)
  trailingSlash: true,

  // Target modern browsers to remove unnecessary polyfills
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Target modern browsers - disables legacy transforms
  transpilePackages: [],

  // Security headers configured here for Cloudflare Pages compatibility
  // Middleware headers don't work reliably on Cloudflare Pages Edge Runtime
  async headers() {
    return [
      // Security headers for Sanity Studio (less restrictive CSP needed)
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
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join('; '),
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
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',
          },
        ],
      },
      // Security headers for all other routes (stricter CSP)
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://tagmanager.google.com https://static.cloudflareinsights.com https://*.klaviyo.com https://js.sentry-cdn.com https://*.sentry.io https://widget.trustpilot.com https://*.trustpilot.com https://connect.facebook.net blob:",
              "script-src-elem 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://tagmanager.google.com https://static.cloudflareinsights.com https://*.klaviyo.com https://widget.trustpilot.com https://*.trustpilot.com https://connect.facebook.net https://www.instagram.com",
              "worker-src 'self' blob:",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.klaviyo.com https://*.trustpilot.com",
              "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.klaviyo.com https://*.trustpilot.com",
              "font-src 'self' https://fonts.gstatic.com https://*.trustpilot.com data:",
              "img-src 'self' data: https: blob:",
              "media-src 'self' https:",
              "connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com https://analytics.google.com https://region1.google-analytics.com https://*.klaviyo.com https://*.shopify.com https://*.myshopify.com https://cdn.sanity.io https://*.sanity.io https://*.ingest.sentry.io https://*.sentry.io https://cloudflareinsights.com https://*.trustpilot.com https://www.facebook.com https://*.facebook.com https://*.facebook.net wss: ws:",
              "frame-src 'self' https://www.youtube.com https://www.vimeo.com https://cdn.sanity.io https://*.sanity.io https://*.trustpilot.com https://www.instagram.com https://*.instagram.com https://*.cdninstagram.com about: data:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self' https://manage.kmail-lists.com",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join('; '),
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
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',
          },
        ],
      },
    ]
  },

  // Enable build caching for faster rebuilds
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
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  
  // Disable webpack build cache to prevent large cache files in production
  experimental: {
    webpackBuildWorker: false,
    optimizePackageImports: ['sanity', '@sanity/vision', 'react-icons'],
  },
  
  // Webpack optimizations to reduce cache size and improve chunk splitting
  webpack: (config, { dev, isServer }) => {
    // Enable filesystem cache for faster builds (Cloudflare Pages supports this)
    if (!dev) {
      const path = require('path');
      config.cache = {
        type: 'filesystem',
        // Cache in node_modules/.cache which is preserved between Cloudflare Pages builds
        cacheDirectory: path.resolve(process.cwd(), 'node_modules/.cache/webpack'),
      };
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

  org: "jerry-can-spirits-ltd",
  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",
});
