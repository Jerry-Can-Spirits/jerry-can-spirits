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

describe('cloudflareImageLoader — Cloudflare Images', () => {
  const BASE = 'https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ/2d4ac61a-0e68-460d-895f-839bc7c69b00'

  it('replaces a named variant with width and quality', () => {
    expect(cloudflareImageLoader({ src: `${BASE}/public`, width: 640 })).toBe(`${BASE}/w=640,q=75`)
  })

  // A crop set on purpose (Joshua Sisson's headshot, 19 Oct 2026) was being
  // replaced by w/q, which served the uncropped photo.
  it('keeps a flexible-variant crop and adds width and quality', () => {
    expect(cloudflareImageLoader({ src: `${BASE}/trim=25;98;542;20`, width: 384 })).toBe(
      `${BASE}/trim=25;98;542;20,w=384,q=75`,
    )
  })

  it('overrides width and quality already in the URL rather than repeating them', () => {
    expect(cloudflareImageLoader({ src: `${BASE}/fit=cover,w=100,q=50`, width: 3000, quality: 80 })).toBe(
      `${BASE}/fit=cover,w=1200,q=80`,
    )
  })
})
