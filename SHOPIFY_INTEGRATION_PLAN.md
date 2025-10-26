# Shopify Headless Integration Plan

## Goal
Integrate Shopify with the main jerrycanspirits.co.uk site so users never leave the main domain and have a seamless shopping experience.

---

## Current State

### What You Have Now ✅
- **Shopify Store:** `shop.jerrycanspirits.co.uk`
- **Main Website:** `jerrycanspirits.co.uk` (Next.js)
- **Shop Pages:** Currently show "Coming Soon" (perfect for launch!)
  - `/shop` - Main shop page
  - `/shop/drinks` - Rum products
  - `/shop/hardware` - Bar equipment
  - `/shop/clothing` - Apparel

### The Problem ❌
Right now, clicking Shop would redirect users to `shop.jerrycanspirits.co.uk` - a completely separate Shopify site where:
- They lose your main site navigation
- Different look and feel
- Breaks the user experience
- Feels disjointed

---

## The Solution: Shopify Headless (Storefront API)

### What This Means
- **Products stay in Shopify admin** (you manage everything there)
- **Frontend on your Next.js site** (users never know Shopify exists)
- **Seamless experience** (your design, your navigation, your brand)
- **Checkout can be Shopify** (redirect to secure Shopify checkout - this is normal and trusted)

---

## How It Works

```
┌─────────────────────────────────────────────────────┐
│  User Experience (All on jerrycanspirits.co.uk)    │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│  Browse Products                                     │
│  - /shop/drinks → Shows products from Shopify       │
│  - Product pages → Your design, Shopify data        │
│  - Add to cart → Stored locally                     │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│  Checkout                                           │
│  - Click "Checkout" → Redirect to Shopify checkout  │
│  - Complete purchase on Shopify's secure platform   │
│  - Return to your site after purchase               │
└─────────────────────────────────────────────────────┘
```

**Note:** Most headless Shopify stores redirect to Shopify's checkout - this is normal, secure, and trusted by customers.

---

## Implementation Steps

### Phase 1: Setup (Week 1)
**What:** Connect Next.js to Shopify

1. **Create Shopify Storefront API credentials**
   - Generate Storefront Access Token
   - Get your Shopify store domain
   - Add to `.env.local`

2. **Install Shopify SDK**
   ```bash
   npm install @shopify/storefront-api-client
   ```

3. **Create API utilities**
   - Fetch products
   - Fetch single product
   - Create checkout

4. **Test connection**
   - Verify we can pull product data

**Time Estimate:** 2-3 hours

---

### Phase 2: Product Display (Week 1-2)
**What:** Show products on your site

1. **Update `/shop/drinks` page**
   - Fetch rum products from Shopify
   - Display in grid matching your design
   - Show prices, images, descriptions

2. **Create dynamic product pages**
   - `/shop/drinks/[handle]` for individual products
   - Product details, images, variants
   - Add to cart button

3. **Update `/shop/hardware` and `/shop/clothing`**
   - Same approach as drinks

**Time Estimate:** 4-6 hours

---

### Phase 3: Cart & Checkout (Week 2)
**What:** Let users purchase

1. **Build cart functionality**
   - Add to cart
   - View cart
   - Update quantities
   - Remove items

2. **Integrate Shopify checkout**
   - Create checkout session
   - Redirect to Shopify checkout
   - Handle return from checkout

3. **Cart icon in header**
   - Show item count
   - Link to cart page

**Time Estimate:** 3-4 hours

---

### Phase 4: Polish (Week 2-3)
**What:** Make it perfect

1. **Loading states**
2. **Error handling**
3. **Empty states**
4. **Product filtering/sorting**
5. **Search functionality**
6. **Related products**

**Time Estimate:** 2-3 hours

---

## Total Time Estimate
**12-16 hours of development** (can spread over 2-3 weeks)

---

## What You Need to Provide

### From Shopify Admin:

1. **Storefront API Access Token**
   - Settings → Apps and sales channels → Develop apps
   - Create custom app → Configure Storefront API
   - Get access token

2. **Your Shopify Store Domain**
   - Format: `your-store.myshopify.com`

3. **Product Setup**
   - Products added to Shopify admin
   - Good quality images
   - Descriptions written
   - Pricing set
   - Inventory configured

### Questions for Planning:

1. **How many products at launch?**
   - Helps scope the work

2. **Product variants?**
   - Sizes, bundles, gift sets, etc.

3. **Collections/Categories?**
   - Beyond Drinks/Hardware/Clothing?

4. **Special features?**
   - Subscriptions, pre-orders, gift cards?

---

## Technology Stack

- **Frontend:** Next.js (your current site) ✅
- **Backend:** Shopify (products, inventory, orders) ✅
- **API:** Shopify Storefront API (GraphQL)
- **Checkout:** Shopify Checkout (secure, PCI compliant)
- **Payments:** Handled by Shopify

---

## Advantages of This Approach

### For You:
✅ Manage everything in Shopify admin (familiar interface)
✅ Shopify handles payments, security, compliance
✅ Keep your beautiful Next.js site design
✅ Users stay on your domain
✅ SEO benefits (products indexed on your domain)
✅ Fast, modern shopping experience

### For Users:
✅ Seamless browsing experience
✅ Trusted Shopify checkout (familiar, secure)
✅ Fast page loads
✅ Mobile optimized
✅ Never lose context or navigation

---

## Alternative: Buy Button Widgets

If you need something **faster** and **simpler** (but less integrated):

**Shopify Buy Button:**
- Embed products directly
- Checkout overlay
- 1-2 hours setup
- Less control over design

We can start with Buy Buttons and upgrade to full headless later if needed.

---

## Launch Strategy

### This Week (Launch) 🚀
- ✅ Keep shop pages as "Coming Soon"
- ✅ Launch everything else
- ✅ Site is live and beautiful
- ✅ Collect emails via waitlist

### After Launch (Shop Build)
- 🛒 Implement Shopify headless
- 🛒 Test thoroughly
- 🛒 Soft launch to email list
- 🛒 Full shop launch

**No pressure, no rush, get it right!**

---

## Next Steps

When you're ready to start:

1. **I'll walk you through getting Shopify API credentials**
2. **We'll connect your Next.js site to Shopify**
3. **Build out the product pages together**
4. **Test everything thoroughly**
5. **Launch when you're confident**

---

## Questions to Think About

1. When do you want to have the shop live? (No rush!)
2. How many products will you have at launch?
3. Do you have product photos and descriptions ready?
4. Any special requirements (subscriptions, pre-orders, etc.)?

Take your time - launch the main site this week, then we'll tackle the shop properly! 🎯

---

## Resources

- **Shopify Storefront API Docs:** https://shopify.dev/docs/api/storefront
- **Example Headless Store:** https://github.com/vercel/commerce
- **Shopify + Next.js Guide:** https://shopify.dev/docs/storefronts/headless

---

*Last Updated: 2025-10-26*
