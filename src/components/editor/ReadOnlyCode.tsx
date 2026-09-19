import { cn } from '@/lib/cn'

import { useCodeBlockPalette } from './editorThemes'
import { SyntaxHighlightedCode } from './SyntaxHighlightedCode'

type ReadOnlyCodeProps = {
  code: string
  className?: string
  language?: 'text' | 'typescript'
}

export function ReadOnlyCode({
  className,
  code,
  language = 'typescript',
}: ReadOnlyCodeProps) {
  const palette = useCodeBlockPalette()

  return (
    <pre
      // Plain-text answers are prose, so only code takes the editor theme.
      style={
        palette && language === 'typescript'
          ? { backgroundColor: palette.background }
          : undefined
      }
      className={cn(
        'max-h-72 overflow-auto rounded-md border bg-muted/40 p-4 text-sm leading-6 text-foreground',
        className,
      )}
    >
      {language === 'typescript' ? (
        <SyntaxHighlightedCode code={code} />
      ) : (
        <code>{code}</code>
      )}
    </pre>
  )
}
