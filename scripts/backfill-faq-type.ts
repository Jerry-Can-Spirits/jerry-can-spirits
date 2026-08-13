/**
 * Give every FAQ item an explicit _type of 'faq'.
 *
 * The guide schema has always named its FAQ array member 'faq'; cocktail and
 * ingredient never did, so their array members were anonymous. Anything
 * written with _type: 'faq' — 229 of 348 cocktails, and everything the
 * copy-pass appliers produced — showed in the Studio as "Item of type faq not
 * valid for this list", uneditable, while rendering correctly on the site
 * because the page reads question and answer and never looks at the type.
 *
 * Naming the member in the schema fixes those and would strand the rest: the
 * items written before the convention carry no _type at all. This is the other
 * half of that change, and the two belong in the same commit.
 *
 * Run:  npx sanity exec scripts/backfill-faq-type.ts --with-user-token
 *       ...add --write to execute.
 */
import { getCliClient } from 'sanity/cli'

const client = getCliClient()
const WRITE = process.argv.includes('--write')

interface Doc {
  _id: string
  _type: string
  name: string | null
  faqs: Array<{ _key: string; _type?: string }> | null
}

async function main() {
  const docs = await client.fetch<Doc[]>(
    `*[_type in ["cocktail", "ingredient", "guide"] && !(_id in path("drafts.**")) && count(faqs) > 0]{
      _id, _type, "name": coalesce(name, title), faqs
    } | order(_type asc, name asc)`
  )

  const needed = docs
    .map((doc) => ({
      doc,
      keys: (doc.faqs ?? []).filter((f) => f._type !== 'faq').map((f) => f._key),
    }))
    .filter((r) => r.keys.length)

  const byType = new Map<string, number>()
  for (const r of needed) byType.set(r.doc._type, (byType.get(r.doc._type) ?? 0) + 1)

  console.log(`${docs.length} documents carry FAQs.`)
  console.log(`${needed.length} have at least one item without _type: 'faq'.\n`)
  for (const [type, count] of byType) console.log(`  ${String(count).padStart(4)}  ${type}`)

  const items = needed.reduce((n, r) => n + r.keys.length, 0)
  console.log(`\n${items} FAQ item(s) to stamp.`)

  if (!WRITE) {
    console.log('\nDRY RUN. Nothing written. Pass --write to execute.')
    return
  }

  let done = 0
  for (const { doc, keys } of needed) {
    const patch = client.patch(doc._id)
    for (const k of keys) patch.set({ [`faqs[_key=="${k}"]._type`]: 'faq' })
    await patch.commit()
    done++
    if (done % 50 === 0) console.log(`  ...${done}/${needed.length}`)
  }
  console.log(`\nWRITTEN. ${done} documents patched.`)
}

main().catch((e) => {
  console.error(e.message ?? e)
  process.exit(1)
})
