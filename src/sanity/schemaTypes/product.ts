import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Product Name',
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
      validation: Rule => Rule.required(),
      description: 'URL-friendly version (e.g., "expedition-spiced-rum")'
    }),
    defineField({
      name: 'shopifyHandle',
      title: 'Shopify Product Handle',
      type: 'string',
      validation: Rule => Rule.required(),
      description: 'The handle from Shopify (e.g., "jerry-can-spirits-expedition-spiced-rum")'
    }),

    // Tasting Notes
    defineField({
      name: 'tastingNotes',
      title: 'Tasting Notes',
      type: 'object',
      description: 'Detailed sensory analysis of the product',
      fields: [
        defineField({
          name: 'aroma',
          title: 'Aroma (Nose)',
          type: 'text',
          rows: 4,
          description: 'What you smell when nosing the spirit',
          validation: Rule => Rule.required()
        }),
        defineField({
          name: 'palate',
          title: 'Palate (Taste)',
          type: 'text',
          rows: 4,
          description: 'Flavors experienced when tasting',
          validation: Rule => Rule.required()
        }),
        defineField({
          name: 'finish',
          title: 'Finish',
          type: 'text',
          rows: 4,
          description: 'Lingering flavors and sensations after swallowing',
          validation: Rule => Rule.required()
        })
      ],
      validation: Rule => Rule.required()
    }),

    // Production Process
    defineField({
      name: 'process',
      title: 'Production Process',
      type: 'text',
      rows: 5,
      description: 'Narrative description of how this product is made, emphasizing craftsmanship and quality',
      validation: Rule => Rule.required()
    }),

    // Flavor Profile
    defineField({
      name: 'flavorProfile',
      title: 'Flavor Profile',
      type: 'object',
      description: 'Key flavor characteristics',
      fields: [
        defineField({
          name: 'primary',
          title: 'Primary Flavors',
          type: 'array',
          of: [{type: 'string'}],
          description: 'Main flavor notes (e.g., "Vanilla", "Cinnamon", "Caramel")',
          validation: Rule => Rule.required().min(3)
        }),
        defineField({
          name: 'strength',
          title: 'Flavor Strength',
          type: 'string',
          options: {
            list: [
              {title: 'Light — Delicate and subtle', value: 'light'},
              {title: 'Medium — Balanced and approachable', value: 'medium'},
              {title: 'Bold — Rich and pronounced', value: 'bold'},
              {title: 'Very Bold — Intense and powerful', value: 'very-bold'}
            ]
          },
          validation: Rule => Rule.required()
        })
      ],
      validation: Rule => Rule.required()
    }),

    // Serving Suggestions
    defineField({
      name: 'servingSuggestions',
      title: 'Serving Suggestions',
      type: 'array',
      of: [{type: 'string'}],
      description: 'How to best enjoy this product (neat, on ice, in cocktails, etc.)',
      validation: Rule => Rule.required().min(2)
    }),

    // Pairs With
    defineField({
      name: 'pairsWith',
      title: 'Pairs Well With',
      type: 'array',
      of: [{type: 'string'}],
      description: 'Foods, flavors, or occasions that complement this product'
    }),

    // Professional Tip
    defineField({
      name: 'professionalTip',
      title: 'Professional Tip',
      type: 'text',
      rows: 3,
      description: 'Expert insight or serving recommendation (displayed prominently)',
      validation: Rule => Rule.required()
    }),

    // History & Context
    defineField({
      name: 'history',
      title: 'History & Context',
      type: 'text',
      rows: 4,
      description: 'Story behind this product, inspiration, military heritage connection'
    }),

    // Related Cocktails
    defineField({
      name: 'relatedCocktails',
      title: 'Featured Cocktails',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'cocktail'}]
        }
      ],
      description: 'Cocktails that showcase this product'
    }),

    // Product Image
    defineField({
      name: 'image',
      title: 'Product Image',
      type: 'image',
      options: {
        storeOriginalFilename: true,
        hotspot: true
      },
      description: 'Hero product image for editorial content (Shopify handles e-commerce images)'
    }),

    // Featured Product
    defineField({
      name: 'featured',
      title: 'Featured Product',
      type: 'boolean',
      initialValue: false,
      description: 'Highlight this product in editorial content'
    }),

    // Video Content
    defineField({
      name: 'videoUrl',
      title: 'YouTube Video URL',
      type: 'url',
      description: 'Product video, tasting notes video, or behind-the-scenes production'
    })
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'shopifyHandle',
      media: 'image',
      featured: 'featured'
    },
    prepare(selection) {
      const { title, subtitle, media, featured } = selection
      return {
        title: featured ? `⭐ ${title}` : title,
        subtitle: subtitle || 'No Shopify handle set',
        media
      }
    }
  }
})
