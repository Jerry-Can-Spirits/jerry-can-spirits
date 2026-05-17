// Resources surfaced on /trade/resources. Two kinds:
//   - 'pdf'  → served from R2 via the /api/trade/resources/[slug] route
//   - 'page' → an in-app print-styled page; the card opens the page directly

interface TradeResourceBase {
  slug: string
  title: string
  description: string
}

export interface TradePdfResource extends TradeResourceBase {
  kind: 'pdf'
  filename: string
  r2_key: string
}

export interface TradePageResource extends TradeResourceBase {
  kind: 'page'
  href: string
}

export type TradeResource = TradePdfResource | TradePageResource

export const TRADE_RESOURCES: TradeResource[] = [
  {
    kind: 'pdf',
    slug: 'bar-signage',
    title: 'Bar Signage',
    description: 'Pour guide, signature serves, and how to talk about Expedition Spiced behind the bar.',
    filename: 'Jerry_Can_Spirits_Bar_Signage.pdf',
    r2_key: 'trade-resources/bar-signage.pdf',
  },
  {
    kind: 'page',
    slug: 'bartenders-guide-pub',
    title: 'Bartender’s Guide: Traditional Pub',
    description: 'Default serves, scripted responses, and the three things to remember for a pub bar.',
    href: '/trade/resources/bartenders-guide/pub',
  },
  {
    kind: 'page',
    slug: 'bartenders-guide-cocktail-bar',
    title: 'Bartender’s Guide: Cocktail Bar',
    description: 'Old Standard and Storm & Spice as the house serves. Craft-aware language, provenance forward.',
    href: '/trade/resources/bartenders-guide/cocktail-bar',
  },
  {
    kind: 'page',
    slug: 'bartenders-guide-nightclub',
    title: 'Bartender’s Guide: Nightclub',
    description: 'Speed-of-service shorthand. Three-word responses where possible.',
    href: '/trade/resources/bartenders-guide/nightclub',
  },
  {
    kind: 'page',
    slug: 'bartenders-guide-hotel',
    title: 'Bartender’s Guide: Hotel & Restaurant',
    description: 'Story-led service. Neat and digestif serves. Longer scripted responses for unhurried guests.',
    href: '/trade/resources/bartenders-guide/hotel',
  },
]

export function findResourceBySlug(slug: string): TradeResource | undefined {
  return TRADE_RESOURCES.find((r) => r.slug === slug)
}
