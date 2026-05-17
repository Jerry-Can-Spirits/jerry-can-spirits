export interface TradeResource {
  slug: string
  title: string
  description: string
  filename: string
  r2_key: string
}

export const TRADE_RESOURCES: TradeResource[] = [
  {
    slug: 'bar-signage',
    title: 'Bar Signage',
    description: 'Pour guide, signature serves, and how to talk about Expedition Spiced behind the bar.',
    filename: 'Jerry_Can_Spirits_Bar_Signage.pdf',
    r2_key: 'trade-resources/bar-signage.pdf',
  },
]

export function findResourceBySlug(slug: string): TradeResource | undefined {
  return TRADE_RESOURCES.find((r) => r.slug === slug)
}
