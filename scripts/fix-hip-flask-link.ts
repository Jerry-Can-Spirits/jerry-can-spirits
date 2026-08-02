/**
 * One-off: repoint the hip-flask equipment guide's inline link from the
 * discontinued 500ml flask to the 150ml it 308-redirects to.
 *
 * The link lives in a portable-text markDef, which is why it survived the
 * link audits that read rendered text: pt::text() strips mark annotations.
 *
 * Run: npx sanity exec scripts/fix-hip-flask-link.ts --with-user-token
 */
import { getCliClient } from 'sanity/cli'

const client = getCliClient()

const OLD = '/shop/product/stainless-steel-hip-flask-500ml/'
const NEW = '/shop/product/stainless-steel-hip-flask-150ml/'

async function main() {
  // Drafts included deliberately: a published fix that leaves the draft holding
  // the old link reintroduces it the next time anyone hits publish.
  const docs: Array<{ _id: string; longDescription?: Array<{ _key: string; markDefs?: Array<{ _key: string; _type: string; href?: string }> }> }> =
    await client.fetch(`*[defined(longDescription)]{ _id, longDescription }`)

  let patched = 0
  for (const doc of docs) {
    const blocks = doc.longDescription ?? []
    for (let bi = 0; bi < blocks.length; bi++) {
      const marks = blocks[bi].markDefs ?? []
      for (let mi = 0; mi < marks.length; mi++) {
        if (marks[mi].href !== OLD) continue
        await client
          .patch(doc._id)
          .set({ [`longDescription[_key=="${blocks[bi]._key}"].markDefs[_key=="${marks[mi]._key}"].href`]: NEW })
          .commit()
        console.log(`patched ${doc._id} block ${blocks[bi]._key} mark ${marks[mi]._key}`)
        patched++
      }
    }
  }

  console.log(patched ? `done: ${patched} link(s) repointed` : 'no matching links found')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
