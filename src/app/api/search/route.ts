import { NextRequest, NextResponse } from 'next/server'
import { getProducts } from '@/lib/shopify'
import { client } from '@/sanity/lib/client'

interface SearchResult {
  type: 'product' | 'page' | 'recipe' | 'equipment' | 'ingredient' | 'guide'
  title: string
  description?: string
  url: string
  image?: string
  category?: string
  keywords?: string
}

interface SanityCocktail {
  _id: string
  name: string
  slug: { current: string }
  description: string
  category?: string
  image?: string
}

interface SanityEquipment {
  _id: string
  name: string
  slug: { current: string }
  description: string
  usage: string
  category?: string
  image?: string
}

interface SanityIngredient {
  _id: string
  name: string
  slug: { current: string }
  description: string
  usage: string
  category?: string
  image?: string
}

interface SanityGuide {
  _id: string
  title: string
  slug: { current: string }
  excerpt: string
  category?: string
  image?: string
}

// Static searchable pages
const searchablePages: SearchResult[] = [
  // About section
  { type: 'page', title: 'Our Story', description: 'Learn about Jerry Can Spirits journey from Royal Signals veterans to rum makers', url: '/about/story/', category: 'About', keywords: 'expedition rum military army royal signals wales south wales british founders history background' },
  { type: 'page', title: 'Team', description: 'Meet the Jerry Can Spirits team of British Armed Forces veterans', url: '/about/team/', category: 'About', keywords: 'staff people founders army military' },
  { type: 'page', title: 'Dan Freeman', description: 'Director & Founder - Royal Corps of Signals veteran with 12 years service', url: '/about/team/dan-freeman/', category: 'Team', keywords: 'director founder army veteran signals' },
  { type: 'page', title: 'Rhys Williams', description: 'Co-Founder - Royal Corps of Signals veteran with 5 years service', url: '/about/team/rhys-williams/', category: 'Team', keywords: 'co-founder army veteran signals' },
  { type: 'page', title: 'Ethos', description: 'Our values, craftsmanship and commitment to quality spirits', url: '/ethos/', category: 'About', keywords: 'values principles philosophy quality craft commitment' },
  { type: 'page', title: 'Sustainability', description: 'Our commitment to sustainable practices and local sourcing', url: '/sustainability/', category: 'About', keywords: 'eco environment green local ethical carbon' },
  { type: 'page', title: 'Friends', description: 'Our partners and friends in the spirits industry', url: '/friends/', category: 'About', keywords: 'partners stockists collaborators associates' },
  { type: 'page', title: 'Armed Forces Covenant', description: 'Our commitment to the Armed Forces Covenant and support for veterans and serving personnel', url: '/armed-forces-covenant/', category: 'About', keywords: 'military veterans army navy RAF ERS covenant pledge' },
  { type: 'page', title: 'Reviews', description: 'Customer reviews and testimonials for Expedition Spiced Rum', url: '/reviews/', category: 'About', keywords: 'testimonials ratings customer feedback opinions stars' },
  { type: 'page', title: 'Careers', description: 'Job opportunities and careers at Jerry Can Spirits', url: '/careers/', category: 'About', keywords: 'jobs work employment vacancy hiring join apply' },
  { type: 'page', title: 'Batch Tracker', description: 'Track your bottle provenance with our digital product passport', url: '/batch/', category: 'About', keywords: 'QR code batch number bottle tracking scan provenance digital passport' },
  // Resources
  { type: 'page', title: 'Field Manual', description: 'Cocktail recipes, bar equipment guides and ingredient information', url: '/field-manual/', category: 'Resources', keywords: 'bartending mixing drinks guide how to spirits' },
  { type: 'page', title: 'Guides', description: 'Expert spirits guides and cocktail tutorials', url: '/guides/', category: 'Resources', keywords: 'tutorials how to education learn rum guide spirits knowledge' },
  { type: 'page', title: 'Cocktails', description: 'Master classic rum cocktails with our recipes', url: '/field-manual/cocktails/', category: 'Field Manual', keywords: 'recipes drinks mixing bartender mojito daiquiri punch' },
  { type: 'page', title: 'Equipment', description: 'Essential bar tools and glassware for home bartending', url: '/field-manual/equipment/', category: 'Field Manual', keywords: 'bar tools shaker jigger strainer glassware muddler' },
  { type: 'page', title: 'Ingredients', description: 'Premium spirits and cocktail components explained', url: '/field-manual/ingredients/', category: 'Field Manual', keywords: 'lime sugar mint bitters orange lemon rum' },
  // Shop
  { type: 'page', title: 'Shop', description: 'Browse our full range of rum, barware and clothing', url: '/shop/', category: 'Shop', keywords: 'buy purchase order gift' },
  { type: 'page', title: 'Drinks', description: 'Premium veteran-owned British rum collection', url: '/shop/drinks/', category: 'Shop', keywords: 'expedition spiced rum 40% ABV 700ml bottle buy purchase' },
  { type: 'page', title: 'Barware', description: 'Professional bar tools and glassware', url: '/shop/barware/', category: 'Shop', keywords: 'shaker tools glasses buy equipment purchase' },
  { type: 'page', title: 'Clothing', description: 'Jerry Can Spirits adventure apparel', url: '/shop/clothing/', category: 'Shop', keywords: 't-shirt hoodie apparel wear merchandise gear' },
  { type: 'page', title: 'Expedition Spiced Rum — Ingredients', description: 'What goes into Expedition Spiced Rum — our full ingredient breakdown', url: '/ingredients/expedition-spiced-rum/', category: 'Product', keywords: 'expedition rum recipe spices vanilla cinnamon what is in ingredient list' },
  // Support & Contact
  { type: 'page', title: 'Contact', description: 'Get in touch with Jerry Can Spirits', url: '/contact/', category: 'Support', keywords: 'email phone message enquiry help support' },
  { type: 'page', title: 'General Enquiries', description: 'Send a general enquiry to Jerry Can Spirits', url: '/contact/enquiries/', category: 'Support', keywords: 'enquiry question ask contact message' },
  { type: 'page', title: 'Complaints', description: 'How to raise a complaint with Jerry Can Spirits', url: '/contact/complaints/', category: 'Support', keywords: 'complaint issue problem dispute' },
  { type: 'page', title: 'Media', description: 'Press enquiries, brand assets and media kit', url: '/contact/media/', category: 'Support', keywords: 'press journalist PR brand assets logo download' },
  { type: 'page', title: 'FAQ', description: 'Frequently asked questions about orders, shipping and our rum', url: '/faq/', category: 'Support', keywords: 'questions answers help delivery refund returns order' },
  // Policies
  { type: 'page', title: 'Privacy Policy', description: 'How we protect and handle your personal data', url: '/privacy-policy/', category: 'Legal', keywords: 'GDPR data personal information protection' },
  { type: 'page', title: 'Terms of Service', description: 'Terms and conditions for using our website and services', url: '/terms-of-service/', category: 'Legal', keywords: 'terms conditions agreement legal' },
  { type: 'page', title: 'Cookie Policy', description: 'How we use cookies on our website', url: '/cookie-policy/', category: 'Legal', keywords: 'cookies tracking consent preferences' },
  { type: 'page', title: 'Shipping & Returns', description: 'Delivery information and returns policy', url: '/shipping-returns/', category: 'Legal', keywords: 'delivery postage refund exchange send' },
  { type: 'page', title: 'Security Policy', description: 'How we keep your information secure', url: '/security-policy/', category: 'Legal', keywords: 'security safe protection' },
  { type: 'page', title: 'Accessibility', description: 'Our commitment to website accessibility', url: '/accessibility/', category: 'Legal', keywords: 'disability screen reader WCAG accessible' },
]

// Sanity search queries
const cocktailsSearchQuery = `*[_type == "cocktail" && (
  name match $searchTerm ||
  description match $searchTerm ||
  category match $searchTerm
)] | order(_createdAt desc) [0...10] {
  _id,
  name,
  slug,
  description,
  category,
  "image": image.asset->url
}`

const equipmentSearchQuery = `*[_type == "equipment" && (
  name match $searchTerm ||
  description match $searchTerm ||
  usage match $searchTerm ||
  category match $searchTerm
)] | order(_createdAt desc) [0...10] {
  _id,
  name,
  slug,
  description,
  usage,
  category,
  "image": image.asset->url
}`

const ingredientsSearchQuery = `*[_type == "ingredient" && (
  name match $searchTerm ||
  description match $searchTerm ||
  usage match $searchTerm ||
  category match $searchTerm
)] | order(_createdAt desc) [0...10] {
  _id,
  name,
  slug,
  description,
  usage,
  category,
  "image": image.asset->url
}`

const guidesSearchQuery = `*[_type == "guide" && (
  title match $searchTerm ||
  excerpt match $searchTerm ||
  introduction match $searchTerm ||
  category match $searchTerm
)] | order(publishedAt desc) [0...10] {
  _id,
  title,
  slug,
  excerpt,
  category,
  "image": heroImage.asset->url
}`

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ results: [] })
    }

    const searchQuery = query.toLowerCase().trim()
    const searchTokens = searchQuery.split(/\s+/).filter(Boolean)
    const sanitySearchTerm = searchTokens.length > 1 ? query.trim() : `*${query.trim()}*`
    const results: SearchResult[] = []

    // Search static pages
    const pageMatches = searchablePages.filter(item => {
      const text = [item.title, item.description, item.category, item.keywords].filter(Boolean).join(' ').toLowerCase()
      return searchTokens.every(token => text.includes(token))
    })
    results.push(...pageMatches)

    // Search Shopify products (skip if credentials not configured)
    if (process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN && process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN) {
      try {
        const products = await getProducts()
        const productMatches = products
          .filter(product => {
            const text = [product.title, product.description, ...(product.tags || [])].join(' ').toLowerCase()
            return searchTokens.every(token => text.includes(token))
          })
          .map(product => ({
            type: 'product' as const,
            title: product.title,
            description: product.description.substring(0, 100) + (product.description.length > 100 ? '...' : ''),
            url: `/shop/product/${product.handle}`,
            image: product.images[0]?.url,
            category: 'Shop',
          }))
        results.push(...productMatches)
      } catch (error) {
        console.error('Error searching Shopify products:', error)
      }
    }

    // Search Sanity cocktails
    try {
      const cocktails = await client.fetch(cocktailsSearchQuery, {
        searchTerm: sanitySearchTerm
      })

      const cocktailMatches = cocktails.map((cocktail: SanityCocktail) => ({
        type: 'recipe' as const,
        title: cocktail.name,
        description: cocktail.description,
        url: `/cocktails/${cocktail.slug.current}`,
        image: cocktail.image,
        category: cocktail.category || 'Cocktails',
      }))
      results.push(...cocktailMatches)
    } catch (error) {
      console.error('Error searching Sanity cocktails:', error)
    }

    // Search Sanity equipment
    try {
      const equipment = await client.fetch(equipmentSearchQuery, {
        searchTerm: sanitySearchTerm
      })

      const equipmentMatches = equipment.map((item: SanityEquipment) => ({
        type: 'equipment' as const,
        title: item.name,
        description: item.description,
        url: `/field-manual/equipment/${item.slug.current}`,
        image: item.image,
        category: item.category || 'Equipment',
      }))
      results.push(...equipmentMatches)
    } catch (error) {
      console.error('Error searching Sanity equipment:', error)
    }

    // Search Sanity ingredients
    try {
      const ingredients = await client.fetch(ingredientsSearchQuery, {
        searchTerm: sanitySearchTerm
      })

      const ingredientMatches = ingredients.map((item: SanityIngredient) => ({
        type: 'ingredient' as const,
        title: item.name,
        description: item.description,
        url: `/field-manual/ingredients/${item.slug.current}`,
        image: item.image,
        category: item.category || 'Ingredients',
      }))
      results.push(...ingredientMatches)
    } catch (error) {
      console.error('Error searching Sanity ingredients:', error)
    }

    // Search Sanity guides
    try {
      const guides = await client.fetch(guidesSearchQuery, {
        searchTerm: sanitySearchTerm
      })

      const guideMatches = guides.map((item: SanityGuide) => ({
        type: 'guide' as const,
        title: item.title,
        description: item.excerpt,
        url: `/guides/${item.slug.current}`,
        image: item.image,
        category: item.category ? item.category.split('-').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Guides',
      }))
      results.push(...guideMatches)
    } catch (error) {
      console.error('Error searching Sanity guides:', error)
    }

    // Limit total results and return
    return NextResponse.json({ results: results.slice(0, 12) })
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json({ error: 'Search failed', results: [] }, { status: 500 })
  }
}
