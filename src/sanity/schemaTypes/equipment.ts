import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'equipment',
  title: 'Equipment',
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
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'usage',
      title: 'Usage',
      type: 'text',
      rows: 2,
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'essential',
      title: 'Essential Item',
      type: 'boolean',
      initialValue: false
    }),
    defineField({
      name: 'specifications',
      title: 'Specifications',
      type: 'object',
      fields: [
        defineField({
          name: 'material',
          title: 'Material',
          type: 'string'
        }),
        defineField({
          name: 'capacity',
          title: 'Capacity',
          type: 'string'
        }),
        defineField({
          name: 'dimensions',
          title: 'Dimensions',
          type: 'string'
        })
      ]
    }),
    defineField({
      name: 'tips',
      title: 'Professional Tips',
      type: 'array',
      of: [{type: 'string'}],
      validation: Rule => Rule.required().min(1)
    }),
    defineField({
      name: 'image',
      title: 'Technical Schematic',
      type: 'image',
      options: {
        hotspot: true,
      }
    }),
    defineField({
      name: 'featured',
      title: 'Featured Equipment',
      type: 'boolean',
      initialValue: false
    })
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'category',
      media: 'image'
    }
  }
})