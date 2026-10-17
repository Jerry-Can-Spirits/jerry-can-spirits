import { test, expect } from '@playwright/test'

test.describe('Expedition Log page', () => {
  test('page loads with correct heading', async ({ page }) => {
    await page.goto('/expedition-log/')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('The Expedition Log')
  })

  test('the log takes no submissions', async ({ page }) => {
    await page.goto('/expedition-log/')
    await expect(page.locator('form')).toHaveCount(0)
  })

  test('batch detail page links to the map instead of a form', async ({ page }) => {
    await page.goto('/batch/001/')
    await expect(page.locator('input[name="name"]')).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'See the map' })).toBeVisible()
  })
})
