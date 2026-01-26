import { test, expect, Page } from '@playwright/test'

// Helper to dismiss age gate
async function dismissAgeGate(page: Page) {
  const ageGateButton = page.getByRole('button', { name: /I Am 18\+/i })
  if (await ageGateButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await ageGateButton.click()
    await page.waitForTimeout(500)
  }
}

// Helper to dismiss cookie consent
async function dismissCookieConsent(page: Page) {
  const consentButton = page.locator('#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll')
  if (await consentButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await consentButton.click()
    await page.waitForTimeout(500)
  }
}

async function dismissOverlays(page: Page) {
  await dismissAgeGate(page)
  await dismissCookieConsent(page)
}

test.describe('Main Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await dismissOverlays(page)
  })

  test('header navigation links are visible', async ({ page }) => {
    const header = page.locator('header')
    await expect(header).toBeVisible()

    // Check logo is present and links to home
    const logo = header.locator('a[href="/"]').first()
    await expect(logo).toBeVisible()
  })

  test('main nav links work - Shop', async ({ page }) => {
    const shopLink = page.locator('header').getByRole('link', { name: /shop/i }).first()
    if (await shopLink.isVisible()) {
      await shopLink.click()
      await expect(page).toHaveURL(/\/shop/)
    }
  })

  test('main nav links work - About', async ({ page }) => {
    // Look for About or Story link
    const aboutLink = page.locator('header').getByRole('link', { name: /about|story/i }).first()
    if (await aboutLink.isVisible()) {
      await aboutLink.click()
      await expect(page).toHaveURL(/\/about/)
    }
  })

  test('main nav links work - Field Manual', async ({ page }) => {
    const fieldManualLink = page.locator('header').getByRole('link', { name: /field manual|cocktails/i }).first()
    if (await fieldManualLink.isVisible()) {
      await fieldManualLink.click()
      await expect(page).toHaveURL(/\/field-manual/)
    }
  })

  test('main nav links work - Contact', async ({ page }) => {
    const contactLink = page.locator('header').getByRole('link', { name: /contact/i }).first()
    if (await contactLink.isVisible()) {
      await contactLink.click()
      await expect(page).toHaveURL(/\/contact/)
    }
  })
})

test.describe('Footer Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await dismissOverlays(page)
  })

  test('footer is visible', async ({ page }) => {
    const footer = page.locator('footer')
    await expect(footer).toBeVisible()
  })

  test('footer contains legal links', async ({ page }) => {
    const footer = page.locator('footer')

    // Check for privacy policy link
    const privacyLink = footer.getByRole('link', { name: /privacy/i })
    await expect(privacyLink).toBeVisible()

    // Check for terms link
    const termsLink = footer.getByRole('link', { name: /terms/i })
    await expect(termsLink).toBeVisible()
  })

  test('footer social links are present', async ({ page }) => {
    const footer = page.locator('footer')

    // Check for social media links (Facebook, Instagram)
    const socialLinks = footer.locator('a[href*="facebook"], a[href*="instagram"]')
    const count = await socialLinks.count()
    expect(count).toBeGreaterThan(0)
  })
})

test.describe('Page Load Tests', () => {
  const pages = [
    { url: '/', name: 'Homepage' },
    { url: '/about/story/', name: 'Story' },
    { url: '/about/team/', name: 'Team' },
    { url: '/shop/', name: 'Shop' },
    { url: '/shop/drinks/', name: 'Drinks' },
    { url: '/field-manual/', name: 'Field Manual' },
    { url: '/field-manual/cocktails/', name: 'Cocktails' },
    { url: '/contact/', name: 'Contact' },
    { url: '/faq/', name: 'FAQ' },
    { url: '/ethos/', name: 'Ethos' },
  ]

  for (const { url, name } of pages) {
    test(`${name} page loads successfully`, async ({ page }) => {
      const response = await page.goto(url)
      expect(response?.status()).toBeLessThan(400)
      await dismissOverlays(page)

      // Check page has content
      const main = page.locator('main')
      await expect(main).toBeVisible()
    })
  }
})

test.describe('Internal Links Integrity', () => {
  test('homepage internal links are valid', async ({ page }) => {
    await page.goto('/')
    await dismissOverlays(page)

    // Get all internal links
    const links = await page.locator('a[href^="/"]').all()
    const hrefs = new Set<string>()

    for (const link of links.slice(0, 20)) { // Test first 20 links
      const href = await link.getAttribute('href')
      if (href && !hrefs.has(href)) {
        hrefs.add(href)
      }
    }

    // Verify a sample of links return 200
    for (const href of Array.from(hrefs).slice(0, 10)) {
      const response = await page.goto(href)
      expect(response?.status(), `Link ${href} should return success`).toBeLessThan(400)
    }
  })
})
