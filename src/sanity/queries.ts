// GROQ queries for fetching data from Sanity

// Sitemap query - only fetches slug for URL generation
export const cocktailsSitemapQuery = `*[_type == "cocktail"] { slug }`

// Optimized listing query - only fetches fields needed for preview cards
export const cocktailsListQuery = `*[_type == "cocktail"] | order(_createdAt desc) {
  _id,
  name,
  slug,
  description,
  difficulty,
  family,
  baseSpirit,
  category,
  tags,
  featured,
  "image": image.asset->url
}`

// Full query - fetches all fields for detail pages
export const cocktailsQuery = `*[_type == "cocktail"] | order(_createdAt desc) {
  _id,
  name,
  slug,
  description,
  difficulty,
  "glassware": glassware->{ _id, name, slug },
  garnish,
  ingredients[] {
    name,
    amount,
    description,
    "ingredientRef": ingredientRef->{ _id, name, slug }
  },
  instructions,
  note,
  variants[] {
    name,
    description,
    difficulty,
    ingredients[] {
      name,
      amount,
      "ingredientRef": ingredientRef->{ _id, name, slug }
    },
    instructions,
    note
  },
  family,
  baseSpirit,
  category,
  tags,
  featured,
  "image": image.asset->url
}`

export const cocktailBySlugQuery = `*[_type == "cocktail" && slug.current == $slug][0] {
  _id,
  _createdAt,
  name,
  slug,
  description,
  difficulty,
  "glassware": glassware->{ _id, name, slug },
  garnish,
  ingredients[] {
    name,
    amount,
    description,
    "ingredientRef": ingredientRef->{ _id, name, slug }
  },
  instructions,
  note,
  variants[] {
    name,
    description,
    difficulty,
    ingredients[] {
      name,
      amount,
      "ingredientRef": ingredientRef->{ _id, name, slug }
    },
    instructions,
    note
  },
  family,
  baseSpirit,
  category,
  tags,
  featured,
  "image": image.asset->url,
  videoUrl,
  relatedGuides[] {
    "guide": guide->{ _id, title, slug },
    sectionAnchor,
    linkText
  }
}`

// Sitemap query - only fetches slug for URL generation
export const ingredientsSitemapQuery = `*[_type == "ingredient"] { slug }`

// Optimized listing query - only fetches fields needed for preview cards
export const ingredientsListQuery = `*[_type == "ingredient"] | order(category asc, name asc) {
  _id,
  name,
  slug,
  category,
  description,
  image,
  featured
}`

// Full query - fetches all fields for listing pages with more detail
export const ingredientsQuery = `*[_type == "ingredient"] | order(category asc, name asc) {
  _id,
  name,
  slug,
  category,
  description,
  usage,
  topTips,
  recommendedBrands,
  storage,
  image,
  featured
}`

export const ingredientBySlugQuery = `*[_type == "ingredient" && slug.current == $slug][0] {
  _id,
  name,
  slug,
  category,
  description,
  usage,
  topTips,
  recommendedBrands,
  storage,
  image,
  budgetImage,
  premiumImage,
  featured,
  flavorProfile,
  abv,
  origin,
  productionMethod,
  substitutions,
  seasonality,
  priceRange,
  shelfLife,
  videoUrl,
  history,
  professionalTip,
  "relatedCocktails": relatedCocktails[]->{ _id, name, slug },
  "relatedIngredients": relatedIngredients[]->{ _id, name, slug }
}`

// Sitemap query - only fetches slug for URL generation
export const equipmentSitemapQuery = `*[_type == "equipment"] { slug }`

// Optimized listing query - only fetches fields needed for preview cards
export const equipmentListQuery = `*[_type == "equipment"] | order(category asc, name asc) {
  _id,
  name,
  slug,
  category,
  description,
  essential,
  image,
  featured
}`

// Full query - fetches all fields for listing pages with more detail
export const equipmentQuery = `*[_type == "equipment"] | order(category asc, name asc) {
  _id,
  name,
  slug,
  category,
  description,
  usage,
  essential,
  specifications {
    material,
    capacity,
    details
  },
  tips,
  image,
  featured
}`

export const equipmentBySlugQuery = `*[_type == "equipment" && slug.current == $slug][0] {
  _id,
  name,
  slug,
  category,
  description,
  usage,
  essential,
  specifications {
    material,
    capacity,
    details
  },
  tips,
  image,
  featured,
  priceRange {
    budget,
    premium
  },
  whatToLookFor,
  commonMistakes,
  careInstructions,
  lifespan,
  budgetAlternative,
  premiumOption,
  history,
  professionalTip,
  videoUrl,
  "relatedCocktails": relatedCocktails[]->{ _id, name, slug }
}`

// Product query - matches by slug or shopifyHandle for flexible matching
export const productByHandleQuery = `*[_type == "product" && (slug.current == $slug || shopifyHandle == $handle)][0] {
  _id,
  name,
  slug,
  shopifyHandle,
  tastingNotes {
    aroma,
    palate,
    finish
  },
  process,
  flavorProfile {
    primary,
    strength
  },
  servingSuggestions,
  pairsWith,
  professionalTip,
  history,
  "image": image.asset->url,
  featured,
  videoUrl,
  "relatedCocktails": relatedCocktails[]->{ _id, name, slug },
  whatsIncluded[] {
    item,
    description,
    quantity
  },
  dietary {
    vegan,
    vegetarian,
    glutenFree,
    allergens,
    additionalInfo
  },
  faqs[] {
    question,
    answer
  }
}`

// Sitemap query - only fetches slug for URL generation
export const guidesSitemapQuery = `*[_type == "guide"] { slug }`

// Optimized listing query - only fetches fields needed for preview cards
export const guidesListQuery = `*[_type == "guide"] | order(publishedAt desc, _createdAt desc) {
  _id,
  title,
  slug,
  excerpt,
  category,
  featured,
  isPillar,
  publishedAt,
  "heroImage": heroImage.asset->url
}`

// Full query for guide detail pages
export const guideBySlugQuery = `*[_type == "guide" && slug.current == $slug][0] {
  _id,
  _createdAt,
  title,
  slug,
  excerpt,
  metaTitle,
  metaDescription,
  keywords,
  category,
  featured,
  isPillar,
  author,
  publishedAt,
  updatedAt,
  introduction,
  sections[] {
    heading,
    content,
    subsections[] {
      subheading,
      content
    }
  },
  faqs[] {
    question,
    answer
  },
  comparisonTables[] {
    caption,
    headers,
    rows[] {
      cells
    }
  },
  featuredDistilleries[] {
    name,
    location,
    description,
    website,
    speciality
  },
  "relatedGuides": relatedGuides[]->{ _id, title, slug, excerpt, category },
  "relatedCocktails": relatedCocktails[]->{ _id, name, slug },
  relatedProducts[] {
    shopifyHandle,
    contextNote
  },
  "heroImage": heroImage.asset->url,
  callToAction {
    text,
    url
  },
  estimatedWordCount
}`

// Featured cocktails for batch pages (4 spiced rum cocktails, preferring featured)
export const featuredCocktailsQuery = `*[_type == "cocktail" && baseSpirit == "Spiced Rum"] | order(featured desc, _createdAt desc)[0...4] {
  _id,
  name,
  slug,
  description,
  difficulty,
  "image": image.asset->url
}`

// Count queries for Field Manual stats
export const fieldManualCountsQuery = `{
  "cocktails": count(*[_type == "cocktail"]),
  "ingredients": count(*[_type == "ingredient"]),
  "equipment": count(*[_type == "equipment"])
}`

// Adjacent guides query for prev/next navigation
export const adjacentGuidesQuery = `{
  "prev": *[_type == "guide" && (
    publishedAt < $currentDate ||
    (publishedAt == $currentDate && _createdAt < $currentCreatedAt)
  )] | order(publishedAt desc, _createdAt desc)[0] {
    _id,
    title,
    slug,
    category
  },
  "next": *[_type == "guide" && (
    publishedAt > $currentDate ||
    (publishedAt == $currentDate && _createdAt > $currentCreatedAt)
  )] | order(publishedAt asc, _createdAt asc)[0] {
    _id,
    title,
    slug,
    category
  }
}`