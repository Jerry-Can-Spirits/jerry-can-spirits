/**
 * Write alt text for the equipment images.
 *
 * The counterpart to scripts/set-image-alt.ts, which did the same job for the
 * cocktail illustrations, and it follows that file's rule: every entry was
 * written from looking at the picture rather than from the page title.
 *
 * That rule earned its keep here. The muddler image holds two muddlers rather
 * than one, the Lewis bag image holds a bag and a mallet, and the measuring
 * spoons are labelled with three quantities that a screen reader gets nothing
 * of from the pixels. None of that is derivable from a page called "Muddler".
 *
 * NO MEDIUM CLAUSE, DELIBERATELY. The cocktail alt text ends by naming the
 * medium, because those plates are watercolour illustrations and saying so
 * tells a screen reader user what kind of thing they are looking at. The
 * equipment images are rendered product shots rather than photographs, so
 * calling them either would be a claim about their provenance rather than a
 * description of the object. They describe the object and stop.
 *
 * FOURTEEN OF THIRTY-SEVEN. The rest were not written because they were not
 * seen: the session ran out of room to load more images. The script reports
 * how many remain rather than leaving the gap silent, and a second pass should
 * finish them the same way, by looking.
 *
 * Entries are keyed on slug. An unknown slug throws rather than writing
 * nothing, and so does a page with no image, since alt text on an absent
 * picture is a description of nothing.
 *
 * Run: npx sanity exec scripts/set-equipment-image-alt.ts --with-user-token
 *      ...add --write to execute.
 */
import { getCliClient } from 'sanity/cli'

const client = getCliClient()
const WRITE = process.argv.includes('--write')

/** Equipment slug -> alt text, read off the image. */
const ALT: Record<string, string> = {
  'hawthorne-strainer':
    'A stainless steel Hawthorne strainer, its perforated disc ringed by a coiled spring, with a flat handle and two locating prongs.',
  'julep-strainer': 'A stainless steel julep strainer: a shallow perforated bowl on a short offset handle.',
  jigger: 'A brushed stainless steel double jigger, two cones joined at their narrow waists.',
  'japanese-jigger':
    'A tall, slim stainless steel Japanese jigger, more elongated than the standard double jigger, with a cone at each end.',
  'bar-spoon':
    'A stainless steel bar spoon with a long twisted shaft, a teardrop bowl at one end and a flat disc at the other.',
  'boston-shaker': 'A two-piece Boston shaker: a tall stainless steel tin beside the smaller tin that seals into it.',
  muddler:
    'Two muddlers side by side, one turned from pale wood and one stainless steel, both with flat toothed heads.',
  'bar-knife': 'A small paring knife with a black riveted handle and a short straight blade.',
  'citrus-zester':
    'A stainless steel citrus zester, its head cut with a row of small sharpened holes, on a long round handle.',
  'cocktail-picks':
    'Four stainless steel cocktail picks side by side, each with a looped ring at the top and a sharpened point.',
  'fine-mesh-strainer':
    'A fine mesh strainer: a shallow cone of woven mesh in a steel rim, with a long wire handle and a hook opposite.',
  'measuring-spoons':
    'Three stainless steel measuring spoons in a row, labelled one quarter teaspoon, half a teaspoon and one teaspoon.',
  'lewis-bag-and-mallet': 'A canvas Lewis bag standing open beside a turned wooden mallet.',
  'coupe-glass': 'An empty coupe glass, its shallow round bowl on a slender stem and a round foot.',
}

interface Doc {
  _id: string
  name: string
  slug: string
  hasImage: boolean
  currentAlt: string | null
}

async function main() {
  const slugs = Object.keys(ALT)
  const docs = await client.fetch<Doc[]>(
    `*[_type == "equipment" && slug.current in $slugs]{
      _id, name, "slug": slug.current,
      "hasImage": defined(image.asset), "currentAlt": image.alt
    }`,
    { slugs }
  )
  const bySlug = new Map(docs.map((d) => [d.slug, d]))

  const missing = slugs.filter((s) => !bySlug.has(s))
  if (missing.length) throw new Error(`No equipment page for: ${missing.join(', ')}`)

  const imageless = docs.filter((d) => !d.hasImage)
  if (imageless.length) throw new Error(`No image to describe on: ${imageless.map((d) => d.slug).join(', ')}`)

  console.log(`=== ${docs.length} EQUIPMENT IMAGE(S) ===\n`)
  for (const s of slugs) {
    const d = bySlug.get(s)!
    console.log(`  ${d.name}`)
    if (d.currentAlt && d.currentAlt !== ALT[s]) console.log(`    was: "${d.currentAlt}"`)
    console.log(`    now: "${ALT[s]}"`)
  }

  const remaining = await client.fetch<Array<{ name: string }>>(
    `*[_type == "equipment" && defined(image.asset) && !defined(image.alt)]{ name } | order(name asc)`
  )
  console.log(`\n${remaining.length} equipment image(s) still have no alt text:`)
  console.log(`  ${remaining.map((r) => r.name).join(', ') || 'none'}`)

  if (!WRITE) {
    console.log('\nDRY RUN. Nothing written. Pass --write to execute.')
    return
  }

  for (const s of slugs) await client.patch(bySlug.get(s)!._id).set({ 'image.alt': ALT[s] }).commit()
  console.log(`\nWRITTEN. Alt text set on ${slugs.length} image(s).`)
}

main().catch((e) => {
  console.error(e.message ?? e)
  process.exit(1)
})
