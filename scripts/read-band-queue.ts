/**
 * Transient. The copy pass after self-reference: orders the remaining work by
 * how many measurable bands a page misses, worst first, and dumps the full
 * current text of the first N so they can be read before being rewritten.
 *
 * Read-only. Bands are the ones in scripts/audit-cocktail-standard.ts.
 *
 * npx sanity exec scripts/read-band-queue.ts --with-user-token -- --dump=4 --skip=0
 */
import { getCliClient } from 'sanity/cli'

const client = getCliClient()
const DUMP = Number(process.argv.find((a) => a.startsWith('--dump='))?.split('=')[1] ?? '4')
const SKIP = Number(process.argv.find((a) => a.startsWith('--skip='))?.split('=')[1] ?? '0')
const LIST = Number(process.argv.find((a) => a.startsWith('--list='))?.split('=')[1] ?? '25')

interface Block { _type?: string; style?: string; children?: Array<{ text?: string }> }
interface C {
  _id: string
  name: string
  slug: string
  description: string | null
  note: string | null
  instructions: string[] | null
  flavorProfile: string[] | null
  baseSpirit: string | null
  longDescription: Block[] | null
  faqs: Array<{ question?: string; answer?: string }> | null
  ingredients: Array<{ _key: string; name?: string; amount?: string; description?: string | null; ref?: string | null }> | null
}

const words = (s: string | null | undefined) => (s ? s.trim().split(/\s+/).filter(Boolean).length : 0)
const blockText = (b: Block[] | null) =>
  (b ?? [])
    .filter((x) => x._type === 'block')
    .map((x) => (x.children ?? []).map((c) => c.text ?? '').join(''))
    .join(' ')

function faults(c: C): string[] {
  const out: string[] = []
  const d = words(c.description)
  if (d < 150 || d > 200) out.push(`desc ${d}`)
  const t = words(c.note)
  if (t < 100 || t > 160) out.push(`tip ${t}`)
  const ld = words(blockText(c.longDescription))
  if (ld < 450 || ld > 650) out.push(`long ${ld}`)
  const headings = (c.longDescription ?? []).filter((b) => /^h[23]$/.test(b.style ?? '')).length
  if (ld > 0 && headings < 3) out.push(`sections ${headings}`)
  const faqs = c.faqs ?? []
  if (faqs.length < 3 || faqs.length > 4) out.push(`faq count ${faqs.length}`)
  const badFaq = faqs.filter((f) => words(f.answer) < 35 || words(f.answer) > 60).length
  if (badFaq) out.push(`faq len ${badFaq}/${faqs.length}`)
  const fp = c.flavorProfile ?? []
  if (fp.length < 4 || fp.length > 6) out.push(`flavour ${fp.length}`)
  const ings = c.ingredients ?? []
  const thin = ings.filter((i) => words(i.description) < 15).length
  if (thin) out.push(`ing notes ${thin}/${ings.length}`)
  return out
}

async function main() {
  const rows = await client.fetch<C[]>(`
    *[_type == "cocktail" && !(_id in path("drafts.**"))]{
      _id, name, "slug": slug.current, description, note, instructions, flavorProfile, baseSpirit,
      longDescription[]{ _type, style, children[]{ text } },
      faqs[]{ question, answer },
      ingredients[]{ _key, name, amount, description, "ref": ingredientRef->name }
    } | order(name asc)
  `)

  const scored = rows
    .map((c) => ({ c, f: faults(c) }))
    .filter((x) => x.f.length > 0)
    .sort((a, b) => b.f.length - a.f.length || a.c.name.localeCompare(b.c.name))

  console.log(`${scored.length} of ${rows.length} cocktails miss at least one band.\n`)
  console.log(`=== QUEUE ${SKIP + 1}-${SKIP + LIST} ===`)
  scored.slice(SKIP, SKIP + LIST).forEach(({ c, f }, i) =>
    console.log(`  ${String(SKIP + i + 1).padStart(3)}  ${String(f.length)}  ${c.name.padEnd(30)} [${c._id}]\n           ${f.join(' | ')}`)
  )

  console.log(`\n\n=== FULL TEXT OF THE NEXT ${DUMP} ===`)
  for (const { c, f } of scored.slice(SKIP, SKIP + DUMP)) {
    console.log(`\n\n${'='.repeat(70)}\n${c.name}  |  ${c._id}\nmisses: ${f.join(' | ')}\nbase: ${c.baseSpirit ?? '-'}`)
    console.log(`\n--- INGREDIENTS ---`)
    for (const i of c.ingredients ?? []) {
      console.log(`  [${i._key}] ${i.amount ?? ''} ${i.name ?? ''}  -> ${i.ref ?? 'NO REF'}`)
      console.log(`      ${i.description ?? '(no note)'}`)
    }
    console.log(`\n--- INSTRUCTIONS ---`)
    ;(c.instructions ?? []).forEach((s, n) => console.log(`  ${n + 1}. ${s}`))
    console.log(`\n--- FLAVOUR --- ${(c.flavorProfile ?? []).join(', ')}`)
    console.log(`\n--- DESCRIPTION (${words(c.description)}w) ---\n${c.description ?? '(none)'}`)
    console.log(`\n--- EXPERT TIP (${words(c.note)}w) ---\n${c.note ?? '(none)'}`)
    console.log(`\n--- LONG DESCRIPTION (${words(blockText(c.longDescription))}w) ---`)
    for (const b of c.longDescription ?? []) {
      const t = (b.children ?? []).map((x) => x.text ?? '').join('')
      console.log(b.style && /^h[23]$/.test(b.style) ? `\n## ${t}` : t)
    }
    console.log(`\n--- FAQS ---`)
    for (const f2 of c.faqs ?? []) console.log(`  Q: ${f2.question}\n  A (${words(f2.answer)}w): ${f2.answer}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
