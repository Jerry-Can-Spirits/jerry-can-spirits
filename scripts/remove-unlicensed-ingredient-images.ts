/**
 * Remove the ingredient page images, whose provenance cannot be established.
 *
 * WHY. Writing alt text for these meant looking at them, and looking at them
 * turned up a problem bigger than the missing alt. The Fresh Mint Sprig image
 * carries a tiled Alamy watermark, repeated "a" glyphs and the tail of the
 * wordmark across the leaves. A licensed download does not have a watermark, so
 * that image was taken from a stock library without one, and it was live on a
 * commercial site.
 *
 * MEASURED 21 August 2026 across all 167 Field Manual images:
 *
 *   Equipment  37 images, every one 1024x1536. A coherent set, consistently
 *              produced, and left alone by this script.
 *   Ingredient 130 images, 92 of them under 600px wide. Thirteen share an exact
 *              290x290 at 11-26KB, which is a retailer's thumbnail grid rather
 *              than anything anyone shot. Others are 200x500, 245x180, 231x300.
 *
 * One confirmed unlicensed image plus 92 thumbnails of unknown origin is not a
 * set you can clear one by one, and the licence cannot be reconstructed after
 * the fact. So they come down until they can be replaced with our own
 * photography.
 *
 * The cost of removing them is small. Every ingredient page carries 330 words
 * or more, the images are decorative product shots rather than anything the
 * page argues with, and 168 ingredient pages already render without one, so the
 * no-image path is well travelled.
 *
 * Reversible: this unsets the reference on the document and does not delete the
 * asset from the library. The mapping is printed before writing so it can be
 * restored.
 *
 * Dry run by default; --write executes.
 *
 * Run: npx sanity exec scripts/remove-unlicensed-ingredient-images.ts --with-user-token
 *      ...add --write to execute.
 */
import { getCliClient } from 'sanity/cli'

const client = getCliClient()
const WRITE = process.argv.includes('--write')

interface Row {
  _id: string
  name: string
  slug: string
  assetId: string | null
  w: number | null
  h: number | null
}

async function main() {
  const rows = await client.fetch<Row[]>(`
    *[_type == "ingredient" && !(_id in path("drafts.**")) && defined(image.asset)]{
      _id, name, "slug": slug.current,
      "assetId": image.asset._ref,
      "w": image.asset->metadata.dimensions.width,
      "h": image.asset->metadata.dimensions.height
    } | order(name asc)`)

  console.log(`${rows.length} ingredient page(s) carry an image.\n`)
  console.log('=== MAPPING, KEEP THIS TO RESTORE ===')
  for (const r of rows) console.log(`${r._id}|${r.slug}|${r.assetId}|${r.w}x${r.h}`)

  const small = rows.filter((r) => (r.w ?? 0) < 600).length
  console.log(`\n${small} of ${rows.length} are under 600px wide.`)

  if (!WRITE) {
    console.log('\nDRY RUN. Nothing written. Pass --write to unset them.')
    return
  }

  for (const r of rows) await client.patch(r._id).unset(['image']).commit()
  console.log(`\nWRITTEN. Unset image on ${rows.length} ingredient page(s). Assets remain in the library.`)
}

main().catch((e) => {
  console.error(e.message ?? e)
  process.exit(1)
})
