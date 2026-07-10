import { cn } from '@/lib/cn'

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
  return (
    <pre
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
