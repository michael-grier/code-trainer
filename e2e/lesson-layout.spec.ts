import { expect, test } from '@playwright/test'

test('lesson comments wrap with hanging indentation and preserve copyable source', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/lesson/arrays-and-hashing')
  const code = page.locator('article pre code').filter({ hasText: 'function createSignature' })
  await expect(code).toBeVisible()
  const source = await code.textContent()
  const comment = code.locator('span').filter({ hasText: /^\/\/ Lowercase letters have consecutive codes/ })

  const lines = await comment.evaluate((element) => {
    const text = element.firstChild!
    const starts: { x: number; y: number }[] = []
    // Measure character positions to catch visual wrapping regressions, not just CSS changes.
    for (let offset = 0; offset < (text.textContent?.length ?? 0); offset += 1) {
      const range = document.createRange()
      range.setStart(text, offset)
      range.setEnd(text, offset + 1)
      const rect = range.getBoundingClientRect()
      if (!starts.some((start) => Math.abs(start.y - rect.y) < 1)) {
        starts.push({ x: rect.x, y: rect.y })
      }
    }
    const prefix = document.createRange()
    prefix.setStart(text, 0)
    prefix.setEnd(text, 3)
    return { starts, prefixWidth: prefix.getBoundingClientRect().width }
  })
  expect(lines.starts.length).toBeGreaterThan(1)
  for (const continuation of lines.starts.slice(1)) {
    // WebKit includes a one-pixel italic glyph overhang in range bounds.
    expect(Math.abs(continuation.x - lines.starts[0].x - lines.prefixWidth)).toBeLessThanOrEqual(1.5)
  }

  await page.setViewportSize({ width: 2560, height: 1440 })
  const widths = await page.locator('article').evaluate((article) => ({
    prose: article.querySelector('p')!.getBoundingClientRect().width,
    code: article.querySelector('pre')!.getBoundingClientRect().width,
    overflow: document.documentElement.scrollWidth > innerWidth,
  }))
  expect(widths.prose).toBe(960)
  expect(widths.code).toBe(widths.prose)
  expect(widths.overflow).toBe(false)
  expect(await code.textContent()).toBe(source)
  await expect(page.getByRole('link', { name: 'Start practice', exact: true })).toHaveCount(2)
})
