export const GB_SHIPPING_DETAILS = {
  '@type': 'OfferShippingDetails',
  shippingDestination: {
    '@type': 'DefinedRegion',
    addressCountry: 'GB',
  },
  shippingRate: {
    '@type': 'MonetaryAmount',
    value: '5.00',
    currency: 'GBP',
  },
  deliveryTime: {
    '@type': 'ShippingDeliveryTime',
    // Same-day dispatch before 3pm on a working day, Royal Mail Tracked 48
    // after that. Mirrors DELIVERY_PROMISE in lib/delivery.ts; Google reads
    // these for the delivery estimate on Shopping listings.
    handlingTime: {
      '@type': 'QuantitativeValue',
      minValue: 0,
      maxValue: 1,
      unitCode: 'DAY',
    },
    transitTime: {
      '@type': 'QuantitativeValue',
      minValue: 1,
      maxValue: 2,
      unitCode: 'DAY',
    },
  },
} as const
