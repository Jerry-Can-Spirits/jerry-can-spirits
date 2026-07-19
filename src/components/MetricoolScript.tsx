'use client';

import Script from 'next/script';

/**
 * Metricool analytics tracker
 *
 * Hash: 61212ddcfaa62e92b61f7ca2e500b7f8
 *
 * GDPR Compliance:
 * - Only initialises when Cookiebot statistics cookies are accepted
 * - Listens for CookiebotOnAccept before loading the tracker script
 */
export default function MetricoolScript() {
  return (
    <Script
      id="metricool"
      strategy="lazyOnload"
      dangerouslySetInnerHTML={{
        __html: `
          function loadMetricool() {
            var s = document.createElement('script');
            s.type = 'text/javascript';
            s.src = 'https://tracker.metricool.com/resources/be.js';
            s.onload = function() {
              // beTracker is defined by be.js. If be.js was blocked (Cookiebot
              // auto-block) or failed to load, this handler can still fire with
              // beTracker undefined — the "Can't find variable: beTracker"
              // ReferenceError (the highest-volume Sentry issue, on /age-check).
              // Guard so a missing/blocked tracker fails silently, never throws.
              if (typeof beTracker !== 'undefined') {
                beTracker.t({ hash: '61212ddcfaa62e92b61f7ca2e500b7f8' });
              }
            };
            // Dropped the legacy onreadystatechange handler: it fired without a
            // readyState guard, so it could run before be.js finished executing
            // (beTracker not yet defined). onload alone is correct on modern
            // browsers; onerror keeps a blocked/failed load from surfacing.
            s.onerror = function() { /* be.js blocked or failed to load */ };
            document.getElementsByTagName('head')[0].appendChild(s);
          }

          // Only load if statistics consent already granted (e.g. returning visitor)
          if (typeof Cookiebot !== 'undefined' && Cookiebot.consent && Cookiebot.consent.statistics) {
            loadMetricool();
          }

          // Load when user accepts on this visit
          window.addEventListener('CookiebotOnAccept', function() {
            if (typeof Cookiebot !== 'undefined' && Cookiebot.consent.statistics) {
              loadMetricool();
            }
          });
        `,
      }}
    />
  );
}
