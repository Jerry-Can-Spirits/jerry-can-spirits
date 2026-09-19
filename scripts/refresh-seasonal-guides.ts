/**
 * Q4 seasonal guide refresh (19 Sep 2026).
 *
 * The five seasonal guides were audited first: no stale years, prices or
 * retired language, and every "molasses" mention describes dark or aged rum
 * in general rather than ours, so the prose stands. What they lacked was
 * links and currency: a year in the meta title, the house serves and the
 * season's own recipes related, the gift guide related where gifting is the
 * point, product notes filled in, and calls to action sent to the pages that
 * convert in Q4 rather than the shop root.
 *
 * Appends only. Existing references are kept and duplicates skipped, so the
 * script can be re-run.
 *
 * Run:  npx sanity exec scripts/refresh-seasonal-guides.ts --with-user-token
 *       ...add `-- --write` to execute.
 */
import { getCliClient } from 'sanity/cli'

const client = getCliClient()
const WRITE = process.argv.includes('--write')

const C = {
  oldStandard: '5c03a375-ba99-4ea7-a992-c7a9674a5322',
  stormAndSpice: 'deb741aa-cb9d-4285-8ed7-a549dae1db79',
  expeditionPunch: 'ef0bddf5-c1a5-4b05-af27-bb80da0818f3',
  spicedRumPunch: 'cocktail-spiced-rum-punch',
  spicedRumMule: 'fd8f88f6-dad1-4041-93b4-5c1fe31a95f1',
  tomAndJerry: 'cocktail-tom-and-jerry',
  guyFawkesGrog: 'cocktail-guy-fawkes-grog',
  cauldronPunch: 'cocktail-cauldron-punch',
}
const G = {
  halloween: '7186d77c-b2bd-4885-938f-be2e40defe35',
  bonfire: '364ded9f-2e8b-454d-9f21-e355b67d4c9f',
  christmas: '44aacde1-39cb-43da-9518-87045add1aab',
  winter: '186c5505-7280-494d-9684-6bc99c020f59',
  autumn: 'a7f83b48-235b-4787-95b1-119b0e2e1b4a',
  gift: 'guide-how-to-choose-a-rum-gift',
}
const PRODUCT = '/shop/product/jerry-can-spirits-expedition-spiced-rum/'
const BOTTLE = { shopifyHandle: 'jerry-can-spirits-expedition-spiced-rum', contextNote: 'The spiced rum in every serve here. Seven real spices, two natural sweeteners and bourbon oak, built dry at 40% ABV so it holds up in a hot drink and a punch bowl alike.' }
const BOX = { shopifyHandle: 'jerry-can-spirits-expedition-spiced-rum-presentation-box', contextNote: 'Sized for the bottle. Turns it into a gift without wrapping paper.' }
const PACK = { shopifyHandle: 'jerry-can-spirits-premium-gift-pack', contextNote: 'Bottle, the hiball from the cola serve, a jigger and a slate coaster in a branded box. The complete first pour.' }

interface Plan {
  id: string
  metaTitle: string
  cocktails: string[]
  guides: string[]
  products?: Array<{ shopifyHandle: string; contextNote: string }>
  cta: { text: string; url: string }
}

const PLANS: Plan[] = [
  {
    id: G.halloween,
    metaTitle: 'Halloween Cocktails 2026: Spooky Drinks & Dark Spirit Serves',
    cocktails: [C.expeditionPunch, C.oldStandard, C.spicedRumPunch],
    guides: [G.bonfire, G.winter],
    cta: { text: 'Expedition Spiced Rum for the punch bowl', url: PRODUCT },
  },
  {
    id: G.bonfire,
    metaTitle: 'Bonfire Night Cocktails 2026: Guy Fawkes Drinks & Recipes',
    cocktails: [C.oldStandard, C.expeditionPunch, C.spicedRumMule, C.spicedRumPunch],
    guides: [G.halloween, G.winter, G.christmas],
    cta: { text: 'Expedition Spiced Rum for the grog', url: PRODUCT },
  },
  {
    id: G.christmas,
    metaTitle: 'Christmas Drinks & Food Pairings 2026: Festive Guide',
    cocktails: [C.tomAndJerry, C.oldStandard, C.expeditionPunch, C.stormAndSpice],
    guides: [G.gift, G.winter, G.bonfire],
    products: [BOTTLE, BOX, PACK],
    cta: { text: 'Three ways to give the rum this Christmas', url: '/shop/gift-sets/' },
  },
  {
    id: G.winter,
    metaTitle: 'Winter Cocktails 2026: Warming Drinks for Cold Nights',
    cocktails: [C.oldStandard, C.stormAndSpice, C.expeditionPunch, C.tomAndJerry],
    guides: [G.gift, G.bonfire, G.halloween],
    cta: { text: 'Expedition Spiced Rum for the cold nights', url: PRODUCT },
  },
  {
    id: G.autumn,
    metaTitle: 'Autumn Cocktails 2026: Warming Seasonal Drinks',
    cocktails: [C.oldStandard, C.stormAndSpice, C.expeditionPunch],
    guides: [G.bonfire, G.halloween, G.winter],
    cta: { text: 'Expedition Spiced Rum for the season', url: PRODUCT },
  },
]

let n = 0
const key = (p: string) => `${p}${String(n++).padStart(4, '0')}`

async function main() {
  for (const p of PLANS) {
    if (p.metaTitle.length > 60) throw new Error(`metaTitle over 60: ${p.metaTitle}`)
    const refs = [...p.cocktails, ...p.guides]
    const found = await client.fetch<string[]>('*[_id in $ids]._id', { ids: refs })
    const missing = refs.filter((r) => !found.includes(r))
    if (missing.length) throw new Error(`${p.id}: unknown references ${missing.join(', ')}`)
  }
  for (const p of PLANS) {
    const doc = await client.getDocument(p.id) as { slug: { current: string }; relatedCocktails?: Array<{ _ref: string }>; relatedGuides?: Array<{ _ref: string }>; relatedProducts?: unknown[] }
    if (!doc) throw new Error(`${p.id} not found`)
    const rc = [...(doc.relatedCocktails ?? [])]
    for (const id of p.cocktails) if (!rc.some((r) => r._ref === id)) rc.push({ _key: key('rc'), _type: 'reference', _ref: id } as never)
    const rg = [...(doc.relatedGuides ?? [])]
    for (const id of p.guides) if (!rg.some((r) => r._ref === id)) rg.push({ _key: key('rg'), _type: 'reference', _ref: id } as never)
    const patch: Record<string, unknown> = {
      metaTitle: p.metaTitle,
      relatedCocktails: rc,
      relatedGuides: rg,
      callToAction: p.cta,
      updatedAt: new Date().toISOString(),
    }
    if (p.products) patch.relatedProducts = p.products.map((x) => ({ _key: key('rp'), _type: 'product', ...x }))
    console.log(`${doc.slug.current}: cocktails ${(doc.relatedCocktails ?? []).length} -> ${rc.length}, guides ${(doc.relatedGuides ?? []).length} -> ${rg.length}, cta -> ${p.cta.url}${p.products ? `, products ${p.products.length}` : ''}`)
    if (WRITE) await client.patch(p.id).set(patch).commit()
  }
  console.log(WRITE ? 'patched five guides' : '\nDry run. Add -- --write to apply.')
}

main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1) })
