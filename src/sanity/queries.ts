// GROQ queries for fetching data from Sanity

export const cocktailsQuery = `*[_type == "cocktail"] | order(_createdAt desc) {
  _id,
  name,
  slug,
  description,
  difficulty,
  glassware,
  garnish,
  ingredients,
  instructions,
  note,
  variants,
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
  glassware,
  garnish,
  ingredients,
  instructions,
  note,
  variants,
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

export const equipmentQuery = `*[_type == "equipment"] | order(category asc, name asc) {
  _id,
  name,
  slug,
  category,
  description,
  usage,
  essential,
  specifications,
  tips,
  image,
  featured
}`