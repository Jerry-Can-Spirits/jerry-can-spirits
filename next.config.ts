import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import withBundleAnalyzer from "@next/bundle-analyzer";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  // Configure for Cloudflare Workers via OpenNext
  trailingSlash: true,

  // Ensure minification is enabled (default in production, but explicit for clarity)
  productionBrowserSourceMaps: false, // Disable source maps to reduce bundle size

  // Target modern browsers to remove unnecessary polyfills
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Target modern browsers - disables legacy transforms
  transpilePackages: [],

  // Cache and security headers configured here for Cloudflare Pages compatibility
  // Middleware headers don't work reliably on Cloudflare Pages Edge Runtime
  async headers() {
    return [
      // Cache headers for Next.js hashed static assets (immutable)
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache headers for images served through Next.js
      {
        source: '/_next/image/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=43200',
          },
        ],
      },
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
              "img-src 'self' data: https: https://imagedelivery.net blob:",
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
            key: 'X-Content-Type-Options',
            value: 'nosniff',
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
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://consent.cookiebot.com https://consentcdn.cookiebot.com https://fundingchoicesmessages.google.com https://www.googletagmanager.com https://www.google-analytics.com https://tagmanager.google.com https://static.cloudflareinsights.com https://*.klaviyo.com https://js.sentry-cdn.com https://*.sentry.io https://widget.trustpilot.com https://*.trustpilot.com https://connect.facebook.net https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://www.googletagservices.com https://analytics.tiktok.com blob:",
              "script-src-elem 'self' 'unsafe-inline' https://consent.cookiebot.com https://consentcdn.cookiebot.com https://fundingchoicesmessages.google.com https://www.googletagmanager.com https://www.google-analytics.com https://tagmanager.google.com https://static.cloudflareinsights.com https://*.klaviyo.com https://widget.trustpilot.com https://*.trustpilot.com https://connect.facebook.net https://www.instagram.com https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://www.googletagservices.com https://analytics.tiktok.com",
              "worker-src 'self' blob:",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.klaviyo.com https://*.trustpilot.com https://*.cookiebot.com",
              "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.klaviyo.com https://*.trustpilot.com https://*.cookiebot.com",
              "font-src 'self' https://fonts.gstatic.com https://*.trustpilot.com data:",
              "img-src 'self' data: https: https://imagedelivery.net blob:",
              "media-src 'self' https:",
              "connect-src 'self' https://*.cookiebot.com https://fundingchoicesmessages.google.com https://www.google-analytics.com https://www.googletagmanager.com https://analytics.google.com https://region1.google-analytics.com https://www.google.com https://www.google.co.uk https://*.doubleclick.net https://*.klaviyo.com https://*.kmail-lists.com https://*.shopify.com https://*.myshopify.com https://shop.jerrycanspirits.co.uk https://cdn.sanity.io https://*.sanity.io https://*.ingest.sentry.io https://*.sentry.io https://cloudflareinsights.com https://*.trustpilot.com https://www.facebook.com https://*.facebook.com https://*.facebook.net https://pagead2.googlesyndication.com https://*.googlesyndication.com https://analytics.tiktok.com https://*.tiktok.com wss: ws:",
              "frame-src 'self' https://consentcdn.cookiebot.com https://*.cookiebot.com https://www.youtube.com https://www.vimeo.com https://cdn.sanity.io https://*.sanity.io https://*.trustpilot.com https://www.instagram.com https://*.instagram.com https://*.cdninstagram.com https://googleads.g.doubleclick.net https://*.googlesyndication.com https://www.googletagmanager.com about: data:",
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
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ]
  },

  // Redirects for URL structure changes and removed content
  async redirects() {
    return [
      // Old /cocktails/* URLs redirect to field-manual
      {
        source: '/cocktails/:slug*',
        destination: '/field-manual/cocktails/:slug*',
        permanent: true,
      },
      // Old /notify page (removed - redirect to homepage)
      {
        source: '/notify',
        destination: '/#newsletter-signup',
        permanent: true,
      },
      // Removed products redirect to category pages
      {
        source: '/shop/product/club-ice-tumbler-26cl',
        destination: '/shop/barware/',
        permanent: true,
      },
      // Affiliate/Creator collab vanity URLs (Shopify Collabs)
      {
        source: '/PatSmithComedy',
        destination: '/shop/drinks?dt_id=PatSmithComedy',
        permanent: false,
      },
    ]
  },

  // Enable build caching for faster rebuilds
  cacheMaxMemorySize: 50 * 1024 * 1024, // 50 MB
  
  // Optimize images for better performance with Cloudflare Images CDN
  images: {
    loader: 'custom',
    loaderFile: './src/lib/cloudflareImageLoader.ts',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
      },
      {
        protocol: 'https',
        hostname: 'imagedelivery.net', // Cloudflare Images CDN
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 86400, // 24 hours - images rarely change
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
      // Simplified bundle splitting for Cloudflare Pages compatibility
      // Temporarily disabled aggressive chunk splitting to resolve RSC payload errors
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          // Separate Sanity CMS bundle (largest dependency)
          sanity: {
            test: /[\\/]node_modules[\\/](@sanity|sanity|next-sanity)[\\/]/,
            name: 'sanity',
            chunks: 'all',
            priority: 30,
          },

          // React and related libraries
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
            name: 'react',
            chunks: 'all',
            priority: 20,
          },

          // Default vendor bundle
          defaultVendors: {
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
            reuseExistingChunk: true,
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

// Configure bundle analyzer (run with ANALYZE=true npm run build)
const analyzedConfig = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})(nextConfig);

export default withSentryConfig(analyzedConfig, {
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

  // Disable source map upload in Cloudflare Workers Builds (OOM with 2GB limit)
  // Source maps are still uploaded when building locally (npm run deploy)
  sourcemaps: {
    disable: process.env.CF_PAGES === '1' || process.env.WORKERS_CI === '1',
  },

  // Tunnel route disabled on Cloudflare Workers (causes 403 errors)
  // Sentry will send directly to sentry.io instead
  // tunnelRoute: "/monitoring",
});
