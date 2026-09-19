/**
 * Create an equipment page.
 *
 * The sibling of scripts/create-guide.ts for the Field Manual's equipment
 * type. Refuses to overwrite, resolves every reference before writing, and
 * measures the draft against the bands in docs/REFERENCE_CONTENT_STANDARD.md
 * (description 35 to 60 words, long description 330 to 450 in four sections,
 * usage 30 to 65, three tips, four FAQs with answers of 30 to 55) so a page
 * that would fail the audit never reaches the dataset.
 *
 * First draft: the rum glass page (19 Sep 2026). Search Console showed "rum
 * glass", "rum glasses", "best rum glasses" and "spiced rum glass" at
 * positions 8 to 15 with no page on the site answering them, while the rum
 * glasses collection already earns clicks from the equipment pages that do
 * exist.
 *
 * Run:  npx sanity exec scripts/create-equipment.ts --with-user-token
 *       ...add `-- --write` to execute.
 */
import { getCliClient } from 'sanity/cli'

const client = getCliClient()
const WRITE = process.argv.includes('--write')

interface Draft {
  id: string
  slug: string
  name: string
  category: string
  glassType?: string
  description: string
  /** [heading, paragraphs] in order. */
  sections: Array<[string, string[]]>
  metaTitle: string
  metaDescription: string
  keywords: string[]
  usage: string
  essential: boolean
  featured: boolean
  specifications: { material: string; capacity: string; details: string }
  tips: string[]
  whatToLookFor: string[]
  commonMistakes: string[]
  budgetAlternative: string
  premiumOption: string
  ownProduct: { name: string; path: string; note: string }
  careInstructions: string[]
  lifespan: string[]
  history: string
  professionalTip: string
  faqs: Array<[string, string]>
  relatedCocktails: string[]
  relatedGuides: Array<{ slug: string; id: string }>
}

const GUIDE_GLASSWARE = 'b8d59e0a-a372-4709-b0a1-063850abc730'
const GUIDE_TASTE = 'b42c28f3-c515-459a-b914-5b1f40fe580e'
const COCKTAIL_OLD_STANDARD = '5c03a375-ba99-4ea7-a992-c7a9674a5322'
const COCKTAIL_STORM_AND_SPICE = 'deb741aa-cb9d-4285-8ed7-a549dae1db79'
const COCKTAIL_RUM_AND_COKE = 'cocktail-rum-and-coke'

const RUM_GLASS: Draft = {
  id: 'equipment-rum-glass',
  slug: 'rum-glass',
  name: 'Rum Glass',
  category: 'glassware',
  glassType: 'tumbler',
  description:
    'The honest answer to which glass for rum is three glasses, not one. A tulip nosing glass or a heavy tumbler when it is drunk neat, a highball for the long serves. Which one you reach for depends on how the rum is being drunk, and a spiced rum built to be sipped changes the answer.',
  sections: [
    [
      'There Is No Single Rum Glass',
      [
        'Search for a rum glass and the shops will sell you one, usually a tumbler with a ship on it. There is no such object in a working bar. Rum is drunk three ways, neat, over one large cube, and long, and each way has a glass that was designed for the job.',
        'That is not a disappointment. It means the glass you already own for whisky does most of the work, and the one you own for gin and tonic does the rest. What matters is matching the shape to the way the rum is being drunk, not the word on the box.',
      ],
    ],
    [
      'Neat: Tulip or Tumbler',
      [
        'For nosing a rum, the tulip wins. A Glencairn or a sherry copita narrows at the rim, so the vanilla and the spice gather above the liquid instead of escaping across a wide mouth. A 25ml pour, swirled once, and the glass does the concentrating for you.',
        'For sipping over ice, the rocks glass wins, and for a reason that has nothing to do with looks. One large cube in a heavy tumbler melts slowly, so a 40% ABV spiced rum opens up over twenty minutes rather than drowning in five. A thin glass full of small ice does the opposite.',
        'If you own only one, own the rocks glass. It takes the neat pour, the cube and the Old Standard, and it is the glass most people will actually drink rum from at home.',
      ],
    ],
    [
      'Long: The Highball',
      [
        'A rum and cola or a Storm and Spice belongs in a highball, and the shape is doing a job. The narrow column keeps the mixer fizzy longer, and the height leaves room for a full load of cubed ice under 150ml of cola or ginger beer.',
        'The serve that took IWSC Silver in 2026 was judged in a hiball with no ice at all: 50ml of Expedition Spiced Rum, 150ml of Franklin and Sons cola, poured gently. Built that way, the glass needs to be well chilled first, and a crystal hiball holds the cold better than a thin one.',
      ],
    ],
    [
      'Buying Rum Glasses',
      [
        'Two purchases cover everything: a pair of heavy rocks glasses at 300ml or more, and a pair of highballs at around 400ml. Add a tulip nosing glass only if you taste rum for its own sake.',
        'Look at the base before the pattern. A rocks glass should be thick, flat and even, so it sits still and takes a cold cube without cracking. A highball should be tall enough that the ice fills it, and thin enough at the rim to drink from cleanly. Engraved ships, barrel shapes and novelty rims add nothing to the drink and usually take something away.',
      ],
    ],
  ],
  metaTitle: 'Rum Glass Guide: Which Glass for Rum, Neat or Long',
  metaDescription:
    'Which glass for rum: a tulip or heavy tumbler for sipping, a highball for the long serves. What to look for, what to avoid, and which pairs are worth buying.',
  keywords: [
    'rum glass',
    'rum glasses',
    'best glass for rum',
    'rum glasses uk',
    'spiced rum glass',
    'rum tumbler',
    'rum drinking glasses',
    'rum tasting glass',
    'what glass for rum',
    'tumbler',
  ],
  usage:
    'Neat or over one large cube: a rocks glass, or a Glencairn when the point is the nose. The Rum and Coke and the Storm and Spice: a highball, built over cubed ice, or for the judged cola serve, well chilled with no ice at all. The Old Standard: a rocks glass with a single large cube.',
  essential: true,
  featured: false,
  specifications: {
    material: 'Glass or crystal',
    capacity: 'Rocks 300 to 350ml, highball 380 to 420ml, tulip 170 to 200ml',
    details: 'A heavy flat-based tumbler for neat and over ice, a tall narrow highball for long serves, a tulip-shaped nosing glass for tasting',
  },
  tips: [
    'Chill the highball in the freezer for ten minutes before a no-ice serve; the glass does the job the ice would have',
    'One large cube in the rocks glass, never a handful of small ones',
    'Nose from a tulip with your mouth slightly open, so the spice reads as spice and not as alcohol',
  ],
  whatToLookFor: [
    'A thick, flat, even base on a rocks glass',
    'A highball tall enough for a full load of cubed ice under 150ml of mixer',
    'A rim thin enough to drink from without a lip catching',
    'Plain glass over heavy cut patterns, so you can see the pour',
    'Sold in pairs, so the second one matches',
  ],
  commonMistakes: [
    'Buying a novelty rum glass with a ship or a barrel on it and expecting it to change the drink',
    'Small ice in a rocks glass, which waters a spiced rum down in minutes',
    'Serving the cola serve in a short glass, so the fizz is gone before the second sip',
    'Nosing from a wide tumbler, which lets the vanilla escape before it reaches you',
  ],
  budgetAlternative:
    'A heavy whisky tumbler from a charity shop, or a plain sherry copita for nosing, for a pound or two each. Weight and base matter more than the maker.',
  premiumOption:
    'A Glencairn Glass for nosing, and a crystal double old fashioned or crystal hiball for the serves; the crystal holds cold longer and rings when tapped.',
  ownProduct: {
    name: 'Rum glasses in the shop',
    path: '/shop/rum-glasses/',
    note: 'The Club ICE tumbler for the Old Standard and the Crystal ICE hiball the cola serve is built in, both sold as pairs.',
  },
  careInstructions: [
    'Hand wash crystal; a glassware cycle is fine for plain glass',
    'Dry immediately with a lint-free cloth to avoid water marks',
    'Store upright, never stacked, and check rims for chips before service',
    'Keep nosing glasses away from scented detergent; the nose is the point',
  ],
  lifespan: [
    'Crystal: ten years or more with careful handling',
    'Standard glass: three to five years of regular use',
    'Budget glass: a year or two before rim wear shows',
  ],
  history:
    'The rummer, a heavy short-stemmed goblet, was the rum glass of eighteenth-century English taverns, built for punch and for being knocked over. It survives as a collector\'s piece and gave its name to nothing that is sold as a rum glass today.\n\nModern rum service borrowed its glassware from its neighbours: the tumbler from whisky, the highball from the soda fountain, and the tulip from sherry and, later, Scotch. The Glencairn, designed in 2001 for whisky, has become the default tasting glass for rum judges because it does the same job for any spirit with something to find on the nose.',
  professionalTip:
    'Taste a spiced rum from a tulip and a tumbler side by side, same pour, same rum. The tulip shows the spice first and the oak last; the tumbler flattens it into one warm note. Once you have noticed the difference you will not serve a neat pour from a wide glass again.',
  faqs: [
    [
      'Is there such a thing as a rum glass?',
      'Not in a working bar. Rum is drunk neat, over one large cube, or long, and each has its own glass: a tulip nosing glass, a heavy rocks glass, and a highball. Anything sold as a rum glass is one of those three with a picture on it.',
    ],
    [
      'What glass should I drink spiced rum from?',
      'A rocks glass with one large cube, for most people most of the time. A spiced rum built to be sipped opens up slowly over big ice. If you are tasting it rather than drinking it, a tulip-shaped nosing glass shows the vanilla and the spice more clearly.',
    ],
    [
      'Do I need a Glencairn glass for rum?',
      'Only if you taste rum for its own sake. The tulip shape concentrates the nose, which is why judges use it, but for an evening pour a heavy tumbler is the better glass. A sherry copita does the same nosing job for a fraction of the price.',
    ],
    [
      'What glass is a rum and coke served in?',
      'A highball. The narrow column keeps the cola fizzy and the height holds a full load of ice under 150ml of mixer. For the no-ice version judged at the IWSC, the glass is chilled first and the cola poured slowly down the side.',
    ],
  ],
  relatedCocktails: [COCKTAIL_OLD_STANDARD, COCKTAIL_STORM_AND_SPICE, COCKTAIL_RUM_AND_COKE],
  relatedGuides: [
    { slug: 'glassware-guide', id: GUIDE_GLASSWARE },
    { slug: 'how-to-taste-rum', id: GUIDE_TASTE },
  ],
}

// ── Construction ──────────────────────────────────────────────────────────

let n = 0
const key = (p: string) => `${p}${String(n++).padStart(4, '0')}`
const words = (t: string) => t.split(/\s+/).filter(Boolean).length

function blocks(sections: Draft['sections']) {
  const out: unknown[] = []
  for (const [heading, paras] of sections) {
    out.push({ _key: key('h'), _type: 'block', style: 'h2', markDefs: [], children: [{ _key: key('s'), _type: 'span', marks: [], text: heading }] })
    for (const p of paras) out.push({ _key: key('p'), _type: 'block', style: 'normal', markDefs: [], children: [{ _key: key('s'), _type: 'span', marks: [], text: p }] })
  }
  return out
}

function document(d: Draft) {
  return {
    _id: d.id,
    _type: 'equipment',
    name: d.name,
    slug: { _type: 'slug', current: d.slug },
    category: d.category,
    ...(d.glassType ? { glassType: d.glassType } : {}),
    description: d.description,
    longDescription: blocks(d.sections),
    metaTitle: d.metaTitle,
    metaDescription: d.metaDescription,
    keywords: d.keywords,
    usage: d.usage,
    essential: d.essential,
    featured: d.featured,
    specifications: d.specifications,
    tips: d.tips,
    whatToLookFor: d.whatToLookFor,
    commonMistakes: d.commonMistakes,
    budgetAlternative: d.budgetAlternative,
    premiumOption: d.premiumOption,
    ownProduct: d.ownProduct,
    careInstructions: d.careInstructions,
    lifespan: d.lifespan,
    history: d.history,
    professionalTip: d.professionalTip,
    faqs: d.faqs.map(([question, answer]) => ({ _key: key('faq'), question, answer })),
    relatedCocktails: d.relatedCocktails.map((r) => ({ _key: key('rc'), _type: 'reference', _ref: r })),
    relatedGuides: d.relatedGuides.map((g) => ({ _key: `guide-${g.slug}`, _type: 'guideLink', guide: { _type: 'reference', _ref: g.id } })),
  }
}

// ── Guards: the reference standard's bands, and the voice rules ───────────

function lint(d: Draft) {
  const problems: string[] = []
  const band = (label: string, count: number, lo: number, hi: number) => { if (count < lo || count > hi) problems.push(`${label}: ${count} words, band ${lo} to ${hi}`) }
  band('description', words(d.description), 35, 60)
  const long = d.sections.flatMap(([, ps]) => ps).join(' ')
  band('long description', words(long), 330, 450)
  if (d.sections.length !== 4) problems.push(`sections: ${d.sections.length}, band 4`)
  band('usage', words(d.usage), 30, 65)
  if (d.tips.length !== 3) problems.push(`tips: ${d.tips.length}, band 3`)
  if (d.faqs.length !== 4) problems.push(`faqs: ${d.faqs.length}, band 4`)
  d.faqs.forEach(([q, a], i) => band(`faq ${i + 1} answer`, words(a), 30, 55))
  if (d.metaTitle.length > 60) problems.push(`metaTitle ${d.metaTitle.length} over 60`)
  if (d.metaDescription.length > 160) problems.push(`metaDescription ${d.metaDescription.length} over 160`)
  const texts = [d.description, long, d.usage, d.history, d.professionalTip, ...d.tips, ...d.whatToLookFor, ...d.commonMistakes, d.budgetAlternative, d.premiumOption, d.ownProduct.note, ...d.faqs.flatMap((f) => f)]
  for (const t of texts) {
    if (/[–—]/.test(t)) problems.push(`dash in: ${t.slice(0, 50)}`)
    if (/!/.test(t)) problems.push(`exclamation in: ${t.slice(0, 50)}`)
    if (/isn't just|whether you're|this page|this guide/i.test(t)) problems.push(`pattern in: ${t.slice(0, 50)}`)
  }
  const awards = (long + ' ' + d.faqs.map((f) => f[1]).join(' ')).match(/IWSC/g) ?? []
  if (awards.length > 2) problems.push(`IWSC named ${awards.length} times`)
  return problems
}

async function main() {
  const d = RUM_GLASS
  const problems = lint(d)
  console.log(`description ${words(d.description)}w, long ${words(d.sections.flatMap(([, p]) => p).join(' '))}w in ${d.sections.length} sections, usage ${words(d.usage)}w, faq answers ${d.faqs.map((f) => words(f[1])).join('/')}w`)
  if (problems.length) throw new Error(`Draft fails the standard:\n  ${problems.join('\n  ')}`)

  const existing = await client.fetch<string | null>('*[_type == "equipment" && (slug.current == $slug || _id == $id)][0]._id', { slug: d.slug, id: d.id })
  if (existing) throw new Error(`Refusing to overwrite: ${d.slug} exists as ${existing}`)

  const refs = [...d.relatedCocktails, ...d.relatedGuides.map((g) => g.id)]
  const found = await client.fetch<string[]>('*[_id in $ids]._id', { ids: refs })
  const missing = refs.filter((r) => !found.includes(r))
  if (missing.length) throw new Error(`Unknown references: ${missing.join(', ')}`)

  const doc = document(d)
  console.log(`${d.slug}: ${refs.length} references resolved`)
  if (!WRITE) {
    console.log(JSON.stringify(doc, null, 2).slice(0, 1500))
    console.log('\nDry run. Add -- --write to create the document.')
    return
  }
  await client.create(doc)
  console.log(`Created ${doc._id}`)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
