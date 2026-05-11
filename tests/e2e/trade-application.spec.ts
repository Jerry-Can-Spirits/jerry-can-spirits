import { test, expect } from '@playwright/test'

test.describe('Trade application form', () => {
  test('completes all four steps and submits', async ({ page }) => {
    // Mock upload endpoint to return a deterministic ticket
    await page.route('**/api/trade-application/upload', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ticket: 'mock-ticket-' + Date.now(), filename: 'test.pdf', detectedMime: 'application/pdf' }),
      })
    })
    // Mock submit endpoint to return success
    await page.route('**/api/trade-application/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, applicationId: 'mock-app-id' }),
      })
    })

    await page.goto('/trade/apply/')

    // Step 1
    await page.fill('#trading_name', 'The Test Pub')
    await page.fill('#legal_entity_name', 'Test Pub Ltd')
    await page.selectOption('#legal_structure', 'Ltd')
    await page.selectOption('#business_type', 'Pub/Bar')
    await page.fill('#companies_house_number', '12345678')
    await page.fill('#years_trading', '5')
    await page.getByRole('button', { name: 'Next' }).click()

    // Step 2
    await page.fill('#trading_line1', '1 High Street')
    await page.fill('#trading_town', 'London')
    await page.fill('#trading_postcode', 'SW1A 1AA')
    await page.fill('#premises_licence_number', 'PL-001')
    await page.fill('#licensing_authority', 'Westminster')
    await page.fill('#dps_name', 'Alice')
    await page.fill('#personal_licence_number', 'PERS-001')
    // Upload a file via the hidden input
    await page.setInputFiles('#premises_licence_file', {
      name: 'licence.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 test'),
    })
    await page.getByRole('button', { name: 'Next' }).click()

    // Step 3
    await page.fill('#contact_name', 'Alice Tester')
    await page.fill('#contact_role', 'Owner')
    await page.fill('#contact_email', 'alice@example.com')
    await page.fill('#contact_phone', '02012345678')
    await page.fill('#director_name', 'Alice Tester')
    await page.setInputFiles('#director_id_file', {
      name: 'id.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('%PDF-1.4 test'), // upload mock doesn't care about magic bytes
    })
    await page.getByRole('button', { name: 'Next' }).click()

    // Step 4
    await page.selectOption('#expected_initial_volume', '12–36')
    await page.selectOption('#expected_monthly_volume', '12–36')
    await page.selectOption('#payment_terms_pref', 'Pro-forma')
    await page.locator('label:has-text("I confirm the information provided")').click()
    await page.getByRole('button', { name: 'Submit application' }).click()

    await expect(page.getByRole('heading', { name: 'Application received' })).toBeVisible()
  })

  test('blocks progression on missing required fields', async ({ page }) => {
    await page.goto('/trade/apply/')
    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.getByRole('alert').first()).toContainText('Please fix')
    // Should still be on step 1
    await expect(page.getByRole('heading', { name: 'Business & ownership' })).toBeVisible()
  })
})
