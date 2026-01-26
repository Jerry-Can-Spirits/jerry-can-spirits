import { test, expect } from '@playwright/test'

test.describe('Age Gate Functionality', () => {
  test.beforeEach(async ({ context }) => {
    // Clear cookies and storage to ensure age gate appears
    await context.clearCookies()
  })

  test('age gate appears on first visit', async ({ page }) => {
    await page.goto('/')

    // Age gate should be visible
    const ageGate = page.locator('[class*="age-gate"], [data-testid="age-gate"]').or(
      page.getByRole('button', { name: /I Am 18\+/i })
    )

    // Either age gate container or the button should be visible
    const isVisible = await ageGate.isVisible({ timeout: 5000 }).catch(() => false)
    expect(isVisible).toBe(true)
  })

  test('clicking "I Am 18+" dismisses age gate', async ({ page }) => {
    await page.goto('/')

    const ageButton = page.getByRole('button', { name: /I Am 18\+/i })
    await expect(ageButton).toBeVisible({ timeout: 5000 })

    await ageButton.click()
    await page.waitForTimeout(1000)

    // Age gate should no longer block content
    const main = page.locator('main')
    await expect(main).toBeVisible()
  })

  test('age verification persists across page navigation', async ({ page }) => {
    await page.goto('/')

    // Dismiss age gate
    const ageButton = page.getByRole('button', { name: /I Am 18\+/i })
    if (await ageButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await ageButton.click()
      await page.waitForTimeout(500)
    }

    // Navigate to another page
    await page.goto('/about/story/')
    await page.waitForTimeout(500)

    // Age gate should not appear again
    const ageButtonAgain = page.getByRole('button', { name: /I Am 18\+/i })
    const isStillVisible = await ageButtonAgain.isVisible({ timeout: 1000 }).catch(() => false)
    expect(isStillVisible).toBe(false)
  })

  test('legal pages are accessible without age verification', async ({ page }) => {
    // Privacy policy should be accessible without age gate
    await page.goto('/privacy-policy/')

    // Page should load and show content
    const heading = page.getByRole('heading', { level: 1 })
    await expect(heading).toBeVisible({ timeout: 5000 })
  })

  test('terms of service accessible without age verification', async ({ page }) => {
    await page.goto('/terms-of-service/')

    const heading = page.getByRole('heading', { level: 1 })
    await expect(heading).toBeVisible({ timeout: 5000 })
  })

  test('cookie policy accessible without age verification', async ({ page }) => {
    await page.goto('/cookie-policy/')

    const heading = page.getByRole('heading', { level: 1 })
    await expect(heading).toBeVisible({ timeout: 5000 })
  })

  test('SEO audit bypass parameter works', async ({ page }) => {
    await page.goto('/?seo_audit=true')
    await page.waitForTimeout(1000)

    // Content should be visible without age gate interaction
    const main = page.locator('main')
    await expect(main).toBeVisible()

    // Age gate should not block the page
    const hero = page.locator('section').first()
    await expect(hero).toBeVisible()
  })
})

test.describe('Age Gate on Protected Pages', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies()
  })

  const protectedPages = [
    '/shop/',
    '/shop/drinks/',
    '/field-manual/cocktails/',
    '/about/story/',
  ]

  for (const url of protectedPages) {
    test(`age gate appears on ${url}`, async ({ page }) => {
      await page.goto(url)

      // Either redirected to home with age gate, or age gate shown on page
      const ageButton = page.getByRole('button', { name: /I Am 18\+/i })
      const isVisible = await ageButton.isVisible({ timeout: 5000 }).catch(() => false)

      // Age verification is required for protected pages
      expect(isVisible).toBe(true)
    })
  }
})
