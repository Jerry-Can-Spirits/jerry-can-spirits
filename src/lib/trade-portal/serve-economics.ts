// The serve economics sheet: what a pour of Expedition costs a venue at its
// trade price, what each house serve costs built, and what it returns at the
// menu prices a bar charges. The rum price is never held here; the page reads
// it live and passes the pence in, the same way the pricing sheet does, so
// this sheet and checkout cannot disagree. Everything else is a stated
// assumption a venue can swap for its own figure.

export const BOTTLE_ML = 700
export const POUR_ML = 50
export const SERVES_PER_BOTTLE = BOTTLE_ML / POUR_ML

/** Menu prices a venue is likely to charge, inc VAT, in pence. */
export const MENU_PRICES_P = [800, 900, 1000] as const

export interface Serve {
  slug: string
  name: string
  /** The build, as a bartender reads it. */
  build: string
  touches: number
  seconds: number
  /** Everything in the glass except the rum, ex VAT, in pence. */
  ingredientsP: number
  /** What the ingredient figure assumes, so a venue can check it against its own costs. */
  assumes: string
  /** Where the serve sits for a bar: the speed rail or the cocktail list. */
  placement: string
}

export const SERVES: Serve[] = [
  {
    slug: 'expedition-and-cola',
    name: 'Expedition and Cola',
    build: '50ml Expedition, 150ml Franklin and Sons cola, no ice.',
    touches: 2,
    seconds: 30,
    ingredientsP: 85,
    assumes: 'one 200ml bottle of cola at 85p',
    placement: 'Speed rail. The serve the IWSC gave Silver.',
  },
  {
    slug: 'storm-and-spice',
    name: 'Storm and Spice',
    build: '50ml Expedition, 150ml ginger beer, 15ml fresh lime, two dashes of Angostura, built over ice.',
    touches: 3,
    seconds: 45,
    ingredientsP: 108,
    assumes: 'one 200ml bottle of ginger beer at 85p, lime 10p, bitters 8p, ice and garnish 5p',
    placement: 'Speed rail. The ginger beer sets the margin.',
  },
  {
    slug: 'the-old-standard',
    name: 'The Old Standard',
    build: '50ml Expedition, 10ml demerara syrup, two dashes of Angostura, one dash of orange bitters, stirred over ice, orange peel.',
    touches: 3,
    seconds: 60,
    ingredientsP: 27,
    assumes: 'syrup 5p, bitters 12p, ice and peel 10p',
    placement: 'Speed rail at the limit. The highest margin of the four.',
  },
  {
    slug: 'explorers-gold',
    name: "Explorer's Gold",
    build: '50ml Expedition, 25ml honey syrup, 25ml fresh lemon, two dashes of Angostura, egg white, shaken.',
    touches: 5,
    seconds: 90,
    ingredientsP: 63,
    assumes: 'honey syrup 20p, lemon 15p, bitters 8p, egg white 15p, ice and garnish 5p',
    placement: 'Cocktail list, not the speed rail.',
  },
]

const VAT_DIVISOR = 1.2

/** A VAT-inclusive price in pence, ex VAT. */
export function exVatP(incVatP: number): number {
  return Math.round(incVatP / VAT_DIVISOR)
}

/** What one pour of rum costs from a bottle bought at this ex VAT price. */
export function rumPerServeP(bottleExVatP: number): number {
  return Math.round(bottleExVatP / SERVES_PER_BOTTLE)
}

export function buildCostP(serve: Serve, rumP: number): number {
  return rumP + serve.ingredientsP
}

/** Gross profit on the ex VAT menu price, the way a bar measures it, as a whole percentage. */
export function grossProfitPct(menuIncVatP: number, buildP: number): number {
  const net = exVatP(menuIncVatP)
  return Math.round(((net - buildP) / net) * 100)
}

/** Serves in a case of this many bottles. */
export function servesPerCase(bottlesPerCase: number): number {
  return bottlesPerCase * SERVES_PER_BOTTLE
}
