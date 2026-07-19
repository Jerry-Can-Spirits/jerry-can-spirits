# Jerry Can Spirits

A premium spirits brand website built with Next.js, Sanity CMS, and Shopify integration.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **CMS**: Sanity.io
- **E-commerce**: Shopify Storefront API
- **Styling**: Tailwind CSS
- **Hosting**: Cloudflare Workers (via [OpenNext](https://opennext.js.org/cloudflare))
- **Consent**: Cookiebot (GDPR consent management)
- **Analytics**: Google Analytics 4, Sentry, Metricool
- **Email**: Klaviyo

## Documentation

Comprehensive project documentation is available in the [`/docs`](./docs) directory:

- [Component Usage](./docs/COMPONENT_USAGE_EXAMPLES.md) - Component patterns and examples
- [Contributing](./docs/CONTRIBUTING.md) - Contribution guidelines
- [Dependencies](./docs/DEPENDENCIES_STATUS.md) - Dependency status and notes
- [Brand Guidelines](./docs/BRAND_GUIDELINES.md) - Visual identity and brand voice
- [SEO Setup](./docs/SEO_SETUP.md) - SEO configuration and tooling
- [SEO Checklist](./docs/SEO_CHECKLIST.md) - SEO audit checklist
- [Security (CSP)](./docs/CSP_AUDIT.md) - Content Security Policy findings and accepted risks

## Getting Started

### Prerequisites

- Node.js 22.13.0 (see `.node-version`)
- npm

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables (copy from a colleague or the project's secret store)
cp .env.local.example .env.local

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Build and preview with OpenNext locally
- `npm run deploy` - Build and deploy to Cloudflare Workers
- `npm run cf-typegen` - Generate Cloudflare environment types
- `npm run lint` - Run ESLint

## Testing

- `npm run test:unit` - Run Vitest unit tests (pure-function and module-level tests under `tests/unit/`)
- `npm run test:unit:watch` - Vitest in watch mode for local development
- `npm run test:e2e` - Run Playwright end-to-end tests (browser-level flows under `tests/e2e/`)
- `npm run test:e2e:ui` - Playwright UI mode for debugging individual specs

## Project Structure

```
├── src/
│   ├── app/          # Next.js App Router pages and layouts
│   ├── components/   # React components
│   ├── contexts/     # React context providers
│   ├── hooks/        # Custom React hooks
│   ├── lib/          # Utilities and API clients
│   ├── sanity/       # Sanity client, queries, and schema types
│   ├── styles/       # Additional CSS (animations)
│   └── types/        # TypeScript type definitions
├── public/           # Static assets
├── docs/             # Project documentation
├── migrations/       # D1 database migrations
├── scripts/          # Build and utility scripts
├── tests/e2e/        # Playwright end-to-end tests
├── sanity.config.ts  # Sanity Studio configuration
├── sanity.cli.ts     # Sanity CLI configuration
├── wrangler.jsonc    # Cloudflare Workers configuration
├── cloudflare-worker-entry.mjs  # Outer Worker entry point (edge caching)
├── open-next.config.ts          # OpenNext adapter configuration
└── cloudflare-env.d.ts          # Cloudflare environment types
```

## Server-side purchase attribution (GA4)

Checkout hands off to `shop.jerrycanspirits.co.uk`, so the storefront never sees the completed order and cannot fire a client-side `purchase`. Instead:

1. At checkout the storefront stamps the GA4 `client_id`, `session_id`, `gclid` and the visitor's analytics-consent state onto the Shopify cart as hidden note attributes (`_ga_client_id`, `_ga_session_id`, `_gclid`, `_analytics_consent` — see `src/lib/analytics-stitching.ts`; keys shared with the webhook via `src/lib/analytics-stitch-keys.ts`).
2. The `orders/create` webhook reads them back and POSTs a `purchase` event to the GA4 Measurement Protocol (`src/lib/ga4-measurement-protocol.ts`).

**Environment (server-only — never `NEXT_PUBLIC_`):**

- `GA4_MEASUREMENT_ID` — the same `G-` id used client-side (`G-6VJL06YBW2`).
- `GA4_API_SECRET` — created in GA4 Admin → Data Streams → *Measurement Protocol API secrets*.

Leave both unset to keep the send dark; it logs and skips. It also skips (never fakes data) when the order carries no `client_id` (draft/manual orders, or a session that never had analytics consent) or when consent was not granted. `value` is the order subtotal excluding shipping (VAT-inclusive, as UK prices are displayed); `item_id` is the Shopify **variant** id, matching the Merchant Center feed.

**Verifying the event lands (after deploy):** in GA4, Admin → DebugView. Place a test order from the live storefront and confirm one `purchase` arrives with the correct `transaction_id` (the Shopify order number), `value`, `currency` `GBP`, and variant-level `items`, attributed to the originating session's source/medium rather than `(direct)`.

**Verifying no double-counting:** `transaction_id` is the Shopify order number, sent consistently so GA4 deduplicates against any other `purchase` for the same order. This server-side send is currently the only `purchase` source. **Before enabling Shopify's Google & YouTube channel GA4 tagging**, confirm it would emit the same `transaction_id` (the order number) — if it uses the order id or a `#`-prefixed name instead, the two will not dedupe and orders will be counted twice. After any such change, watch GA4 Realtime/DebugView for a test order and confirm exactly one `purchase` per order.

## Deployment

The site is deployed on Cloudflare Workers via OpenNext. Run `npm run deploy` to build and deploy, or `npm run preview` to test locally.

## Contributing

See [CONTRIBUTING.md](./docs/CONTRIBUTING.md) for contribution guidelines.
