import { describe, expect, it } from 'vitest'

import { parseEditorThemeSetting } from './editorThemes'

describe('parseEditorThemeSetting', () => {
  it('falls back to the app theme for a missing or retired theme id', () => {
    expect(parseEditorThemeSetting('dracula')).toBe('dracula')
    expect(parseEditorThemeSetting(null)).toBe('auto')
    expect(parseEditorThemeSetting('retired-theme')).toBe('auto')
  })
})
