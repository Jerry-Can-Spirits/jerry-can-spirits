import { test, expect, Page } from '@playwright/test'

// Helper to dismiss age gate and cookie consent
async function dismissOverlays(page: Page) {
  // Handle age gate - click "Yes, Enter" button (region-based age verification)
  const ageGateButton = page.getByRole('button', { name: /Yes,?\s*Enter/i })
  if (await ageGateButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await ageGateButton.click()
    await page.waitForTimeout(500)
  }

  // Handle cookie consent - click "Accept All" or "Necessary Only"
  const consentButton = page.getByRole('button', { name: /Accept All/i })
  if (await consentButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await consentButton.click()
    await page.waitForTimeout(500)
  }
}

interface PageMetrics {
  url: string
  title: string
  viewportHeight: number
  pageHeight: number
  scrollsRequired: number
  contentRatio: string
  sectionsVisible: number
  totalSections: number
}

interface ScrollMetrics {
  scrollDepth25: boolean
  scrollDepth50: boolean
  scrollDepth75: boolean
  scrollDepth100: boolean
  timeToScroll100: number
}

// Pages to test for engagement metrics
const pagesToTest = [
  '/',
  '/about/story/',
  '/field-manual/',
  '/field-manual/cocktails/',
  '/shop/drinks/',
  '/guides/',
  '/faq/',
]

test.describe('Page Engagement Metrics', () => {
  test('measure scroll depth and content visibility across key pages', async ({ page }) => {
    test.setTimeout(120000) // 2 minutes for multi-page test
    const results: PageMetrics[] = []

    for (const url of pagesToTest) {
      await page.goto(url, { waitUntil: 'domcontentloaded' })
      await dismissOverlays(page)

      // Wait for content to render
      await page.waitForTimeout(2000)

      const metrics = await page.evaluate(() => {
        const viewportHeight = window.innerHeight
        const pageHeight = document.documentElement.scrollHeight
        const scrollsRequired = Math.ceil(pageHeight / viewportHeight)
        const contentRatio = (pageHeight / viewportHeight).toFixed(2)

        // Count main content sections
        const sections = document.querySelectorAll('section, article, main > div')

        return {
          viewportHeight,
          pageHeight,
          scrollsRequired,
          contentRatio,
          sectionsVisible: Math.min(sections.length, Math.ceil(viewportHeight / 200)),
          totalSections: sections.length,
        }
      })

      results.push({
        url,
        title: await page.title(),
        ...metrics,
      })
    }

    // Output results as a table
    console.log('\n📊 Page Engagement Metrics')
    console.log('='.repeat(100))
    console.log(
      'Page'.padEnd(35) +
      'Height'.padEnd(10) +
      'Viewport'.padEnd(10) +
      'Scrolls'.padEnd(10) +
      'Ratio'.padEnd(10) +
      'Sections'
    )
    console.log('-'.repeat(100))

    for (const r of results) {
      console.log(
        r.url.padEnd(35) +
        `${r.pageHeight}px`.padEnd(10) +
        `${r.viewportHeight}px`.padEnd(10) +
        `${r.scrollsRequired}`.padEnd(10) +
        `${r.contentRatio}x`.padEnd(10) +
        `${r.totalSections}`
      )
    }

    console.log('='.repeat(100))

    // Basic assertions
    for (const r of results) {
      expect(r.pageHeight).toBeGreaterThan(0)
    }
  })

  test('measure scroll behaviour and timing on homepage', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })
    await dismissOverlays(page)
    await page.waitForTimeout(1000)

    const scrollMetrics = await page.evaluate(async () => {
      const pageHeight = document.documentElement.scrollHeight
      const viewportHeight = window.innerHeight
      const scrollableDistance = pageHeight - viewportHeight

      const milestones = {
        scrollDepth25: false,
        scrollDepth50: false,
        scrollDepth75: false,
        scrollDepth100: false,
        timeToScroll100: 0,
      }

      const startTime = Date.now()

      // Smooth scroll simulation
      const scrollStep = scrollableDistance / 20

      for (let i = 1; i <= 20; i++) {
        window.scrollTo({ top: scrollStep * i, behavior: 'instant' })
        await new Promise(r => setTimeout(r, 100))

        const currentScroll = window.scrollY
        const percentage = (currentScroll / scrollableDistance) * 100

        if (percentage >= 25 && !milestones.scrollDepth25) milestones.scrollDepth25 = true
        if (percentage >= 50 && !milestones.scrollDepth50) milestones.scrollDepth50 = true
        if (percentage >= 75 && !milestones.scrollDepth75) milestones.scrollDepth75 = true
        if (percentage >= 99 && !milestones.scrollDepth100) {
          milestones.scrollDepth100 = true
          milestones.timeToScroll100 = Date.now() - startTime
        }
      }

      return milestones
    })

    console.log('\n📜 Scroll Behaviour (Homepage)')
    console.log('='.repeat(50))
    console.log(`25% depth reached: ${scrollMetrics.scrollDepth25 ? '✓' : '✗'}`)
    console.log(`50% depth reached: ${scrollMetrics.scrollDepth50 ? '✓' : '✗'}`)
    console.log(`75% depth reached: ${scrollMetrics.scrollDepth75 ? '✓' : '✗'}`)
    console.log(`100% depth reached: ${scrollMetrics.scrollDepth100 ? '✓' : '✗'}`)
    console.log(`Time to scroll 100%: ${scrollMetrics.timeToScroll100}ms`)
    console.log('='.repeat(50))

    expect(scrollMetrics.scrollDepth100).toBe(true)
  })

  test('check above-the-fold content', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })
    await dismissOverlays(page)

    const aboveFold = await page.evaluate(() => {
      const viewportHeight = window.innerHeight

      // Check what's visible without scrolling
      const elements = {
        logo: !!document.querySelector('header img, header svg, [class*="logo"]'),
        navigation: !!document.querySelector('nav, header'),
        headline: false,
        cta: false,
        heroImage: false,
      }

      // Check for headline in viewport
      const headlines = document.querySelectorAll('h1, h2')
      headlines.forEach(h => {
        const rect = h.getBoundingClientRect()
        if (rect.top < viewportHeight && rect.bottom > 0) {
          elements.headline = true
        }
      })

      // Check for CTA buttons in viewport
      const buttons = document.querySelectorAll('a[href*="shop"], button, [class*="cta"], [class*="btn"]')
      buttons.forEach(b => {
        const rect = b.getBoundingClientRect()
        if (rect.top < viewportHeight && rect.bottom > 0) {
          elements.cta = true
        }
      })

      // Check for hero image
      const images = document.querySelectorAll('img, [class*="hero"]')
      images.forEach(img => {
        const rect = img.getBoundingClientRect()
        if (rect.top < viewportHeight && rect.height > 100) {
          elements.heroImage = true
        }
      })

      return elements
    })

    console.log('\n👁️ Above-the-Fold Content (Homepage)')
    console.log('='.repeat(50))
    console.log(`Logo visible: ${aboveFold.logo ? '✓' : '✗'}`)
    console.log(`Navigation visible: ${aboveFold.navigation ? '✓' : '✗'}`)
    console.log(`Headline visible: ${aboveFold.headline ? '✓' : '✗'}`)
    console.log(`CTA visible: ${aboveFold.cta ? '✓' : '✗'}`)
    console.log(`Hero image visible: ${aboveFold.heroImage ? '✓' : '✗'}`)
    console.log('='.repeat(50))

    expect(aboveFold.logo).toBe(true)
    expect(aboveFold.navigation).toBe(true)
  })
})

test.describe('Content Length Analysis', () => {
  test('analyse content length recommendations', async ({ page }) => {
    test.setTimeout(120000) // 2 minutes for multi-page test
    const contentAnalysis: Array<{
      url: string
      wordCount: number
      readingTime: string
      recommendation: string
    }> = []

    for (const url of pagesToTest) {
      await page.goto(url, { waitUntil: 'domcontentloaded' })
      await dismissOverlays(page)
      await page.waitForTimeout(2000)

      const analysis = await page.evaluate(() => {
        const mainContent = document.querySelector('main') || document.body
        const text = mainContent.innerText || ''
        const words = text.split(/\s+/).filter(w => w.length > 0)
        const wordCount = words.length
        const readingTimeMinutes = Math.ceil(wordCount / 200)

        return {
          wordCount,
          readingTime: `${readingTimeMinutes} min`,
        }
      })

      let recommendation = '✓ Good length'
      if (analysis.wordCount < 300) recommendation = '⚠️ Consider adding more content'
      if (analysis.wordCount > 3000) recommendation = '⚠️ Consider breaking into sections'

      contentAnalysis.push({
        url,
        ...analysis,
        recommendation,
      })
    }

    console.log('\n📝 Content Length Analysis')
    console.log('='.repeat(80))
    console.log(
      'Page'.padEnd(35) +
      'Words'.padEnd(10) +
      'Read Time'.padEnd(12) +
      'Recommendation'
    )
    console.log('-'.repeat(80))

    for (const c of contentAnalysis) {
      console.log(
        c.url.padEnd(35) +
        `${c.wordCount}`.padEnd(10) +
        c.readingTime.padEnd(12) +
        c.recommendation
      )
    }

    console.log('='.repeat(80))
  })
})
