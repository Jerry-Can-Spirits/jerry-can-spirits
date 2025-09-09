import { type SchemaTypeDefinition } from 'sanity'

import cocktail from './schemaTypes/cocktail'
import ingredient from './schemaTypes/ingredient'
import equipment from './schemaTypes/equipment'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [cocktail, ingredient, equipment],
}