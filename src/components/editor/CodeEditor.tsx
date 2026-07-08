import Editor from '@monaco-editor/react'
import { useTheme } from 'next-themes'

import { cn } from '@/lib/cn'

type CodeEditorProps = {
  value: string
  label: string
  className?: string
  height?: string
  readOnly?: boolean
  onChange?: (value: string) => void
}

export function CodeEditor({
  className,
  height = '30rem',
  label,
  onChange,
  readOnly = false,
  value,
}: CodeEditorProps) {
  const { resolvedTheme } = useTheme()

  return (
    <div
      className={cn(
        'min-w-0 overflow-hidden rounded-md border bg-background',
        className,
      )}
    >
      <Editor
        height={height}
        language="typescript"
        onChange={(nextValue) => onChange?.(nextValue ?? '')}
        options={{
          ariaLabel: label,
          automaticLayout: true,
          fixedOverflowWidgets: true,
          fontFamily:
            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          fontSize: 14,
          lineNumbersMinChars: 3,
          minimap: { enabled: false },
          padding: { bottom: 16, top: 16 },
          readOnly,
          renderLineHighlight: 'line',
          scrollBeyondLastLine: false,
          tabSize: 2,
          wordWrap: 'on',
        }}
        theme={resolvedTheme === 'dark' ? 'vs-dark' : 'light'}
        value={value}
      />
    </div>
  )
}
