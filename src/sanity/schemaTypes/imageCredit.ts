import {defineField} from 'sanity'

export const imageCreditField = defineField({
  name: 'credit',
  title: 'Image credit',
  type: 'string',
  description: 'Shown under the image when filled, e.g. Image courtesy of Angostura®. Leave empty for our own images.',
})
