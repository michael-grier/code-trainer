import { Palette } from 'lucide-react'

import {
  darkEditorThemeIds,
  editorThemeLabels,
  lightEditorThemeIds,
  parseEditorThemeSetting,
  setEditorTheme,
  useEditorThemeSetting,
  type EditorThemeId,
} from './editorThemes'

export function EditorThemePicker() {
  const setting = useEditorThemeSetting()
  const options = (ids: EditorThemeId[]) =>
    ids.map((id) => (
      <option key={id} value={id}>
        {editorThemeLabels[id]}
      </option>
    ))

  return (
    // The select covers the icon invisibly, so the header gets an icon-sized
    // control that keeps the native picker and its keyboard behavior.
    <div className="relative inline-flex size-9 items-center justify-center rounded-md transition hover:bg-accent hover:text-accent-foreground focus-within:ring-2 focus-within:ring-ring">
      <Palette aria-hidden className="size-4" />
      <select
        aria-label="Editor theme"
        // The open list takes its colors from the select. Without a background
        // of its own, the list falls back to white in dark mode.
        className="absolute inset-0 cursor-pointer bg-popover text-muted-foreground opacity-0 [&_optgroup]:bg-popover [&_option]:bg-popover"
        onChange={(event) => setEditorTheme(parseEditorThemeSetting(event.target.value))}
        title="Editor theme"
        value={setting}
      >
        <option value="auto">Match app theme</option>
        <optgroup label="Light">{options(lightEditorThemeIds)}</optgroup>
        <optgroup label="Dark">{options(darkEditorThemeIds)}</optgroup>
      </select>
    </div>
  )
}
