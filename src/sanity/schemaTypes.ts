import { type SchemaTypeDefinition } from 'sanity'

import cocktail from './schemaTypes/cocktail'
import ingredient from './schemaTypes/ingredient'
import equipment from './schemaTypes/equipment'
import product from './schemaTypes/product'
import guide from './schemaTypes/guide'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [cocktail, ingredient, equipment, product, guide],
}