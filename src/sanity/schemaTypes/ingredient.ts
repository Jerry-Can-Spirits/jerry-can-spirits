import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'ingredient',
  title: 'Ingredient',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      // Listed in the order they appear on the hub, so the Studio and the site
      // agree. Crème Liqueurs and Anise & Herbal Liqueurs were folded into
      // Liqueurs: four documents each against a 279-document corpus, both
      // subdivisions of a group that already existed, and both would have
      // rendered as top-level headings alongside their own parent group.
      options: {
        list: [
          {title: 'Spirits', value: 'spirits'},
          {title: 'Liqueurs', value: 'liqueurs'},
          {title: 'Fortified Wine', value: 'fortified'},
          {title: 'Bitters', value: 'bitters'},
          {title: 'Wine & Champagne', value: 'wine'},
          {title: 'Aromatics & Essences', value: 'aromatics'},
          {title: 'Mixers', value: 'mixers'},
          {title: 'Fresh Ingredients', value: 'fresh'},
          {title: 'Garnishes', value: 'garnishes'}
        ]
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'longDescription',
      title: 'Long Description',
      type: 'array',
      of: [{type: 'block'}],
      description: 'Rich editorial body — supports headings, bold, lists and inline links'
    }),
    defineField({
      name: 'metaTitle',
      title: 'Meta Title',
      type: 'string',
      description: 'SEO title tag (55–60 characters). Leave empty to use "[Name] Guide" automatically.',
      validation: Rule => Rule.max(60)
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta Description',
      type: 'text',
      rows: 2,
      description: 'SEO meta description (150–160 characters). Leave empty to auto-generate from description.',
      validation: Rule => Rule.max(160)
    }),
    defineField({
      name: 'keywords',
      title: 'Keywords',
      type: 'array',
      of: [{type: 'string'}],
      description: 'Synonyms, brand names and related terms to enrich search (e.g., "white rum", "light rum", "rhum blanc")'
    }),
    defineField({
      name: 'usage',
      title: 'Usage',
      type: 'text',
      rows: 2,
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'topTips',
      title: 'Top Tips',
      type: 'array',
      of: [{type: 'string'}],
      description: 'Practical tips for using this ingredient',
      validation: Rule => Rule.required().min(1)
    }),
    defineField({
      name: 'recommendedBrands',
      title: 'Recommended Brands',
      type: 'object',
      description:
        'Editorial picks, not a shop. Write each as "Brand: the reason", e.g. "Hayman\'s Old Tom: the modern benchmark". No prices and no links: prices go stale unowned, and a link would need a commercial relationship we do not have. Where there is no real split, fill ONE field and leave the other empty; the page then shows a single "Recommended" line instead of printing the same pick twice.',
      fields: [
        defineField({
          name: 'budget',
          title: 'Budget Choice',
          type: 'string',
          description: 'The everyday bottle, and why it is the one to reach for. Leave empty if the ingredient has one obvious answer at any price.'
        }),
        defineField({
          name: 'premium',
          title: 'Premium Choice',
          type: 'string',
          description: 'The one worth paying up for, and what the money buys. Leave empty if there is no meaningful step up, as with a single-producer bottle or fresh fruit.'
        })
      ]
    }),
    defineField({
      name: 'storage',
      title: 'Storage & Handling',
      type: 'text',
      rows: 2,
      description: 'How to store and handle this ingredient'
    }),
    defineField({
      name: 'image',
      title: 'Blueprint Image',
      type: 'image',
      options: {
        storeOriginalFilename: true,
        hotspot: true
      },
      description: 'Main product image (or budget option if using separate images)',
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          description: 'Describe what is visible in the image. Used for accessibility and SEO.',
        })
      ],
      preview: {
        select: {
          imageUrl: 'asset.url',
          title: 'asset.originalFilename',
        }
      }
    }),
    defineField({
      name: 'featured',
      title: 'Featured Ingredient',
      type: 'boolean',
      initialValue: false
    }),

    // ENHANCED FIELDS FOR RICH CONTENT

    // Flavour Profile
    defineField({
      name: 'flavorProfile',
      title: 'Flavour Profile',
      type: 'object',
      description: 'Detailed flavour information',
      fields: [
        defineField({
          name: 'primary',
          title: 'Primary Flavours',
          type: 'array',
          of: [{type: 'string'}],
          description: 'e.g., "vanilla", "caramel", "spice", "citrus"'
        }),
        defineField({
          name: 'tasting',
          title: 'Tasting Notes',
          type: 'text',
          rows: 3,
          description: 'Detailed flavour description'
        }),
        defineField({
          name: 'strength',
          title: 'Flavour Strength',
          type: 'string',
          description: 'Light: Minimal impact | Light-Medium: Balanced presence | Medium-Bold: Strong character | Very Bold: Intense, use sparingly',
          options: {
            list: [
              {title: 'Light — Minimal flavour impact, supports other ingredients', value: 'light'},
              {title: 'Light to Medium — Noticeable but balanced flavour presence', value: 'light-medium'},
              {title: 'Medium to Bold — Strong character that shapes the drink', value: 'medium-bold'},
              {title: 'Very Bold — Intense, dominant flavour used sparingly', value: 'very-bold'}
            ]
          }
        })
      ]
    }),

    // Product Details
    defineField({
      name: 'abv',
      title: 'ABV',
      type: 'string',
      description: 'Alcohol by volume (e.g., "40%") - for spirits/liqueurs'
    }),
    defineField({
      name: 'origin',
      title: 'Origin',
      type: 'string',
      description: 'Country or region of origin (e.g., "Caribbean", "Scotland")'
    }),
    defineField({
      name: 'productionMethod',
      title: 'Production Method',
      type: 'text',
      rows: 4,
      description: 'How this ingredient is made/produced'
    }),

    // Usage & Pairing
    defineField({
      name: 'substitutions',
      title: 'Possible Substitutions',
      type: 'array',
      of: [{type: 'string'}],
      description: 'What can be used instead if not available'
    }),
    defineField({
      name: 'seasonality',
      title: 'Seasonality',
      type: 'string',
      description: 'Best season (for fresh ingredients) e.g., "Summer", "Year-round"'
    }),

    // Buying Guide
    defineField({
      name: 'rrp',
      title: 'RRP (£)',
      type: 'number',
      description: 'The published RRP of a single named product. Ours is the only price we control, so this is the only price the Field Manual states.'
    }),
    defineField({
      name: 'shelfLife',
      title: 'Shelf Life',
      type: 'string',
      description: 'e.g., "Once opened: 6 months", "Use within 3 days"'
    }),

    // Context & History
    defineField({
      name: 'history',
      title: 'History & Context',
      type: 'text',
      rows: 4,
      description: 'Origin story, cultural significance, historical context'
    }),
    defineField({
      name: 'professionalTip',
      title: 'Pro Tip Callout',
      type: 'text',
      rows: 2,
      description: 'A standout expert insight (displayed prominently)'
    }),
    defineField({
      name: 'faqs',
      title: 'Ingredient FAQs',
      type: 'array',
      of: [
        {
          type: 'object',
          // Named to match the guide and cocktail schemas. See cocktail.ts.
          name: 'faq',
          title: 'FAQ',
          fields: [
            defineField({
              name: 'question',
              title: 'Question',
              type: 'string',
              validation: Rule => Rule.required()
            }),
            defineField({
              name: 'answer',
              title: 'Answer',
              type: 'text',
              rows: 4,
              validation: Rule => Rule.required()
            })
          ],
          preview: {
            select: {title: 'question'}
          }
        }
      ],
      description: 'Long-tail questions about choosing, using and storing this ingredient. Rendered visibly and as FAQPage schema from the same data.'
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'string',
      description: 'Who wrote or verified this content (e.g., "Dan Freeman", "Jerry Can Spirits Team")'
    }),

    // Video Content
    defineField({
      name: 'videoUrl',
      title: 'YouTube Video URL',
      type: 'url',
      description: 'Full YouTube URL (e.g., https://www.youtube.com/watch?v=VIDEO_ID)'
    }),

    // Related Content
    defineField({
      name: 'relatedGuides',
      title: 'Related Technique Guides',
      type: 'array',
      description: 'Guides that cover this ingredient or its techniques. Use the section anchor to deep-link and the link text to override the display.',
      of: [
        {
          type: 'object',
          name: 'guideLink',
          title: 'Guide Link',
          fields: [
            defineField({
              name: 'guide',
              title: 'Guide',
              type: 'reference',
              to: [{type: 'guide'}],
              validation: Rule => Rule.required()
            }),
            defineField({
              name: 'sectionAnchor',
              title: 'Section Anchor (Optional)',
              type: 'string',
              description: 'Section heading to link to. Leave empty to link to the full guide.'
            }),
            defineField({
              name: 'linkText',
              title: 'Link Text (Optional)',
              type: 'string',
              description: 'Override the displayed link text. Defaults to the guide title.'
            })
          ],
          preview: {
            select: {title: 'guide.title', subtitle: 'sectionAnchor'}
          }
        }
      ]
    }),
    defineField({
      name: 'relatedCocktails',
      title: 'Related Cocktails',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'cocktail'}]
        }
      ],
      description: 'Cocktails that use this ingredient'
    }),
    defineField({
      name: 'parent',
      title: 'Parent Ingredient',
      type: 'reference',
      to: [{type: 'ingredient'}],
      description:
        'The broader ingredient this is a style of — bourbon’s parent is whisky, fino’s is sherry. Setting it lists this page under "Styles of" on the parent. Leave empty for an ingredient that is not a style of something else, which is most of them.',
      // The parent belongs here and nowhere else. It used to live in
      // relatedIngredients alongside sibling and association links, which made
      // the three indistinguishable: sweet-vermouth was referenced by fifteen
      // ingredients including gin, Aperol and Campari, so reversing that field
      // to find styles would have listed them as vermouths.
      validation: Rule =>
        Rule.custom((value, context) => {
          const self = (context.document as {_id?: string} | undefined)?._id
          const ref = (value as {_ref?: string} | undefined)?._ref
          if (!ref || !self) return true
          // Drafts and published documents share an id beyond the prefix.
          if (ref.replace(/^drafts\./, '') === self.replace(/^drafts\./, '')) {
            return 'An ingredient cannot be a style of itself.'
          }
          return true
        })
    }),
    defineField({
      name: 'displayOrder',
      title: 'Display Order',
      type: 'number',
      description:
        'Position in the "Styles of" list on the parent page. Lower comes first. Leave empty and it falls back to alphabetical, which is right for most families — set it only where reading order matters, as it does for whisky, where alphabetical leads with Islay and Penderyn, the two most obscure entries.',
      validation: Rule => Rule.integer().min(0)
    }),
    defineField({
      name: 'relatedIngredients',
      title: 'Related Ingredients',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'ingredient'}]
        }
      ],
      description:
        'Ingredients often used together with this one, and sibling styles. Not the parent — that has its own field above, so the two cannot drift apart.'
    }),
    defineField({
      name: 'relatedEquipment',
      title: 'Related Equipment',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'equipment'}]
        }
      ],
      description: 'Equipment used when working with this ingredient'
    })
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'category',
      media: 'image',
      featured: 'featured'
    },
    prepare(selection) {
      const { title, subtitle, media, featured } = selection
      return {
        title: featured ? `⭐ ${title}` : title,
        subtitle: subtitle ? subtitle.charAt(0).toUpperCase() + subtitle.slice(1) : '',
        media
      }
    }
  }
})
