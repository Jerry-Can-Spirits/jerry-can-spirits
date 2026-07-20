import { defineField, defineType } from 'sanity'

// Singleton: the pool of accessories eligible for the cart drawer cross-sell.
// The drawer picks which one leads for a given basket (shortfall-aware); this
// list is the eligibility set, the tiebreak order, and the fallback order once
// free delivery is already unlocked.
export default defineType({
  name: 'cartUpsell',
  title: 'Cart upsell pool',
  type: 'document',
  fields: [
    defineField({
      name: 'pool',
      title: 'Eligible products',
      type: 'array',
      description:
        'Shopify product handles eligible for the cart cross-sell, in fallback order. Cheapest first works best — it gives the shortfall logic range to choose from. The drawer leads with whichever product best bridges the gap to free UK delivery for the current basket; this order breaks ties and is the order used once the basket already clears the threshold. A handle is the last part of the Shopify product URL, e.g. contemporary-mixer-glass-31cl. A handle that does not match a live product is skipped and logged.',
      of: [
        {
          type: 'string',
          validation: (Rule) =>
            Rule.regex(/^[a-z0-9-]+$/, { name: 'handle' }).error(
              'Enter a Shopify product handle: lowercase letters, numbers and hyphens only, no spaces (e.g. contemporary-mixer-glass-31cl).',
            ),
        },
      ],
    }),
  ],
})
