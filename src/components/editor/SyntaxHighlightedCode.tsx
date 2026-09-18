import { cn } from '@/lib/cn'

import { tokenizeCode, type CodeTokenKind } from './syntaxHighlight'

type SyntaxHighlightedCodeProps = {
  className?: string
  code: string
}

export function SyntaxHighlightedCode({
  className,
  code,
}: SyntaxHighlightedCodeProps) {
  let sourceOffset = 0

  return (
    <code className={cn('font-mono text-foreground', className)}>
      {tokenizeCode(code).map((token, index) => {
        const linePrefix = code.slice(code.lastIndexOf('\n', sourceOffset - 1) + 1, sourceOffset)
        sourceOffset += token.value.length
        const standaloneComment = token.kind === 'comment'
          && token.value.startsWith('//')
          && /^ *$/.test(linePrefix)

        return (
          <span
            className={cn(
              getTokenClassName(token.kind),
              standaloneComment && 'inline-block align-top whitespace-pre-wrap [overflow-wrap:anywhere]',
            )}
            // Keep wrapped text beneath the comment text, after its indentation and "// ".
            style={standaloneComment ? {
              width: `calc(100% - ${linePrefix.length}ch)`,
              paddingLeft: '3ch',
              textIndent: '-3ch',
            } : undefined}
            key={`${token.kind}-${index}`}
          >
            {token.value}
          </span>
        )
      })}
    </code>
  )
}

function getTokenClassName(kind: CodeTokenKind) {
  if (kind === 'comment') {
    return 'text-muted-foreground italic'
  }

  if (kind === 'string') {
    return 'text-emerald-700 dark:text-emerald-300'
  }

  if (kind === 'keyword') {
    return 'font-semibold text-sky-700 dark:text-sky-300'
  }

  if (kind === 'literal') {
    return 'text-violet-700 dark:text-violet-300'
  }

  if (kind === 'number') {
    return 'text-amber-700 dark:text-amber-300'
  }

  if (kind === 'type') {
    return 'text-fuchsia-700 dark:text-fuchsia-300'
  }

  if (kind === 'builtin') {
    return 'text-cyan-700 dark:text-cyan-300'
  }

  if (kind === 'function') {
    return 'text-blue-700 dark:text-blue-300'
  }

  if (kind === 'property') {
    return 'text-teal-700 dark:text-teal-300'
  }

  if (kind === 'operator') {
    return 'text-rose-700 dark:text-rose-300'
  }

  return undefined
}
