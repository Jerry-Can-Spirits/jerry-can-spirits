import type { IngredientType } from './types'

export const EXTRACT_SYSTEM_PROMPT = `You are an extraction engine inside Pour IQ. You receive raw menu text from a UK trade venue (pub, bar, restaurant, hotel) and extract every drink line with its ingredients.

Rules:
- Extract every drink that appears: cocktails AND simple serves (vodka & coke, house spirits with a mixer, beer, wine by the glass).
- For each ingredient, capture the name AS WRITTEN on the menu. Do not normalise or rename. "Tito's vodka" stays "Tito's vodka", not "Vodka".
- Capture the raw measurement string as written. "50ml", "1.5oz", "1/2 lime", "barspoon", "top with soda" — pass it through.
- Infer ingredient_type conservatively from name + context. When uncertain return 'other'. Valid types: spirit, liqueur, wine, beer, mixer, syrup, juice, garnish, other.
- Capture sale_price_p if visible (in pence; £9.50 = 950). Else null.
- Never invent ingredients. If a drink has no recipe shown, return it with an empty ingredients array — the bar manager will fill in.
- Section headings ("Cocktails", "House Spirits") are NOT drinks.

Output: call the pouriq_extract_menu tool with the structured result.`

export interface ExtractedIngredient {
  name: string
  raw_measurement: string
  inferred_type: IngredientType
}

export interface ExtractedDrink {
  name: string
  sale_price_p: number | null
  ingredients: ExtractedIngredient[]
}

export interface ExtractResult {
  drinks: ExtractedDrink[]
}

export const EXTRACT_TOOL = {
  name: 'pouriq_extract_menu',
  description: 'Return the structured list of drinks extracted from the menu text',
  input_schema: {
    type: 'object',
    required: ['drinks'],
    properties: {
      drinks: {
        type: 'array',
        items: {
          type: 'object',
          required: ['name', 'ingredients'],
          properties: {
            name: { type: 'string' },
            sale_price_p: { type: ['integer', 'null'] },
            ingredients: {
              type: 'array',
              items: {
                type: 'object',
                required: ['name', 'raw_measurement', 'inferred_type'],
                properties: {
                  name: { type: 'string' },
                  raw_measurement: { type: 'string' },
                  inferred_type: {
                    type: 'string',
                    enum: ['spirit','liqueur','wine','beer','mixer','syrup','juice','garnish','other'],
                  },
                },
              },
            },
          },
        },
      },
    },
  },
} as const
