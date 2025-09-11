'use client';

import Script from 'next/script';

const GA_MEASUREMENT_ID = 'G-6VJL06YBW2';

export default function GoogleAnalytics() {
  return (
    <>
      <Script id="google-consent-init" strategy="beforeInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          
          // Set default consent to 'denied' for EU/EEA regions (GDPR compliance)
          gtag('consent', 'default', {
            'ad_storage': 'denied',
            'ad_user_data': 'denied',
            'ad_personalization': 'denied',
            'analytics_storage': 'denied',
            'wait_for_update': 500,
            'region': ['AD', 'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IS', 'IE', 'IT', 'LV', 'LI', 'LT', 'LU', 'MT', 'NL', 'NO', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'GB']
          });
          
          // Set more permissive defaults for non-EU regions
          gtag('consent', 'default', {
            'ad_storage': 'granted',
            'ad_user_data': 'granted', 
            'ad_personalization': 'granted',
            'analytics_storage': 'granted'
          });
          
          // Enable URL passthrough for better measurement when consent denied
          gtag('set', 'url_passthrough', true);
        `}
      </Script>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            anonymize_ip: true
          });
        `}
      </Script>
    </>
  );
}