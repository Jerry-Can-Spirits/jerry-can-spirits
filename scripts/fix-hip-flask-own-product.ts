/**
 * One-off: repoint the hip-flask guide's "We Make One" card from the
 * discontinued 500ml flask to the 150ml it 308-redirects to.
 *
 * A companion to scripts/fix-hip-flask-link.ts, which fixed the inline link in
 * the same guide's portable text. That script scanned longDescription markDefs
 * only, so it repaired one of the two links on the page and left this one --
 * the equipment schema also carries a structured ownProduct.path field, which
 * no markDef sweep can see. The card's own copy already said 150ml while its
 * link pointed at the 500ml, so the page contradicted itself.
 *
 * Run: npx sanity exec scripts/fix-hip-flask-own-product.ts --with-user-token
 */
import { getCliClient } from 'sanity/cli'

const client = getCliClient()

const OLD = '/shop/product/stainless-steel-hip-flask-500ml/'
const NEW = '/shop/product/stainless-steel-hip-flask-150ml/'

async function main() {
  // Drafts included: a published-only fix reappears the next time anyone
  // publishes the draft.
  const docs: Array<{ _id: string; ownProduct?: { path?: string } }> = await client.fetch(
    `*[_type == "equipment" && ownProduct.path == $old]{ _id, ownProduct }`,
    { old: OLD }
  )

  if (!docs.length) {
    console.log('no equipment document points at the 500ml flask')
    return
  }

  for (const doc of docs) {
    await client.patch(doc._id).set({ 'ownProduct.path': NEW }).commit()
    console.log(`patched ${doc._id}: ownProduct.path -> ${NEW}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
