import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'guide',
  title: 'Guide',
  type: 'document',
  fields: [
    // Basic Info
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Guide title (H1) - should be clear and descriptive',
      validation: Rule => Rule.required().max(80)
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
      description: 'Short summary shown in listings and search results (150-160 characters)',
      validation: Rule => Rule.required().max(160)
    }),

    // SEO Fields
    defineField({
      name: 'metaTitle',
      title: 'Meta Title',
      type: 'string',
      description: 'SEO title (55-60 characters) - if empty, uses main title',
      validation: Rule => Rule.max(60)
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta Description',
      type: 'text',
      rows: 2,
      description: 'SEO description (150-160 characters) - if empty, uses excerpt',
      validation: Rule => Rule.max(160)
    }),
    defineField({
      name: 'keywords',
      title: 'Focus Keywords',
      type: 'array',
      of: [{type: 'string'}],
      description: 'Target keywords for this guide (for internal reference)'
    }),

    // Content Structure
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          {title: 'Spirits Education', value: 'spirits-education'},
          {title: 'Rum Guides', value: 'rum-guides'},
          {title: 'Cocktail Techniques', value: 'cocktail-techniques'},
          {title: 'Buying Guides', value: 'buying-guides'},
          {title: 'UK Craft Spirits', value: 'uk-craft-spirits'},
          {title: 'Industry Insights', value: 'industry-insights'},
          {title: 'Seasonal & Occasions', value: 'seasonal-occasions'}
        ]
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'featured',
      title: 'Featured Guide',
      type: 'boolean',
      initialValue: false,
      description: 'Show prominently on guides hub page'
    }),
    defineField({
      name: 'isPillar',
      title: 'Pillar Content',
      type: 'boolean',
      initialValue: false,
      description: 'Mark as pillar page (comprehensive topic authority)'
    }),

    // Author & Dates
    defineField({
      name: 'author',
      title: 'Author',
      type: 'string',
      initialValue: 'Jerry Can Spirits',
      description: 'Author name for article schema'
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published Date',
      type: 'datetime',
      description: 'Publication date (if empty, uses creation date)'
    }),
    defineField({
      name: 'updatedAt',
      title: 'Last Updated',
      type: 'datetime',
      description: 'Last significant update date'
    }),

    // Main Content
    defineField({
      name: 'introduction',
      title: 'Introduction',
      type: 'text',
      rows: 4,
      description: 'Opening paragraph - clear, factual summary (LLM-friendly)',
      validation: Rule => Rule.required().min(100).max(500)
    }),
    defineField({
      name: 'sections',
      title: 'Content Sections',
      type: 'array',
      description: 'Main body content organized into sections',
      of: [
        {
          type: 'object',
          name: 'contentSection',
          title: 'Section',
          fields: [
            defineField({
              name: 'heading',
              title: 'Heading (H2)',
              type: 'string',
              validation: Rule => Rule.required()
            }),
            defineField({
              name: 'content',
              title: 'Content (legacy plain text)',
              type: 'text',
              rows: 8,
              hidden: true,
              description: 'Legacy plain-text body. Superseded by Rich Content; retained as the migration rollback source.'
            }),
            defineField({
              name: 'contentRich',
              title: 'Rich Content',
              type: 'array',
              description: 'Section body as rich text. Link cocktails, ingredients, equipment and other guides inline on first mention.',
              of: [
                {
                  type: 'block',
                  marks: {
                    annotations: [
                      {
                        name: 'link',
                        title: 'External link',
                        type: 'object',
                        fields: [defineField({ name: 'href', title: 'URL', type: 'url' })]
                      },
                      {
                        name: 'internalLink',
                        title: 'Field Manual link',
                        type: 'object',
                        fields: [
                          defineField({
                            name: 'reference',
                            title: 'Reference',
                            type: 'reference',
                            to: [
                              { type: 'cocktail' },
                              { type: 'ingredient' },
                              { type: 'equipment' },
                              { type: 'guide' }
                            ]
                          })
                        ]
                      }
                    ]
                  }
                }
              ]
            }),
            defineField({
              name: 'subsections',
              title: 'Subsections (H3)',
              type: 'array',
              of: [
                {
                  type: 'object',
                  name: 'subsection',
                  fields: [
                    defineField({
                      name: 'subheading',
                      title: 'Subheading (H3)',
                      type: 'string'
                    }),
                    defineField({
                      name: 'content',
                      title: 'Content (legacy plain text)',
                      type: 'text',
                      rows: 4,
                      hidden: true,
                      description: 'Legacy plain-text body. Superseded by Rich Content.'
                    }),
                    defineField({
                      name: 'contentRich',
                      title: 'Rich Content',
                      type: 'array',
                      description: 'Subsection body as rich text with inline Field Manual links.',
                      of: [
                        {
                          type: 'block',
                          marks: {
                            annotations: [
                              {
                                name: 'link',
                                title: 'External link',
                                type: 'object',
                                fields: [defineField({ name: 'href', title: 'URL', type: 'url' })]
                              },
                              {
                                name: 'internalLink',
                                title: 'Field Manual link',
                                type: 'object',
                                fields: [
                                  defineField({
                                    name: 'reference',
                                    title: 'Reference',
                                    type: 'reference',
                                    to: [
                                      { type: 'cocktail' },
                                      { type: 'ingredient' },
                                      { type: 'equipment' },
                                      { type: 'guide' }
                                    ]
                                  })
                                ]
                              }
                            ]
                          }
                        }
                      ]
                    })
                  ],
                  preview: {
                    select: {
                      title: 'subheading'
                    }
                  }
                }
              ]
            })
          ],
          preview: {
            select: {
              title: 'heading'
            }
          }
        }
      ],
      validation: Rule => Rule.required().min(3)
    }),

    // FAQs (Critical for SEO/LLM)
    defineField({
      name: 'faqs',
      title: 'FAQs',
      type: 'array',
      description: 'Frequently Asked Questions (3-5 recommended per guide)',
      of: [
        {
          type: 'object',
          name: 'faq',
          title: 'FAQ',
          fields: [
            defineField({
              name: 'question',
              title: 'Question',
              type: 'string',
              description: 'Natural question format (e.g., "What is spiced rum?")',
              validation: Rule => Rule.required()
            }),
            defineField({
              name: 'answer',
              title: 'Answer',
              type: 'text',
              rows: 3,
              description: 'Clear, factual answer (2-3 sentences)',
              validation: Rule => Rule.required()
            })
          ],
          preview: {
            select: {
              title: 'question',
              subtitle: 'answer'
            }
          }
        }
      ],
      validation: Rule => Rule.min(3).max(10)
    }),

    // Comparison Tables
    defineField({
      name: 'comparisonTables',
      title: 'Comparison Tables',
      type: 'array',
      description: 'HTML tables for brand comparisons, specifications, etc.',
      of: [
        {
          type: 'object',
          name: 'table',
          title: 'Comparison Table',
          fields: [
            defineField({
              name: 'caption',
              title: 'Table Caption',
              type: 'string',
              description: 'Descriptive title for the table',
              validation: Rule => Rule.required()
            }),
            defineField({
              name: 'headers',
              title: 'Column Headers',
              type: 'array',
              of: [{type: 'string'}],
              description: 'Table column headers (e.g., "Brand", "Origin", "ABV")',
              validation: Rule => Rule.required().min(2).max(6)
            }),
            defineField({
              name: 'rows',
              title: 'Table Rows',
              type: 'array',
              of: [
                {
                  type: 'object',
                  name: 'row',
                  fields: [
                    defineField({
                      name: 'cells',
                      title: 'Row Data',
                      type: 'array',
                      of: [{type: 'string'}],
                      description: 'Data for each column in this row'
                    })
                  ],
                  preview: {
                    select: {
                      cells: 'cells'
                    },
                    prepare({cells}) {
                      return {
                        title: cells?.[0] || 'Row'
                      }
                    }
                  }
                }
              ],
              validation: Rule => Rule.min(1)
            })
          ],
          preview: {
            select: {
              title: 'caption',
              headers: 'headers'
            },
            prepare({title, headers}) {
              return {
                title: title,
                subtitle: headers?.join(' • ') || ''
              }
            }
          }
        }
      ]
    }),

    // UK Craft Distillery Features
    defineField({
      name: 'featuredDistilleries',
      title: 'Featured UK Craft Distilleries',
      type: 'array',
      description: 'UK craft distilleries mentioned in this guide',
      of: [
        {
          type: 'object',
          name: 'distillery',
          title: 'Distillery',
          fields: [
            defineField({
              name: 'name',
              title: 'Distillery Name',
              type: 'string',
              validation: Rule => Rule.required()
            }),
            defineField({
              name: 'location',
              title: 'Location',
              type: 'string',
              description: 'Town/City, Region',
              validation: Rule => Rule.required()
            }),
            defineField({
              name: 'description',
              title: 'Description',
              type: 'text',
              rows: 3,
              description: 'Brief factual description of the distillery',
              // An editorial feature must stand on its own: the moment a
              // description mentions our brand it is asserting a relationship,
              // which is how a present-tense partnership claim ended up in this
              // field once before. Warning, not error, so Studio flags it for a
              // human decision instead of hard-blocking.
              validation: Rule =>
                Rule.custom((desc, context) => {
                  const rel = (context.parent as { relationship?: string } | undefined)?.relationship
                  if (
                    typeof desc === 'string' &&
                    /jerry can|expedition spiced/i.test(desc) &&
                    (!rel || rel === 'editorial')
                  ) {
                    return 'Editorial distillery features must not reference Jerry Can Spirits or Expedition Spiced Rum. If there is a real relationship, set the relationship field instead of writing it into the description.'
                  }
                  return true
                }).warning()
            }),
            defineField({
              name: 'website',
              title: 'Website URL',
              type: 'url'
            }),
            defineField({
              name: 'speciality',
              title: 'Speciality',
              type: 'string',
              description: 'What they\'re known for (e.g., "Botanical Rum", "Navy Strength")'
            }),
            // Distinguishes "distillery we are writing about" from "distillery
            // we work or worked with". Partner values are Studio-internal
            // records: the guide-page query filters them out at the data layer
            // (see guideBySlugQuery), so they can never render publicly and a
            // future template refactor cannot accidentally expose them.
            defineField({
              name: 'relationship',
              title: 'Relationship to Jerry Can Spirits',
              type: 'string',
              initialValue: 'editorial',
              validation: Rule => Rule.required(),
              options: {
                layout: 'radio',
                list: [
                  { title: 'Editorial feature (no commercial relationship)', value: 'editorial' },
                  { title: 'Former production partner (never rendered)', value: 'former-partner' },
                  { title: 'Current partner (never rendered)', value: 'current-partner' },
                ],
              },
            })
          ],
          preview: {
            select: {
              title: 'name',
              subtitle: 'location'
            }
          }
        }
      ]
    }),

    // Related Content
    defineField({
      name: 'relatedGuides',
      title: 'Related Guides',
      type: 'array',
      description: 'Link to related guide articles (for cluster content)',
      of: [
        {
          type: 'reference',
          to: [{type: 'guide'}]
        }
      ]
    }),
    defineField({
      name: 'relatedCocktails',
      title: 'Related Cocktails',
      type: 'array',
      description: 'Link to relevant cocktail recipes from Field Manual',
      of: [
        {
          type: 'reference',
          to: [{type: 'cocktail'}]
        }
      ]
    }),
    defineField({
      name: 'relatedProducts',
      title: 'Related Products',
      type: 'array',
      description: 'Jerry Can Spirits products relevant to this guide',
      of: [
        {
          type: 'object',
          name: 'product',
          fields: [
            defineField({
              name: 'shopifyHandle',
              title: 'Shopify Product Handle',
              type: 'string',
              description: 'Full product handle from Shopify (e.g., "jerry-can-spirits-expedition-spiced-rum")',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'contextNote',
              title: 'Context Note',
              type: 'string',
              description: 'Why this product is relevant (shown in guide)'
            })
          ]
        }
      ]
    }),

    // Image
    defineField({
      name: 'heroImage',
      title: 'Hero Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      description: 'Featured image for the guide',
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          description: 'Describe what is visible in the image. Used for accessibility and SEO.',
        })
      ]
    }),

    // Call to Action
    defineField({
      name: 'callToAction',
      title: 'Call to Action',
      type: 'object',
      description: 'Optional CTA at end of guide',
      fields: [
        defineField({
          name: 'text',
          title: 'CTA Text',
          type: 'string'
        }),
        defineField({
          name: 'url',
          title: 'CTA URL',
          type: 'string',
          description: 'Internal link (e.g., /shop/spirits)'
        })
      ]
    }),

    // Word Count (for reference)
    defineField({
      name: 'estimatedWordCount',
      title: 'Estimated Word Count',
      type: 'number',
      description: 'Approximate word count (for SEO tracking)',
      readOnly: false
    })
  ],
  preview: {
    select: {
      title: 'title',
      category: 'category',
      isPillar: 'isPillar',
      featured: 'featured',
      media: 'heroImage'
    },
    prepare({title, category, isPillar, featured}) {
      let prefix = ''
      if (isPillar) prefix = '📍 '
      else if (featured) prefix = '⭐ '

      return {
        title: `${prefix}${title}`,
        subtitle: category ? category.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : ''
      }
    }
  }
})
