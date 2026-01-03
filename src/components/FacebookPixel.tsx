'use client';

import Script from 'next/script';
import { useEffect } from 'react';
import { useCookieConsent } from '@/hooks/useCookieConsent';

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
  const { preferences } = useCookieConsent();

  useEffect(() => {
    // Only initialize if marketing cookies are accepted
    if (!preferences.marketing) {
      return;
    }

    // Initialize Facebook Pixel
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('init', FB_PIXEL_ID);
      window.fbq('track', 'PageView');
    }
  }, [preferences.marketing]);

  // Don't load the pixel script if user hasn't consented to marketing cookies
  if (!preferences.marketing) {
    return null;
  }

  return (
    <>
      <Script
        id="facebook-pixel"
        strategy="afterInteractive"
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
          `,
        }}
      />
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
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
