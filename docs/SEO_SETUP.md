# SEO & Social Integration Setup Guide

This guide covers the setup for all SEO optimizations and social integrations added to Jerry Can Spirits.

## Table of Contents
1. [Instagram Feed Integration](#instagram-feed-integration)
2. [Trustpilot Widget](#trustpilot-widget)
3. [Friends & Partners Page](#friends--partners-page)
4. [Schema Markup](#schema-markup)
5. [SEO Quick Wins Checklist](#seo-quick-wins-checklist)

---

## Instagram Feed Integration

The Instagram feed component fetches and displays your latest posts on the website.

### Setup Steps

1. **Create a Facebook Developer Account**
   - Go to https://developers.facebook.com/
   - Create an app and add "Instagram Basic Display" product

2. **Get Your Credentials**
   - Instagram User ID
   - Access Token (you'll need to generate a long-lived token)

3. **Generate Long-Lived Access Token**
   - Follow the guide: https://developers.facebook.com/docs/instagram-basic-display-api/guides/long-lived-access-tokens
   - Long-lived tokens are valid for 60 days

4. **Add Environment Variables**
   - Create or update `.env.local` file in your project root:
   ```bash
   INSTAGRAM_ACCESS_TOKEN=your_long_lived_access_token_here
   INSTAGRAM_USER_ID=your_instagram_user_id_here
   ```

5. **Set Up Token Refresh (Optional but Recommended)**
   - Consider setting up automatic token refresh before the 60-day expiration
   - Create a cron job or scheduled task to refresh the token

### Using the Component

```tsx
import InstagramFeed from '@/components/InstagramFeed'

// Basic usage
<InstagramFeed />

// With options
<InstagramFeed
  limit={6}           // Number of posts to display (default: 6)
  showCaptions={true} // Show captions on hover (default: false)
/>
```

### File Locations
- Component: `src/components/InstagramFeed.tsx`
- API Route: `src/app/api/instagram/route.ts`

---

## Trustpilot Widget

Display Trustpilot reviews and ratings on your website.

### Setup Steps

1. **Sign Up for Trustpilot**
   - Go to https://www.trustpilot.com/
   - Create a business account
   - Verify your domain

2. **Get Your Business Unit ID**
   - Log in to your Trustpilot Business dashboard
   - Navigate to Integrations → Widgets
   - Find your Business Unit ID (looks like: `5d5e5a5b5c5d5e5f5g5h5i5j`)

3. **Choose a Widget Template**
   - Browse available widgets at: https://businessapp.b2b.trustpilot.com/#/integrations/widgets
   - Common template IDs:
     - **Mini**: `539ad0ffdec7e10e686debd7`
     - **Micro**: `53aa8912dec7e10d38f59f36` (current default)
     - **Carousel**: `54ad5defc6454f065c28af8b`
     - **Grid**: `539adbd6dec7e10e686debee`

4. **Update the Component**
   - Open `src/components/TrustpilotWidget.tsx`
   - Replace `YOUR_BUSINESS_UNIT_ID` with your actual Business Unit ID

### Using the Component

```tsx
import TrustpilotWidget from '@/components/TrustpilotWidget'

// Basic usage
<TrustpilotWidget businessUnitId="your_business_unit_id" />

// With options
<TrustpilotWidget
  businessUnitId="your_business_unit_id"
  templateId="53aa8912dec7e10d38f59f36"
  theme="dark"
  stars="4,5"  // Only show 4-5 star reviews
  height="20px"
  width="100%"
/>
```

### Where to Display

Consider adding the Trustpilot widget to:
- Homepage (below hero section)
- Product pages
- Footer
- Dedicated testimonials/reviews page

### File Location
- Component: `src/components/TrustpilotWidget.tsx`

---

## Friends & Partners Page

A dedicated page showcasing your partner distilleries and craft spirit producers for SEO backlink building and community support.

### Page Location
- `https://jerrycanspirits.co.uk/friends`
- File: `src/app/friends/page.tsx`

### Adding Partners

1. Open `src/app/friends/page.tsx`
2. Locate the `partners` array (around line 17)
3. Add new partners following this structure:

```typescript
{
  name: "Distillery Name",
  location: "City, Region",
  description: "Brief description of the distillery and why you're partnering",
  website: "https://example.com",
  speciality: "Their main products (e.g., Gin, Rum, Whisky)",
  logo: "/images/partners/logo-filename.png",
  featured: false, // Set to true for featured partners
}
```

### Partner Logo Guidelines

- **Size**: 200x200px recommended
- **Format**: PNG with transparent background preferred
- **Location**: Save logos in `public/images/partners/`
- **Naming**: Use lowercase with hyphens (e.g., `spirit-of-wales.png`)

### SEO Benefits

Each partner listing:
- Provides a quality backlink to their site
- Improves your domain authority through association
- Creates unique, crawlable content
- Targets long-tail keywords related to craft spirits

### Already Included in Navigation
- Added to Footer under "Quick Links"
- Sitemap updated automatically
- Schema markup included for SEO

---

## Schema Markup

Schema markup helps search engines understand your content better.

### Already Implemented

1. **FAQ Page** (`src/app/faq/page.tsx`)
   - FAQPage schema
   - Question/Answer entities
   - Helps pages appear in "People Also Ask" sections

2. **Friends Page** (`src/app/friends/page.tsx`)
   - CollectionPage schema
   - Organization relationships

### How to Add Schema to New Pages

1. Import the StructuredData component:
```tsx
import StructuredData from '@/components/StructuredData'
```

2. Create your schema object:
```tsx
const schema = {
  "@context": "https://schema.org",
  "@type": "Product", // or Article, Event, etc.
  "name": "Product Name",
  // ... other properties
}
```

3. Add to your page:
```tsx
<StructuredData data={schema} />
```

### Useful Schema Types for Your Site
- **Product**: For rum and merchandise listings
- **Review/AggregateRating**: Product reviews
- **Article**: Blog posts (if you add them)
- **Organization**: About/company info
- **LocalBusiness**: If you have physical presence
- **Event**: Tastings, launches, etc.

### Testing Schema
- Google Rich Results Test: https://search.google.com/test/rich-results
- Schema Markup Validator: https://validator.schema.org/

---

## SEO Quick Wins Checklist

### ✅ Completed

- [x] FAQ page schema markup
- [x] Robots.txt configured (`src/app/robots.ts`)
- [x] Sitemap generated (`src/app/sitemap.ts`)
- [x] Image alt text verified (all images have descriptive alt text)
- [x] Instagram feed component created
- [x] Trustpilot widget component created
- [x] Friends & Partners page built
- [x] Internal linking structure (footer navigation updated)

### 🎯 Next Steps (Optional)

- [ ] Set up Google Search Console
  - Submit sitemap
  - Monitor indexing status
  - Check for crawl errors

- [ ] Set up Bing Webmaster Tools
  - Submit sitemap
  - Verify domain

- [ ] Meta Description Audit
  - Ensure all pages have unique, compelling descriptions
  - Target 150-160 characters

- [ ] Page Speed Optimization
  - Test with Google PageSpeed Insights
  - Optimize image loading
  - Enable compression

- [ ] Content Marketing (If desired)
  - Blog about rum tasting notes
  - Cocktail recipe guides
  - Behind-the-scenes distillery content
  - Partner spotlights

- [ ] Local SEO (If applicable)
  - Google Business Profile
  - Local citations
  - Location pages

### 📊 Monitoring & Metrics

Track these metrics to measure SEO success:

1. **Organic Traffic** (Google Analytics)
2. **Keyword Rankings** (Google Search Console)
3. **Domain Authority** (Moz, Ahrefs, Semrush)
4. **Backlinks** (Monitor growth from partner page)
5. **Page Load Speed** (PageSpeed Insights)
6. **Core Web Vitals** (Search Console)

---

## Environment Variables Summary

Add these to your `.env.local` file:

```bash
# Instagram API
INSTAGRAM_ACCESS_TOKEN=your_long_lived_access_token
INSTAGRAM_USER_ID=your_instagram_user_id

# Note: Trustpilot doesn't need env vars -
# just update the businessUnitId in the component
```

---

## Support & Documentation

- **Next.js SEO**: https://nextjs.org/docs/app/building-your-application/optimizing/metadata
- **Instagram Basic Display API**: https://developers.facebook.com/docs/instagram-basic-display-api
- **Trustpilot Widgets**: https://support.trustpilot.com/hc/en-us/articles/115003783928
- **Schema.org**: https://schema.org/
- **Google Search Central**: https://developers.google.com/search

---

## Questions?

If you need help with any of these integrations, feel free to reach out or check the inline comments in the code files for additional guidance.
