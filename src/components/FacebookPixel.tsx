'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

const FB_PIXEL_ID = '825009767240821';

declare global {
  interface Window {
    fbq: (
      track: string,
      event: string,
      params?: Record<string, unknown>
    ) => void;
    _fbq: unknown;
  }
}

export default function FacebookPixel() {
  return (
    <Script
      id="facebook-pixel"
      strategy="lazyOnload"
      dangerouslySetInnerHTML={{
        __html: `
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');

          fbq('consent', 'revoke');
          fbq('init', '${FB_PIXEL_ID}');

          // Check if Cookiebot consent already exists (e.g. returning visitor)
          if (typeof Cookiebot !== 'undefined' && Cookiebot.consent && Cookiebot.consent.marketing) {
            fbq('consent', 'grant');
            fbq('track', 'PageView');
          }

          // Grant consent and fire PageView when user accepts marketing cookies
          window.addEventListener('CookiebotOnAccept', function() {
            if (Cookiebot.consent.marketing) {
              fbq('consent', 'grant');
              fbq('track', 'PageView');
            }
          });

          // Revoke consent if user declines or withdraws
          window.addEventListener('CookiebotOnDecline', function() {
            fbq('consent', 'revoke');
          });
        `,
      }}
    />
  );
}

// Fires PageView on every client-side route change
export function PixelPageView() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== 'undefined' && window.fbq) {
      if (typeof window.Cookiebot !== 'undefined' && window.Cookiebot.consent?.marketing) {
        window.fbq('track', 'PageView');
      }
    }
  }, [pathname]);

  return null;
}

// Helper functions for tracking events throughout your app

export const trackEvent = (
  event: string,
  params?: Record<string, unknown>
) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', event, params);
  }
};

// Predefined event trackers for common actions
export const FacebookPixelEvents = {
  // E-commerce events
  viewContent: (params: {
    content_name: string;
    content_category?: string;
    content_ids?: string[];
    content_type?: string;
    value?: number;
    currency?: string;
  }) => trackEvent('ViewContent', params),

  addToCart: (params: {
    content_name: string;
    content_ids: string[];
    content_type: string;
    value: number;
    currency: string;
  }) => trackEvent('AddToCart', params),

  initiateCheckout: (params: {
    content_ids: string[];
    contents: Array<{ id: string; quantity: number }>;
    value: number;
    currency: string;
  }) => trackEvent('InitiateCheckout', params),

  purchase: (params: {
    content_ids: string[];
    content_type: string;
    value: number;
    currency: string;
    num_items: number;
  }) => trackEvent('Purchase', params),

  // Lead generation events
  lead: (params?: { content_name?: string; content_category?: string }) =>
    trackEvent('Lead', params),

  completeRegistration: (params?: {
    content_name?: string;
    status?: string;
  }) => trackEvent('CompleteRegistration', params),

  // Content/Engagement events
  search: (params: { search_string: string; content_category?: string }) =>
    trackEvent('Search', params),

  contact: () => trackEvent('Contact'),

  // Custom events for your site
  viewRecipe: (recipeName: string, category?: string) =>
    trackEvent('ViewContent', {
      content_name: recipeName,
      content_category: category || 'Recipe',
      content_type: 'recipe',
    }),

  viewEquipment: (equipmentName: string, category?: string) =>
    trackEvent('ViewContent', {
      content_name: equipmentName,
      content_category: category || 'Equipment',
      content_type: 'equipment',
    }),

  viewIngredient: (ingredientName: string, category?: string) =>
    trackEvent('ViewContent', {
      content_name: ingredientName,
      content_category: category || 'Ingredient',
      content_type: 'ingredient',
    }),

  newsletterSignup: () => trackEvent('Lead', { content_name: 'Newsletter' }),
};
