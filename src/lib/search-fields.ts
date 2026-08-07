// Which fields site search actually looks at.
//
// Search used to match four top-level fields per document type. MEASURED
// against the live corpus, that reached 56,269 of 527,058 words — under 11%.
// For guides it was 2.2%: every section, subsection, FAQ and comparison table
// was unsearchable, so a reader who searched for a phrase they had just read
// in a guide got nothing back. Search is the fallback when navigation fails,
// and it was failing silently.
//
// Filtering stays in GROQ rather than moving into the Worker. Sanity can scan
// its own dataset server-side; pulling half a million words through the Worker
// on every keystroke to filter them in memory would trade a correctness bug
// for a latency one. The cost of that choice is that this list is written by
// hand, which is exactly the name-driven fragility that caused the original
// defect — so the list is not trusted. A test uses extractText as an oracle:
// it walks real documents by shape, and every prose field it finds must be
// covered here. A field added to the schema and forgotten here fails that
// test rather than quietly becoming unsearchable.
//
// Fields deliberately excluded are listed in NOT_SEARCHABLE below, each with a
// reason, so that "missing" and "decided against" cannot be confused.

export const SEARCHABLE_PATHS: Record<string, string[]> = {
  guide: [
    'title',
    'excerpt',
    'category',
    'author',
    'metaTitle',
    'metaDescription',
    'keywords[]',
    'introduction[].children[].text',
    'sections[].heading',
    'sections[].content',
    'sections[].contentRich[].children[].text',
    'sections[].subsections[].subheading',
    'sections[].subsections[].content',
    'sections[].subsections[].contentRich[].children[].text',
    'faqs[].question',
    'faqs[].answer',
    'comparisonTables[].caption',
    'comparisonTables[].headers[]',
    'comparisonTables[].rows[].cells[]',
    'callToAction.text',
    'relatedProducts[].name',
    'relatedProducts[].description',
    'featuredDistilleries[].name',
    'featuredDistilleries[].description',
  ],
  cocktail: [
    'name',
    'description',
    'family',
    'baseSpirit',
    'difficulty',
    'metaTitle',
    'metaDescription',
    'keywords[]',
    'tags[]',
    'note',
    'garnish',
    'garnishes[]',
    'servings',
    'prepTime',
    'author',
    'flavorProfile[]',
    'longDescription[].children[].text',
    'ingredients[].name',
    'ingredients[].amount',
    'ingredients[].notes',
    'instructions[].step',
    'instructions[].tip',
    'faqs[].question',
    'faqs[].answer',
    'variants[].name',
    'variants[].description',
    'image.alt',
  ],
  ingredient: [
    'name',
    'description',
    'usage',
    'category',
    'author',
    'metaTitle',
    'metaDescription',
    'keywords[]',
    'history',
    'origin',
    'abv',
    'seasonality',
    'shelfLife',
    'storage',
    'productionMethod',
    'professionalTip',
    'topTips[]',
    'substitutions[]',
    'pairsWellWith[]',
    'flavorProfile.tasting',
    'flavorProfile.primary[]',
    'flavorProfile.strength',
    'recommendedBrands.budget',
    'recommendedBrands.premium',
    'longDescription[].children[].text',
    'faqs[].question',
    'faqs[].answer',
    'image.alt',
  ],
  equipment: [
    'name',
    'description',
    'usage',
    'category',
    'glassType',
    'metaTitle',
    'metaDescription',
    'keywords[]',
    'history',
    'professionalTip',
    'budgetAlternative',
    'premiumOption',
    'tips[]',
    'commonMistakes[]',
    'whatToLookFor[]',
    'careInstructions[]',
    'lifespan[]',
    'specifications.material',
    'specifications.capacity',
    'specifications.details',
    'longDescription[].children[].text',
    'faqs[].question',
    'faqs[].answer',
    'image.alt',
  ],
}

// Prose fields intentionally left out of search, with the reason. Anything not
// here and not in SEARCHABLE_PATHS is a gap, and the coverage test says so.
export const NOT_SEARCHABLE: Record<string, Record<string, string>> = {
  guide: {
    publishedAt: 'a date, not copy — matching it would surface guides by digits in the timestamp',
    relatedGuides: 'references to other documents, which are searchable in their own right',
  },
  cocktail: {
    relatedGuides: 'references to other documents, which are searchable in their own right',
  },
  ingredient: {
    relatedGuides: 'references to other documents, which are searchable in their own right',
  },
  equipment: {
    relatedGuides: 'references to other documents, which are searchable in their own right',
  },
}

/**
 * The GROQ predicate matching a search term against every searchable field of
 * a document type.
 */
export function matchClause(type: string, param = 'searchTerm'): string {
  const paths = SEARCHABLE_PATHS[type]
  if (!paths) throw new Error(`No searchable field list for document type "${type}"`)
  return paths.map((p) => `${p} match $${param}`).join(' || ')
}
