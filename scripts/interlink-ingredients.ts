/**
 * Interlinking pass: connect the sub-type ingredient pages to their new
 * parents, to the guides that genuinely cover them, and to the cocktails that
 * actually use them.
 *
 * Three jobs, three different methods:
 *
 *  1. sub-type -> parent, via relatedIngredients. Mechanical, from the family
 *     map below.
 *  2. relatedGuides, for the rum sub-types and penderyn only, and only where
 *     the field is genuinely empty. The 55 guides are overwhelmingly rum: 25
 *     relate to rum, exactly one to whisky, and none at all to bitters,
 *     vermouth, sherry or syrup. Everything else is left empty on purpose. A
 *     padded field teaches readers the links are not worth following, and the
 *     emptiness is the honest record of a content gap. Six rum sub-types were
 *     already populated, so this writes two documents, not nine.
 *  3. relatedCocktails, DERIVED from ingredients[].ingredientRef rather than
 *     guessed. Capped at 12, base-spirit cocktails first.
 *
 * Dry run by default. Pass --write to execute.
 *
 * Run: npx sanity exec scripts/interlink-ingredients.ts --with-user-token
 *      npx sanity exec scripts/interlink-ingredients.ts --with-user-token -- --write
 */
import { getCliClient } from 'sanity/cli'

const client = getCliClient()
const WRITE = process.argv.includes('--write')
const MAX_COCKTAILS = 12

let n = 0
const k = () => `il${(n++).toString(36).padStart(6, '0')}`

/** Sub-type slug -> parent slug. */
const PARENT_OF: Record<string, string> = {}
const FAMILIES: Record<string, string[]> = {
  whisky: ['whiskey-rye', 'whiskey-bourbon', 'whiskey-irish', 'whisky-scotch', 'whisky-japanese', 'islay-scotch-whisky', 'penderyn'],
  bitters: ['angostura-bitters', 'peychauds-bitters', 'orange-bitters', 'chocolate-bitters', 'celery-bitters'],
  vermouth: ['sweet-vermouth', 'dry-vermouth'],
  sherry: ['fino-sherry', 'amontillado-sherry', 'pedro-ximenez-sherry', 'oloroso-sherry', 'manzanilla-sherry'],
  rum: ['white-rum', 'dark-rum', 'aged-rum', 'spiced-rum', 'overproof-rum', 'blackstrap-rum', 'cachaca'],
  syrup: [
    'simple-syrup', 'demerara-syrup', 'orgeat-syrup', 'honey-syrup', 'honey-ginger-syrup', 'agave-syrup',
    'cane-syrup', 'maple-syrup', 'vanilla-sugar-syrup', 'passion-fruit-syrup', 'raspberry-syrup',
    'strawberry-syrup', 'apple-cider-syrup', 'chocolate-syrup', 'caramel-syrup', 'cinnamon-syrup',
    'rose-syrup', 'butterfly-pea-syrup',
  ],
}
for (const [parent, subs] of Object.entries(FAMILIES)) for (const s of subs) PARENT_OF[s] = parent

/**
 * relatedGuides, nine documents. Seasonal round-ups are excluded deliberately:
 * a Burns Night menu is not bourbon education.
 */
const GUIDES_FOR: Record<string, string[]> = {
  'white-rum': ['complete-guide-rum', 'rum-rhum-or-ron', 'how-to-taste-rum'],
  'dark-rum': ['dark-rum-vs-spiced-rum', 'complete-guide-rum', 'how-to-read-a-rum-label'],
  'aged-rum': ['complete-guide-rum', 'how-to-taste-rum', 'caribbean-rum-houses'],
  'spiced-rum': ['complete-guide-spiced-rum', 'dark-rum-vs-spiced-rum', 'where-is-spiced-rum-made'],
  'overproof-rum': ['complete-guide-rum', 'how-to-read-a-rum-label'],
  'blackstrap-rum': ['complete-guide-rum', 'how-to-read-a-rum-label'],
  cachaca: ['rum-rhum-or-ron', 'complete-guide-rum'],
  'jerry-can-spirits-expedition-spiced-rum': ['complete-guide-spiced-rum', 'botanicals-behind-expedition-spiced-rum'],
  penderyn: ['the-rise-of-english-whisky'],
}

interface Ing { _id: string; slug: string; name: string; ri: string[] | null; rg: number | null; rc: number | null }
interface Ckt { slug: string; id: string; base: string | null; ings: string[] }

async function main() {
  console.log(WRITE ? '=== WRITE MODE ===\n' : '=== DRY RUN — nothing will be written. Pass --write to execute. ===\n')

  // relatedIngredients is fetched as slugs, not a count: 24 of the 26
  // sub-types already carry sibling links, so the parent must be APPENDED.
  // Setting the array would silently delete work someone did by hand.
  const ings = (await client.fetch(
    `*[_type=="ingredient"]{ _id, "slug": slug.current, name, "ri": relatedIngredients[]->slug.current, "rg": count(relatedGuides), "rc": count(relatedCocktails) }`
  )) as Ing[]
  const bySlug = new Map(ings.map((i) => [i.slug, i]))

  const guides = (await client.fetch(`*[_type=="guide"]{ _id, "slug": slug.current, title }`)) as Array<{ _id: string; slug: string; title: string }>
  const guideBySlug = new Map(guides.map((g) => [g.slug, g]))

  const cocktails = (await client.fetch(
    `*[_type=="cocktail"]{ "slug": slug.current, "id": _id, "base": baseSpirit, "ings": ingredients[].ingredientRef->slug.current }`
  )) as Ckt[]

  // Which cocktails cite each ingredient, base-spirit uses first.
  const usedBy = new Map<string, Ckt[]>()
  for (const c of cocktails) for (const i of c.ings || []) if (i) (usedBy.get(i) ?? usedBy.set(i, []).get(i)!).push(c)

  let parentEdits = 0, guideEdits = 0, cocktailEdits = 0, skipped = 0

  for (const [sub, parentSlug] of Object.entries(PARENT_OF)) {
    const doc = bySlug.get(sub)
    if (!doc) { console.log(`  MISSING  /${sub} does not exist`); continue }
    const parent = bySlug.get(parentSlug)
    if (!parent) { console.log(`  MISSING  parent /${parentSlug}`); continue }

    const patch: Record<string, unknown> = {}
    const existingRi = doc.ri ?? []

    // 1 — append the parent, preserving the sibling links already there
    if (!existingRi.includes(parentSlug)) {
      const kept = existingRi.map((s) => bySlug.get(s)).filter((d): d is Ing => !!d)
      patch.relatedIngredients = [
        { _type: 'reference', _key: k(), _ref: parent._id },
        ...kept.map((d) => ({ _type: 'reference', _key: k(), _ref: d._id })),
      ]
      console.log(`  parent   /${sub}  ->  /${parentSlug}   (keeping ${kept.length} sibling link${kept.length === 1 ? '' : 's'})`)
      parentEdits++
    }

    // 2 — guides, only the mapped ones, only where genuinely empty
    const wanted = GUIDES_FOR[sub]
    if (wanted && !doc.rg) {
      const links = wanted
        .map((gs) => guideBySlug.get(gs))
        .filter((g): g is { _id: string; slug: string; title: string } => !!g)
        .map((g) => ({ _type: 'guideLink', _key: k(), guide: { _type: 'reference', _ref: g._id }, linkText: g.title }))
      if (links.length) {
        patch.relatedGuides = links
        console.log(`  guides   /${sub}  ->  ${wanted.join(', ')}`)
        guideEdits++
      }
    }

    // 3 — cocktails, derived, base spirit first, capped
    if (!doc.rc) {
      const all = usedBy.get(sub) || []
      const ranked = [...all].sort((a, b) => {
        const aBase = a.base === sub ? 0 : 1
        const bBase = b.base === sub ? 0 : 1
        return aBase - bBase || a.slug.localeCompare(b.slug)
      })
      const picked = ranked.slice(0, MAX_COCKTAILS)
      if (picked.length) {
        patch.relatedCocktails = picked.map((c) => ({ _type: 'reference', _key: k(), _ref: c.id }))
        console.log(`  cocktail /${sub}  ->  ${picked.length} of ${all.length} (${picked.slice(0, 3).map((c) => c.slug).join(', ')}${picked.length > 3 ? ', …' : ''})`)
        cocktailEdits++
      } else {
        console.log(`  empty    /${sub}  no cocktail references it — left empty deliberately`)
        skipped++
      }
    }

    if (WRITE && Object.keys(patch).length) await client.patch(doc._id).set(patch).commit()
  }

  console.log('\n  ' + (WRITE ? 'written' : 'would write') + ':')
  console.log(`    parent links      ${parentEdits}`)
  console.log(`    relatedGuides     ${guideEdits}`)
  console.log(`    relatedCocktails  ${cocktailEdits}`)
  console.log(`    left empty        ${skipped}`)
  if (!WRITE) console.log('\n  Re-run with -- --write to apply.')
}

main().catch((e) => { console.error(e); process.exit(1) })
