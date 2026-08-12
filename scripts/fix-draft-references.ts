/**
 * Repoint any reference that points at a draft.
 *
 * A `_ref` of "drafts.abc" is invisible on the live site: the site reads
 * perspective: 'published', so the reference resolves to nothing and whatever
 * it was meant to link — a related ingredient, a guide — silently disappears
 * from the page. Nothing surfaces it, because the document itself is valid and
 * the Studio resolves the draft happily.
 *
 * It also blocks deleting the draft, which is how this was found: a stale
 * Cream of Coconut draft could not be removed because equipment-blender held a
 * reference to the draft id rather than the published one.
 *
 * Run:  npx sanity exec scripts/fix-draft-references.ts --with-user-token
 *       ...add --write to execute.
 */
import { getCliClient } from 'sanity/cli'

const client = getCliClient()
const WRITE = process.argv.includes('--write')

const DRAFT = 'drafts.'

interface Found {
  id: string
  type: string
  path: string
  from: string
  to: string
}

/** Walk a document and collect every _ref pointing into drafts. */
function scan(node: unknown, path: string, out: Found[], id: string, type: string): void {
  if (Array.isArray(node)) {
    node.forEach((item, i) => {
      const key = (item as { _key?: string })?._key
      scan(item, `${path}[${key ? `_key=="${key}"` : i}]`, out, id, type)
    })
    return
  }
  if (!node || typeof node !== 'object') return

  const obj = node as Record<string, unknown>
  if (typeof obj._ref === 'string' && obj._ref.startsWith(DRAFT)) {
    out.push({ id, type, path: `${path}._ref`, from: obj._ref, to: obj._ref.slice(DRAFT.length) })
  }
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith('_')) continue
    scan(value, path ? `${path}.${key}` : key, out, id, type)
  }
}

async function main() {
  const docs = await client.fetch<Array<Record<string, unknown>>>(
    `*[!(_id in path("drafts.**"))]`
  )

  const found: Found[] = []
  for (const doc of docs) {
    scan(doc, '', found, doc._id as string, doc._type as string)
  }

  if (!found.length) {
    console.log(`Scanned ${docs.length} published documents. No reference points at a draft.`)
    return
  }

  console.log(`Scanned ${docs.length} published documents.\n`)
  console.log(`${found.length} reference(s) point at a draft, so they resolve to nothing on the live site:\n`)

  // Only repoint where the published document actually exists. A reference to
  // a draft that was never published is a different problem — the link is to
  // something no reader can reach — and silently pointing it at a missing id
  // would swap one broken link for another.
  const targets = await client.fetch<string[]>(`*[_id in $ids]._id`, { ids: found.map((f) => f.to) })
  const live = new Set(targets)

  for (const f of found) {
    const ok = live.has(f.to)
    console.log(`  ${f.id} (${f.type})`)
    console.log(`    ${f.path}`)
    console.log(`    ${f.from}`)
    console.log(`    -> ${f.to}${ok ? '' : '   !! NO PUBLISHED DOCUMENT WITH THAT ID — left alone'}`)
  }

  const fixable = found.filter((f) => live.has(f.to))
  if (!WRITE) {
    console.log(`\n${fixable.length} of ${found.length} can be repointed. DRY RUN. Pass --write to execute.`)
    return
  }

  for (const f of fixable) {
    await client.patch(f.id).set({ [f.path]: f.to }).commit()
  }
  console.log(`\nWRITTEN. ${fixable.length} reference(s) repointed.`)
}

main().catch((e) => {
  console.error(e.message ?? e)
  process.exit(1)
})
