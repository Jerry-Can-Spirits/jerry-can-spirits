import {defineField, defineType} from 'sanity'
import {validateHouseVariation} from '../../lib/recipe-source'

export default defineType({
  name: 'cocktail',
  title: 'Cocktail',
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
      description: 'SEO title tag (55–60 characters). Leave empty to use "[Name] Recipe" automatically.',
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
      description: 'Synonyms and search terms for this cocktail (e.g., "rum sour", "citrus cocktail", "easy summer drink")'
    }),
    defineField({
      name: 'servings',
      title: 'Servings',
      type: 'string',
      description: 'Number of servings for Google Recipe structured data (e.g., "1 cocktail", "8–10 as punch")'
    }),
    defineField({
      name: 'prepTime',
      title: 'Prep Time',
      type: 'string',
      description: 'Prep time in ISO 8601 format for Google Recipe structured data (e.g., "PT5M" = 5 min, "PT10M" = 10 min)'
    }),
    defineField({
      name: 'difficulty',
      title: 'Difficulty Level',
      type: 'string',
      options: {
        list: [
          {title: 'Novice', value: 'novice'},
          {title: 'Wayfinder', value: 'wayfinder'},
          {title: 'Trailblazer', value: 'trailblazer'}
        ]
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'glassware',
      title: 'Glassware',
      type: 'reference',
      to: [{type: 'equipment'}],
      options: {
        filter: 'category == "glassware"'
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'garnish',
      title: 'Garnish (legacy text)',
      type: 'string',
      hidden: true,
      description: 'Deprecated: superseded by the structured Garnish field below. Kept for reference.'
    }),
    defineField({
      name: 'garnishes',
      title: 'Garnish',
      type: 'array',
      description: 'Each garnish links to its ingredient page (leave the reference empty for a garnish with no page, e.g. a gardenia flower), with an optional note on how it is applied.',
      of: [
        {
          type: 'object',
          name: 'garnishItem',
          title: 'Garnish',
          fields: [
            defineField({
              name: 'ingredient',
              title: 'Garnish ingredient',
              type: 'reference',
              to: [{ type: 'ingredient' }],
              description: 'The garnish ingredient page. Leave empty for a garnish with no page.'
            }),
            defineField({
              name: 'note',
              title: 'Note',
              type: 'string',
              description: 'How it is applied, e.g. "expressed over the glass and rested on the rim".'
            })
          ],
          preview: {
            select: { title: 'ingredient.name', note: 'note' },
            prepare({ title, note }: { title?: string; note?: string }) {
              return { title: title || note || 'Garnish', subtitle: title ? note : '' }
            }
          }
        }
      ]
    }),
    defineField({
      name: 'ingredients',
      title: 'Ingredients',
      type: 'array',
      of: [
        {
          type: 'object',
          // FIXED: Renamed from 'ingredient' to 'cocktailIngredient' to avoid conflict with global ingredient type
          name: 'cocktailIngredient',
          title: 'Ingredient',
          fields: [
            defineField({
              name: 'name',
              title: 'Ingredient Name',
              type: 'string',
              validation: Rule => Rule.required()
            }),
            defineField({
              name: 'ingredientRef',
              title: 'Link to Ingredient Guide',
              type: 'reference',
              to: [{type: 'ingredient'}],
              description: 'Optional: Link this ingredient to the Field Manual ingredient guide'
            }),
            defineField({
              name: 'amount',
              title: 'Amount',
              type: 'string',
              validation: Rule => Rule.required()
            }),
            defineField({
              name: 'description',
              title: 'Description',
              type: 'string'
            })
          ],
          preview: {
            select: {
              title: 'name',
              subtitle: 'amount'
            }
          }
        }
      ],
      validation: Rule => Rule.required().min(1).max(15)
    }),
    defineField({
      name: 'instructions',
      title: 'Instructions',
      type: 'array',
      of: [{type: 'string'}],
      validation: Rule => Rule.required().min(1).max(10)
    }),
    defineField({
      name: 'note',
      title: 'Expert Tip',
      type: 'text',
      rows: 2
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'string',
      description: 'Who wrote or verified this content (e.g., "Dan Freeman", "Jerry Can Spirits Team")'
    }),
    defineField({
      name: 'faqs',
      title: 'Cocktail FAQs',
      type: 'array',
      of: [
        {
          type: 'object',
          // Named to match the guide schema, which has always called this
          // 'faq'. Without a name the array member is anonymous, so every
          // item carrying _type: 'faq' — 229 of the 348 cocktails, and
          // everything the copy-pass appliers wrote — showed in the Studio as
          // "Item of type faq not valid for this list" while rendering
          // correctly on the site, because the page reads question and answer
          // and never looks at the type.
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
      description: 'Long-tail questions about making, adapting and serving this cocktail. Rendered visibly and as FAQPage schema from the same data.'
    }),
    defineField({
      name: 'variants',
      title: 'Variations',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'variant',
          title: 'Variant',
          fields: [
            defineField({
              name: 'name',
              title: 'Variant Name',
              type: 'string',
              validation: Rule => Rule.required()
            }),
            defineField({
              name: 'description',
              title: 'Description',
              type: 'text',
              rows: 2,
              validation: Rule => Rule.required()
            }),
            defineField({
              name: 'difficulty',
              title: 'Difficulty Level',
              type: 'string',
              options: {
                list: [
                  {title: 'Novice', value: 'novice'},
                  {title: 'Wayfinder', value: 'wayfinder'},
                  {title: 'Trailblazer', value: 'trailblazer'}
                ]
              },
              validation: Rule => Rule.required()
            }),
            defineField({
              name: 'ingredients',
              title: 'Ingredients',
              type: 'array',
              of: [
                {
                  type: 'object',
                  name: 'variantIngredient',
                  title: 'Ingredient',
                  fields: [
                    defineField({
                      name: 'name',
                      title: 'Ingredient Name',
                      type: 'string',
                      validation: Rule => Rule.required()
                    }),
                    defineField({
                      name: 'ingredientRef',
                      title: 'Link to Ingredient Guide',
                      type: 'reference',
                      to: [{type: 'ingredient'}],
                      description: 'Optional: Link this ingredient to the Field Manual ingredient guide'
                    }),
                    defineField({
                      name: 'amount',
                      title: 'Amount',
                      type: 'string',
                      validation: Rule => Rule.required()
                    })
                  ],
                  preview: {
                    select: {
                      title: 'name',
                      subtitle: 'amount'
                    }
                  }
                }
              ],
              validation: Rule => Rule.required().min(1).max(10)
            }),
            defineField({
              name: 'instructions',
              title: 'Instructions',
              type: 'array',
              of: [{type: 'string'}],
              validation: Rule => Rule.required().min(1).max(8)
            }),
            defineField({
              name: 'note',
              title: 'Special Note',
              type: 'string'
            })
          ],
          preview: {
            select: {
              title: 'name',
              subtitle: 'description',
              difficulty: 'difficulty'
            },
            prepare({title, subtitle, difficulty}) {
              return {
                title: title,
                subtitle: `${difficulty?.charAt(0).toUpperCase() + difficulty?.slice(1)} - ${subtitle}`
              }
            }
          }
        }
      ],
      validation: Rule => Rule.max(12)
    }),
    defineField({
      name: 'family',
      title: 'Cocktail Family',
      type: 'string',
      options: {
        list: [
          // Signature - Jerry Can proprietary cocktails
          {title: 'Signature', value: 'signature'},
          // Classic families from Savoy & Jerry Thomas
          {title: 'Sours', value: 'sours'},
          {title: 'Old Fashioneds', value: 'old-fashioneds'},
          {title: 'Highballs', value: 'highballs'},
          {title: 'Mules', value: 'mules'},
          {title: 'Fizzes', value: 'fizzes'},
          {title: 'Collins', value: 'collins'},
          {title: 'Tiki', value: 'tiki'},
          {title: 'Slings', value: 'slings'},
          {title: 'Punches', value: 'punches'},
          {title: 'Cobblers', value: 'cobblers'},
          {title: 'Juleps', value: 'juleps'},
          {title: 'Smashes', value: 'smashes'},
          {title: 'Flips', value: 'flips'},
          {title: 'Toddies', value: 'toddies'},
          {title: 'Swizzles', value: 'swizzles'},
          {title: 'Spritz', value: 'spritz'},
          {title: 'Negronis', value: 'negronis'},
          {title: 'Martinis', value: 'martinis'},
          {title: 'Manhattans', value: 'manhattans'},
          {title: 'Shots & Shooters', value: 'shots-shooters'},
          {title: 'Mocktails', value: 'mocktails'},
          {title: 'Other', value: 'other'}
        ]
      },
      validation: Rule => Rule.required(),
      description: 'The cocktail family/style category'
    }),
    defineField({
      name: 'baseSpirit',
      title: 'Base Spirit',
      type: 'string',
      options: {
        list: [
          // Rum varieties
          {title: 'Spiced Rum', value: 'spiced-rum'},
          {title: 'White Rum', value: 'white-rum'},
          {title: 'Aged Rum', value: 'aged-rum'},
          {title: 'Dark Rum', value: 'dark-rum'},
          {title: 'Overproof Rum', value: 'overproof-rum'},
          {title: 'Rhum Agricole', value: 'rhum-agricole'},
          // Other spirits
          {title: 'Vodka', value: 'vodka'},
          // Gin sub-types. "Gin" stays for the recipes that name no style: 47 of
          // 72 say only "gin", and inventing a style for them would be a claim
          // the recipe does not make. Sloe gin is deliberately absent — it is a
          // liqueur, not a gin, and lives under liqueurs with a parent of Gin.
          {title: 'Gin', value: 'gin'},
          {title: 'London Dry Gin', value: 'london-dry-gin'},
          {title: 'Old Tom Gin', value: 'old-tom-gin'},
          {title: 'Plymouth Gin', value: 'plymouth-gin'},
          {title: 'Navy Strength Gin', value: 'navy-strength-gin'},
          // Genever stands alone rather than joining the gin styles above. It
          // passes the class test easily — a base spirit at full strength doing
          // a base spirit's job, unlike sloe gin — but fails on direction: gin
          // descends from genever, so filing it as a style of gin is backwards.
          // The Old Tom page already puts it correctly, as "the missing link
          // between Dutch genever and London Dry".
          {title: 'Genever', value: 'genever'},
          {title: 'Tequila', value: 'tequila'},
          {title: 'Mezcal', value: 'mezcal'},
          {title: 'Bourbon', value: 'bourbon'},
          {title: 'Rye Whiskey', value: 'rye-whiskey'},
          {title: 'Scotch', value: 'scotch'},
          {title: 'Irish Whiskey', value: 'irish-whiskey'},
          {title: 'Welsh Whisky', value: 'welsh-whisky'},
          {title: 'Brandy', value: 'brandy'},
          {title: 'Cognac', value: 'cognac'},
          {title: 'Cachaça', value: 'cachaca'},
          {title: 'Pisco', value: 'pisco'},
          // Wine-based
          {title: 'Vermouth', value: 'vermouth'},
          {title: 'Sherry', value: 'sherry'},
          {title: 'Champagne', value: 'champagne'},
          // Other
          {title: 'Beer', value: 'beer'},
          {title: 'Liqueur', value: 'liqueur'},
          {title: 'Multiple Spirits', value: 'multiple'},
          {title: 'Non-Alcoholic', value: 'non-alcoholic'}
        ]
      },
      initialValue: 'spiced-rum',
      description: 'The primary spirit in this cocktail'
    }),
    defineField({
      name: 'featuredSpirit',
      title: 'Featured Spirit',
      type: 'reference',
      to: [{type: 'ingredient'}],
      description: 'Link to a specific ingredient guide for the featured spirit in this cocktail'
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        list: [
          // Strength / Style
          {title: 'High-ABV', value: 'high-abv'},
          {title: 'Low-ABV', value: 'low-abv'},
          {title: 'Sessionable', value: 'sessionable'},
          {title: 'Spirit-Forward', value: 'spirit-forward'},
          {title: 'Multi-Spirit', value: 'multi-spirit'},
          // Format / Serve
          {title: 'Long Drink', value: 'long-drink'},
          {title: 'Built', value: 'built'},
          {title: 'Shaken', value: 'shaken'},
          {title: 'Stirred', value: 'stirred'},
          {title: 'Batchable', value: 'batchable'},
          {title: 'Shot', value: 'shot'},
          {title: 'Hot', value: 'hot'},
          {title: 'Frozen', value: 'frozen'},
          // Context / Occasion
          {title: 'Party', value: 'party'},
          {title: 'Brunch', value: 'brunch'},
          {title: 'Aperitif', value: 'aperitif'},
          {title: 'After-Dinner', value: 'after-dinner'},
          {title: 'Digestif', value: 'digestif'},
          {title: 'Celebratory', value: 'celebratory'},
          {title: 'Late Night', value: 'late-night'},
          {title: 'Tiki', value: 'tiki'},
          // Flavour
          {title: 'Bitter', value: 'bitter'},
          // Special
          {title: 'Caffeinated', value: 'caffeinated'},
          {title: 'Classic', value: 'classic'}
        ],
        layout: 'grid'
      },
      description: 'Select multiple tags to help categorise this cocktail'
    }),
    defineField({
      name: 'flavorProfile',
      title: 'Flavour Profile',
      type: 'array',
      of: [{type: 'string'}],
      description: 'Key flavour notes for this cocktail (e.g., "citrus", "smoky", "sweet", "tropical", "herbal")'
    }),
    defineField({
      name: 'featured',
      title: 'Featured Cocktail',
      type: 'boolean',
      initialValue: false
    }),
    defineField({
      name: 'image',
      title: 'Cocktail Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          description: 'Describe what is visible in the image — the glass, garnish, colour, setting. Used for accessibility and SEO.',
        })
      ]
    }),
    defineField({
      name: 'videoUrl',
      title: 'Video URL',
      type: 'url',
      description: 'YouTube or other video URL for this cocktail recipe. Improves Google Recipe rich result eligibility.',
      validation: Rule => Rule.uri({ scheme: ['https'] })
    }),
    defineField({
      name: 'relatedGuides',
      title: 'Related Technique Guides',
      type: 'array',
      description: 'Link to guides that explain techniques used in this cocktail',
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
              description: 'Section heading to link to (e.g., "Muddling Basics"). Leave empty to link to full guide.'
            }),
            defineField({
              name: 'linkText',
              title: 'Link Text Override',
              type: 'string',
              description: 'Custom link text (e.g., "Learn how to muddle"). If empty, uses guide title.'
            })
          ],
          preview: {
            select: {
              guideTitle: 'guide.title',
              sectionAnchor: 'sectionAnchor',
              linkText: 'linkText'
            },
            prepare({guideTitle, sectionAnchor, linkText}) {
              return {
                title: linkText || guideTitle || 'Guide Link',
                subtitle: sectionAnchor ? `→ ${sectionAnchor}` : 'Full guide'
              }
            }
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
      description: 'Similar or complementary cocktails to show alongside this one'
    }),
    defineField({
      name: 'recipeSource',
      title: 'Recipe Source',
      type: 'object',
      description:
        'Where this specification comes from. Recording it lets a reader judge the recipe, and lets us tell a considered house choice apart from a transcription error.',
      fields: [
        defineField({
          name: 'authority',
          title: 'Authority',
          type: 'string',
          options: {
            list: [
              {title: 'IBA', value: 'iba'},
              {title: "Difford's Guide", value: 'diffords'},
              {title: 'PDT Cocktail Book', value: 'pdt'},
              {title: 'Death & Co', value: 'death-and-co'},
              {title: 'The Savoy Cocktail Book (Craddock, 1930)', value: 'savoy'},
              {title: "Jerry Thomas's Bar-Tender's Guide (1862)", value: 'thomas'},
              {title: 'The Fine Art of Mixing Drinks (Embury, 1948)', value: 'embury'},
              {title: 'The Old Waldorf-Astoria Bar Book (Crockett)', value: 'waldorf'},
              {title: 'The Joy of Mixology (Regan)', value: 'regan'},
              // Separate from House. A Dark 'n' Stormy is a Gosling trademark
              // whose registered spec names Black Seal, and a Painkiller is a
              // Pusser's trademark. Filing those as House would claim
              // authorship of a drink we did not create. Put the brand in the
              // note field.
              {title: "Brand's own published specification", value: 'brand'},
              {title: 'House specification', value: 'house'}
            ]
          },
          validation: Rule => Rule.required()
        }),
        defineField({
          name: 'note',
          title: 'Note (optional)',
          type: 'string',
          description: 'Edition, page, or which of several published versions this follows.'
        })
      ]
    }),
    defineField({
      name: 'houseVariation',
      title: 'House Variation',
      type: 'text',
      rows: 2,
      description:
        'Required when the authority is House specification. One sentence: what we do differently and why. "We use demerara syrup rather than simple. It suits the rum." No apologising for the choice.',
      validation: Rule =>
        Rule.custom((value, context) =>
          validateHouseVariation(
            (context.parent as {recipeSource?: {authority?: string}} | undefined)?.recipeSource?.authority,
            value as string | undefined
          )
        )
    }),
    defineField({
      name: 'sourceCheckedAt',
      title: 'Source Last Checked',
      type: 'date',
      description: 'When the recipe was last verified against its source. Ages, so it is worth recording.'
    })
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'difficulty',
      media: 'image'
    }
  }
})
