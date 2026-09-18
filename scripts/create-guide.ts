/**
 * Create a guide page.
 *
 * scripts/create-cocktail.ts brings a cocktail into existence; nothing did
 * the same for a guide, so every guide so far was typed into the Studio.
 * This writes one from a typed draft, with the rich-text blocks and inline
 * Field Manual links built here rather than clicked together.
 *
 * Refuses to overwrite. A slug that already exists throws rather than
 * replacing a page somebody wrote.
 *
 * Inline links are written as [text](ref:<document id>) inside a paragraph
 * and become internalLink annotations. Every referenced id is checked to
 * exist before anything is written, so a link never points at nothing.
 *
 * The first draft here is the rum gifts buying guide (18 Sep 2026): the
 * four gift collection pages carried no informational support, and guides
 * are the pages this site ranks with.
 *
 * Run:  npx sanity exec scripts/create-guide.ts --with-user-token
 *       ...add --write to execute.
 */
import { getCliClient } from 'sanity/cli'

const client = getCliClient()
const WRITE = process.argv.includes('--write')

interface Draft {
  id: string
  slug: string
  title: string
  excerpt: string
  metaTitle: string
  metaDescription: string
  keywords: string[]
  category: string
  featured: boolean
  introduction: string
  /** Paragraphs may carry [text](ref:id) inline links. Subsections are optional. */
  sections: Array<{
    heading: string
    paragraphs: string[]
    subsections?: Array<{ subheading: string; paragraphs: string[] }>
  }>
  faqs: Array<[string, string]>
  relatedGuides: string[]
  relatedCocktails: string[]
  relatedProducts: Array<{ shopifyHandle: string; contextNote: string }>
  callToAction: { text: string; url: string }
}

// Document ids resolved from the dataset on 18 Sep 2026 and re-checked at run
// time. Named here so the copy below reads as prose, not as ids.
const REF = {
  guideReadLabel: '5f94f6fd-26df-4c85-9526-6689cb112c54',
  guideGlassware: 'b8d59e0a-a372-4709-b0a1-063850abc730',
  guideBarware: '3734ec98-8637-4d98-88a1-8cb10b54f696',
  guideChristmas: '44aacde1-39cb-43da-9518-87045add1aab',
  cocktailStormAndSpice: 'deb741aa-cb9d-4285-8ed7-a549dae1db79',
  cocktailOldStandard: '5c03a375-ba99-4ea7-a992-c7a9674a5322',
  equipmentJigger: 'adbeedff-1957-45c7-abda-97c43ae4680e',
  equipmentRocksGlass: 'b3968034-7651-400c-8421-1a95c90d18b2',
  equipmentHighball: 'e03fe14a-7571-43d8-8018-2b19029efd1c',
  equipmentHipFlask: 'equipment-hip-flask',
}

const GUIDE: Draft = {
  id: 'guide-how-to-choose-a-rum-gift',
  slug: 'how-to-choose-a-rum-gift',
  title: 'How to Choose a Rum Gift for Someone Who Actually Drinks It',
  excerpt:
    'Bottle, boxed bottle or the full set, and what to check on the label first. A practical guide to choosing a rum gift for someone who will drink it.',
  metaTitle: 'Rum Gifts: How to Choose One They Will Actually Drink',
  metaDescription:
    'How to choose a rum gift: what to check on the bottle, when to add a glass or a box, and how to send it direct. For anyone buying for a rum drinker.',
  keywords: [
    'rum gifts',
    'rum gift ideas',
    'gifts for rum lovers',
    'rum gift set',
    'rum gifts for him',
    'rum gifts for her',
    'spiced rum gift',
    'best rum to give as a gift',
    'rum gift uk',
  ],
  category: 'buying-guides',
  featured: false,
  introduction:
    'Most rum gifts are chosen in a hurry by someone who does not drink rum, and the bottle shows it. This guide is for the other kind of buyer. It covers how to read the bottle before you pay, when a glass or a box earns its place, and how to send it straight to the person so it arrives as a gift rather than a delivery.',
  sections: [
    {
      heading: 'Start with the drinker, not the occasion',
      paragraphs: [
        'The occasion tells you when to give it. The drinker tells you what to give. Before you look at a single bottle, answer one question: how does this person drink rum?',
        'If they sip it neat or over one cube, the liquid is the whole gift. Buy the best bottle you can and leave the accessories alone. A serious drinker already owns a glass they like.',
        `If they mix it, the serve matters as much as the spirit. A bottle with the right glass and a measure turns a present into an evening. The [Storm and Spice](ref:${REF.cocktailStormAndSpice}) and [The Old Standard](ref:${REF.cocktailOldStandard}) are two builds that need nothing exotic.`,
        'If they are new to rum, or you are not sure, choose the bottle in its presentation box. It reads as a gift the moment it is handed over, and it assumes nothing about their bar.',
      ],
    },
    {
      heading: 'What to check on the bottle',
      paragraphs: [
        `A rum label tells you more than the packaging around it. [Reading a rum label](ref:${REF.guideReadLabel}) covers the whole label. These are the four lines that matter for a gift.`,
      ],
      subsections: [
        {
          subheading: 'Strength',
          paragraphs: [
            'Look for 40% ABV or above. Rum can legally be bottled at 37.5% ABV, and the difference is diluted flavour. A producer who bottles at 40% has accepted a smaller yield for a fuller spirit.',
          ],
        },
        {
          subheading: 'Real spices or flavourings',
          paragraphs: [
            'A spiced rum made with real spices will say so, and usually name them. One made with flavourings will say "natural flavourings" and stop. Expedition Spiced Rum is macerated with seven real spices, two natural sweeteners, and bourbon oak by our British partner distillery, and every ingredient is listed.',
          ],
        },
        {
          subheading: 'Batch numbers',
          paragraphs: [
            'A numbered bottle from a small batch is traceable to the run it came from. It also means the person can look up their own bottle, which is a small thing that lands well as a gift.',
          ],
        },
        {
          subheading: 'Awards judged blind',
          paragraphs: [
            'An award is worth something when the judging was blind. The International Wine and Spirit Competition judges that way. Expedition Spiced Rum took Bronze there in 2026, and the serve with Franklin and Sons cola took Silver.',
          ],
        },
      ],
    },
    {
      heading: 'Bottle, boxed bottle, or the full set',
      paragraphs: ['There are three sizes of gesture, and none of them is wrong.'],
      subsections: [
        {
          subheading: 'The bottle',
          paragraphs: [
            'The bottle on its own suits the person with a home bar. Expedition Spiced Rum is 700ml at 40% ABV, and the bottle is considered enough to hand over as it is.',
          ],
        },
        {
          subheading: 'The bottle in its box',
          paragraphs: [
            'The presentation box is sized for the bottle and turns it into a gift without wrapping paper. It is the right choice when the bottle will sit on a table or under a tree before it is opened.',
          ],
        },
        {
          subheading: 'The gift pack',
          paragraphs: [
            `The gift pack is a complete first pour: the bottle, the Crystal ICE hiball from the cola serve, a 25ml and 50ml [jigger](ref:${REF.equipmentJigger}), and a natural slate coaster, in a branded box. Someone who owns none of those opens it and can make the serve that evening.`,
          ],
        },
      ],
    },
    {
      heading: 'When to add a glass or a tool',
      paragraphs: [
        'Add barware only when it will be used. A glass the person already owns is clutter. A glass that changes the drink is a gift.',
        `For someone who drinks neat, a [rocks glass](ref:${REF.equipmentRocksGlass}) and a set of spirit stones keep the pour cold without watering it down. For someone who mixes, a [highball](ref:${REF.equipmentHighball}) holds the cola serve or the Storm and Spice. A jigger is the one tool every cocktail recipe assumes, and 25ml and 50ml are the measures the recipes use.`,
        `A [hip flask](ref:${REF.equipmentHipFlask}) is the exception. It is a gift on its own, and it suits the person who is outdoors more than they are at a bar.`,
        `The [glassware guide](ref:${REF.guideGlassware}) explains which glass does what, and [barware worth investing in](ref:${REF.guideBarware}) covers the tools, if you want to go further.`,
      ],
    },
    {
      heading: 'Sending it direct',
      paragraphs: [
        'You can send the bottle straight to the person. Enter their address at checkout and add a gift message in the cart, and the parcel goes to them with your message.',
        'Two things worth knowing. Every delivery of alcohol is age-verified, so the person receiving it must be 18 or over and may be asked for photo ID by the courier. And once dispatched, orders typically arrive within three to five business days, so for a fixed date, order a week ahead.',
        'If the person is hard to pin down at home, send it to yourself and hand it over. The presentation box was made for that moment.',
      ],
    },
    {
      heading: 'Choosing by occasion',
      paragraphs: ['The drinker still comes first. The occasion settles the details.'],
      subsections: [
        {
          subheading: 'Birthday',
          paragraphs: [
            'The bottle in its box, or the gift pack if they are just getting into rum. Add a gift message. A bottle with nothing written on it is a delivery.',
          ],
        },
        {
          subheading: 'Christmas',
          paragraphs: [
            `A bottle under the tree needs the box. The [Christmas drinks guide](ref:${REF.guideChristmas}) covers what to pour with it on the day.`,
          ],
        },
        {
          subheading: "Father's Day",
          paragraphs: [
            'Most fathers will not buy themselves a good bottle. That is the case for buying one for him.',
          ],
        },
        {
          subheading: 'Weddings and leaving dos',
          paragraphs: [
            'A bottle each for the best man, the groomsmen or a departing colleague turns a thank-you into something they keep. One customer gave seven bottles to his best man and a group of close friends at his wedding, and wrote afterwards that it became a memory none of them will forget.',
          ],
        },
        {
          subheading: 'For someone who served',
          paragraphs: [
            'Jerry Can Spirits is veteran-owned, and 5% of profits goes to forces charities. For someone leaving the forces, or the family of someone serving, that is part of the gift.',
          ],
        },
      ],
    },
  ],
  faqs: [
    [
      'Is spiced rum a good gift?',
      'Yes, if the person drinks it or is curious about it. A spiced rum made with real spices at 40% ABV sips as well as it mixes, so it suits both the neat drinker and the person who wants a long drink.',
    ],
    [
      'What size is a standard bottle of rum?',
      '700ml is the standard bottle size in the UK. Expedition Spiced Rum is 700ml at 40% ABV.',
    ],
    [
      'Can I send a rum gift straight to the recipient?',
      'Yes. Enter their address at checkout and add a gift message in the cart. The person receiving it must be 18 or over and may be asked for photo ID by the courier.',
    ],
    [
      'Does the bottle come gift-wrapped?',
      'The bottle is considered enough to hand over as it is. For a boxed gift, there is a presentation box sized for the bottle, and the gift pack comes in its own branded box.',
    ],
    [
      'How long does an unopened bottle of rum keep?',
      'Indefinitely, stored upright and away from direct sunlight and heat. A spirit at 40% ABV does not deteriorate in a sealed bottle. Once opened, the flavour holds for a year or more if the bottle is kept sealed and reasonably full.',
    ],
    [
      'Should I buy a glass with it?',
      'Only if the person does not already own one they like. For a neat drinker, a rocks glass. For a mixer, a highball. The gift pack includes the highball, a jigger and a coaster for someone starting from nothing.',
    ],
  ],
  relatedGuides: [REF.guideReadLabel, REF.guideGlassware, REF.guideBarware, REF.guideChristmas],
  relatedCocktails: [REF.cocktailStormAndSpice, REF.cocktailOldStandard],
  relatedProducts: [
    {
      shopifyHandle: 'jerry-can-spirits-expedition-spiced-rum',
      contextNote: 'The bottle on its own. 700ml, 40% ABV, numbered batch.',
    },
    {
      shopifyHandle: 'jerry-can-spirits-expedition-spiced-rum-presentation-box',
      contextNote: 'Sized for the 700ml bottle. Turns it into a gift without wrapping paper.',
    },
    {
      shopifyHandle: 'jerry-can-spirits-premium-gift-pack',
      contextNote: 'Bottle, hiball, jigger and slate coaster in a branded box. The complete first pour.',
    },
  ],
  callToAction: { text: 'See the rum gifts', url: '/shop/rum-gifts/' },
}

// ── Block construction ────────────────────────────────────────────────────

let keyCounter = 0
const key = (prefix: string) => `${prefix}${String(keyCounter++).padStart(4, '0')}`

const LINK = /\[([^\]]+)\]\(ref:([^)]+)\)/g

function refsIn(text: string): string[] {
  return [...text.matchAll(LINK)].map((m) => m[2])
}

function plain(text: string): string {
  return text.replace(LINK, '$1')
}

/** One paragraph to one portable-text block, inline links as internalLink marks. */
function block(text: string) {
  const children: unknown[] = []
  const markDefs: unknown[] = []
  let last = 0
  for (const m of text.matchAll(LINK)) {
    const [whole, label, ref] = m
    const start = m.index ?? 0
    if (start > last) children.push({ _key: key('s'), _type: 'span', marks: [], text: text.slice(last, start) })
    const markKey = key('l')
    markDefs.push({ _key: markKey, _type: 'internalLink', reference: { _type: 'reference', _ref: ref } })
    children.push({ _key: key('s'), _type: 'span', marks: [markKey], text: label })
    last = start + whole.length
  }
  if (last < text.length) children.push({ _key: key('s'), _type: 'span', marks: [], text: text.slice(last) })
  return { _key: key('b'), _type: 'block', style: 'normal', markDefs, children }
}

function rich(paragraphs: string[]) {
  return paragraphs.map(block)
}

function legacy(paragraphs: string[]) {
  return paragraphs.map(plain).join('\n\n')
}

function words(d: Draft): number {
  const parts = [d.introduction]
  for (const s of d.sections) {
    parts.push(s.heading, ...s.paragraphs.map(plain))
    for (const sub of s.subsections ?? []) parts.push(sub.subheading, ...sub.paragraphs.map(plain))
  }
  for (const [q, a] of d.faqs) parts.push(q, a)
  return parts.join(' ').split(/\s+/).filter(Boolean).length
}

function allRefs(d: Draft): string[] {
  const out = new Set<string>([...d.relatedGuides, ...d.relatedCocktails])
  for (const s of d.sections) {
    s.paragraphs.forEach((p) => refsIn(p).forEach((r) => out.add(r)))
    for (const sub of s.subsections ?? []) sub.paragraphs.forEach((p) => refsIn(p).forEach((r) => out.add(r)))
  }
  return [...out]
}

function document(d: Draft) {
  return {
    _id: d.id,
    _type: 'guide',
    title: d.title,
    slug: { _type: 'slug', current: d.slug },
    excerpt: d.excerpt,
    metaTitle: d.metaTitle,
    metaDescription: d.metaDescription,
    keywords: d.keywords,
    category: d.category,
    featured: d.featured,
    isPillar: false,
    author: 'Jerry Can Spirits',
    publishedAt: new Date().toISOString(),
    introduction: d.introduction,
    sections: d.sections.map((s) => ({
      _key: key('sec'),
      _type: 'contentSection',
      heading: s.heading,
      content: legacy(s.paragraphs),
      contentRich: rich(s.paragraphs),
      ...(s.subsections
        ? {
            subsections: s.subsections.map((sub) => ({
              _key: key('sub'),
              _type: 'subsection',
              subheading: sub.subheading,
              content: legacy(sub.paragraphs),
              contentRich: rich(sub.paragraphs),
            })),
          }
        : {}),
    })),
    faqs: d.faqs.map(([question, answer]) => ({ _key: key('faq'), _type: 'faq', question, answer })),
    relatedGuides: d.relatedGuides.map((r) => ({ _key: key('rg'), _type: 'reference', _ref: r })),
    relatedCocktails: d.relatedCocktails.map((r) => ({ _key: key('rc'), _type: 'reference', _ref: r })),
    relatedProducts: d.relatedProducts.map((p) => ({ _key: key('rp'), _type: 'product', ...p })),
    callToAction: d.callToAction,
    estimatedWordCount: words(d),
  }
}

// ── Guards ────────────────────────────────────────────────────────────────

function lint(d: Draft) {
  const problems: string[] = []
  const texts: Array<[string, string]> = [
    ['title', d.title],
    ['excerpt', d.excerpt],
    ['metaTitle', d.metaTitle],
    ['metaDescription', d.metaDescription],
    ['introduction', d.introduction],
  ]
  for (const s of d.sections) {
    texts.push([s.heading, s.paragraphs.map(plain).join(' ')])
    for (const sub of s.subsections ?? []) texts.push([sub.subheading, sub.paragraphs.map(plain).join(' ')])
  }
  for (const [q, a] of d.faqs) texts.push([q, a])
  for (const [where, t] of texts) {
    if (/[–—]/.test(t)) problems.push(`${where}: dash`)
    if (/!/.test(t)) problems.push(`${where}: exclamation mark`)
    if (/£/.test(t)) problems.push(`${where}: price`)
    if (/\b(made at|made in|produced at|produced in|blended|distilled)\b/i.test(t)) problems.push(`${where}: banned production claim`)
    if (/isn't just|not just .* it's|whether you're|(^|\. )From \w+ to \w+/.test(t)) problems.push(`${where}: machine pattern`)
  }
  if (d.title.length > 80) problems.push('title over 80')
  if (d.excerpt.length > 160) problems.push(`excerpt ${d.excerpt.length} over 160`)
  if (d.metaTitle.length > 60) problems.push(`metaTitle ${d.metaTitle.length} over 60`)
  if (d.metaDescription.length > 160) problems.push(`metaDescription ${d.metaDescription.length} over 160`)
  if (d.excerpt === d.metaDescription) problems.push('excerpt equals metaDescription')
  if (d.introduction.length < 100 || d.introduction.length > 500) problems.push(`introduction ${d.introduction.length} chars`)
  if (d.sections.length < 3) problems.push('fewer than 3 sections')
  if (d.faqs.length < 3 || d.faqs.length > 10) problems.push('faqs outside 3..10')
  return problems
}

async function main() {
  const problems = lint(GUIDE)
  if (problems.length) throw new Error(`Draft fails its own checks:\n  ${problems.join('\n  ')}`)

  const existing = await client.fetch<string | null>(
    '*[_type == "guide" && (slug.current == $slug || _id == $id)][0]._id',
    { slug: GUIDE.slug, id: GUIDE.id },
  )
  if (existing) throw new Error(`Refusing to overwrite: ${GUIDE.slug} exists as ${existing}`)

  const refs = allRefs(GUIDE)
  const found = await client.fetch<string[]>('*[_id in $ids]._id', { ids: refs })
  const missing = refs.filter((r) => !found.includes(r))
  if (missing.length) throw new Error(`Unknown references: ${missing.join(', ')}`)

  const doc = document(GUIDE)
  console.log(`${GUIDE.slug}: ${doc.estimatedWordCount} words, ${doc.sections.length} sections, ${doc.faqs.length} FAQs, ${refs.length} references resolved`)
  if (!WRITE) {
    console.log(JSON.stringify(doc, null, 2))
    console.log('\nDry run. Add --write to create the document.')
    return
  }
  await client.create(doc)
  console.log(`Created ${doc._id}`)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
