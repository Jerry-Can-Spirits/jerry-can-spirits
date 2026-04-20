'use client';

import Script from 'next/script';

export default function AhrefsAnalytics() {
  return (
    <Script
      id="ahrefs-analytics"
      strategy="lazyOnload"
      dangerouslySetInnerHTML={{
        __html: `
          function loadAhrefs() {
            var s = document.createElement('script');
            s.async = true;
            s.src = 'https://analytics.ahrefs.com/analytics.js';
            s.setAttribute('data-key', 'CMA3pWI8tuvWacYhF/0CuQ');
            document.getElementsByTagName('head')[0].appendChild(s);
          }

          if (typeof Cookiebot !== 'undefined' && Cookiebot.consent && Cookiebot.consent.statistics) {
            loadAhrefs();
          }

          window.addEventListener('CookiebotOnAccept', function() {
            if (typeof Cookiebot !== 'undefined' && Cookiebot.consent.statistics) {
              loadAhrefs();
            }
          });
        `,
      }}
    />
  );
}
