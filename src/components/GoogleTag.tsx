'use client';

import { useEffect } from 'react';

const GA4_ID = 'G-6VJL06YBW2';
const ADS_ID = 'AW-17823586670';

const configured = new Set<string>();

/**
 * Google Tag (gtag.js) for Google Ads and Google Analytics
 *
 * Tag IDs:
 * - G-6VJL06YBW2: Google Analytics 4 (statistics consent)
 * - AW-17823586670: Google Ads Conversion Tracking (marketing consent)
 *
 * gtag.js is not requested at all until Cookiebot reports the matching
 * consent. Loaded under denied Consent Mode it still wrote _gcl_ls before
 * consent, via the first-party tag gateway path /0djc/ that the tag calls
 * (configured at the zone, not in this repo; Cookiebot scan, 10 Oct 2026). The Consent Mode defaults in app/layout.tsx still run first.
 * Enhanced conversions enabled for better conversion matching.
 */
export default function GoogleTag() {
  useEffect(() => {
    loadGoogleTag();
    window.addEventListener('CookiebotOnAccept', loadGoogleTag);
    return () => window.removeEventListener('CookiebotOnAccept', loadGoogleTag);
  }, []);

  return null;
}

export function loadGoogleTag(): void {
  const consent = window.Cookiebot?.consent;
  const ids = [consent?.statistics ? GA4_ID : null, consent?.marketing ? ADS_ID : null].filter(
    (id): id is string => id !== null && !configured.has(id)
  );
  if (ids.length === 0) return;

  ensureGtag();

  if (configured.size === 0) {
    window.gtag('js', new Date());
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${ids[0]}`;
    script.async = true;
    document.head.appendChild(script);
  }

  for (const id of ids) {
    configured.add(id);
    window.gtag(
      'config',
      id,
      id === GA4_ID
        ? { page_path: window.location.pathname, send_page_view: false }
        : { allow_enhanced_conversions: true }
    );
  }
}

/**
 * The Consent Mode defaults script in app/layout.tsx defines the global gtag
 * stub before anything else runs. Where that stub was missing, window.gtag
 * threw "is not a function" from loadGoogleTag (Sentry JAVASCRIPT-NEXTJS-4P,
 * Oct 2026). This defines the same queueing stub, so a call waits in dataLayer
 * for gtag.js to replay instead of throwing. It loads and sends nothing.
 */
export function ensureGtag(): void {
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== 'function') {
    window.gtag = function gtag() {
      // gtag.js replays Arguments objects from dataLayer, not arrays.
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments);
    };
  }
}

/**
 * Track Google Ads conversion event
 * Call this when a conversion happens (e.g., purchase, add to cart)
 *
 * @param conversionLabel - The conversion label from Google Ads (e.g., 'AbC123')
 * @param value - Optional conversion value
 * @param currency - Currency code (default: GBP)
 */
export function trackConversion(
  conversionLabel: string,
  value?: number,
  currency: string = 'GBP'
) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', 'conversion', {
      send_to: `AW-17823586670/${conversionLabel}`,
      value: value,
      currency: currency,
    });
  }
}

/**
 * Track add to cart event for Google Ads and GA4
 */
export function trackAddToCart(
  productId: string,
  productName: string,
  unitPrice: number,
  currency: string = 'GBP',
  quantity: number = 1
) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function' && window.Cookiebot?.consent?.statistics) {
    window.gtag('event', 'add_to_cart', {
      currency: currency,
      value: unitPrice * quantity,
      items: [{
        item_id: productId.split('/').pop() ?? productId,
        item_name: productName,
        price: unitPrice,
        quantity: quantity,
      }],
    });
  }
}

/**
 * A site event for GA4, consent-gated like the rest. The names are the
 * measurement plan from Audit B (3 Oct 2026): hero_order_now,
 * cocktail_bottle_click, cart_upsell_rendered, shipping_cutoff_seen. Checkout
 * is already begin_checkout. GA4 is a half-sample behind Cookiebot, so these
 * read direction, not totals; Shopify's checkout columns are the ground truth.
 */
export function trackSiteEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function' && window.Cookiebot?.consent?.statistics) {
    window.gtag('event', name, params)
  }
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}
