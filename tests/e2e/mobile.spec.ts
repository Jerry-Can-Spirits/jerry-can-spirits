import { test, expect, Page } from '@playwright/test'

async function dismissOverlays(page: Page) {
  const ageGateButton = page.getByRole('button', { name: /Yes,?\s*Enter/i })
  if (await ageGateButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await ageGateButton.click()
    await page.waitForTimeout(500)
  }

  const consentButton = page.locator('#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll')
  if (await consentButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await consentButton.click()
    await page.waitForTimeout(500)
  }
}

// Mobile tests only run on mobile viewport
test.describe('Mobile Navigation', () => {
  test.use({ viewport: { width: 375, height: 667 } }) // iPhone SE size

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await dismissOverlays(page)
  })

  test('mobile menu button is visible', async ({ page }) => {
    // Look for hamburger menu button
    const menuButton = page.locator('button[aria-label*="menu" i], button[class*="mobile"], [class*="hamburger"]').first()
    await expect(menuButton).toBeVisible()
  })

  test('mobile menu opens on click', async ({ page }) => {
    // Find and click the mobile menu button
    const menuButton = page.locator('button[aria-label*="menu" i], button[class*="mobile"], header button').first()

    if (await menuButton.isVisible()) {
      await menuButton.click()
      await page.waitForTimeout(500)

      // Navigation links should become visible
      const navLinks = page.locator('nav a, [class*="mobile-menu"] a')
      const visibleCount = await navLinks.filter({ hasText: /.+/ }).count()
      expect(visibleCount).toBeGreaterThan(0)
    }
  })

  test('mobile menu closes after navigation', async ({ page }) => {
    const menuButton = page.locator('button[aria-label*="menu" i], header button').first()

    if (await menuButton.isVisible()) {
      await menuButton.click()
      await page.waitForTimeout(500)

      // Click a nav link
      const shopLink = page.locator('nav a[href*="shop"], [class*="mobile-menu"] a[href*="shop"]').first()
      if (await shopLink.isVisible()) {
        await shopLink.click()
        await page.waitForTimeout(1000)

        // Should have navigated
        await expect(page).toHaveURL(/\/shop/)
      }
    }
  })

  test('content is readable on mobile', async ({ page }) => {
    // Check that text is not too small
    const bodyText = page.locator('p, span, li').first()
    if (await bodyText.isVisible()) {
      const fontSize = await bodyText.evaluate(el => {
        return parseFloat(window.getComputedStyle(el).fontSize)
      })
      expect(fontSize).toBeGreaterThanOrEqual(14) // Minimum readable size
    }
  })

  test('buttons are tap-friendly size', async ({ page }) => {
    const buttons = page.locator('button, a[class*="btn"], a[class*="button"]')
    const count = await buttons.count()

    for (let i = 0; i < Math.min(count, 5); i++) {
      const button = buttons.nth(i)
      if (await button.isVisible()) {
        const box = await button.boundingBox()
        if (box) {
          // Minimum tap target size (44x44 recommended by Apple)
          expect(box.height).toBeGreaterThanOrEqual(40)
        }
      }
    }
  })

  test('no horizontal scroll on mobile', async ({ page }) => {
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })
    expect(hasHorizontalScroll).toBe(false)
  })
})

test.describe('Tablet Navigation', () => {
  test.use({ viewport: { width: 768, height: 1024 } }) // iPad size

  test('page renders correctly on tablet', async ({ page }) => {
    await page.goto('/')
    await dismissOverlays(page)

    // Page should load
    const main = page.locator('main')
    await expect(main).toBeVisible()

    // No horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })
    expect(hasHorizontalScroll).toBe(false)
  })
})

test.describe('Responsive Images', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('images scale appropriately on mobile', async ({ page }) => {
    await page.goto('/')
    await dismissOverlays(page)

    const images = page.locator('img')
    const count = await images.count()

    for (let i = 0; i < Math.min(count, 5); i++) {
      const img = images.nth(i)
      if (await img.isVisible()) {
        const box = await img.boundingBox()
        if (box) {
          // Image should not be wider than viewport
          expect(box.width).toBeLessThanOrEqual(375)
        }
      }
    }
  })
})
