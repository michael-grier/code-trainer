import type { Monaco } from '@monaco-editor/react'
import { useTheme } from 'next-themes'
import { useSyncExternalStore } from 'react'

export type EditorPalette = {
  base: 'vs' | 'vs-dark'
  background: string
  foreground: string
  comment: string
  keyword: string
  string: string
  number: string
  type: string
  selection: string
  lineHighlight: string
  lineNumber: string
}

// Colors follow each theme's published palette, except that comment colors are
// lightened or darkened to reach 4.5:1 contrast, because lesson snippets teach
// through their comments. Monaco's TypeScript tokenizer only distinguishes
// these few token kinds, so a palette is a whole theme.
const palettes = {
  'github-light': {
    base: 'vs',
    background: '#ffffff',
    foreground: '#24292f',
    comment: '#6e7781',
    keyword: '#cf222e',
    string: '#0a3069',
    number: '#0550ae',
    type: '#953800',
    selection: '#b6e3ff',
    lineHighlight: '#f6f8fa',
    lineNumber: '#8c959f',
  },
  'solarized-light': {
    base: 'vs',
    background: '#fdf6e3',
    // Solarized's base01 rather than base00, which is 4.1:1 on this background.
    foreground: '#586e75',
    comment: '#657474',
    keyword: '#859900',
    string: '#2aa198',
    number: '#d33682',
    type: '#b58900',
    selection: '#eee8d5',
    lineHighlight: '#eee8d5',
    lineNumber: '#93a1a1',
  },
  'github-dark': {
    base: 'vs-dark',
    background: '#0d1117',
    foreground: '#c9d1d9',
    comment: '#8b949e',
    keyword: '#ff7b72',
    string: '#a5d6ff',
    number: '#79c0ff',
    type: '#ffa657',
    selection: '#264f78',
    lineHighlight: '#161b22',
    lineNumber: '#6e7681',
  },
  dracula: {
    base: 'vs-dark',
    background: '#282a36',
    foreground: '#f8f8f2',
    comment: '#8490b8',
    keyword: '#ff79c6',
    string: '#f1fa8c',
    number: '#bd93f9',
    type: '#8be9fd',
    selection: '#44475a',
    lineHighlight: '#313442',
    lineNumber: '#6272a4',
  },
  monokai: {
    base: 'vs-dark',
    background: '#272822',
    foreground: '#f8f8f2',
    comment: '#938e78',
    keyword: '#f92672',
    string: '#e6db74',
    number: '#ae81ff',
    type: '#66d9ef',
    selection: '#49483e',
    lineHighlight: '#3e3d32',
    lineNumber: '#90908a',
  },
  nord: {
    base: 'vs-dark',
    background: '#2e3440',
    foreground: '#d8dee9',
    comment: '#919cb1',
    keyword: '#81a1c1',
    string: '#a3be8c',
    number: '#b48ead',
    type: '#8fbcbb',
    selection: '#434c5e',
    lineHighlight: '#3b4252',
    lineNumber: '#4c566a',
  },
  'solarized-dark': {
    base: 'vs-dark',
    background: '#002b36',
    foreground: '#839496',
    comment: '#78929a',
    keyword: '#859900',
    string: '#2aa198',
    number: '#d33682',
    type: '#b58900',
    selection: '#073642',
    lineHighlight: '#073642',
    lineNumber: '#586e75',
  },
} satisfies Record<string, EditorPalette>

export type EditorThemeId = keyof typeof palettes
// 'auto' follows the app's light or dark theme with Monaco's built-in themes.
export type EditorThemeSetting = EditorThemeId | 'auto'

export const editorThemeLabels: Record<EditorThemeId, string> = {
  'github-light': 'GitHub Light',
  'solarized-light': 'Solarized Light',
  'github-dark': 'GitHub Dark',
  dracula: 'Dracula',
  monokai: 'Monokai',
  nord: 'Nord',
  'solarized-dark': 'Solarized Dark',
}

const themeIds = Object.keys(palettes) as EditorThemeId[]

export const lightEditorThemeIds = themeIds.filter((id) => palettes[id].base === 'vs')
export const darkEditorThemeIds = themeIds.filter((id) => palettes[id].base === 'vs-dark')

// Pass as an editor's beforeMount so the themes exist before its first paint.
export function defineEditorThemes(monaco: Monaco) {
  for (const id of themeIds) {
    const palette: EditorPalette = palettes[id]
    // Token rules take hex colors without the leading "#".
    const rule = (token: string, color: string) => ({ token, foreground: color.slice(1) })

    monaco.editor.defineTheme(id, {
      base: palette.base,
      inherit: true,
      rules: [
        rule('', palette.foreground),
        // Italic matches the app's own highlighter.
        { ...rule('comment', palette.comment), fontStyle: 'italic' },
        rule('keyword', palette.keyword),
        rule('string', palette.string),
        rule('regexp', palette.string),
        rule('number', palette.number),
        rule('type', palette.type),
      ],
      colors: {
        'editor.background': palette.background,
        'editor.foreground': palette.foreground,
        'editor.selectionBackground': palette.selection,
        'editor.lineHighlightBackground': palette.lineHighlight,
        'editorLineNumber.foreground': palette.lineNumber,
        'editorLineNumber.activeForeground': palette.foreground,
        'editorCursor.foreground': palette.foreground,
      },
    })
  }
}

const STORAGE_KEY = 'code-trainer:editor-theme'
const listeners = new Set<() => void>()

// A stored id can outlive its theme, so anything unrecognized means 'auto'.
export function parseEditorThemeSetting(value: string | null): EditorThemeSetting {
  return themeIds.find((id) => id === value) ?? 'auto'
}

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  // Other tabs change the stored value without calling setEditorTheme here.
  window.addEventListener('storage', onChange)

  return () => {
    listeners.delete(onChange)
    window.removeEventListener('storage', onChange)
  }
}

export function setEditorTheme(setting: EditorThemeSetting) {
  localStorage.setItem(STORAGE_KEY, setting)
  listeners.forEach((listener) => listener())
}

export function useEditorThemeSetting() {
  return useSyncExternalStore(
    subscribe,
    () => parseEditorThemeSetting(localStorage.getItem(STORAGE_KEY)),
    // Static rendering has no storage to read.
    (): EditorThemeSetting => 'auto',
  )
}

// The chosen theme's colors for code shown outside Monaco. Undefined means
// the block keeps the app's own light and dark colors.
export function useCodeBlockPalette(): EditorPalette | undefined {
  const setting = useEditorThemeSetting()

  return setting === 'auto' ? undefined : palettes[setting]
}

export function useMonacoTheme() {
  const setting = useEditorThemeSetting()
  const { resolvedTheme } = useTheme()

  if (setting !== 'auto') {
    return setting
  }

  return resolvedTheme === 'dark' ? 'vs-dark' : 'light'
}
