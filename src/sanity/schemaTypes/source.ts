import {defineField, defineType} from 'sanity'

// One source a page relies on, listed at its foot so the reader can check the
// fact. Registered as a named type so guides use it now and ingredient and
// equipment pages can take the same field later without a second definition.
export default defineType({
  name: 'source',
  title: 'Source',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'The page or document title, as the source gives it.',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'publisher',
      title: 'Publisher',
      type: 'string',
      description: 'Who publishes it (e.g. "IBA", "legislation.gov.uk", "Campari").',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'url',
      title: 'URL',
      type: 'url',
      validation: Rule => Rule.required().uri({scheme: ['http', 'https']})
    }),
    defineField({
      name: 'accessed',
      title: 'Date accessed',
      type: 'date',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'note',
      title: 'Note',
      type: 'string',
      description: 'Optional and short. Required in practice for a secondary source (e.g. "retailer listing; brand publishes no UK ABV").',
      validation: Rule => Rule.max(140)
    })
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'publisher'
    }
  }
})
