import { DiffEditor as MonacoDiffEditor } from '@monaco-editor/react'

import { cn } from '@/lib/cn'

import { defineEditorThemes, useMonacoTheme } from './editorThemes'

type DiffEditorProps = {
  original: string
  modified: string
  label: string
  className?: string
  height?: string
}

export function DiffEditor({
  className,
  height = '22rem',
  label,
  modified,
  original,
}: DiffEditorProps) {
  const theme = useMonacoTheme()

  return (
    <div
      aria-label={label}
      className={cn(
        'min-w-0 overflow-hidden rounded-md border bg-background',
        className,
      )}
    >
      <MonacoDiffEditor
        beforeMount={defineEditorThemes}
        height={height}
        language="typescript"
        modified={modified}
        options={{
          automaticLayout: true,
          fixedOverflowWidgets: true,
          fontFamily:
            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          fontSize: 13,
          minimap: { enabled: false },
          originalEditable: false,
          readOnly: true,
          renderSideBySide: false,
          scrollBeyondLastLine: false,
          wordWrap: 'on',
        }}
        original={original}
        theme={theme}
      />
    </div>
  )
}
