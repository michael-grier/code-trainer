import { DiffEditor as MonacoDiffEditor } from '@monaco-editor/react'
import { useTheme } from 'next-themes'

import type { Language } from '@/curriculum/types'
import { cn } from '@/lib/cn'

type DiffEditorProps = {
  original: string
  modified: string
  language: Language
  label: string
  className?: string
  height?: string
}

export function DiffEditor({
  className,
  height = '22rem',
  label,
  language,
  modified,
  original,
}: DiffEditorProps) {
  const { resolvedTheme } = useTheme()

  return (
    <div
      aria-label={label}
      className={cn(
        'min-w-0 overflow-hidden rounded-md border bg-background',
        className,
      )}
    >
      <MonacoDiffEditor
        height={height}
        language={language === 'py' ? 'python' : 'typescript'}
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
        theme={resolvedTheme === 'dark' ? 'vs-dark' : 'light'}
      />
    </div>
  )
}
