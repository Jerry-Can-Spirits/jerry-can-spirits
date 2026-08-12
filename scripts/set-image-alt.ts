/**
 * Write alt text for the cocktail illustrations.
 *
 * Every entry below was written from looking at the image. The plates are
 * illustrations rather than photographs and they vary in ways the document
 * cannot predict — the colour of the liquid, whether there is ice in the
 * glass, and which garnish the illustrator actually drew — so none of it is
 * derivable from the recipe and all of it was read off the picture.
 *
 * The sentence follows the twelve plates that already carried alt text: the
 * drink, the glass, the colour, the ice, the garnish, then the medium. The
 * surrounding botanical vignettes are deliberately not described. They are
 * decoration around the subject, and listing them would bury the one thing a
 * screen reader user wants first.
 *
 * Transient. Reset with `git checkout -- scripts/set-image-alt.ts` after the run.
 *
 * Run:  npx sanity exec scripts/set-image-alt.ts --with-user-token
 *       ...add --write to execute.
 */
import { getCliClient } from 'sanity/cli'

const client = getCliClient()
const WRITE = process.argv.includes('--write')

const STYLE =
  'painted in warm sun-faded tones on aged parchment paper with loose ink outlines and visible brush texture.'

/** Cocktail slug -> the sentence before the shared style clause. */
const ALT: Record<string, string> = {
  adonis:
    'A vintage watercolour illustration of an Adonis cocktail served in a coupe glass filled with deep golden-amber liquid with no ice, garnished with a curl of orange peel on the rim',
  alaska:
    'A vintage watercolour illustration of an Alaska cocktail served in a coupe glass filled with pale golden-yellow liquid with no ice, garnished with a twist of orange peel on the rim',
  'amaretto-sour':
    'A vintage watercolour illustration of an Amaretto Sour served in a rocks glass filled with warm amber liquid and visible ice cubes beneath a thick cap of white foam, garnished with a maraschino cherry and a strip of orange peel on a cocktail pick',
  americano:
    'A vintage watercolour illustration of an Americano served in a highball glass filled with deep ruby-red liquid and visible ice, garnished with an orange slice on the rim',
  'aperol-sour':
    'A vintage watercolour illustration of an Aperol Sour served in a coupe glass filled with vivid orange liquid topped with soft white foam, garnished with a dried orange wheel on the rim',
  'aperol-spritz':
    'A vintage watercolour illustration of an Aperol Spritz served in a stemmed wine glass filled with bright orange liquid, visible ice and floating orange slices',
  aviation:
    'A vintage watercolour illustration of an Aviation cocktail served in a coupe glass filled with pale violet-blue liquid with no ice, garnished with a dark maraschino cherry resting in the bowl',
  'bahama-mama':
    'A vintage watercolour illustration of a Bahama Mama served in a hurricane glass filled with liquid graduating from deep red at the base to golden orange at the top over crushed ice, garnished with a pineapple wedge and a maraschino cherry on the rim',
  bamboo:
    'A vintage watercolour illustration of a Bamboo cocktail served in a coupe glass filled with pale straw-gold liquid with no ice, garnished with a twist of lemon peel on the rim',
  'bees-knees':
    "A vintage watercolour illustration of a Bee's Knees served in a coupe glass filled with pale honey-gold liquid with no ice, garnished with a twist of lemon peel on the rim",
  'berry-sour':
    'A vintage watercolour illustration of a Berry Sour served in a coupe glass filled with deep purple-red liquid beneath a thick cap of white foam, garnished with a blackberry resting on the foam',
  bijou:
    'A vintage watercolour illustration of a Bijou cocktail served in a coupe glass filled with burnished amber-brown liquid with no ice, garnished with a long twist of orange peel and a cherry in the bowl',
  'blood-and-sand':
    'A vintage watercolour illustration of a Blood and Sand served in a coupe glass filled with deep russet-red liquid with no ice, garnished with a stemmed cherry and a curl of orange peel on the rim',
  boulevardier:
    'A vintage watercolour illustration of a Boulevardier served in a rocks glass filled with deep reddish-brown liquid over a large block of ice, garnished with a twist of orange peel on the rim',
  bramble:
    'A vintage watercolour illustration of a Bramble served in a rocks glass packed with crushed ice, pale gold liquid at the base bleeding into deep purple blackberry liqueur drawn down through the ice, garnished with blackberries, a lemon slice and a straw',
  'brandy-crusta':
    'A vintage watercolour illustration of a Brandy Crusta served in a coupe glass with a wide crusted sugar rim, filled with pale golden-amber liquid with no ice, garnished with a coiled lemon peel tucked inside the bowl',
  'brandy-sling-cold':
    'A vintage watercolour illustration of a cold Brandy Sling served in a tall highball glass filled with pale amber liquid and visible ice cubes, garnished with a lemon wheel on the rim and a dusting of grated nutmeg',
  'brandy-sling-hot':
    'A vintage watercolour illustration of a hot Brandy Sling served in a clear glass mug with a handle, filled with steaming golden-brown liquid, the surface dusted with grated nutmeg and wisps of steam rising from it',
  caipirinha:
    'A vintage watercolour illustration of a Caipirinha served in a rocks glass packed with crushed ice and pale green liquid, muddled lime wedges visible through the glass, garnished with a lime wheel on the rim',
  'campari-and-soda':
    'A vintage watercolour illustration of a Campari and Soda served in a tall highball glass filled with vivid crimson-red liquid, visible ice and rising bubbles, garnished with an orange slice among the ice',
  'champs-elysees':
    'A vintage watercolour illustration of a Champs-Élysées cocktail served in a coupe glass filled with cloudy pale gold liquid with no ice, garnished with a small twist of lemon peel on the rim',
  chrysanthemum:
    'A vintage watercolour illustration of a Chrysanthemum cocktail served in a coupe glass filled with pale golden-honey liquid with no ice, garnished with a twist of orange peel resting on the surface',
  coquito:
    'A vintage watercolour illustration of a Coquito served in a small footed cut-glass cup, filled with opaque cream-white liquid dusted with grated cinnamon and nutmeg across the surface',
  'corpse-reviver-no-1':
    'A vintage watercolour illustration of a Corpse Reviver No. 1 served in a coupe glass filled with deep amber-brown liquid with no ice and no garnish',
  'corpse-reviver-no-2':
    'A vintage watercolour illustration of a Corpse Reviver No. 2 served in a coupe glass filled with pale cloudy lemon-yellow liquid with no ice, garnished with a twist of lemon peel on the rim',
  daiquiri:
    'A vintage watercolour illustration of a Daiquiri served in a coupe glass filled with pale cloudy straw-yellow liquid with no ice, garnished with a lime wheel on the rim',
  'death-in-the-afternoon':
    'A vintage watercolour illustration of a Death in the Afternoon served in a champagne flute filled with cloudy pale green-gold liquid, fine bubbles rising through it, with no garnish',
  'el-presidente':
    'A vintage watercolour illustration of an El Presidente served in a cut-glass coupe filled with pale rose-amber liquid with no ice, garnished with a long twist of orange peel over the rim',
  'espresso-martini':
    'A vintage watercolour illustration of an Espresso Martini served in a martini glass filled with dark coffee-brown liquid beneath a pale crema head, garnished with three coffee beans on the foam',
  'french-75':
    'A vintage watercolour illustration of a French 75 served in a champagne flute filled with pale gold liquid and fine rising bubbles, garnished with a long twist of lemon peel over the rim',
  gibson:
    'A vintage watercolour illustration of a Gibson served in a stemmed cocktail glass filled with clear colourless liquid with no ice, garnished with two pearl-white cocktail onions on a pick across the rim',
  'gin-rickey':
    'A vintage watercolour illustration of a Gin Rickey served in a tall highball glass filled with clear sparkling liquid and packed ice cubes, garnished with lime wheels among the ice and on the rim',
  'gin-sling':
    'A vintage watercolour illustration of a Gin Sling served in a tall glass filled with cloudy pale gold liquid and visible ice cubes, dusted with grated nutmeg and garnished with a lemon wheel on the rim',
  'honey-sour':
    'A vintage watercolour illustration of a Honey Sour served in a rocks glass filled with warm golden-amber liquid over a single large ice cube, garnished with a twist of lemon peel on the rim',
  'hot-buttered-rum':
    'A vintage watercolour illustration of a Hot Buttered Rum served in a footed glass mug with a handle, filled with steaming caramel-brown liquid topped with melting cream and grated spice, a cinnamon stick standing in the glass',
  hurricane:
    'A vintage watercolour illustration of a Hurricane served in a footed hurricane glass filled with deep red-pink liquid and visible ice, garnished with an orange slice and a maraschino cherry on a pick across the rim',
  'jack-rose':
    'A vintage watercolour illustration of a Jack Rose served in a coupe glass filled with clear rose-pink liquid with no ice, garnished with a long twist of lemon peel over the rim',
  'japanese-cocktail':
    'A vintage watercolour illustration of a Japanese Cocktail served in a coupe glass filled with warm golden-amber liquid with no ice, garnished with a twist of lemon peel over the rim',
  'jerry-can-julep':
    'A vintage watercolour illustration of a Jerry Can Julep served in a frosted silver julep cup packed with crushed ice, garnished with a generous bouquet of fresh mint and a metal straw',
  'la-louisiane':
    'A vintage watercolour illustration of a La Louisiane served in a coupe glass filled with deep garnet-red liquid with no ice and no garnish',
  'last-word':
    'A vintage watercolour illustration of a Last Word served in a coupe glass filled with pale green-gold liquid with no ice, garnished with a maraschino cherry on a pick across the rim',
  manhattan:
    'A vintage watercolour illustration of a Manhattan served in a coupe glass filled with deep russet-red liquid with no ice and no garnish',
  margarita:
    'A vintage watercolour illustration of a Margarita served in a margarita glass with a coarse salt rim, filled with pale cloudy green liquid, garnished with a lime wheel on the rim',
  martinez:
    'A vintage watercolour illustration of a Martinez served in a coupe glass filled with warm golden-amber liquid with no ice, garnished with a twist of orange peel and a cherry in the bowl',
  'martini-gin':
    'A vintage watercolour illustration of a gin Martini served in a martini glass filled with clear colourless liquid with no ice, garnished with two green olives on a pick resting in the bowl',
  'mint-julep':
    'A vintage watercolour illustration of a Mint Julep served in a frosted silver julep cup heaped with crushed ice, garnished with a tall bouquet of fresh mint',
  mojito:
    'A vintage watercolour illustration of a Mojito served in a tall glass filled with pale green liquid, ice cubes and muddled mint leaves visible through the glass, garnished with a large bouquet of fresh mint',
  negroni:
    'A vintage watercolour illustration of a Negroni served in a rocks glass filled with deep crimson-red liquid over large ice cubes, garnished with an orange slice tucked against the rim',
  'old-fashioned':
    'A vintage watercolour illustration of an Old Fashioned served in a rocks glass filled with rich amber-gold liquid over large ice cubes, garnished with a twist of orange peel on the rim',
  painkiller:
    'A vintage watercolour illustration of a Painkiller served in a carved wooden tiki mug filled with pale creamy liquid over crushed ice, dusted with grated nutmeg and garnished with a pineapple wedge',
  paloma:
    'A vintage watercolour illustration of a Paloma served in a tall glass with a salted rim, filled with pale pink grapefruit liquid and packed ice cubes, garnished with a grapefruit wedge on the rim',
  'paper-plane':
    'A vintage watercolour illustration of a Paper Plane served in a coupe glass filled with burnt-orange liquid with no ice and no garnish',
  penicillin:
    'A vintage watercolour illustration of a Penicillin served in a rocks glass filled with golden-amber liquid over ice, garnished with two pieces of candied ginger on a pick across the rim',
  'pink-gin':
    'A vintage watercolour illustration of a Pink Gin served in a coupe glass filled with pale blush-pink liquid with no ice, garnished with a small twist of lemon peel on the rim',
  'planters-punch':
    "A vintage watercolour illustration of a Planter's Punch served in a tall glass filled with amber-orange liquid and crushed ice, dusted with grated nutmeg and garnished with an orange slice, a maraschino cherry and a sprig of mint",
  'ramos-gin-fizz':
    'A vintage watercolour illustration of a Ramos Gin Fizz served in a tall narrow glass filled with opaque cream-white liquid beneath a towering dome of stiff white foam rising well above the rim, with no garnish',
  'rob-roy':
    'A vintage watercolour illustration of a Rob Roy served in a coupe glass filled with deep amber-brown liquid with no ice and no garnish',
  'rum-runner':
    'A vintage watercolour illustration of a Rum Runner served in a footed hurricane glass filled with liquid graduating from deep purple-red at the base to amber at the top over ice, garnished with a pineapple wedge, an orange slice and a maraschino cherry',
  sazerac:
    'A vintage watercolour illustration of a Sazerac served in a short rocks glass filled with deep amber liquid with no ice and no garnish in the glass, a coiled strip of lemon peel resting beside it',
  scorpion:
    'A vintage watercolour illustration of a Scorpion served in a carved wooden tiki mug heaped with crushed ice, garnished with an orange slice and a sprig of fresh mint',
  'sherry-cobbler':
    'A vintage watercolour illustration of a Sherry Cobbler served in a stemmed goblet filled with deep amber liquid and packed crushed ice, garnished with an orange slice, berries and a sprig of mint, with a straw standing in the glass',
  'sherry-martini':
    'A vintage watercolour illustration of a Sherry Martini served in a coupe glass filled with pale straw-gold liquid with no ice, garnished with a twist of orange peel over the rim',
  sidecar:
    'A vintage watercolour illustration of a Sidecar served in a coupe glass with a sugared rim, filled with pale golden-amber liquid with no ice, garnished with a twist of orange peel on the rim',
  'singapore-sling':
    'A vintage watercolour illustration of a Singapore Sling served in a footed hurricane glass filled with coral-pink liquid and visible ice, garnished with a pineapple wedge and a maraschino cherry on a pick across the rim',
  'spiced-rum-mule':
    'A vintage watercolour illustration of a Spiced Rum Mule served in a hammered copper mug packed with ice, garnished with a lime wedge and a generous sprig of fresh mint',
  'storm-and-spice':
    'A vintage watercolour illustration of a Storm & Spice served in a tall glass filled with dark amber-brown liquid over ice, paler at the base where the ginger beer sits, garnished with a lime wedge on the rim',
  'expedition-punch':
    'A vintage watercolour illustration of The Expedition Punch served in a rocks glass filled with golden-amber liquid and large ice cubes, garnished with a dried orange wheel, a sprig of mint and a cinnamon stick',
  'the-old-standard-rum-old-fashioned':
    'A vintage watercolour illustration of The Old Standard served in a rocks glass filled with deep amber liquid over a large clear ice cube, garnished with a twist of orange peel on the rim',
  'tiki-sour':
    'A vintage watercolour illustration of a Tiki Sour served in a coupe glass filled with pale golden liquid beneath a smooth cap of white foam, decorated with a spiral pattern of bitters dots across the surface',
  'tom-collins':
    'A vintage watercolour illustration of a Tom Collins served in a tall glass filled with pale lemon-gold liquid and packed ice cubes, garnished with a lemon wheel and a maraschino cherry on a pick',
  'trinidad-sour':
    'A vintage watercolour illustration of a Trinidad Sour served in a coupe glass filled with opaque deep mahogany-red liquid with no ice, garnished with a twist of lemon peel on the rim',
  'tropical-punch':
    'A vintage watercolour illustration of a Tropical Punch served in a large cut-glass punch bowl filled with golden-amber liquid, a block of ice and floating orange slices, lime wheels and pineapple wedges, with a ladle resting in the bowl',
  vesper:
    'A vintage watercolour illustration of a Vesper served in a martini glass filled with pale straw-gold liquid with no ice, garnished with a long twist of lemon peel over the rim',
  'vietnamese-iced-coffee-cocktail':
    'A vintage watercolour illustration of a Vietnamese Iced Coffee cocktail served in a tall glass filled with dark coffee-brown liquid over ice, swirls of condensed milk marbling through it, garnished with coffee beans on the surface',
  'vietnamese-iced-coffee-non-alcoholic':
    'A vintage watercolour illustration of a non-alcoholic Vietnamese Iced Coffee served in a tall glass, dark coffee filling the upper half over ice above a pale layer of condensed milk settling at the base',
  'vieux-carre':
    'A vintage watercolour illustration of a Vieux Carré served in a cut-glass rocks glass filled with deep amber-brown liquid over large ice cubes, garnished with a twist of lemon peel on the rim',
  'ward-eight':
    'A vintage watercolour illustration of a Ward Eight served in a coupe glass filled with clear coral-pink liquid with no ice, garnished with an orange slice and a maraschino cherry on a pick across the rim',
  'whiskey-highball':
    'A vintage watercolour illustration of a Whiskey Highball served in a tall glass filled with pale gold liquid and packed ice cubes, garnished with a twist of lemon peel on the rim',
  'whiskey-sour':
    'A vintage watercolour illustration of a Whiskey Sour served in a rocks glass filled with golden-amber liquid and ice cubes beneath a thick cap of white foam, dotted with bitters and garnished with an orange slice and a cherry on a pick',
  'white-lady':
    'A vintage watercolour illustration of a White Lady served in a coupe glass filled with pale cream-white liquid beneath a smooth layer of foam, garnished with a twist of lemon peel on the rim',
  'yellow-jacket':
    'A vintage watercolour illustration of a Yellow Jacket served in a coupe glass filled with bright golden-yellow liquid with no ice, garnished with a twist of lemon peel on the rim',
}

async function main() {
  const docs = await client.fetch<Array<{ _id: string; name: string; slug: string; alt: string | null }>>(
    // Drafts excluded: the site reads perspective: 'published', and the CLI
    // queries the raw dataset, where a stale draft shares its slug with the
    // document it was drafted from.
    `*[_type == "cocktail" && slug.current in $slugs && !(_id in path("drafts.**"))]{
      _id, name, "slug": slug.current, "alt": image.alt
    }`,
    { slugs: Object.keys(ALT) }
  )

  const found = new Set(docs.map((d) => d.slug))
  const missing = Object.keys(ALT).filter((s) => !found.has(s))
  if (missing.length) throw new Error(`No cocktail with slug: ${missing.join(', ')}`)

  // Two published documents sharing a slug would silently give one of them the
  // other's description, which is worse than no alt text at all.
  const seen = new Set<string>()
  for (const doc of docs) {
    if (seen.has(doc.slug)) throw new Error(`Two documents share the slug "${doc.slug}"`)
    seen.add(doc.slug)
  }

  let written = 0
  for (const doc of docs) {
    const alt = `${ALT[doc.slug]}, ${STYLE}`
    if (doc.alt) {
      console.log(`  ${doc.name}: already has alt text, left alone`)
      continue
    }
    console.log(`  ${doc.name}: ${alt.split(/\s+/).length}w`)
    if (WRITE) {
      await client.patch(doc._id).set({ 'image.alt': alt }).commit()
      written++
    }
  }

  console.log(
    WRITE ? `\nWRITTEN. ${written} of ${docs.length}.` : `\n${docs.length} ready. DRY RUN. Pass --write to execute.`
  )
}

main().catch((e) => {
  console.error(e.message ?? e)
  process.exit(1)
})
