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
      options: {
        list: [
          {title: 'Spirits', value: 'spirits'},
          {title: 'Liqueurs', value: 'liqueurs'},
          {title: 'Bitters', value: 'bitters'},
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
      fields: [
        defineField({
          name: 'budget',
          title: 'Budget Choice',
          type: 'string',
          description: 'Recommended budget brand name'
        }),
        defineField({
          name: 'budgetLink',
          title: 'Budget Choice Link',
          type: 'url',
          description: 'Master of Malt affiliate link for budget option'
        }),
        defineField({
          name: 'premium',
          title: 'Premium Choice',
          type: 'string',
          description: 'Recommended premium brand name'
        }),
        defineField({
          name: 'premiumLink',
          title: 'Premium Choice Link',
          type: 'url',
          description: 'Master of Malt affiliate link for premium option'
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
      preview: {
        select: {
          imageUrl: 'asset.url',
          title: 'asset.originalFilename',
        }
      }
    }),
    defineField({
      name: 'budgetImage',
      title: 'Budget Option Image',
      type: 'image',
      options: {
        storeOriginalFilename: true,
        hotspot: true
      },
      description: 'Image for budget brand recommendation (optional - leave empty to use main image)',
      preview: {
        select: {
          imageUrl: 'asset.url',
          title: 'asset.originalFilename',
        }
      }
    }),
    defineField({
      name: 'premiumImage',
      title: 'Premium Option Image',
      type: 'image',
      options: {
        storeOriginalFilename: true,
        hotspot: true
      },
      description: 'Image for premium brand recommendation (optional - leave empty to use main image)',
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
      name: 'pairsWellWith',
      title: 'Pairs Well With',
      type: 'array',
      of: [{type: 'string'}],
      description: 'Complementary ingredients, flavors, or foods'
    }),
    defineField({
      name: 'seasonality',
      title: 'Seasonality',
      type: 'string',
      description: 'Best season (for fresh ingredients) e.g., "Summer", "Year-round"'
    }),

    // Buying Guide
    defineField({
      name: 'priceRange',
      title: 'Price Range',
      type: 'object',
      description: 'Expected price range for this ingredient',
      fields: [
        defineField({
          name: 'budget',
          title: 'Budget Option (£)',
          type: 'number',
          description: 'Typical budget price in GBP'
        }),
        defineField({
          name: 'premium',
          title: 'Premium Option (£)',
          type: 'number',
          description: 'Typical premium price in GBP'
        })
      ]
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

    // Video Content
    defineField({
      name: 'videoUrl',
      title: 'YouTube Video URL',
      type: 'url',
      description: 'Full YouTube URL (e.g., https://www.youtube.com/watch?v=VIDEO_ID)'
    }),

    // Related Content
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
      name: 'relatedIngredients',
      title: 'Related Ingredients',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'ingredient'}]
        }
      ],
      description: 'Ingredients often used together with this one'
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
