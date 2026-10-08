import {defineField, defineType} from 'sanity'

// A table placed inline in a rich text body, where the comparison is relevant.
// Same shape as the guide's top-level comparisonTables entries, so one
// component renders both.
export default defineType({
  name: 'comparisonTable',
  title: 'Comparison Table',
  type: 'object',
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
      description: 'Table column headers (e.g., "Brand", "Origin", "ABV"). The first column names each row.',
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
      validation: Rule => Rule.required().min(1)
    })
  ],
  preview: {
    select: {
      title: 'caption',
      headers: 'headers'
    },
    prepare({title, headers}) {
      return {
        title: title || 'Comparison Table',
        subtitle: headers?.join(' • ') || ''
      }
    }
  }
})
