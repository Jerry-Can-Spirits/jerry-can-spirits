export interface SearchResult {
  type: 'product' | 'page' | 'recipe' | 'equipment' | 'ingredient' | 'guide'
  title: string
  description?: string
  url: string
  image?: string
  category?: string
  keywords?: string
}

export const STATIC_SEARCH_PAGES: SearchResult[] = [
  // About
  { type: 'page', title: 'Our Story', description: 'Learn about Jerry Can Spirits journey from Royal Signals veterans to craft spirits founders', url: '/about/story/', category: 'About', keywords: 'expedition rum military army royal signals wales south wales british founders history background' },
  { type: 'page', title: 'Team', description: 'Meet the Jerry Can Spirits team of British Armed Forces veterans', url: '/about/team/', category: 'About', keywords: 'staff people founders army military' },
  { type: 'page', title: 'Dan Freeman', description: 'Director & Founder - Royal Corps of Signals veteran with 12 years service', url: '/about/team/dan-freeman/', category: 'Team', keywords: 'director founder army veteran signals' },
  { type: 'page', title: 'Rhys Williams', description: 'Co-Founder - Royal Corps of Signals veteran with 5 years service', url: '/about/team/rhys-williams/', category: 'Team', keywords: 'co-founder army veteran signals' },
  { type: 'page', title: 'Ethos', description: 'Our values, craftsmanship and commitment to quality spirits', url: '/ethos/', category: 'About', keywords: 'values principles philosophy quality craft commitment' },
  { type: 'page', title: 'Sustainability', description: 'Our commitment to sustainable practices and local sourcing', url: '/sustainability/', category: 'About', keywords: 'eco environment green local ethical carbon' },
  { type: 'page', title: 'Friends & Partners', description: 'Our partners and friends in the spirits industry', url: '/friends/', category: 'About', keywords: 'partners stockists collaborators associates' },
  { type: 'page', title: 'Armed Forces Covenant', description: 'Our commitment to the Armed Forces Covenant and support for veterans and serving personnel', url: '/armed-forces-covenant/', category: 'About', keywords: 'military veterans army navy RAF ERS covenant pledge' },
  { type: 'page', title: 'Reviews', description: 'Customer reviews and testimonials for Expedition Spiced Rum', url: '/reviews/', category: 'About', keywords: 'testimonials ratings customer feedback opinions stars' },
  { type: 'page', title: 'Careers', description: 'Job opportunities and careers at Jerry Can Spirits', url: '/careers/', category: 'About', keywords: 'jobs work employment vacancy hiring join apply' },
  { type: 'page', title: 'Batch Tracker', description: 'Track your bottle provenance with our digital product passport', url: '/batch/', category: 'About', keywords: 'QR code batch number bottle tracking scan provenance digital passport' },
  { type: 'page', title: 'Where the 5% Goes', description: 'How Jerry Can Spirits supports military charities through every bottle sold', url: '/giving/', category: 'About', keywords: 'charity donation military veterans armed forces 5 percent profit giving back support' },
  { type: 'page', title: 'The Expedition Log', description: 'A public record of founding supporters who bought the first bottles', url: '/expedition-log/', category: 'About', keywords: 'founding supporter first bottle registry log community join expedition record name' },
  // Resources
  { type: 'page', title: 'Field Manual', description: 'Cocktail recipes, bar equipment guides and ingredient information', url: '/field-manual/', category: 'Resources', keywords: 'bartending mixing drinks guide how to spirits' },
  { type: 'page', title: 'Guides', description: 'Expert spirits guides and cocktail tutorials', url: '/guides/', category: 'Resources', keywords: 'tutorials how to education learn rum guide spirits knowledge' },
  { type: 'page', title: 'Cocktails', description: 'Master classic rum cocktails with our recipes', url: '/field-manual/cocktails/', category: 'Field Manual', keywords: 'recipes drinks mixing bartender mojito daiquiri punch' },
  { type: 'page', title: 'Equipment', description: 'Essential bar tools and glassware for home bartending', url: '/field-manual/equipment/', category: 'Field Manual', keywords: 'bar tools shaker jigger strainer glassware muddler' },
  { type: 'page', title: 'Ingredients', description: 'Premium spirits and cocktail components explained', url: '/field-manual/ingredients/', category: 'Field Manual', keywords: 'lime sugar mint bitters orange lemon rum' },
  // Shop
  { type: 'page', title: 'Shop', description: 'Browse our full range of spirits, barware and clothing', url: '/shop/', category: 'Shop', keywords: 'buy purchase order gift' },
  { type: 'page', title: 'Drinks', description: 'Veteran-owned British spirits collection', url: '/shop/drinks/', category: 'Shop', keywords: 'expedition spiced rum 40% ABV 700ml bottle buy purchase' },
  { type: 'page', title: 'Barware', description: 'Professional bar tools and glassware', url: '/shop/barware/', category: 'Shop', keywords: 'shaker tools glasses buy equipment purchase' },
  { type: 'page', title: 'Clothing', description: 'Jerry Can Spirits adventure apparel', url: '/shop/clothing/', category: 'Shop', keywords: 't-shirt hoodie apparel wear merchandise gear' },
  { type: 'page', title: 'Rum Gifts UK', description: 'Rum gifts for people who actually drink it. Small-batch British spiced rum, real ingredients.', url: '/shop/rum-gifts/', category: 'Shop', keywords: 'rum gift gifts uk set birthday present expedition spiced' },
  { type: 'page', title: 'British Spiced Rum', description: 'Small-batch British spiced rum pot-distilled at Spirit of Wales. Real spices, no artificial flavourings.', url: '/shop/spiced-rum/', category: 'Shop', keywords: 'british spiced rum small batch wales veteran craft 40% abv 700ml buy' },
  { type: 'page', title: 'Cocktail Making Kits', description: 'Cocktail making kits for home bars. Proper bar tools paired with small-batch British spiced rum.', url: '/shop/cocktail-making-kits/', category: 'Shop', keywords: 'cocktail making kit gift set shaker jigger bar tools home bar' },
  { type: 'page', title: 'Bar Accessories UK', description: 'Bar accessories for a proper home bar. Cocktail shakers, jiggers, strainers and glassware.', url: '/shop/bar-accessories/', category: 'Shop', keywords: 'bar accessories uk home bar tools shaker strainer glassware equipment' },
  { type: 'page', title: 'Rum Gifts for Him', description: 'Rum gifts for men who know what they like. Small-batch British spiced rum, real ingredients.', url: '/shop/gifts-for-him/', category: 'Shop', keywords: 'rum gifts for him men bar gift birthday christmas father dad husband boyfriend' },
  { type: 'page', title: 'Rum Gifts for Her', description: 'Rum gifts for women who take their drink seriously. Small-batch British spiced rum, real ingredients.', url: '/shop/gifts-for-her/', category: 'Shop', keywords: 'rum gifts for her women bar gift birthday christmas mother mum wife girlfriend' },
  { type: 'page', title: 'Rum Glasses UK', description: 'The right glass makes a difference. Rum glasses selected for Expedition Spiced Rum.', url: '/shop/rum-glasses/', category: 'Shop', keywords: 'rum glasses uk best glass for rum highball tumbler glassware' },
  { type: 'page', title: 'Expedition Spiced Rum — Ingredients', description: 'What goes into Expedition Spiced Rum — our full ingredient breakdown', url: '/ingredients/expedition-spiced-rum/', category: 'Product', keywords: 'expedition rum recipe spices vanilla cinnamon what is in ingredient list' },
  // Support & Contact
  { type: 'page', title: 'Contact', description: 'Get in touch with Jerry Can Spirits', url: '/contact/', category: 'Support', keywords: 'email phone message enquiry help support' },
  { type: 'page', title: 'General Enquiries', description: 'Send a general enquiry to Jerry Can Spirits', url: '/contact/enquiries/', category: 'Support', keywords: 'enquiry question ask contact message' },
  { type: 'page', title: 'Complaints', description: 'How to raise a complaint with Jerry Can Spirits', url: '/contact/complaints/', category: 'Support', keywords: 'complaint issue problem dispute' },
  { type: 'page', title: 'Media', description: 'Press enquiries, brand assets and media kit', url: '/contact/media/', category: 'Support', keywords: 'press journalist PR brand assets logo download' },
  { type: 'page', title: 'FAQ', description: 'Frequently asked questions about orders, shipping and our spirits', url: '/faq/', category: 'Support', keywords: 'questions answers help delivery refund returns order' },
  // Legal
  { type: 'page', title: 'Privacy Policy', description: 'How we protect and handle your personal data', url: '/privacy-policy/', category: 'Legal', keywords: 'GDPR data personal information protection' },
  { type: 'page', title: 'Terms of Service', description: 'Terms and conditions for using our website and services', url: '/terms-of-service/', category: 'Legal', keywords: 'terms conditions agreement legal' },
  { type: 'page', title: 'Cookie Policy', description: 'How we use cookies on our website', url: '/cookie-policy/', category: 'Legal', keywords: 'cookies tracking consent preferences' },
  { type: 'page', title: 'Shipping & Returns', description: 'Delivery information and returns policy', url: '/shipping-returns/', category: 'Legal', keywords: 'delivery postage refund exchange send' },
  { type: 'page', title: 'Security Policy', description: 'How we keep your information secure', url: '/security-policy/', category: 'Legal', keywords: 'security safe protection' },
  { type: 'page', title: 'Accessibility', description: 'Our commitment to website accessibility', url: '/accessibility/', category: 'Legal', keywords: 'disability screen reader WCAG accessible' },
  // Stockists
  { type: 'page', title: 'Find a Stockist', description: 'Find Jerry Can Spirits Expedition Spiced Rum near you', url: '/stockists/', category: 'Shop', keywords: 'stockist near me buy local pub bar shop find location postcode' },
  // Trade
  { type: 'page', title: 'Trade', description: 'Wholesale and trade enquiries for Expedition Spiced Rum', url: '/trade/', category: 'Trade', keywords: 'wholesale trade stockist account buy bulk bar pub restaurant' },
]

export function searchStaticPages(tokens: string[]): SearchResult[] {
  return STATIC_SEARCH_PAGES.filter(item => {
    const text = [item.title, item.description, item.category, item.keywords]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return tokens.every(token => text.includes(token))
  })
}
