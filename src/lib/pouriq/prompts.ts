import type { MenuRow, MenuMetrics, FieldManualMatch } from './types'

export const SYSTEM_PROMPT = `You are Pour IQ, an embedded analyst inside the Jerry Can Spirits trade portal. You help British craft-spirits trade customers (pubs, bars, restaurants, hotels) improve their cocktail menu's profitability and reduce operational complexity.

Voice:
- Measured, grounded, direct. Like a senior bartender who has run the numbers.
- No em-dashes. No emojis. No exclamation marks.
- No hype language. No superlatives unless provable.
- Short sentences. One idea per sentence.

Output rules:
- You must call the pouriq_recommendations tool. Never reply in free text.
- Each recommendation: severity, category, title, body. Optional suggested_change. Optional field_manual_reference.
- "info" = observation, "warn" = problem worth attention, "action" = specific change to make.
- Reference drinks by their drink_id when applicable.
- When a cocktail has a field_manual_url provided, you may include a field_manual_reference if the bartender would benefit from consulting it for technique. Don't oversell.
- Aim for 5-10 recommendations. Quality over quantity.
- Focus areas: pricing gaps vs target GP, ingredient overlap and waste risks, menu balance (over-indexing on one base spirit), complexity (ingredients used once that bloat inventory), high-effort/low-margin cocktails.
- Never invent ingredient costs or sale prices not provided. Reason only from the menu data provided.`

export const RECOMMEND_TOOL = {
  name: 'pouriq_recommendations',
  description: 'Return a list of recommendations for this menu',
  input_schema: {
    type: 'object',
    required: ['recommendations'],
    properties: {
      recommendations: {
        type: 'array',
        items: {
          type: 'object',
          required: ['severity', 'category', 'title', 'body'],
          properties: {
            severity: { type: 'string', enum: ['info', 'warn', 'action'] },
            category: { type: 'string', enum: ['pricing', 'waste', 'balance', 'complexity', 'opportunity'] },
            drink_id: { type: 'string', description: 'References a drink in the menu, if applicable' },
            title: { type: 'string', description: 'Plain-English one-line summary' },
            body: { type: 'string', description: '2-3 sentence explanation' },
            suggested_change: {
              type: 'object',
              properties: {
                action: { type: 'string', enum: ['adjust_price', 'remove_cocktail', 'remove_ingredient', 'swap_ingredient'] },
                from: { type: 'string' },
                to: { type: 'string' },
                impact_summary: { type: 'string' },
              },
            },
            field_manual_reference: {
              type: 'object',
              properties: {
                url: { type: 'string' },
                why_relevant: { type: 'string' },
              },
            },
          },
        },
      },
    },
  },
} as const

export function buildUserMessage(
  menu: MenuRow,
  metrics: MenuMetrics,
  fieldManualMatches: FieldManualMatch[],
): string {
  return JSON.stringify({
    menu: {
      name: menu.name,
      venue_type: menu.venue_type,
      city: menu.city,
      target_gp_pct: menu.target_gp_pct,
      positioning: menu.positioning,
    },
    drinks: metrics.cocktail_metrics.map((m) => {
      const fm = fieldManualMatches.find((f) => f.cocktail_id === m.cocktail_id)
      return {
        drink_id: m.cocktail_id,
        name: m.name,
        sale_price_p: m.sale_price_p,
        pour_cost_p: m.pour_cost_p,
        margin_p: m.margin_p,
        gp_pct: m.gp_pct,
        field_manual_url: fm?.field_manual_url,
      }
    }),
    ingredient_overlap: metrics.ingredient_overlap,
    waste_risks: metrics.waste_risks,
  }, null, 2)
}
