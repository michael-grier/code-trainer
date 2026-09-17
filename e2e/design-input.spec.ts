import { expect, test } from '@playwright/test'

test('preserves spaces and newlines in design lists without accepting blank answers', async ({ page }) => {
  await page.goto('/lesson/arrays-and-hashing/problem/lookup-strategy-design')
  await page.getByRole('textbox', { name: 'Requirements', exact: true }).fill('Bound memory and reject duplicate IDs.')
  await page.getByRole('textbox', { name: 'Algorithm', exact: true }).fill('Check IDs, record new IDs, and evict expired IDs.')
  await page.getByRole('button', { name: 'Memory', exact: true }).click()

  const state = page.getByRole('textbox', { name: 'State', exact: true })
  const reveal = page.getByRole('button', { name: 'Reveal', exact: true })
  await state.pressSequentially('  ')
  await state.press('Enter')
  await expect(state).toHaveValue('  \n')
  await expect(reveal).toBeDisabled()

  await state.fill('')
  // Type incrementally: pasting a complete answer hid the original bug.
  await state.pressSequentially('Recent ')
  await expect(state).toHaveValue('Recent ')
  await state.pressSequentially('event IDs')
  await state.press('Enter')
  await expect(state).toHaveValue('Recent event IDs\n')
  await state.press('Enter')
  await state.pressSequentially('  Expiry timestamps ')
  const draft = 'Recent event IDs\n\n  Expiry timestamps '
  await expect(state).toHaveValue(draft)
  await expect(reveal).toBeEnabled()

  await page.reload()
  await expect(state).toHaveValue(draft)
  await expect(reveal).toBeEnabled()
})
