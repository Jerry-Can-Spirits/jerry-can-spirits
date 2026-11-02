import { defineField } from 'sanity'

// The rich form of an FAQ answer, shared by the four Field Manual FAQ arrays.
// When present it replaces `answer` on the page and in the FAQPage structured
// data, so an answer can carry an inline link; `answer` stays as the plain
// copy the way guide sections keep `content` beside `contentRich`.
export const faqAnswerRich = defineField({
  name: 'answerRich',
  title: 'Answer (with links)',
  type: 'array',
  description: 'Optional. When filled in, this is the answer the page shows and the structured data carries; Answer above is then only a plain-text copy.',
  of: [
    {
      type: 'block',
      styles: [{ title: 'Normal', value: 'normal' }],
      lists: [],
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
                to: [{ type: 'cocktail' }, { type: 'ingredient' }, { type: 'equipment' }, { type: 'guide' }]
              })
            ]
          }
        ]
      }
    }
  ]
})
