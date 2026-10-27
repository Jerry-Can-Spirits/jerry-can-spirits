import { describe, expect, it } from 'vitest'
import { indexNowUrls } from '@/lib/indexnow'

describe('indexNowUrls', () => {
  it('turns revalidated paths into absolute URLs on the live host', () => {
    expect(indexNowUrls(['/field-manual/cocktails/negroni/', '/field-manual/cocktails/'])).toEqual([
      'https://jerrycanspirits.co.uk/field-manual/cocktails/negroni/',
      'https://jerrycanspirits.co.uk/field-manual/cocktails/',
    ])
  })

  it('drops a dynamic route pattern, which is a cache tag and not a page', () => {
    expect(indexNowUrls(['/shop/[collection]', '/shop/product/rum/'])).toEqual(['https://jerrycanspirits.co.uk/shop/product/rum/'])
  })

  it('submits each URL once', () => {
    expect(indexNowUrls(['/', '/'])).toEqual(['https://jerrycanspirits.co.uk/'])
  })

  it('ignores anything that is not a site path', () => {
    expect(indexNowUrls(['https://example.com/', 'shop'])).toEqual([])
  })
})
