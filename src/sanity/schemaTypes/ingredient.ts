import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'ingredient',
  title: 'Ingredient',
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
          {title: 'Spirits', value: 'spirits'},
          {title: 'Liqueurs', value: 'liqueurs'},
          {title: 'Bitters', value: 'bitters'},
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
      validation: Rule => Rule.required().min(1)
    }),
    defineField({
      name: 'recommendedBrands',
      title: 'Recommended Brands',
      type: 'object',
      fields: [
        defineField({
          name: 'budget',
          title: 'Budget Choice',
          type: 'string'
        }),
        defineField({
          name: 'premium',
          title: 'Premium Choice',
          type: 'string'
        })
      ]
    }),
    defineField({
      name: 'storage',
      title: 'Storage & Handling',
      type: 'text',
      rows: 2
    }),
    defineField({
      name: 'image',
      title: 'Blueprint Image',
      type: 'image',
      options: {
        hotspot: true,
      }
    }),
    defineField({
      name: 'featured',
      title: 'Featured Ingredient',
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