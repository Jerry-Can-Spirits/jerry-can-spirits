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
            s.onreadystatechange = s.onload = function() {
              beTracker.t({ hash: '61212ddcfaa62e92b61f7ca2e500b7f8' });
            };
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
