/**
 * Page Scroll Depth Auditor
 *
 * Multi-agent architecture for auditing page scroll depth:
 * - Planner: Defines strategy and scoring rubric
 * - Crawler: Discovers pages via sitemap and internal links
 * - Analyzer: Measures scroll depth across viewports and scores pages
 * - Reporter: Outputs concise report
 *
 * Usage:
 *   npx tsx tools/audit-scroll.ts
 *   npx tsx tools/audit-scroll.ts --url https://example.com
 */

import { chromium, Browser, Page } from 'playwright'
import * as fs from 'fs'

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  baseUrl: process.argv[2]?.startsWith('--url')
    ? process.argv[3]
    : 'https://jerrycanspirits.co.uk',
  maxPages: 50,
  concurrency: 3,
  viewports: [
    { name: '1080p', width: 1920, height: 1080 },
    { name: '1536p', width: 1536, height: 864 },
    { name: '768p', width: 1366, height: 768 },
  ],
  knownPaths: [
    '/',
    '/about/story/',
    '/shop/drinks/',
    '/field-manual/',
    '/field-manual/cocktails/',
    '/field-manual/ingredients/',
    '/field-manual/equipment/',
    '/guides/',
    '/faq/',
    '/contact/',
    '/ethos/',
  ],
  timeout: 30000,
  outputFile: 'audit-results.json',
}

// ============================================================================
// TYPES
// ============================================================================

interface ViewportMetrics {
  viewport: string
  viewportHeight: number
  documentHeight: number
  scrollScreens: number
}

interface PageMetrics {
  url: string
  path: string
  title: string
  metrics: ViewportMetrics[]
  worstScrollScreens: number
  score: number
  reason: string
  hasStickyHeader: boolean
  domNodeCount: number
  firstCtaScreens: number | null
}

interface AuditResults {
  baseUrl: string
  timestamp: string
  viewportsTested: string[]
  pagesChecked: number
  pages: PageMetrics[]
}

// ============================================================================
// PLANNER AGENT
// ============================================================================

const PlannerAgent = {
  /**
   * Scoring rubric based on scroll screens (worst viewport)
   * Best practice: 2-3 screens is comfortable, >6 is excessive
   */
  calculateScore(scrollScreens: number, extras: { domNodeCount: number; firstCtaScreens: number | null }): { score: number; reason: string } {
    let score = 100
    let reasons: string[] = []

    // Primary penalty based on scroll depth
    if (scrollScreens <= 2.5) {
      score = 95 + Math.round((2.5 - scrollScreens) * 2) // 95-100
      reasons.push('excellent fit')
    } else if (scrollScreens <= 4) {
      score = 80 + Math.round((4 - scrollScreens) / 1.5 * 14) // 80-94
      reasons.push('good fit')
    } else if (scrollScreens <= 6) {
      score = 60 + Math.round((6 - scrollScreens) / 2 * 19) // 60-79
      reasons.push('moderate scrolling')
    } else if (scrollScreens <= 8) {
      score = 40 + Math.round((8 - scrollScreens) / 2 * 19) // 40-59
      reasons.push('long page')
    } else if (scrollScreens <= 10) {
      score = 20 + Math.round((10 - scrollScreens) / 2 * 19) // 20-39
      reasons.push('very long page')
    } else {
      score = Math.max(0, 19 - Math.round((scrollScreens - 10) * 2)) // 0-19
      reasons.push('excessive scrolling required')
    }

    // Extra penalty: CTA too far down
    if (extras.firstCtaScreens !== null && extras.firstCtaScreens > 2) {
      score = Math.max(0, score - 5)
      reasons.push('CTA below fold')
    }

    // Extra penalty: massive DOM (likely repetitive content)
    if (extras.domNodeCount > 5000) {
      score = Math.max(0, score - 5)
      reasons.push('heavy DOM')
    }

    return {
      score: Math.round(score),
      reason: reasons.slice(0, 2).join(', ')
    }
  },

  /**
   * Strategy: sitemap first, then crawl, then known paths
   */
  getStrategy() {
    return {
      order: ['sitemap', 'crawl', 'knownPaths'],
      maxPages: CONFIG.maxPages,
    }
  }
}

// ============================================================================
// CRAWLER AGENT
// ============================================================================

const CrawlerAgent = {
  discoveredUrls: new Set<string>(),

  normalizeUrl(url: string, baseUrl: string): string | null {
    try {
      const parsed = new URL(url, baseUrl)
      // Stay on same domain
      if (parsed.origin !== new URL(baseUrl).origin) return null
      // Remove fragments and tracking params
      parsed.hash = ''
      ;['utm_source', 'utm_medium', 'utm_campaign', 'ref', 'fbclid'].forEach(p => parsed.searchParams.delete(p))
      // Normalize trailing slash for paths (not root)
      let path = parsed.pathname
      if (path !== '/' && !path.endsWith('/')) path += '/'
      return parsed.origin + path + parsed.search
    } catch {
      return null
    }
  },

  async fetchSitemap(baseUrl: string): Promise<string[]> {
    const urls: string[] = []
    try {
      const response = await fetch(`${baseUrl}/sitemap.xml`, {
        signal: AbortSignal.timeout(10000)
      })
      if (response.ok) {
        const xml = await response.text()
        const matches = xml.matchAll(/<loc>([^<]+)<\/loc>/g)
        for (const match of matches) {
          const normalized = this.normalizeUrl(match[1], baseUrl)
          if (normalized) urls.push(normalized)
        }
      }
    } catch (e) {
      console.log('  Sitemap not available or failed to parse')
    }
    return urls
  },

  async crawlPage(page: Page, url: string, baseUrl: string): Promise<string[]> {
    const links: string[] = []
    try {
      const hrefs = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a[href]'))
          .map(a => a.getAttribute('href'))
          .filter(Boolean) as string[]
      })
      for (const href of hrefs) {
        const normalized = this.normalizeUrl(href, baseUrl)
        if (normalized && !this.discoveredUrls.has(normalized)) {
          links.push(normalized)
        }
      }
    } catch {
      // Ignore crawl errors
    }
    return links
  },

  async discoverPages(browser: Browser): Promise<string[]> {
    const baseUrl = CONFIG.baseUrl
    console.log('\n📍 CRAWLER AGENT: Discovering pages...')

    // 1. Sitemap
    console.log('  Checking sitemap.xml...')
    const sitemapUrls = await this.fetchSitemap(baseUrl)
    sitemapUrls.forEach(u => this.discoveredUrls.add(u))
    console.log(`  Found ${sitemapUrls.length} URLs in sitemap`)

    // 2. Known paths
    for (const path of CONFIG.knownPaths) {
      const normalized = this.normalizeUrl(path, baseUrl)
      if (normalized) this.discoveredUrls.add(normalized)
    }
    console.log(`  Added ${CONFIG.knownPaths.length} known paths`)

    // 3. Crawl from homepage for more links
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    })
    const page = await context.newPage()

    try {
      // Handle age gate
      await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: CONFIG.timeout })
      const ageButton = page.getByRole('button', { name: /I Am 18\+/i })
      if (await ageButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await ageButton.click()
        await page.waitForTimeout(1000)
      }

      const crawledLinks = await this.crawlPage(page, baseUrl, baseUrl)
      crawledLinks.forEach(u => this.discoveredUrls.add(u))
      console.log(`  Crawled ${crawledLinks.length} additional links from homepage`)
    } catch (e) {
      console.log('  Homepage crawl failed, continuing with discovered URLs')
    }

    await context.close()

    // Return limited set
    const allUrls = Array.from(this.discoveredUrls).slice(0, CONFIG.maxPages)
    console.log(`  Total unique pages to audit: ${allUrls.length}`)
    return allUrls
  }
}

// ============================================================================
// ANALYZER AGENT
// ============================================================================

const AnalyzerAgent = {
  async measurePage(page: Page, url: string): Promise<PageMetrics | null> {
    const path = new URL(url).pathname
    const metrics: ViewportMetrics[] = []

    try {
      // Navigate and handle age gate/cookies
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: CONFIG.timeout })

      // Dismiss overlays - must wait for age gate to fully render
      await page.waitForTimeout(1500)

      const ageButton = page.getByRole('button', { name: /I Am 18\+/i })
      if (await ageButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await ageButton.click()
        // Wait for page to load after age gate dismissal
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})
        await page.waitForTimeout(2000)
      }

      const consentButton = page.getByRole('button', { name: /Accept All/i })
      if (await consentButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await consentButton.click()
        await page.waitForTimeout(1000)
      }

      // Wait for content to fully render
      await page.waitForTimeout(2000)

      // Get title
      const title = await page.title().catch(() => path)

      // Measure for each viewport
      for (const vp of CONFIG.viewports) {
        await page.setViewportSize({ width: vp.width, height: vp.height })
        await page.waitForTimeout(300) // Allow reflow

        const measurements = await page.evaluate(() => {
          const docHeight = Math.max(
            document.body.scrollHeight,
            document.documentElement.scrollHeight
          )
          const viewportHeight = window.innerHeight

          // Check for sticky header
          const header = document.querySelector('header')
          const hasStickyHeader = header ?
            getComputedStyle(header).position === 'fixed' ||
            getComputedStyle(header).position === 'sticky' : false

          // DOM node count
          const domNodeCount = document.getElementsByTagName('*').length

          // Find first CTA position
          let firstCtaTop: number | null = null
          const ctas = document.querySelectorAll('a[href*="shop"], button:not([type="button"]), [class*="cta"], [class*="btn"]')
          for (const cta of ctas) {
            const rect = cta.getBoundingClientRect()
            if (rect.height > 0 && rect.width > 0) {
              firstCtaTop = rect.top + window.scrollY
              break
            }
          }

          return { docHeight, viewportHeight, hasStickyHeader, domNodeCount, firstCtaTop }
        })

        const scrollScreens = Math.round((measurements.docHeight / measurements.viewportHeight) * 100) / 100

        metrics.push({
          viewport: vp.name,
          viewportHeight: measurements.viewportHeight,
          documentHeight: measurements.docHeight,
          scrollScreens,
        })
      }

      // Get worst case and extras from first viewport measurement
      const worstScrollScreens = Math.max(...metrics.map(m => m.scrollScreens))

      // Re-measure extras at default viewport
      await page.setViewportSize({ width: 1920, height: 1080 })
      const extras = await page.evaluate(() => {
        const header = document.querySelector('header')
        const hasStickyHeader = header ?
          getComputedStyle(header).position === 'fixed' ||
          getComputedStyle(header).position === 'sticky' : false
        const domNodeCount = document.getElementsByTagName('*').length

        let firstCtaScreens: number | null = null
        const ctas = document.querySelectorAll('a[href*="shop"], button:not([type="button"]), [class*="cta"], [class*="btn"]')
        for (const cta of ctas) {
          const rect = cta.getBoundingClientRect()
          if (rect.height > 0 && rect.width > 0) {
            firstCtaScreens = (rect.top + window.scrollY) / window.innerHeight
            break
          }
        }

        return { hasStickyHeader, domNodeCount, firstCtaScreens }
      })

      const { score, reason } = PlannerAgent.calculateScore(worstScrollScreens, extras)

      return {
        url,
        path,
        title: title || path,
        metrics,
        worstScrollScreens,
        score,
        reason,
        hasStickyHeader: extras.hasStickyHeader,
        domNodeCount: extras.domNodeCount,
        firstCtaScreens: extras.firstCtaScreens,
      }
    } catch (e) {
      console.log(`    ✗ Failed: ${path}`)
      return null
    }
  },

  async analyzePages(browser: Browser, urls: string[]): Promise<PageMetrics[]> {
    console.log('\n📊 ANALYZER AGENT: Measuring pages...')
    const results: PageMetrics[] = []

    // Create a persistent context so age gate cookie persists
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    })

    // Block heavy resources
    await context.route('**/*.{mp4,webm,ogg,mp3,wav,flac,aac,woff2,woff,ttf,otf}', route => route.abort())

    // First, dismiss age gate once on homepage
    console.log('  Dismissing age gate...')
    const setupPage = await context.newPage()
    await setupPage.goto(CONFIG.baseUrl, { waitUntil: 'domcontentloaded', timeout: CONFIG.timeout })
    await setupPage.waitForTimeout(2000)

    const ageButton = setupPage.getByRole('button', { name: /I Am 18\+/i })
    if (await ageButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await ageButton.click()
      await setupPage.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
      await setupPage.waitForTimeout(2000)
    }

    const consentButton = setupPage.getByRole('button', { name: /Accept All/i })
    if (await consentButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await consentButton.click()
      await setupPage.waitForTimeout(1000)
    }
    await setupPage.close()
    console.log('  Age gate dismissed, starting measurements...')

    // Now measure each page (age gate should be bypassed via cookies)
    for (const url of urls) {
      const page = await context.newPage()
      const result = await this.measurePageOnly(page, url)
      await page.close()

      if (result) {
        const icon = result.score >= 80 ? '✓' : result.score >= 60 ? '~' : '✗'
        console.log(`  ${icon} ${result.path} — ${result.score}%`)
        results.push(result)
      }
    }

    await context.close()
    return results
  },

  async measurePageOnly(page: Page, url: string): Promise<PageMetrics | null> {
    const path = new URL(url).pathname
    const metrics: ViewportMetrics[] = []

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: CONFIG.timeout })
      await page.waitForTimeout(2000)

      // Get title
      const title = await page.title().catch(() => path)

      // Measure for each viewport
      for (const vp of CONFIG.viewports) {
        await page.setViewportSize({ width: vp.width, height: vp.height })
        await page.waitForTimeout(500)

        const measurements = await page.evaluate(() => {
          const docHeight = Math.max(
            document.body.scrollHeight,
            document.documentElement.scrollHeight
          )
          return { docHeight, viewportHeight: window.innerHeight }
        })

        const scrollScreens = Math.round((measurements.docHeight / measurements.viewportHeight) * 100) / 100

        metrics.push({
          viewport: vp.name,
          viewportHeight: measurements.viewportHeight,
          documentHeight: measurements.docHeight,
          scrollScreens,
        })
      }

      const worstScrollScreens = Math.max(...metrics.map(m => m.scrollScreens))

      // Get extras
      await page.setViewportSize({ width: 1920, height: 1080 })
      const extras = await page.evaluate(() => {
        const header = document.querySelector('header')
        const hasStickyHeader = header ?
          getComputedStyle(header).position === 'fixed' ||
          getComputedStyle(header).position === 'sticky' : false
        const domNodeCount = document.getElementsByTagName('*').length

        let firstCtaScreens: number | null = null
        const ctas = document.querySelectorAll('a[href*="shop"], button:not([type="button"]), [class*="cta"], [class*="btn"]')
        for (const cta of ctas) {
          const rect = cta.getBoundingClientRect()
          if (rect.height > 0 && rect.width > 0) {
            firstCtaScreens = (rect.top + window.scrollY) / window.innerHeight
            break
          }
        }

        return { hasStickyHeader, domNodeCount, firstCtaScreens }
      })

      const { score, reason } = PlannerAgent.calculateScore(worstScrollScreens, extras)

      return {
        url,
        path,
        title: title || path,
        metrics,
        worstScrollScreens,
        score,
        reason,
        hasStickyHeader: extras.hasStickyHeader,
        domNodeCount: extras.domNodeCount,
        firstCtaScreens: extras.firstCtaScreens,
      }
    } catch (e) {
      console.log(`    ✗ Failed: ${path}`)
      return null
    }
  }
}

// ============================================================================
// REPORTER AGENT
// ============================================================================

const ReporterAgent = {
  generateReport(results: AuditResults): string {
    const lines: string[] = []

    lines.push('═'.repeat(60))
    lines.push('  SCROLL DEPTH AUDIT REPORT')
    lines.push('═'.repeat(60))
    lines.push('')

    // Sort by score (worst first for easy identification)
    const sorted = [...results.pages].sort((a, b) => a.score - b.score)

    // Page scores
    lines.push('PAGE SCORES:')
    lines.push('─'.repeat(60))
    for (const page of sorted) {
      const scoreBar = '█'.repeat(Math.floor(page.score / 10)) + '░'.repeat(10 - Math.floor(page.score / 10))
      const emoji = page.score >= 80 ? '✓' : page.score >= 60 ? '○' : '✗'
      lines.push(`${emoji} ${page.path.padEnd(35)} ${scoreBar} ${page.score}%`)
    }
    lines.push('')

    // Worst pages detail
    const worst = sorted.filter(p => p.score < 80).slice(0, 5)
    if (worst.length > 0) {
      lines.push('PAGES NEEDING ATTENTION:')
      lines.push('─'.repeat(60))
      for (const page of worst) {
        lines.push(`• ${page.path}: ${page.worstScrollScreens.toFixed(1)} screens (${page.reason})`)
      }
      lines.push('')
    }

    // Summary
    lines.push('SUMMARY:')
    lines.push('─'.repeat(60))
    lines.push(`Pages checked: ${results.pagesChecked}`)
    lines.push(`Viewports tested: ${results.viewportsTested.join(', ')}`)
    const avgScore = Math.round(results.pages.reduce((sum, p) => sum + p.score, 0) / results.pages.length)
    lines.push(`Average score: ${avgScore}%`)
    const passing = results.pages.filter(p => p.score >= 80).length
    lines.push(`Passing (≥80%): ${passing}/${results.pagesChecked}`)
    lines.push('')
    lines.push('Best practice: 2-3 screens comfortable, >6 screens excessive')
    lines.push('═'.repeat(60))

    return lines.join('\n')
  },

  saveResults(results: AuditResults) {
    fs.writeFileSync(CONFIG.outputFile, JSON.stringify(results, null, 2))
    console.log(`\n💾 Raw data saved to ${CONFIG.outputFile}`)
  }
}

// ============================================================================
// MAIN ORCHESTRATOR
// ============================================================================

async function main() {
  console.log('═'.repeat(60))
  console.log('  SCROLL DEPTH AUDITOR')
  console.log(`  Target: ${CONFIG.baseUrl}`)
  console.log('═'.repeat(60))

  const browser = await chromium.launch({ headless: true })

  try {
    // 1. Discover pages
    const urls = await CrawlerAgent.discoverPages(browser)

    // 2. Analyze each page
    const pageMetrics = await AnalyzerAgent.analyzePages(browser, urls)

    // 3. Compile results
    const results: AuditResults = {
      baseUrl: CONFIG.baseUrl,
      timestamp: new Date().toISOString(),
      viewportsTested: CONFIG.viewports.map(v => `${v.width}x${v.height}`),
      pagesChecked: pageMetrics.length,
      pages: pageMetrics,
    }

    // 4. Save raw data
    ReporterAgent.saveResults(results)

    // 5. Print report
    const report = ReporterAgent.generateReport(results)
    console.log('\n' + report)

  } finally {
    await browser.close()
  }
}

main().catch(console.error)
