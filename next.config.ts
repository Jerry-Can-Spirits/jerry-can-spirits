import type { NextConfig } from "next";
import path from "node:path";
import { withSentryConfig } from "@sentry/nextjs";
import withBundleAnalyzer from "@next/bundle-analyzer";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();

// The full CSP, parameterised only by frame-ancestors: the site defaults to
// 'none', but /qr/* (the Expedition Log embed) must be frameable by the QR
// landing host, whose platform strips scripts so the interactive log is
// served from our origin and iframed in.
// Google AdSense (display ads) was removed deliberately on 2026-07-18
// (installed but never running ads at current traffic; publisher
// ca-pub-5758288828569326). To reinstate the ads: re-add the adsbygoogle.js
// loader in app/layout.tsx, the Mediapartners-Google rule in app/robots.ts,
// public/ads.txt, pagead2.googlesyndication.com to script-src/script-src-elem
// (the loader), *.googlesyndication.com to script-src/script-src-elem/
// connect-src/img-src/frame-src, and www.googletagservices.com to script-src.
//
// Kept on purpose — these are Google Ads conversion tracking (tag
// AW-17823586670, in active use), NOT AdSense, and share hosts with it:
// pagead2.googlesyndication.com stays in connect-src and img-src for the
// Consent-Mode ccm/collect conversion beacon that fires on every page;
// googleads.g.doubleclick.net, *.doubleclick.net, www.googleadservices.com
// and www.google.com stay for conversion/remarketing.
function buildCsp(frameAncestors: string): string {
  return [
    "default-src 'self'",
    // 'unsafe-eval' is added in development ONLY: Next.js dev mode (HMR /
    // Fast Refresh + eval-based source maps) requires it. NODE_ENV is
    // 'production' for `next build`, so the deployed CSP never includes it.
    // blob: removed from script-src: Mapbox GL's only blob use is its Web
    // Worker, governed by worker-src (below); nothing loads a <script> from a
    // blob URL, so script-src blob: was an unused XSS surface.
    `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV !== 'production' ? " 'unsafe-eval'" : ''} https://consent.cookiebot.com https://consentcdn.cookiebot.com https://fundingchoicesmessages.google.com https://www.googletagmanager.com https://www.google-analytics.com https://analytics.google.com https://tagmanager.google.com https://static.cloudflareinsights.com https://*.klaviyo.com https://js.sentry-cdn.com https://*.sentry.io https://widget.trustpilot.com https://*.trustpilot.com https://connect.facebook.net https://googleads.g.doubleclick.net https://tracker.metricool.com https://challenges.cloudflare.com https://analytics.ahrefs.com`,
    // www.instagram.com removed: the site only links to Instagram profiles with
    // plain anchors — there is no Instagram embed widget or script.
    "script-src-elem 'self' 'unsafe-inline' https://consent.cookiebot.com https://consentcdn.cookiebot.com https://fundingchoicesmessages.google.com https://www.googletagmanager.com https://www.google-analytics.com https://tagmanager.google.com https://static.cloudflareinsights.com https://*.klaviyo.com https://widget.trustpilot.com https://*.trustpilot.com https://connect.facebook.net https://googleads.g.doubleclick.net https://tracker.metricool.com https://challenges.cloudflare.com https://analytics.ahrefs.com",
    "worker-src 'self' blob:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.klaviyo.com https://*.trustpilot.com https://*.cookiebot.com",
    "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.klaviyo.com https://*.trustpilot.com https://*.cookiebot.com",
    "font-src 'self' https://fonts.gstatic.com https://*.trustpilot.com data:",
    // The https: wildcard is replaced by an explicit allowlist: the content
    // image CDNs (mirrors images.remotePatterns) plus the analytics/ad hosts
    // that fire <img> tracking beacons (GA4/Ads img fallback, the Facebook /tr
    // pixel, Klaviyo/Metricool/Ahrefs) and Cookiebot/Mapbox icons. Every host
    // is already trusted elsewhere in this policy. This closes the arbitrary-
    // host exfiltration path an injected script had via new Image().src. If
    // AdSense Auto ads are ever enabled, its creative CDNs must be added here.
    "img-src 'self' data: blob: https://cdn.sanity.io https://cdn.shopify.com https://imagedelivery.net https://api.ecologi.com https://www.facebook.com https://www.google-analytics.com https://region1.google-analytics.com https://analytics.google.com https://*.analytics.google.com https://www.google.com https://www.google.co.uk https://*.doubleclick.net https://www.googleadservices.com https://www.googletagmanager.com https://pagead2.googlesyndication.com https://*.klaviyo.com https://d3k81ch9hvuctc.cloudfront.net https://tracker.metricool.com https://analytics.ahrefs.com https://*.cookiebot.com https://api.mapbox.com",
    "media-src 'self' https:",
    // wss:/ws: removed: no browser code opens a WebSocket. Sanity live content
    // is a no-op placeholder (sanity/lib/live.ts), Mapbox and Sentry use
    // fetch/XHR, and no other integration uses one. Add specific WebSocket
    // origins here if that ever changes.
    // *.analytics.google.com covers GA4's regional collectors
    // (region1.analytics.google.com, region2, ...), which are a different host
    // family from the google-analytics.com collectors and were being blocked.
    "connect-src 'self' https://*.cookiebot.com https://fundingchoicesmessages.google.com https://www.google-analytics.com https://www.googletagmanager.com https://analytics.google.com https://*.analytics.google.com https://region1.google-analytics.com https://www.google.com https://www.google.co.uk https://*.doubleclick.net https://*.klaviyo.com https://*.kmail-lists.com https://*.shopify.com https://*.myshopify.com https://shop.jerrycanspirits.co.uk https://cdn.sanity.io https://*.sanity.io https://*.ingest.sentry.io https://*.sentry.io https://cloudflareinsights.com https://*.trustpilot.com https://www.facebook.com https://*.facebook.com https://*.facebook.net https://pagead2.googlesyndication.com https://tracker.metricool.com https://api.mapbox.com https://events.mapbox.com https://analytics.ahrefs.com",
    // Removed: www.vimeo.com (no Vimeo embeds, and the wrong host regardless),
    // the Instagram hosts (profile links only, no embed iframe), and data:
    // (no data-URI iframes). youtube/sanity/trustpilot/ads frames remain in use.
    "frame-src 'self' https://consentcdn.cookiebot.com https://*.cookiebot.com https://www.youtube.com https://cdn.sanity.io https://*.sanity.io https://*.trustpilot.com https://googleads.g.doubleclick.net https://www.googletagmanager.com https://challenges.cloudflare.com about:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://manage.kmail-lists.com",
    `frame-ancestors ${frameAncestors}`,
    "upgrade-insecure-requests",
  ].join('; ');
}

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

  // Cache and security headers configured here for Cloudflare Workers compatibility
  // Middleware headers don't work reliably on Cloudflare Edge Runtime
  async headers() {
    return [
      // HTML pages — never cache at edge. Prevents browsers and Cloudflare from
      // serving stale HTML with outdated chunk hashes after a new deployment.
      // Excludes /_next/ paths so static asset rules below are unaffected.
      {
        source: '/((?!_next/).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
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
      // Security headers for all routes (stricter CSP)
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: buildCsp("'none'"),
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
            value: 'camera=(self), microphone=(), geolocation=(self), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
      // The Expedition Log embed is iframed by the QR landing page (whose
      // platform strips scripts from its HTML module). Same CSP, but this
      // route alone may be framed by the QR host. Listed after the global
      // entry so this Content-Security-Policy value wins for /qr/*.
      {
        source: '/qr/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: buildCsp("'self' https://info.qr.jerrycanspirits.co.uk"),
          },
        ],
      },
      // Invoice documents (committed PDFs + pending uploads) are shown in an
      // inline viewer iframe beside the extracted lines. frame-ancestors 'none'
      // from the global entry blocks even same-origin framing, so these API
      // routes alone allow 'self'.
      {
        source: '/api/pouriq/invoices/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: buildCsp("'self'"),
          },
        ],
      },
    ]
  },

  // Redirects for URL structure changes and removed content
  async redirects() {
    return [
      // Pour IQ is a separate company; these redirects (and the privacy-policy
      // §3.5 and terms-of-service trademark notice) are HELD until the
      // corporate separation completes — do not remove them piecemeal.
      // Pour IQ moved to its own worker at app.pour-iq.co.uk (2026-07-12);
      // old page paths re-rooted (/trade/pouriq/menus → /menus). The API
      // redirect keeps stale open tabs from writing to the retired JCS
      // database. Flip to permanent once the 1 Aug pilot confirms the new
      // deployment, then delete the src/*/pouriq code.
      {
        source: '/trade/pouriq',
        destination: 'https://app.pour-iq.co.uk/',
        permanent: false,
        basePath: false,
      },
      {
        source: '/trade/pouriq/:path*',
        destination: 'https://app.pour-iq.co.uk/:path*',
        permanent: false,
        basePath: false,
      },
      {
        source: '/api/pouriq/:path*',
        destination: 'https://app.pour-iq.co.uk/api/pouriq/:path*',
        permanent: false,
        basePath: false,
      },
      // The old Pour IQ marketing page was retired with the app code; its
      // canonical replacement is the standalone site.
      {
        source: '/trade/pour-iq',
        destination: 'https://pour-iq.co.uk',
        permanent: true,
        basePath: false,
      },
      {
        source: '/trade/pour-iq/:path*',
        destination: 'https://pour-iq.co.uk',
        permanent: true,
        basePath: false,
      },
      // /shop/gifts-and-experience/ was a byte-identical duplicate of
      // /shop/gift-sets/ (each self-canonical). One canonical URL now.
      {
        source: '/shop/gifts-and-experience',
        destination: '/shop/gift-sets/',
        permanent: true,
      },
      {
        source: '/shop/gifts-and-experience/:path*',
        destination: '/shop/gift-sets/:path*',
        permanent: true,
      },
      // The Pour IQ pilot charter page was unpublished with the corporate
      // separation (Audit 8 PR A); send the venue's bookmarks to the portal.
      {
        source: '/trade/pilots/:path*',
        destination: '/trade/',
        permanent: true,
      },
      // The Amaretto ingredient slug was misspelt "ameretto" from creation;
      // corrected in Sanity (content programme), old URL forwarded.
      {
        source: '/field-manual/ingredients/ameretto',
        destination: '/field-manual/ingredients/amaretto/',
        permanent: true,
      },
      // Sanity Studio moved to Sanity hosting — send old bookmarks there.
      {
        source: '/studio',
        destination: 'https://jerrycanspirits.sanity.studio',
        permanent: false,
        basePath: false,
      },
      {
        source: '/studio/:path*',
        destination: 'https://jerrycanspirits.sanity.studio',
        permanent: false,
        basePath: false,
      },
      // Specific cocktail slug corrections (must come before the generic rule)
      {
        source: '/cocktails/vietnamese-iced-coffee',
        destination: '/field-manual/cocktails/vietnamese-iced-coffee-cocktail/',
        permanent: true,
      },
      {
        source: '/cocktails/rum-and-honey',
        destination: '/field-manual/cocktails/explorers-gold-rum-and-honey/',
        permanent: true,
      },
      // Renamed cocktail slug: rum-and-honey → explorers-gold-rum-and-honey
      {
        source: '/field-manual/cocktails/rum-and-honey',
        destination: '/field-manual/cocktails/explorers-gold-rum-and-honey/',
        permanent: true,
      },
      {
        source: '/field-manual/cocktails/rum-and-honey/',
        destination: '/field-manual/cocktails/explorers-gold-rum-and-honey/',
        permanent: true,
      },
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
      // Shopify collections superseded by bar-accessories SEO page
      {
        source: '/shop/accessories/',
        destination: '/shop/bar-accessories/',
        permanent: true,
      },
      {
        source: '/shop/accessories',
        destination: '/shop/bar-accessories/',
        permanent: true,
      },
      {
        source: '/shop/bar-measuring-tools/',
        destination: '/shop/bar-accessories/',
        permanent: true,
      },
      {
        source: '/shop/bar-measuring-tools',
        destination: '/shop/bar-accessories/',
        permanent: true,
      },
      // Short product URL missing brand prefix — 24 external backlinks point here
      {
        source: '/shop/product/expedition-spiced-rum',
        destination: '/shop/product/jerry-can-spirits-expedition-spiced-rum/',
        permanent: true,
      },
      {
        source: '/shop/product/expedition-spiced-rum/:path+',
        destination: '/shop/product/jerry-can-spirits-expedition-spiced-rum/:path+',
        permanent: true,
      },
      // Drinks → Spirits URL migration (collection handle changed in Shopify)
      {
        source: '/shop/drinks',
        destination: '/shop/spirits/',
        permanent: true,
      },
      {
        // :path* (not :path+) so the bare "/shop/drinks/" also matches, now that
        // the route is deleted — otherwise it would 404 instead of redirecting.
        source: '/shop/drinks/:path*',
        destination: '/shop/spirits/:path*',
        permanent: true,
      },
      // Affiliate/Creator collab vanity URLs (Shopify Collabs)
      {
        source: '/PatSmithComedy',
        destination: '/shop/spirits?dt_id=PatSmithComedy',
        permanent: false,
      },
      // Shopify-style /pages/* URLs redirect to the canonical Next.js paths.
      // Headless setup means anyone hitting a Shopify page URL on the main
      // domain (stale SERP result, typed by hand, etc.) lands on a 404
      // without these. Specific override for /pages/about (target slug
      // differs); generic /pages/:slug catches the rest where slugs match.
      {
        source: '/pages/about',
        destination: '/about/story/',
        permanent: true,
      },
      {
        source: '/pages/about/',
        destination: '/about/story/',
        permanent: true,
      },
      {
        source: '/pages/:slug',
        destination: '/:slug/',
        permanent: true,
      },
      {
        source: '/pages/:slug/',
        destination: '/:slug/',
        permanent: true,
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
      {
        protocol: 'https',
        hostname: 'api.ecologi.com',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 86400, // 24 hours - images rarely change
  },
  
  experimental: {
    optimizePackageImports: ['sanity', '@sanity/vision', 'react-icons'],
  },
  
  // Webpack optimizations to reduce cache size and improve chunk splitting
  webpack: (config, { dev, isServer }) => {
    // Enable filesystem cache for faster builds (Cloudflare Pages supports this)
    if (!dev) {
      config.cache = {
        type: 'filesystem',
        // .next/cache is preserved by the CI cache action (actions/cache@v4)
        // and persists locally between deploys
        cacheDirectory: path.resolve(process.cwd(), '.next/cache/webpack'),
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
  org: "jerry-can-spirits-ltd",
  project: "javascript-nextjs",

  // Suppress Sentry build-time telemetry messages
  telemetry: false,

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // Error-reporting only. excludeDebugStatements drops Sentry's debug-logging
  // code (a real, if small, saving). excludeTracing is declared for intent and
  // future-proofing, but on Sentry v10 it does NOT remove the tracing modules
  // from the client bundle — they are barrel-exported from the SDK index, so
  // ~135 KB of tracing/metrics/AI-instrumentation ships regardless of config
  // (measured). Tracing is disabled at runtime in instrumentation-client.ts; the
  // real bundle win would need lazy-loading the SDK.
  bundleSizeOptimizations: {
    excludeTracing: true,
    excludeDebugStatements: true,
  },

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
