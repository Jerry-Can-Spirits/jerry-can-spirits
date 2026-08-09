/**
 * Transient. Prints the copy-pass queue ordered by measured self-reference,
 * then dumps the full current text of the first N so they can be read before
 * being rewritten. Read-only.
 *
 * npx sanity exec scripts/read-copy-queue.ts --with-user-token -- --dump=5
 */
import { getCliClient } from 'sanity/cli'
import { selfReferences } from './self-reference'

const client = getCliClient()
const DUMP = Number(process.argv.find((a) => a.startsWith('--dump='))?.split('=')[1] ?? '5')
const SKIP = Number(process.argv.find((a) => a.startsWith('--skip='))?.split('=')[1] ?? '0')

interface Block { _type?: string; style?: string; children?: Array<{ text?: string }> }
interface C {
  _id: string
  name: string
  slug: string
  description: string | null
  note: string | null
  instructions: string[] | null
  flavorProfile: string[] | null
  glassware: string | null
  baseSpirit: string | null
  longDescription: Block[] | null
  faqs: Array<{ question?: string; answer?: string }> | null
  ingredients: Array<{ _key: string; name?: string; amount?: string; description?: string | null; ref?: string | null }> | null
  hasImage: boolean
}

const blockText = (b: Block[] | null) =>
  (b ?? [])
    .filter((x) => x._type === 'block')
    .map((x) => (x.children ?? []).map((c) => c.text ?? '').join(''))
    .join(' ')

async function main() {
  const rows = await client.fetch<C[]>(`
    *[_type == "cocktail"]{
      _id, name, "slug": slug.current, description, note, instructions, flavorProfile,
      "glassware": glassware, baseSpirit,
      longDescription[]{ _type, style, children[]{ text } },
      faqs[]{ question, answer },
      ingredients[]{ _key, name, amount, description, "ref": ingredientRef->name },
      "hasImage": defined(image.asset)
    } | order(name asc)
  `)

  const scored = rows.map((c) => {
    const prose = [
      c.description ?? '',
      c.note ?? '',
      blockText(c.longDescription),
      ...(c.faqs ?? []).flatMap((f) => [f.question ?? '', f.answer ?? '']),
      ...(c.ingredients ?? []).map((i) => i.description ?? ''),
    ].join(' ')
    return { c, score: selfReferences(prose).length }
  })

  const queue = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score || a.c.name.localeCompare(b.c.name))

  console.log(`${queue.length} cocktails still self-refer.\n`)
  console.log('=== NEXT 20 IN QUEUE ===')
  queue.slice(SKIP, SKIP + 20).forEach(({ c, score }, i) => console.log(`  ${String(SKIP + i + 1).padStart(3)}  ${String(score).padStart(2)}  ${c.name}  [${c._id}]`))

  console.log(`\n\n=== FULL TEXT OF THE NEXT ${DUMP} ===`)
  for (const { c, score } of queue.slice(SKIP, SKIP + DUMP)) {
    console.log(`\n\n${'='.repeat(70)}\n${c.name}  |  ${c._id}  |  self-ref ${score}  |  image ${c.hasImage}\nbase: ${c.baseSpirit ?? '-'}  glass: ${c.glassware ?? '-'}`)
    console.log(`\n--- INGREDIENTS ---`)
    for (const i of c.ingredients ?? []) {
      console.log(`  [${i._key}] ${i.amount ?? ''} ${i.name ?? ''}  -> ${i.ref ?? 'NO REF'}`)
      console.log(`      ${i.description ?? '(no note)'}`)
    }
    console.log(`\n--- INSTRUCTIONS ---`)
    ;(c.instructions ?? []).forEach((s, n) => console.log(`  ${n + 1}. ${s}`))
    console.log(`\n--- FLAVOUR --- ${(c.flavorProfile ?? []).join(', ')}`)
    console.log(`\n--- DESCRIPTION ---\n${c.description ?? '(none)'}`)
    console.log(`\n--- EXPERT TIP ---\n${c.note ?? '(none)'}`)
    console.log(`\n--- LONG DESCRIPTION ---`)
    for (const b of c.longDescription ?? []) {
      const t = (b.children ?? []).map((x) => x.text ?? '').join('')
      console.log(b.style && /^h[23]$/.test(b.style) ? `\n## ${t}` : t)
    }
    console.log(`\n--- FAQS ---`)
    for (const f of c.faqs ?? []) console.log(`  Q: ${f.question}\n  A: ${f.answer}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
