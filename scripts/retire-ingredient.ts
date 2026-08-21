/**
 * Retire an ingredient page into a successor: repoint every reference, then
 * delete the document.
 *
 * WHY A SCRIPT. Deleting a Sanity document is the easy half and the half that
 * goes wrong quietly. References to it live wherever the schema put them, not
 * where anyone remembers: the Paloma's link to the grapefruit slice page was in
 * a garnishItem, not in the ingredients array everybody checks first, so a
 * repoint written against ingredients[] would have reported success and changed
 * nothing. This walks the whole document instead of the fields we thought of.
 *
 * THE NAME-DRIFT GUARD. A repoint can leave a recipe reading "Grapefruit slice"
 * while pointing at a page titled "Grapefruit Wheel" — the exact defect
 * scripts/audit-name-drift.ts exists to catch, introduced by the tool meant to
 * tidy up. So any referring document whose visible text still names the retiring
 * page is reported and blocks the run. Fix the copy first, or pass --force when
 * the wording is genuinely fine.
 *
 * WHAT THIS DOES NOT DO. It does not add the redirect. A deleted page 404s until
 * next.config.ts sends it somewhere, and that is a code change that goes through
 * a PR. There is an established block for it, keyed "Sanity docs deleted with
 * clear successors". Add the entry in the same piece of work.
 *
 * Dry run by default; --write executes. The dry run prints every reference it
 * would move and every text it would leave behind.
 *
 * Run: npx sanity exec scripts/retire-ingredient.ts --with-user-token -- \
 *        --from=grapefruit-slice --to=grapefruit-wheel
 *      ...add --write to execute.
 */
import { getCliClient } from 'sanity/cli'

const client = getCliClient()
const WRITE = process.argv.includes('--write')
const FORCE = process.argv.includes('--force')
const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1]

const FROM = arg('from')
const TO = arg('to')

interface Doc {
  _id: string
  _type: string
  name?: string
  title?: string
  slug?: { current?: string }
}

/** Every _ref in the document that points at `id`, as a dotted path. */
function refPaths(node: unknown, id: string, path: string[] = []): string[] {
  if (Array.isArray(node)) return node.flatMap((v, i) => refPaths(v, id, [...path, String(i)]))
  if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>
    if (obj._ref === id) return [path.join('.')]
    return Object.entries(obj).flatMap(([k, v]) => refPaths(v, id, [...path, k]))
  }
  return []
}

/** A copy of the document with every _ref of `from` swapped for `to`. */
function repoint(node: unknown, from: string, to: string): unknown {
  if (Array.isArray(node)) return node.map((v) => repoint(v, from, to))
  if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>
    if (obj._ref === from) return { ...obj, _ref: to }
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, repoint(v, from, to)]))
  }
  return node
}

/** Visible strings in the document, so the drift guard can read them. */
function strings(node: unknown, out: string[] = []): string[] {
  if (typeof node === 'string') out.push(node)
  else if (Array.isArray(node)) node.forEach((v) => strings(v, out))
  else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      if (k.startsWith('_')) continue
      strings(v, out)
    }
  }
  return out
}

async function main() {
  if (!FROM || !TO) throw new Error('Pass --from=<slug> --to=<slug>.')
  if (FROM === TO) throw new Error('--from and --to are the same page.')

  const [from, to] = await Promise.all(
    [FROM, TO].map((slug) =>
      client.fetch<Doc | null>(`*[_type == "ingredient" && slug.current == $slug][0]{_id,_type,name,slug}`, { slug })
    )
  )
  if (!from) throw new Error(`No ingredient page with slug "${FROM}".`)
  if (!to) throw new Error(`No ingredient page with slug "${TO}". Refusing to retire into nothing.`)

  console.log(`Retiring "${from.name}" (${FROM}) into "${to.name}" (${TO}).\n`)

  const referrers = await client.fetch<Doc[]>(`*[references($id)]`, { id: from._id })
  console.log(`${referrers.length} document(s) reference it.\n`)

  // Text still naming the retiring page after the reference has moved is the
  // drift this script would otherwise introduce.
  const drift: Array<{ doc: Doc; hits: string[] }> = []
  const nameWords = (from.name ?? '').trim()
  const nameRe = nameWords ? new RegExp(nameWords.replace(/\s+/g, '\\s+'), 'i') : null

  for (const doc of referrers) {
    const label = doc.name ?? doc.title ?? doc._id
    const paths = refPaths(doc, from._id)
    console.log(`  ${label}  (${doc._type})`)
    for (const p of paths) console.log(`    ref at  ${p || '(root)'}`)

    const hits = nameRe ? strings(doc).filter((s) => nameRe.test(s) && s.length < 400) : []
    if (hits.length) {
      drift.push({ doc, hits })
      for (const h of hits) console.log(`    !! text still says: "${h}"`)
    }
  }

  if (drift.length && !FORCE) {
    console.log(`\n!! ${drift.length} document(s) carry text naming "${from.name}".`)
    console.log('   Repointing them would leave a recipe describing one cut and linking')
    console.log('   to another. Fix the copy first, or pass --force if the wording holds.')
    process.exitCode = 1
    return
  }

  if (!WRITE) {
    console.log(`\nDRY RUN. Nothing written. Would repoint ${referrers.length} document(s), then delete ${from._id}.`)
    console.log('Remember the redirect in next.config.ts; a deleted page 404s without it.')
    return
  }

  let moved = 0
  for (const doc of referrers) {
    const next = repoint(doc, from._id, to._id) as Doc
    await client.createOrReplace(next as never)
    moved++
  }
  await client.delete(from._id)
  console.log(`\nWRITTEN. Repointed ${moved} document(s) and deleted ${from._id}.`)
  console.log(`Now add the redirect: /field-manual/ingredients/${FROM}/ -> /field-manual/ingredients/${TO}/`)
}

main().catch((e) => {
  console.error(e.message ?? e)
  process.exit(1)
})
