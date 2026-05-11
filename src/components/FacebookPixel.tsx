'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { trackEventDual } from '@/lib/meta-capi';

const FB_PIXEL_ID = '825009767240821';

declare global {
  interface Window {
    _fbq?: unknown;
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
      // Best-effort: clear the hashed-email identity cookie when consent is revoked.
      fetch('/api/meta/clear-identity/', { method: 'POST', keepalive: true }).catch(() => {});
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

    window.fbq!('consent', 'grant');
    window.fbq!('init', FB_PIXEL_ID);
    // Initial PageView routed through dual-fire so it gets an eventID and CAPI mirror.
    trackEventDual('PageView');

    const script = document.createElement('script');
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    script.async = true;
    script.onload = () => setIsLoaded(true);
    document.head.appendChild(script);
  }, [hasConsent, isLoaded]);

  return null;
}

// Fires PageView on every client-side route change.
export function PixelPageView() {
  const pathname = usePathname();

  useEffect(() => {
    trackEventDual('PageView');
  }, [pathname]);

  return null;
}

// Legacy helper kept for surfaces not yet migrated to trackEventDual.
export const trackEvent = (
  event: string,
  params?: Record<string, unknown>
) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', event, params);
  }
};

// Predefined event trackers. Pixel-only. Deduplication only applies
// to events fired through trackEventDual. Consider migrating these later.
export const FacebookPixelEvents = {
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

  lead: (params?: { content_name?: string; content_category?: string }) =>
    trackEvent('Lead', params),

  completeRegistration: (params?: {
    content_name?: string;
    status?: string;
  }) => trackEvent('CompleteRegistration', params),

  search: (params: { search_string: string; content_category?: string }) =>
    trackEvent('Search', params),

  contact: () => trackEvent('Contact'),

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
