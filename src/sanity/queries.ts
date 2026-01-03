// GROQ queries for fetching data from Sanity

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
  category,
  featured,
  "image": image.asset->url
}`

export const cocktailBySlugQuery = `*[_type == "cocktail" && slug.current == $slug][0] {
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
  category,
  featured,
  "image": image.asset->url
}`

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
  featured,
  flavorProfile,
  abv,
  origin,
  productionMethod,
  substitutions,
  pairsWellWith,
  seasonality,
  priceRange,
  shelfLife,
  videoUrl,
  history,
  professionalTip,
  "relatedCocktails": relatedCocktails[]->{ _id, name, slug },
  "relatedIngredients": relatedIngredients[]->{ _id, name, slug }
}`

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