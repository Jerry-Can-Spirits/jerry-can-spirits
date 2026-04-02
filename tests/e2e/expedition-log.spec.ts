import { test, expect } from '@playwright/test'

test.describe('Expedition Log page', () => {
  test('page loads with correct heading', async ({ page }) => {
    await page.goto('/expedition-log/')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('The Expedition Log')
  })

  test('form is present on expedition log page', async ({ page }) => {
    await page.goto('/expedition-log/')
    await expect(page.locator('form')).toBeVisible()
    await expect(page.locator('input[name="name"]')).toBeVisible()
  })

  test('expedition log form appears on batch detail page', async ({ page }) => {
    await page.goto('/batch/001/')
    await expect(page.locator('input[name="name"]')).toBeVisible()
  })
})
