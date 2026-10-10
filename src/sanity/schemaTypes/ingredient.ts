import {defineField, defineType} from 'sanity'
import {ALLERGENS, LEGAL_CATEGORIES} from '../../lib/ingredient-facts'

export default defineType({
  name: 'ingredient',
  title: 'Ingredient',
  type: 'document',
  fieldsets: [
    {
      name: 'facts',
      title: 'Facts',
      description: 'Structured facts that recipes and the page facts panel rely on.',
      options: {collapsible: true, collapsed: false}
    }
  ],
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
      of: [{type: 'block'}, {type: 'comparisonTable'}],
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
    // FACTS
    // One figure or one fixed value per field, so recipes and pages can rely on
    // them rather than parsing prose. Every field is optional and the page
    // renders nothing for one that is unset.
    defineField({
      name: 'abvPercent',
      title: 'ABV %',
      type: 'number',
      fieldset: 'facts',
      description:
        'The single figure the Field Manual uses, including for UK units in recipes (e.g. 40, 44.7). One decimal place at most. Use 0 for a non-alcoholic ingredient. Put any range in the ABV note.',
      validation: Rule => [
        Rule.min(0).max(100).precision(1),
        Rule.custom((value, context) => {
          const category = (context.document as {legalCategory?: string} | undefined)?.legalCategory
          if (value === undefined && category && !['non-alcoholic', 'food', 'other'].includes(category)) {
            return 'An alcoholic legal category needs an ABV figure for recipe units.'
          }
          return true
        }).warning()
      ]
    }),
    defineField({
      name: 'abvNote',
      title: 'ABV note',
      type: 'string',
      fieldset: 'facts',
      description: 'Shown under the figure where bottlings vary, e.g. "Bottlings run 15 to 18%".'
    }),
    defineField({
      name: 'legalCategory',
      title: 'Legal category',
      type: 'string',
      fieldset: 'facts',
      description: 'What UK law lets it be sold as, which is not always what people call it: sloe gin is a liqueur.',
      options: {list: [...LEGAL_CATEGORIES], layout: 'dropdown'}
    }),
    defineField({
      name: 'legalNote',
      title: 'Legal note',
      type: 'string',
      fieldset: 'facts',
      description: 'A short qualification shown beside the category, e.g. "Sold as a liqueur, though it is named after gin".'
    }),
    defineField({
      name: 'allergens',
      title: 'Allergens',
      type: 'array',
      of: [{type: 'string'}],
      fieldset: 'facts',
      description:
        'Which of the UK 14 it contains. Shown on the page as "Contains: …". Sulphites go here, not in the prose. Leave empty and tick "Allergens reviewed" for an ingredient that contains none.',
      options: {list: [...ALLERGENS], layout: 'grid'},
      validation: Rule => [
        Rule.unique(),
        Rule.custom((value, context) => {
          const reviewed = (context.document as {allergensReviewed?: boolean} | undefined)?.allergensReviewed
          if (Array.isArray(value) && value.length > 0 && !reviewed) {
            return 'Tick "Allergens reviewed": the page shows no allergen line until it is.'
          }
          return true
        })
      ]
    }),
    defineField({
      name: 'allergensReviewed',
      title: 'Allergens reviewed',
      type: 'boolean',
      fieldset: 'facts',
      description:
        'Tick once the allergens have been checked. Unticked, the page says nothing about allergens, so "none" and "not checked" can never be confused.'
    }),
    defineField({
      name: 'allergenNote',
      title: 'Allergen note',
      type: 'string',
      fieldset: 'facts',
      description: 'Follows the allergen line. For a branded product: "Recipes change; check the bottle".'
    }),
    defineField({
      name: 'storage',
      title: 'Storage',
      type: 'text',
      rows: 2,
      fieldset: 'facts',
      description: 'Where and how to keep it, e.g. "In the fridge once opened, cap tight".'
    }),
    defineField({
      name: 'keepsFor',
      title: 'Keeps for',
      type: 'string',
      fieldset: 'facts',
      description: 'How long it keeps once opened or made, e.g. "One month refrigerated". Replaces Shelf Life.'
    }),
    defineField({
      name: 'substitutes',
      title: 'Substitutes',
      type: 'array',
      fieldset: 'facts',
      description: 'Ingredients that can stand in for this one, each with an optional note on the swap. Rendered as links. Replaces Possible Substitutions.',
      of: [
        {
          type: 'object',
          name: 'substitute',
          title: 'Substitute',
          fields: [
            defineField({
              name: 'ingredient',
              title: 'Ingredient',
              type: 'reference',
              to: [{type: 'ingredient'}],
              validation: Rule =>
                Rule.required().custom((value, context) => {
                  const self = (context.document as {_id?: string} | undefined)?._id
                  const ref = (value as {_ref?: string} | undefined)?._ref
                  if (!ref || !self) return true
                  if (ref.replace(/^drafts\./, '') === self.replace(/^drafts\./, '')) {
                    return 'An ingredient cannot substitute for itself.'
                  }
                  return true
                })
            }),
            defineField({
              name: 'note',
              title: 'Note',
              type: 'string',
              description: 'Optional, e.g. "use two thirds the measure; it is sweeter".'
            })
          ],
          preview: {
            select: {title: 'ingredient.name', subtitle: 'note'}
          }
        }
      ]
    }),
    defineField({
      name: 'prep',
      title: 'House recipe',
      type: 'object',
      fieldset: 'facts',
      description: 'Only for something made at home: syrups, cordials, infusions. Shown as a "House recipe" block. Leave empty for anything bought.',
      fields: [
        defineField({
          name: 'ratio',
          title: 'Ratio',
          type: 'string',
          description: 'e.g. "1:1 by weight"'
        }),
        defineField({
          name: 'ingredients',
          title: 'Ingredients',
          type: 'array',
          of: [{type: 'string'}],
          description: 'One per line, with quantities, e.g. "200g caster sugar".'
        }),
        defineField({
          name: 'method',
          title: 'Method',
          type: 'array',
          of: [{type: 'string'}],
          description: 'One step per line, in order.'
        }),
        defineField({
          name: 'yield',
          title: 'Yield',
          type: 'string',
          description: 'e.g. "About 300ml"'
        }),
        defineField({
          name: 'keepsFor',
          title: 'Keeps for',
          type: 'string',
          description: 'e.g. "Two weeks refrigerated"'
        }),
        defineField({
          name: 'foodSafety',
          title: 'Food safety',
          type: 'text',
          rows: 2,
          description: 'e.g. sterilising the bottle, keeping it cold, when to throw it away.'
        })
      ],
      validation: Rule =>
        Rule.custom((value) => {
          const prep = value as {ingredients?: string[]; method?: string[]} | undefined
          if (!prep) return true
          if (!prep.ingredients?.length || !prep.method?.length) {
            return 'A house recipe needs both ingredients and a method.'
          }
          return true
        })
    }),
    defineField({
      name: 'image',
      title: 'Blueprint Image',
      type: 'image',
      options: {
        storeOriginalFilename: true,
        hotspot: true
      },
      description: 'Main image',
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
      title: 'ABV (deprecated)',
      type: 'string',
      description: 'Deprecated: replaced by "ABV %" and "ABV note" in Facts. Still rendered where "ABV %" is empty, until the data migration copies it across.'
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
      title: 'Possible Substitutions (deprecated)',
      type: 'array',
      of: [{type: 'string'}],
      description: 'Deprecated: replaced by "Substitutes" in Facts, which link to the other page. Still rendered where "Substitutes" is empty, until the data migration.'
    }),
    defineField({
      name: 'seasonality',
      title: 'Seasonality',
      type: 'string',
      description: 'Best season (for fresh ingredients) e.g., "Summer", "Year-round"'
    }),

    defineField({
      name: 'shelfLife',
      title: 'Shelf Life (deprecated)',
      type: 'string',
      description: 'Deprecated: replaced by "Keeps for" in Facts. Still rendered where "Keeps for" is empty, until the data migration copies it across.'
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
    defineField({
      name: 'updatedAt',
      title: 'Last Updated',
      type: 'datetime',
      description: 'Set only when the content materially changes. Shown on the page as "Updated <date>" and used as the structured-data modified date.'
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
