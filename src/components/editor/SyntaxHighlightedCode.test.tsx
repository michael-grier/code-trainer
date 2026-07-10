import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { ReadOnlyCode } from './ReadOnlyCode'
import { tokenizeCode } from './syntaxHighlight'

describe('SyntaxHighlightedCode', () => {
  it('preserves the complete source while classifying TypeScript tokens', () => {
    const code = `export type Result = { value: number }
// Keep the larger value.
const total = Math.max(calculate(0x10), 2_000)
return total ?? null
`
    const tokens = tokenizeCode(code)

    expect(tokens.map((token) => token.value).join('')).toBe(code)
    expect(valuesFor(tokens, 'keyword')).toEqual(
      expect.arrayContaining(['export', 'type', 'const', 'return']),
    )
    expect(valuesFor(tokens, 'type')).toEqual(
      expect.arrayContaining(['Result', 'number']),
    )
    expect(valuesFor(tokens, 'builtin')).toContain('Math')
    expect(valuesFor(tokens, 'property')).toContain('max')
    expect(valuesFor(tokens, 'function')).toContain('calculate')
    expect(valuesFor(tokens, 'number')).toEqual(
      expect.arrayContaining(['0x10', '2_000']),
    )
    expect(valuesFor(tokens, 'literal')).toContain('null')
    expect(valuesFor(tokens, 'operator')).toEqual(
      expect.arrayContaining(['=', '.', '??']),
    )
    expect(valuesFor(tokens, 'comment')).toContain('// Keep the larger value.')
  })

  it('does not interpret comment markers inside strings as comments', () => {
    const code = `const url = "https://example.com/path" // Request URL`
    const tokens = tokenizeCode(code)

    expect(valuesFor(tokens, 'string')).toEqual([
      '"https://example.com/path"',
    ])
    expect(valuesFor(tokens, 'comment')).toEqual(['// Request URL'])
  })

  it('renders token colors inside the shared read-only code block', () => {
    const markup = renderToStaticMarkup(
      <ReadOnlyCode code={`const total: number = Math.max(3, 5)`} />,
    )

    expect(markup).toContain('<pre')
    expect(markup).toContain('<code')
    expect(markup).toContain('text-sky-700')
    expect(markup).toContain('text-fuchsia-700')
    expect(markup).toContain('text-cyan-700')
    expect(markup).toContain('text-amber-700')
  })

  it('keeps prose in plain text mode', () => {
    const markup = renderToStaticMarkup(
      <ReadOnlyCode
        code="Use a Map for repeated lookups."
        language="text"
      />,
    )

    expect(markup).toContain('<code>Use a Map for repeated lookups.</code>')
    expect(markup).not.toContain('<span')
  })
})

function valuesFor(
  tokens: ReturnType<typeof tokenizeCode>,
  kind: ReturnType<typeof tokenizeCode>[number]['kind'],
) {
  return tokens.filter((token) => token.kind === kind).map((token) => token.value)
}
