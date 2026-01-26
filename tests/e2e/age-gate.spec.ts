import { test, expect, Page } from '@playwright/test'

// Age gate button text - dynamically shows region with age requirement
// Format: "Yes, Enter" button to confirm age
const AGE_GATE_CONFIRM_PATTERN = /Yes,?\s*Enter/i
const AGE_GATE_DENY_PATTERN = /No,?\s*Exit/i

// Helper to dismiss Cookiebot consent banner first
async function dismissCookiebot(page: Page) {
  const consentButton = page.locator('#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll')
  if (await consentButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await consentButton.click()
    await page.waitForTimeout(500)
  }
}

test.describe('Age Gate Functionality', () => {
  test.beforeEach(async ({ context }) => {
    // Clear cookies and storage to ensure age gate appears
    await context.clearCookies()
  })

  test('age gate appears on first visit', async ({ page }) => {
    await page.goto('/')
    await dismissCookiebot(page)

    // Age gate should show the confirm button
    const ageButton = page.getByRole('button', { name: AGE_GATE_CONFIRM_PATTERN })

    // Button should be visible
    const isVisible = await ageButton.isVisible({ timeout: 5000 }).catch(() => false)
    expect(isVisible).toBe(true)
  })

  test('age gate shows "WELCOME, EXPLORER" heading', async ({ page }) => {
    await page.goto('/')
    await dismissCookiebot(page)

    // Should display welcome heading
    const welcomeText = page.getByRole('heading', { name: /WELCOME/i })
    await expect(welcomeText).toBeVisible({ timeout: 5000 })
  })

  test('clicking "Yes, Enter" dismisses age gate', async ({ page }) => {
    await page.goto('/')
    await dismissCookiebot(page)

    const ageButton = page.getByRole('button', { name: AGE_GATE_CONFIRM_PATTERN })
    await expect(ageButton).toBeVisible({ timeout: 5000 })

    await ageButton.click()
    await page.waitForTimeout(1000)

    // Age gate welcome heading should no longer be visible
    const welcomeHeading = page.getByRole('heading', { name: /WELCOME, EXPLORER/i })
    const isStillVisible = await welcomeHeading.isVisible({ timeout: 1000 }).catch(() => false)
    expect(isStillVisible).toBe(false)
  })

  test('age verification persists across page navigation', async ({ page }) => {
    await page.goto('/')
    await dismissCookiebot(page)

    // Dismiss age gate
    const ageButton = page.getByRole('button', { name: AGE_GATE_CONFIRM_PATTERN })
    if (await ageButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await ageButton.click()
      await page.waitForTimeout(500)
    }

    // Navigate to another page
    await page.goto('/about/story/')
    await page.waitForTimeout(500)

    // Age gate should not appear again
    const welcomeHeading = page.getByRole('heading', { name: /WELCOME, EXPLORER/i })
    const isStillVisible = await welcomeHeading.isVisible({ timeout: 1000 }).catch(() => false)
    expect(isStillVisible).toBe(false)
  })

  test('legal pages render content (may show age gate overlay)', async ({ page }) => {
    // Privacy policy renders content underneath age gate overlay
    await page.goto('/privacy-policy/')
    await dismissCookiebot(page)

    // Main content should exist in DOM (even if age gate overlays)
    const main = page.locator('main')
    await expect(main).toBeVisible({ timeout: 5000 })
  })

  test('terms of service page renders content', async ({ page }) => {
    await page.goto('/terms-of-service/')
    await dismissCookiebot(page)

    const main = page.locator('main')
    await expect(main).toBeVisible({ timeout: 5000 })
  })

  test('cookie policy page renders content', async ({ page }) => {
    await page.goto('/cookie-policy/')
    await dismissCookiebot(page)

    const main = page.locator('main')
    await expect(main).toBeVisible({ timeout: 5000 })
  })

  test('SEO audit bypass parameter works', async ({ page }) => {
    await page.goto('/?seo_audit=true')
    await dismissCookiebot(page)
    await page.waitForTimeout(1000)

    // Content should be visible without age gate interaction
    const main = page.locator('main')
    await expect(main).toBeVisible()

    // Age gate should not block the page (welcome heading not visible)
    const welcomeHeading = page.getByRole('heading', { name: /WELCOME, EXPLORER/i })
    const isVisible = await welcomeHeading.isVisible({ timeout: 1000 }).catch(() => false)
    expect(isVisible).toBe(false)
  })

  test('"No, Exit" button exists for underage users', async ({ page }) => {
    await page.goto('/')
    await dismissCookiebot(page)

    const exitButton = page.getByRole('button', { name: AGE_GATE_DENY_PATTERN })
    const isVisible = await exitButton.isVisible({ timeout: 5000 }).catch(() => false)
    expect(isVisible).toBe(true)
  })

  test('can click Terms of Service link from age gate', async ({ page }) => {
    await page.goto('/')
    await dismissCookiebot(page)

    // Verify age gate is showing
    const ageButton = page.getByRole('button', { name: AGE_GATE_CONFIRM_PATTERN })
    await expect(ageButton).toBeVisible({ timeout: 5000 })

    // Click the Terms of Service link in the age gate (first link, not footer)
    const tosLink = page.getByRole('link', { name: /Terms of Service/i }).first()
    await tosLink.click()
    await page.waitForTimeout(1000)

    // Should navigate to terms page and show content (no age gate blocking)
    expect(page.url()).toContain('/terms-of-service')

    // Age gate should NOT be showing on legal pages
    const welcomeHeading = page.getByRole('heading', { name: /WELCOME, EXPLORER/i })
    const isStillVisible = await welcomeHeading.isVisible({ timeout: 1000 }).catch(() => false)
    expect(isStillVisible).toBe(false)

    // Main content should be visible
    const main = page.locator('main')
    await expect(main).toBeVisible({ timeout: 5000 })
  })

  test('can click Privacy Policy link from age gate', async ({ page }) => {
    await page.goto('/')
    await dismissCookiebot(page)

    // Verify age gate is showing
    const ageButton = page.getByRole('button', { name: AGE_GATE_CONFIRM_PATTERN })
    await expect(ageButton).toBeVisible({ timeout: 5000 })

    // Click the Privacy Policy link in the age gate (first link, not footer)
    const privacyLink = page.getByRole('link', { name: /Privacy Policy/i }).first()
    await privacyLink.click()
    await page.waitForTimeout(1000)

    // Should navigate to privacy page and show content (no age gate blocking)
    expect(page.url()).toContain('/privacy-policy')

    // Age gate should NOT be showing on legal pages
    const welcomeHeading = page.getByRole('heading', { name: /WELCOME, EXPLORER/i })
    const isStillVisible = await welcomeHeading.isVisible({ timeout: 1000 }).catch(() => false)
    expect(isStillVisible).toBe(false)

    // Main content should be visible
    const main = page.locator('main')
    await expect(main).toBeVisible({ timeout: 5000 })
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
      await dismissCookiebot(page)

      // Either redirected to home with age gate, or age gate shown on page
      const ageButton = page.getByRole('button', { name: AGE_GATE_CONFIRM_PATTERN })
      const isVisible = await ageButton.isVisible({ timeout: 5000 }).catch(() => false)

      // Age verification is required for protected pages
      expect(isVisible).toBe(true)
    })
  }
})
