import {
  Children,
  isValidElement,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from 'react'

import { cn } from '@/lib/cn'

type CodeTokenKind =
  | 'plain'
  | 'comment'
  | 'string'
  | 'keyword'
  | 'number'

type CodeToken = {
  kind: CodeTokenKind
  value: string
}

const codeKeywords = new Set([
  'const',
  'continue',
  'else',
  'export',
  'false',
  'for',
  'function',
  'if',
  'let',
  'new',
  'null',
  'return',
  'true',
  'while',
])

export function MdxCodeBlock({
  children,
  className,
  ...props
}: ComponentProps<'pre'>) {
  const rawCode = getRawCode(children)

  if (!rawCode) {
    return (
      <pre
        className={cn(
          'mb-4 max-w-full overflow-x-auto rounded-md border bg-muted p-4 text-sm',
          className,
        )}
        {...props}
      >
        {children}
      </pre>
    )
  }

  return (
    <pre
      className={cn(
        'mb-4 max-w-full overflow-x-auto rounded-md border bg-muted p-4 text-sm leading-6',
        className,
      )}
      {...props}
    >
      <code className="font-mono text-foreground">
        {highlightCode(rawCode)}
      </code>
    </pre>
  )
}

function getRawCode(children: ReactNode) {
  if (typeof children === 'string') {
    return children
  }

  const child = Children.toArray(children)[0]

  if (!isValidElement(child)) {
    return undefined
  }

  const codeElement = child as ReactElement<ComponentProps<'code'>>
  const codeChildren = codeElement.props.children

  if (typeof codeChildren === 'string') {
    return codeChildren
  }

  if (
    Array.isArray(codeChildren) &&
    codeChildren.every((part) => typeof part === 'string')
  ) {
    return codeChildren.join('')
  }

  return undefined
}

function highlightCode(code: string) {
  return tokenizeCode(code).map((token, index) => (
    <span className={getTokenClassName(token.kind)} key={`${token.kind}-${index}`}>
      {token.value}
    </span>
  ))
}

function tokenizeCode(code: string): CodeToken[] {
  const tokens: CodeToken[] = []
  let index = 0

  while (index < code.length) {
    const commentToken = readComment(code, index)

    if (commentToken) {
      tokens.push(commentToken)
      index += commentToken.value.length
      continue
    }

    const stringToken = readString(code, index)

    if (stringToken) {
      tokens.push(stringToken)
      index += stringToken.value.length
      continue
    }

    const start = index

    while (
      index < code.length &&
      !startsComment(code, index) &&
      !startsString(code[index])
    ) {
      index += 1
    }

    tokens.push(...tokenizePlainCode(code.slice(start, index)))
  }

  return tokens
}

function readComment(code: string, index: number): CodeToken | undefined {
  if (code.startsWith('//', index)) {
    const end = code.indexOf('\n', index)
    const commentEnd = end === -1 ? code.length : end

    return {
      kind: 'comment',
      value: code.slice(index, commentEnd),
    }
  }

  if (code.startsWith('/*', index)) {
    const end = code.indexOf('*/', index + 2)
    const commentEnd = end === -1 ? code.length : end + 2

    return {
      kind: 'comment',
      value: code.slice(index, commentEnd),
    }
  }

  return undefined
}

function readString(code: string, index: number): CodeToken | undefined {
  const quote = code[index]

  if (!startsString(quote)) {
    return undefined
  }

  let cursor = index + 1

  while (cursor < code.length) {
    if (code[cursor] === '\\') {
      cursor += 2
      continue
    }

    if (code[cursor] === quote) {
      cursor += 1
      break
    }

    cursor += 1
  }

  return {
    kind: 'string',
    value: code.slice(index, cursor),
  }
}

function tokenizePlainCode(value: string): CodeToken[] {
  const tokens: CodeToken[] = []
  const pattern = new RegExp(
    `\\b(?:${[...codeKeywords].join('|')})\\b|\\b\\d+(?:\\.\\d+)?\\b`,
    'g',
  )
  let cursor = 0

  for (const match of value.matchAll(pattern)) {
    const matchIndex = match.index ?? 0

    if (matchIndex > cursor) {
      tokens.push({ kind: 'plain', value: value.slice(cursor, matchIndex) })
    }

    tokens.push({
      kind: codeKeywords.has(match[0]) ? 'keyword' : 'number',
      value: match[0],
    })
    cursor = matchIndex + match[0].length
  }

  if (cursor < value.length) {
    tokens.push({ kind: 'plain', value: value.slice(cursor) })
  }

  return tokens
}

function startsComment(code: string, index: number) {
  return code.startsWith('//', index) || code.startsWith('/*', index)
}

function startsString(value: string | undefined) {
  return value === '"' || value === "'" || value === '`'
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

  if (kind === 'number') {
    return 'text-amber-700 dark:text-amber-300'
  }

  return undefined
}
