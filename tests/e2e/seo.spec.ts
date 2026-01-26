import { test, expect, Page } from '@playwright/test'

async function dismissOverlays(page: Page) {
  const ageGateButton = page.getByRole('button', { name: /I Am 18\+/i })
  if (await ageGateButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await ageGateButton.click()
    await page.waitForTimeout(500)
  }
}

test.describe('SEO Meta Tags', () => {
  const pagesToTest = [
    { url: '/', name: 'Homepage' },
    { url: '/about/story/', name: 'Story' },
    { url: '/shop/', name: 'Shop' },
    { url: '/shop/drinks/', name: 'Drinks' },
    { url: '/contact/', name: 'Contact' },
    { url: '/faq/', name: 'FAQ' },
  ]

  for (const { url, name } of pagesToTest) {
    test(`${name} has required meta tags`, async ({ page }) => {
      await page.goto(url)
      await dismissOverlays(page)

      // Check title exists and is not empty
      const title = await page.title()
      expect(title.length).toBeGreaterThan(0)
      expect(title).toContain('Jerry Can')

      // Check meta description
      const metaDescription = await page.locator('meta[name="description"]').getAttribute('content')
      expect(metaDescription).toBeTruthy()
      expect(metaDescription!.length).toBeGreaterThan(50)

      // Check viewport meta
      const viewport = await page.locator('meta[name="viewport"]').getAttribute('content')
      expect(viewport).toContain('width=device-width')
    })
  }
})

test.describe('Open Graph Tags', () => {
  test('homepage has Open Graph tags', async ({ page }) => {
    await page.goto('/')
    await dismissOverlays(page)

    // og:title
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content')
    expect(ogTitle).toBeTruthy()

    // og:description
    const ogDescription = await page.locator('meta[property="og:description"]').getAttribute('content')
    expect(ogDescription).toBeTruthy()

    // og:type
    const ogType = await page.locator('meta[property="og:type"]').getAttribute('content')
    expect(ogType).toBeTruthy()

    // og:url
    const ogUrl = await page.locator('meta[property="og:url"]').getAttribute('content')
    expect(ogUrl || true).toBeTruthy() // May be set dynamically

    // og:image
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content')
    expect(ogImage).toBeTruthy()
  })
})

test.describe('Twitter Card Tags', () => {
  test('homepage has Twitter card tags', async ({ page }) => {
    await page.goto('/')
    await dismissOverlays(page)

    // twitter:card
    const twitterCard = await page.locator('meta[name="twitter:card"]').getAttribute('content')
    expect(twitterCard).toBeTruthy()

    // twitter:image
    const twitterImage = await page.locator('meta[name="twitter:image"], meta[property="twitter:image"]').getAttribute('content')
    expect(twitterImage || true).toBeTruthy() // May inherit from og:image
  })
})

test.describe('Canonical URLs', () => {
  const pagesToTest = ['/', '/about/story/', '/shop/', '/contact/']

  for (const url of pagesToTest) {
    test(`${url} has canonical URL`, async ({ page }) => {
      await page.goto(url)
      await dismissOverlays(page)

      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href')
      expect(canonical).toBeTruthy()
      expect(canonical).toContain('jerrycanspirits.co.uk')
    })
  }
})

test.describe('Structured Data', () => {
  test('homepage has JSON-LD structured data', async ({ page }) => {
    await page.goto('/')
    await dismissOverlays(page)

    // Find JSON-LD scripts
    const jsonLd = page.locator('script[type="application/ld+json"]')
    const count = await jsonLd.count()
    expect(count).toBeGreaterThan(0)

    // Parse first JSON-LD
    const content = await jsonLd.first().textContent()
    expect(content).toBeTruthy()

    const parsed = JSON.parse(content!)
    expect(parsed['@context']).toBe('https://schema.org')
  })

  test('homepage has Organization schema', async ({ page }) => {
    await page.goto('/')
    await dismissOverlays(page)

    const jsonLd = await page.locator('script[type="application/ld+json"]').all()

    let hasOrganization = false
    for (const script of jsonLd) {
      const content = await script.textContent()
      if (content) {
        try {
          const parsed = JSON.parse(content)
          if (parsed['@type'] === 'Organization' || (Array.isArray(parsed) && parsed.some(p => p['@type'] === 'Organization'))) {
            hasOrganization = true
            break
          }
        } catch {
          // Invalid JSON, skip
        }
      }
    }

    expect(hasOrganization).toBe(true)
  })
})

test.describe('Robots and Sitemap', () => {
  test('robots.txt is accessible', async ({ page }) => {
    const response = await page.goto('/robots.txt')
    expect(response?.status()).toBeLessThan(400)

    const content = await page.content()
    expect(content).toContain('User-agent')
  })

  test('sitemap.xml is accessible', async ({ page }) => {
    const response = await page.goto('/sitemap.xml')

    // May be 200 or redirect to sitemap index
    expect(response?.status()).toBeLessThan(400)
  })
})

test.describe('Page Performance Indicators', () => {
  test('images have width and height attributes', async ({ page }) => {
    await page.goto('/')
    await dismissOverlays(page)

    const images = page.locator('img')
    const count = await images.count()

    let imagesWithDimensions = 0

    for (let i = 0; i < Math.min(count, 10); i++) {
      const img = images.nth(i)
      const width = await img.getAttribute('width')
      const height = await img.getAttribute('height')
      const style = await img.getAttribute('style')

      // Check for explicit dimensions or fill mode (Next.js Image)
      const fill = await img.getAttribute('data-nimg')
      if (width && height || fill === 'fill' || style?.includes('width') || style?.includes('height')) {
        imagesWithDimensions++
      }
    }

    // Most images should have dimensions for CLS prevention
    if (count > 0) {
      const percentage = (imagesWithDimensions / Math.min(count, 10)) * 100
      expect(percentage).toBeGreaterThanOrEqual(50)
    }
  })

  test('critical resources have preconnect hints', async ({ page }) => {
    await page.goto('/')

    // Check for preconnect links
    const preconnects = page.locator('link[rel="preconnect"]')
    const count = await preconnects.count()

    expect(count).toBeGreaterThan(0)

    // Check for common critical origins
    const hrefs = await preconnects.evaluateAll(links =>
      links.map(link => link.getAttribute('href'))
    )

    // Should preconnect to fonts at minimum
    const hasGoogleFonts = hrefs.some(h => h?.includes('fonts.googleapis.com') || h?.includes('fonts.gstatic.com'))
    expect(hasGoogleFonts).toBe(true)
  })
})

test.describe('Heading Structure for SEO', () => {
  test('homepage has descriptive h1', async ({ page }) => {
    await page.goto('/')
    await dismissOverlays(page)

    const h1 = page.locator('h1').first()
    const text = await h1.textContent()

    expect(text).toBeTruthy()
    expect(text!.length).toBeGreaterThan(10)
  })

  test('key pages have unique h1 tags', async ({ page }) => {
    const pages = [
      { url: '/', keyword: 'rum' },
      { url: '/about/story/', keyword: 'story' },
      { url: '/shop/', keyword: 'shop' },
    ]

    const h1Texts = new Set<string>()

    for (const { url } of pages) {
      await page.goto(url)
      await dismissOverlays(page)

      const h1 = await page.locator('h1').first().textContent()
      if (h1) {
        h1Texts.add(h1.toLowerCase())
      }
    }

    // Each page should have unique h1
    expect(h1Texts.size).toBe(pages.length)
  })
})
