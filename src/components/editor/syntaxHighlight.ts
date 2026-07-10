export type CodeTokenKind =
  | 'plain'
  | 'comment'
  | 'string'
  | 'keyword'
  | 'literal'
  | 'number'
  | 'type'
  | 'builtin'
  | 'function'
  | 'property'
  | 'operator'

export type CodeToken = {
  kind: CodeTokenKind
  value: string
}

const keywords = new Set(
  `as async await break case catch class const continue debugger declare default
  delete do else enum export extends finally for from function get if implements
  import in infer instanceof interface keyof let namespace new of override private
  protected public readonly return satisfies set static super switch this throw try
  type typeof var while with yield`.split(/\s+/),
)

const typeKeywords = new Set(
  'any bigint boolean never number object string symbol unknown void'.split(' '),
)

const literals = new Set(
  'false Infinity NaN null true undefined'.split(' '),
)

const builtins = new Set(
  `Array BigInt Boolean Date Error JSON Map Math Number Object Promise Record
  RegExp Set String console`.split(/\s+/),
)

const operators = [
  '>>>=',
  '**=',
  '&&=',
  '||=',
  '??=',
  '===',
  '!==',
  '>>>',
  '<<=',
  '>>=',
  '...',
  '=>',
  '==',
  '!=',
  '<=',
  '>=',
  '&&',
  '||',
  '??',
  '?.',
  '++',
  '--',
  '+=',
  '-=',
  '*=',
  '/=',
  '%=',
  '**',
  '<<',
  '>>',
  '&=',
  '|=',
  '^=',
  '+',
  '-',
  '*',
  '/',
  '%',
  '=',
  '<',
  '>',
  '!',
  '?',
  ':',
  '&',
  '|',
  '^',
  '~',
  '.',
]

const numberPattern = /^(?:0[xX][\dA-Fa-f](?:_?[\dA-Fa-f])*|0[bB][01](?:_?[01])*|0[oO][0-7](?:_?[0-7])*|\d(?:_?\d)*(?:\.\d(?:_?\d)*)?(?:[eE][+-]?\d(?:_?\d)*)?n?)/

export function tokenizeCode(code: string): CodeToken[] {
  const tokens: CodeToken[] = []
  let index = 0

  while (index < code.length) {
    const comment = readComment(code, index)

    if (comment) {
      pushToken(tokens, comment)
      index += comment.value.length
      continue
    }

    const string = readString(code, index)

    if (string) {
      pushToken(tokens, string)
      index += string.value.length
      continue
    }

    const number = readNumber(code, index)

    if (number) {
      pushToken(tokens, number)
      index += number.value.length
      continue
    }

    const identifier = readIdentifier(code, index)

    if (identifier) {
      pushToken(tokens, {
        kind: classifyIdentifier(code, index, identifier),
        value: identifier,
      })
      index += identifier.length
      continue
    }

    const operator = operators.find((candidate) =>
      code.startsWith(candidate, index),
    )

    if (operator) {
      pushToken(tokens, { kind: 'operator', value: operator })
      index += operator.length
      continue
    }

    pushToken(tokens, { kind: 'plain', value: code[index] })
    index += 1
  }

  return tokens
}

function readComment(code: string, index: number): CodeToken | undefined {
  if (code.startsWith('//', index)) {
    const lineEnd = code.indexOf('\n', index)
    const end = lineEnd === -1 ? code.length : lineEnd

    return { kind: 'comment', value: code.slice(index, end) }
  }

  if (code.startsWith('/*', index)) {
    const commentEnd = code.indexOf('*/', index + 2)
    const end = commentEnd === -1 ? code.length : commentEnd + 2

    return { kind: 'comment', value: code.slice(index, end) }
  }

  return undefined
}

function readString(code: string, index: number): CodeToken | undefined {
  const quote = code[index]

  if (quote !== '"' && quote !== "'" && quote !== '`') {
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

  return { kind: 'string', value: code.slice(index, cursor) }
}

function readNumber(code: string, index: number): CodeToken | undefined {
  if (!isDigit(code[index]) || isIdentifierPart(code[index - 1])) {
    return undefined
  }

  const match = code.slice(index).match(numberPattern)

  return match ? { kind: 'number', value: match[0] } : undefined
}

function readIdentifier(code: string, index: number) {
  if (!isIdentifierStart(code[index])) {
    return undefined
  }

  let cursor = index + 1

  while (isIdentifierPart(code[cursor])) {
    cursor += 1
  }

  return code.slice(index, cursor)
}

function classifyIdentifier(
  code: string,
  index: number,
  identifier: string,
): CodeTokenKind {
  if (keywords.has(identifier)) {
    return 'keyword'
  }

  if (typeKeywords.has(identifier)) {
    return 'type'
  }

  if (literals.has(identifier)) {
    return 'literal'
  }

  if (builtins.has(identifier)) {
    return 'builtin'
  }

  const previousIndex = findPreviousNonWhitespaceIndex(code, index - 1)

  if (previousIndex >= 0 && code[previousIndex] === '.') {
    return 'property'
  }

  const nextIndex = findNextNonWhitespaceIndex(code, index + identifier.length)

  if (code[nextIndex] === '(') {
    return 'function'
  }

  if (/^[A-Z]/.test(identifier)) {
    return 'type'
  }

  return 'plain'
}

function findPreviousNonWhitespaceIndex(code: string, start: number) {
  let index = start

  while (index >= 0 && /\s/.test(code[index])) {
    index -= 1
  }

  return index
}

function findNextNonWhitespaceIndex(code: string, start: number) {
  let index = start

  while (index < code.length && /\s/.test(code[index])) {
    index += 1
  }

  return index
}

function isDigit(value: string | undefined) {
  return value !== undefined && /\d/.test(value)
}

function isIdentifierStart(value: string | undefined) {
  return value !== undefined && /[A-Za-z_$]/.test(value)
}

function isIdentifierPart(value: string | undefined) {
  return value !== undefined && /[\w$]/.test(value)
}

function pushToken(tokens: CodeToken[], token: CodeToken) {
  const previous = tokens[tokens.length - 1]

  if (previous?.kind === token.kind) {
    previous.value += token.value
    return
  }

  tokens.push(token)
}
