export type Pillar = { title: string; body: string }

export type CategoryConfig = {
  h1: string
  metaTitle: string
  metaDescription: string
  introBody: string[]
  productHandles?: string[]
  seoTitle?: string
  seoBody?: string[]
  pillars?: Pillar[]
}

export const CATEGORIES: Record<string, CategoryConfig> = {

  // ── SEO category pages (handle-based product fetching) ──────────────────

  'rum-gifts': {
    h1: 'Rum Gifts',
    metaTitle: 'Rum Gifts UK | Jerry Can Spirits®',
    metaDescription:
      'Rum gifts for people who actually drink it. Expedition Spiced Rum from a veteran-owned British spirits house. Real ingredients, small batch, built properly.',
    introBody: [
      "Most rum gifts are chosen by people who don't drink rum. You can tell. Generic bottle, generic packaging, forgotten a week later.",
      'Expedition Spiced Rum is a different kind of gift. Caribbean rum base, Welsh molasses, and a spice blend of Madagascan vanilla, Ceylon cinnamon, ginger, cassia, orange peel, and bourbon oak. Pot-distilled at Spirit of Wales Distillery in Newport in batches of 700 bottles. Real ingredients. Every one of them.',
      'It is built for people who take their drink seriously. The kind of person who notices the difference between something made properly and something made to a price point.',
      'Veteran-owned. No investors. No shortcuts. 5% of every sale goes to forces charities.',
      'If you are looking for a rum gift that means something. This is it.',
    ],
    productHandles: [
      'jerry-can-spirits-expedition-spiced-rum',
      'jerry-can-spirits-premium-gift-pack',
    ],
    seoTitle: 'What Makes Expedition Spiced Rum a Proper Rum Gift',
    seoBody: [
      'A rum gift lands differently when it is chosen properly. Not a novelty bottle with a generic label. Not something grabbed from the supermarket shelf because it looked like it might be premium. Expedition Spiced Rum is a gift that says something about the person who gave it.',
      'Caribbean rum base, Welsh brewery molasses, and a spice blend of Madagascan vanilla, Ceylon cinnamon, ginger root, cassia bark, clove, orange peel, and bourbon oak. Pot-distilled at Spirit of Wales Distillery in Newport. 700 bottles per batch. Real ingredients, every one of them.',
      'It is veteran-owned. Bootstrapped. No investors, no shortcuts. 5% of every sale goes to forces charities. This is the kind of brand people feel good about buying from. And when the person receiving it looks it up, they will understand why you chose it.',
    ],
    pillars: [
      { title: 'Arrives Ready to Gift', body: 'Clean, considered packaging that does not need wrapping to look like it was thought about. Pair with glassware or a gift pack if you want to go further.' },
      { title: 'A Rum Worth Drinking', body: 'Not a display bottle. Designed to be opened, sipped slowly, and finished properly. Caribbean rum, real spices, 40% ABV. The kind of thing people come back to.' },
      { title: 'Veteran-Owned', body: 'Founded by two Royal Corps of Signals veterans. Armed Forces Covenant signatories. 5% of every sale supports forces charities. A purchase that gives back.' },
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
      'It is pot-distilled in Newport, South Wales by Spirit of Wales Distillery. 700 bottles per batch. When a batch is gone, that run is finished. Each batch has the kind of subtle variation that comes from doing things properly rather than at industrial scale.',
      'We are two Royal Corps of Signals veterans. We built this because we could not find what we wanted on the shelf. 17 years of service between us, and the same standards applied here.',
      '40% ABV. 700ml. Built to be sipped, not mixed and forgotten.',
    ],
    productHandles: ['jerry-can-spirits-expedition-spiced-rum'],
    seoTitle: '40% ABV. 700ml. Built to Be Sipped.',
    seoBody: [
      'Expedition Spiced Rum is not designed to be mixed and forgotten. It is designed to be the reason someone stops and pays attention. The vanilla opens first. Then cinnamon. The ginger and cassia come through the middle. Bourbon oak on the finish. Nothing synthetic. Nothing that does not belong.',
      'We are Spirit of Wales Distillery production partners. Our batches are pot-distilled, 700 bottles at a time. That is not a marketing claim. It is a physical constraint. When a batch is sold, that specific run is finished. The next batch will be made properly, with the same care, but it will have subtle variations. That is what real small-batch means.',
      'If you have been drinking spiced rum for years and never found one you would choose over a whisky or gin, this might change that. Try it neat first. Then over one cube. Then decide what to do with the rest of the bottle.',
    ],
    pillars: [
      { title: 'Real Ingredients Only', body: 'Madagascan vanilla. Ceylon cinnamon. Ginger root. Cassia bark. Clove. Orange peel. Bourbon oak. No artificial flavourings. Every flavour comes from something that grew in the ground.' },
      { title: 'Small-Batch, Genuinely', body: '700 bottles per batch. Pot-distilled at Spirit of Wales Distillery, Newport. When it is gone, it is gone. Each batch carries subtle variation because it is made properly, not at industrial scale.' },
      { title: 'Veteran-Made', body: 'Two Royal Corps of Signals veterans. 17 years of service between us. Armed Forces Covenant signatories. ERS Bronze Award. 5% of every sale to forces charities.' },
    ],
  },

  'cocktail-making-kits': {
    h1: 'Cocktail Making Kits',
    metaTitle: 'Cocktail Making Kits | Jerry Can Spirits®',
    metaDescription:
      'Cocktail making kits built for home bars. Proper bar tools paired with small-batch British spiced rum. Everything you need to make a cocktail worth drinking.',
    introBody: [
      'A cocktail making kit is only as good as what comes with it. Cheap tools and a bottle of something unmemorable is not a gift. It is a collection of items in a box.',
      'The barware here is selected for the same reason we selected every ingredient in Expedition Spiced Rum: because it has to work. Cocktail shakers, strainers, jiggers, mixing glasses. Tools that do their job properly and last.',
      'Pair them with Expedition Spiced Rum, pot-distilled at Spirit of Wales with real spices and no artificial flavourings. Everything needed to make a proper drink at home. A Rum Old Fashioned. A proper sour. The Field Manual has the recipes.',
      'Good cocktails do not require talent. They require the right equipment and a spirit worth using. Both are here.',
    ],
    seoTitle: 'What Separates a Cocktail Kit from a Collection of Items in a Box',
    seoBody: [
      'Most cocktail making kits are assembled by procurement teams, not bartenders. You can tell. Generic shaker, a bottle of something unmemorable, padded out with items that serve no purpose. The result is a gift that communicates effort without demonstrating taste.',
      'The kits here pair Expedition Spiced Rum with barware we actually use. A stainless steel shaker that seals properly. A jigger that measures accurately. Everything selected because it does its job, paired with a rum built the same way.',
      'The Field Manual has the cocktail recipes. The rum and the tools are here. Everything else is practice.',
    ],
    pillars: [
      { title: 'A Spirit Worth Building From', body: 'Expedition Spiced Rum is pot-distilled at Spirit of Wales Distillery. Real spices, no artificial flavourings. A rum worth using as the foundation of any cocktail.' },
      { title: 'Tools That Actually Work', body: 'Stainless steel shaker. Accurate jigger. Selected because they do the job, not because they photograph well in a box.' },
      { title: 'The Recipes Are Here', body: 'The Field Manual covers everything. Rum Old Fashioned. Rum Sour. Proper cocktails, written clearly, for people who want to make them right.' },
    ],
    productHandles: [
      'jerry-can-spirits-premium-gift-pack',
      'stainless-steel-cocktail-shaker',
      'stainless-steel-jigger',
      'bar-blade-bottle-opener',
      'stainless-steel-spirit-stones',
    ],
  },

  'bar-accessories': {
    h1: 'Bar Accessories',
    metaTitle: 'Bar Accessories UK | Home Bar Tools | Jerry Can Spirits®',
    metaDescription:
      'Bar accessories for a proper home bar. Cocktail shakers, jiggers, and glassware. Built to last, selected for people who take their drinks seriously.',
    introBody: [
      'A home bar does not need to be complicated. It needs the right tools, used correctly.',
      'The bar accessories here are chosen for function. A cocktail shaker that seals properly. A jigger that measures accurately. Glassware that holds a drink the way it was designed to be held.',
      'These are not decorative. They are equipment. The same logic applies here as with Expedition Spiced Rum. Built properly. No shortcuts.',
      'Whether you are building a home bar from scratch or replacing something that has seen better days, start with tools that will not let you down. The Field Manual has everything you need to know about using them properly.',
    ],
    seoTitle: 'How to Build a Home Bar That Actually Works',
    seoBody: [
      'A home bar does not need to be impressive. It needs to function. The right shaker. A jigger that measures properly. Glassware that suits the drinks you make. When the tools are right, the drinks follow.',
      'Every piece of barware in this collection is something we use ourselves. The stainless steel cocktail shaker seals without leaking. The jigger measures in 25ml and 50ml. The glassware is selected for what goes in it, not how it looks on a shelf.',
      'The Field Manual has the recipes. The bar accessories have the tools. Everything you need to make a proper cocktail at home is here.',
    ],
    pillars: [
      { title: 'Stainless Steel. No Compromise.', body: 'No chrome plating to flake. No plastic seals to split. Everything here is built to be used regularly and to last.' },
      { title: 'Chosen for Function', body: 'Every item earned its place. We only stock tools that do their job properly. Nothing that looked good in a box but failed in practice.' },
      { title: 'The Field Manual', body: 'Every tool is referenced in the Field Manual alongside the recipes and techniques that make the most of it.' },
    ],
    productHandles: [
      'stainless-steel-cocktail-shaker',
      'stainless-steel-jigger',
      'bar-blade-bottle-opener',
      'natural-slate-coasters-square-or-round',
      'stainless-steel-spirit-stones',
      'crystal-ice-hiball-42cl',
      'hiball-glass-38cl',
    ],
  },

  'gifts-for-him': {
    h1: 'Rum Gifts for Him',
    metaTitle: 'Rum Gifts for Him | Jerry Can Spirits®',
    metaDescription:
      'Rum gifts for men who drink properly. Small-batch British spiced rum, real ingredients, no shortcuts. 5% of every sale to forces charities.',
    introBody: [
      'The best gifts for him are the ones he would not buy himself. Not because he does not want them. Because he has not got around to it, or because he does not feel justified spending the money on himself.',
      'Expedition Spiced Rum sits in that category. Caribbean rum, Welsh molasses, Madagascan vanilla, Ceylon cinnamon, ginger, cassia, clove, orange peel, bourbon oak. Pot-distilled at Spirit of Wales Distillery in 700-bottle batches. The kind of bottle you pick up, look at, and put somewhere visible.',
      'It is for the man who drinks properly. Who takes his time. Who notices the difference between something built with standards and something built to a margin.',
      'Veteran-owned. No investors. 5% of every sale to forces charities. Built by people who mean it.',
    ],
    seoTitle: 'Not a Generic Gift. A Bottle Worth Noticing.',
    seoBody: [
      'The best gifts for him do not need to be explained. They communicate something clearly. Expedition Spiced Rum is a 700ml statement. The packaging is considered. The name has a story behind it. The rum inside is made properly.',
      'Caribbean rum, Welsh molasses, Madagascan vanilla, Ceylon cinnamon, ginger, cassia, clove, orange peel, bourbon oak. Pot-distilled in Newport, Wales. 700 bottles per batch. Built by two Royal Corps of Signals veterans who could not find what they wanted on the shelf.',
      'He will either drink it properly and appreciate every detail of it, or he will put it somewhere visible and people will ask about it. Either outcome works.',
    ],
    pillars: [
      { title: 'A Bottle That Holds Its Own', body: 'This is not a novelty purchase. 40% ABV. Real spices. No artificial flavourings. The kind of rum you reach for when you want something worth drinking.' },
      { title: 'Veteran-Owned', body: 'Founded by two Royal Signals veterans. No investors. No shortcuts. 5% of profits to forces charities. A purchase you can feel good about making.' },
      { title: 'Pair It Right', body: 'Neat. Over ice. With a proper mixer. All three work. Add a jigger or spirit stones if you want to give something extra alongside.' },
    ],
    productHandles: [
      'jerry-can-spirits-expedition-spiced-rum',
      'jerry-can-spirits-premium-gift-pack',
      'stainless-steel-jigger',
      'stainless-steel-spirit-stones',
      'crystal-ice-hiball-42cl',
    ],
  },

  'gifts-for-her': {
    h1: 'Rum Gifts for Her',
    metaTitle: 'Rum Gifts for Her | Jerry Can Spirits®',
    metaDescription:
      'Rum gifts for women who take their drink seriously. Small-batch British spiced rum, real ingredients, no shortcuts. 5% of every sale to forces charities.',
    introBody: [
      'The assumption that a rum gift for her should be softer, sweeter, or less serious is wrong. Expedition Spiced Rum does not adjust for the recipient.',
      'Caribbean rum base, Welsh molasses, Madagascan vanilla, Ceylon cinnamon, ginger, cassia, clove, orange peel, bourbon oak. Pot-distilled at Spirit of Wales Distillery in Newport in 700-bottle batches. The kind of bottle you pick up, look at, and put somewhere visible.',
      'It is for the woman who drinks properly. Who takes her time. Who would rather have one good bottle than three forgettable ones.',
      'Veteran-owned. No investors. 5% of every sale to forces charities. Built by people who mean it.',
    ],
    seoTitle: 'A Rum Gift for the Person Who Drinks Properly.',
    seoBody: [
      'Expedition Spiced Rum does not adjust for the recipient. The spice blend is the same. The distillation process is the same. The 40% ABV is the same. This is a rum built for people who take their drink seriously, regardless of who is pouring it.',
      'Caribbean rum base, Welsh brewery molasses, Madagascan vanilla, Ceylon cinnamon, ginger, cassia, clove, orange peel, bourbon oak. Pot-distilled at Spirit of Wales Distillery in Newport in 700-bottle batches. One bottle, made properly, no concessions.',
      'The best gifts are the ones the recipient would not buy for themselves. Not because they would not want it. Because they have not got around to it, or because they do not feel justified spending the money on themselves. This is that gift.',
    ],
    pillars: [
      { title: 'No Adjustment for the Label', body: 'The rum is the same regardless of who is drinking it. Real ingredients, 40% ABV, no shortcuts. Designed for anyone who drinks properly.' },
      { title: 'Veteran-Owned, Independent', body: 'Founded by two Royal Signals veterans. Bootstrapped. No investors. 5% of every sale supports forces charities.' },
      { title: 'One Good Bottle', body: 'Rather than three forgettable ones. A single 700ml bottle of something real, made properly, worth opening slowly.' },
    ],
    productHandles: [
      'jerry-can-spirits-expedition-spiced-rum',
      'jerry-can-spirits-premium-gift-pack',
      'stainless-steel-jigger',
      'stainless-steel-spirit-stones',
      'crystal-ice-hiball-42cl',
    ],
  },

  'rum-glasses': {
    h1: 'Rum Glasses',
    metaTitle: 'Rum Glasses UK | Best Glass for Rum | Jerry Can Spirits®',
    metaDescription:
      'The right glass makes a difference. Rum glasses selected for Expedition Spiced Rum. Highballs to tumblers. Shop rum glassware from Jerry Can Spirits.',
    introBody: [
      'The glass matters. Not in a fussy way. In a practical way. The right shape concentrates the nose, holds temperature correctly, and changes how the liquid moves when you drink it.',
      'For rum drunk neat or with a single cube, a highball or rocks glass is not decoration. It affects dilution, presentation, and how the drink behaves over time.',
      'Expedition Spiced Rum is designed to be sipped slowly. The vanilla and cinnamon open up as it warms slightly in the glass. The ginger and cassia come through in the middle. The bourbon oak holds through to the finish. None of that happens properly in the wrong vessel.',
      'The glassware here is selected with that in mind. Proper rum glasses, for people who drink rum properly.',
    ],
    seoTitle: 'The Right Glass Changes the Drink',
    seoBody: [
      'A highball holds carbonation longer and gives a rum and mixer room to breathe. A rocks glass concentrates the nose on a neat pour. A mixer glass keeps a stirred cocktail cold without over-diluting. These are not arbitrary distinctions. They affect what you taste and how the drink develops.',
      'Expedition Spiced Rum opens with vanilla and cinnamon. The ginger and cassia come through the middle. The bourbon oak holds to the finish. The right glass gives each of those notes space to arrive on their own terms.',
      'The glassware here is chosen for the drinks you are likely to make with it. Not for how it photographs on a shelf.',
    ],
    pillars: [
      { title: 'Shape Affects Flavour', body: 'Width, height, and rim diameter all change how aroma reaches you and how quickly the drink warms. These are functional differences, not aesthetic ones.' },
      { title: 'Selected for Rum', body: 'Every glass here works with Expedition Spiced Rum. Neat, over ice, or in a cocktail. Chosen because it does the job properly.' },
      { title: 'Pairs With the Field Manual', body: 'The Field Manual has the recipes. The glassware has the vessels. Together they give you everything needed to make a proper drink at home.' },
    ],
    productHandles: [
      'crystal-ice-hiball-42cl',
      'hiball-glass-38cl',
      'club-ice-tumbler-26cl',
      'hurricane-cocktail-glass-42cl',
      'contemporary-mixer-glass-31cl',
    ],
  },

  'hip-flasks': {
    h1: 'Hip Flasks',
    metaTitle: 'Hip Flasks UK | Stainless Steel Hip Flask | Jerry Can Spirits®',
    metaDescription:
      'Stainless steel hip flasks from Jerry Can Spirits. Built for the field. A proper flask that holds your drink, seals properly, and survives being carried.',
    introBody: [
      'A hip flask should do one thing without failing. Hold your drink, seal properly, and survive being in a jacket pocket.',
      'The flasks here are stainless steel. No chrome plating to flake. No lining to crack. Built to the same standard as everything else we stock.',
      'Fill it with Expedition Spiced Rum. Put it in your pocket. That is the idea.',
      'Veteran-owned. No shortcuts.',
    ],
    seoTitle: 'Built for the Field. Built to Last.',
    seoBody: [
      'A hip flask is a simple object with one job. It has to seal. It has to survive being sat on, carried in a pack, or pulled out in the field. Chrome-plated flasks flake. Lined flasks crack. Stainless steel does neither.',
      'These flasks are built to the same standard as everything else we stock. No concessions to appearance over function. Fill it, pocket it, forget it is there until you need it.',
      'Expedition Spiced Rum in a stainless steel flask. That is a proper combination.',
    ],
    pillars: [
      { title: 'Stainless Steel', body: 'No plating to flake. No lining to crack. A material chosen because it does the job without failing, not because it is cheaper to make.' },
      { title: 'Seals Properly', body: 'The seal is the point. A flask that leaks in your jacket pocket is a flask that failed its one job. These do not.' },
      { title: 'The Right Fill', body: 'Expedition Spiced Rum at 40% ABV carries well in a flask. The spice holds. The flavour does not collapse. Fill it and carry it with confidence.' },
    ],
    productHandles: ['stainless-steel-hip-flask-500ml'],
  },

  'ice-chilling': {
    h1: 'Ice and Chilling',
    metaTitle: 'Ice and Chilling | Spirit Stones and Chilling Accessories | Jerry Can Spirits®',
    metaDescription:
      'Stainless steel spirit stones and chilling accessories. Keep your drink cold without diluting it. From Jerry Can Spirits.',
    introBody: [
      'Ice dilutes. That is not always what you want.',
      'Spirit stones chill your drink without adding water. Stainless steel, reusable, and chilled in the freezer. The temperature drops. The flavour stays.',
      'For Expedition Spiced Rum sipped slowly, this is the right way to serve it.',
      'This range will grow. More chilling and serving accessories to follow.',
    ],
    seoTitle: 'Cold Drink. Full Flavour.',
    seoBody: [
      'Ice does two things: it chills and it dilutes. When you want cold without water, spirit stones are the answer. Drop them in from the freezer. The temperature falls. The flavour of what you poured does not change.',
      'For Expedition Spiced Rum, this matters. The vanilla, cinnamon, and oak are built to be experienced at full strength. Dilution softens them. Spirit stones keep them intact while still bringing the temperature down.',
      'Stainless steel. Reusable. No flavour transfer. Back in the freezer when you are done.',
    ],
    pillars: [
      { title: 'No Dilution', body: 'Spirit stones chill without adding water. The flavour profile you poured is the flavour profile you drink. Every note stays in place.' },
      { title: 'Reusable', body: 'Freeze, use, rinse, repeat. Stainless steel transfers no flavour and requires no maintenance. They last indefinitely.' },
      { title: 'The Right Serve for Slow Sipping', body: 'Expedition Spiced Rum is designed to be sipped, not rushed. Spirit stones chill it to the right temperature and keep it there as you go.' },
    ],
    productHandles: ['stainless-steel-spirit-stones'],
  },

  'cocktail-glasses-glassware': {
    h1: 'Cocktail Glasses',
    metaTitle: 'Cocktail Glasses UK | Highballs, Tumblers and More | Jerry Can Spirits®',
    metaDescription:
      'Cocktail glasses for the home bar. Highballs, tumblers, hurricane glasses and mixer glasses. The right vessel makes a difference.',
    introBody: [
      'The right glass changes how a drink behaves. Not as a rule for its own sake. Shape affects temperature, dilution, and how the aroma reaches you.',
      'A highball holds carbonation better. A tumbler lets a spirit open up. A hurricane glass is built for layered cocktails. Each one has a reason.',
      'The glassware here is selected for the home bar. Nothing decorative. Everything functional.',
      'Works with rum, whisky, gin, or whatever you are pouring. The Field Manual has the recipes.',
    ],
    seoTitle: 'Every Glass Here Has a Reason',
    seoBody: [
      'Glassware is not just a vessel. The shape of the glass affects how aroma reaches you, how quickly the drink warms, how carbonation holds, and how ice behaves. A highball is tall because it keeps a longer pour cold and holds carbonation against a mixer. A tumbler is wide because it lets a neat spirit breathe.',
      'The glasses in this collection are selected for the drinks you are actually likely to make. Highballs for long drinks. Tumblers for spirits over ice. Hurricane glasses for layered cocktails. Mixer glasses for stirred drinks that need to stay cold.',
      'Nothing here is decorative. Everything has a job to do.',
    ],
    pillars: [
      { title: 'Shape Affects Taste', body: 'The width of the rim, the height of the bowl, the weight of the base. Each affects how a drink reaches you. These are functional decisions, not aesthetic ones.' },
      { title: 'Selected for the Home Bar', body: 'Not the back bar of a nightclub. Glasses chosen for the drinks a home bar makes: long pours, neat sips, stirred cocktails, and the occasional layered build.' },
      { title: 'Works With Any Spirit', body: 'Designed around rum, but the right glass for gin, whisky, or whatever you are pouring. Good glassware is not spirit-specific.' },
    ],
    productHandles: [
      'crystal-ice-hiball-42cl',
      'hiball-glass-38cl',
      'club-ice-tumbler-26cl',
      'contemporary-mixer-glass-31cl',
      'hurricane-cocktail-glass-42cl',
      'original-handled-drinking-jam-jar-46cl',
    ],
  },

  'cocktail-shakers': {
    h1: 'Cocktail Shakers',
    metaTitle: 'Cocktail Shakers UK | Stainless Steel Cocktail Shaker | Jerry Can Spirits®',
    metaDescription:
      'Stainless steel cocktail shakers for the home bar. Seals properly, chills properly, built to last. From Jerry Can Spirits.',
    introBody: [
      'A cocktail shaker has one job. Seal properly, chill the drink, and not leak when you turn it upside down.',
      'The shaker here is stainless steel. No plastic seals to split. No chrome finish to peel. Built for regular use.',
      'Pair it with Expedition Spiced Rum and the Field Manual recipes. Everything you need to make a proper drink at home.',
      'Veteran-owned. No shortcuts.',
    ],
    seoTitle: 'A Shaker That Does Its Job',
    seoBody: [
      'The cocktail shaker is the most basic piece of kit behind a home bar. It has two functions: seal and chill. A shaker that leaks or fails to seal has failed completely. There is no middle ground.',
      'The shaker here is stainless steel. It seals. It chills quickly and holds temperature through the shake. It does not peel, crack, or flex. Built for regular use over years, not occasional use until the seal wears.',
      'Pair it with a jigger that measures accurately and Expedition Spiced Rum. Add the Field Manual for recipes. That is a proper home bar setup.',
    ],
    pillars: [
      { title: 'Seals Every Time', body: 'The only requirement of a shaker is that it seals. This one does, every time. No leaked drinks, no spillage, no embarrassment.' },
      { title: 'Chills Fast', body: 'Stainless steel transfers cold efficiently. Shake for twelve seconds and the drink is properly chilled. Longer and you risk over-dilution.' },
      { title: 'Built for Regular Use', body: 'No chrome to peel. No plastic to crack. Stainless steel construction built for the home bar that actually gets used, not the one that decorates a shelf.' },
    ],
    productHandles: ['stainless-steel-cocktail-shaker'],
  },

  // ── Shopify collection-based pages (migrated from inline COLLECTION_CONTENT) ──

  bundles: {
    h1: 'Bundles',
    metaTitle: 'Expedition Spiced Rum Bundles | Save When You Stock Up | Jerry Can Spirits®',
    metaDescription:
      'Stock up on Expedition Spiced Rum and save. Same small-batch British rum, better value. Veteran-owned, pot-distilled in South Wales.',
    introBody: [
      'Stock up and save. The same Expedition Spiced Rum at better value when you order more. Caribbean rum base, Welsh molasses, real spices. Built properly, every batch.',
      'Every bottle comes from the same small batch, pot-distilled at Spirit of Wales Distillery in Newport. 700 bottles per run. When a batch is gone, it is gone.',
      'If you drink it regularly, this is how you stay stocked.',
    ],
  },

  'new-releases': {
    h1: 'New Releases',
    metaTitle: 'New Releases | Jerry Can Spirits®',
    metaDescription:
      'New expressions from Jerry Can Spirits. Veteran-owned British spirits house. Small-batch, built properly, no shortcuts. Every release earns its place.',
    introBody: [
      'Every new expression starts from the same place. Real ingredients. No artificial flavourings. Pot-distilled in small batches at Spirit of Wales Distillery.',
      'Expedition Spiced Rum was the first. What comes next is built on the same principles. Nothing ships until it is right.',
      'Sign up below to hear about new releases before they go public.',
    ],
    productHandles: ['jerry-can-spirits-expedition-spiced-rum'],
  },
}

const giftSetsConfig: CategoryConfig = {
  h1: 'Gift Sets',
  metaTitle: 'Gift Sets | Jerry Can Spirits®',
  metaDescription:
    'Rum gift sets and experience bundles from Jerry Can Spirits. Veteran-owned, Welsh-distilled. Built for people who appreciate quality.',
  introBody: [
    'For anyone who holds themselves to a higher standard. Each gift set is built around Expedition Spiced Rum. Pot-distilled at Spirit of Wales, real ingredients, no shortcuts.',
  ],
}

CATEGORIES['gifts-and-experience'] = giftSetsConfig
CATEGORIES['gift-sets'] = giftSetsConfig
