# Instagram oEmbed Setup Guide (2025 - CURRENT METHOD)

## Important Note
Instagram Basic Display API is deprecated. We now use **Instagram oEmbed** which is simpler!

---

## How It Works

Instead of automatically fetching your latest posts, you manually choose which Instagram posts to display on your website. This is actually simpler and requires less maintenance.

---

## Step 1: Complete Meta App Setup

You're already doing this! Fill in these fields:

### App Information
- **App Name:** WebsiteUGC (or whatever you chose)
- **Privacy Policy URL:** `https://jerrycanspirits.co.uk/privacy-policy`
- **Terms of Service URL:** `https://jerrycanspirits.co.uk/terms-of-service`
- **App Icon:** 1024x1024px PNG of your logo

### Data Deletion
- **Type:** Data Deletion Instructions URL
- **URL:** `https://jerrycanspirits.co.uk/privacy-policy`

### oEmbed Read Permission
**Description:**
```
This app is used to embed public Instagram posts from Jerry Can Spirits' official Instagram account (@jerrycanspirits) on our business website (jerrycanspirits.co.uk).

We use the oEmbed Read feature to display selected Instagram posts on our website, allowing visitors to see our social media content and engage with our brand. The embedded posts show our products, brand stories, and customer experiences.

This adds value by:
- Displaying rich Instagram content directly on our website
- Providing social proof and user-generated content
- Creating a seamless brand experience across platforms
- Encouraging visitors to engage with our Instagram presence

The app accesses only public posts from our own business Instagram account (@jerrycanspirits). No user authentication is required, and no personal data is collected.
```

**Test URL:**
```
https://www.instagram.com/jerrycanspirits/
```

---

## Step 2: Get Your Access Token

After your app is approved:

1. Go to **Tools** → **Access Token Tool** in your Meta app dashboard
2. Generate an access token
3. Copy the token

---

## Step 3: Add Token to Your Environment

Create or update `.env.local` in your project root:

```bash
NEXT_PUBLIC_INSTAGRAM_ACCESS_TOKEN=your_access_token_here
```

**Note:** The `NEXT_PUBLIC_` prefix is required since this runs in the browser.

---

## Step 4: Add Instagram Posts to Your Website

### Method 1: Manually Add Post URLs (Recommended for Now)

When you post something on Instagram that you want on your website:

1. Go to the Instagram post on Instagram
2. Click the three dots → Copy Link
3. Add the URL to your homepage

**Edit:** `src/app/page.tsx`

```typescript
<InstagramFeed
  postUrls={[
    'https://www.instagram.com/p/ABC123/',  // Your first post
    'https://www.instagram.com/p/DEF456/',  // Your second post
    'https://www.instagram.com/p/GHI789/',  // Your third post
  ]}
  limit={6}
/>
```

### Method 2: Until You Have Posts

The component will show a nice fallback:
- "Follow us on Instagram for the latest updates"
- Instagram button linking to @jerrycanspirits
- No errors, just clean messaging

---

## How to Update Posts

Whenever you want to feature different Instagram posts:

1. Get the Instagram post URL (copy link from the post)
2. Edit `src/app/page.tsx`
3. Add/remove URLs in the `postUrls` array
4. Deploy

That's it! No tokens expiring, no API limits.

---

## Component Usage

```typescript
import InstagramFeed from '@/components/InstagramFeed'

// Basic usage
<InstagramFeed
  postUrls={[
    'https://www.instagram.com/p/POST_ID_1/',
    'https://www.instagram.com/p/POST_ID_2/',
  ]}
/>

// With limit
<InstagramFeed
  postUrls={yourPostUrls}
  limit={6}  // Show maximum 6 posts
/>
```

---

## Pros & Cons

### Pros ✅
- No token expiration
- You control exactly what shows
- Simpler setup than old API
- No rate limits
- Works with public posts immediately

### Cons ⚠️
- Manual updates needed
- Can't auto-fetch latest posts
- Requires you to choose posts

---

## Where Is It Used?

Currently added to:
- **Homepage** (`src/app/page.tsx`) - After email signup

You can also add it to:
- About page
- Dedicated social/community page
- Product pages

---

## Troubleshooting

### "Nothing shows up"
- ✅ Check you've added post URLs to the `postUrls` array
- ✅ Posts must be PUBLIC (not private account)
- ✅ Check browser console for errors

### "Follow us button shows instead"
- This is correct behavior when `postUrls` is empty
- Add some Instagram post URLs to see them embedded

### "Need access token"
- You need the Meta app access token in `.env.local`
- Get it from Meta Developer dashboard
- Must start with `NEXT_PUBLIC_`

---

## Files

- **Component:** `src/components/InstagramFeed.tsx`
- **Homepage:** `src/app/page.tsx`
- **Environment:** `.env.local`

---

## Questions?

This is the CURRENT (2025) way to embed Instagram posts. The old Instagram Basic Display API is deprecated.

If you want fully automatic post fetching, you'd need to use a paid third-party service like:
- SnapWidget
- Behold
- Flockler

But for most small businesses, manually curating which posts to display is actually preferable!
