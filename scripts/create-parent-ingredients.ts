/**
 * Create the approved parent ingredient guides.
 *
 * These are the missing top of a hierarchy that already had its children: 43
 * sub-type pages existed with no parent to link up to, so a reader landing on
 * "bourbon guide" had nowhere to go and searches for "what is whisky" landed
 * nowhere at all.
 *
 * Content is as signed off, field by field. Idempotent: an existing document
 * with the same slug is left alone and reported rather than duplicated.
 *
 * Run: npx sanity exec scripts/create-parent-ingredients.ts --with-user-token
 */
import { getCliClient } from 'sanity/cli'

const client = getCliClient()

let keySeed = 0
const key = () => `pg${(keySeed++).toString(36).padStart(4, '0')}`

/** A normal portable-text paragraph. */
const p = (text: string) => ({
  _type: 'block',
  _key: key(),
  style: 'normal',
  markDefs: [],
  children: [{ _type: 'span', _key: key(), text, marks: [] }],
})

/** An h3 section heading. */
const h3 = (text: string) => ({
  _type: 'block',
  _key: key(),
  style: 'h3',
  markDefs: [],
  children: [{ _type: 'span', _key: key(), text, marks: [] }],
})

const faq = (question: string, answer: string) => ({ _key: key(), question, answer })

/** A paragraph carrying an internal link. Used for the routing block on /rum/. */
const linkP = (before: string, linkText: string, href: string) => {
  const defKey = key()
  return {
    _type: 'block',
    _key: key(),
    style: 'normal',
    markDefs: [{ _type: 'link', _key: defKey, href }],
    children: [
      ...(before ? [{ _type: 'span', _key: key(), text: before, marks: [] }] : []),
      { _type: 'span', _key: key(), text: linkText, marks: [defKey] },
    ],
  }
}

interface Doc {
  slug: string
  name: string
  category: string
  metaTitle: string
  metaDescription: string
  description: string
  usage: string
  topTips: string[]
  abv?: string
  origin?: string
  longDescription: Array<ReturnType<typeof p> | ReturnType<typeof linkP>>
  faqs: ReturnType<typeof faq>[]
}

const DOCS: Doc[] = [
  {
    slug: 'whisky',
    name: 'Whisky',
    category: 'spirits',
    metaTitle: 'Whisky Guide: One Spirit, Two Spellings',
    metaDescription:
      'Whiskey with an e is Irish or American. Whisky without it is Scotch, Japanese or Welsh. What the styles share, and which suits which drink.',
    description:
      'A spirit distilled from grain and matured in oak. The spelling changes by country: Irish and American producers write whiskey, Scotland, Japan and Wales write whisky. The category covers everything from light and grassy to heavily peated.',
    usage:
      'Used as a base spirit in highballs, stirred classics and spirit-forward cocktails. Style choice changes the drink more than brand does: rye brings spice, bourbon brings sweetness, peated Scotch brings smoke that most cocktails cannot absorb.',
    topTips: [
      'Match the style to the build, not the price. A mid-shelf rye makes a better Manhattan than a rare single malt.',
      'Keep peat out of delicate drinks unless smoke is the point.',
      'Chill highballs properly. Temperature does more for a whisky and soda than the bottle does.',
    ],
    abv: 'Typically 40–46%',
    origin: 'Scotland, Ireland, United States, Japan, Wales and Canada',
    longDescription: [
      p(
        'Whiskey with an e is Irish or American. Whisky without it is Scotch, Japanese and Welsh. Both are correct, and the spelling tells you where the bottle is from before you read the label.'
      ),
      p('Everything else in the category follows from three things: the grain, the cask, and how long it sat there.'),
      h3('What whisky actually is'),
      p(
        'Mash the grain, ferment it, distil it, put it in oak and wait. That is the whole process. What separates one bottle from another is which grain, which cask, and how many years.'
      ),
      p(
        'The oak is not optional. Scotch and Irish whiskey both require a minimum of three years in cask. Bourbon has no minimum age but must go into new charred oak, which is why it picks up colour and vanilla faster than anything matured in a refill cask.'
      ),
      h3('The spelling, settled'),
      p(
        'Ireland and the United States write whiskey. Scotland, Japan, Canada and Wales write whisky. The convention is regional habit that hardened into house style, and both spellings are correct for their own country.'
      ),
      p(
        'Our sub-type pages follow each category’s own spelling, which is why you will see whiskey-bourbon and whisky-scotch side by side. That is deliberate, not an inconsistency.'
      ),
      h3('The styles, one line each'),
      p('Scotch. Made in Scotland, matured at least three years in oak. Ranges from delicate and floral to heavily peated depending on region and cask.'),
      p('Irish whiskey. Matured at least three years. Generally lighter and softer than Scotch, often triple distilled.'),
      p('Bourbon. American, at least 51% corn, matured in new charred oak. Sweeter and rounder, with vanilla from the fresh wood.'),
      p('Rye whiskey. American, at least 51% rye. Drier and spicier than bourbon, which is why classic cocktails often specify it.'),
      p('Japanese whisky. Distilling began in the 1920s, using Scotch methods and often Scottish-trained distillers.'),
      p('Canadian whisky. Matured at least three years. Widely called rye in Canada regardless of how much rye is actually in it.'),
      p('Welsh whisky. The smallest of the group and the newest.'),
      h3('Which to reach for'),
      p('For a highball, use something light and unpeated. Peat and soda rarely help each other.'),
      p('For a stirred drink, rye earns its place. The spice holds up against sweet vermouth where a softer whisky disappears.'),
      p('For sipping, the choice is yours and nobody else’s.'),
    ],
    faqs: [
      faq('Is it whisky or whiskey?', 'Both. Irish and American producers write whiskey. Scotland, Japan, Canada and Wales write whisky. Neither is a misspelling.'),
      faq('Does whisky have to be aged in oak?', 'Yes, in every country that regulates the category. Scotch and Irish whiskey both require a minimum of three years.'),
      faq('What is the difference between bourbon and rye?', 'The grain. Bourbon is at least 51% corn and tastes sweeter. Rye is at least 51% rye and tastes drier and spicier.'),
      faq('Should I add ice or water?', 'If you want to. A little water opens up the aroma on a cask-strength bottle. There is no correct answer and anyone insisting otherwise is posturing.'),
    ],
  },
  {
    slug: 'bitters',
    name: 'Bitters',
    category: 'bitters',
    metaTitle: 'Bitters Guide: Stronger Than You Think',
    metaDescription:
      'Angostura is 44.7% alcohol, stronger than most gin, and contains no angostura bark. What bitters are, what a dash does, and which to own.',
    description:
      'Concentrated botanical extracts in a high-proof base, used in dashes rather than measures. Bitters season a drink the way salt seasons food: not a flavour of their own so much as a way of making the other flavours legible.',
    usage:
      'Added in dashes to season and balance rather than to flavour. Standard in stirred classics such as the Old Fashioned, the Manhattan and the Sazerac, and useful in almost any drink that tastes flat without being obviously wrong.',
    topTips: [
      'Dash, do not pour. If you can taste the bitters as a flavour, there are too many in the glass.',
      'Adjust one dash at a time. The gap between not enough and too many is small.',
    ],
    abv: 'Typically 35–45%',
    longDescription: [
      p('Angostura aromatic bitters are 44.7% alcohol. That is stronger than the gin in your Martini, and it is why a bottle lasts years without spoiling.'),
      p('Most people own a bottle. Far fewer know what it is doing in the drink.'),
      h3('What they are'),
      p(
        'Bitters are bark, root, peel, seed and spice steeped in high-proof spirit until the flavour concentrates to the point of being undrinkable on its own. The alcohol extracts the flavour and then preserves it.'
      ),
      p(
        'You use them in dashes because that is all you need. A dash is roughly one millilitre. In a drink of seventy or eighty millilitres, that is under two per cent of the volume and it changes the whole thing.'
      ),
      h3('What a dash actually does'),
      p(
        'Bitters do the job salt does in cooking. They do not make a drink taste bitter any more than salt makes food taste salty. They sharpen the edges, join the sweet to the sour, and stop a drink reading as flat.'
      ),
      p(
        'Take the bitters out of an Old Fashioned and you have sweetened whisky. Put them back and the sugar stops being the point. Nothing else in the glass changed.'
      ),
      h3('Angostura contains no angostura bark'),
      p(
        'The name comes from the town of Angostura in Venezuela, where the recipe was created, not from an ingredient. The company later moved to Trinidad, where it still is.'
      ),
      h3('The five worth knowing'),
      p('Angostura. The default. Baking spice, clove, a dry finish. If you own one bottle, own this.'),
      p('Peychaud’s. Lighter, sweeter, anise-forward, distinctly red. The Sazerac is built on it and does not work with anything else.'),
      p('Orange bitters. The bridge. Useful wherever a drink needs lifting without adding weight, particularly in gin and whisky stirred drinks.'),
      p('Chocolate bitters. Cocoa without sugar. Small doses, dark spirits.'),
      p('Celery bitters. Drier and more savoury than it sounds. Good in a Bloody Mary, where it does the job celery salt is usually asked to do.'),
      h3('Buying and keeping them'),
      p('Two bottles cover most of the canon: Angostura and orange. Add Peychaud’s if you drink Sazeracs.'),
      p(
        'They do not need refrigerating and they do not really go off. The alcohol content that makes them undrinkable neat is the same thing that makes them keep. A bottle bought this year will outlast most of the spirits next to it.'
      ),
    ],
    faqs: [
      faq('Do bitters make a drink taste bitter?', 'No. They work like salt in cooking. Used properly you notice their absence more than their presence.'),
      faq('How much is a dash?', 'Roughly one millilitre. In a standard cocktail that is under two per cent of the volume.'),
      faq('Do bitters expire?', 'Not meaningfully. The high alcohol content preserves them, and an opened bottle will keep for years at room temperature.'),
      faq('Are bitters alcoholic?', 'Yes. Angostura is 44.7% alcohol, stronger than most gin. The quantities involved are tiny, but a drink made with bitters is not alcohol free.'),
      faq('Which should I buy first?', 'Angostura, then orange bitters. Those two will cover most classic recipes you are likely to make.'),
    ],
  },
  {
    slug: 'vermouth',
    name: 'Vermouth',
    category: 'fortified',
    metaTitle: 'Vermouth Guide: Why Your Bottle Is Already Stale',
    metaDescription:
      'Vermouth is aromatised fortified wine, not a mixer. It oxidises like wine, so an open bottle belongs in the fridge and lasts weeks.',
    description:
      'An aromatised fortified wine, flavoured with botanicals that must include wormwood. Usually 15 to 18% alcohol. Because it is wine rather than spirit, an opened bottle oxidises and should be refrigerated.',
    usage:
      'Used as a modifier in stirred drinks rather than as a base. Sweet vermouth builds the Manhattan and the Negroni; dry vermouth builds the Martini. Also drinkable on its own over ice as a low-strength aperitif.',
    topTips: [
      'Refrigerate after opening. It is wine, and it behaves like wine.',
      'Sweetness varies a good deal between producers. If a Negroni tastes cloying, change the bottle before you change the ratio.',
    ],
    abv: 'Typically 15–18%',
    longDescription: [
      p('Vermouth is wine. That is not a technicality: it oxidises exactly like wine, and an open bottle left in a warm cupboard is finished within weeks.'),
      p('Most bad Martinis are not badly made. They are made with vermouth that died months ago.'),
      h3('Wine, fortified and aromatised'),
      p(
        'Vermouth starts as wine. It is fortified with neutral spirit to raise the strength, then flavoured with botanicals. The name comes from Wermut, the German for wormwood, and wormwood is the botanical the category is named for and traditionally built on.'
      ),
      p(
        'That puts it at fifteen to eighteen per cent in most cases. Stronger than wine, far weaker than any spirit it sits next to on the shelf. It belongs in the fridge with the wine, not the cupboard with the gin.'
      ),
      h3('Why it goes off, and what that costs you'),
      p(
        'Once the bottle is open, oxygen gets to it and the same thing happens that happens to any open wine. It flattens, then it turns papery, then it turns sour. Refrigerated, an open bottle holds up for around a month. In a warm cupboard it is noticeably worse within a fortnight.'
      ),
      p(
        'This matters more than any brand choice. A Martini made with fresh supermarket vermouth beats one made with an expensive bottle opened last winter. If your stirred drinks have been disappointing, check the vermouth before you blame the gin.'
      ),
      p('Buy small bottles. A half bottle you finish is worth more than a full one you do not.'),
      h3('Sweet and dry'),
      p(
        'Sweet vermouth. Red, richer, noticeably sweeter. The Manhattan and the Negroni are both built on it. Sweetness varies a good deal between producers, so a recipe that tastes cloying with one bottle may be balanced with another.'
      ),
      p(
        'Dry vermouth. Pale, crisp, much less sweet. The Martini’s other half, and the ingredient most often blamed for a bad one when the real problem is its age.'
      ),
      h3('Drink it on its own'),
      p(
        'Vermouth is a drink, not only an ingredient. Poured over ice with a slice of orange or lemon, it is a decent aperitif. At fifteen to eighteen per cent it is a fraction of the strength of the spirits beside it.'
      ),
      p('It is also the fastest way to learn what your bottle actually tastes like, which makes it easier to judge how much a cocktail needs.'),
    ],
    faqs: [
      faq('Does vermouth need refrigerating?', 'Yes, once opened. It is a fortified wine and it oxidises. Refrigerated it holds for around a month; in a warm cupboard it fades within a fortnight.'),
      faq('Is vermouth a spirit?', 'No. It is wine that has been fortified and aromatised, usually landing at 15 to 18% alcohol.'),
      faq('What is the difference between sweet and dry vermouth?', 'Sweet is red, richer and noticeably sweeter, and builds the Manhattan and the Negroni. Dry is pale, crisp and much less sweet, and builds the Martini.'),
      faq('Can I drink vermouth on its own?', 'Yes. Over ice with a slice of citrus it makes a good low-strength aperitif, and it is the quickest way to learn what your bottle tastes like.'),
    ],
  },
  {
    slug: 'syrup',
    name: 'Syrups',
    category: 'mixers',
    metaTitle: 'Syrups Guide: Which One and When',
    metaDescription:
      'Eighteen syrups, and most drinks need one of three. Simple, demerara and orgeat cover the canon. What the rest are for, and when to reach for them.',
    description:
      'Sugar dissolved in water, sometimes with a flavouring. Syrups exist because granulated sugar will not dissolve in a cold drink. Which one a recipe calls for changes the texture as much as the sweetness.',
    usage:
      'Added by the millilitre to balance acidity and provide texture. Which syrup a recipe specifies matters: swapping demerara for simple changes the weight of the drink, and orgeat cannot be substituted at all.',
    topTips: [
      'Do not substitute orgeat. Nothing else brings the almond and the texture together.',
      'Make small batches. Syrup is quick to make and slow to use up.',
    ],
    longDescription: [
      p(
        'Granulated sugar does not dissolve in a cold drink. That is the entire reason syrups exist, and it is why a recipe calling for simple syrup will not work if you tip sugar into the shaker instead.'
      ),
      p('Most have their own page here. Three cover most of what you will ever make.'),
      h3('The three that cover the canon'),
      p('Simple syrup. Equal parts sugar and water, or two to one for a richer version. The default in sours, fizzes and anything citrus-led.'),
      p(
        'Demerara syrup. Made with demerara rather than white sugar. Rounder and faintly molasses-like. Used where the drink wants weight rather than just sweetness, which is most rum and whisky drinks.'
      ),
      p(
        'Orgeat. Almond, with orange flower water. Not interchangeable with anything. It is what makes a Mai Tai a Mai Tai, and it brings texture as well as flavour.'
      ),
      h3('The rest, and what each is for'),
      p(
        'Honey syrup and honey ginger syrup, for whisky drinks and anything wanting warmth. Agave syrup, for tequila and mezcal. Cane syrup, closer to demerara than to simple. Maple syrup, for whisky drinks where you want something rounder than honey. Vanilla sugar syrup, for softening sharper drinks.'
      ),
      p(
        'Fruit and flavour syrups, used where the fruit is the point: passion fruit, raspberry, strawberry, apple cider, chocolate, caramel, cinnamon, rose, and butterfly pea for its colour more than its taste.'
      ),
      h3('Keeping them'),
      p(
        'A syrup is sugar and water, and it will eventually spoil. Refrigerate anything you make. A one-to-one simple syrup keeps for around a month; a richer two-to-one keeps longer, because the higher sugar concentration leaves less water for anything to grow in.'
      ),
      p('Fruit syrups have the shortest life of the group. Make small batches unless you are working through them.'),
    ],
    faqs: [
      faq('Can I use granulated sugar instead of syrup?', 'Not in a cold drink. It will not dissolve and you will find it at the bottom of the glass. Syrup exists to solve exactly that.'),
      faq('What is the difference between simple syrup and demerara syrup?', 'The sugar. Demerara is less refined, so the syrup is rounder and faintly molasses-like. It suits rum and whisky drinks where simple syrup can taste thin.'),
      faq('How long does homemade syrup keep?', 'Refrigerated, around a month for a one-to-one simple syrup and longer for a richer two-to-one. Fruit syrups keep the least well.'),
      faq('Is orgeat just almond syrup?', 'Not quite. It is almond with orange flower water, and it carries a texture that plain almond syrup does not. It is the one syrup with no real substitute.'),
    ],
  },
]

DOCS.push(
  {
    // Deliberately definitional and titled away from "guide".
    // /guides/complete-guide-rum/ already answers this query in 2,813 words;
    // this page routes to it rather than competing with it. Our own product
    // page is a sub-type but not a style, so it is not in the list below.
    slug: 'rum',
    name: 'Rum',
    category: 'spirits',
    metaTitle: 'Rum: The Styles Explained',
    metaDescription:
      'White, dark, aged, spiced, overproof and more. What separates each style in a line, and where to read the full guide to rum.',
    description:
      'A spirit distilled from sugarcane, either from molasses or from fresh-pressed juice. The styles differ by what happened after distillation: how long in cask, what was added, and at what strength it was bottled.',
    usage:
      'Used as a base spirit across daiquiris, punches, tiki drinks and highballs. Style choice matters more than brand: a white rum daiquiri and an aged rum daiquiri are different drinks.',
    topTips: [
      'Match the style to the drink. Aged rum in a daiquiri wastes the ageing; white rum in an Old Fashioned wastes the drink.',
      'Read past the colour. Dark does not mean old.',
    ],
    abv: 'Typically 37.5–75%',
    longDescription: [
      p(
        'Rum is distilled from sugarcane. Most of it starts from molasses, a by-product of sugar refining; some starts from fresh-pressed cane juice, which is what separates rhum agricole and cachaça from the rest. Everything after that is cask, time and additions.'
      ),
      p('White rum. Little or no cask age, or aged then filtered clear. Clean rather than neutral.'),
      p('Dark rum. Colour is not a grade. It can come from long ageing or from added caramel, and the label rarely tells you which.'),
      p('Aged rum. Time in oak, doing what oak does. The style closest to a sipping whisky.'),
      p('Spiced rum. Rum with spices added after distillation. Quality depends entirely on whether those spices are real.'),
      p('Overproof rum. Bottled well above 40%. A seasoning spirit more than a base.'),
      p('Blackstrap rum. Near-black, heavy with molasses character.'),
      p('Cachaça. Brazilian, from fresh cane juice. Legally its own category, not a rum.'),
      h3('Read further'),
      linkP('', 'The complete guide to rum covers production, regions and how to read a label.', '/guides/complete-guide-rum/'),
    ],
    faqs: [
      faq('What is rum made from?', 'Sugarcane. Most rum is distilled from molasses, a by-product of sugar refining. Some is distilled from fresh-pressed cane juice, which gives rhum agricole and cachaça their grassier character.'),
      faq('Does dark rum mean it is aged?', 'Not necessarily. Colour can come from time in cask or from added caramel, and labels rarely distinguish. Age statements are more reliable than colour.'),
      faq('Is cachaça a rum?', 'Legally, no. It is its own category, made in Brazil from fresh cane juice. In practice it behaves like an unaged cane spirit.'),
    ],
  },
  {
    slug: 'sherry',
    name: 'Sherry',
    category: 'fortified',
    metaTitle: 'Sherry Guide: Flor, Oxidation and Sweetness',
    metaDescription:
      'Fortified wine from Jerez. Fino is aged under a layer of yeast and lasts days once opened. Pedro Ximenez is nearly syrup. What each is for.',
    description:
      'A fortified wine from Jerez in southern Spain, ranging from bone dry to intensely sweet. The dry styles are aged under a layer of yeast that keeps oxygen out; the sweet styles are made from grapes dried in the sun.',
    usage:
      'Used as a modifier in stirred and spirit-forward drinks, where a dry sherry adds salinity and length without adding much strength. Pedro Ximenez is used in small amounts for sweetness and body.',
    topTips: [
      'Refrigerate fino and finish it within a week. It is white wine in all but name.',
      'Buy half bottles of the dry styles. A full bottle will oxidise before you get through it.',
    ],
    abv: 'Typically 15–20%',
    origin: 'Jerez, Andalusia, Spain',
    longDescription: [
      p('Fino sherry lasts days once opened, not months. It is wine, and the palest styles are the most perishable bottles on the shelf.'),
      p('Sherry is also the most misunderstood thing in most drinks cabinets, usually because the bottle in there has been open since Christmas.'),
      h3('What sherry is'),
      p(
        'Sherry is wine from a defined region around Jerez in Andalusia, fortified with grape spirit after fermentation. It runs from completely dry to thick and sweet, and the range between those two ends is wider than any other wine category.'
      ),
      p(
        'It is blended through a solera, a system of stacked barrels where older wine is topped up with younger. Nothing is a single vintage. Consistency is the point.'
      ),
      h3('Flor, and why it matters'),
      p(
        'The dry styles are aged under flor, a living layer of yeast that forms on the wine’s surface and seals it from the air. That is what makes fino taste of almond, bread and salt rather than of oxidation.'
      ),
      p(
        'Where the flor dies or is never encouraged, the wine oxidises instead and turns nutty and darker. That single difference explains most of the sherry shelf.'
      ),
      h3('The three worth knowing'),
      p('Fino. Pale, bone dry, saline. Aged entirely under flor. Serve it cold, treat it like white wine, and drink it within a few days of opening.'),
      p('Amontillado. Starts under flor, then continues once the flor has gone. Two lives, hence the character: dry, but nutty rather than saline.'),
      p('Pedro Ximenez. Made from grapes dried in the sun until they are nearly raisins. Almost black, syrupy, very sweet. Often poured over ice cream rather than drunk on its own.'),
      h3('Keeping it'),
      p('Fino is the fragile one. Refrigerate it and finish it inside a week; it is closer to white wine than to spirit.'),
      p('The oxidative styles are more forgiving, because oxidation has already done its work. Amontillado holds for weeks, and Pedro Ximenez for longer still.'),
    ],
    faqs: [
      faq('Does sherry go off?', 'Yes, and quickly for the dry styles. Fino should be refrigerated and finished within a week. Sweet and oxidative styles keep for considerably longer.'),
      faq('What is flor?', 'A layer of yeast that grows on the surface of the wine and protects it from oxygen. It is what gives fino its salty, almond character.'),
      faq('Is sherry sweet?', 'It ranges from bone dry to very sweet. Fino is dry; Pedro Ximenez is nearly syrup. Assuming sherry means sweet is the most common misunderstanding.'),
      faq('What is a solera?', 'A system of stacked barrels where older wine is continually topped up with younger. It means sherry is a blend across years rather than a single vintage.'),
    ],
  }
)

// Two sherry SUB-TYPES, not parents. The family had fino, amontillado and
// Pedro Ximenez, which left the two most common questions unanswered: what
// oloroso is, and why manzanilla is not just fino under another name. Kept to
// the length of their siblings, which run 139 to 148 words.
DOCS.push(
  {
    slug: 'oloroso-sherry',
    name: 'Oloroso Sherry',
    category: 'fortified',
    metaTitle: 'Oloroso Sherry Guide: Oxidised on Purpose',
    metaDescription:
      'Oloroso is fortified above the level flor can survive, so it ages in contact with air. Dry despite tasting rich. Cream sherry is oloroso sweetened.',
    description:
      'A sherry fortified high enough that flor never forms, so it ages in contact with air from the start. Deep amber, nutty and rich, and dry unless it has been sweetened.',
    usage:
      'Used where a drink wants weight and nuttiness without sugar. Works in stirred spirit-forward drinks and as a substitute for sweet vermouth when a drier result is wanted.',
    topTips: [
      'Rich is not the same as sweet. Oloroso is dry unless the label says otherwise.',
      'Keeps far better than fino once opened, because the oxidation has already happened.',
    ],
    abv: 'Typically 17–22%',
    origin: 'Jerez, Andalusia, Spain',
    longDescription: [
      p(
        'Oloroso is fortified to a level flor cannot survive. Where fino is protected from the air by a living layer of yeast, oloroso is deliberately left exposed to it, and ages oxidatively from the beginning.'
      ),
      p(
        'The result is deep amber, nutty, and heavier in the mouth than its strength suggests. What it is not is sweet. Oloroso is a dry wine, and the assumption otherwise comes from cream sherry, which is oloroso that has been sweetened after ageing.'
      ),
      p(
        'Because the oxidation has already done its work, an open bottle is far more robust than a fino. Weeks rather than days.'
      ),
    ],
    faqs: [
      faq('Is oloroso sweet?', 'No. Oloroso is dry. Cream sherry is oloroso that has been sweetened after ageing, which is where the confusion comes from.'),
      faq('How is oloroso different from fino?', 'Fino ages under flor, a layer of yeast that keeps oxygen out. Oloroso is fortified above the level flor can survive, so it ages in contact with air.'),
      faq('How long does an open bottle keep?', 'Weeks rather than days. The oxidation that shapes the wine has already happened, so exposure to air does far less damage than it does to a fino.'),
    ],
  },
  {
    slug: 'manzanilla-sherry',
    name: 'Manzanilla Sherry',
    category: 'fortified',
    metaTitle: 'Manzanilla Guide: Fino, but by the Sea',
    metaDescription:
      'Made exactly like fino but only in Sanlucar de Barrameda, where the coastal air keeps the flor thick year round. Saltier, lighter, just as perishable.',
    description:
      'A sherry made in the same way as fino, but only in the coastal town of Sanlucar de Barrameda. The sea air keeps the flor thicker for more of the year, which makes the wine lighter and more saline.',
    usage:
      'Used where fino would work but a drier, saltier result is wanted. Excellent chilled on its own, and a good match for anything salted or fried.',
    topTips: [
      'Treat it exactly like fino. Refrigerate it and finish it within a few days.',
      'Serve it properly cold. Warm manzanilla loses the salinity that is the whole point.',
    ],
    abv: 'Typically 15–17%',
    origin: 'Sanlucar de Barrameda, Andalusia, Spain',
    longDescription: [
      p(
        'Manzanilla is fino by another name and a different postcode. Same production, same ageing under flor, but it can only be called manzanilla if it is aged in Sanlucar de Barrameda on the coast.'
      ),
      p(
        'The location does the work. Sanlucar is cooler and more humid than inland Jerez, so the flor stays thick through more of the year and the wine spends longer protected from the air. It comes out paler, lighter and noticeably more saline than a fino from Jerez.'
      ),
      p(
        'It shares fino’s fragility as well as its method. Once open it is a matter of days, refrigerated, before the freshness goes.'
      ),
    ],
    faqs: [
      faq('What is the difference between manzanilla and fino?', 'The place. Both are aged under flor in the same way, but manzanilla is aged in Sanlucar de Barrameda, where the coastal air keeps the flor thicker. It tends to be lighter and saltier.'),
      faq('Does manzanilla go off?', 'Yes, as quickly as fino. Refrigerate it and finish it within a few days of opening.'),
      faq('How should I serve it?', 'Properly cold, in a normal wine glass rather than a thimble. The salinity is the point and warmth flattens it.'),
    ],
  }
)

async function main() {
  for (const d of DOCS) {
    const existing = await client.fetch(`*[_type == "ingredient" && slug.current == "${d.slug}"][0]{ _id }`)
    if (existing) {
      console.log(`skip   /${d.slug} already exists (${(existing as { _id: string })._id})`)
      continue
    }

    const doc: { _type: string; [k: string]: unknown } = {
      _type: 'ingredient',
      name: d.name,
      slug: { _type: 'slug', current: d.slug },
      category: d.category,
      metaTitle: d.metaTitle,
      metaDescription: d.metaDescription,
      description: d.description,
      usage: d.usage,
      topTips: d.topTips,
      longDescription: d.longDescription,
      faqs: d.faqs,
      featured: false,
      author: 'Jerry Can Spirits',
    }
    if (d.abv) doc.abv = d.abv
    if (d.origin) doc.origin = d.origin

    const created = await client.create(doc)
    console.log(`create /${d.slug}  ${created._id}  (${d.longDescription.length} blocks, ${d.faqs.length} faqs)`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
