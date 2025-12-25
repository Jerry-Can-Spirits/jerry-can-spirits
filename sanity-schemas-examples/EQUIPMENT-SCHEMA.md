# Equipment Schema - Enhanced Fields for Sanity CMS

Add these fields to your existing `equipment` schema in Sanity Studio.

## Complete Enhanced Equipment Schema

```javascript
export default {
  name: 'equipment',
  title: 'Bar Equipment',
  type: 'document',
  fields: [
    // EXISTING FIELDS (keep these)
    {
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96
      },
      validation: Rule => Rule.required()
    },
    {
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
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      validation: Rule => Rule.required()
    },
    {
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {
        hotspot: true
      }
    },
    {
      name: 'essential',
      title: 'Essential Equipment',
      description: 'Mark as essential for every home bar',
      type: 'boolean',
      initialValue: false
    },
    {
      name: 'featured',
      title: 'Featured',
      description: 'Show in featured section',
      type: 'boolean',
      initialValue: false
    },
    {
      name: 'specifications',
      title: 'Specifications',
      type: 'object',
      fields: [
        {
          name: 'material',
          title: 'Material',
          type: 'string',
          description: 'e.g., "Stainless Steel", "Glass", "Copper"'
        },
        {
          name: 'capacity',
          title: 'Capacity',
          type: 'string',
          description: 'e.g., "500ml", "2 cups"'
        },
        {
          name: 'dimensions',
          title: 'Dimensions',
          type: 'string',
          description: 'e.g., "25cm x 10cm"'
        }
      ]
    },
    {
      name: 'usage',
      title: 'Usage',
      description: 'How and when to use this equipment',
      type: 'text',
      rows: 4,
      validation: Rule => Rule.required()
    },
    {
      name: 'tips',
      title: 'Professional Tips',
      type: 'array',
      of: [{type: 'string'}],
      description: 'Practical tips for using this equipment'
    },

    // NEW ENHANCED FIELDS - ADD THESE BELOW

    // Buying Guide Section
    {
      name: 'priceRange',
      title: 'Price Range',
      type: 'object',
      fields: [
        {
          name: 'budget',
          title: 'Budget Option (£)',
          type: 'number',
          description: 'Typical budget price in GBP'
        },
        {
          name: 'premium',
          title: 'Premium Option (£)',
          type: 'number',
          description: 'Typical premium price in GBP'
        }
      ]
    },
    {
      name: 'whatToLookFor',
      title: 'What to Look For',
      type: 'array',
      of: [{type: 'string'}],
      description: 'Key features to look for when buying'
    },
    {
      name: 'commonMistakes',
      title: 'Common Mistakes to Avoid',
      type: 'array',
      of: [{type: 'string'}],
      description: 'Mistakes people make when buying or using this'
    },

    // Alternatives
    {
      name: 'budgetAlternative',
      title: 'Budget Alternative',
      type: 'string',
      description: 'Cheaper alternative or workaround (e.g., "Mason jar with lid")'
    },
    {
      name: 'premiumOption',
      title: 'Premium Option',
      type: 'string',
      description: 'Recommended premium brand/model'
    },

    // Care & Maintenance
    {
      name: 'careInstructions',
      title: 'Care Instructions',
      type: 'text',
      rows: 3,
      description: 'How to clean and maintain this equipment'
    },
    {
      name: 'lifespan',
      title: 'Expected Lifespan',
      type: 'string',
      description: 'e.g., "5-10 years with proper care"'
    },

    // Context & History
    {
      name: 'history',
      title: 'History & Context',
      type: 'text',
      rows: 4,
      description: 'Origin story, historical context, why it matters'
    },
    {
      name: 'professionalTip',
      title: 'Pro Tip Callout',
      type: 'text',
      rows: 2,
      description: 'A standout expert insight (displayed prominently)'
    },

    // Video Content
    {
      name: 'videoUrl',
      title: 'YouTube Video URL',
      type: 'url',
      description: 'Full YouTube URL (e.g., https://www.youtube.com/watch?v=VIDEO_ID)'
    },

    // Related Content
    {
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
    }
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
        subtitle: subtitle,
        media: media
      }
    }
  }
}
```

## Quick Migration Checklist

When adding these fields to your existing schema:

1. ✅ Keep all existing fields intact
2. ✅ Add new fields at the end
3. ✅ All new fields are optional (no validation required)
4. ✅ Fields only display when they have data
5. ✅ Start with essential equipment first, add others gradually

## Recommended Field Priority

**High Priority** (Add these first):
- `videoUrl` - For your YouTube content!
- `professionalTip` - Quick value-add
- `history` - Great for storytelling
- `priceRange` - Helps users budget

**Medium Priority**:
- `whatToLookFor`
- `commonMistakes`
- `careInstructions`
- `relatedCocktails`

**Low Priority** (Nice to have):
- `budgetAlternative`
- `premiumOption`
- `lifespan`
