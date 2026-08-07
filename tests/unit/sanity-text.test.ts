/**
 * The fixture below carries one of every shape the real corpus uses: plain
 * strings, portable text with markDefs, the nested sections/subsections tree
 * where 57% of guide body copy lives, FAQ arrays, comparison tables, reference
 * arrays, asset objects with alt text, and an object of pure numbers.
 *
 * Word counts are asserted per field AND in total. A field the walker stops
 * reaching drops out of byField and takes the total with it, so the test fails
 * rather than quietly agreeing with itself — which is what happens if you only
 * assert that the total equals the sum of the parts, since a missed field is
 * absent from both sides of that comparison.
 */
import { describe, it, expect } from 'vitest'
import { extractText, extractLinks, EmptyExtractionError } from '@/lib/sanity-text'

const FIXTURE = {
  _id: 'guide-fixture',
  _type: 'guide',
  _rev: 'abc',
  // 3 words
  title: 'Autumn Cocktails Guide',
  // 5 words
  excerpt: 'Warming seasonal drinks for harvest',
  // slug is a machine value, never prose
  slug: { current: 'autumn-cocktails-guide' },
  // 7 words across two spans
  introduction: [
    {
      _type: 'block',
      _key: 'i1',
      children: [{ _type: 'span', text: 'The nights draw in and' }, { _type: 'span', text: ' warm drinks' }],
      markDefs: [{ _type: 'internalLink', _key: 'm1', _ref: 'guide-winter' }],
    },
  ],
  sections: [
    {
      _key: 's1',
      _type: 'section',
      // 2 words
      heading: 'Building Syrups',
      // 8 words — the plain-string copy that pt::text() returned nothing for
      content: 'Simple syrup is equal parts sugar and water',
      // 8 words — the near-duplicate portable-text copy
      contentRich: [
        {
          _type: 'block',
          _key: 'b1',
          children: [{ _type: 'span', text: 'Simple syrup is equal parts sugar and water' }],
          markDefs: [{ _type: 'internalLink', _key: 'm2', _ref: 'ingredient-syrup' }],
        },
      ],
      subsections: [
        {
          _key: 'ss1',
          // 2 words
          subheading: 'Spiced Variations',
          // 6 words — the tier that was in neither content field
          content: 'Add cinnamon and star anise sparingly',
          // 6 words
          contentRich: [
            {
              _type: 'block',
              _key: 'b2',
              children: [{ _type: 'span', text: 'Add cinnamon and star anise sparingly' }],
              markDefs: [],
            },
          ],
        },
      ],
    },
  ],
  // 4 + 5 = 9 words
  faqs: [{ _key: 'f1', question: 'What is simple syrup', answer: 'Equal parts sugar and water' }],
  comparisonTables: [
    {
      _key: 't1',
      // 3 words
      caption: 'Syrup ratios compared',
      // 2 words
      headers: ['Syrup', 'Ratio'],
      // 2 words
      rows: [{ _key: 'r1', cells: ['Simple', '1:1'] }],
    },
  ],
  // 2 words of text, plus a link that must not be counted as text
  callToAction: { text: 'Shop syrups', url: '/shop/syrups/' },
  // asset reference with 3 words of alt text
  heroImage: { asset: { _ref: 'image-abc-800x600-jpg' }, alt: 'A copper pan' },
  // reference array: links, no text
  relatedGuides: [{ _key: 'rg1', _type: 'reference', _ref: 'guide-winter-cocktails' }],
  // present, non-empty, and legitimately holds no prose
  priceRange: { budget: 8, premium: 22 },
  featured: true,
}

// Hand-counted from the comments above.
const EXPECTED_BY_FIELD: Record<string, number> = {
  title: 3,
  excerpt: 5,
  introduction: 7,
  sections: 32,
  faqs: 9,
  comparisonTables: 7,
  callToAction: 2,
  heroImage: 3,
}

describe('extractText', () => {
  const result = extractText(FIXTURE)

  it('reaches every prose field, including the nested subsection tier', () => {
    expect(result.byField).toEqual(EXPECTED_BY_FIELD)
  })

  it('totals the same as the sum of its parts', () => {
    const sum = Object.values(EXPECTED_BY_FIELD).reduce((a, b) => a + b, 0)
    expect(result.words).toBe(sum)
    expect(result.words).toBe(68)
  })

  it('includes subsection copy that lives in neither content field of the parent section', () => {
    expect(result.text).toContain('Add cinnamon and star anise sparingly')
  })

  it('includes the plain-string copy that a portable-text reader returns nothing for', () => {
    expect(result.text).toContain('Simple syrup is equal parts sugar and water')
  })

  it('excludes slugs, asset refs and link destinations from the text', () => {
    expect(result.text).not.toContain('autumn-cocktails-guide')
    expect(result.text).not.toContain('image-abc')
    expect(result.text).not.toContain('/shop/syrups/')
  })

  it('keeps alt text, which is copy even though it sits on an asset', () => {
    expect(result.text).toContain('A copper pan')
  })

  it('stays silent about an object of pure numbers rather than calling it broken', () => {
    expect(() => extractText({ _type: 'x', priceRange: { budget: 8, premium: 22 } })).not.toThrow()
  })
})

describe('present but empty is an error', () => {
  it('throws when a field holds prose but the walk yields nothing', () => {
    // An asset object is walked shallowly on purpose, because by convention it
    // carries flat alt and caption strings. Here the prose is nested one level
    // deeper, so the walk returns nothing while the field plainly holds words.
    // That disagreement is precisely the condition the guard exists for, and
    // it is what pt::text() on a string looked like from the outside: a
    // populated field reported as empty.
    const doc = {
      _type: 'guide',
      pic: { asset: {}, caption: { long: 'real words that the walk never reaches' } },
    }
    expect(() => extractText(doc)).toThrow(EmptyExtractionError)
    expect(() => extractText(doc)).toThrow(/pic is present/)
  })

  it('does not throw for a field that is genuinely absent or blank', () => {
    expect(() => extractText({ _type: 'guide', title: 'A title', notes: '' })).not.toThrow()
    expect(() => extractText({ _type: 'guide', title: 'A title', notes: [] })).not.toThrow()
  })
})

describe('extractLinks', () => {
  const links = extractLinks(FIXTURE)

  it('finds inline markDef references that never appear in the text', () => {
    const refs = links.filter((l) => l.kind === 'reference').map((l) => l.value)
    expect(refs).toContain('guide-winter')
    expect(refs).toContain('ingredient-syrup')
  })

  it('finds reference fields and asset references', () => {
    const refs = links.filter((l) => l.kind === 'reference').map((l) => l.value)
    expect(refs).toContain('guide-winter-cocktails')
    expect(refs).toContain('image-abc-800x600-jpg')
  })

  it('finds literal destinations', () => {
    const hrefs = links.filter((l) => l.kind === 'href').map((l) => l.value)
    expect(hrefs).toContain('/shop/syrups/')
  })

  it('records where each link came from', () => {
    const inline = links.find((l) => l.value === 'ingredient-syrup')
    expect(inline?.field).toMatch(/^sections/)
  })
})
