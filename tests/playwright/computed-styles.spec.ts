import { test } from '@playwright/test'
import { writeFileSync } from 'fs'
import { BASELINE_ROUTES } from './routes'
import { ensureDir, buildBaselinePath } from './utils'

const OUTPUT_DIR = 'tests/baseline'
const VIEWPORT = { width: 1920, height: 1080 }
const SELECTORS = [
  'body',
  '#__next',
  'main',
  'header',
  'nav',
  'footer',
  '[role="main"]',
  '[data-desktop-root]',
]

ensureDir(OUTPUT_DIR)

test.describe('Desktop computed styles baseline', () => {
  for (const route of BASELINE_ROUTES) {
    test(`archive computed styles for ${route.path}`, async ({ page }) => {
      await page.setViewportSize(VIEWPORT)
      await page.goto(route.path, { waitUntil: 'networkidle' })
      await page.waitForTimeout(1000)

      const snapshot = await page.evaluate((selectors) => {
        const result: Record<string, unknown> = {}

        const serialize = (element: Element, label: string) => {
          const computed = window.getComputedStyle(element)
          const styleEntries: Record<string, string> = {}
          for (const property of Array.from(computed)) {
            styleEntries[property] = computed.getPropertyValue(property)
          }

          result[label] = {
            tag: element.tagName.toLowerCase(),
            classList: Array.from(element.classList),
            boundingClientRect: element.getBoundingClientRect().toJSON(),
            computedStyles: styleEntries,
          }
        }

        selectors.forEach((selector) => {
          const element = document.querySelector(selector)
          if (element) {
            serialize(element, selector)
          }
        })

        const nextRoot = document.querySelector('#__next')
        if (nextRoot) {
          Array.from(nextRoot.children).forEach((child, index) => {
            const label = `#__next>child-${index + 1}-${child.tagName.toLowerCase()}`
            serialize(child, label)
          })
        }

        return result
      }, SELECTORS)

      const fileName = `computed-styles-${route.slug}.json`
      writeFileSync(buildBaselinePath(OUTPUT_DIR, fileName), JSON.stringify(snapshot, null, 2), 'utf-8')
    })
  }
})
