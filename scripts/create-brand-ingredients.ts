/**
 * Brand ingredient pages for the drinks whose specifications name a producer.
 *
 * Gosling's Black Seal already had one and is the model this follows. These
 * three exist for the same reason: the drink cannot legally or honestly be
 * made with anything else, so the bottle deserves a page that says why.
 *
 *   Pusser's Rum          the Painkiller is a Pusser's trademark
 *   Bacardi Carta Blanca  a 1936 New York ruling names Bacardi
 *   Jack Daniel's         the Lynchburg drinks are the distillery's own serves
 *
 * Also links the cocktail ingredientRefs to them, which is the point: the
 * Painkiller currently points its rum line at the generic Dark Rum guide.
 *
 * History is hedged where the record is thin, per section 8 of the content
 * standard. The Nearest Green account rests on well-documented recent research
 * and the company's own acknowledgement, and is stated as that rather than as
 * settled fact from 1866.
 *
 * Dry run by default. Pass --write to execute.
 */
import { getCliClient } from 'sanity/cli'

const client = getCliClient()
const WRITE = process.argv.includes('--write')

interface Brand {
  id: string
  name: string
  slug: string
  abv: string
  origin: string
  description: string
  productionMethod: string
  usage: string
  storage: string
  tasting: string
  strength: string
  primary: string[]
  keywords: string[]
  topTips: string[]
  substitutions: string[]
  metaTitle: string
  metaDescription: string
  paragraphs: string[]
  faqs: Array<[string, string]>
  /** Cocktail name -> the ingredient line to repoint at this page. */
  linkFrom: Array<[string, string]>
}

const BRANDS: Brand[] = [
  {
    id: 'ingredient-pussers-rum',
    name: "Pusser's Rum",
    slug: 'pussers-rum',
    abv: '40% to 54.5% depending on expression',
    origin: 'Caribbean, from the Royal Navy blend',
    description:
      "The Royal Navy's rum, bottled to the Admiralty blend, and the only spirit that can legally make a Painkiller.",
    productionMethod:
      'A blend in the style issued to the Royal Navy for three centuries: pot-still rum from the Caribbean, aged in oak, with no sugar or flavouring added after distillation. Bottled at standard strength and at the higher Gunpowder Proof that recalls the strength a sailor could test against gunpowder.',
    usage:
      'The Painkiller first, where the trademark requires it. Beyond that it is a heavy, characterful rum for tiki drinks that need weight, for punches where a lighter rum would disappear, and anywhere a recipe calls for a Navy rum and means it.',
    storage: 'Upright, away from light. Indefinite once opened.',
    tasting:
      'Dense and dry for a dark rum: molasses and oak with a woody, faintly medicinal edge that comes from the pot still rather than from sugar.',
    strength: 'strong',
    primary: ['Molasses', 'Oak', 'Dried Fruit'],
    keywords: [
      'pussers rum',
      'painkiller cocktail rum',
      'royal navy rum',
      'navy rum ration',
      'pussers gunpowder proof',
    ],
    topTips: [
      'The Painkiller trademark names Pusser\'s specifically, so a version built on another rum is a different drink under a different name.',
      'Gunpowder Proof at 54.5% is worth having for punches, where the extra strength survives dilution that flattens a standard bottling.',
      'It is drier than most dark rums, so recipes written for a sweeter bottle may need a touch more syrup rather than less.',
    ],
    substitutions: [
      'For a Painkiller there is no substitution: the name is trademarked to this rum.',
      'In other drinks, a dark pot-still rum of similar weight gets closest, though most are sweeter.',
    ],
    metaTitle: "Pusser's Rum: the Navy's Ration and the Painkiller",
    metaDescription:
      "The Royal Navy's rum blend, the end of the daily tot in 1970, and why the Painkiller is a trademark rather than a recipe.",
    paragraphs: [
      "Pusser is naval slang for the purser, the officer who ran a ship's stores, and the rum took the nickname of the man who issued it. The Royal Navy served a daily rum ration for something over three centuries, and ended it on 31 July 1970, a date the fleet marked as Black Tot Day. Sailors wore black armbands. Some held burials at sea for the tot.",
      "Pusser's Rum was established in 1979 to bottle the Admiralty blend commercially, and pays a royalty to a Royal Navy sailors' charity, which is an unusually direct line between a bottle on a shelf and the institution that made it famous. The blend is pot-still and unsweetened, which is why it reads drier and woodier than most dark rums of comparable colour.",
      "The Painkiller is generally credited to the Soggy Dollar Bar on Jost Van Dyke in the British Virgin Islands, so named because there is no dock and customers swim ashore. Pusser's registered the name as a trademark and has enforced it, most visibly against a New York bar trading under the same name in 2011. The upshot is the same as with the Dark 'n' Stormy: the drink is a specification rather than a suggestion, and made with anything else it is a good rum punch with a different name.",
    ],
    faqs: [
      [
        'Why must a Painkiller use Pusser\'s?',
        "Because the name is a registered trademark held by Pusser's and the company has enforced it in court. The cocktail is defined as their rum with pineapple, orange and cream of coconut. Built on another rum it is a fine drink and not a Painkiller.",
      ],
      [
        'What was the Navy rum ration?',
        'A daily measure issued to Royal Navy sailors for roughly three centuries, ended on 31 July 1970. The fleet called that day Black Tot Day, and it was marked with black armbands and, on some ships, mock burials at sea for the last tot.',
      ],
      [
        'What is Gunpowder Proof?',
        "The higher-strength bottling at 54.5%, named for the old test in which rum was poured on gunpowder and lit: if it burned, the spirit was strong enough not to have been watered. Useful in punches, where standard strength dilutes away.",
      ],
    ],
    linkFrom: [['Painkiller', "Pusser's Rum"]],
  },
  {
    id: 'ingredient-bacardi-carta-blanca',
    name: 'Bacardi Carta Blanca',
    slug: 'bacardi-carta-blanca',
    abv: '37.5%',
    origin: 'Cuba originally, since 1862',
    description:
      'The rum that invented the light style, and the only one a court has ever ruled a cocktail must contain.',
    productionMethod:
      'Column-distilled and charcoal-filtered to strip colour and heavy congeners, then briefly aged and filtered again. The method was unusual in 1862, when most rum was heavy and dark, and it created the clean light style that the daiquiri and the mojito were built on.',
    usage:
      'The Bacardi Cocktail, where a court ruling requires it. Otherwise it behaves as the reference light rum: daiquiris, mojitos, highballs and any recipe that says white rum without naming one, since this is largely the bottle those recipes were written against.',
    storage: 'Upright, away from light. Indefinite once opened.',
    tasting:
      'Light and clean with faint vanilla and almond, and very little of the molasses weight most people expect from rum.',
    strength: 'medium',
    primary: ['Vanilla', 'Almond', 'Light Cane'],
    keywords: [
      'bacardi carta blanca',
      'bacardi cocktail ruling',
      'white rum daiquiri',
      'light rum cocktails',
      'bacardi superior',
    ],
    topTips: [
      'The Bacardi Cocktail is legally required to contain Bacardi rum, following a 1936 New York Supreme Court ruling, which makes it the most narrowly specified drink in the canon.',
      'It is lighter than most modern white rums, so a daiquiri built on it wants slightly less syrup than one built on a fuller bottle.',
      'Serve it cold. The lightness that makes it versatile also means a warm pour tastes of very little.',
    ],
    substitutions: [
      'For a Bacardi Cocktail there is no substitution: a court has said so.',
      'In other drinks, any clean column-distilled white rum sits close, though most carry a little more body.',
    ],
    metaTitle: 'Bacardi Carta Blanca: the Rum a Court Made Compulsory',
    metaDescription:
      'The light rum style that made the daiquiri possible, and the 1936 ruling that a Bacardi Cocktail must be made with Bacardi.',
    paragraphs: [
      'Facundo Bacardí Massó began distilling in Santiago de Cuba in 1862, and the innovation was filtration. Charcoal-filtering the spirit stripped out the heavy congeners that made rum taste of molasses and ship, leaving something light and clean that mixed in ways heavy rum could not. The daiquiri and the mojito are drinks that light rum made possible.',
      "American Prohibition did the rest. With bars closed at home, Havana became the place to drink, and Bacardi was what people drank there. The bottle went from Cuban to internationally famous in roughly a decade, on the strength of Americans travelling ninety miles to have a cocktail legally.",
      'The legal footnote is the strangest in cocktail history. In 1936 the New York Supreme Court held that a drink sold as a Bacardi Cocktail had to be made with Bacardi rum, after bars had taken to using cheaper substitutes. It remains the only cocktail whose composition has been settled by a court, which is a peculiar sort of immortality for a mixture of rum, lime and grenadine.',
    ],
    faqs: [
      [
        'Is a Bacardi Cocktail legally required to use Bacardi?',
        'In New York, effectively yes. A 1936 New York Supreme Court ruling held that a drink sold under that name must be made with Bacardi rum, after bars substituted cheaper spirits. It is the only cocktail whose recipe has been settled in court.',
      ],
      [
        'How is it different from other white rums?',
        'It is lighter. Charcoal filtration strips the heavy congeners that give most rum its molasses weight, which is what the style was invented to do in 1862. Expect vanilla and almond rather than the richness of a pot-still rum.',
      ],
      [
        'What else should I make with it?',
        'It is the reference bottle for the light-rum canon: daiquiris, mojitos and highballs. Most recipes that call for white rum without naming one were written against this style, so it is a safe default rather than a compromise.',
      ],
    ],
    linkFrom: [['Bacardi Cocktail', 'Bacardi Carta Blanca']],
  },
  {
    id: 'ingredient-jack-daniels',
    name: "Jack Daniel's Tennessee Whiskey",
    slug: 'jack-daniels-tennessee-whiskey',
    abv: '40%',
    origin: 'Lynchburg, Tennessee',
    description:
      'Charcoal-mellowed before the barrel, which is what makes it Tennessee whiskey rather than bourbon.',
    productionMethod:
      'A corn-led mash distilled and then filtered slowly through several feet of sugar-maple charcoal before it goes into new charred oak. That filtering step, the Lincoln County Process, is what separates Tennessee whiskey from bourbon, and it strips a measure of the sharper grain character before ageing begins.',
    usage:
      'The Lynchburg Lemonade and the distillery\'s other published serves. More broadly it suits long drinks and anything with citrus or cola, where its softness is an advantage; in a stirred drink it can read a little sweet against a spicier rye.',
    storage: 'Upright, away from light. Indefinite once opened.',
    tasting:
      'Soft and sweet for an American whiskey: banana, vanilla and toasted oak, with the sharper grain edge filtered away before ageing.',
    strength: 'medium',
    primary: ['Vanilla', 'Banana', 'Toasted Oak'],
    keywords: [
      'jack daniels tennessee whiskey',
      'lincoln county process',
      'tennessee whiskey vs bourbon',
      'lynchburg lemonade whiskey',
      'nearest green',
    ],
    topTips: [
      'It is not bourbon, and the difference is the charcoal filtering before barrelling rather than anything about the mash bill.',
      'The softness suits long drinks. In an Old Fashioned it can read sweet, and a spicier rye usually serves that frame better.',
      'Lynchburg sits in a dry county, so the distillery cannot sell a drink of its own whiskey on site.',
    ],
    substitutions: [
      'Another Tennessee whiskey is the closest match, since the charcoal filtering is the defining step.',
      'A wheated bourbon is the nearest bourbon in softness, though it will taste sweeter and less of banana.',
    ],
    metaTitle: "Jack Daniel's: Charcoal, Lynchburg and Nearest Green",
    metaDescription:
      'Why Tennessee whiskey is not bourbon, what the Lincoln County Process does, and the distiller the company spent a century not naming.',
    paragraphs: [
      'The difference between Tennessee whiskey and bourbon is one step. Before the spirit goes into the barrel it is filtered slowly through several feet of sugar-maple charcoal, a process named for Lincoln County where the distillery originally sat. It removes some of the sharper grain notes, which is why the whiskey arrives softer and sweeter than a bourbon of similar age.',
      "Jasper Newton Daniel registered the distillery at Lynchburg, and the town has been the address ever since. Moore County has been dry since Prohibition and remains so, which produces the standing oddity that the distillery cannot sell a drink of its own whiskey to a visitor on the premises.",
      "For most of its history the company told the story with one man in it. Recent research, and the company's own acknowledgement of it, credits Nathan \"Nearest\" Green, an enslaved man who taught Daniel to distil and who is now recognised as the first known African-American master distiller. The charcoal-filtering method he worked with has West African precedent. It is a better story than the one it replaced, and a good reminder that the received version of a drink's history is often the version somebody chose to keep.",
    ],
    faqs: [
      [
        'Is Jack Daniel\'s a bourbon?',
        'It meets most of the legal requirements for bourbon but is sold as Tennessee whiskey, because of one extra step: the spirit is filtered through sugar-maple charcoal before barrelling. That filtering, the Lincoln County Process, is the defining difference.',
      ],
      [
        'What does the charcoal filtering actually do?',
        'It strips some of the sharper grain congeners before ageing, which is why the whiskey reads softer and sweeter than a comparable bourbon. The effect is on texture and edge as much as on flavour, and it happens before the barrel rather than after.',
      ],
      [
        'Who was Nearest Green?',
        'An enslaved man who taught Jasper Newton Daniel to distil, now recognised as the first known African-American master distiller. Recent research and the company\'s own acknowledgement have restored him to the account after a century of tellings that left him out.',
      ],
    ],
    linkFrom: [
      ['Lynchburg Lemonade', 'Tennessee Whiskey'],
      ['Raspberry Lynchburg', 'Tennessee Whiskey'],
      ['Jack’s Godfather Highball', 'Tennessee Whiskey'],
    ],
  },
]

const key = (slug: string, p: string, i: number) => `${slug.replace(/[^a-z]/g, '').slice(0, 10)}${p}${i}`

async function main() {
  for (const b of BRANDS) {
    const existing = await client.fetch<{ _id: string } | null>(`*[_id == $id][0]{ _id }`, { id: b.id })
    console.log(`\n${b.name}  (${b.id})  ${existing ? 'EXISTS, will be replaced' : 'NEW'}`)
    console.log(`  ${b.paragraphs.reduce((n, p) => n + p.split(/\s+/).length, 0)} words of long description, ${b.faqs.length} FAQs`)

    const doc = {
      _id: b.id,
      _type: 'ingredient',
      name: b.name,
      slug: { _type: 'slug', current: b.slug },
      category: 'spirits',
      abv: b.abv,
      origin: b.origin,
      description: b.description,
      productionMethod: b.productionMethod,
      usage: b.usage,
      storage: b.storage,
      topTips: b.topTips,
      substitutions: b.substitutions,
      keywords: b.keywords,
      metaTitle: b.metaTitle,
      metaDescription: b.metaDescription,
      flavorProfile: { primary: b.primary, strength: b.strength, tasting: b.tasting },
      longDescription: b.paragraphs.map((text, i) => ({
        _key: key(b.slug, 'b', i),
        _type: 'block',
        style: 'normal',
        markDefs: [],
        children: [{ _key: key(b.slug, 's', i), _type: 'span', text, marks: [] }],
      })),
      faqs: b.faqs.map(([question, answer], i) => ({
        _key: key(b.slug, 'f', i),
        _type: 'faq',
        question,
        answer,
      })),
    }

    if (WRITE) await client.createOrReplace(doc)

    for (const [cocktailName, ingredientName] of b.linkFrom) {
      const c = await client.fetch<{ _id: string; ingredients: Array<{ _key: string; name: string }> } | null>(
        `*[_type == "cocktail" && name == $n][0]{ _id, ingredients[]{ _key, name } }`,
        { n: cocktailName }
      )
      if (!c) {
        console.log(`    ! ${cocktailName} not found`)
        continue
      }
      const line = c.ingredients?.find((i) => i.name === ingredientName)
      if (!line) {
        console.log(`    ! ${cocktailName}: no line named "${ingredientName}" (has: ${c.ingredients?.map((i) => i.name).join(', ')})`)
        continue
      }
      console.log(`    link  ${cocktailName} / ${ingredientName}  ->  ${b.name}`)
      if (WRITE) {
        await client
          .patch(c._id)
          .set({ [`ingredients[_key=="${line._key}"].ingredientRef`]: { _type: 'reference', _ref: b.id } })
          .commit()
      }
    }
  }

  console.log(WRITE ? '\nWRITTEN.' : '\nDRY RUN. Nothing written. Pass --write to execute.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
