/**
 * Audit 8 stage-2 Sanity writes (run once, then delete or keep as record):
 *   npx sanity exec scripts/copy-regen-sanity.ts --with-user-token
 *
 * 1. Patches the three spirits product docs: provenance fixes (process fields,
 *    "Where is it made?" FAQ, the pot-distilled whatsIncluded line), the
 *    corrected IWSC serving-suggestion line, and two intensifier descriptions.
 * 2. Creates the ten tier-2 accessory docs (FAQs, completeTheServe,
 *    professionalTip, whatsIncluded where multi-part). createIfNotExists, so
 *    re-running never overwrites Studio edits.
 */
import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2025-09-08'})

const PROCESS_TEXT = `Made in small batches at our British partner distillery. We start with Caribbean rum as the base, then steep it with real botanicals: Madagascan vanilla pods, Ceylon cinnamon, ginger, orange peel, cassia bark, cloves, and allspice. Each botanical is given proper time before we move on.

We sweeten with agave syrup. Natural, not excessive. A small amount of glucose syrup is added for mouthfeel, giving the spirit its characteristic silky texture without adding noticeable sweetness.

The rum then rests on bourbon barrel chips, picking up soft oak and a note of caramel warmth. Every batch is tasted multiple times before it leaves. No shortcuts at any stage.`

const SERVING_SUGGESTIONS = [
  'Neat or over a large ice cube for the full flavour',
  "The base for the Field Manual's spiced rum cocktails",
  'With Franklin and Sons cola. The serve took Silver at the IWSC 2026 judged exactly that way: no ice, no garnish. Ice and a wedge of lime build on it at home.',
  'Winter warmers: hot toddies and mulled builds',
]

const RUM = 'jerry-can-spirits-expedition-spiced-rum'

const faq = (q: string, a: string, k: string) => ({_key: k, question: q, answer: a})
const inc = (item: string, description: string, quantity: number, k: string) => ({_key: k, item, description, quantity})

interface AccessoryDoc {
  handle: string
  name: string
  completeTheServe: string[]
  professionalTip: string
  faqs: Array<{_key: string; question: string; answer: string}>
  whatsIncluded?: Array<{_key: string; item: string; description: string; quantity: number}>
}

const PAIR_FAQ = (thing: string) => `Both. Choose the single or the pair on this page.`

const ACCESSORIES: AccessoryDoc[] = [
  {
    handle: 'hiball-glass-38cl',
    name: 'Hiball Glass 38cl',
    completeTheServe: [RUM, 'stainless-steel-jigger'],
    professionalTip: 'Build the Storm and Spice in the glass: cubed ice first, then Expedition Spiced Rum, then ginger beer, fresh lime last. The full build is in the Field Manual.',
    faqs: [
      faq('What drinks is this glass for?', 'Long serves. It is the glass we use for the Storm and Spice: Expedition Spiced Rum, ginger beer and fresh lime over cubed ice.', 'f1'),
      faq('What is the difference between this and the Crystal ICE Hiball?', 'This is the plain 38cl hiball. The Crystal ICE is 42cl with a textured crystal-effect finish, and it is the glass from the Premium Gift Pack.', 'f2'),
      faq('Can I buy one glass or a pair?', PAIR_FAQ('glass'), 'f3'),
    ],
  },
  {
    handle: 'crystal-ice-hiball-42cl',
    name: 'Crystal ICE Hiball 42cl',
    completeTheServe: [RUM, 'stainless-steel-jigger'],
    professionalTip: 'The judged IWSC serve is Expedition Spiced Rum and Franklin and Sons cola alone. At home, fill the glass with ice first and pour the rum before the cola.',
    faqs: [
      faq('Is this the glass from the Premium Gift Pack?', 'Yes. The same 42cl Crystal ICE hiball comes in the pack alongside the rum, jigger and slate coaster.', 'f1'),
      faq('What serve is it built for?', 'The one that took Silver at the IWSC 2026: Expedition Spiced Rum and Franklin and Sons cola, judged with no ice and no garnish.', 'f2'),
      faq('Can I buy one glass or a pair?', PAIR_FAQ('glass'), 'f3'),
    ],
  },
  {
    handle: 'club-ice-tumbler-26cl',
    name: 'Club ICE Tumbler 26cl',
    completeTheServe: [RUM, 'stainless-steel-spirit-stones', 'stainless-steel-jigger'],
    professionalTip: 'Use one large ice cube rather than several small ones. It melts slower and keeps the Old Standard from washing out.',
    faqs: [
      faq('What drinks is this glass for?', 'Short serves and neat pours. It is the glass for the Old Standard, our Rum Old Fashioned built on Expedition Spiced Rum.', 'f1'),
      faq('Why the heavy base?', 'Weight keeps the glass steady and feels right in the hand for a drink you take slowly.', 'f2'),
      faq('Can I buy one glass or a pair?', PAIR_FAQ('glass'), 'f3'),
    ],
  },
  {
    handle: 'hurricane-cocktail-glass-42cl',
    name: 'Hurricane Cocktail Glass 42cl',
    completeTheServe: [RUM, 'stainless-steel-jigger'],
    professionalTip: 'Fill the glass with ice before you build. A slow pour keeps the layers where you put them.',
    faqs: [
      faq('What drinks is this glass for?', 'The Hurricane, first of all. The curved 42cl shape holds the ice, fruit and layered pours the Field Manual build calls for.', 'f1'),
      faq('Can I buy one glass or a pair?', PAIR_FAQ('glass'), 'f2'),
    ],
  },
  {
    handle: 'contemporary-mixer-glass-31cl',
    name: 'Contemporary Mixer Glass 31cl',
    completeTheServe: [RUM, 'stainless-steel-jigger'],
    professionalTip: "Bruise the mint, don't shred it. Press it gently against the glass with the muddler before the ice goes in.",
    faqs: [
      faq('What drinks is this glass for?', 'The Jerry Can Julep and short mixed serves. The wide rim gives room to muddle properly.', 'f1'),
      faq('Can I buy one glass or a pair?', PAIR_FAQ('glass'), 'f2'),
    ],
  },
  {
    handle: 'original-handled-drinking-jam-jar-46cl',
    name: 'Handled Drinking Jam Jar 46cl',
    completeTheServe: [RUM, 'stainless-steel-jigger'],
    professionalTip: 'Make the Expedition Punch by the jug and pour into the jars over fresh ice. The handle keeps a warm hand off a cold drink.',
    faqs: [
      faq('What drinks is this glass for?', 'Generous outdoor serves. It is the glass we would hand you an Expedition Punch in.', 'f1'),
      faq('Can I buy one jar or a pair?', PAIR_FAQ('jar'), 'f2'),
    ],
  },
  {
    handle: 'stainless-steel-jigger',
    name: 'Stainless Steel Jigger',
    completeTheServe: [RUM, 'club-ice-tumbler-26cl'],
    professionalTip: 'Measure every pour, even the mixer-length ones. Free pouring is how a good drink drifts.',
    faqs: [
      faq('What are the measures?', '25ml one end, 50ml the other: the standard UK single and double. Every Field Manual build is written in those measures.', 'f1'),
      faq('Does the finish change anything?', 'No. Silver, gold, gunmetal and copper are the same jigger in different finishes. The measures are identical.', 'f2'),
    ],
  },
  {
    handle: 'stainless-steel-cocktail-shaker',
    name: 'Stainless Steel Cocktail Shaker',
    completeTheServe: [RUM, 'contemporary-mixer-glass-31cl'],
    professionalTip: 'Fill two-thirds with ice and shake hard until the outside of the shaker frosts. When it is cold outside, it is cold inside.',
    faqs: [
      faq('Do I need a separate strainer?', 'No. The top section has a built-in strainer: shake, lift the cap and pour straight into the glass.', 'f1'),
      faq('What size is it?', '550ml, three pieces: the body, the strainer top and the cap.', 'f2'),
    ],
    whatsIncluded: [
      inc('Shaker body', '550ml, polished stainless steel', 1, 'w1'),
      inc('Strainer top', 'Built-in strainer, no separate tool needed', 1, 'w2'),
      inc('Cap', 'Seals the shake, doubles as the lift-off pour cap', 1, 'w3'),
    ],
  },
  {
    handle: 'stainless-steel-spirit-stones',
    name: 'Stainless Steel Spirit Stones',
    completeTheServe: [RUM, 'club-ice-tumbler-26cl'],
    professionalTip: 'Straight from the freezer into the glass. Pour the rum over them and give it a minute before the first sip.',
    faqs: [
      faq('Why stones instead of ice?', "No dilution. Expedition Spiced Rum's vanilla, cinnamon and oak are built to be tasted at full strength, and melting ice softens them.", 'f1'),
      faq('Do they change the taste?', 'No. Food-grade stainless steel is neutral. They chill the drink and nothing else.', 'f2'),
      faq('How do I use them?', 'Freeze them, use them, rinse them, refreeze them. The case keeps the set together.', 'f3'),
    ],
    whatsIncluded: [
      inc('Spirit stones', 'Food-grade stainless steel, engraved logo', 4, 'w1'),
      inc('Storage case', 'Clear case, keeps the set together in the freezer', 1, 'w2'),
    ],
  },
  {
    handle: 'stainless-steel-hip-flask-500ml',
    name: 'Stainless Steel Hip Flask',
    completeTheServe: [RUM],
    professionalTip: 'Fill it with Expedition Spiced Rum before you leave. Rinse it with warm water when you are back. That is the whole maintenance schedule.',
    faqs: [
      faq('How much does it hold?', '150ml, which is six 25ml measures.', 'f1'),
      faq('Will it leak in a bag?', 'No. The seal is leak-proof, and there are no moving parts to fail.', 'f2'),
      faq('What colours does it come in?', 'Black or silver.', 'f3'),
    ],
  },
]

async function run() {
  // ── 1. Patch the three spirits docs ──────────────────────────────────
  const docs = await client.fetch(
    `*[_type=="product"]{_id, shopifyHandle, faqs, whatsIncluded}`,
  )
  const byHandle = Object.fromEntries(docs.map((d: {shopifyHandle: string}) => [d.shopifyHandle, d]))

  const rum = byHandle[RUM]
  if (rum) {
    const whereFaq = (rum.faqs || []).find((f: {question?: string}) => /where is it made/i.test(f.question || ''))
    const potInc = (rum.whatsIncluded || []).find((w: {description?: string}) => /pot-distilled/i.test(w.description || ''))
    const p = client
      .patch(rum._id)
      .set({process: PROCESS_TEXT, servingSuggestions: SERVING_SUGGESTIONS})
    if (whereFaq?._key) {
      p.set({
        [`faqs[_key=="${whereFaq._key}"].answer`]:
          'The base rum comes from the Caribbean. Maceration, blending and bottling all happen in Britain, at our British partner distillery, in small batches.',
      })
    }
    if (potInc?._key) {
      p.set({[`whatsIncluded[_key=="${potInc._key}"].description`]: '40% ABV spiced rum'})
    }
    await p.commit()
    console.log('patched rum doc', rum._id)
  }

  const sixPack = byHandle['jerry-can-spirits-expedition-pack-spiced-rum-6-bottles']
  if (sixPack) {
    const premiumInc = (sixPack.whatsIncluded || []).find((w: {description?: string}) => /premium/i.test(w.description || ''))
    const p = client.patch(sixPack._id)
    if (premiumInc?._key) {
      p.set({[`whatsIncluded[_key=="${premiumInc._key}"].description`]: '700ml bottle of Expedition Spiced Rum'})
      await p.commit()
      console.log('patched 6-pack doc', sixPack._id)
    }
  }

  const giftPack = byHandle['jerry-can-spirits-premium-gift-pack']
  if (giftPack) {
    const p = client.patch(giftPack._id).set({process: PROCESS_TEXT})
    for (const w of giftPack.whatsIncluded || []) {
      if (/perfect for rum/i.test(w.description || '')) {
        p.set({[`whatsIncluded[_key=="${w._key}"].description`]: 'The glass from the IWSC Silver serve'})
      }
      if (/protects surfaces in style/i.test(w.description || '')) {
        p.set({[`whatsIncluded[_key=="${w._key}"].description`]: 'Natural slate, no two pieces the same'})
      }
    }
    await p.commit()
    console.log('patched gift pack doc', giftPack._id)
  }

  // ── 2. Create the ten tier-2 accessory docs ──────────────────────────
  for (const a of ACCESSORIES) {
    const slug = a.handle === 'stainless-steel-hip-flask-500ml' ? 'stainless-steel-hip-flask' : a.handle
    const doc = {
      _id: `product-${a.handle}`,
      _type: 'product',
      name: a.name,
      slug: {_type: 'slug', current: slug},
      shopifyHandle: a.handle,
      featured: false,
      completeTheServe: a.completeTheServe,
      professionalTip: a.professionalTip,
      faqs: a.faqs,
      ...(a.whatsIncluded ? {whatsIncluded: a.whatsIncluded} : {}),
    }
    await client.createIfNotExists(doc)
    console.log('created (if new)', doc._id)
  }
  console.log('done')
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
