import { test, expect, Page } from '@playwright/test'

async function dismissOverlays(page: Page) {
  // Age gate
  const ageGateButton = page.getByRole('button', { name: /I Am 18\+/i })
  if (await ageGateButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await ageGateButton.click()
    await page.waitForTimeout(500)
  }

  // Cookie consent
  const consentButton = page.locator('#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll')
  if (await consentButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await consentButton.click()
    await page.waitForTimeout(500)
  }
}

test.describe('Contact Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact/')
    await dismissOverlays(page)
  })

  test('contact page loads with form', async ({ page }) => {
    // Check page has loaded
    const heading = page.getByRole('heading', { level: 1 })
    await expect(heading).toBeVisible()

    // Check form exists
    const form = page.locator('form')
    await expect(form.first()).toBeVisible()
  })

  test('contact form has required fields', async ({ page }) => {
    // Check for name field
    const nameInput = page.locator('input[name*="name" i], input[placeholder*="name" i]').first()
    await expect(nameInput).toBeVisible()

    // Check for email field
    const emailInput = page.locator('input[type="email"], input[name*="email" i]').first()
    await expect(emailInput).toBeVisible()

    // Check for message field
    const messageInput = page.locator('textarea').first()
    await expect(messageInput).toBeVisible()

    // Check for submit button
    const submitButton = page.locator('button[type="submit"], input[type="submit"]').first()
    await expect(submitButton).toBeVisible()
  })

  test('form shows validation errors for empty submission', async ({ page }) => {
    const submitButton = page.locator('button[type="submit"]').first()

    // Try to submit empty form
    await submitButton.click()

    // Form should show validation (HTML5 or custom)
    // Check that the form didn't navigate away (meaning validation prevented submission)
    await expect(page).toHaveURL(/\/contact/)
  })

  test('form accepts valid input', async ({ page }) => {
    // Fill in name
    const nameInput = page.locator('input[name*="name" i], input[placeholder*="name" i]').first()
    await nameInput.fill('Test User')

    // Fill in email
    const emailInput = page.locator('input[type="email"], input[name*="email" i]').first()
    await emailInput.fill('test@example.com')

    // Fill in message
    const messageInput = page.locator('textarea').first()
    await messageInput.fill('This is a test message from Playwright E2E tests.')

    // Verify inputs are filled
    await expect(nameInput).toHaveValue('Test User')
    await expect(emailInput).toHaveValue('test@example.com')
    await expect(messageInput).toHaveValue('This is a test message from Playwright E2E tests.')
  })

  test('email field validates email format', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]').first()

    // Enter invalid email
    await emailInput.fill('notanemail')
    await emailInput.blur()

    // Check if field is invalid (HTML5 validation)
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid)
    expect(isInvalid).toBe(true)

    // Enter valid email
    await emailInput.fill('valid@email.com')
    const isValid = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid)
    expect(isValid).toBe(true)
  })
})

test.describe('Media Enquiry Form', () => {
  test('media contact page loads', async ({ page }) => {
    await page.goto('/contact/media/')
    await dismissOverlays(page)

    // Check page loaded
    const heading = page.getByRole('heading', { level: 1 })
    await expect(heading).toBeVisible()
  })

  test('media page has press contact information', async ({ page }) => {
    await page.goto('/contact/media/')
    await dismissOverlays(page)

    // Should have press email or contact info
    const emailLink = page.locator('a[href*="mailto:"]')
    const count = await emailLink.count()
    expect(count).toBeGreaterThan(0)
  })
})

test.describe('Complaint Form', () => {
  test('complaints page loads', async ({ page }) => {
    await page.goto('/contact/complaint/')
    await dismissOverlays(page)

    // Check page loaded
    const heading = page.getByRole('heading', { level: 1 })
    await expect(heading).toBeVisible()
  })

  test('complaints form has required fields', async ({ page }) => {
    await page.goto('/contact/complaint/')
    await dismissOverlays(page)

    // Check for form
    const form = page.locator('form')
    if (await form.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Check for email field
      const emailInput = page.locator('input[type="email"]').first()
      await expect(emailInput).toBeVisible()

      // Check for submit button
      const submitButton = page.locator('button[type="submit"]').first()
      await expect(submitButton).toBeVisible()
    }
  })
})
