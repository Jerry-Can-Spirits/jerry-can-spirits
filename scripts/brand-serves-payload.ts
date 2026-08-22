/**
 * Transient batch for scripts/create-brand-serves.ts.
 *
 * The measures come from the producer's published serve. Every word of prose is
 * ours. Reset this file once the batch is written.
 */
import type { Serve } from './create-brand-serves'

const HIGHBALL = 'e03fe14a-7571-43d8-8018-2b19029efd1c'

const FT = {
  gingerAle: '186ab240-a17d-47d4-be72-8cb669ba690c',
  sicilianLemonade: '9254f377-0488-4630-95c6-d819727b3518',
  aromaticTonic: 'f7932a65-8891-4841-8fcf-ecd267392f77',
  lemonTonic: '373c2ab2-ca1d-43a9-8546-0349fb19be12',
}

const ING = {
  whisky: '6Zrb0PrDHRD8EFb8AgXylr',
  gin: '0c670281-32c3-42f4-85b1-c604035d2f82',
  sloeGin: 'a3b719f2-dd9e-47d1-9794-58283fd237da',
  iceCubed: '6954983a-0faa-4d24-8e7e-413fb9b54c96',
  orangeSlice: 'ingredient-orange-slice',
  orangePeel: '518ae62a-d06c-4a66-82dc-5827b3a279d0',
  lemonSlice: 'ingredient-lemon-slice',
  limeSlice: 'ingredient-lime-wedge',
}

export const SERVES: Serve[] = [
  {
    slug: 'whisky-and-ginger-ale',
    name: 'Whisky & Ginger Ale',
    producer: 'Fever-Tree',
    description:
      'Two ingredients, one of which does most of the work. Whisky and ginger ale is the drink people reach for when they want whisky to last an hour rather than ten minutes, and the ginger ale decides whether that hour is worth having. A dry, properly gingery one sharpens the spirit and pushes the malt forward. A sweet one buries it under what tastes like flat lemonade with ambitions. The ratio here is three to one, which sounds generous to the mixer until you taste it against the two-to-one most pubs pour and notice the whisky is actually clearer at the longer measure. Orange is the garnish rather than lemon, and it is not decoration. Ginger and orange share a warm, slightly resinous note that lemon cuts straight through, so the peel oils sit with the drink instead of arguing with it. Build it in the glass, keep it cold, and do not stir it more than once.',
    expertTip:
      'Pour the ginger ale first, then the whisky through it. Ginger ale loses its carbonation the moment something heavier lands on top of it from a height, and a flat whisky and ginger is a genuinely miserable drink. Going in the other order lets the spirit fold down through the bubbles on its own.\n\nFill the glass properly. A half-filled glass of ice melts faster than a full one, because there is more warm air in contact with each cube. The drink you are trying to avoid is the one that starts sharp and ends up tasting of tired water at the bottom.\n\nIf the ginger ale is timid, no amount of good whisky will fix it. Buy the driest one you can find and let the spirit be the soft part.',
    baseSpirit: 'scotch',
    family: 'highballs',
    difficulty: 'novice',
    prepTime: 'PT2M',
    glasswareId: HIGHBALL,
    ingredients: [
      {
        name: 'Fever-Tree Ginger Ale',
        amount: '150ml',
        description:
          'The dominant flavour in the glass, so it is the decision that matters. Fever-Tree blend ginger from three origins and keep the sugar restrained, which is why the drink stays dry at this ratio. Any ginger ale that tastes sweet on its own will taste sweeter here.',
        ref: FT.gingerAle,
      },
      {
        name: 'Whisky',
        amount: '50ml',
        description:
          'A blended Scotch is the traditional choice and it suits the drink: the grain whisky gives the softness that stops the ginger from having a fight. Bourbon works and makes it rounder and sweeter. Save the single malt you actually care about — this is not the drink to lose it in.',
        ref: ING.whisky,
      },
      {
        name: 'Ice',
        amount: 'Fill the glass',
        description:
          'Cubed, and more than feels necessary. A full glass of ice dilutes more slowly than a half-full one, which is counterintuitive until the third mouthful of the underfilled version.',
        ref: ING.iceCubed,
      },
    ],
    garnishIds: [ING.orangeSlice],
    instructions: [
      'Fill a highball glass to the top with cubed ice.',
      'Pour in the ginger ale.',
      'Add the whisky over the top and let it settle through.',
      'Stir once, gently, from the bottom.',
      'Garnish with a slice of orange.',
    ],
    sections: [
      {
        heading: 'Where It Comes From',
        paragraphs: [
          'Whisky and ginger ale has an older and better-named ancestor: the Horse’s Neck. It began in the 1890s as a temperance drink — ginger ale, ice, and a lemon peel cut in one long spiral so it hung over the rim like a mane, which is where the name comes from. Spirit was added somewhere around 1910, and the drink kept the name.',
          'Ginger ale earned its place as a mixer for a reason that reflects poorly on the spirits of the day. Through American Prohibition it was the mixer of choice precisely because it was assertive enough to hide what it was mixed with. The habit outlasted the need, which is the usual way with drinking habits.',
          'The modern version drops the theatrical peel and swaps lemon for orange, and it is a better drink for it.',
        ],
      },
      {
        heading: 'Why Orange, Not Lemon',
        paragraphs: [
          'Ginger carries a warm, faintly resinous character that sits close to orange peel oil on the same part of the palate. They reinforce each other. Lemon does the opposite — it is sharper and more volatile, and it cuts across the ginger rather than sitting with it.',
          'The Horse’s Neck used lemon because it was a soft drink first and needed the lift. Once there is whisky in the glass, the drink has plenty of backbone and what it wants is width.',
        ],
      },
      {
        heading: 'Three To One',
        paragraphs: [
          'Most bars pour this at two to one and the result is muddier than people expect. At three to one the whisky reads more clearly, not less, because the ginger stops competing and starts framing.',
          'If it tastes weak at that ratio, the problem is almost always the ginger ale rather than the measure. A sweet mixer at any strength tastes like a soft drink with something in it.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Should I use ginger ale or ginger beer?',
        answer:
          'Ginger ale for this one. Ginger beer is heavier, sweeter and much more aggressively spiced — it makes a good drink with whisky, but a different one, closer in weight to a mule. Ginger ale keeps the whisky visible.',
      },
      {
        question: 'What whisky works best?',
        answer:
          'A blended Scotch. The grain component softens the ginger and the price makes the long measure painless. Bourbon gives a sweeter, rounder version. A heavily peated malt fights the ginger and generally loses.',
      },
      {
        question: 'Can I make it in advance for a party?',
        answer:
          'Measure the whisky into the glasses ahead of time and keep them in the fridge, but add the ginger ale as you serve. Anything carbonated that has sat mixed for twenty minutes is flat by the time it reaches anyone.',
      },
    ],
    flavorProfile: ['Dry', 'Gingery', 'Warming', 'Citrus', 'Long'],
    tags: ['long-drink', 'built', 'sessionable', 'classic'],
    keywords: [
      'whisky and ginger ale',
      'whisky ginger',
      'scotch and ginger ale',
      'highball',
      'ginger ale cocktail',
      'easy whisky cocktail',
      'two ingredient cocktail',
      'horse’s neck',
    ],
    metaTitle: 'Whisky & Ginger Ale',
    metaDescription:
      'The ginger ale decides this drink, not the whisky. Why three to one beats two to one, why the garnish is orange, and how to keep it from going flat.',
    relatedSlugs: ['whiskey-highball', 'moscow-mule', 'dark-and-stormy'],
  },

  {
    slug: 'pink-gin-and-tonic',
    name: 'Pink Gin & Tonic',
    producer: 'Fever-Tree',
    description:
      'The colour here comes from the tonic, not the gin, and that is the whole point of the drink. Aromatic tonic is tinted and flavoured with angostura bark, which means it carries the bitters into the glass ready-mixed — so what you are drinking is much closer to a genuine Royal Navy pink gin than most things sold under that name. The gin should be juniper-forward and unsweetened. Anything already pink and already sweet turns this into a sugary mess, because the tonic has brought the bitterness and the colour along on its own. Expect something drier and more bitter than the name suggests: cinchona from the tonic on one side, gentian and clove-like spice from the bark on the other, and juniper running underneath both. Orange peel over the top, expressed and dropped in. It is a bracing drink rather than a sweet one, and considerably more grown-up than the shelf of pink gins would lead anyone to expect.',
    expertTip:
      'Express the orange peel over the surface before you drop it in. Hold it skin-down about an inch above the drink and squeeze — you should see the oil break the surface. That oil is doing more work than the peel sitting in the glass ever will, and the difference between an expressed twist and a dropped one is obvious side by side.\n\nChill the glass if you have thirty seconds. Aromatic tonic loses its edge as it warms and the bitterness turns from bracing to slightly medicinal.\n\nDo not add bitters. People see the colour and reach for the Angostura out of habit. The tonic has already brought them, and a dash on top pushes the drink from bitter into astringent.',
    baseSpirit: 'gin',
    family: 'highballs',
    difficulty: 'novice',
    prepTime: 'PT2M',
    glasswareId: HIGHBALL,
    ingredients: [
      {
        name: 'Fever-Tree Aromatic Tonic Water',
        amount: '150ml',
        description:
          'Coloured and flavoured with angostura bark, which is what makes this a pink gin rather than a gin and tonic that happens to be pink. It brings bitterness and spice, so nothing else in the glass needs to.',
        ref: FT.aromaticTonic,
      },
      {
        name: 'Juniper-rich Gin',
        amount: '50ml',
        description:
          'A classic London Dry. The tonic is doing something assertive and a soft, floral, contemporary gin simply disappears underneath it. Avoid pink gin liqueurs entirely — they are sweetened, and the drink is already carrying enough.',
        ref: ING.gin,
      },
      {
        name: 'Ice',
        amount: 'Fill the glass',
        description:
          'Cubed and plenty of it. Aromatic tonic goes medicinal as it warms, so the job of the ice is to keep the drink cold rather than to make it colder.',
        ref: ING.iceCubed,
      },
    ],
    garnishIds: [ING.orangePeel],
    instructions: [
      'Fill a highball glass with cubed ice.',
      'Pour in the gin.',
      'Top with the aromatic tonic, pouring down the side of the glass.',
      'Express a strip of orange peel over the surface and drop it in.',
    ],
    sections: [
      {
        heading: 'Where It Comes From',
        paragraphs: [
          'Pink gin was originally gin and Angostura bitters, and it was medicine before it was a drink. Angostura was formulated in the 1820s by a German surgeon working in Venezuela, as a treatment for stomach complaints. The Royal Navy took it on for the same reason and mixed it with the gin already in the wardroom.',
          'That is the drink this serve is reaching back to. The bitters have simply moved into the tonic.',
        ],
      },
      {
        heading: 'What Pink Gin Means Now',
        paragraphs: [
          'Since about 2017 the phrase has meant something else entirely: a sweetened, fruit-flavoured, pink-coloured gin liqueur, usually berry-led and often well under the strength of a proper gin. It is a different product with the same name.',
          'That matters here because using one turns this drink into something quite unlike itself. The tonic has brought colour and bitterness; a sweet pink gin brings sugar and more colour, and the result loses the bitter spine that makes the original worth drinking.',
          'The serve calls for juniper-rich gin deliberately. It is the unsweetened half of a bitter drink.',
        ],
      },
      {
        heading: 'Two Kinds of Bitter',
        paragraphs: [
          'There are two separate bitternesses in the glass and they sit in different places. Quinine from the cinchona in the tonic is clean and drying and arrives late, towards the back of the palate. The angostura bark is warmer and more aromatic — gentian, a clove-ish spice — and it arrives early.',
          'Juniper bridges them. That is why a gin without much of it leaves the drink feeling like two separate halves that never quite meet.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Can I use a pink gin instead?',
        answer:
          'You can, but it stops being this drink. Most pink gins are sweetened liqueurs, and the aromatic tonic is already supplying the colour and the bitterness. Use an unsweetened, juniper-forward gin and let the tonic do the work.',
      },
      {
        question: 'Is it actually bitter?',
        answer:
          'Yes, more than the name suggests. There is quinine from the tonic and angostura bark on top of it. If that sounds like too much, Mediterranean or Indian tonic makes a softer drink with the same gin.',
      },
      {
        question: 'Why orange peel rather than lime?',
        answer:
          'The bark spice sits close to orange and lime cuts across it. Lime also adds acidity, and a drink built on two kinds of bitterness does not need a third sharp element competing for the same space.',
      },
    ],
    flavorProfile: ['Bitter', 'Aromatic', 'Juniper', 'Spiced', 'Dry'],
    tags: ['long-drink', 'built', 'aperitif', 'bitter'],
    keywords: [
      'pink gin and tonic',
      'aromatic tonic water',
      'pink gin',
      'angostura gin',
      'royal navy pink gin',
      'bitter gin cocktail',
      'gin and tonic variation',
    ],
    metaTitle: 'Pink Gin & Tonic',
    metaDescription:
      'The pink comes from the tonic, not the gin — which makes this closer to a Royal Navy pink gin than most things sold under the name.',
    relatedSlugs: ['gin-and-tonic', 'negroni', 'aperol-spritz'],
  },

  {
    slug: 'sloe-gin-and-lemon-tonic',
    name: 'Sloe Gin & Lemon Tonic',
    producer: 'Fever-Tree',
    description:
      'Sloe gin is not gin, which is the first thing worth knowing and the reason this drink behaves the way it does. It is a liqueur — sloes steeped in gin with sugar, usually landing somewhere around 25% — so it arrives sweet, soft, and considerably gentler than the spirit it started as. Put it in a long drink and the sweetness has nowhere to hide unless something sharp comes with it. Lemon tonic is that something. The citrus meets the sugar head-on and the quinine gives the whole thing a dry finish it would otherwise lack, leaving the sloe fruit — dark, plummy, faintly almond-like from the stones — sitting in the middle where it belongs. The result is low in alcohol and genuinely refreshing rather than merely sweet. It is an autumn drink by origin and a summer one by temperament, which is an unusual combination and part of why it works.',
    expertTip:
      'Taste your sloe gin before you build the drink. Homemade bottles vary enormously — sugar goes in by eye, and a batch made by someone with a sweet tooth can be almost double the sugar of a commercial one. If yours is on the sweet side, pull the measure back to 40ml rather than adding more tonic, which only makes a bigger drink rather than a drier one.\n\nSqueeze the lemon slice before it goes in. Sloe gin has plenty of fruit and almost no acid of its own, and a little juice does more for the balance than the garnish does for the look.\n\nIf you can, use a bottle that has had a year in the cupboard. The almond note from the stones deepens noticeably with age.',
    baseSpirit: 'liqueur',
    family: 'highballs',
    difficulty: 'novice',
    prepTime: 'PT2M',
    glasswareId: HIGHBALL,
    ingredients: [
      {
        name: 'Fever-Tree Sicilian Lemon Tonic Water',
        amount: '150ml',
        description:
          'Doing two jobs: the lemon supplies the acidity that sloe gin lacks, and the quinine dries out the finish. Plain tonic leaves the drink noticeably sweeter and lemonade leaves it sweeter still.',
        ref: FT.lemonTonic,
      },
      {
        name: 'Sloe Gin',
        amount: '50ml',
        description:
          'A liqueur rather than a gin, typically around 25%. Sweetness varies wildly between bottles, especially homemade ones — taste it first and adjust the measure rather than the tonic.',
        ref: ING.sloeGin,
      },
      {
        name: 'Ice',
        amount: 'Fill the glass',
        description:
          'Cubed. There is enough sugar here that a watery drink turns cloying rather than refreshing, so keep the glass full and the dilution slow.',
        ref: ING.iceCubed,
      },
    ],
    garnishIds: [ING.lemonSlice],
    instructions: [
      'Fill a highball glass with cubed ice.',
      'Pour in the sloe gin.',
      'Top with the lemon tonic, pouring down the side of the glass.',
      'Squeeze a slice of lemon over the drink and drop it in.',
      'Stir once from the bottom.',
    ],
    sections: [
      {
        heading: 'Where It Comes From',
        paragraphs: [
          'Sloes are the fruit of the blackthorn, a hedgerow shrub found across Britain, and they are close to inedible raw — astringent enough to dry the mouth out completely. Steeping them in gin with sugar is a way of getting something out of a fruit that otherwise resists being eaten.',
          'The tradition is domestic rather than commercial. Sloes are picked late in the year, traditionally after the first frost, the bottles go into a cupboard, and they come out months later. Shooting parties and cold weather are the usual associations, and both are seasonal.',
          'What this serve does is take it out of that season. There is nothing about the flavour that requires a hedgerow in November.',
        ],
      },
      {
        heading: 'Why It Needs Acid',
        paragraphs: [
          'Sloe gin is sweet and fruity with very little acidity of its own, and sweetness without acid reads as flat rather than as sweet. It is the same reason a fruit squash tastes better with lemon in it.',
          'The lemon tonic supplies both halves of the fix at once — citrus acid and quinine bitterness — which is more than plain tonic does. It is why the drink stays drinkable at a long measure instead of turning syrupy by the halfway point.',
        ],
      },
      {
        heading: 'The Almond Note',
        paragraphs: [
          'A good sloe gin has a faint marzipan character underneath the fruit. It comes from the stones, which release trace benzaldehyde during the steep — the same compound that gives almond extract its smell.',
          'It is subtle and it deepens with age, which is the honest argument for leaving a bottle alone for a year. In a long drink it sits right at the back and is the thing that separates a good sloe gin from a merely fruity one.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Is sloe gin actually gin?',
        answer:
          'No. It is a liqueur made by steeping sloes and sugar in gin, usually bottled around 25% rather than the 37.5% minimum a gin has to meet. That is why it is sweet, and why it behaves differently in a long drink.',
      },
      {
        question: 'Can I use ordinary tonic?',
        answer:
          'You can, and the drink is noticeably sweeter for it. Sloe gin brings fruit and sugar but almost no acidity, so the lemon in the tonic is doing real balancing work rather than just adding flavour.',
      },
      {
        question: 'Does homemade sloe gin work?',
        answer:
          'Better than most commercial bottles, usually. Just taste it first — homemade sugar levels vary enormously, and a sweet batch wants a shorter measure rather than more tonic.',
      },
    ],
    flavorProfile: ['Fruity', 'Sweet', 'Tart', 'Almond', 'Refreshing'],
    tags: ['long-drink', 'built', 'low-abv', 'sessionable'],
    keywords: [
      'sloe gin and tonic',
      'sloe gin cocktail',
      'lemon tonic water',
      'sloe gin long drink',
      'low alcohol cocktail',
      'british hedgerow liqueur',
      'what to do with sloe gin',
    ],
    metaTitle: 'Sloe Gin & Lemon Tonic',
    metaDescription:
      'Sloe gin is a liqueur, not a gin, and that changes how you build with it. Why lemon tonic beats plain, and how to adjust for a sweet bottle.',
    relatedSlugs: ['sloe-gin-fizz', 'gin-and-tonic', 'aperol-spritz'],
  },

  {
    slug: 'sicilian-shandy',
    name: 'Sicilian Shandy',
    producer: 'Fever-Tree',
    description:
      'A shandy built the other way round. The traditional British version is roughly half beer and half lemonade; this one is five parts lemonade to one of lager, which makes it a lemonade with a beery edge rather than a beer that has been lengthened. Taken on those terms it is a good drink and a genuinely useful one — it sits somewhere near one percent alcohol, which is a real category of thing to hand someone on a hot afternoon. The Sicilian lemonade is what carries it. It is made with lemon juice rather than lemon flavouring, so it is sharper and less sugary than the bottled lemonade most shandies are built from, and it needs that sharpness to stand up to even a small measure of lager. Use a clean, cold, unremarkable lager. This is not the drink for anything hoppy, and it is emphatically not the drink for a good IPA.',
    expertTip:
      'Pour the lager in last and pour it gently. Beer foams against anything, and a shandy that has been built beer-first arrives as a glass of foam with liquid underneath it. Tilt the glass and let it run down the side.\n\nIf you want the traditional balance, go to equal parts and accept that it becomes a different and considerably beerier drink. The published measure is deliberately light, and worth trying as written before adjusting — most people expect it to taste watery and find that it does not.\n\nAvoid anything hoppy. Bitterness from hops and acidity from lemon pull in opposite directions, and a pale ale here tastes like a mistake rather than a variation.',
    baseSpirit: 'beer',
    family: 'other',
    difficulty: 'novice',
    prepTime: 'PT2M',
    glasswareId: HIGHBALL,
    ingredients: [
      {
        name: 'Fever-Tree Sicilian Lemonade',
        amount: '250ml',
        description:
          'Made with real lemon juice, which is why it is sharp enough to carry the drink. A standard sweet bottled lemonade in its place gives you something much closer to a soft drink.',
        ref: FT.sicilianLemonade,
      },
      {
        name: 'Lager',
        amount: '50ml',
        description:
          'A clean, cold, unfussy one. The lager is providing body and a faint bready bitterness, not flavour of its own. Hoppy beers fight the lemon and lose.',
      },
      {
        name: 'Ice',
        amount: 'Fill the glass',
        description:
          'Cubed. Both components should already be cold from the fridge — the ice is there to keep them that way rather than to chill them from room temperature.',
        ref: ING.iceCubed,
      },
    ],
    garnishIds: [ING.limeSlice],
    instructions: [
      'Fill a highball glass with cubed ice.',
      'Pour in the Sicilian lemonade.',
      'Tilt the glass and add the lager slowly down the side.',
      'Garnish with a slice of lime.',
    ],
    sections: [
      {
        heading: 'Where It Comes From',
        paragraphs: [
          'The shandy is British and old enough to have an odd name attached to it: shandygaff, which appears in print from the 1850s and originally meant beer mixed with ginger beer. The lemonade version came later and eventually took over the word entirely.',
          'Germany has a parallel in the Radler, beer and lemon soda. The often-repeated story that a Munich innkeeper invented it in 1922 to stretch his supply for a crowd of cyclists is repeated more confidently than the evidence supports, but the drink itself is genuine and widespread.',
          'What both versions share is purpose. A shandy exists to be drunk in quantity in warm weather without consequence.',
        ],
      },
      {
        heading: 'Why the Ratio Is Not a Mistake',
        paragraphs: [
          'Five to one looks wrong next to a pub shandy and it is worth understanding before adjusting it. At half and half, the beer dominates and the lemonade reads as a sweetener. At five to one the beer stops being a flavour and becomes a texture — it adds weight, a little bready bitterness, and a softer carbonation than the lemonade has alone.',
          'The result is a lemonade with more going on rather than a diluted beer. Whether that is what you want is a fair question, but it is a deliberate drink rather than a mismeasured one.',
        ],
      },
      {
        heading: 'Real Lemon Matters Here',
        paragraphs: [
          'With this little beer in the glass, the lemonade has almost nowhere to hide. Most bottled lemonade is sweet, lightly acidic and flavoured rather than juiced, and at 250ml that becomes obvious.',
          'A lemonade made with actual lemon juice has a sharper, less rounded acidity and a bitterness in the finish from the peel oils. Both are doing structural work in a drink this simple.',
        ],
      },
    ],
    faqs: [
      {
        question: 'How strong is it?',
        answer:
          'Around one percent, depending on the lager. That is roughly a third of a traditional half-and-half shandy and well below a standard beer, which is the point of building it this way.',
      },
      {
        question: 'What beer should I use?',
        answer:
          'A clean lager — the kind that is unremarkable on its own. Hoppy beers clash with the lemon acidity, and anything dark or malty overwhelms the drink at any ratio.',
      },
      {
        question: 'Can I make it a proper shandy?',
        answer:
          'Go to equal parts and it becomes one. It is a beerier, less refreshing drink and considerably stronger. Try the published ratio first — it is lighter than it sounds but not as thin as most people expect.',
      },
    ],
    flavorProfile: ['Tart', 'Light', 'Bready', 'Refreshing'],
    tags: ['long-drink', 'built', 'low-abv', 'sessionable'],
    keywords: [
      'sicilian shandy',
      'shandy recipe',
      'lager and lemonade',
      'low alcohol drink',
      'radler',
      'shandygaff',
      'summer beer drink',
    ],
    metaTitle: 'Sicilian Shandy',
    metaDescription:
      'A shandy built five to one rather than half and half — a lemonade with a beery edge, around one percent, and deliberately so.',
    relatedSlugs: ['pimms-cup', 'moscow-mule', 'gin-and-tonic'],
  },
]
