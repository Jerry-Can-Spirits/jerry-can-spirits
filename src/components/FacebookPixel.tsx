'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

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
  const [hasConsent, setHasConsent] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (window.Cookiebot?.consent?.marketing) {
      setHasConsent(true);
    }

    const handleAccept = () => {
      if (window.Cookiebot?.consent?.marketing) {
        setHasConsent(true);
      }
    };

    const handleDecline = () => {
      if (window.fbq) {
        window.fbq('consent', 'revoke');
      }
      setHasConsent(false);
    };

    window.addEventListener('CookiebotOnAccept', handleAccept);
    window.addEventListener('CookiebotOnDecline', handleDecline);

    return () => {
      window.removeEventListener('CookiebotOnAccept', handleAccept);
      window.removeEventListener('CookiebotOnDecline', handleDecline);
    };
  }, []);

  useEffect(() => {
    if (!hasConsent || isLoaded) return;

    // Initialise the fbq stub before the script loads
    if (!window.fbq) {
      const fbq = function (...args: unknown[]) {
        if ((fbq as unknown as { callMethod: (...a: unknown[]) => void }).callMethod) {
          (fbq as unknown as { callMethod: (...a: unknown[]) => void }).callMethod(...args);
        } else {
          (fbq as unknown as { queue: unknown[] }).queue.push(args);
        }
      } as unknown as Window['fbq'];
      (fbq as unknown as { queue: unknown[] }).queue = [];
      (fbq as unknown as { loaded: boolean }).loaded = true;
      (fbq as unknown as { version: string }).version = '2.0';
      window._fbq = fbq;
      window.fbq = fbq;
    }

    window.fbq('consent', 'grant');
    window.fbq('init', FB_PIXEL_ID);
    window.fbq('track', 'PageView');

    const script = document.createElement('script');
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    script.async = true;
    script.onload = () => setIsLoaded(true);
    document.head.appendChild(script);
  }, [hasConsent, isLoaded]);

  return null;
}

// Fires PageView on every client-side route change
export function PixelPageView() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== 'undefined' && window.fbq) {
      if (window.Cookiebot?.consent?.marketing) {
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
