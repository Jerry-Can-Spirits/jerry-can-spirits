# Ingredient Schema - Enhanced Fields for Sanity CMS

Add these fields to your existing `ingredient` schema in Sanity Studio.

## Complete Enhanced Ingredient Schema

```javascript
export default {
  name: 'ingredient',
  title: 'Ingredients',
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
          {title: 'Spirits', value: 'spirits'},
          {title: 'Liqueurs', value: 'liqueurs'},
          {title: 'Bitters & Aperitifs', value: 'bitters'},
          {title: 'Fresh Ingredients', value: 'fresh'},
          {title: 'Garnishes', value: 'garnishes'}
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
      name: 'featured',
      title: 'Featured',
      description: 'Show in featured section',
      type: 'boolean',
      initialValue: false
    },
    {
      name: 'usage',
      title: 'Usage',
      description: 'How and when to use this ingredient',
      type: 'text',
      rows: 4,
      validation: Rule => Rule.required()
    },
    {
      name: 'topTips',
      title: 'Top Tips',
      type: 'array',
      of: [{type: 'string'}],
      description: 'Practical tips for using this ingredient'
    },
    {
      name: 'recommendedBrands',
      title: 'Recommended Brands',
      type: 'object',
      fields: [
        {
          name: 'budget',
          title: 'Budget Choice',
          type: 'string',
          description: 'Recommended budget brand'
        },
        {
          name: 'premium',
          title: 'Premium Choice',
          type: 'string',
          description: 'Recommended premium brand'
        }
      ]
    },
    {
      name: 'storage',
      title: 'Storage & Handling',
      type: 'text',
      rows: 2,
      description: 'How to store and handle this ingredient'
    },

    // NEW ENHANCED FIELDS - ADD THESE BELOW

    // Flavor Profile
    {
      name: 'flavorProfile',
      title: 'Flavor Profile',
      type: 'object',
      fields: [
        {
          name: 'primary',
          title: 'Primary Flavors',
          type: 'array',
          of: [{type: 'string'}],
          description: 'e.g., "vanilla", "caramel", "spice", "citrus"'
        },
        {
          name: 'tasting',
          title: 'Tasting Notes',
          type: 'text',
          rows: 3,
          description: 'Detailed flavor description'
        },
        {
          name: 'strength',
          title: 'Flavor Strength',
          type: 'string',
          options: {
            list: ['Subtle', 'Medium', 'Strong', 'Very Strong']
          }
        }
      ]
    },

    // Product Details
    {
      name: 'abv',
      title: 'ABV',
      type: 'string',
      description: 'Alcohol by volume (e.g., "40%") - for spirits/liqueurs'
    },
    {
      name: 'origin',
      title: 'Origin',
      type: 'string',
      description: 'Country or region of origin (e.g., "Caribbean", "Scotland")'
    },
    {
      name: 'productionMethod',
      title: 'Production Method',
      type: 'text',
      rows: 4,
      description: 'How this ingredient is made/produced'
    },

    // Usage & Pairing
    {
      name: 'substitutions',
      title: 'Possible Substitutions',
      type: 'array',
      of: [{type: 'string'}],
      description: 'What can be used instead if not available'
    },
    {
      name: 'pairsWellWith',
      title: 'Pairs Well With',
      type: 'array',
      of: [{type: 'string'}],
      description: 'Complementary ingredients, flavors, or foods'
    },
    {
      name: 'seasonality',
      title: 'Seasonality',
      type: 'string',
      description: 'Best season (for fresh ingredients) e.g., "Summer", "Year-round"'
    },

    // Buying Guide
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
      name: 'shelfLife',
      title: 'Shelf Life',
      type: 'string',
      description: 'e.g., "Once opened: 6 months", "Use within 3 days"'
    },

    // Context & History
    {
      name: 'history',
      title: 'History & Context',
      type: 'text',
      rows: 4,
      description: 'Origin story, cultural significance, historical context'
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
      description: 'Cocktails that use this ingredient'
    },
    {
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
    }
  ],

  preview: {
    select: {
      title: 'name',
      subtitle: 'category',
      media: 'image',
      featured: 'featured'
    },
    prepare(selection) {
      const {title, subtitle, media, featured} = selection
      return {
        title: featured ? `⭐ ${title}` : title,
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
5. ✅ Start with your rum and essential ingredients first

## Recommended Field Priority

**High Priority** (Add these first):
- `videoUrl` - For your YouTube content!
- `flavorProfile` - Critical for spirits
- `professionalTip` - Quick value-add
- `history` - Great storytelling opportunity
- `abv` & `origin` - Essential product details

**Medium Priority**:
- `substitutions` - Very helpful for home bartenders
- `pairsWellWith`
- `productionMethod` - Great for premium spirits
- `relatedCocktails`

**Low Priority** (Nice to have):
- `priceRange`
- `shelfLife`
- `seasonality`
- `relatedIngredients`

## Example: Angostura Bitters Entry

```javascript
{
  name: "Angostura Bitters",
  slug: { current: "angostura-bitters" },
  category: "bitters",
  description: "The quintessential aromatic bitters, essential for any serious bar.",

  // Enhanced fields example:
  flavorProfile: {
    primary: ["clove", "cinnamon", "cardamom", "orange peel"],
    tasting: "Complex blend of spices with notes of clove, cinnamon, and gentian root. Slightly sweet with a long, warming finish.",
    strength: "Strong"
  },

  abv: "44.7%",
  origin: "Trinidad and Tobago",

  professionalTip: "Two dashes is standard, but don't be afraid to use 3-4 in spirit-forward drinks. The bottle's oversized label is intentional - a trademark of the brand since 1870.",

  history: "Created in 1824 by Dr. Johann Siegert as a medicinal tonic for Simón Bolívar's army. The secret recipe uses over 40 ingredients and hasn't changed in 200 years.",

  videoUrl: "https://www.youtube.com/watch?v=YOUR_VIDEO_ID",

  topTips: [
    "A little goes a long way - start with 2 dashes",
    "Store upright to prevent the cap from staining",
    "Works surprisingly well in desserts and chocolate dishes"
  ],

  pairsWellWith: ["whiskey", "rum", "bourbon", "sweet vermouth", "orange"],

  substitutions: [
    "Fee Brothers Aromatic Bitters (slightly less complex)",
    "Peychaud's Bitters (for a different flavor profile)"
  ]
}
```
