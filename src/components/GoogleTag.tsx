'use client';

import Script from 'next/script';

/**
 * Google Tag (gtag.js) for Google Ads and Google Analytics
 *
 * Tag IDs:
 * - G-6VJL06YBW2: Google Analytics 4
 * - AW-17823586670: Google Ads Conversion Tracking
 *
 * Enhanced conversions enabled for better conversion matching.
 */
export default function GoogleTag() {
  return (
    <>
      {/* Google tag (gtag.js) */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=AW-17823586670"
        strategy="afterInteractive"
      />
      <Script
        id="google-tag-config"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            // Google Analytics 4
            gtag('config', 'G-6VJL06YBW2', {
              page_path: window.location.pathname,
            });

            // Google Ads with Enhanced Conversions
            gtag('config', 'AW-17823586670', {
              'allow_enhanced_conversions': true
            });
          `,
        }}
      />
    </>
  );
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
 * Track add to cart event for Google Ads
 */
export function trackAddToCart(
  productId: string,
  productName: string,
  value: number,
  currency: string = 'GBP'
) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', 'add_to_cart', {
      currency: currency,
      value: value,
      items: [{
        item_id: productId,
        item_name: productName,
        price: value,
        quantity: 1,
      }],
    });
  }
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}
