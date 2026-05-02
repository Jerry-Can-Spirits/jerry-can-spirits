'use client';

import { useEffect, useState } from 'react';

/**
 * Klaviyo Script Loader with GDPR Consent
 *
 * Company ID: UavTvg
 *
 * GDPR Compliance:
 * - Only loads Klaviyo scripts after marketing/statistics consent is given
 * - Listens for Cookiebot consent events
 * - Does NOT load any scripts until consent is granted
 *
 * Note: Klaviyo is used for email marketing forms and tracking.
 * Cookies set by Klaviyo require explicit consent under GDPR.
 */

declare global {
  interface Window {
    klaviyo?: {
      push: (args: unknown[]) => void;
      identify?: (props: Record<string, unknown>) => void;
      track?: (event: string, props?: Record<string, unknown>) => void;
    };
    _klOnsite?: Array<unknown>;
    Cookiebot?: {
      consent: {
        marketing: boolean;
        statistics: boolean;
        preferences: boolean;
        necessary: boolean;
      };
      renew: () => void;
    };
  }
}

export default function KlaviyoScript() {
  const [hasConsent, setHasConsent] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check if Cookiebot consent already exists
    const checkExistingConsent = () => {
      if (typeof window !== 'undefined' && window.Cookiebot?.consent) {
        // Klaviyo needs marketing consent for tracking, statistics for analytics
        if (window.Cookiebot.consent.marketing || window.Cookiebot.consent.statistics) {
          setHasConsent(true);
          return true;
        }
      }
      return false;
    };

    // Check initial consent state
    checkExistingConsent();

    // Listen for Cookiebot consent acceptance
    const handleAccept = () => {
      if (window.Cookiebot?.consent?.marketing || window.Cookiebot?.consent?.statistics) {
        setHasConsent(true);
      }
    };

    // Listen for consent withdrawal
    const handleDecline = () => {
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
    // Only load Klaviyo scripts when consent is given and not already loaded
    if (!hasConsent || isLoaded) return;

    // Static stub — queues pre-load calls into _klOnsite. Klaviyo's onsite
    // SDK replaces window.klaviyo with the real API once loaded. The only
    // method we call client-side before the SDK is ready is push(), so a
    // Proxy that intercepts arbitrary property access was overkill.
    if (!window.klaviyo) {
      window._klOnsite = window._klOnsite || [];
      window.klaviyo = {
        push: (...args: unknown[]) => {
          window._klOnsite?.push(...args);
        },
      } as NonNullable<Window['klaviyo']>;
    }

    // Set account ID
    window.klaviyo?.push(['account', 'UavTvg']);

    // Load the external Klaviyo script
    const script = document.createElement('script');
    script.src = 'https://static.klaviyo.com/onsite/js/UavTvg/klaviyo.js';
    script.async = true;
    script.onload = () => {
      setIsLoaded(true);
    };
    document.head.appendChild(script);

  }, [hasConsent, isLoaded]);

  // This component doesn't render anything visible
  return null;
}
