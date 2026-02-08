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

    // Initialize Klaviyo stub
    if (!window.klaviyo) {
      window._klOnsite = window._klOnsite || [];
      try {
        window.klaviyo = new Proxy({} as NonNullable<Window['klaviyo']>, {
          get: function (_n, i: string) {
            return i === 'push'
              ? function (...args: unknown[]) {
                  window._klOnsite?.push(...args);
                }
              : function (...args: unknown[]) {
                  const callback = typeof args[args.length - 1] === 'function'
                    ? args.pop() as (result: unknown) => void
                    : undefined;
                  const promise = new Promise((resolve) => {
                    window._klOnsite?.push([i, ...args, function (result: unknown) {
                      if (callback) callback(result);
                      resolve(result);
                    }]);
                  });
                  return promise;
                };
          },
        });
      } catch {
        window.klaviyo = window.klaviyo || ({ push: () => {} } as NonNullable<Window['klaviyo']>);
        const klObj = window.klaviyo as { push: (...args: unknown[]) => void };
        klObj.push = function (...args: unknown[]) {
          window._klOnsite?.push(...args);
        };
      }
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
