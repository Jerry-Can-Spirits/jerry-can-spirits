/**
 * Transient batch for scripts/create-brand-serves.ts.
 *
 * The measures come from the producer's published serve. Every word of prose is
 * ours. Reset this file once the batch is written.
 *
 * Two of these — the White Grape & Apricot Garden Spritz and the Raspberry &
 * Orange Blossom Spritz — were invented by Fever-Tree in the last few years and
 * have no history. They get no "Where It Comes From" section, because there is
 * nothing true to put in one.
 */
import type { Serve } from './create-brand-serves'

const HIGHBALL = 'e03fe14a-7571-43d8-8018-2b19029efd1c'
const COPA = '3fb4ec5a-5d4a-441e-b8cd-ebe898272b2b'
const WINE = 'd13afa51-a507-4c92-ba00-1269c8c118fc'

const FT = {
  elderflowerTonic: '26ba335a-c052-40f2-826b-9312d7b02dc7',
  bloodOrangeSoda: '92738efd-ccf8-4661-85a8-34480ae049a0',
  whiteGrapeApricot: 'f7e2b456-04e7-4db6-ac4e-6ccc70540866',
  raspberryOrangeBlossom: '3517b313-3644-429b-a42f-33b1a2df63d6',
  spicedOrangeGingerAle: '66c5efb3-be88-447a-85a0-22af9ae80adb',
}

const ING = {
  gin: '0c670281-32c3-42f4-85b1-c604035d2f82',
  vodka: 'c0463f2e-46b7-4e9e-846d-eb548536b4f8',
  darkRum: 'f78cac3f-ba8f-4f51-993e-a29cde0481b1',
  aperol: '1404c05f-744d-4435-9b77-3d9aebec919d',
  chambord: 'ingredient-chambord',
  raspberries: 'ingredient-raspberries',
  cinnamonStick: '0e56947a-346c-4ced-b5f2-32890501c3a0',
  mintLeaf: 'ingredient-mint-leaf',
  iceCubed: '6954983a-0faa-4d24-8e7e-413fb9b54c96',
  orangeSlice: 'ingredient-orange-slice',
  orangeWedge: 'ingredient-orange-wedge',
  lemonPeel: 'ingredient-lemon-peel',
  lemonWedge: 'cb45bbe4-5fcd-4ad4-9055-c81796f808e7',
}

export const SERVES: Serve[] = [
  {
    slug: 'elderflower-and-raspberry',
    name: 'Elderflower & Raspberry',
    producer: 'Fever-Tree',
    description:
      'Elderflower and raspberry is one of those pairings that sounds like a summer dessert and turns out to be considerably drier than expected, mostly because the tonic underneath is doing the opposite of what the fruit suggests. Quinine is bitter and drying, and it holds the Chambord in check — without it this would be a very sweet drink indeed. The elderflower is the connecting element rather than a flavour in its own right: it is floral and honeyed and sits between the sharp raspberry and the bitter tonic, joining two things that would otherwise sit at opposite ends of the glass. Gin or vodka both work and they give genuinely different drinks. Gin adds juniper structure and makes it more of an aperitif; vodka steps back and lets the fruit run the whole thing. The measure of spirit is short at 35ml, which is deliberate — this is a drink built around the mixer, not around the alcohol.',
    expertTip:
      'Muddle one of the three raspberries against the bottom of the glass before you build, and leave the other two whole. The crushed one colours and flavours the drink; the whole ones stay intact and stop it turning cloudy and pulpy by the end.\n\nChambord is sweeter than it looks. Two tablespoons is about 30ml and that is genuinely the ceiling — go further and the tonic can no longer hold it, and the drink tips from balanced into sticky.\n\nSqueeze the lemon wedge in. Elderflower and raspberry both bring sweetness and neither brings much acid, so a drink without it goes soft in the middle. It is the smallest ingredient here and it does the most.',
    baseSpirit: 'gin',
    family: 'highballs',
    difficulty: 'novice',
    prepTime: 'PT3M',
    glasswareId: COPA,
    ingredients: [
      {
        name: 'Fever-Tree Elderflower Tonic Water',
        amount: '150ml',
        description:
          'The quinine is what keeps this drink from being a dessert. Elderflower cordial and soda in its place gives you the same flavours with none of the bitterness holding them together.',
        ref: FT.elderflowerTonic,
      },
      {
        name: 'Gin or Vodka',
        amount: '35ml',
        description:
          'Gin makes it an aperitif — juniper gives the fruit something to lean on. Vodka makes it fruit-forward and softer. A short measure either way, because the mixer is the drink.',
        ref: ING.gin,
      },
      {
        name: 'Chambord',
        amount: '30ml',
        description:
          'A black raspberry liqueur, and sweeter than its dark colour suggests. This is the ceiling rather than a starting point — past it, the tonic stops being able to balance the drink.',
        ref: ING.chambord,
      },
      {
        name: 'Raspberries',
        amount: '3',
        description:
          'Muddle one, keep two whole. The crushed one does the flavouring; the whole ones keep the drink clear instead of pulpy.',
        ref: ING.raspberries,
      },
      {
        name: 'Ice',
        amount: 'Fill the glass',
        description:
          'Cubed. There is real sugar in this from the liqueur, and a warm, dilute version turns syrupy rather than merely weak.',
        ref: ING.iceCubed,
      },
    ],
    garnishIds: [ING.lemonWedge, ING.raspberries],
    instructions: [
      'Muddle one raspberry in the bottom of a copa glass.',
      'Fill the glass with cubed ice.',
      'Add the gin or vodka and the Chambord.',
      'Top with the elderflower tonic, down the side of the glass.',
      'Squeeze in a lemon wedge and drop in the two remaining raspberries.',
    ],
    sections: [
      {
        heading: 'Where Elderflower Comes From',
        paragraphs: [
          'Elderflower is a genuinely old British and northern European ingredient, gathered from hedgerows in early summer and steeped into cordials and country wines long before anyone bottled it commercially. The flowers have a very short season, which is why almost all of it is drunk as cordial rather than fresh.',
          'Its move into cocktails is much more recent and can be dated fairly precisely: St-Germain launched in 2007 and elderflower went from a rural British cordial to a bar staple within a few years. Elderflower tonic follows that shift rather than leading it.',
        ],
      },
      {
        heading: 'Why the Tonic Rather Than a Cordial',
        paragraphs: [
          'The obvious way to build this drink is elderflower cordial, raspberry liqueur and soda. It is sweeter than most people want and it has no structure.',
          'Quinine changes the whole shape. It is bitter and drying and it arrives at the end, which means each mouthful finishes clean rather than sweet. That is what makes the drink work at a long measure instead of becoming hard going after the first third.',
        ],
      },
      {
        heading: 'Elderflower as the Joint',
        paragraphs: [
          'Raspberry is sharp and bright. Quinine is bitter and dry. On their own they sit at opposite ends of the drink with a gap in the middle.',
          'Elderflower is floral, honeyed and slightly muscat-like, and it occupies exactly that gap. It is doing structural work rather than adding another flavour, which is why substituting a different floral note — rose, say — does not produce the same drink.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Gin or vodka?',
        answer:
          'Gin makes it drier and more of an aperitif, with juniper giving the fruit some structure. Vodka steps back and lets raspberry and elderflower lead. Both are good; gin is the more interesting drink.',
      },
      {
        question: 'Can I use a different raspberry liqueur?',
        answer:
          'Yes, but check the sweetness. Chambord is sweeter than its colour suggests and most substitutes differ, so taste and adjust the measure rather than pouring 30ml on trust.',
      },
      {
        question: 'Why such a short measure of spirit?',
        answer:
          'Because the mixer is the drink. At 35ml the elderflower and raspberry stay in charge; at 50ml the alcohol comes forward and flattens both. It also keeps it sessionable, which suits the style.',
      },
    ],
    flavorProfile: ['Floral', 'Fruity', 'Bitter', 'Tart', 'Refreshing'],
    tags: ['long-drink', 'built', 'sessionable', 'aperitif'],
    keywords: [
      'elderflower and raspberry cocktail',
      'elderflower tonic water',
      'chambord cocktail',
      'raspberry gin cocktail',
      'floral cocktail',
      'summer gin drink',
    ],
    metaTitle: 'Elderflower & Raspberry',
    metaDescription:
      'Drier than it sounds — the quinine holds the Chambord in check, and elderflower sits in the gap between sharp fruit and bitter tonic.',
    relatedSlugs: ['gin-and-tonic', 'hugo-spritz', 'sloe-gin-and-lemon-tonic'],
  },

  {
    slug: 'vodka-and-blood-orange-spritz',
    name: 'Vodka & Blood Orange Spritz',
    producer: 'Fever-Tree',
    description:
      'A spritz stripped back to two ingredients, which exposes how much of a normal spritz is carried by the bitter liqueur rather than by anything else. Take the Aperol out and put blood orange soda in its place and you get a drink that is fruitier, considerably softer, and far less alcoholic — around four parts soda to one of vodka, which puts it well into afternoon territory. Blood orange is the reason it holds up. It is not simply a sweeter orange: there is a berry-ish, faintly raspberry note underneath the citrus and a bitterness in the finish that ordinary orange soda does not have, and that bitterness is doing the job Aperol would otherwise do. Vodka is the right spirit precisely because it argues with nothing. Serve it in a wine glass over a lot of ice with a slice of orange, and treat it as what it is — an easy drink rather than a serious one.',
    expertTip:
      'Use a wine glass, not a highball. It is not affectation — the wider bowl gives the citrus aromatics somewhere to collect, and a spritz drunk from a narrow glass loses most of its nose. It also takes more ice, which this drink wants.\n\nPour the soda first and the vodka after. Blood orange soda is the only carbonated thing in the glass and there is nothing else to mask it going flat.\n\nIf you want it closer to a proper spritz, add 25ml of Aperol and drop the soda to 150ml. That gives you the bitterness back without turning it into a different drink, and it is the better version for serving before food rather than during an afternoon.',
    baseSpirit: 'vodka',
    family: 'spritz',
    difficulty: 'novice',
    prepTime: 'PT2M',
    glasswareId: WINE,
    ingredients: [
      {
        name: 'Fever-Tree Italian Blood Orange Soda',
        amount: '200ml',
        description:
          'Blood orange rather than plain orange matters here — there is a berry note and a genuine bitterness in the finish that ordinary orange soda lacks, and that bitterness is standing in for the liqueur a spritz would normally have.',
        ref: FT.bloodOrangeSoda,
      },
      {
        name: 'Vodka',
        amount: '50ml',
        description:
          'Neutral on purpose. The soda is carrying every flavour in the glass and gin would add juniper to a drink that has no use for it.',
        ref: ING.vodka,
      },
      {
        name: 'Ice',
        amount: 'Fill the glass',
        description:
          'Cubed and plenty. A spritz is meant to be drunk cold and slowly, and an underfilled glass is warm before it is half finished.',
        ref: ING.iceCubed,
      },
    ],
    garnishIds: [ING.orangeSlice],
    instructions: [
      'Fill a wine glass with cubed ice.',
      'Pour in the blood orange soda.',
      'Add the vodka.',
      'Stir once from the bottom.',
      'Garnish with a slice of orange.',
    ],
    sections: [
      {
        heading: 'Where the Spritz Comes From',
        paragraphs: [
          'The spritz began in the Veneto in the nineteenth century, when Austrian soldiers stationed in northern Italy found the local wine stronger than they wanted and asked for it to be cut with water — spritzen, to splash. That is the whole origin of the name.',
          'Soda replaced still water as it became available, and the bitter liqueur arrived later still, with Select in Venice and then Aperol from Padua in 1919. The version most people now think of as the spritz is the most recent part of the story rather than the original.',
          'This one goes back the other way. It is closer in spirit to the early version: something long, cold and deliberately weakened.',
        ],
      },
      {
        heading: 'What the Bitterness Is Doing',
        paragraphs: [
          'Remove Aperol from a spritz and what you lose is not really the flavour — it is the structure. Bitterness stops a fruit drink from reading as squash, and without something doing that job the whole thing turns into orangeade with vodka in it.',
          'Blood orange carries its own bitterness in the pith and peel, which is why this works with plain soda where an ordinary orange one would not. It is a smaller bitterness than Aperol’s and it arrives earlier, but it is enough to hold the shape.',
        ],
      },
      {
        heading: 'Blood Orange Is Not Just Sweeter',
        paragraphs: [
          'The red colour comes from anthocyanins, the same pigment family that colours raspberries and blackcurrants, and they bring flavour as well as colour. That is the berry note people notice and struggle to place.',
          'Practically, it means the drink tastes of more than one fruit while containing only one. In a two-ingredient build, that is worth a great deal.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Is this a real spritz without Aperol?',
        answer:
          'It is a spritz in the older sense — something long and deliberately weakened. The blood orange supplies enough bitterness to hold the shape. If you want the modern version, add 25ml of Aperol and shorten the soda.',
      },
      {
        question: 'How strong is it?',
        answer:
          'Around four parts mixer to one of vodka, so noticeably lighter than a standard spritz and much lighter than a gin and tonic poured at three to one. It is built for the afternoon.',
      },
      {
        question: 'Can I use prosecco as well?',
        answer:
          'You can, and it becomes a fuller drink. Drop the soda to 100ml and add 75ml of prosecco. Bear in mind you are then adding alcohol to something whose main virtue was not having much.',
      },
    ],
    flavorProfile: ['Citrus', 'Fruity', 'Lightly bitter', 'Refreshing', 'Long'],
    tags: ['long-drink', 'built', 'low-abv', 'aperitif'],
    keywords: [
      'blood orange spritz',
      'vodka spritz',
      'blood orange soda',
      'low alcohol spritz',
      'italian soda cocktail',
      'aperitif spritz',
    ],
    metaTitle: 'Vodka & Blood Orange Spritz',
    metaDescription:
      'A spritz with the bitter liqueur taken out — and blood orange doing that job instead. Lighter than the modern version, closer to the original.',
    relatedSlugs: ['aperol-spritz', 'hugo-spritz', 'limoncello-spritz'],
  },

  {
    slug: 'white-grape-and-apricot-garden-spritz',
    name: 'White Grape & Apricot Garden Spritz',
    producer: 'Fever-Tree',
    description:
      'A modern drink with no history behind it, built around a soda that pairs white grape with apricot — a combination closer to a dry white wine than to a fruit mixer. That is what makes it work as a spritz. White grape brings a light, slightly vinous sweetness and almost no acidity; apricot brings stone-fruit weight and a faint bitterness in the finish. Together they land somewhere near a soft, off-dry white, and the elderflower gin poured into them does what a floral note usually does with stone fruit, which is make it smell riper than it is. The result is gentler than an Aperol spritz and much less sweet than the fruit names suggest. Mint and lemon peel are both doing real work: the mint lifts the nose, the lemon oil supplies the sharpness the soda lacks. Skip either and the drink goes noticeably flat in character rather than in carbonation.',
    expertTip:
      'Express the lemon peel and then rub it round the rim before dropping it in. There is very little acidity in this drink and none of it comes from the soda, so the oil is the only sharp thing available and it is worth getting the most out of it.\n\nUse a plain gin if you do not have an elderflower one. The soda is already floral and slightly sweet, and a London Dry gives it a juniper backbone it can genuinely use — arguably a better drink than the published version.\n\nClap the mint rather than muddling it, and put it in last. Stone fruit and mint is a good pairing but a bruised, over-worked mint sprig turns grassy and takes the drink somewhere green rather than ripe.',
    baseSpirit: 'gin',
    family: 'spritz',
    difficulty: 'novice',
    prepTime: 'PT3M',
    glasswareId: WINE,
    ingredients: [
      {
        name: 'Fever-Tree White Grape & Apricot Soda Water',
        amount: '150ml',
        description:
          'Reads closer to an off-dry white wine than to a fruit soda — vinous from the grape, weighted from the apricot, with a faint bitterness at the end. That last part is what stops the drink being sweet.',
        ref: FT.whiteGrapeApricot,
      },
      {
        name: 'Elderflower Gin',
        amount: '50ml',
        description:
          'The floral note makes the apricot smell riper than it is. A plain London Dry works at least as well and arguably better, since it brings juniper structure to a drink that is otherwise all soft edges.',
        ref: ING.gin,
      },
      {
        name: 'Mint',
        amount: '1 sprig',
        description:
          'Clapped once, added last. Mint and stone fruit is a real pairing, but over-worked mint turns grassy and pulls the drink away from ripe and towards green.',
        ref: ING.mintLeaf,
      },
      {
        name: 'Ice',
        amount: 'Fill the glass',
        description:
          'Cubed and generous. The aromatics here are delicate and the drink loses its nose quickly once it warms.',
        ref: ING.iceCubed,
      },
    ],
    garnishIds: [ING.lemonPeel, ING.mintLeaf],
    instructions: [
      'Fill a wine glass with cubed ice.',
      'Pour in the gin.',
      'Top with the white grape and apricot soda.',
      'Express a strip of lemon peel over the surface, rub it round the rim and drop it in.',
      'Clap a sprig of mint and add it last.',
    ],
    sections: [
      {
        heading: 'Why It Drinks Like Wine',
        paragraphs: [
          'White grape juice and white wine share a great deal of their aromatic character, because most of what a light white wine smells of was in the grape before fermentation rather than produced by it. Take the alcohol and the acid out and a good deal of the impression survives.',
          'What white grape juice does not have is acidity, and that absence is the whole reason this drink needs the lemon peel. A wine with no acid tastes flabby, and the same is true here.',
          'The apricot fills the other gap. It brings body and a slight bitterness from the skin character, which is roughly the role tannin and phenolics play in a real white.',
        ],
      },
      {
        heading: 'Floral Over Stone Fruit',
        paragraphs: [
          'Elderflower and apricot share compounds in the same family — the honeyed, faintly muscat-like notes that make a ripe stone fruit smell sweet before you taste it. Putting them together does not add a flavour so much as intensify one that is already there.',
          'It is a well-established trick. Apricot and elderflower turn up together in desserts and preserves for the same reason, and the effect is more obvious in a cold drink than it is in a hot kitchen.',
        ],
      },
      {
        heading: 'Where the Sharpness Comes From',
        paragraphs: [
          'This is a drink with no acidic ingredient in it at all. The soda is soft, the gin is soft, the mint is aromatic rather than sharp.',
          'The lemon peel is therefore not a garnish but the only structural correction available, and it works because peel oil reads as sharp on the nose without adding actual acid to the glass. Expressing it properly matters more here than in almost any other drink of this kind.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Do I need an elderflower gin?',
        answer:
          'No. A plain London Dry works at least as well and adds juniper structure the drink can use. The elderflower makes the apricot read riper, which is pleasant but not essential.',
      },
      {
        question: 'Why does it need lemon peel?',
        answer:
          'Because nothing else in the glass is sharp. White grape has very little acidity and neither does the gin. The peel oil supplies that impression without adding juice, which would make the drink cloudy and sour.',
      },
      {
        question: 'Can I add prosecco?',
        answer:
          'Yes, and it suits the drink — the wine character is already there. Drop the soda to 100ml and add 75ml. The acidity in the prosecco also does some of the lemon peel’s job.',
      },
    ],
    flavorProfile: ['Vinous', 'Stone fruit', 'Floral', 'Soft', 'Aromatic'],
    tags: ['long-drink', 'built', 'sessionable', 'aperitif'],
    keywords: [
      'white grape and apricot spritz',
      'garden spritz',
      'elderflower gin cocktail',
      'apricot cocktail',
      'wine glass spritz',
      'light gin spritz',
    ],
    metaTitle: 'White Grape & Apricot Garden Spritz',
    metaDescription:
      'Closer to an off-dry white than a fruit soda. Nothing in the glass is sharp, which is why the lemon peel is structural rather than decorative.',
    relatedSlugs: ['hugo-spritz', 'gin-and-tonic', 'limoncello-spritz'],
  },

  {
    slug: 'raspberry-and-orange-blossom-spritz',
    name: 'Raspberry & Orange Blossom Spritz',
    producer: 'Fever-Tree',
    description:
      'A recent invention rather than a drink with a past, and an unusually well-judged one because the two halves of its name pull in opposite directions. Raspberry is sharp, bright and slightly tart. Orange blossom is heady, perfumed and can very easily tip into soap if there is too much of it — it is one of the least forgiving flavours in a bar. Held in balance the pairing is genuinely good: the fruit keeps the floral note honest and the floral note gives the fruit a depth it does not have alone. Vodka is the safer spirit and pink gin the more interesting one, provided the pink gin is not a sweetened liqueur, because there is quite enough sweetness here already. Fresh raspberries in the glass are not decoration. They add tartness and a slight astringency from the seeds, both of which push back against the perfume. Serve it cold, in a wine glass, and do not be tempted to add anything sweet.',
    expertTip:
      'Press two of the raspberries lightly against the side of the glass and leave the rest whole. You want the tartness released without turning the drink pink and pulpy — orange blossom needs something acidic working against it and whole fruit floating on top contributes almost nothing.\n\nIf it tastes soapy, the answer is acid rather than dilution. A squeeze of lemon fixes an over-perfumed drink far more reliably than more soda, which just makes a larger soapy drink.\n\nBe careful with pink gin. If it is a sweetened liqueur it will push this over the edge — the soda is already floral and fruit-forward and the drink has no room for added sugar. An unsweetened gin is the safer choice by some distance.',
    baseSpirit: 'vodka',
    family: 'spritz',
    difficulty: 'novice',
    prepTime: 'PT3M',
    glasswareId: WINE,
    ingredients: [
      {
        name: 'Fever-Tree Raspberry & Orange Blossom Soda Water',
        amount: '150ml',
        description:
          'The orange blossom is the difficult half — perfumed and quick to become soapy — and the raspberry is what keeps it in check. The balance is already struck in the bottle, which is why adding anything sweet upsets it.',
        ref: FT.raspberryOrangeBlossom,
      },
      {
        name: 'Vodka or Pink Gin',
        amount: '50ml',
        description:
          'Vodka is the safe choice and lets the soda lead. Pink gin is more interesting but only if it is unsweetened — a pink gin liqueur adds sugar to a drink that has no capacity for it.',
        ref: ING.vodka,
      },
      {
        name: 'Raspberries',
        amount: 'A handful',
        description:
          'Working ingredients rather than garnish. Press two against the glass for tartness and leave the rest whole. The seeds add a slight astringency that pushes back against the perfume.',
        ref: ING.raspberries,
      },
      {
        name: 'Ice',
        amount: 'Fill the glass',
        description:
          'Cubed and plenty. Floral aromatics intensify as a drink warms, and this is not a drink that benefits from more orange blossom.',
        ref: ING.iceCubed,
      },
    ],
    garnishIds: [ING.raspberries],
    instructions: [
      'Drop a handful of raspberries into a wine glass, pressing two of them lightly against the side.',
      'Fill the glass with cubed ice.',
      'Pour in the vodka or pink gin.',
      'Top with the raspberry and orange blossom soda.',
      'Stir once, gently, from the bottom.',
    ],
    sections: [
      {
        heading: 'Orange Blossom Is Difficult',
        paragraphs: [
          'Orange flower water has been used in drinks for well over a century — it is the aromatic in a Ramos Gin Fizz and in a good deal of North African and Levantine cooking — and it has a reputation among bartenders for being unforgiving. The margin between fragrant and soapy is very narrow.',
          'The compounds responsible sit in the same family as those used in soap perfumery, which is not a coincidence and is exactly why the association is so easy to trigger. A few drops too many and most people will name it immediately.',
          'That is the useful thing to know before adjusting this drink: almost every correction should reduce the floral impression rather than increase anything else.',
        ],
      },
      {
        heading: 'Why the Raspberry Is Essential',
        paragraphs: [
          'Acidity is what keeps a floral note reading as fragrance rather than as perfume. It is the same reason a Ramos has lemon and lime in it, and the same reason orange blossom in cooking almost always arrives alongside citrus or yoghurt.',
          'Raspberry brings both acid and a slight tannic astringency from the seeds. The astringency is the less obvious half and possibly the more important one — it gives the drink a dry edge that plain fruit sweetness would not.',
        ],
      },
      {
        heading: 'Keep It Cold',
        paragraphs: [
          'Volatile aromatics come forward as a drink warms, which is why a floral drink that was well balanced at the first mouthful can be overwhelming by the last.',
          'The practical answer is a full glass of ice and a smaller pour rather than a large drink taken slowly. This is not one to nurse for an hour.',
        ],
      },
    ],
    faqs: [
      {
        question: 'What if it tastes soapy?',
        answer:
          'Add acid rather than more soda. A squeeze of lemon or a couple more pressed raspberries will pull it back; diluting it further just gives you more of the same drink. Serving it colder also helps.',
      },
      {
        question: 'Can I use a pink gin?',
        answer:
          'Only an unsweetened one. Most pink gins are sweetened liqueurs and this drink has no room for added sugar. If in doubt, vodka is the safer choice.',
      },
      {
        question: 'Are the raspberries just for looks?',
        answer:
          'No. They supply the acidity and seed astringency that keep the orange blossom from taking over. Press a couple against the glass so they actually contribute rather than float.',
      },
    ],
    flavorProfile: ['Floral', 'Tart', 'Fruity', 'Perfumed', 'Dry finish'],
    tags: ['long-drink', 'built', 'sessionable', 'aperitif'],
    keywords: [
      'raspberry and orange blossom spritz',
      'orange blossom cocktail',
      'raspberry vodka spritz',
      'floral spritz',
      'pink gin spritz',
      'summer vodka drink',
    ],
    metaTitle: 'Raspberry & Orange Blossom Spritz',
    metaDescription:
      'Orange blossom is one of the least forgiving flavours in a bar. The raspberry is what keeps it fragrant rather than soapy.',
    relatedSlugs: ['ramos-gin-fizz', 'hugo-spritz', 'elderflower-and-raspberry'],
  },

  {
    slug: 'spiced-sangria',
    name: 'Spiced Sangria',
    producer: 'Fever-Tree',
    description:
      'A sangria with no wine in it, which sounds like a contradiction until you look at what the wine was actually contributing. In a traditional jug it supplies body, a little tannin and some acidity — and here rum takes the body, Aperol takes the bitterness, and spiced orange ginger ale takes the fruit and the length. What comes out is recognisably in the sangria tradition despite sharing almost no ingredients with it: fruity, spiced, orange-led, meant for a warm afternoon and easy to make by the jug. The ginger is the part that lifts it out of being a rum punch. It brings heat and a dryness that cuts the Aperol’s sweetness, and it sits naturally with the cinnamon. Dark rum is the right choice for the molasses weight. Build it over plenty of ice with a cinnamon stick and orange, and let it sit for a minute before drinking so the spice has time to come through.',
    expertTip:
      'Give the cinnamon stick a minute in the glass before you drink it. Whole cinnamon releases slowly and a drink poured and drunk immediately tastes of ginger and Aperol with a cinnamon stick sitting in it. Building it slightly ahead is genuinely better here, which is unusual for a carbonated drink.\n\nSnap the stick in half if you are in a hurry. The broken ends give up their oils much faster than the sealed bark does.\n\nDark rum rather than white. This needs molasses weight underneath the citrus, and a light rum leaves the drink feeling hollow in the middle no matter how much you add. If you only have white rum, cut the Aperol slightly — without the rum’s body, the bitterness comes forward too hard.',
    baseSpirit: 'dark-rum',
    family: 'punches',
    difficulty: 'novice',
    prepTime: 'PT4M',
    glasswareId: HIGHBALL,
    ingredients: [
      {
        name: 'Fever-Tree Spiced Orange Ginger Ale',
        amount: '150ml',
        description:
          'The published serve specifies their Refreshingly Light version. The ginger heat is what keeps this from becoming a rum punch, and the orange spice sits naturally with the cinnamon rather than adding a competing flavour.',
        ref: FT.spicedOrangeGingerAle,
      },
      {
        name: 'Dark Rum',
        amount: '60ml',
        description:
          'Molasses weight is what stands in for the wine here. A white rum leaves a hole in the middle of the drink that no amount of extra measure will fill.',
        ref: ING.darkRum,
      },
      {
        name: 'Aperol',
        amount: '30ml',
        description:
          'Supplying the bitterness and a little of the tannic grip that wine would bring to a sangria. Cut it back slightly if you are using a lighter rum, or it comes forward too hard.',
        ref: ING.aperol,
      },
      {
        name: 'Cinnamon Stick',
        amount: '1',
        description:
          'Whole, and given a minute to work. Snap it in half if you are in a hurry — the broken ends release far faster than sealed bark. Ground cinnamon is not a substitute; it clouds the drink and tastes dusty.',
        ref: ING.cinnamonStick,
      },
      {
        name: 'Ice',
        amount: 'Fill the glass',
        description:
          'Cubed and plenty. There is real sugar here from the Aperol and the ginger ale, and a warm version turns heavy quickly.',
        ref: ING.iceCubed,
      },
    ],
    garnishIds: [ING.orangeWedge, ING.cinnamonStick],
    instructions: [
      'Fill a highball glass with cubed ice.',
      'Add the dark rum and the Aperol.',
      'Top with the spiced orange ginger ale.',
      'Drop in a cinnamon stick and a wedge of orange.',
      'Stir once and leave it a minute before drinking.',
    ],
    sections: [
      {
        heading: 'Where Sangria Comes From',
        paragraphs: [
          'Sangria is Spanish and Portuguese and much older than its holiday reputation suggests. Wine cut with water, fruit and spice was ordinary practice across southern Europe for centuries, partly for flavour and partly because the water was safer for having wine in it.',
          'The name refers to the colour — sangre, blood — and attached itself to the red wine version. It reached a wide English-speaking audience through the 1964 World’s Fair in New York, which is when it became the thing people associate with Spanish holidays.',
          'Spiced versions with citrus and cinnamon are the older strand rather than a modern flourish. Warm spiced wine and cold spiced wine are the same idea served at different temperatures.',
        ],
      },
      {
        heading: 'What Replaced the Wine',
        paragraphs: [
          'It is worth being precise about what wine does in a sangria, because that is what has been substituted. It brings body, mild tannin, acidity, and a fermented depth that fruit juice does not have.',
          'Dark rum covers the body and the depth — molasses and barrel character in place of grape and oak. Aperol covers the bitterness and some of the grip. The acidity is the one thing genuinely missing, which is why the orange wedge is worth squeezing rather than just dropping in.',
        ],
      },
      {
        heading: 'Why Ginger Rather Than Plain Orange',
        paragraphs: [
          'A rum, Aperol and orange soda drink already exists and it is pleasant and slightly one-dimensional. Ginger is what gives this one a spine.',
          'The heat provides a dryness on the finish that the sugar needs, and ginger and cinnamon are a long-established pairing that reads as warming rather than as two separate spices. That combination is what makes the drink recognisably a sangria descendant instead of a punch.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Is it really sangria without wine?',
        answer:
          'Not in the strict sense. It sits in the tradition — fruit, spice, citrus, long and cold — with rum and Aperol standing in for what the wine contributed. Judge it as a spiced rum long drink and it holds up well.',
      },
      {
        question: 'Can I make it by the jug?',
        answer:
          'Yes, and it suits it. Scale the rum, Aperol, cinnamon and orange, and add the ginger ale as you serve rather than in advance. Anything carbonated left standing in a jug is flat within twenty minutes.',
      },
      {
        question: 'Does the cinnamon stick actually do anything?',
        answer:
          'Given a minute, yes. Whole cinnamon releases slowly, so a drink poured and drunk straight away tastes of ginger and Aperol. Snapping the stick in half speeds it up considerably.',
      },
    ],
    flavorProfile: ['Spiced', 'Bitter-orange', 'Warming', 'Fruity', 'Long'],
    tags: ['long-drink', 'built', 'batchable', 'party'],
    keywords: [
      'spiced sangria',
      'rum sangria',
      'sangria without wine',
      'aperol and rum',
      'spiced orange ginger ale',
      'batch cocktail',
      'summer punch',
    ],
    metaTitle: 'Spiced Sangria',
    metaDescription:
      'A sangria with no wine in it — rum takes the body, Aperol the bitterness, ginger the length. What each part is actually replacing.',
    relatedSlugs: ['sangria', 'dark-and-stormy', 'aperol-spritz'],
  },
]
