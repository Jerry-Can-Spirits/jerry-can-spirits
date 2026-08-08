/**
 * Remove CMS vocabulary from customer-facing prose.
 *
 * "doc" is a Sanity document. A reader has no idea what one is, so "the
 * calvados doc standing in for the American apple" and "as the fruit's doc
 * insists" say nothing to the person the page is for. MEASURED 8 Aug 2026: 71
 * spans across cocktails and ingredients.
 *
 * These are not word swaps. The corpus had built a whole metaphor system about
 * its own pages earning "chairs", "signatures" and "postings", so most fixes
 * remove the clause and leave the sentence about the drink. That is
 * COCKTAIL_CONTENT_STANDARD section 1: write about the drink, never about the
 * page.
 *
 * Each edit is an exact fragment replacement inside one span, so nothing else
 * in the field can be disturbed. An empty replacement deletes the fragment.
 *
 * CLAUDE.md's copy discipline governs: remove a claim only where deletion
 * leaves a clean, truthful sentence. Nothing here invents a fact, and no
 * ingredient guidance is asserted that the original did not already carry.
 *
 * Dry run by default. Pass --write to execute.
 */
import { getCliClient } from 'sanity/cli'

const client = getCliClient()
const WRITE = process.argv.includes('--write')

interface Edit {
  id: string
  /** Field name for a string, or the span path for portable text. */
  path: string
  find: string
  replace: string
}

const S = '’' // right single quote, as stored

const EDITS: Edit[] = [
  { id: 'cocktail-absinthe-drip', path: 'longDescription[_key=="f3a0164"].children[_key=="f3a0165"]', find: ` The absinthe doc${S}s bottle guidance pours the rest.`, replace: '' },
  { id: 'cocktail-almond-old-fashioned', path: 'description', find: `behind it, the doc${S}s standing rule, replacing`, replace: 'behind it, replacing' },
  { id: 'cocktail-american-trilogy', path: 'description', find: `and the calvados doc standing in for the American apple as it does across the Manual`, replace: 'with calvados standing in for the American apple' },
  { id: 'cocktail-anejo-old-fashioned', path: 'description', find: `The mole bitters, the doc${S}s chocolate-chilli-spice, replace`, replace: 'The mole bitters, chocolate and chilli spice, replace' },
  { id: 'cocktail-anejo-old-fashioned', path: 'longDescription[_key=="off0069"].children[_key=="off0070"]', find: `The doc${S}s ageing ladder is the map.`, replace: 'The ageing ladder is the map.' },
  { id: 'cocktail-anejo-old-fashioned', path: 'longDescription[_key=="off0073"].children[_key=="off0074"]', find: `, the ingredients-phase doc finally at its signature post`, replace: '' },
  { id: 'cocktail-banana-daiquiri', path: 'description', find: `question, as the fruit${S}s doc insists: a`, replace: 'question: a' },
  { id: 'cocktail-banana-daiquiri', path: 'longDescription[_key=="r2a0059"].children[_key=="r2a0060"]', find: `, exactly as the banana and banana liqueur docs describe`, replace: '' },
  { id: 'cocktail-blinker', path: 'note', find: `, and the bottle${S}s doc carries the method`, replace: '' },
  { id: 'cocktail-brandy-milk-punch', path: 'description', find: `not cream, the doc${S}s new page explaining why, with`, replace: 'not cream, with' },
  { id: 'cocktail-brandy-milk-punch', path: 'note', find: `, and the doc${S}s law holds`, replace: '' },
  { id: 'cocktail-east-india-no-2', path: 'longDescription[_key=="f3a0060"].children[_key=="f3a0061"]', find: `, and the fino doc carries both`, replace: '' },
  { id: 'cocktail-eastern-standard', path: 'description', find: `, and the cucumber doc earning its third signature`, replace: '' },
  { id: 'cocktail-eggnog', path: 'description', find: `The build works the egg doc pair in concert: yolks`, replace: 'The build works yolk and white in concert: yolks' },
  { id: 'cocktail-eggnog', path: 'longDescription[_key=="f2a0162"].children[_key=="f2a0163"]', find: `divide the labour as their docs describe: custard`, replace: 'divide the labour: custard' },
  { id: 'cocktail-enzoni', path: 'description', find: `The grapes are the genius the new doc celebrates: juice`, replace: 'The grapes are the genius: juice' },
  { id: 'cocktail-enzoni', path: 'longDescription[_key=="spb0037"].children[_key=="spb0038"]', find: `The grapes doc holds the fruit${S}s laws; white keeps`, replace: 'White keeps' },
  { id: 'cocktail-fish-house-punch', path: 'longDescription[_key=="r2b0239"].children[_key=="r2b0240"]', find: ` The liqueur doc carries the distinction.`, replace: '' },
  { id: 'cocktail-fluffy-duck', path: 'description', find: `, and the new doc holding both their coats`, replace: '' },
  { id: 'cocktail-fluffy-duck', path: 'longDescription[_key=="f2a0236"].children[_key=="f2a0237"]', find: ` The doc${S}s fridge law covers both engagements.`, replace: '' },
  { id: 'cocktail-golden-cadillac', path: 'description', find: `It is the Galliano doc${S}s sweetest chair and its most devoted.`, replace: 'It is Galliano at its sweetest and its most devoted.' },
  { id: 'cocktail-grasshopper', path: 'longDescription[_key=="f2a0188"].children[_key=="f2a0189"]', find: `The menthe doc${S}s colour law works both directions, and this is its green jurisdiction.`, replace: 'Crème de menthe comes green and white, and this is the green one.' },
  { id: 'cocktail-hotel-nacional', path: 'longDescription[_key=="r2b0013"].children[_key=="r2b0014"]', find: ` exactly as the liqueur${S}s doc describes,`, replace: '' },
  { id: 'cocktail-hugo-spritz', path: 'longDescription[_key=="spa0045"].children[_key=="spa0046"]', find: `the spritz-length calibration of the doc${S}s standing rule: floral`, replace: 'the spritz-length calibration: floral' },
  { id: 'cocktail-knickerbocker', path: 'description', find: `The raspberry syrup doc${S}s cold-process bottle is the drink${S}s heart, doing pre-Prohibition work its page already knows.`, replace: `Cold-process raspberry syrup is the drink${S}s heart.` },
  { id: 'cocktail-knickerbocker', path: 'longDescription[_key=="r2b0114"].children[_key=="r2b0115"]', find: `; the doc carries the method`, replace: '' },
  { id: 'cocktail-left-bank-martini', path: 'description', find: `, and the dry-white-wine doc the Kir demanded earning its second pour`, replace: '' },
  { id: 'cocktail-left-hand', path: 'longDescription[_key=="spb0061"].children[_key=="spb0062"]', find: ` The chocolate-bitters doc earns its second Manual chair here after the mole pages.`, replace: '' },
  { id: 'cocktail-lynchburg-lemonade', path: 'longDescription[_key=="w2b0120"].children[_key=="w2b0121"]', find: `: the bourbon doc stands for the family here, with the specific bottle the drink${S}s whole biography`, replace: `, and the specific bottle is the drink${S}s whole biography` },
  { id: 'cocktail-maple-old-fashioned', path: 'description', find: `The maple is the doc${S}s argument in full: dark-grade`, replace: 'The maple is the argument in full: dark-grade' },
  { id: 'cocktail-maple-old-fashioned', path: 'longDescription[_key=="off0092"].children[_key=="off0093"]', find: `The doc${S}s dark-grade law is the whole quality control.`, replace: 'Dark-grade syrup is the whole quality control.' },
  { id: 'cocktail-metropole', path: 'description', find: `, and the Peychaud${S}s doc earning its second chair beyond the Sazerac${S}s shadow`, replace: `, and Peychaud${S}s stepping beyond the Sazerac${S}s shadow` },
  { id: 'cocktail-metropole', path: 'longDescription[_key=="f3a0088"].children[_key=="f3a0089"]', find: `The doc${S}s anise-cherry brightness seasons`, replace: `Peychaud${S}s anise-cherry brightness seasons` },
  { id: 'cocktail-mexican-mule', path: 'longDescription[_key=="a2a0123"].children[_key=="a2a0124"]', find: `The copper doc${S}s frost chemistry serves them all.`, replace: `The copper mug${S}s frost chemistry serves them all.` },
  { id: 'cocktail-michelada', path: 'description', find: `The beer doc${S}s law governs: pale`, replace: 'The beer governs: pale' },
  { id: 'cocktail-michelada', path: 'longDescription[_key=="a2a0096"].children[_key=="a2a0097"]', find: `The sauces split the work as the docs describe, fermented`, replace: 'The sauces split the work, fermented' },
  { id: 'cocktail-michelada', path: 'longDescription[_key=="a2a0100"].children[_key=="a2a0101"]', find: `The lager doc governs absolutely: pale`, replace: 'The lager governs absolutely: pale' },
  { id: 'cocktail-mizuwari', path: 'description', find: `The whisky doc${S}s Japanese bottle takes its signature serve at last: food-friendly`, replace: 'Japanese whisky takes its signature serve here: food-friendly' },
  { id: 'cocktail-mizuwari', path: 'longDescription[_key=="w2b0208"].children[_key=="w2b0209"]', find: `The Japanese whisky doc${S}s delicacy suits`, replace: `Japanese whisky${S}s delicacy suits` },
  { id: 'cocktail-old-friend', path: 'description', find: `, dosed by the doc${S}s strictest discipline`, replace: '' },
  { id: 'cocktail-old-friend', path: 'longDescription[_key=="spb0136"].children[_key=="spb0137"]', find: `is the doc${S}s minimum sanctioned dose and`, replace: 'is the minimum useful dose and' },
  { id: 'cocktail-passion-fruit-daiquiri', path: 'longDescription[_key=="r2a0109"].children[_key=="r2a0110"]', find: ` Both passion fruit docs carry the ripeness and syrup rules.`, replace: '' },
  { id: 'cocktail-passion-fruit-margarita', path: 'note', find: `Wrinkled is ripe, as the fruit${S}s doc insists: the`, replace: 'Wrinkled is ripe: the' },
  { id: 'cocktail-picante-de-la-casa', path: 'description', find: `, the technique the coriander doc now teaches`, replace: '' },
  { id: 'cocktail-picante-de-la-casa', path: 'note', find: `, exactly as the doc teaches`, replace: '' },
  { id: 'cocktail-picante-de-la-casa', path: 'longDescription[_key=="a2a0171"].children[_key=="a2a0172"]', find: `, and the coriander doc carries both the technique and the genetic courtesy: the soap gene`, replace: '. The soap gene' },
  { id: 'cocktail-pisco-sour', path: 'description', find: `it introduces the pisco doc${S}s whole argument in one glass`, replace: `it makes pisco${S}s whole argument in one glass` },
  { id: 'cocktail-pisco-sour', path: 'longDescription[_key=="f2a0046"].children[_key=="f2a0047"]', find: `, and this Manual${S}s pisco doc files it under geography`, replace: '' },
  { id: 'cocktail-port-old-fashioned', path: 'description', find: `The port doc${S}s bottle rules govern the second chair.`, replace: 'Port choice governs the second chair.' },
  { id: 'cocktail-port-old-fashioned', path: 'longDescription[_key=="off0117"].children[_key=="off0118"]', find: `The port doc${S}s shelf guidance governs: a ten-year tawny is the calibration, ruby the wrong brightness.`, replace: 'A ten-year tawny is the calibration; ruby is the wrong brightness.' },
  { id: 'cocktail-raspberry-lynchburg', path: 'description', find: `, and it gives the Chambord doc its second chair beside the French Martini: the bottle${S}s velvet working a porch shift`, replace: `: Chambord${S}s velvet working a porch shift` },
  { id: 'cocktail-reggae-rum-punch', path: 'description', find: `, and it gives the strawberry syrup doc its founding chair: one bottle`, replace: ': one bottle' },
  { id: 'cocktail-reggae-rum-punch', path: 'longDescription[_key=="r2b0188"].children[_key=="r2b0189"]', find: `The overproof doc carries the bottle guidance; the Nuclear Daiquiri shares`, replace: 'The Nuclear Daiquiri shares' },
  { id: 'cocktail-right-hand', path: 'longDescription[_key=="spb0085"].children[_key=="spb0086"]', find: `The aged rum doc${S}s mid-weight oak is the calibration.`, replace: 'Mid-weight oak is the calibration.' },
  { id: 'cocktail-russian-spring-punch', path: 'longDescription[_key=="f3a0109"].children[_key=="f3a0110"]', find: `the cassis doc${S}s Dijon dark doing`, replace: `cassis${S}s Dijon dark doing` },
  { id: 'cocktail-sangria', path: 'description', find: `the red wine doc${S}s honest bottle as the body`, replace: 'an honest bottle of red as the body' },
  { id: 'cocktail-sangria', path: 'longDescription[_key=="f3a0142"].children[_key=="f3a0143"]', find: `The wine doc${S}s working-bottle law keeps the economics honest.`, replace: 'A working bottle keeps the economics honest.' },
  { id: 'cocktail-sgroppino', path: 'longDescription[_key=="spa0119"].children[_key=="spa0120"]', find: `follow the sorbet doc${S}s note`, replace: 'follow the same rule' },
  { id: 'cocktail-shaft', path: 'longDescription[_key=="f3b0170"].children[_key=="f3b0171"]', find: `, with the coffee doc${S}s freshness law applying cold`, replace: ', with the freshness rule applying cold' },
  { id: 'cocktail-slow-comfortable-screw-against-the-wall', path: 'longDescription[_key=="f3b0143"].children[_key=="f3b0144"]', find: `Four of this Manual${S}s pages, the Screwdriver, Wallbanger, Sloe Gin Fizz and now the SoCo doc, condense into the glass.`, replace: 'Four drinks condense into the glass: the Screwdriver, the Wallbanger, the Sloe Gin Fizz and Southern Comfort itself.' },
  { id: 'cocktail-snowball', path: 'longDescription[_key=="f2a0260"].children[_key=="f2a0261"]', find: `The advocaat doc${S}s fridge law covers the fortnight`, replace: 'The same fridge rule covers the fortnight' },
  { id: 'cocktail-strawberry-daiquiri', path: 'longDescription[_key=="r2a0082"].children[_key=="r2a0083"]', find: `The fresh strawberry doc carries the selection rules; the freezer`, replace: 'The freezer' },
  { id: 'cocktail-tipperary', path: 'longDescription[_key=="w2a0178"].children[_key=="w2a0179"]', find: `The whiskey-irish doc calls the spirit the family${S}s diplomat, and`, replace: `Irish whiskey is the family${S}s diplomat, and` },
  { id: 'cocktail-tomatini', path: 'description', find: `It earns the fresh-tomato page its doc and the savoury shelf its elegance: proof`, replace: 'It gives the savoury shelf its elegance: proof' },
  { id: 'cocktail-tomatini', path: 'longDescription[_key=="gc30166"].children[_key=="gc30167"]', find: `The cherry tomato doc carries the produce rules: ripe`, replace: 'The produce rules are simple: ripe' },
  { id: 'cocktail-watermelon-martini', path: 'description', find: `The watermelon doc${S}s season rules decide everything: an`, replace: 'Season decides everything: an' },
  { id: 'cocktail-watermelon-martini', path: 'longDescription[_key=="gc30189"].children[_key=="gc30190"]', find: ` The watermelon doc carries the selection rules.`, replace: '' },
  { id: 'cocktail-whisky-mac', path: 'description', find: `, and the new ginger wine doc earning its keep at the first cold snap`, replace: ', and green ginger wine earning its keep at the first cold snap' },
  { id: 'ingredient-ginger-wine', path: 'longDescription[_key=="w2b0003"].children[_key=="w2b0004"]', find: ` and the doc next door carries it`, replace: '' },
  { id: 'ingredient-hot-sauce', path: 'longDescription[_key=="a2a0016"].children[_key=="a2a0017"]', find: `the jalapeño doc covers fresh heat`, replace: 'jalapeño covers fresh heat' },
  { id: 'ingredient-milk', path: 'longDescription[_key=="f2a0028"].children[_key=="f2a0029"]', find: `the humblest doc in the catalogue`, replace: 'the humblest ingredient in the catalogue' },

  // Second occurrences inside spans already listed above. The extractor
  // reported one match per span, so these two survived the first run and were
  // caught by re-running the audit rather than by a reader.
  { id: 'cocktail-brandy-milk-punch', path: 'description', find: `, and it gives the milk doc its founding chair: three centuries`, replace: ': three centuries' },
  { id: 'cocktail-picante-de-la-casa', path: 'description', find: `The herb${S}s genetics get asked first, per the same doc.`, replace: `The herb${S}s genetics get asked first.` },
]

/**
 * Read the current text at a span path.
 *
 * The [0] unwrapping matters. In GROQ, `longDescription[_key=="x"]` is a
 * FILTER and returns an array, so `.text` on it resolves to nothing and every
 * portable-text lookup silently reported "fragment not found" — 41 of them,
 * which looked exactly like 41 bad fragments rather than one bad query. Sanity
 * PATCH paths use the same filter syntax and do not need unwrapping, so only
 * the read was wrong.
 */
async function currentText(id: string, path: string): Promise<string | null> {
  if (!path.startsWith('longDescription')) {
    return client.fetch<string | null>(`*[_id == $id][0].${path}`, { id })
  }
  const readPath = path.replace(/\]/g, '][0]') + '.text'
  return client.fetch<string | null>(`*[_id == $id][0].${readPath}`, { id })
}

async function main() {
  let ok = 0
  let missed = 0
  let done = 0

  for (const e of EDITS) {
    const text = await currentText(e.id, e.path)
    if (text == null) {
      missed++
      console.log(`\nMISS  ${e.id}  ${e.path}\n      path resolved to nothing`)
      continue
    }
    if (!text.includes(e.find)) {
      // Re-running is normal: this script was run once, two second-occurrence
      // edits were added, and it was run again. An edit whose replacement is
      // already present is DONE, not broken, and saying so is the difference
      // between a clean re-run and 71 alarming lines.
      // For a deletion the fragment being absent IS the success condition, so
      // there is nothing else to look for.
      const already = e.replace === '' || text.includes(e.replace)
      if (already) {
        done++
        continue
      }
      missed++
      console.log(`\nMISS  ${e.id}  ${e.path}\n      fragment not found: "${e.find}"`)
      continue
    }
    const next = text.replace(e.find, e.replace).replace(/\s{2,}/g, ' ').trim()
    ok++
    console.log(`\nOK    ${e.id}  ${e.path}`)
    console.log(`  --  ${text.slice(0, 240)}`)
    console.log(`  ++  ${next.slice(0, 240)}`)

    if (WRITE) {
      const setPath = e.path.startsWith('longDescription') ? `${e.path}.text` : e.path
      await client.patch(e.id).set({ [setPath]: next }).commit()
    }
  }

  console.log(`\n\n${ok} edits to apply, ${done} already applied, ${missed} could not be located.`)
  console.log(WRITE ? 'WRITTEN.' : 'DRY RUN. Nothing written. Pass --write to execute.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
