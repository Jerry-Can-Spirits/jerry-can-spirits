# Cloudflare Pages Environment Variables Setup

## Required Environment Variables

To deploy this Next.js application with Sanity CMS on Cloudflare Pages, you need to configure the following environment variables in your Cloudflare Pages dashboard:

### Sanity CMS Configuration

1. **NEXT_PUBLIC_SANITY_PROJECT_ID**
   - Value: `5mtjmb0t`
   - Description: Your Sanity project ID

2. **NEXT_PUBLIC_SANITY_DATASET**
   - Value: `production`
   - Description: Sanity dataset name

3. **NEXT_PUBLIC_SANITY_API_VERSION** (Optional)
   - Value: `2025-09-08`
   - Description: Sanity API version (will default to this value if not set)

## How to Set Environment Variables in Cloudflare Pages

1. Go to your Cloudflare Dashboard
2. Navigate to **Pages** → Your project
3. Go to **Settings** → **Environment variables**
4. Click **Add variable** for each required variable:
   - Variable name: `NEXT_PUBLIC_SANITY_PROJECT_ID`
   - Value: `5mtjmb0t`
   - Environment: `Production` (and `Preview` if needed)
5. Repeat for `NEXT_PUBLIC_SANITY_DATASET` with value `production`
6. Save and redeploy your site

## Build Configuration

- **Build command**: `npm run build`
- **Build output directory**: `.next`
- **Root directory**: `/` (project root)

## Note

These are public environment variables (prefixed with `NEXT_PUBLIC_`) and will be visible in the client-side bundle. Do not put sensitive credentials here.