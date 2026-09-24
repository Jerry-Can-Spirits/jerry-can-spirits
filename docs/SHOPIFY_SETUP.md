# Shopify Integration Setup Guide

## Status

The shop went live on 6 April 2026 and the integration described here is done.
Steps 1, 2, 4 and 6 to 8 are still the reference for how the store is
configured. Steps 3 and 5 are about standing up pre-orders before launch and
are kept as a record of how it was set up, not as work to do.

Corrected 2026-09-24: the first collection's handle is `spirits`, not `drinks`.

---

## Step 1: Verify Environment Variables

Check your `.env.local` file has these variables:

```env
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=your_storefront_access_token
```

### How to Get These:

1. **Store Domain:**
   - Format: `your-store-name.myshopify.com`
   - Example: `jerry-can-spirits.myshopify.com`
   - **Do NOT include `https://`**

2. **Storefront Access Token:**
   - Go to: Shopify Admin → Settings → Apps and sales channels
   - Click "Develop apps" → "Create an app" (if needed)
   - Name it: "Jerry Can Spirits Website"
   - Click "Configure Storefront API scopes"
   - Enable these scopes:
     - ✅ `unauthenticated_read_product_listings`
     - ✅ `unauthenticated_write_checkouts`
     - ✅ `unauthenticated_read_checkouts`
     - ✅ `unauthenticated_write_customers`
     - ✅ `unauthenticated_read_customers`
     - ✅ `unauthenticated_read_product_inventory`
     - ✅ `unauthenticated_read_product_tags`
   - Click "Save" → "Install app"
   - Copy the **Storefront API access token** (starts with `shpat_...`)

---

## Step 2: Create Collections in Shopify

Your site expects **3 collections** with specific handles:

### Collection 1: Spirits
- **Handle:** `spirits` (exactly this, lowercase)
- **Collection Type:** Manual
- **Visibility:** Online Store
- **Description:** "Premium British rum from Jerry Can Spirits"

This handle is what `src/app/shop/spirits/page.tsx` asks for. The doc said
`drinks` until 2026-09-24; there has never been a `drinks` collection or a
`/shop/drinks` route.

### Collection 2: Barware
- **Handle:** `barware` (exactly this, lowercase)
- **Collection Type:** Manual
- **Visibility:** Online Store
- **Description:** "Professional barware and cocktail equipment"

### Collection 3: Clothing & Gear
- **Handle:** `clothing` (exactly this, lowercase)
- **Collection Type:** Manual
- **Visibility:** Online Store
- **Description:** "Adventure-ready apparel and expedition gear"

**How to Create:**
1. Shopify Admin → Products → Collections
2. Click "Create collection"
3. Enter title (e.g., "Spirits")
4. Click "Edit SEO" → Set handle to exact name above
5. Save

---

## Step 3: Add Pre-Order Products

For your April 2026 launch, you'll want to set up pre-order products.

### Option A: Use Shopify Pre-Order Apps (Recommended)

**Best Apps:**
1. **Pre-Order Manager** by Purple Dot
   - Free plan available
   - Adds "Pre-Order" button automatically
   - Email notifications when products are ready

2. **Globo Pre-Order**
   - Free for basic features
   - Customizable pre-order button
   - Expected delivery date display

**Install:**
- Shopify Admin → Apps → Search "pre-order"
- Install app of choice
- Follow app setup wizard

### Option B: Manual Pre-Order Setup

1. **Create Your Product:**
   - Products → Add product
   - Title: "Jerry Can Spirits Premium British Rum - Spiced"
   - Description: Include "Pre-Order - Ships April 2026"
   - Price: Set your pre-order price
   - Inventory: Set to 0 (or use app to override)
   - **Tags:** Add `pre-order`, `drinks`, `rum`, `spiced`
   - **Collections:** Add to "Spirits" collection

2. **Allow Overselling (Manual Method):**
   - Click product → Variants
   - Edit variant → Inventory
   - Uncheck "Track quantity"
   - **OR** Check "Track quantity" and enable "Continue selling when out of stock"

3. **Add Pre-Order Notice:**
   - In product description, clearly state:
     ```
     🚨 PRE-ORDER - Expected Delivery: April 2026

     Reserve your bottle now. You'll be charged immediately and
     your order will ship when available.
     ```

4. **Create a Metafield (Optional but Recommended):**
   - Settings → Custom data → Products
   - Add definition: "Shipping date" (type: Single line text)
   - Add to product: "April 2026"
   - Your theme can display this

---

## Step 4: Configure Product Availability

Your site checks `availableForSale` from Shopify. Make sure:

1. **Product Status:** Set to "Active"
2. **Sales Channels:** Enable "Online Store"
3. **Inventory:** Either:
   - Uncheck "Track quantity" (unlimited pre-orders)
   - OR set quantity > 0 with tracking on

**To Test:**
- Create a test product in "Spirits" collection
- Set availability to "Active"
- Add product image
- Save

---

## Step 5: Test the Integration

### Local Testing:

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Visit pages:**
   - `http://localhost:3000/shop/spirits`
   - Should show products from your "spirits" collection
   - If you see "No Products Found" → Check collection handle and product visibility

3. **Test Add to Cart:**
   - Click on a product
   - Click "Add to Cart"
   - Cart drawer should slide out from right
   - Check browser console for any errors

4. **Test Checkout:**
   - Click "Proceed to Checkout"
   - Should redirect to `your-store.myshopify.com/cart/...`
   - Complete a test purchase using Shopify test mode

### Production Testing:

After deploying (the site runs as a Cloudflare Worker via OpenNext, not Pages):
1. Visit `https://jerrycanspirits.co.uk/shop/spirits`
2. Verify products load
3. Test add-to-cart
4. Test checkout flow

---

## Step 6: Set Up Payment Gateway

### For Pre-Orders:

1. **Shopify Payments (Recommended):**
   - Settings → Payments
   - Activate Shopify Payments
   - Enter bank details
   - Enable test mode for testing

2. **Alternative: PayPal, Stripe:**
   - Settings → Payments → Add provider
   - Follow setup wizard

3. **Important for Pre-Orders:**
   - Ensure your T&Cs clearly state:
     - Charge happens immediately
     - Expected delivery date
     - Refund policy
   - Consider enabling email notifications for order updates

---

## Step 7: Configure Shopify Checkout

### Essential Settings:

1. **Store Details:**
   - Settings → Store details
   - Enter business name, address, contact

2. **Shipping:**
   - Settings → Shipping and delivery
   - Add shipping zones (UK, International)
   - Set rates or free shipping for pre-orders

3. **Taxes:**
   - Settings → Taxes and duties
   - Enable automatic tax calculation (UK VAT: 20%)

4. **Checkout Settings:**
   - Settings → Checkout
   - **Customer contact:** Email or Phone (recommended: Email)
   - **Customer information:** Enable "Show email updates"
   - **Order processing:**
     - ✅ "Automatically fulfill items"
     - ✅ "Automatically archive order" (after fulfillment)

5. **Email Notifications:**
   - Settings → Notifications
   - Customize order confirmation email
   - Add note about pre-order timeline

---

## Step 8: Test Full Pre-Order Flow

### End-to-End Test:

1. **Add Pre-Order Product to Cart**
   - jerrycanspirits.co.uk/shop/spirits
   - Click product → Add to Cart

2. **Review Cart**
   - Cart drawer shows item
   - Price is correct
   - Quantity adjusts correctly

3. **Proceed to Checkout**
   - Redirects to Shopify checkout
   - Product shows as pre-order
   - Shipping date visible

4. **Complete Test Order**
   - Use Shopify test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVV: Any 3 digits

5. **Verify Order Confirmation**
   - Check email
   - Check Shopify admin orders

6. **Verify Facebook Pixel Tracking**
   - Open browser console
   - Check for "AddToCart" and "InitiateCheckout" events

---

## Common Issues & Fixes

### Issue: "No Products Found" on /shop/spirits

**Fix:**
- Check collection handle is exactly `spirits` (lowercase)
- Verify product is in the collection
- Check product status is "Active"
- Verify Online Store sales channel is enabled

### Issue: "Currently Unavailable" Button

**Fix:**
- Check product variant `availableForSale` is `true`
- Verify inventory:
  - Uncheck "Track quantity" OR
  - Set quantity > 0 OR
  - Enable "Continue selling when out of stock"

### Issue: Cart Not Opening

**Fix:**
- Check browser console for errors
- Verify Shopify API credentials in `.env.local`
- Check network tab for failed API requests
- Ensure CartProvider wraps your app (already done in layout.tsx)

### Issue: Checkout URL Not Working

**Fix:**
- Verify Storefront API has `unauthenticated_write_checkouts` scope
- Check cart creation succeeded (console logs)
- Ensure domain matches in Shopify settings

---

## Pre-Order Best Practices

### Communication:

1. **Product Page:**
   - Clear "Pre-Order" badge
   - Expected delivery date prominent
   - "Ships April 2026" in title or subtitle

2. **Cart/Checkout:**
   - Pre-order notice in product description
   - Shipping date in order details

3. **Post-Purchase:**
   - Order confirmation email mentions pre-order
   - Consider monthly updates to pre-order customers
   - Email 1 week before shipping

### Legal/Compliance:

1. **T&Cs Must Include:**
   - Pre-order definition
   - Charge timing (immediate vs on ship)
   - Estimated delivery date with "subject to change" clause
   - Cancellation/refund policy
   - Delay notification policy

2. **Consumer Rights (UK):**
   - 14-day cooling-off period for distance sales
   - Right to cancel pre-orders
   - Clear refund process

---

## Next Steps

**Immediate (This Week):**
- [ ] Verify `.env.local` has correct Shopify credentials
- [ ] Create 3 collections (spirits, barware, clothing)
- [ ] Add 1 test product to "spirits" collection
- [ ] Test locally: `npm run dev` → visit `/shop/spirits`
- [ ] Test add-to-cart and checkout flow

**Before Launch (January-March 2026):**
- [ ] Install pre-order app or configure manual pre-orders
- [ ] Create all product listings with images
- [ ] Set up shipping rates
- [ ] Configure tax settings
- [ ] Test payment gateway
- [ ] Write pre-order T&Cs
- [ ] Set up order notification emails

**Launch Day (April 2026):**
- [ ] Switch from pre-order to in-stock
- [ ] Update inventory levels
- [ ] Enable fulfillment
- [ ] Monitor orders

---

## Support Resources

**Shopify Documentation:**
- [Storefront API Guide](https://shopify.dev/docs/api/storefront)
- [Pre-Order Apps](https://apps.shopify.com/search?q=pre-order)
- [Checkout Settings](https://help.shopify.com/en/manual/checkout-settings)

**Your Integration:**
- Shopify API Client: `src/lib/shopify.ts`
- Cart Context: `src/contexts/CartContext.tsx`
- Product Pages: `src/app/shop/product/[handle]/page.tsx`

---

## Contact

If you encounter issues with the code integration, we can debug together. For Shopify-specific questions, check the resources above or Shopify Support.

**Ready to test? Let's start with Step 1-4, then do a test order!**
