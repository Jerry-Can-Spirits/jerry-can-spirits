import { MEMBER_SHORT } from '@/lib/cocktail-facets'

/**
 * Written copy for facet pages, and the tokens that keep its numbers honest.
 *
 * A count is the strongest checkable fact a facet intro has and the fastest
 * one to rot: "seventy-four whiskey cocktails" is wrong the day someone adds a
 * recipe, and nobody would notice, because nothing in the build compares the
 * sentence to the data. So counts are never written. They are tokens the
 * template fills from the same query that renders the grid, which means the
 * prose cannot disagree with the page beneath it.
 *
 * Tokens resolve in the title tag and meta description as well as the body.
 * Accurate body copy under a stale title is the failure this is meant to
 * prevent, so the same renderer runs in generateMetadata.
 *
 * Digits, not words. A token can only emit digits, and "seventy-four cocktails,
 * 27 of them bourbon" is worse than consistent digits throughout.
 *
 *   {count}    74            the facet total
 *   {recipes}  74 recipes    total, with the noun agreeing: "1 recipe"
 *   {split}    27 bourbon, 22 rye, 14 Scotch, 8 Irish and 3 Welsh
 *
 * {split} renders the whole breakdown rather than one token per sub-type, for
 * two reasons. A sub-type that falls to zero disappears from the sentence
 * instead of rendering "0 Welsh", and the commas and the final "and" stay
 * correct however many survive. Writing one token per member would hardcode
 * which members exist, which is the thing being avoided.
 */

export interface FacetCopy {
  /** H1. Carries no count, so it never needs a token. */
  h1?: string
  /** Title tag. May contain tokens. Under 60 characters once rendered. */
  title?: string
  /** Meta description. May contain tokens. Under 155 characters once rendered. */
  description?: string
  /** Body introduction, one or more paragraphs separated by a blank line. */
  intro?: string
}

export interface CopyContext {
  count: number
  /** Sub-type breakdown, already filtered to members that hold something. */
  split?: Array<{ member: string; count: number }>
}

/** "a, b and c" — no Oxford comma, matching the rest of the site's copy. */
function joinList(parts: string[]): string {
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0]
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`
}

/**
 * A member with no MEMBER_SHORT entry still has to read as English.
 *
 * Without this, the day someone tags a new sub-type the copy renders "1
 * navy-rum" — a raw slug, hyphen and all — in live prose on every page that
 * uses {split}, and nothing in the build would object. De-slugifying is not a
 * substitute for adding the label, it is what stops the omission being
 * published.
 */
function memberLabel(member: string): string {
  return MEMBER_SHORT[member] ?? member.replace(/-/g, ' ')
}

export function renderSplit(split: CopyContext['split']): string {
  if (!split?.length) return ''
  return joinList(
    split
      // A sub-type with nothing in it drops out of the sentence rather than
      // rendering "0 Welsh".
      .filter((s) => s.count > 0)
      .map((s) => `${s.count} ${memberLabel(s.member)}`)
  )
}

/**
 * Replace every token in a string. Unknown tokens are left alone rather than
 * blanked, so a typo shows up as "{cont}" on the page instead of vanishing
 * into a sentence that still reads plausibly.
 */
export function renderCopy(template: string, ctx: CopyContext): string {
  return template
    .replace(/\{count\}/g, String(ctx.count))
    .replace(/\{recipes\}/g, `${ctx.count} ${ctx.count === 1 ? 'recipe' : 'recipes'}`)
    // {styles} rather than {split} where a facet has many sub-types. MEASURED:
    // the rum meta with {split} renders at 188 characters against a 155
    // ceiling and grows with every sub-type added, where {styles} is a fixed
    // cost. Use {split} in a meta only where members are 3 or fewer.
    .replace(/\{styles\}/g, String((ctx.split ?? []).filter((s) => s.count > 0).length))
    .replace(/\{split\}/g, renderSplit(ctx.split))
}

/**
 * Approved copy, keyed by "kind:value".
 *
 * Eighteen entries against nineteen indexable facets. mocktails is deliberately
 * absent: it describes the same ten drinks as non-alcoholic and canonicalises
 * to it, so writing a second introduction for one set of recipes would have
 * been the duplication the canonical exists to resolve.
 *
 * A facet with no entry renders its heading and grid and no introduction. The
 * template has never generated filler and must not start.
 */
export const FACET_COPY: Record<string, FacetCopy> = {
  'spirit:whiskey': {
    h1: 'Whiskey Cocktails',
    title: 'Whiskey Cocktails: {recipes} by style',
    description:
      '{recipes} built on whiskey: {split}. Bourbon, rye and Scotch are not interchangeable.',
    intro:
      'This Field Manual holds {recipes} built on whiskey: {split}. The spelling follows the country. Irish and American distillers write whiskey, Scotch writes whisky, and this page uses one word for all of them.\n\nThey are not interchangeable. Bourbon is sweet and broad, and it fills out a drink that needs body, which is why an Old Fashioned built on bourbon tastes rounder than the same drink built on rye. Rye is drier and peppery, and it keeps its edge against sweet vermouth, which is what a Manhattan is asking for. Scotch carries smoke or sea salt depending on where it was made, and a peated bottle will take over anything delicate. Irish whiskey is lighter than either American style and suits a long drink or a hot one.',
  },
  'style:sours': {
    h1: 'Sours',
    title: 'Sour Cocktails: {recipes} from the Field Manual',
    description:
      '{recipes} in the sour family: a spirit, a citrus and a sweetener in balance. The largest family in this Field Manual.',
    intro:
      'This Field Manual holds {recipes} in the sour family, more than any other family here. A sour is a spirit, a citrus juice and a sweetener in balance. Change any one of the three and the drink takes a different name: a daiquiri, a margarita and a sidecar are all sours.\n\nThe ratio is where the disagreement is. Two parts spirit to one part citrus to one part sweetener is the usual starting point and it suits bourbon. Cut the sweetener and the citrus comes forward, which suits a lighter spirit. Add egg white and the texture changes rather than the flavour, which is why a whiskey sour and a Boston sour share a specification and taste different.',
  },
  'spirit:gin': {
    h1: 'Gin Cocktails',
    title: 'Gin Cocktails: {recipes} from the Field Manual',
    description:
      '{recipes} built on gin. A botanical spirit that holds its shape against citrus and vermouth instead of stepping back.',
    intro:
      'This Field Manual holds {recipes} built on gin, the second largest spirit group here after whiskey. Gin is a neutral spirit redistilled with botanicals, juniper first by law. That botanical load is why gin holds its shape against citrus and vermouth where vodka steps back.\n\nThe style of gin changes the drink more than the brand does. A London dry is juniper-forward and dry, and it is what a martini and a negroni assume. A contemporary gin leads with citrus or florals instead, which suits a collins or a spritz where the gin is the loudest thing in the glass. Old Tom is sweeter and predates both, and a Tom Collins was built for it.',
  },
  'spirit:rum': {
    h1: 'Rum Cocktails',
    title: 'Rum Cocktails: {recipes} by style',
    description:
      '{recipes} built on rum across {styles} styles. Which rum you reach for changes the drink more than which bottle.',
    intro:
      'This Field Manual holds {recipes} built on rum: {split}. Rum is made from sugarcane, and the split above is by style rather than by origin.\n\nWhite rum is filtered and light, and it lets citrus lead, which is what a daiquiri and a mojito want. Dark rum carries caramel and stands up to lime and ginger in a dark and stormy. Aged rum spends time in oak and behaves more like whiskey, so it suits a stirred drink over ice. Spiced rum has botanicals added after distillation, which changes a drink more than swapping one white rum for another does.',
  },
  'style:martinis': {
    h1: 'Martinis',
    title: 'Martini Cocktails: {recipes} from the Field Manual',
    description:
      '{recipes} in the martini family. A spirit and an aromatised wine, stirred and served up. The ratio is the whole argument.',
    intro:
      'This Field Manual holds {recipes} in the martini family. A martini is a spirit and an aromatised wine, stirred with ice and served without any. Everything else about it is contested.\n\nThe ratio moved across a century and never settled. Early specifications were close to equal parts gin and vermouth; the dry martini of the 1950s cut the vermouth to a rinse. Both are on this page. Gin and vodka behave differently in it: gin leaves botanicals to argue with the vermouth, vodka leaves texture and temperature to carry the drink. A dirty martini adds olive brine, which makes it a three-ingredient drink whatever the menu calls it.',
  },
  'style:highballs': {
    h1: 'Highballs',
    title: 'Highball Cocktails: {recipes} from the Field Manual',
    description:
      '{recipes} in the highball family. One spirit, one mixer, ice and a tall glass. The simplest build here and the easiest to get wrong.',
    intro:
      'This Field Manual holds {recipes} in the highball family. A highball is one spirit lengthened with one carbonated mixer, built in the glass over ice. There is no shaking and usually no third ingredient.\n\nThe technique is all there is, so it shows. A cold glass, ice to the top, mixer poured down the side and one stir at most: each of those keeps carbonation in the drink. A gin and tonic, a whisky highball and a rum and coke are the same build with different halves. The ratio does the rest, and two parts mixer to one is a strong highball where three to one is a long one.',
  },
  'spirit:vodka': {
    h1: 'Vodka Cocktails',
    title: 'Vodka Cocktails: {recipes} from the Field Manual',
    description:
      '{recipes} built on vodka. A spirit chosen for what it does not add, which changes what everything else has to do.',
    intro:
      'This Field Manual holds {recipes} built on vodka. Vodka is distilled to strip character rather than to build it, which makes it the one spirit here defined by absence.\n\nThat absence is the reason to reach for it. In an espresso martini or a bloody mary the vodka carries strength and texture and lets coffee, or tomato and spice, do the work where gin would argue with both. In a moscow mule it lets ginger lead. The trade is that a vodka drink has nowhere to hide: with no botanicals to cover a thin mixer or warm ice, the build and the temperature are the whole drink.',
  },
  'style:old-fashioneds': {
    h1: 'Old Fashioneds',
    title: 'Old Fashioned Cocktails: {recipes} to make',
    description:
      '{recipes} in the old fashioned family. Spirit, sugar, bitters and ice, and nothing else that is not doing a job.',
    intro:
      'This Field Manual holds {recipes} in the old fashioned family. The build is spirit, sugar, bitters and ice, stirred in the glass. It is the oldest surviving cocktail specification and the definition of the word before the word meant anything else.\n\nWhat changes is the spirit and the sugar. Bourbon and sugar makes the version most people picture; rye and demerara makes a drier one with more spine. Swap the whiskey for rum or tequila and the build holds. The bitters are not decoration, they are the seasoning that stops the sugar reading as sweet, which is why leaving them out gives you whiskey and water.',
  },
  'spirit:tequila': {
    h1: 'Tequila Cocktails',
    title: 'Tequila Cocktails: {recipes} by style',
    description: '{recipes} built on agave: {split}. The difference is smoke, and it decides the drink.',
    intro:
      'This Field Manual holds {recipes} built on agave: {split}. Both are made from agave and the law separates them by region and species, but in a glass the difference is smoke.\n\nTequila is steamed, which keeps the agave clean and vegetal, and it is what a margarita and a paloma are built around. Mezcal is roasted in a pit, and the smoke that comes with it will take over a drink built for tequila unless the recipe expects it. Swapping one for the other is not a substitution, it is a different drink. A blanco keeps the agave forward where a reposado puts oak in front of it.',
  },
  'spirit:brandy': {
    h1: 'Brandy Cocktails',
    title: 'Brandy Cocktails: {recipes} by style',
    description: '{recipes} built on brandy: {split}. Grape spirit, aged in oak, and the oldest base in the book.',
    intro:
      'This Field Manual holds {recipes} built on brandy: {split}. Brandy is distilled from fruit, usually grapes, and aged in oak. It is the base of the oldest drinks here.\n\nCognac is brandy from one region under strict rules, and its weight suits a sidecar or a sazerac where the spirit has to carry sugar and citrus without thinning. Brandy without the appellation covers everything from Spanish solera to apple brandy, and the range is wide enough that the bottle matters more than the category. Age is the reliable guide: the longer it sat in oak, the better it holds a stirred drink and the less it wants shaking.',
  },
  'style:manhattans': {
    h1: 'Manhattans',
    title: 'Manhattan Cocktails: {recipes} to make',
    description:
      '{recipes} in the manhattan family. Whiskey and sweet vermouth, stirred, and the vermouth does more work than it gets credit for.',
    intro:
      'This Field Manual holds {recipes} in the manhattan family. A manhattan is whiskey, sweet vermouth and bitters, stirred and served up. The martini’s sibling, built on a spirit that does not need protecting.\n\nRye is the traditional choice because its pepper cuts the vermouth’s sweetness, and bourbon makes a rounder, softer drink. The vermouth is the variable that matters most: it is wine, it oxidises, and a bottle open for a month makes a flat manhattan out of a good whiskey. Change the ratio towards the vermouth and you are moving towards a perfect manhattan, then towards a Rob Roy if the whiskey turns Scotch.',
  },
  'style:tiki': {
    h1: 'Tiki',
    title: 'Tiki Cocktails: {recipes} to make',
    description:
      '{recipes} in the tiki family. Layered rum, several citruses and a syrup doing structural work, not decoration.',
    intro:
      'This Field Manual holds {recipes} in the tiki family. Tiki drinks blend more than one rum, more than one citrus and at least one syrup.\n\nThe rums are layered on purpose: a light rum for the body, an aged or dark one for depth, sometimes an overproof float that sits on top and is tasted first. Orgeat and falernum are structural, not sweeteners, and swapping either for simple syrup collapses the drink. Crushed ice is part of the specification because dilution is doing work here, which is why a mai tai served over cubes tastes wrong within a minute.',
  },
  'style:punches': {
    h1: 'Punches',
    title: 'Punch Recipes: {recipes} to make',
    description:
      '{recipes} in the punch family. Built by the bowl, in a ratio older than the cocktail, and designed to be made ahead.',
    intro:
      'This Field Manual holds {recipes} in the punch family. Punch predates the cocktail by more than a century and works to a ratio rather than a recipe: one of sour, two of sweet, three of strong, four of weak.\n\nThe ratio is what makes it scale. Every quantity moves together, so a bowl for twelve is the same arithmetic as a glass for one. Dilution is built in through the weak, which is water or tea, and that is why a punch can sit on a table without collapsing the way a shaken drink would. A large block of ice melts slowly enough to hold the balance for an evening, and cubes do not.',
  },
  'style:fizzes': {
    h1: 'Fizzes',
    title: 'Fizz Cocktails: {recipes} to make',
    description:
      '{recipes} in the fizz family. A sour, shaken hard, topped with soda and served short without ice.',
    intro:
      'This Field Manual holds {recipes} in the fizz family. A fizz is a sour shaken hard and topped with soda, served short in a small glass with no ice in it.\n\nThe absence of ice is the whole point and the reason a fizz is drunk quickly. Shaking does the chilling and the dilution before the drink reaches the glass, so there is nothing left to keep it cold. A gin fizz with egg white becomes a silver fizz, with the yolk a golden one, and with both a royal. The Ramos asks for twelve minutes of shaking and a cream and citrus emulsion that separates if you stop early.',
  },
  'spirit:non-alcoholic': {
    h1: 'Non-Alcoholic Cocktails',
    title: 'Non-Alcoholic Cocktails: {recipes} to make',
    description:
      '{recipes} built without alcohol. Bitterness, acid and texture doing the work the spirit used to do.',
    intro:
      'This Field Manual holds {recipes} built without alcohol. Removing the spirit removes three things at once: bitterness, viscosity and the burn that tells your mouth a drink has arrived. A good one replaces all three rather than leaving juice in a nice glass.\n\nBitterness is the one most often missed. Non-alcoholic bitters, strong tea, grapefruit pith or a bitter soda give the drink somewhere to end, and without it a mix of juices tastes flat however good the fruit is. Acid does the lifting a spirit’s heat would otherwise do, so these recipes lean harder on citrus and vinegar than their alcoholic equivalents. Texture is the hardest to replace: a syrup, an egg white or a shrub gives the drink weight, and a Seedlip-style distillate brings aroma without body.',
  },
  'style:collins': {
    h1: 'Collins',
    title: 'Collins Cocktails: {recipes} to make',
    description:
      '{recipes} in the collins family. A sour lengthened with soda, built tall over ice and served with a straw.',
    intro:
      'This Field Manual holds {recipes} in the collins family. A collins is a sour lengthened with soda water: spirit, lemon, sugar and bubbles, built tall over ice. It is a Tom Collins whatever the spirit, and the name changes with it.\n\nThe soda is what separates it from a fizz, which is shaken and served short. A collins is built in the glass and stays long, so the ice matters more than the shake: fill the glass and the drink stays cold without watering, half-fill it and it is thin by the second mouthful. Lemon is standard, lime makes it sharper, and the sugar comes down as the citrus goes up.',
  },
  'style:negronis': {
    h1: 'Negronis',
    title: 'Negroni Cocktails: {recipes} to make',
    description:
      '{recipes} in the negroni family. Equal parts spirit, bitter and vermouth, stirred, and every variation moves one part.',
    intro:
      'This Field Manual holds {recipes} in the negroni family. The build is equal parts: a spirit, a bitter liqueur and a sweet vermouth, stirred over ice with an orange peel. Every drink on this page is that ratio with one part swapped.\n\nSwap the gin for whiskey and it is a boulevardier, for prosecco and it is a sbagliato. The Campari is the part people argue about: swap it for a gentler bitter and the drink stops fighting back, which is usually what someone means when they say they do not like negronis. Go the other way, towards a more bitter amaro, and the vermouth has to come up with it or the drink turns austere.',
  },
  'spirit:champagne': {
    h1: 'Champagne Cocktails',
    title: 'Champagne Cocktails: {recipes} to make',
    description:
      '{recipes} built on champagne and sparkling wine. The bubbles are an ingredient, which changes how the drink is built.',
    intro:
      'This Field Manual holds {recipes} built on champagne or sparkling wine. The bubbles are an ingredient rather than a mixer, and that changes the order of work: everything else goes in first, the wine goes in last, and nothing gets stirred afterwards.\n\nDryness decides the drink. A brut keeps a sugar cube or a liqueur in check, where a demi-sec on top of either turns cloying. Temperature does the rest, because a warm bottle loses carbonation as it pours and the drink is flat before it reaches the table. Prosecco and cava work in most of these and cost less; the exception is anything where the wine is most of the glass, which is where the better bottle shows.',
  },
}

export function copyFor(kind: string, value: string): FacetCopy | undefined {
  return FACET_COPY[`${kind}:${value}`]
}
