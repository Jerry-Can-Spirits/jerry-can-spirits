import { describe, expect, it } from 'vitest'
import cloudflareImageLoader from '@/lib/cloudflareImageLoader'

describe('cloudflareImageLoader — Shopify images', () => {
  it('appends a width param so the CDN resizes (and serves WebP/AVIF via Accept)', () => {
    const out = cloudflareImageLoader({
      src: 'https://cdn.shopify.com/s/files/1/0001/products/rum.jpg?v=123',
      width: 828,
    })
    const url = new URL(out)
    expect(url.searchParams.get('width')).toBe('828')
    // Existing query params (e.g. the version) are preserved.
    expect(url.searchParams.get('v')).toBe('123')
  })

  it('caps width at the 1600px source ceiling', () => {
    const out = cloudflareImageLoader({
      src: 'https://cdn.shopify.com/s/files/1/0001/products/rum.jpg',
      width: 3000,
    })
    expect(new URL(out).searchParams.get('width')).toBe('1600')
  })

  it('overrides a width baked in by a GraphQL transform, giving a real srcset', () => {
    const out = cloudflareImageLoader({
      src: 'https://cdn.shopify.com/s/files/1/0001/products/rum.jpg?width=1600',
      width: 640,
    })
    expect(new URL(out).searchParams.get('width')).toBe('640')
  })
})

describe('cloudflareImageLoader — other hosts unchanged', () => {
  it('still transforms Sanity images (w/q/auto=format)', () => {
    const out = cloudflareImageLoader({
      src: 'https://cdn.sanity.io/images/proj/dataset/abc.jpg',
      width: 828,
      quality: 70,
    })
    const url = new URL(out)
    expect(url.searchParams.get('w')).toBe('828')
    expect(url.searchParams.get('q')).toBe('70')
    expect(url.searchParams.get('auto')).toBe('format')
  })

  it('leaves unknown external hosts untouched', () => {
    const src = 'https://example.com/badge.png'
    expect(cloudflareImageLoader({ src, width: 800 })).toBe(src)
  })
})
