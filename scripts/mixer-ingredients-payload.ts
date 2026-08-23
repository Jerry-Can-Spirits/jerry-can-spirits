/**
 * Transient batch for scripts/create-mixer-ingredients.ts.
 *
 * Facts come from the producer's published product copy, pulled by
 * scripts/fetch-franklin-serves.ts --products. The sentences are ours.
 *
 * `history` is about the category, never the SKU. A tonic water launched in the
 * last decade has no history of its own, and the Franklin & Sons 1886 date
 * belongs to the company rather than to any bottle in the current range.
 *
 * Reset this file once the batch is written.
 */
import type { Mixer } from './create-mixer-ingredients'

const PARENT = {
  tonic: 'ingredient-tonic-water',
  soda: 'ingredient-soda-water',
  grapefruitSoda: 'ingredient-grapefruit-soda',
}

const FT = {
  pinkGrapefruit: '07c958d4-ef9b-435d-bc2c-99567c36afdb',
  elderflowerTonic: '26ba335a-c052-40f2-826b-9312d7b02dc7',
  cucumberTonic: '9b9d15fd-0c68-4b28-92be-2aeb60349b6c',
  lemonTonic: '373c2ab2-ca1d-43a9-8546-0349fb19be12',
  sodaWater: '5ed15feb-74c9-443b-b090-1173407c3952',
  mediterraneanTonic: '36d1ecea-0596-48c8-bd9e-2f2d5d5924ee',
}

const FS_INDIAN = 'ingredient-fs-indian-tonic'

export const MIXERS: Mixer[] = [
  {
    slug: 'franklin-sons-pink-grapefruit-soda',
    name: 'Franklin & Sons Pink Grapefruit Soda',
    parentId: PARENT.grapefruitSoda,
    description:
      'Pink grapefruit and lime, both as juice rather than flavouring, over sparkling water. The lime is the detail worth knowing: it is already in the bottle, which changes how much a Paloma needs on top.',
    history:
      'Grapefruit soda is Mexican by adoption rather than invention. The Paloma is built on it, and in Mexico that has long meant Squirt or Jarritos — sweeter, brasher drinks than this. The premium-mixer era brought a drier reading of the same idea, aimed at tequila that is worth tasting.',
    origin: 'United Kingdom; the 1886 soft-drinks house',
    usage:
      'Roughly 100ml over 50ml of blanco or reposado tequila, which is a Paloma. It also lengthens gin surprisingly well, where the pith bitterness stands in for tonic without bringing quinine along with it.',
    storage: 'Cool and sealed. Cold for service.',
    professionalTip:
      'Taste before you add lime. There is lime juice in the soda already, and a Paloma built as though there is not will finish sharp and thin rather than rounded.',
    topTips: [
      'Cut the lime you add by about half against a recipe written for plain grapefruit soda. The juice is already in there.',
      'Salt the rim rather than the drink. Grapefruit pith is bitter, and salt on the glass meets it a sip at a time instead of all at once.',
      'Reposado over blanco if the drink tastes hollow. The barrel time gives the grapefruit something with weight to sit against.',
    ],
    substitutions: [
      'Fever-Tree Sparkling Pink Grapefruit: the parallel product, drier and without the lime',
      'Grapefruit juice with soda water: closer to a Salty Dog, and you control the lime yourself',
    ],
    keywords: [
      'pink grapefruit soda',
      'paloma mixer',
      'franklin and sons grapefruit',
      'grapefruit soda tequila',
      'best paloma soda',
    ],
    primary: ['Pink grapefruit', 'Lime', 'Pith bitterness'],
    strength: 'medium',
    tasting:
      'Grapefruit first and sharper than sweet, with the lime arriving underneath it and a dry, faintly bitter finish from the pith.',
    sections: [
      {
        heading: 'What Makes It Different',
        paragraphs: [
          'Most grapefruit sodas are built on flavouring and sugar, and taste of grapefruit the way boiled sweets taste of fruit. This one carries pink grapefruit and lime as juice, which is why it reads tart before it reads sweet.',
          'The lime is the part that catches people out. A Paloma recipe usually calls for a squeeze on top, written on the assumption that the soda has none. Here it does, and following the recipe exactly tips the drink sour.',
        ],
      },
      {
        heading: 'Why Grapefruit Suits Tequila',
        paragraphs: [
          'Tequila has a vegetal, faintly peppery edge from the agave that most fruit flavours fight. Grapefruit does not fight it — the bitterness in the pith runs alongside that pepper rather than trying to cover it.',
          'It is the same logic that makes grapefruit work with gin. Both spirits are aromatic and slightly bitter to start with, and grapefruit meets them rather than sweetening them into something else.',
        ],
      },
      {
        heading: 'Beyond the Paloma',
        paragraphs: [
          'Poured over gin it does much of what a tonic does, minus the quinine, which suits anyone who finds tonic medicinal. It is also a good length for mezcal, where the smoke needs something bitter rather than something sweet to sit against.',
          'What it does not suit is anything already sweet. Grapefruit and a liqueur-forward build turn cloying quickly, because there is not enough acid left to hold the sugar down.',
        ],
      },
      {
        heading: 'Serving It',
        paragraphs: [
          'Cold, in a highball or a wine glass, over a full load of cubed ice. Grapefruit aromatics fade fast as a drink warms, and a half-filled glass gets there sooner.',
          'Salt belongs on the rim rather than stirred through. It meets the bitterness gradually instead of flattening the whole drink at once.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Do I still need to add lime to a Paloma?',
        answer:
          'Less than the recipe says, and sometimes none. There is lime juice in the soda already. Taste it first, then add a squeeze only if the drink needs sharpening.',
      },
      {
        question: 'How does it compare to Fever-Tree Sparkling Pink Grapefruit?',
        answer:
          'The Fever-Tree is drier and grapefruit alone; this carries lime as well, so it lands rounder and slightly tarter. Both make a good Paloma and the lime measure is what changes between them.',
      },
      {
        question: 'Can I use it with gin?',
        answer:
          'Yes, and it works well. The pith bitterness does much of what tonic does without the quinine, which suits people who find tonic too medicinal.',
      },
    ],
    relatedIds: [FT.pinkGrapefruit, PARENT.grapefruitSoda],
    metaTitle: 'F&S Pink Grapefruit Soda: the Paloma Mixer',
    metaDescription:
      'Grapefruit and lime as juice, not flavouring — which changes how much lime a Paloma actually needs. What it is and which spirits it suits.',
  },

  {
    slug: 'franklin-sons-rosemary-black-olive-tonic-water',
    name: 'Franklin & Sons Rosemary & Black Olive Tonic Water',
    parentId: PARENT.tonic,
    description:
      'A savoury tonic, which is a genuinely unusual thing. Rosemary and black olive over cinchona bark extract, with the carbonation pushed up and the sugar pulled back. It is closer to a dry vermouth in intent than to a fruit mixer.',
    history:
      'Tonic water spent a century as one flavour, then a decade as twenty. The premium-mixer era opened the category to citrus, florals and fruit, but almost all of those went sweeter. Savoury is the road less taken, and it arrived alongside the low-intervention aperitivo drinking that made olives and brine respectable in a glass again.',
    origin: 'United Kingdom; the 1886 soft-drinks house',
    usage:
      'About 150ml over 50ml of a herbaceous gin, reposado tequila or a good vermouth. It is a mixer that suits being the second-loudest thing in the drink rather than the length on top of a spirit.',
    storage: 'Cool and sealed. Cold for service.',
    professionalTip:
      'Garnish it savoury or not at all. An olive or a rosemary sprig belongs; a wedge of lime does not, and citrus acid pulls the drink back towards an ordinary G&T.',
    topTips: [
      'Skewer an olive rather than reaching for citrus. The brine picks up the olive note instead of covering it.',
      'It suits vermouth better than most tonics do. Fifty millilitres of a bianco with this on top is a complete drink.',
      'Choose a gin with rosemary, thyme or bay in it. Juniper alone leaves a gap where the herbs should meet.',
    ],
    substitutions: [
      'Fever-Tree Mediterranean Tonic: herbal rather than savoury, and sweeter',
      'Dry vermouth with soda water: a different route to the same savoury register',
    ],
    keywords: [
      'rosemary tonic water',
      'savoury tonic',
      'black olive tonic',
      'mediterranean gin and tonic',
      'vermouth mixer',
    ],
    primary: ['Rosemary', 'Black olive', 'Quinine'],
    strength: 'bold',
    tasting:
      'Herbal and briny before it is bitter, with the rosemary sitting on top and a dry, faintly saline finish where a fruit tonic would leave sweetness.',
    sections: [
      {
        heading: 'A Savoury Tonic',
        paragraphs: [
          'Almost every flavoured tonic moves towards fruit or flowers. This one moves the other way, and that single decision is what makes it worth having on a shelf that already holds three tonics.',
          'Black olive is the surprising half. It brings a faint salinity and a soft, slightly oily depth that reads as savoury without ever tasting of tapenade. Rosemary carries the top end and does the work most people notice first.',
        ],
      },
      {
        heading: 'Why Salt Belongs in a Drink',
        paragraphs: [
          'A trace of salinity suppresses bitterness and lifts aroma, which is why a pinch of salt improves a grapefruit drink and why saline solution sits behind many bars. In a tonic it means the quinine reads as dry rather than as harsh.',
          'That is also why the drink can carry less sugar than a standard tonic without tasting austere. Sugar is one way to soften quinine; salt is another, and it does not add weight.',
        ],
      },
      {
        heading: 'What to Pour Into It',
        paragraphs: [
          'Herbaceous gins are the obvious partners — anything leaning on rosemary, thyme, bay or sage will meet the tonic halfway. A purely juniper-led London Dry works but leaves the herbs unaccompanied.',
          'Reposado tequila is the more interesting choice. The barrel softness and the agave pepper both sit comfortably against brine, and it makes a drink most people will not have had before.',
          'Vermouth is the third route, and arguably the best value. A bianco or a dry vermouth lengthened with this is a complete aperitif at a fraction of the alcohol of a gin build.',
        ],
      },
      {
        heading: 'Garnish',
        paragraphs: [
          'Olives on a skewer, a rosemary sprig clapped once, or a strip of lemon peel expressed and discarded. All three extend what is already in the glass.',
          'Lime is the mistake to avoid. It is sharp enough to flatten both the herbs and the brine, and the drink collapses back into a fairly ordinary gin and tonic.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Does it actually taste of olives?',
        answer:
          'Not in an obvious way. The olive reads as salinity and a soft savoury depth rather than as a recognisable olive flavour. The rosemary is the note most people identify first.',
      },
      {
        question: 'Which gin should I use?',
        answer:
          'One with herbs in it — rosemary, thyme, bay or sage. A juniper-only London Dry works but leaves the tonic doing all the herbal work on its own.',
      },
      {
        question: 'Is it very bitter?',
        answer:
          'Drier than most tonics rather than more bitter. The salinity softens the quinine, which is why it carries less sugar without tasting austere.',
      },
    ],
    relatedIds: [FT.mediterraneanTonic, PARENT.tonic],
    metaTitle: 'F&S Rosemary & Black Olive Tonic: the Savoury One',
    metaDescription:
      'A savoury tonic rather than a sweet one. Why salinity makes quinine read dry, which spirits suit it, and why lime is the garnish to avoid.',
  },

  {
    slug: 'franklin-sons-1886-soda-water',
    name: 'Franklin & Sons 1886 Soda Water',
    parentId: PARENT.soda,
    description:
      'Soda water built for carbonation above all else. In a highball the bubbles are not a texture but an ingredient, and the difference between a lively soda and a tired one is the difference between the drink working and not.',
    history:
      'Carbonated water is a Georgian invention that became a Victorian industry, and it is where nearly every soft-drinks house began, this one included. The highball then made it a bar staple twice over: once in America around the turn of the last century, and again through Japan, where the balance of whisky to soda is treated as a craft in itself.',
    origin: 'United Kingdom; the 1886 soft-drinks house',
    usage:
      'Anywhere from 100ml to 200ml over 50ml of spirit. It is the mixer for a whisky highball, and the one that dilutes a spirit without adding a flavour that has to be accounted for.',
    storage: 'Cool, sealed, and cold before opening. Small bottles for service.',
    professionalTip:
      'Open it cold and pour it once. Carbonation escapes fastest from warm liquid and from anything stirred, so build the drink around the soda rather than stirring the soda into the drink.',
    topTips: [
      'Buy small bottles. A large one is flat by the third drink and the third drink is the one you notice.',
      'Chill the soda, not just the glass. Cold liquid holds gas; warm liquid gives it up on the way out of the bottle.',
      'Stir once from the bottom, if at all. Every additional turn costs carbonation the drink cannot get back.',
    ],
    substitutions: [
      'Fever-Tree Premium Soda Water: the parallel product',
      'Sparkling mineral water: usually softer carbonation and its own mineral character',
    ],
    keywords: [
      'soda water',
      'highball soda',
      'best soda water whisky',
      'franklin and sons soda',
      'carbonated water mixer',
    ],
    primary: ['Clean', 'Sharply carbonated'],
    strength: 'light',
    tasting:
      'Neutral by design, with the carbonation doing the work — brisk and prickly rather than soft, and a clean finish that leaves the spirit where it was.',
    sections: [
      {
        heading: 'Carbonation Is the Ingredient',
        paragraphs: [
          'In a drink with two components and no flavour from one of them, the only variable the soda controls is how it feels. Sharp carbonation carries aroma up out of the glass and gives the drink a texture that reads as refreshing; soft carbonation makes the same spirit taste heavier and flatter.',
          'This is the reason bartenders are fussy about bottle size and opening technique in a way that looks like affectation from the outside. It is not about the water. It is about the gas dissolved in it.',
        ],
      },
      {
        heading: 'Soda Water, Sparkling Water, Mineral Water',
        paragraphs: [
          'They are not interchangeable, though they are used as though they are. Soda water is carbonated and usually carries added mineral salts, traditionally sodium bicarbonate, which gives it a very faint saline edge. Sparkling water is carbonated and nothing else. Sparkling mineral water is naturally mineral-bearing and often more softly carbonated.',
          'For a highball, soda water is the traditional choice and the trace salinity is part of why. As with a savoury tonic, a little salt suppresses bitterness and lifts aroma.',
        ],
      },
      {
        heading: 'The Japanese Highball',
        paragraphs: [
          'Japan takes whisky and soda more seriously than anywhere else, and the technique reflects that: the glass and the whisky are chilled beforehand, the ice is hard and clear, the soda is poured down a bar spoon to preserve the gas, and the drink is stirred exactly once.',
          'None of that is ceremony for its own sake. Each step exists to keep carbon dioxide in the liquid rather than in the air above it, because that is the entire difference between a good highball and a disappointing one.',
        ],
      },
      {
        heading: 'What to Pour Into It',
        paragraphs: [
          'Whisky is the classic and the one the technique was built around, but soda is the most neutral thing behind a bar and it lengthens almost anything without editorialising.',
          'It is also the right choice when the drink already has plenty going on. A build with a liqueur, a syrup and a bitter does not need a mixer with opinions; it needs length and lift.',
        ],
      },
    ],
    faqs: [
      {
        question: 'What is the difference between soda water and sparkling water?',
        answer:
          'Soda water is carbonated and usually carries added mineral salts, traditionally sodium bicarbonate, which gives a very faint saline edge. Sparkling water is carbonated and nothing more. The trace salinity is part of why soda suits a highball.',
      },
      {
        question: 'Why do small bottles matter?',
        answer:
          'Because carbonation leaves the moment a bottle is opened and keeps leaving. A large bottle is noticeably flat by the third drink, and in a two-ingredient highball that flatness is the whole drink.',
      },
      {
        question: 'How much soda to whisky?',
        answer:
          'Between two and four parts to one, depending on the whisky and the hour. Three to one is a good starting point; a heavier or peatier whisky can take more.',
      },
    ],
    relatedIds: [FT.sodaWater, PARENT.soda],
    metaTitle: 'F&S 1886 Soda Water: Carbonation as an Ingredient',
    metaDescription:
      'In a highball the bubbles are an ingredient, not a texture. Soda against sparkling water, why bottle size matters, and how Japan pours it.',
  },

  {
    slug: 'franklin-sons-pineapple-almond-soda',
    name: 'Franklin & Sons Pineapple & Almond Soda',
    parentId: null,
    description:
      'Pineapple, lime and almond over sparkling water, which is a tiki drink with the rum missing. Pineapple and almond is one of the oldest pairings behind a bar, and having it ready-mixed does a surprising amount of work.',
    history:
      'Almond and pineapple sit at the centre of mid-century tiki, where orgeat and pineapple juice appear together in drink after drink. The pairing is older than that — almond milk and orchard fruit go back to medieval European cooking — but it was Californian tiki bars in the 1930s and 1940s that fixed it as a flavour of rum drinking.',
    origin: 'United Kingdom; the 1886 soft-drinks house',
    usage:
      'Around 100ml to 130ml over 40ml of rum, which is close to a long Pina Colada without the cream. It also lengthens gin and works with sherry, where the nuttiness meets the wine head on.',
    storage: 'Cool and sealed. Cold for service.',
    professionalTip:
      'Treat it as orgeat that is already diluted rather than as a fruit soda. It brings sweetness and nut character to the drink, so anything you add on top should be sharp or bitter rather than sweeter.',
    topTips: [
      'Add lime even though there is lime in it. Tiki builds run on acid and this is not sharp enough on its own to carry a full measure of rum.',
      'Aged rum over white. The molasses and barrel weight meet the almond; a light rum leaves the drink tasting mostly of pineapple.',
      'A dash of bitters transforms it. Angostura or Peychaud’s gives the sweetness an edge to push against.',
    ],
    substitutions: [
      'Pineapple juice with a bar spoon of orgeat and soda water: the same idea, built by hand',
      'Fever-Tree Pineapple Soda: pineapple alone, without the almond',
    ],
    keywords: [
      'pineapple and almond soda',
      'tiki mixer',
      'orgeat substitute',
      'pineapple soda rum',
      'easy tiki drink',
    ],
    primary: ['Pineapple', 'Almond', 'Lime'],
    strength: 'medium',
    tasting:
      'Pineapple first and quite sweet, with the almond arriving underneath as a soft nuttiness and the lime keeping the finish from turning syrupy.',
    sections: [
      {
        heading: 'Why Pineapple and Almond',
        paragraphs: [
          'The pairing is everywhere in tiki because it solves a problem. Rum and pineapple alone is sweet and one-dimensional; almond adds a fatty, rounded quality that gives the drink body without adding more sugar.',
          'Orgeat — a sweetened almond syrup, usually with a little orange flower water — is how bars do it. This is the same combination arriving pre-diluted and carbonated, which is a genuine shortcut rather than a compromise.',
        ],
      },
      {
        heading: 'Treat It as a Syrup, Not a Mixer',
        paragraphs: [
          'The useful mental adjustment is that this is not a neutral length like soda or a bitter length like tonic. It is a sweetening, flavouring component that happens to be long.',
          'That changes what else belongs in the glass. A build with this in it wants acid and bitterness on top — lime, a dash of bitters, an amaro — rather than another liqueur. Two sweet components and no sharp one is how a tiki drink turns into a dessert.',
        ],
      },
      {
        heading: 'What to Pour Into It',
        paragraphs: [
          'Aged rum is the natural partner. Molasses weight and barrel spice both sit well against almond, and the pineapple is sweet enough to need something with character opposite it.',
          'Sherry is the less obvious and more interesting option. An amontillado brings its own nuttiness and a dry finish, and the two nut characters compound rather than compete.',
          'Gin works if the gin is assertive. Juniper against pineapple is a sharper contrast than it sounds and the almond softens the join.',
        ],
      },
      {
        heading: 'Serving It',
        paragraphs: [
          'Over plenty of cubed ice, or crushed if the drink is leaning tiki. Crushed dilutes faster, which suits a sweet build better than it suits a dry one.',
          'A mint sprig clapped and dropped on top is worth the effort. Tiki drinks lean on aroma to carry sweetness, and mint over a pineapple drink does most of that job on its own.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Can I use it instead of orgeat?',
        answer:
          'In a long drink, largely yes — it brings the same almond and sweetness already diluted and carbonated. It will not work in a shaken build like a Mai Tai, where orgeat is providing texture as well as flavour.',
      },
      {
        question: 'Which rum suits it best?',
        answer:
          'An aged one. Molasses weight and barrel spice meet the almond, where a light white rum leaves the drink tasting mostly of pineapple.',
      },
      {
        question: 'Is it very sweet?',
        answer:
          'Sweeter than a tonic or a soda, yes. Treat it as a sweetening component rather than a neutral length, and add lime or bitters on top rather than another liqueur.',
      },
    ],
    relatedIds: [PARENT.soda],
    metaTitle: 'F&S Pineapple & Almond Soda: Tiki in a Bottle',
    metaDescription:
      'Pineapple and almond is the oldest pairing in tiki, and this is orgeat arriving pre-diluted. Why it wants acid on top rather than another liqueur.',
  },

  {
    slug: 'franklin-sons-elderflower-cucumber-tonic-water',
    name: 'Franklin & Sons Elderflower & Cucumber Tonic Water',
    parentId: PARENT.tonic,
    description:
      'Two soft flavours in the same bottle, which is the thing to plan around. Elderflower is floral and honeyed, cucumber is fresh and green, and neither has an edge — so the quinine and whatever spirit goes in are carrying the whole structure.',
    history:
      'Both halves are old British hedgerow and garden flavours that arrived in cocktails late. Elderflower was a cordial long before it was a bar ingredient and only became one in the late 2000s; cucumber came in through gin garnishing in the same decade. Putting them in a tonic together is a recent idea built on two recent habits.',
    origin: 'United Kingdom; the 1886 soft-drinks house',
    usage:
      'About 150ml over 50ml of a juniper-forward gin. It also suits vodka, where the tonic supplies everything, and it is a good length for a light white vermouth.',
    storage: 'Cool and sealed. Cold for service.',
    professionalTip:
      'Use a gin with real juniper in it. Both flavours here are soft, and a soft contemporary gin on top of them produces a pleasant drink with no shape — nothing in the glass is holding a line.',
    topTips: [
      'Juniper is the structure. Save the floral gin for a tonic that brings its own sharpness.',
      'A strip of lemon peel, expressed, does more than a cucumber slice. There is cucumber in the bottle already; what the drink lacks is acid.',
      'Serve it colder than you think. Delicate aromatics fade first, and this is nearly all delicate aromatics.',
    ],
    substitutions: [
      'Fever-Tree Elderflower Tonic: the floral half on its own',
      'Fever-Tree Cucumber Tonic: the green half on its own',
    ],
    keywords: [
      'elderflower cucumber tonic',
      'elderflower tonic water',
      'cucumber tonic',
      'floral gin and tonic',
      'summer gin tonic',
    ],
    primary: ['Elderflower', 'Cucumber', 'Quinine'],
    strength: 'light',
    tasting:
      'Floral on the nose with the cucumber underneath it, soft and rounded through the middle, and a quinine finish that supplies most of what stops it reading as sweet.',
    sections: [
      {
        heading: 'Two Soft Flavours',
        paragraphs: [
          'Elderflower is honeyed and slightly muscat-like. Cucumber is green, watery and cooling. Both are gentle, and neither brings acidity or bitterness of its own.',
          'That makes this a tonic with an unusually specific requirement: everything sharp in the finished drink has to come from somewhere else. The quinine does part of it, and the gin has to do the rest.',
        ],
      },
      {
        heading: 'Why the Gin Choice Matters More Here',
        paragraphs: [
          'With an Indian tonic, almost any gin works because the tonic is assertive enough to hold the drink up. Here it is not, and the gin becomes structural rather than decorative.',
          'A juniper-led London Dry gives the drink a spine. A soft, floral, contemporary gin doubles down on what the tonic already brings and the result is agreeable and shapeless — a drink with nothing to push against.',
        ],
      },
      {
        heading: 'The Acid Problem',
        paragraphs: [
          'There is no acidic component in the bottle at all, and a long drink without acid goes slack somewhere around the halfway point. It is the same reason a sloe gin drink needs lemon.',
          'A strip of lemon peel, expressed over the surface, is the smallest fix and the most effective. It adds the impression of sharpness without adding juice, which would cloud the drink and take it somewhere sourer than intended.',
        ],
      },
      {
        heading: 'Serving It',
        paragraphs: [
          'Very cold, in a copa or a highball, over a full glass of cubed ice. Floral aromatics are volatile and this drink is mostly floral aromatics.',
          'Cucumber ribbons folded down the inside of the glass are worth doing if the cucumber is the part you want forward. Slices sitting on top contribute far less than people expect.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Which gin works best with it?',
        answer:
          'A juniper-forward London Dry. Both flavours in the tonic are soft, so the gin is providing the structure. A floral or cucumber-led gin doubles up and the drink loses its shape.',
      },
      {
        question: 'Does it need a garnish?',
        answer:
          'A strip of expressed lemon peel, yes. There is no acidity in the bottle and a long drink without any goes flat in character. Cucumber is already there and does not need adding.',
      },
      {
        question: 'Is it sweet?',
        answer:
          'It reads soft rather than sweet. The quinine dries the finish, but there is nothing sharp alongside it, which is why the lemon peel and the gin choice matter more than usual.',
      },
    ],
    relatedIds: [FT.elderflowerTonic, FT.cucumberTonic, PARENT.tonic],
    metaTitle: 'F&S Elderflower & Cucumber Tonic: Soft on Soft',
    metaDescription:
      'Two gentle flavours and no acidity, which makes the gin structural rather than decorative. Why juniper matters here more than usual.',
  },

  {
    slug: 'franklin-sons-sicilian-lemon-tonic-water',
    name: 'Franklin & Sons Sicilian Lemon Tonic Water',
    parentId: PARENT.tonic,
    description:
      'Lemon tonic with the carbonation pushed hard. The lemon is doing something a wedge on the rim cannot: it is dispersed through the drink rather than sitting in one part of it, which is why a lemon tonic tastes more consistent than a tonic with lemon added.',
    history:
      'Tonic and citrus have been together since the Royal Navy took quinine with gin and lime, but bottling the citrus into the tonic is recent. Sicilian lemons carry the association because the island has been the reference point for European lemon growing since the eighteenth century, when the fruit was planted along the coast at scale.',
    origin: 'United Kingdom; the 1886 soft-drinks house',
    usage:
      'Roughly 150ml over 50ml of gin, sloe gin or vodka. The acidity makes it the tonic to reach for when the spirit is sweet, which is why it suits liqueurs better than a plain Indian tonic does.',
    storage: 'Cool and sealed. Cold for service.',
    professionalTip:
      'Reach for it when the spirit brings sugar. Sloe gin, a fruit liqueur or a sweetened gin all go flat under plain tonic, and the lemon here supplies the acid those drinks are missing.',
    topTips: [
      'It is the answer to a sweet spirit, not a dry one. With a bone-dry London Dry it can read as thin.',
      'Squeeze the lemon slice you garnish with. The tonic brings lemon flavour but very little fresh juice sharpness.',
      'Keep it cold and open it late. The carbonation is high and it is the first thing to go.',
    ],
    substitutions: [
      'Fever-Tree Sicilian Lemon Tonic: the parallel product',
      'Indian tonic with a squeeze of lemon: sharper in one place rather than through the drink',
    ],
    keywords: [
      'sicilian lemon tonic',
      'lemon tonic water',
      'sloe gin tonic',
      'citrus tonic water',
      'best tonic for sweet gin',
    ],
    primary: ['Lemon', 'Quinine', 'Sharp carbonation'],
    strength: 'medium',
    tasting:
      'Bright lemon on the nose, quite sharply carbonated, with the quinine arriving late and drying a finish the citrus has already lifted.',
    sections: [
      {
        heading: 'Lemon In It, Not On It',
        paragraphs: [
          'A wedge of lemon in a gin and tonic flavours the part of the drink nearest the wedge and contributes progressively less as the glass empties. Lemon dissolved through the tonic behaves differently: every mouthful is the same.',
          'It also brings a different kind of lemon. A wedge brings juice acidity and a little peel oil; a lemon tonic leans more on the aromatic peel character, which is rounder and less aggressive.',
        ],
      },
      {
        heading: 'What It Is For',
        paragraphs: [
          'The honest use case is sweet spirits. Sloe gin, fruit liqueurs and the sweetened flavoured gins that now fill most shelves all lack acidity, and plain tonic does nothing to fix that — quinine is bitter, not sour, and those are not interchangeable.',
          'Lemon tonic supplies both at once. That is why a sloe gin and lemon tonic works where a sloe gin and tonic goes slack halfway down the glass.',
        ],
      },
      {
        heading: 'When Not to Use It',
        paragraphs: [
          'With a very dry, juniper-heavy gin it can read as thin. There is nothing sweet in the drink for the acid to balance, and the result can taste more like lemon squash with gin in it than like a gin and tonic.',
          'The same applies to anything already citrus-forward. Two lemons in one glass is one more than the drink needs, and the second one just makes it sour.',
        ],
      },
      {
        heading: 'Carbonation',
        paragraphs: [
          'This is at the sharper end of the tonic range, and that suits the flavour. Citrus aromatics ride on carbonation, so a lively bottle delivers noticeably more lemon on the nose than a tired one.',
          'The practical consequence is the usual one: small bottles, opened cold, poured down the side of the glass, and not stirred more than once.',
        ],
      },
    ],
    faqs: [
      {
        question: 'When should I choose lemon tonic over Indian tonic?',
        answer:
          'When the spirit is sweet. Sloe gin, fruit liqueurs and sweetened gins have no acidity of their own, and quinine is bitter rather than sour, so plain tonic cannot supply what is missing.',
      },
      {
        question: 'Is it just tonic with lemon added?',
        answer:
          'Not quite. The lemon is dispersed through the drink rather than concentrated near a wedge, and it leans more on aromatic peel character than on juice acidity. It tastes rounder and more consistent.',
      },
      {
        question: 'Does it work with a classic dry gin?',
        answer:
          'It can read thin. With nothing sweet to balance, the acid has little to work against. A juniper-heavy gin is usually better served by an Indian tonic.',
      },
    ],
    relatedIds: [FT.lemonTonic, FS_INDIAN, PARENT.tonic],
    metaTitle: 'F&S Sicilian Lemon Tonic: for Sweet Spirits',
    metaDescription:
      'Lemon dispersed through the drink rather than perched on the rim, and the tonic to reach for when the spirit brings sugar of its own.',
  },
]
