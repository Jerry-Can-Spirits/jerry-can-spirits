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
    // Track Facebook Pixel ViewContent event
    if (typeof window !== 'undefined' && (window as Window & { fbq?: Function }).fbq) {
      (window as Window & { fbq: Function }).fbq('track', 'ViewContent', {
        content_name: productName,
        content_ids: [productId],
        content_type: 'product',
        content_category: category || 'Spirits',
        value: parseFloat(price),
        currency: currency,
      });
    }
  }, [productId, productName, price, currency, category]);

  return null; // This component doesn't render anything
}
