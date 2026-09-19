import { cn } from '@/lib/cn'

import { useCodeBlockPalette, type EditorPalette } from './editorThemes'
import { tokenizeCode, type CodeTokenKind } from './syntaxHighlight'

type SyntaxHighlightedCodeProps = {
  className?: string
  code: string
}

export function SyntaxHighlightedCode({
  className,
  code,
}: SyntaxHighlightedCodeProps) {
  const palette = useCodeBlockPalette()
  let sourceOffset = 0

  return (
    <code
      className={cn('font-mono text-foreground', className)}
      style={palette ? { color: palette.foreground } : undefined}
    >
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
            style={{
              // An inline color outranks the token's light and dark classes.
              color: palette?.[paletteColors[token.kind]],
              // Keep wrapped text beneath the comment text, after its indentation and "// ".
              ...(standaloneComment && {
                width: `calc(100% - ${linePrefix.length}ch)`,
                paddingLeft: '3ch',
                textIndent: '-3ch',
              }),
            }}
            key={`${token.kind}-${index}`}
          >
            {token.value}
          </span>
        )
      })}
    </code>
  )
}

// Editor themes define fewer colors than this highlighter has token kinds,
// so the extra kinds share the nearest one.
const paletteColors: Record<CodeTokenKind, keyof EditorPalette> = {
  plain: 'foreground',
  comment: 'comment',
  string: 'string',
  keyword: 'keyword',
  literal: 'number',
  number: 'number',
  type: 'type',
  builtin: 'type',
  function: 'type',
  property: 'foreground',
  operator: 'keyword',
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
