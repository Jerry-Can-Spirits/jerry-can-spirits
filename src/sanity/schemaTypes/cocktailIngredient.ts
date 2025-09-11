import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'cocktailIngredient',
  title: 'Cocktail Ingredient',
  type: 'object',
  fields: [
    defineField({
      name: 'ingredient',
      title: 'Ingredient',
      type: 'reference',
      to: [{type: 'ingredient'}],
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'amount',
      title: 'Amount',
      type: 'string',
      validation: Rule => Rule.required(),
      placeholder: 'e.g., 2 oz, 1/2 oz, dash'
    }),
    defineField({
      name: 'notes',
      title: 'Special Notes',
      type: 'string',
      placeholder: 'e.g., freshly squeezed, aged'
    })
  ],
  preview: {
    select: {
      ingredientName: 'ingredient.name',
      amount: 'amount',
      media: 'ingredient.image'
    },
    prepare({ingredientName, amount, media}) {
      return {
        title: `${amount} ${ingredientName || 'Unknown ingredient'}`,
        subtitle: 'Ingredient',
        media
      }
    }
  }
})