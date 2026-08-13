/**
 * Create an ingredient guide.
 *
 * The IBA verification keeps naming products the corpus has no page for.
 * The official Penicillin specifies Lagavulin 16 by name, and the Vesper's
 * history turns on Kina Lillet, which no longer exists — a cocktail page
 * cannot reference either without one of these.
 *
 * Refuses to overwrite. A slug that already exists throws rather than
 * replacing a page somebody wrote, because this script creates and does not
 * edit: `scripts/patch-cocktail-fields.ts` is the one that changes things.
 *
 * Transient. Reset with `git checkout -- scripts/create-ingredient.ts`.
 *
 * Run:  npx sanity exec scripts/create-ingredient.ts --with-user-token
 *       ...add --write to execute.
 */
import { getCliClient } from 'sanity/cli'

const client = getCliClient()
const WRITE = process.argv.includes('--write')

interface Draft {
  slug: string
  name: string
  category: string
  abv?: string
  description: string
  metaTitle: string
  metaDescription: string
  keywords: string[]
  usage: string
  topTips: string[]
  storage: string
  flavorProfile: { primary: string[]; strength: string; tasting: string }
  /** [heading, body] in order. Body paragraphs split on blank lines. */
  sections: Array<[string, string]>
  faqs: Array<[string, string]>
}

const key = (slug: string, p: string, i: number) =>
  `${slug.replace(/[^a-z0-9]/gi, '').slice(0, 8)}${p}${String(i).padStart(2, '0')}`

const INGREDIENTS: Draft[] = [
  {
    slug: 'lagavulin-16',
    name: 'Lagavulin 16',
    category: 'spirits',
    abv: '43%',
    description:
      'The Islay single malt the Penicillin names by bottle rather than by style: sixteen years old, heavily peated, and bottled at 43%. Smoke, iodine and dried fruit in a spirit whose long finish is most of what it is bought for.',
    metaTitle: 'Lagavulin 16 Guide: The Named Float',
    metaDescription:
      'Why the Penicillin specifies Lagavulin 16 rather than any Islay malt, how to use it as a float, and what changes if you substitute.',
    keywords: ['lagavulin 16', 'penicillin whisky', 'islay float', 'peated single malt', 'lagavulin cocktail'],
    usage:
      'Used as a float or a rinse rather than a base, where a few millilitres carry smoke across the whole surface of a drink. The official Penicillin specifies it by name at 7.5ml over a blended Scotch base, and it performs the same job in a Smoky Old Fashioned.',
    topTips: [
      'Float it, never stir it in: the smoke belongs at the nose, not through the drink.',
      'Seven and a half millilitres is enough to change a whole glass. Measure it.',
      'Any peated Islay malt substitutes, but the drink stops matching the specification.',
    ],
    storage:
      'Upright in a cool, dark place, sealed tightly. Peat aromatics are volatile and a half-empty bottle left open loses its top notes well before the spirit itself deteriorates.',
    flavorProfile: {
      primary: ['Peat smoke', 'Iodine', 'Dried fruit', 'Sea salt'],
      strength: 'very-bold',
      tasting:
        'Heavy peat smoke over sweet dried fruit, with iodine and salt underneath and a long, drying, smoke-and-oak finish that outlasts anything it is poured beside.',
    },
    sections: [
      [
        'Why the Specification Names It',
        `Most cocktail recipes name a style and leave the bottle to the bartender. The Penicillin names this one.

Sam Ross built the drink at Milk & Honey in New York in the mid-2000s on a blended Scotch base with a peated single malt floated over the top, and the version that entered the official list carries Lagavulin 16 by name at 7.5ml. The reason is consistency rather than reverence: peat varies enormously between distilleries and between expressions, and a drink that depends on a measured quantity of smoke needs to know how much smoke that measure contains.`,
      ],
      [
        'The Float',
        `Poured gently over the back of a bar spoon so it sits on the surface rather than mixing through.

That placement is the whole technique. Smoke is an aroma before it is a flavour, and a float delivers it to the nose on every sip while the drink underneath stays a lemon-and-honey sour. Stirred in, the same 7.5ml disappears into the blend and the drink loses the contrast it was built around: you taste a faintly smoky sour instead of a sour with smoke over it.`,
      ],
      [
        'Substituting',
        `Any peated Islay malt does the job, and the drink stops matching the specification when it does.

Ardbeg runs more medicinal and Laphroaig more overtly antiseptic, both of which push further than this does; a lighter peated malt leaves the float inaudible under the honey and ginger. If Lagavulin is not to hand, the closest result comes from something at a similar peating level rather than the smokiest bottle on the shelf, and it is worth saying on the menu that a substitution has been made.`,
      ],
      [
        'Drinking It Neat',
        `A cocktail ingredient that is a serious dram in its own right, and the bottle is not cheap.

At 43% it needs no water, though a few drops open the dried fruit underneath the smoke. Sixteen years in oak is what separates it from younger peated malts: the smoke has had time to settle into the spirit rather than sitting on top of it, which is also why a small float carries so far in a drink.`,
      ],
    ],
    faqs: [
      [
        'Why does the Penicillin specify Lagavulin 16?',
        'Because a drink built on a measured quantity of smoke needs to know how much smoke that measure carries. Peat varies enormously between distilleries and expressions, so naming the bottle fixes the one variable the recipe depends on most.',
      ],
      [
        'Can I use a different Islay malt?',
        'Yes, and the drink stops matching the official specification. Ardbeg and Laphroaig both push further and more medicinal; a lightly peated malt vanishes under the honey and ginger. Aim for a similar peating level rather than the smokiest bottle available.',
      ],
      [
        'Should the float be stirred in?',
        'No. Smoke is an aroma before it is a flavour, and floating it delivers that aroma on every sip while the drink underneath stays a lemon-and-honey sour. Stirred through, the same measure disappears and the contrast the drink is built on goes with it.',
      ],
      [
        'Is it worth buying for one cocktail?',
        'It is a serious dram in its own right, which is the honest answer: a bottle used 7.5ml at a time lasts a very long time in drinks and is worth pouring neat between them. At 43% it needs no water, though a few drops open the fruit under the smoke.',
      ],
    ],
  },
]

function blocks(slug: string, sections: Draft['sections']) {
  const out: unknown[] = []
  sections.forEach(([heading, body], i) => {
    out.push({
      _key: key(slug, 'h', i),
      _type: 'block',
      style: 'h2',
      markDefs: [],
      children: [{ _key: key(slug, 'hs', i), _type: 'span', text: heading, marks: [] }],
    })
    body.split(/\n\s*\n/).forEach((para, j) => {
      out.push({
        _key: key(slug, `p${i}`, j),
        _type: 'block',
        style: 'normal',
        markDefs: [],
        children: [{ _key: key(slug, `s${i}`, j), _type: 'span', text: para.trim(), marks: [] }],
      })
    })
  })
  return out
}

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length

async function main() {
  for (const draft of INGREDIENTS) {
    const existing = await client.fetch<string | null>(
      `*[_type == "ingredient" && slug.current == $slug && !(_id in path("drafts.**"))][0]._id`,
      { slug: draft.slug }
    )
    if (existing) throw new Error(`"${draft.slug}" already exists as ${existing} — this script does not overwrite`)

    const doc = {
      _id: `ingredient-${draft.slug}`,
      _type: 'ingredient',
      name: draft.name,
      slug: { _type: 'slug', current: draft.slug },
      category: draft.category,
      ...(draft.abv ? { abv: draft.abv } : {}),
      description: draft.description,
      metaTitle: draft.metaTitle,
      metaDescription: draft.metaDescription,
      keywords: draft.keywords,
      usage: draft.usage,
      topTips: draft.topTips,
      storage: draft.storage,
      flavorProfile: draft.flavorProfile,
      longDescription: blocks(draft.slug, draft.sections),
      faqs: draft.faqs.map(([question, answer], i) => ({
        _key: key(draft.slug, 'f', i),
        _type: 'faq',
        question,
        answer,
      })),
    }

    const long = draft.sections.reduce((n, [h, b]) => n + words(h) + words(b), 0)
    console.log(`  ${draft.name}  (${doc._id})`)
    console.log(`    description ${words(draft.description)}w | long ${long}w / ${draft.sections.length} sections`)
    console.log(`    faqs ${draft.faqs.map(([, a]) => words(a)).join(', ')} | ${draft.keywords.length} keywords`)

    if (WRITE) await client.create(doc)
  }

  console.log(WRITE ? '\nWRITTEN.' : '\nDRY RUN. Nothing written. Pass --write to execute.')
}

main().catch((e) => {
  console.error(e.message ?? e)
  process.exit(1)
})
