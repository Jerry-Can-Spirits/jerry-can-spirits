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

## Deployment

The site is deployed on Cloudflare Workers via OpenNext. Run `npm run deploy` to build and deploy, or `npm run preview` to test locally.

## Contributing

See [CONTRIBUTING.md](./docs/CONTRIBUTING.md) for contribution guidelines.
