/**
 * Spiced rum cluster, content side (19 Sep 2026).
 *
 * Search Console has the generic spiced rum queries at positions 12 to 22
 * ("spiced rum", "what is spiced rum", "types of spiced rum", "dry spiced
 * rum") with the complete guide at 10. The guide has no section on the
 * types of spiced rum or on what it tastes like, which are the two query
 * groups it misses, and its title does not answer the question people type.
 *
 * This patches two guides in place, preserving every existing section and
 * key:
 *   complete-guide-spiced-rum: title and meta answer "what is spiced rum";
 *     two sections inserted after "Common Spices in Spiced Rum"; three FAQs
 *     appended; keywords extended; the botanicals guide related; updatedAt.
 *   dark-rum-vs-spiced-rum: one title for H1 and meta; the complete guide
 *     related.
 *
 * Run:  npx sanity exec scripts/patch-spiced-rum-cluster.ts --with-user-token
 *       ...add `-- --write` to execute.
 */
import { getCliClient } from 'sanity/cli'

const client = getCliClient()
const WRITE = process.argv.includes('--write')

const GUIDE_SPICED = 'd3cc3d46-c708-4d79-be0f-d6efd4a09932'
const GUIDE_DARK_VS_SPICED = 'b3d4e188-b8ac-4747-bda6-44084ff4cb5e'
const GUIDE_BOTANICALS = '0df95f96-c2ec-444f-9e4d-4842aff49c49'
const GUIDE_LABEL = '5f94f6fd-26df-4c85-9526-6689cb112c54'
const GUIDE_TASTE = 'b42c28f3-c515-459a-b914-5b1f40fe580e'

let n = 0
const key = (p: string) => `${p}${String(n++).padStart(4, '0')}`
const LINK = /\[([^\]]+)\]\(ref:([^)]+)\)/g
const plain = (t: string) => t.replace(LINK, '$1')
const words = (t: string) => plain(t).split(/\s+/).filter(Boolean).length

function block(text: string) {
  const children: unknown[] = []
  const markDefs: unknown[] = []
  let last = 0
  for (const m of text.matchAll(LINK)) {
    const [whole, label, ref] = m
    const start = m.index ?? 0
    if (start > last) children.push({ _key: key('s'), _type: 'span', marks: [], text: text.slice(last, start) })
    const mk = key('l')
    markDefs.push({ _key: mk, _type: 'internalLink', reference: { _type: 'reference', _ref: ref } })
    children.push({ _key: key('s'), _type: 'span', marks: [mk], text: label })
    last = start + whole.length
  }
  if (last < text.length) children.push({ _key: key('s'), _type: 'span', marks: [], text: text.slice(last) })
  return { _key: key('b'), _type: 'block', style: 'normal', markDefs, children }
}

function section(heading: string, paragraphs: string[], subs: Array<[string, string[]]>) {
  return {
    _key: key('sec'),
    _type: 'contentSection',
    heading,
    content: paragraphs.map(plain).join('\n\n'),
    contentRich: paragraphs.map(block),
    subsections: subs.map(([subheading, ps]) => ({
      _key: key('sub'),
      _type: 'subsection',
      subheading,
      content: ps.map(plain).join('\n\n'),
      contentRich: ps.map(block),
    })),
  }
}

const NEW_SECTIONS = [
  section(
    'Types of Spiced Rum',
    [
      'Spiced rum is one label covering several different drinks, and the differences matter more than the shared name. The base rum, the sweetness, and whether it was aged split the category into types worth knowing before you buy.',
    ],
    [
      [
        'By sweetness: dry and sweet',
        [
          'Sweet spiced rum carries added sugar, often a great deal of it, which rounds off a thin base and pushes the vanilla forward. It mixes easily and sips heavily. Dry spiced rum keeps sugar to a minimum, so the spice and the base rum carry the flavour. It is the style most craft producers now aim for, and the style that sips neat.',
          'Expedition Spiced Rum is built dry, at 40% ABV, with seven real spices and two natural sweeteners used sparingly, macerated by our British partner distillery.',
        ],
      ],
      [
        'By base: white, golden and dark',
        [
          'Most spiced rum starts from a golden or lightly aged Caribbean rum, which gives colour and body for the spices to sit on. Spiced white rum, built on unaged spirit, is lighter and sharper and rare on British shelves. Spiced dark rum, whether aged or coloured with caramel, is the heaviest of the three, and colour on its own says nothing about age.',
        ],
      ],
      [
        'Aged spiced rum',
        [
          'A small number of producers age the rum in oak after spicing, or spice a rum that was aged first. These sit closest to a dark rum, with the oak doing some of the work the spice usually does. They are the exception in the category, and the price usually says so.',
        ],
      ],
      [
        'Spiced rum or flavoured rum',
        [
          `The line is a legal one as much as a matter of taste. A spirit carrying heavy flavouring and sugar may not qualify as rum at all under UK rules, which is why some bottles say spirit drink in small type. [Reading a rum label](ref:${GUIDE_LABEL}) shows where to look, and [the botanicals guide](ref:${GUIDE_BOTANICALS}) shows what a real spice bill looks like.`,
        ],
      ],
    ],
  ),
  section(
    'What Spiced Rum Tastes Like',
    [
      'Vanilla is the first thing most people taste in a spiced rum, and the reason the category has a reputation for sweetness. What comes after the vanilla is what separates a good bottle from a forgettable one.',
    ],
    [
      [
        'The order the flavours arrive',
        [
          'In a well made spiced rum the vanilla opens, then the warming spices come through the middle: cinnamon or cassia, clove, allspice, ginger. Orange peel lifts it. Oak holds the finish and dries it out. In a sweet one, sugar flattens the middle and the finish is short and sticky.',
        ],
      ],
      [
        'Does spiced rum have cinnamon in it',
        [
          'Almost always, in one of two forms. Ceylon cinnamon is delicate and floral. Cassia bark is the bolder, redder heat most people picture when they think of cinnamon. Many bottles use both, and the balance between them shapes the whole spice profile. If a spiced rum tastes of red boiled sweets, that is cassia and sugar together.',
        ],
      ],
      [
        'How to taste for quality',
        [
          `Pour 25ml into a rocks glass, no ice, and wait a minute. A dry spiced rum stays interesting as it warms; a sweet one turns cloying. Then add one large cube and see what survives the dilution. [How to taste rum](ref:${GUIDE_TASTE}) walks through it step by step.`,
        ],
      ],
    ],
  ),
]

const NEW_FAQS: Array<[string, string]> = [
  [
    'What does spiced rum taste like?',
    'Vanilla first, then warming spices such as cinnamon, clove and allspice, with orange and oak behind them. Sweet spiced rums are heavy and rounded; dry ones are lighter, spicier and finish clean. The base rum shows through more clearly in a dry one.',
  ],
  [
    'Does spiced rum have cinnamon in it?',
    'Nearly always. It appears as Ceylon cinnamon, which is soft and floral, or as cassia bark, which is the bolder red heat most people think of as cinnamon. Many spiced rums use both, and the balance between the two shapes the whole spice profile.',
  ],
  [
    'What is dry spiced rum?',
    'A spiced rum made with little or no added sugar, so the spices and the base rum carry the flavour rather than sweetness. It sips neat, mixes without turning a drink syrupy, and is the style most British craft producers now make. Expedition Spiced Rum is built this way.',
  ],
]

const NEW_KEYWORDS = ['types of spiced rum', 'dry spiced rum', 'what does spiced rum taste like', 'does spiced rum have cinnamon', 'spiced rum meaning', 'what spices are in spiced rum', 'spiced rum explained']

async function main() {
  // Voice checks on the new copy.
  const all = [...NEW_SECTIONS.flatMap((s) => [s.content, ...s.subsections.map((x) => x.content)]), ...NEW_FAQS.flat()]
  for (const t of all) {
    if (/[–—]|!/.test(t)) throw new Error(`dash or exclamation in: ${t.slice(0, 60)}`)
    if (/made at|made in|distilled|molasses|welsh/i.test(t)) throw new Error(`banned provenance wording in: ${t.slice(0, 60)}`)
  }
  for (const [, a] of NEW_FAQS) { const w = words(a); if (w < 30 || w > 60) throw new Error(`FAQ answer ${w} words`) }
  console.log('new sections:', NEW_SECTIONS.map((s) => `${s.heading} (${words(s.content) + s.subsections.reduce((a, x) => a + words(x.content), 0)}w)`).join(', '))

  const g = await client.getDocument(GUIDE_SPICED) as Record<string, unknown> & { sections: Array<{ heading: string }>; faqs: unknown[]; keywords: string[]; relatedGuides?: Array<{ _ref: string }> }
  if (!g) throw new Error('guide not found')
  if (g.sections.some((s) => s.heading === 'Types of Spiced Rum')) throw new Error('already patched')
  const at = g.sections.findIndex((s) => s.heading === 'Common Spices in Spiced Rum')
  if (at < 0) throw new Error('anchor section not found')
  const sections = [...g.sections.slice(0, at + 1), ...NEW_SECTIONS, ...g.sections.slice(at + 1)]
  const faqs = [...g.faqs, ...NEW_FAQS.map(([question, answer]) => ({ _key: key('faq'), _type: 'faq', question, answer }))]
  const keywords = [...new Set([...g.keywords, ...NEW_KEYWORDS])]
  const relatedGuides = [...(g.relatedGuides ?? [])]
  if (!relatedGuides.some((r) => r._ref === GUIDE_BOTANICALS)) relatedGuides.push({ _key: key('rg'), _type: 'reference', _ref: GUIDE_BOTANICALS } as never)
  const spicedPatch = {
    title: 'What Is Spiced Rum? The Complete Guide',
    metaTitle: 'What Is Spiced Rum? The Complete Guide',
    metaDescription: 'What spiced rum is, the types from dry to sweet, how it is made, what it tastes like, and how to judge a bottle. The complete guide, written in Britain.',
    sections,
    faqs,
    keywords,
    relatedGuides,
    updatedAt: new Date().toISOString(),
  }
  if (spicedPatch.metaTitle.length > 60 || spicedPatch.metaDescription.length > 160) throw new Error('meta over length')

  const d = await client.getDocument(GUIDE_DARK_VS_SPICED) as Record<string, unknown> & { relatedGuides?: Array<{ _ref: string }> }
  if (!d) throw new Error('dark vs spiced guide not found')
  const dRelated = [...(d.relatedGuides ?? [])]
  if (!dRelated.some((r) => r._ref === GUIDE_SPICED)) dRelated.push({ _key: key('rg'), _type: 'reference', _ref: GUIDE_SPICED } as never)
  const darkPatch = {
    title: 'Dark Rum vs Spiced Rum: What Is the Difference?',
    metaTitle: 'Dark Rum vs Spiced Rum: What Is the Difference?',
    relatedGuides: dRelated,
    updatedAt: new Date().toISOString(),
  }

  console.log(`complete guide: ${g.sections.length} -> ${sections.length} sections, ${g.faqs.length} -> ${faqs.length} FAQs, ${keywords.length} keywords, related ${relatedGuides.length}`)
  console.log(`dark vs spiced: title "${darkPatch.title}", related ${dRelated.length}`)
  if (!WRITE) { console.log('\nDry run. Add -- --write to apply.'); return }
  await client.patch(GUIDE_SPICED).set(spicedPatch).commit()
  await client.patch(GUIDE_DARK_VS_SPICED).set(darkPatch).commit()
  console.log('patched both guides')
}

main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1) })
