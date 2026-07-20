export type VenueSlug = 'pub' | 'cocktail-bar' | 'nightclub' | 'hotel'

export interface BartenderGuide {
  venue_slug: VenueSlug
  venue_label: string
  what_it_is: string
  serves: Array<{
    heading: string
    name: string
    build: string
    notes?: string
  }>
  three_things: string[]
  what_to_say: Array<{
    scenario: string
    response: string
  }>
  about: string
}

export const BARTENDER_GUIDES: Record<VenueSlug, BartenderGuide> = {
  pub: {
    venue_slug: 'pub',
    venue_label: 'Traditional pub edition',
    what_it_is:
      'A spiced rum macerated with real ingredients. Vanilla, cinnamon, allspice, clove, orange peel, cassia, ginger, agave, bourbon oak. Caribbean rum base, 40% ABV. No artificial flavourings, no essences. Properly built, not factory-flavoured.',
    serves: [
      {
        heading: 'Your default serve',
        name: 'Expedition & Ginger',
        build: 'Double over ice, top with ginger ale or ginger beer, orange wheel. Fast, reliable, doesn’t tie up the bar.',
        notes: 'Ginger ale for a softer build. Ginger beer if the guest likes more bite. Ask first.',
      },
      {
        heading: 'When they want to taste it',
        name: 'Neat',
        build: 'Rocks glass, no ice. Offer as a half measure if someone’s curious. Once they’ve tasted it, they’ll know what they want next.',
      },
      {
        heading: 'When they’ve got time',
        name: 'Old Fashioned Lite',
        build: 'Double over a large ice cube. Fresh orange peel twisted over the top and dropped in. No sugar, no bitters. The rum does the work.',
      },
    ],
    three_things: [
      'Real ingredients. No artificial flavourings.',
      'Veteran-owned British brand.',
      'Default pour: double with ginger ale or ginger beer, orange wheel.',
    ],
    what_to_say: [
      {
        scenario: 'If they ask what it is',
        response: '"Spiced rum, but a proper one. Real ingredients, no artificial flavourings. Goes great with ginger ale and orange."',
      },
      {
        scenario: 'If they ask if it’s any good',
        response: '"Not the supermarket stuff. Caribbean rum base, real spices, veteran-owned. Want me to do you one with ginger?"',
      },
      {
        scenario: 'If they ask what it tastes like',
        response: '"Vanilla, cinnamon, clove, orange. Warm spice, not sweet. Try it with ginger, or neat if you want the full picture."',
      },
    ],
    about:
      'Jerry Can Spirits is veteran-owned and bootstrapped. Two Royal Signals veterans. 5% of profits go to military charities. This is their first release. jerrycanspirits.co.uk.',
  },

  'cocktail-bar': {
    venue_slug: 'cocktail-bar',
    venue_label: 'Cocktail bar edition',
    what_it_is:
      'A spiced rum macerated with real ingredients. Vanilla, cinnamon, allspice, clove, orange peel, cassia, ginger, agave. Finished on bourbon oak. Caribbean rum base, 40% ABV. No essences. No artificial flavourings. Macerated at our British partner distillery.',
    serves: [
      {
        heading: 'Lead with this',
        name: 'Old Standard',
        build: 'Our take on the Rum Old Fashioned. Expedition Spiced over a large ice cube, sugar, Angostura, orange peel expressed and dropped in. Full build is on the Field Manual.',
        notes: 'This is the serve that shows what the rum actually is.',
      },
      {
        heading: 'The stripped-back version',
        name: 'Old Fashioned Lite',
        build: 'Same idea, no sugar, no bitters. Just the rum over a large cube with fresh orange peel. For guests who want the spirit alone.',
      },
      {
        heading: 'The long drink',
        name: 'Storm & Spice',
        build: 'Our Dark & Stormy. Expedition Spiced, ginger beer, fresh lime. Built tall over cubed ice. Recipe on the Field Manual.',
        notes: 'Ginger beer for the traditional bite. Sub ginger ale if the guest prefers softer. Ask first.',
      },
      {
        heading: 'For the tasting-curious',
        name: 'Neat',
        build: 'Rocks glass, no ice. Offer a half measure to anyone asking what it tastes like. Most guests will follow with a full pour built their way.',
      },
    ],
    three_things: [
      'Real spices, properly macerated. No essences, no shortcuts.',
      'Caribbean rum base, finished on bourbon oak.',
      'Storm & Spice and Old Standard are the two house serves. Both on the Field Manual.',
    ],
    what_to_say: [
      {
        scenario: 'If they ask what it is',
        response: '"British spiced rum, Caribbean base. Real ingredients, finished on bourbon oak. Goes well over a large cube with an orange peel."',
      },
      {
        scenario: 'If they ask what it tastes like',
        response: '"Warm spice, not sweet. Vanilla, cinnamon, clove, orange. Bourbon oak underneath. I’d serve it over a large cube with peel, or neat if you want to read it properly."',
      },
      {
        scenario: 'If they want a long drink',
        response: '"Storm & Spice. Our Dark & Stormy with Expedition. Ginger beer for the bite, lime, served tall. Or ginger ale if you’d prefer it softer."',
      },
    ],
    about:
      'Jerry Can Spirits is veteran-owned and bootstrapped. Two Royal Signals veterans. Macerated at our British partner distillery. 5% of profits go to military charities. This is their first release. jerrycanspirits.co.uk.',
  },

  nightclub: {
    venue_slug: 'nightclub',
    venue_label: 'Nightclub edition',
    what_it_is:
      'British spiced rum. Caribbean rum base. Real ingredients, no artificial flavourings. 40% ABV.',
    serves: [
      {
        heading: 'The pour',
        name: 'Double + ginger + orange wheel',
        build: 'Single mixer. Single garnish. Built for service.',
        notes: 'Ginger ale for softer, ginger beer for bite.',
      },
      {
        heading: 'If they want to try it first',
        name: 'Half measure neat',
        build: 'Quick taste. They’ll know what they want next.',
      },
    ],
    three_things: [
      'Default pour: double, ginger, orange wheel.',
      'Veteran-owned. Real ingredients.',
      'Ginger ale for softer, ginger beer for bite.',
    ],
    what_to_say: [
      {
        scenario: 'What is it',
        response: '"Spiced rum, real ingredients."',
      },
      {
        scenario: 'Is it any good',
        response: '"Better than the well. Veteran-owned. Want one?"',
      },
      {
        scenario: 'What does it taste like',
        response: '"Warm spice. Vanilla, clove, orange. Try it with ginger."',
      },
      {
        scenario: 'If they push back on price',
        response: '"Real ingredients. Veteran-owned British brand. Not the same as the well spiced."',
      },
    ],
    about:
      'Jerry Can Spirits. Veteran-owned, bootstrapped, British. 5% of profits to military charities. First release. jerrycanspirits.co.uk.',
  },

  hotel: {
    venue_slug: 'hotel',
    venue_label: 'Hotel bar edition',
    what_it_is:
      'A spiced rum macerated with real ingredients. Vanilla, cinnamon, allspice, clove, orange peel, cassia, ginger, agave, bourbon oak. Caribbean rum base, 40% ABV. No essences, no artificial flavourings. Macerated at our British partner distillery. Founded by two Royal Signals veterans. 5% of profits go to military charities.',
    serves: [
      {
        heading: 'How to serve it',
        name: 'Neat',
        build: 'Rocks glass, no ice. The serve for guests who want to read the spirit properly. Offer as a half measure for anyone tasting-curious. Pair with the brand story.',
      },
      {
        heading: 'After dinner',
        name: 'Old Fashioned Lite',
        build: 'Double over a large ice cube. Fresh orange peel twisted over the top and dropped in. No sugar, no bitters. Works as a digestif.',
      },
      {
        heading: 'Aperitif',
        name: 'Expedition & Ginger',
        build: 'Double, ginger ale or ginger beer, orange wheel.',
        notes: 'Ginger ale for softer, ginger beer for bite. Ask the guest.',
      },
    ],
    three_things: [
      'Real ingredients, properly macerated. Made at our British partner distillery.',
      'Veteran-owned British brand. 5% of profits to military charities.',
      'Best appreciated neat or over a large cube. Let the spirit show.',
    ],
    what_to_say: [
      {
        scenario: 'If they ask what it is',
        response: '"British spiced rum, Caribbean rum base. Real ingredients, produced in small batches in Britain. Veteran-owned. I’d recommend it neat or over a large cube with a twist of orange."',
      },
      {
        scenario: 'If they ask about the brand',
        response: '"Founded by two Royal Signals veterans. Bootstrapped, no investors. 5% of profits go to military charities. This is their first release."',
      },
      {
        scenario: 'If they’re choosing a digestif',
        response: '"Works beautifully after dinner. Double over a large cube, fresh orange peel. Lets the bourbon oak come through."',
      },
    ],
    about:
      'Jerry Can Spirits is veteran-owned and bootstrapped. Two Royal Signals veterans, no investors, real ingredients. Macerated at our British partner distillery. 5% of profits go to military charities. Expedition Spiced is their first release. jerrycanspirits.co.uk.',
  },
}

export const VENUE_SLUGS: VenueSlug[] = ['pub', 'cocktail-bar', 'nightclub', 'hotel']

export const VENUE_TITLES: Record<VenueSlug, string> = {
  pub: 'Traditional Pub',
  'cocktail-bar': 'Cocktail Bar',
  nightclub: 'Nightclub',
  hotel: 'Hotel & Restaurant',
}
