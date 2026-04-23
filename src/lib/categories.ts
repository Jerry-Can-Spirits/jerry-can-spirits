// src/lib/categories.ts

export type CategoryConfig = {
  h1: string
  metaTitle: string
  metaDescription: string
  introBody: string[]
  productHandles?: string[]  // absent = fall through to getProductsByCollection(slug)
}

export const CATEGORIES: Record<string, CategoryConfig> = {

  // ── SEO category pages (handle-based product fetching) ──────────────────

  'rum-gifts': {
    h1: 'Rum Gifts UK',
    metaTitle: 'Rum Gifts UK | Jerry Can Spirits®',
    metaDescription:
      'Rum gifts for people who actually drink it. Expedition Spiced Rum from a veteran-owned British spirits house. Real ingredients, small batch, built properly.',
    introBody: [
      "Most rum gifts are chosen by people who don't drink rum. You can tell. Generic bottle, generic packaging, forgotten a week later.",
      'Expedition Spiced Rum is a different kind of gift. Caribbean rum base, Welsh molasses, and a spice blend of Madagascan vanilla, Ceylon cinnamon, ginger, cassia, orange peel, and bourbon oak. Pot-distilled at Spirit of Wales Distillery in Newport in batches of 700 bottles. Real ingredients. Every one of them.',
      'It is built for people who take their drink seriously. The kind of person who notices the difference between something made properly and something made to a price point.',
      'Veteran-owned. No investors. No shortcuts. 5% of every sale goes to forces charities.',
      'If you are looking for a rum gift that means something — this is it.',
    ],
    productHandles: [
      'jerry-can-spirits-expedition-spiced-rum',
      'jerry-can-spirits-premium-gift-pack',
    ],
  },

  'spiced-rum': {
    h1: 'British Spiced Rum',
    metaTitle: 'British Spiced Rum | Small Batch | Jerry Can Spirits®',
    metaDescription:
      'Small-batch British spiced rum, pot-distilled at Spirit of Wales Distillery. Real spices, no artificial flavourings. Veteran-owned, Welsh-made.',
    introBody: [
      'Most spiced rum is made to a formula. Base spirit, artificial flavourings, a label that leans on nostalgia. The result is consistent, inoffensive, and forgettable.',
      'Expedition Spiced Rum is built differently. Caribbean rum base, Welsh brewery molasses, and a hand-selected spice blend: Madagascan vanilla, Ceylon cinnamon, ginger root, cassia bark, clove, orange peel, and bourbon oak. No artificial flavourings. Nothing that does not belong there.',
      'It is pot-distilled in Newport, South Wales by Spirit of Wales Distillery — 700 bottles per batch. When a batch is gone, that run is finished. Each batch has the kind of subtle variation that comes from doing things properly rather than at industrial scale.',
      'We are two Royal Corps of Signals veterans. We built this because we could not find what we wanted on the shelf. 17 years of service between us, and the same standards applied here.',
      '40% ABV. 700ml. Built to be sipped, not mixed and forgotten.',
    ],
    productHandles: ['jerry-can-spirits-expedition-spiced-rum'],
  },

  'cocktail-making-kits': {
    h1: 'Cocktail Making Kits',
    metaTitle: 'Cocktail Making Kits | Jerry Can Spirits®',
    metaDescription:
      'Cocktail making kits built for home bars. Proper bar tools paired with small-batch British spiced rum. Everything you need to make a cocktail worth drinking.',
    introBody: [
      'A cocktail making kit is only as good as what comes with it. Cheap tools and a bottle of something unmemorable is not a gift — it is a collection of items in a box.',
      'The barware here is selected for the same reason we selected every ingredient in Expedition Spiced Rum: because it has to work. Cocktail shakers, strainers, jiggers, mixing glasses. Tools that do their job properly and last.',
      'Pair them with Expedition Spiced Rum — pot-distilled at Spirit of Wales, real spices, no artificial flavourings — and you have everything needed to make a proper drink at home. Storm and Spice. Dark and Stormy. A Rum Old Fashioned. The Field Manual has the recipes.',
      'Good cocktails do not require talent. They require the right equipment and a spirit worth using. Both are here.',
    ],
    productHandles: [
      'jerry-can-spirits-premium-gift-pack',
      'stainless-steel-jigger-variants',
      'bar-blade-bottle-opener',
      'jerry-can-spirits-stainless-steel-freezable-stones',
    ],
  },

  'bar-accessories': {
    h1: 'Bar Accessories UK',
    metaTitle: 'Bar Accessories UK | Home Bar Tools | Jerry Can Spirits®',
    metaDescription:
      'Bar accessories for a proper home bar. Cocktail shakers, jiggers, strainers, and glassware — built to last, selected for people who take their drinks seriously.',
    introBody: [
      'A home bar does not need to be complicated. It needs the right tools, used correctly.',
      'The bar accessories here are chosen for function. A cocktail shaker that seals properly. A jigger that measures accurately. A strainer that does not let ice through when it should not. Glassware that holds a drink the way it was designed to be held.',
      'These are not decorative. They are equipment. The same logic we apply to Expedition Spiced Rum — built properly, no shortcuts — applies to everything we stock.',
      'Whether you are building a home bar from scratch or replacing something that has seen better days, start with tools that will not let you down. The Field Manual has everything you need to know about using them properly.',
    ],
    productHandles: [
      'stainless-steel-jigger-variants',
      'bar-blade-bottle-opener',
      'natural-slate-coaster-variants',
      'jerry-can-spirits-stainless-steel-freezable-stones',
      'crystal-ice-hiball-42cl',
      'hiball-glass-38cl',
    ],
  },

  'gifts-for-him': {
    h1: 'Rum Gifts for Him',
    metaTitle: 'Rum Gifts for Him | Jerry Can Spirits®',
    metaDescription:
      'Rum gifts for men who know what they like. Small-batch British spiced rum from a veteran-owned spirits house. Real ingredients, no shortcuts, 5% to forces charities.',
    introBody: [
      'The best gifts for him are the ones he would not buy himself. Not because he does not want them — because he has not got around to it, or because he does not feel justified spending the money on himself.',
      'Expedition Spiced Rum sits in that category. Caribbean rum, Welsh molasses, Madagascan vanilla, Ceylon cinnamon, ginger, cassia, clove, orange peel, bourbon oak. Pot-distilled at Spirit of Wales Distillery in 700-bottle batches. The kind of bottle you pick up, look at, and put somewhere visible.',
      'It is for the man who drinks properly. Who takes his time. Who notices the difference between something built with standards and something built to a margin.',
      'Veteran-owned. No investors. 5% of every sale to forces charities. Built by people who mean it.',
    ],
    productHandles: [
      'jerry-can-spirits-expedition-spiced-rum',
      'jerry-can-spirits-premium-gift-pack',
      'stainless-steel-jigger-variants',
      'jerry-can-spirits-stainless-steel-freezable-stones',
      'crystal-ice-hiball-42cl',
    ],
  },

  'rum-glasses': {
    h1: 'Rum Glasses UK',
    metaTitle: 'Rum Glasses UK | Best Glass for Rum | Jerry Can Spirits®',
    metaDescription:
      'The right glass makes a difference. Rum glasses selected for Expedition Spiced Rum — from highballs to tumblers. Shop rum glassware from Jerry Can Spirits.',
    introBody: [
      'The glass matters. Not in a fussy way — in a practical way. The right shape concentrates the nose, holds temperature correctly, and changes how the liquid moves when you drink it.',
      'For rum drunk neat or with a single cube, a tulip or nosing glass directs the aroma and slows the sip. For cocktails, the right highball or rocks glass is not decoration — it affects dilution, presentation, and how the drink behaves over time.',
      'Expedition Spiced Rum is designed to be sipped slowly. The vanilla and cinnamon open up as it warms slightly in the glass. The ginger and cassia come through in the middle. The bourbon oak holds through to the finish. None of that happens properly in the wrong vessel.',
      'The glassware here is selected with that in mind. Proper rum glasses, for people who drink rum properly.',
    ],
    productHandles: [
      'crystal-ice-hiball-42cl',
      'hiball-glass-38cl',
      'club-ice-tumbler-26cl',
      'hurricane-cocktail-glass-42cl',
    ],
  },

  // ── Shopify collection-based pages (migrated from inline COLLECTION_CONTENT) ──

  'gifts-and-experience': {
    h1: 'Gift Sets',
    metaTitle: 'Gift Sets | Jerry Can Spirits®',
    metaDescription:
      'Rum gift sets and experience bundles from Jerry Can Spirits. Veteran-owned, Welsh-distilled. Built for people who appreciate quality.',
    introBody: [
      'For anyone who holds themselves to a higher standard. Each gift set is built around Expedition Spiced Rum — pot-distilled at Spirit of Wales, real ingredients, no shortcuts.',
    ],
  },

  bundles: {
    h1: 'Bundles',
    metaTitle: 'Bundles | Jerry Can Spirits®',
    metaDescription:
      'Bundle deals on Jerry Can Spirits rum. Save when you stock up on Expedition Spiced Rum — veteran-owned, small-batch, built properly.',
    introBody: [
      'Stock up and save. The same Expedition Spiced Rum, better value. Every bottle from the same small batch, pot-distilled in South Wales.',
    ],
  },

  'new-releases': {
    h1: 'New Releases',
    metaTitle: 'New Releases | Jerry Can Spirits®',
    metaDescription:
      'New expressions from Jerry Can Spirits. Veteran-owned British spirits house — small-batch, built properly, no shortcuts.',
    introBody: ['The latest from the spirits house. Every expression built on the same principles as the first.'],
  },

  'gift-sets': {
    h1: 'Gift Sets',
    metaTitle: 'Gift Sets | Jerry Can Spirits®',
    metaDescription:
      'Rum gift sets and experience bundles from Jerry Can Spirits. Veteran-owned, Welsh-distilled. Built for people who appreciate quality.',
    introBody: [
      'For anyone who holds themselves to a higher standard. Each gift set is built around Expedition Spiced Rum — pot-distilled at Spirit of Wales, real ingredients, no shortcuts.',
    ],
  },
}
