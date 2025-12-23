# Jerry Can Spirits

A premium spirits brand website built with Next.js, Sanity CMS, and Shopify integration.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **CMS**: Sanity.io
- **E-commerce**: Shopify Storefront API
- **Styling**: Tailwind CSS + Styled Components
- **Hosting**: Cloudflare Pages
- **Analytics**: Google Analytics, Sentry
- **Email**: Klaviyo

## Documentation

Comprehensive project documentation is available in the [`/docs`](./docs) directory:

- [Setup & Configuration](./docs#setup--configuration) - Cloudflare, Klaviyo, Shopify, Instagram
- [Development](./docs#development) - Components, contributing, dependencies
- [Brand Guidelines](./docs/BRAND_GUIDELINES.md) - Visual identity and brand voice
- [SEO & Marketing](./docs#seo--marketing) - SEO setup and checklists
- [Launch Checklist](./docs/LAUNCH_CRITICAL_ACTIONS.md) - Pre-launch verification

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm, yarn, or pnpm

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
- `npm start` - Start production server
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
└── sanity/           # Sanity CMS configuration
```

## Deployment

The site is deployed on Cloudflare Pages. See [Cloudflare Setup](./docs/CLOUDFLARE_SETUP.md) for deployment instructions.

## Contributing

See [CONTRIBUTING.md](./docs/CONTRIBUTING.md) for contribution guidelines.
