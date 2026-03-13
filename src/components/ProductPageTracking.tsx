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
    if (typeof window !== 'undefined' && window.fbq && window.Cookiebot?.consent?.marketing) {
      window.fbq('track', 'ViewContent', payload);
    }
  }, [productId, productName, price, currency, category]);

  return null; // This component doesn't render anything
}
