import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'tradeHelp',
  title: 'Pour IQ™ help guide',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Page title',
      type: 'string',
      description: 'Shown at the top of /trade/pouriq/help',
      initialValue: 'Pour IQ™ help',
      validation: (Rule) => Rule.required().max(80),
    }),
    defineField({
      name: 'intro',
      title: 'Intro paragraph',
      type: 'text',
      rows: 3,
      description: 'Short paragraph shown above the accordion. Measured, no hype.',
      validation: (Rule) => Rule.required().max(400),
    }),
    defineField({
      name: 'sections',
      title: 'Sections',
      type: 'array',
      description: 'Drag to reorder. Each section becomes one accordion panel.',
      of: [
        {
          type: 'object',
          name: 'helpSection',
          title: 'Section',
          fields: [
            defineField({
              name: 'title',
              title: 'Section title',
              type: 'string',
              description: 'Answers a "how do I X?" question. Visible in the closed accordion.',
              validation: (Rule) => Rule.required().max(80),
            }),
            defineField({
              name: 'body',
              title: 'Body',
              type: 'array',
              // Text-only for v1. Image support can be added later as a
              // paired schema + HelpPortableText renderer change — shipping
              // the schema slot alone would silently drop any inserted image.
              of: [
                { type: 'block' },
              ],
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: { select: { title: 'title' } },
        },
      ],
      validation: (Rule) => Rule.required().min(1),
    }),
  ],
  preview: {
    prepare: () => ({ title: 'Pour IQ™ help guide' }),
  },
})
