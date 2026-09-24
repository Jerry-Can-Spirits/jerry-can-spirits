import { defineField, defineType } from 'sanity'

// A customer review, quoted on the product pages it is about.
//
// Reviews are collected on Trustpilot and Google, not on the site, so this is
// a curated copy of a review that exists elsewhere, never a review left here.
// The quote is verbatim, trimmed with an ellipsis where shortened and never
// reworded. No aggregateRating or Review structured data is emitted from
// these documents: a hand-picked subset must not be presented to search as
// the total (docs/superpowers/specs/2026-06-22-product-review-excerpts-design.md).
//
// Replaces the hardcoded list in src/lib/product-reviews.ts, which needed a
// pull request for every new quote.
export default defineType({
  name: 'review',
  title: 'Customer review',
  type: 'document',
  fields: [
    defineField({
      name: 'quote',
      title: 'Quote',
      type: 'text',
      rows: 4,
      description: 'The customer\'s words exactly as written. Shorten with an ellipsis if you must; never reword.',
      validation: (Rule) => Rule.required().min(10).max(600),
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'string',
      description: 'The name as it appears on the review platform, e.g. "Andy Mc". First name only is fine.',
      validation: (Rule) => Rule.required().max(60),
    }),
    defineField({
      name: 'rating',
      title: 'Rating',
      type: 'number',
      description: 'Stars as left on the platform, 1 to 5.',
      validation: (Rule) => Rule.required().integer().min(1).max(5),
    }),
    defineField({
      name: 'date',
      title: 'When',
      type: 'string',
      description: 'Month and year as shown under the review, e.g. "June 2026".',
      validation: (Rule) => Rule.max(30),
    }),
    defineField({
      name: 'source',
      title: 'Source',
      type: 'string',
      options: { list: [{ title: 'Trustpilot', value: 'trustpilot' }, { title: 'Google', value: 'google' }], layout: 'radio' },
      initialValue: 'trustpilot',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'sourceUrl',
      title: 'Link to the review',
      type: 'url',
      description: 'Optional. The review\'s own page on Trustpilot or Google, if it has one.',
      validation: (Rule) => Rule.uri({ scheme: ['https'] }),
    }),
    defineField({
      name: 'products',
      title: 'Shown on these products',
      type: 'array',
      description:
        'Shopify product handles this review is about, e.g. jerry-can-spirits-expedition-spiced-rum. The last part of the product URL. A review about the rum can also sit on the six-pack and gift pack if it reads naturally there.',
      of: [
        {
          type: 'string',
          validation: (Rule) =>
            Rule.regex(/^[a-z0-9-]+$/, { name: 'handle' }).error(
              'Enter a Shopify product handle: lowercase letters, numbers and hyphens only, no spaces.',
            ),
        },
      ],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Lower shows first on a product page. Leave blank to sort by date added, newest first.',
    }),
  ],
  preview: {
    select: { title: 'quote', author: 'author', rating: 'rating', products: 'products' },
    prepare({ title, author, rating, products }) {
      const short = typeof title === 'string' && title.length > 70 ? `${title.slice(0, 67)}…` : title
      return {
        title: `${'★'.repeat(rating ?? 0)} ${short ?? ''}`,
        subtitle: `${author ?? ''} · ${(products ?? []).join(', ')}`,
      }
    },
  },
})
