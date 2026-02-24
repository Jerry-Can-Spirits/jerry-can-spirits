# Jerry Can Spirits

A premium spirits brand website built with Next.js, Sanity CMS, and Shopify integration.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **CMS**: Sanity.io
- **E-commerce**: Shopify Storefront API
- **Styling**: Tailwind CSS
- **Hosting**: Cloudflare Workers (via [OpenNext](https://opennext.js.org/cloudflare))
- **Analytics**: Google Analytics 4, Sentry
- **Email**: Klaviyo

## Documentation

Comprehensive project documentation is available in the [`/docs`](./docs) directory:

- [Development](./docs#development) - Components, contributing, dependencies
- [Brand Guidelines](./docs/BRAND_GUIDELINES.md) - Visual identity and brand voice
- [SEO & Marketing](./docs#seo--marketing) - SEO setup and checklists
- [Launch Checklist](./docs/LAUNCH_CRITICAL_ACTIONS.md) - Pre-launch verification

## Getting Started

### Prerequisites

- Node.js 22.13.0 (see `.node-version`)
- npm

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

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
│   ├── app/          # Next.js App Router pages
│   ├── components/   # React components
│   ├── lib/          # Utilities and libraries
│   └── styles/       # Global styles
├── public/           # Static assets
├── docs/             # Project documentation
├── sanity/           # Sanity CMS configuration
├── wrangler.jsonc    # Cloudflare Workers configuration
├── open-next.config.ts  # OpenNext adapter configuration
└── cloudflare-env.d.ts  # Cloudflare environment types
```

## Deployment

The site is deployed on Cloudflare Workers via OpenNext. Run `npm run deploy` to build and deploy, or `npm run preview` to test locally.

## Contributing

See [CONTRIBUTING.md](./docs/CONTRIBUTING.md) for contribution guidelines.
