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
    handlingTime: {
      '@type': 'QuantitativeValue',
      minValue: 1,
      maxValue: 2,
      unitCode: 'DAY',
    },
    transitTime: {
      '@type': 'QuantitativeValue',
      minValue: 2,
      maxValue: 3,
      unitCode: 'DAY',
    },
  },
} as const
