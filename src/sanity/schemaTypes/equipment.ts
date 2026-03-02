import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'equipment',
  title: 'Equipment',
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
          {title: 'Shaking & Mixing', value: 'shaking'},
          {title: 'Straining', value: 'straining'},
          {title: 'Measuring', value: 'measuring'},
          {title: 'Glassware', value: 'glassware'},
          {title: 'Bar Tools', value: 'tools'},
          {title: 'Garnish Tools', value: 'garnish'}
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
      description: 'Synonyms and related terms to enrich search (e.g., "cocktail shaker", "boston shaker", "cobbler shaker")'
    }),
    defineField({
      name: 'usage',
      title: 'Usage',
      type: 'text',
      rows: 2,
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'essential',
      title: 'Essential Item',
      type: 'boolean',
      initialValue: false
    }),
    defineField({
      name: 'specifications',
      title: 'Specifications',
      type: 'object',
      fields: [
        defineField({
          name: 'material',
          title: 'Material',
          type: 'string',
          description: 'e.g., "Stainless Steel", "Glass", "Copper"'
        }),
        defineField({
          name: 'capacity',
          title: 'Capacity',
          type: 'string',
          description: 'e.g., "500ml", "2 cups"'
        }),
        defineField({
          name: 'details',
          title: 'Details',
          type: 'string',
          description: 'e.g., "25cm x 10cm", "Boston or Cobbler style", "Standard or Double"'
        })
      ]
    }),
    defineField({
      name: 'tips',
      title: 'Professional Tips',
      type: 'array',
      of: [{type: 'string'}],
      description: 'Practical tips for using this equipment',
      validation: Rule => Rule.required().min(1)
    }),
    defineField({
      name: 'image',
      title: 'Technical Schematic',
      type: 'image',
      options: {
        hotspot: true,
      }
    }),
    defineField({
      name: 'featured',
      title: 'Featured Equipment',
      type: 'boolean',
      initialValue: false
    }),

    // ENHANCED FIELDS FOR RICH CONTENT

    // Buying Guide Section
    defineField({
      name: 'priceRange',
      title: 'Price Range',
      type: 'object',
      description: 'Expected price range for this equipment',
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
      name: 'whatToLookFor',
      title: 'What to Look For',
      type: 'array',
      of: [{type: 'string'}],
      description: 'Key features to look for when buying'
    }),
    defineField({
      name: 'commonMistakes',
      title: 'Common Mistakes to Avoid',
      type: 'array',
      of: [{type: 'string'}],
      description: 'Mistakes people make when buying or using this'
    }),

    // Alternatives
    defineField({
      name: 'budgetAlternative',
      title: 'Budget Alternative',
      type: 'string',
      description: 'Cheaper alternative or workaround (e.g., "Mason jar with lid")'
    }),
    defineField({
      name: 'budgetLink',
      title: 'Budget Alternative Link',
      type: 'url',
      description: 'Affiliate or product link for the budget alternative'
    }),
    defineField({
      name: 'budgetImage',
      title: 'Budget Alternative Image',
      type: 'image',
      options: {hotspot: true},
      description: 'Image for the budget alternative (optional)'
    }),
    defineField({
      name: 'premiumOption',
      title: 'Premium Option',
      type: 'string',
      description: 'Recommended premium brand/model'
    }),
    defineField({
      name: 'premiumLink',
      title: 'Premium Option Link',
      type: 'url',
      description: 'Affiliate or product link for the premium option'
    }),
    defineField({
      name: 'premiumImage',
      title: 'Premium Option Image',
      type: 'image',
      options: {hotspot: true},
      description: 'Image for the premium option (optional)'
    }),

    // Care & Maintenance
    defineField({
      name: 'careInstructions',
      title: 'Care Instructions',
      type: 'array',
      of: [{type: 'string'}],
      description: 'Step-by-step care instructions (add each as a separate item)'
    }),
    defineField({
      name: 'lifespan',
      title: 'Expected Lifespan',
      type: 'array',
      of: [{type: 'string'}],
      description: 'List different quality levels, e.g., "Budget: 2-3 years", "Premium: 10-15 years"'
    }),

    // Context & History
    defineField({
      name: 'history',
      title: 'History & Context',
      type: 'text',
      rows: 4,
      description: 'Origin story, historical context, why it matters'
    }),
    defineField({
      name: 'professionalTip',
      title: 'Pro Tip Callout',
      type: 'text',
      rows: 2,
      description: 'A standout expert insight (displayed prominently)'
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
      name: 'relatedCocktails',
      title: 'Related Cocktails',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'cocktail'}]
        }
      ],
      description: 'Cocktails that use this equipment'
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
      description: 'Similar or complementary equipment items'
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
      description: 'Ingredients commonly used with this equipment'
    })
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'category',
      media: 'image',
      essential: 'essential'
    },
    prepare(selection) {
      const {title, subtitle, media, essential} = selection
      return {
        title: essential ? `⭐ ${title}` : title,
        subtitle,
        media
      }
    }
  }
})
