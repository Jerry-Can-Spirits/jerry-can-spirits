'use client';

import Script from 'next/script';

/**
 * TikTok Pixel for tracking and attribution
 *
 * Pixel ID: D608K4JC77UETOO2CSE0
 * Created: 2026-02-02
 *
 * This tracks page views on the main marketing site.
 * Shopify handles tracking on the checkout/store side.
 */
export default function TikTokPixel() {
  return (
    <Script
      id="tiktok-pixel"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          !function (w, d, t) {
            w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var o="https://analytics.tiktok.com/i18n/pixel/events.js",i=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=o,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var a=document.createElement("script");a.type="text/javascript",a.async=!0,a.src=o+"?sdkid="+e+"&lib="+t;var s=document.getElementsByTagName("script")[0];s.parentNode.insertBefore(a,s)};
            ttq.load('D608K4JC77UETOO2CSE0');
            ttq.page();
          }(window, document, 'ttq');
        `,
      }}
    />
  );
}

/**
 * Track TikTok Pixel events
 *
 * Standard events:
 * - ViewContent: User views a product/content
 * - AddToCart: User adds item to cart
 * - InitiateCheckout: User starts checkout
 * - CompletePayment: User completes purchase
 * - Contact: User contacts business
 * - SubmitForm: User submits a form
 */
export function trackTikTokEvent(
  eventName: string,
  params?: Record<string, unknown>
) {
  if (typeof window !== 'undefined' && window.ttq) {
    window.ttq.track(eventName, params);
  }
}

/**
 * Track page view (called automatically, but can be used for SPAs)
 */
export function trackTikTokPageView() {
  if (typeof window !== 'undefined' && window.ttq) {
    window.ttq.page();
  }
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ttq: {
      track: (event: string, params?: Record<string, unknown>) => void;
      page: () => void;
      identify: (params: Record<string, unknown>) => void;
      holdConsent: () => void;
      revokeConsent: () => void;
      grantConsent: () => void;
    };
  }
}
