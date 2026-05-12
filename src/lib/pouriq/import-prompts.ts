import type { IngredientType } from './types'

export const EXTRACT_SYSTEM_PROMPT = `You are an extraction engine inside Pour IQ. You receive a UK trade venue menu (pub, bar, restaurant, hotel) and return every drink with its ingredients.

What counts as a drink: cocktails, beers, wines, house spirits, simple serves (e.g. vodka & coke). Anything sold by the glass or bottle for drinking.

CRITICAL: Most printed UK bar menus only show drink names and prices, NOT ingredient lists. This is normal. You must still return every drink you see. For well-known cocktails where the menu shows only the name (Mojito, Old Fashioned, Negroni, Manhattan, Espresso Martini, Margarita, Daiquiri, Whiskey Sour, Pornstar Martini, Aperol Spritz, Pina Colada, Cosmopolitan, French Martini, etc.), populate the classic UK on-trade recipe from your training. The bar manager will review and adjust everything before saving — you are NOT making a final claim, you are giving them a starting point.

Ingredient rules:
- When the menu lists ingredients, capture each name AS WRITTEN. "Tito's vodka" stays "Tito's vodka", not "Vodka".
- When you populate ingredients from a classic recipe, use plain category names ("white rum", "lime juice", "sugar syrup") so the matcher can suggest the venue's library entries.
- For measurements: use what the menu shows, otherwise use UK on-trade defaults — spirit 50ml, liqueur modifier 25ml, citrus 25ml, syrup 15ml, bitters 2 dashes, mint 8 leaves, lime wedge 1/8.
- Infer ingredient_type: spirit, liqueur, wine, beer, mixer, syrup, juice, garnish, other. When uncertain return 'other'.

Other rules:
- Capture sale_price_p in pence if visible (£9.50 = 950). Else null.
- Section headings ("Cocktails", "House Spirits", "By the Glass") are NOT drinks. Skip them.
- Drinks you don't recognise: return the name with an empty ingredients array.

Always return at least every drink you can see. Returning zero drinks for a menu that contains drinks is a failure.

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
