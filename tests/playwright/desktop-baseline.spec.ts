import { test } from '@playwright/test'
import { BASELINE_ROUTES } from './routes'
import { ensureDir, buildBaselinePath } from './utils'

const VIEWPORTS = [
  { width: 768, height: 1024 },
  { width: 1024, height: 900 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
]

const OUTPUT_DIR = 'tests/visual-baseline'

ensureDir(OUTPUT_DIR)

test.describe('Desktop visual baselines', () => {
  for (const route of BASELINE_ROUTES) {
    for (const viewport of VIEWPORTS) {
      test(`capture ${route.path} at ${viewport.width}px`, async ({ page }) => {
        await page.setViewportSize(viewport)
        await page.goto(route.path, { waitUntil: 'networkidle' })
        await page.waitForTimeout(1000)
        const fileName = `desktop-${viewport.width}-${route.slug}.png`
        await page.screenshot({
          path: buildBaselinePath(OUTPUT_DIR, fileName),
          fullPage: true,
        })
      })
    }
  }
})
