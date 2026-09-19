import Editor from '@monaco-editor/react'
import { useEffect, useRef } from 'react'

import { cn } from '@/lib/cn'

import { defineEditorThemes, useMonacoTheme } from './editorThemes'

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
  height = '22rem',
  label,
  onChange,
  readOnly = false,
  value,
}: CodeEditorProps) {
  const theme = useMonacoTheme()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const viewport = window.visualViewport
    const updateViewport = () => {
      // Monaco uses layout-viewport bounds, which can exceed the visible area
      // when a mobile browser zooms or pans around the focused editor.
      containerRef.current?.style.setProperty(
        '--editor-visible-width',
        `${viewport?.width ?? window.innerWidth}px`,
      )
      containerRef.current?.style.setProperty(
        '--editor-visible-left',
        `${viewport?.offsetLeft ?? 0}px`,
      )
    }

    updateViewport()
    viewport?.addEventListener('resize', updateViewport)
    viewport?.addEventListener('scroll', updateViewport)
    window.addEventListener('resize', updateViewport)
    return () => {
      viewport?.removeEventListener('resize', updateViewport)
      viewport?.removeEventListener('scroll', updateViewport)
      window.removeEventListener('resize', updateViewport)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className={cn(
        'code-editor min-w-0 overflow-hidden rounded-md border bg-background',
        className,
      )}
    >
      <Editor
        beforeMount={defineEditorThemes}
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
        theme={theme}
        value={value}
      />
    </div>
  )
}
