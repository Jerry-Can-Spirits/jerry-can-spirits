import {defineField, defineType} from 'sanity'

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
      title: 'Garnish',
      type: 'string',
      validation: Rule => Rule.required()
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
      validation: Rule => Rule.max(5)
    }),
    defineField({
      name: 'category',
      title: 'Base Spirit / Cocktail Family',
      type: 'string',
      options: {
        list: [
          {title: 'Spiced Rum', value: 'spiced-rum'},
          {title: 'White Rum', value: 'white-rum'},
          {title: 'Aged Rum', value: 'aged-rum'},
          {title: 'Dark Rum', value: 'dark-rum'},
          {title: 'Overproof Rum', value: 'overproof-rum'},
          {title: 'Vodka', value: 'vodka'},
          {title: 'Gin', value: 'gin'},
          {title: 'Tequila', value: 'tequila'},
          {title: 'Whiskey', value: 'whiskey'},
          {title: 'Aromatised Wine', value: 'aromatised-wine'},
          {title: 'Champagne', value: 'champagne'},
          {title: 'Liqueur-Based', value: 'liqueur-based'},
          {title: 'Non-Alcoholic', value: 'non-alcoholic'}
        ]
      },
      initialValue: 'spiced-rum',
      description: 'The primary/base spirit or cocktail family'
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        list: [
          // Strength & Structure
          {title: 'High-ABV', value: 'high-abv'},
          {title: 'Low-ABV', value: 'low-abv'},
          {title: 'Sessionable', value: 'sessionable'},
          {title: 'Multi-Spirit', value: 'multi-spirit'},
          {title: 'Spirit-Forward', value: 'spirit-forward'},
          {title: 'Long Drink', value: 'long-drink'},
          // Occasion / Intent
          {title: 'Party', value: 'party'},
          {title: 'After-Dinner', value: 'after-dinner'},
          {title: 'Aperitif', value: 'aperitif'},
          {title: 'Celebratory', value: 'celebratory'},
          {title: 'Late Night', value: 'late-night'},
          // Preparation / Service
          {title: 'Built', value: 'built'},
          {title: 'Shaken', value: 'shaken'},
          {title: 'Stirred', value: 'stirred'},
          {title: 'Batchable', value: 'batchable'},
          {title: 'Shot', value: 'shot'}
        ],
        layout: 'grid'
      },
      description: 'Select multiple tags to help categorise this cocktail'
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
      }
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
