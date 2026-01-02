# Cloudflare Zaraz Setup Guide

This document outlines how to configure third-party tools via Cloudflare Zaraz for Jerry Can Spirits.

## Overview

Zaraz loads third-party scripts from Cloudflare's edge network, improving:
- **Performance**: Scripts load faster from edge locations
- **Privacy**: Consent management built-in
- **Security**: Scripts validated by Cloudflare
- **Bandwidth**: Reduced client-side script loading

## Already Configured ✓

### 1. Google Analytics 4 (GA4)
- **Tool ID**: `G-6D5JZWK4M7`
- **Status**: Active
- **Trigger**: Page view (all pages)

### 2. Facebook Pixel & Conversion API
- **Pixel ID**: `890618526506906`
- **Conversion API Token**: Configured
- **Status**: Active
- **Events Tracked**:
  - AddToCart (AddToCartButton.tsx)
  - ViewContent (ProductPageTracking.tsx)
  - InitiateCheckout (CartDrawer.tsx)
- **Trigger**: All pages with consent

### 3. Instagram Embed
- **Status**: Active
- **Custom Element**: `<instagram-post>`
- **Implementation**: InstagramFeed.tsx
- **Current Posts**:
  - https://www.instagram.com/p/DS940WfjDZV/

---

## To Configure in Zaraz Dashboard

### 1. Klaviyo Email Marketing

**Setup Steps:**

1. Go to Cloudflare Dashboard → Zaraz → Tools Settings → Add Tool
2. Select "Custom HTML"
3. Name: `Klaviyo`
4. HTML Code:
```html
<script>
  !function(){if(!window.klaviyo){window._klOnsite=window._klOnsite||[];try{window.klaviyo=new Proxy({},{get:function(n,i){return"push"===i?function(){var n;(n=window._klOnsite).push.apply(n,arguments)}:function(){for(var n=arguments.length,o=new Array(n),w=0;w<n;w++)o[w]=arguments[w];var t="function"==typeof o[o.length-1]?o.pop():void 0,e=new Promise((function(n){window._klOnsite.push([i].concat(o,[function(i){t&&t(i),n(i)}]))}));return e}}})}catch(n){window.klaviyo=window.klaviyo||[],window.klaviyo.push=function(){var n;(n=window._klOnsite).push.apply(n,arguments)}}}}();
  window.klaviyo.push(['account','UavTvg']);
</script>
<script async src="https://static.klaviyo.com/onsite/js/klaviyo.js?company_id=UavTvg"></script>
```

5. **Trigger Settings**:
   - **Condition**: Consent → Marketing → is True
   - **Page Type**: All pages

6. **Action Trigger**: Pageview

**Why this matters:**
- Only loads Klaviyo for users who accept marketing cookies
- Improves page load for users who reject marketing
- Ensures GDPR/privacy compliance

---

### 2. Trustpilot Reviews Widget

**Setup Steps:**

1. Go to Cloudflare Dashboard → Zaraz → Tools Settings → Add Tool
2. Select "Custom HTML"
3. Name: `Trustpilot`
4. HTML Code:
```html
<script type="text/javascript" src="//widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js" async></script>
```

5. **Trigger Settings**:
   - **Condition**: Consent → Marketing → is True
   - **Page Type**: All pages
   - **Additional Rule**: Only load after April 1, 2026 (when reviews go live)

6. **Action Trigger**: Pageview

**Implementation Notes:**
- TrustpilotWidget component (TrustpilotWidget.tsx) now expects the script to be loaded by Zaraz
- Widget automatically initializes when Trustpilot global is available
- Fallback link to Trustpilot page shown while loading

**Business Unit ID**: `68fb4a6f189deab684654fd3`

---

## Consent Configuration

All marketing tools (Klaviyo, Trustpilot, Facebook Pixel) should:
1. Only load when user accepts marketing cookies
2. Respect cookie preferences from ConsentBanner.tsx
3. Update via `window.zaraz.consent.set()` API

### Consent API Usage

The site uses this consent structure:
```typescript
window.zaraz.consent.set({
  analytics: boolean,   // GA4
  marketing: boolean,   // Klaviyo, Trustpilot, Facebook Pixel
  functional: true,     // Always granted
});
```

**Functional cookies** (always active):
- Cart functionality
- Session management
- Essential site features

**Analytics cookies** (optional):
- Google Analytics 4
- Site usage tracking

**Marketing cookies** (optional):
- Klaviyo email marketing
- Facebook Pixel tracking
- Trustpilot reviews

---

## Testing Checklist

After configuring Klaviyo and Trustpilot in Zaraz:

1. **Clear browser cache** and cookies
2. **Visit homepage** - should see consent banner
3. **Accept All** - verify in DevTools:
   - [ ] `window.zaraz.consent` shows all purposes granted
   - [ ] Klaviyo script loads (check Network tab)
   - [ ] Trustpilot script loads (check Network tab)
   - [ ] Instagram posts render correctly
   - [ ] No CSP errors in console

4. **Test Reject All** - verify:
   - [ ] Klaviyo does NOT load
   - [ ] Trustpilot does NOT load
   - [ ] Facebook tracking does NOT fire
   - [ ] Cart still works (functional only)

5. **Test Custom Preferences** - verify:
   - [ ] Marketing ON → Klaviyo + Trustpilot load
   - [ ] Marketing OFF → Klaviyo + Trustpilot don't load
   - [ ] Analytics ON/OFF controls GA4 only

---

## Performance Benefits

**Before Zaraz:**
- GTM: ~50KB
- Klaviyo: ~35KB
- Trustpilot: ~25KB
- Facebook Pixel: ~30KB
- **Total**: ~140KB loaded on every page view

**After Zaraz:**
- Zaraz loader: ~5KB
- Scripts load from edge (faster)
- Scripts respect consent (fewer requests)
- **Estimated savings**: 50-70% reduction in third-party script overhead

---

## Support & Troubleshooting

### Instagram Embeds Not Showing
1. Verify Instagram tool is enabled in Zaraz
2. Check post URLs are public
3. Ensure CSP allows `https://www.instagram.com`

### Klaviyo Forms Not Working
1. Check marketing consent is granted
2. Verify company_id: `UavTvg`
3. Check browser console for errors

### Trustpilot Widget Not Loading
1. Widget only shows after April 1, 2026
2. Requires marketing consent
3. Check businessunit-id: `68fb4a6f189deab684654fd3`

### CSP Errors
All required domains are in `public/_headers`:
- `https://static.cloudflareinsights.com` (Zaraz)
- `https://*.klaviyo.com` (Klaviyo)
- `https://widget.trustpilot.com` (Trustpilot)
- `https://connect.facebook.net` (Facebook)

---

## Files Modified for Zaraz Migration

### Components Updated:
- ✅ `ConsentBanner.tsx` - Zaraz consent API integration
- ✅ `AddToCartButton.tsx` - Zaraz track API for AddToCart
- ✅ `CartDrawer.tsx` - Zaraz track API for InitiateCheckout
- ✅ `ProductPageTracking.tsx` - Zaraz track API for ViewContent
- ✅ `InstagramFeed.tsx` - Custom `<instagram-post>` elements
- ✅ `TrustpilotWidget.tsx` - Expects Zaraz-loaded script
- ✅ `layout.tsx` - Removed Klaviyo script tag

### Configuration Files:
- ✅ `public/_headers` - CSP updated for Zaraz
- ✅ `src/app/page.tsx` - Instagram posts configured

---

## Next Steps

1. Configure Klaviyo in Zaraz (Custom HTML as documented above)
2. Configure Trustpilot in Zaraz (Custom HTML as documented above)
3. Test consent flow thoroughly
4. Monitor Zaraz analytics in Cloudflare Dashboard
5. Add more Instagram posts to homepage as needed

---

**Last Updated**: January 2, 2026
**Maintained By**: Jerry Can Spirits Development Team
