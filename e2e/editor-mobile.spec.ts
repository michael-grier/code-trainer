import { expect, test, type Page } from '@playwright/test'
import type * as Monaco from 'monaco-editor'

test.use({ viewport: { width: 390, height: 700 } })

test('keeps mobile autocomplete within the viewport and accepts a suggestion', async ({ page }) => {
  await openSuggestions(page)
  await expectSuggestionsToFit(page)
  await page.setViewportSize({ width: 320, height: 560 })
  await expectSuggestionsToFit(page)

  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await expect(page.locator('.suggest-widget.visible')).toHaveCount(0)
  expect(await page.evaluate(() => {
    const { monaco } = window as typeof window & { monaco: typeof Monaco }
    return monaco.editor.getEditors()[0].getValue()
  })).not.toBe('const values = new Set<n')
})

test('keeps autocomplete centered in the visible viewport when zoomed', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Page-scale emulation requires Chromium CDP.')
  await openSuggestions(page)
  const session = await page.context().newCDPSession(page)
  await session.send('Emulation.setPageScaleFactor', { pageScaleFactor: 1.5 })
  await expectSuggestionsToFit(page)
})

async function openSuggestions(page: Page) {
  await page.goto('/lesson/arrays-and-hashing/problem/longest-consecutive-sequence')
  const input = page.locator('.monaco-editor textarea').first()
  // Monaco keeps its input textarea zero-sized in Firefox until focus.
  await input.waitFor({ state: 'attached' })
  await page.locator('.monaco-editor').first().scrollIntoViewIfNeeded()
  await page.evaluate(() => {
    const { monaco } = window as typeof window & { monaco: typeof Monaco }
    const editor = monaco.editor.getEditors()[0]
    editor.setValue('const values = new Set<n')
    editor.setPosition({ lineNumber: 1, column: 24 })
    editor.focus()
    editor.trigger('test', 'editor.action.triggerSuggest', {})
  })
  await page.locator('.suggest-widget.visible .monaco-list-row').first().waitFor()
}

async function expectSuggestionsToFit(page: Page) {
  await expect.poll(async () => page.locator('.suggest-widget.visible').evaluate((element) => {
    const bounds = element.getBoundingClientRect()
    const viewport = window.visualViewport
    const left = viewport?.offsetLeft ?? 0
    const width = viewport?.width ?? window.innerWidth
    return {
      fits: bounds.left >= left + 15 && bounds.right <= left + width - 15,
      centered: Math.abs(bounds.left + bounds.width / 2 - left - width / 2) < 1,
    }
  })).toEqual({ fits: true, centered: true })
}
