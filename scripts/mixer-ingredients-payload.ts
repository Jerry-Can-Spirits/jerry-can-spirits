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

export const MIXERS: Mixer[] = [
  {
    // Missed on the first pass. The product page calls it "1886 Original
    // Lemonade" and the Orchard Cobbler recipe calls it "Franklin & Sons
    // Lemonade", so a name-match counted it as used by no recipe at all.
    slug: 'franklin-sons-1886-original-lemonade',
    name: 'Franklin & Sons 1886 Original Lemonade',
    parentId: 'ingredient-lemonade',
    description:
      'A cloudy lemonade built to be mixed rather than drunk on its own, which is the useful distinction in a range that contains both. It is sharper and less sugary than the fruit lemonades beside it, and that is what lets it carry a spirit.',
    history:
      'Lemonade split into two drinks somewhere in the nineteenth century and English usage never quite caught up. In most of the world it means still lemon juice, water and sugar; in Britain it came to mean a carbonated soft drink, often with very little lemon in it. Cloudy lemonade is the older idea with bubbles added.',
    origin: 'United Kingdom; the 1886 soft-drinks house',
    usage:
      'About 150ml over 50ml of gin or vodka, and the natural length for a Tom Collins built without a shaker. It also does well in punches, where its acidity holds up against fruit and wine.',
    storage: 'Cool and sealed. Cold for service.',
    professionalTip:
      'Use it where a recipe calls for lemon juice and soda. It is close enough to do both jobs at once, and the sugar it brings is roughly what a sugar syrup would have added anyway.',
    topTips: [
      'It stands in for lemon juice plus soda plus syrup in a Collins. One bottle instead of three components.',
      'Keep the cloudy one for mixing and a clear one for drinking neat. Cloudy carries more actual lemon.',
      'It is the base for a shandy, and a better one than a sweet clear lemonade gives.',
    ],
    substitutions: [
      'Fresh lemon juice, sugar syrup and soda water: the same drink built by hand',
      'Franklin & Sons Sicilian Lemon Tonic Water: adds quinine and drops the sugar',
    ],
    keywords: [
      'cloudy lemonade',
      'lemonade mixer',
      'tom collins lemonade',
      'franklin and sons lemonade',
      'shandy lemonade',
    ],
    primary: ['Lemon', 'Light sweetness'],
    strength: 'light',
    tasting:
      'Sharp lemon in front of the sugar rather than behind it, cloudy and softly carbonated, finishing cleaner than a confectionery lemonade does.',
    sections: [
      {
        heading: 'Two Drinks, One Word',
        paragraphs: [
          'Ask for lemonade in most of the world and you get still lemon juice, water and sugar. Ask in Britain and you get a clear carbonated soft drink that may contain almost no lemon at all. Both are correct and the confusion is permanent.',
          'Cloudy lemonade sits between them: the older recipe, carbonated. The cloudiness is lemon solids rather than a stylistic choice, which is why it tastes more of the fruit than a clear one does.',
        ],
      },
      {
        heading: 'Three Ingredients in One Bottle',
        paragraphs: [
          'A Tom Collins is gin, lemon juice, sugar and soda. A cloudy lemonade is lemon juice, sugar and soda already assembled, which makes the drink a two-component build rather than a four-component one.',
          'That is a genuine shortcut rather than a compromise, provided the lemonade is sharp enough. A sweet clear lemonade in the same role gives a drink with no acid and too much sugar, which is why the swap has a poor reputation it does not entirely deserve.',
        ],
      },
      {
        heading: 'Where It Works',
        paragraphs: [
          'Gin is the obvious partner and the Collins the obvious drink. Vodka works and asks less of the drinker.',
          'Punch is where it earns its keep. Lemonade holds its acidity against fruit and wine in a way that soda cannot, and a punch built on it needs less separate citrus.',
          'It is also the right base for a shandy. Beer and a sweet clear lemonade is a poor drink; beer and a sharp cloudy one is the version people remember liking.',
        ],
      },
      {
        heading: 'Serving It',
        paragraphs: [
          'Cold, over a full glass of cubed ice, with a wheel or wedge of lemon squeezed in. The squeeze matters more than the garnish — bottled lemonade carries lemon flavour but not much fresh juice sharpness.',
          'A sprig of mint suits it, particularly in a punch, where it gives an otherwise simple drink a top note.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Can I use lemonade instead of lemon juice and syrup?',
        answer:
          'In a long drink, yes. A cloudy lemonade is lemon juice, sugar and soda already assembled, which turns a Tom Collins into a two-part build. It will not work in anything shaken and served short.',
      },
      {
        question: 'What is the difference between cloudy and clear lemonade?',
        answer:
          'Cloudy carries lemon solids and tastes noticeably more of the fruit; clear British lemonade is a carbonated soft drink that may contain very little lemon. Cloudy is the one to mix with.',
      },
      {
        question: 'Is it good for a shandy?',
        answer:
          'It is the better choice. Beer with a sweet clear lemonade tends to be flabby; a sharper cloudy one keeps the drink refreshing rather than sugary.',
      },
    ],
    relatedIds: [
      'ingredient-franklin-sons-sicilian-lemon-tonic-water',
      'ingredient-fs-rose-lemonade',
      'ingredient-lemonade',
    ],
    metaTitle: 'F&S 1886 Original Lemonade: Built for Mixing',
    metaDescription:
      'Cloudy lemonade is lemon juice, sugar and soda already assembled — which turns a Tom Collins into a two-part build. Why sharp beats sweet.',
  },
]
