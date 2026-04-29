'use client';

import { useEffect } from 'react';

interface ProductPageTrackingProps {
  productId: string;
  productName: string;
  price: string;
  currency: string;
  category?: string;
}

export default function ProductPageTracking({
  productId,
  productName,
  price,
  currency,
  category,
}: ProductPageTrackingProps) {
  useEffect(() => {
    const payload = {
      content_name: productName,
      content_ids: [productId.split('/').pop() ?? productId],
      content_type: 'product_group',
      content_category: category || 'Spirits',
      value: parseFloat(price),
      currency: currency,
    };

    // Track ViewContent via Meta Pixel directly (consent-gated)
    // Spirits/alcohol excluded — Meta prohibits alcohol in product catalogs
    if (typeof window !== 'undefined' && window.fbq && window.Cookiebot?.consent?.marketing && category !== 'Spirits') {
      window.fbq('track', 'ViewContent', payload);
    }

    // Track view_item via GA4 — gated on statistics consent (GDPR)
    if (typeof window !== 'undefined' && typeof window.gtag === 'function' && window.Cookiebot?.consent?.statistics) {
      window.gtag('event', 'view_item', {
        currency: currency,
        value: parseFloat(price),
        items: [{
          item_id: productId.split('/').pop() ?? productId,
          item_name: productName,
          item_category: category || 'Spirits',
          price: parseFloat(price),
          quantity: 1,
        }],
      });
    }
  }, [productId, productName, price, currency, category]);

  return null; // This component doesn't render anything
}
