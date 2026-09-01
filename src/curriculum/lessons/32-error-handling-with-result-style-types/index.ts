import Concept from './concept.mdx'

import type { Lesson } from '../../types'

// The type grader compiles submissions with the ES lib chain only (no DOM),
// so `console` is not declared there. Each fixture opens with this shim so
// the starter's sample console.log call type-checks. See src/runtime/typeWorker.ts.
const consoleShim =
  'declare const console: { log: (...values: unknown[]) => void }\n'

export const lesson: Lesson = {
  slug: 'error-handling-with-result-style-types',
  title: 'Error Handling with Result-Style Types',
  summary:
    'Represent recoverable failures explicitly and avoid ambiguous control flow.',
  track: 'js-ts-core',
  order: 32,
  concept: Concept,
  problems: [
    {
      id: 'parse-price-result',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Move the price failure into the signature',
      prompt:
        "parsePrice is the opening example's throwing parser, and its signature still promises a number it cannot always produce. Rewrite it to return `Result<number, string>` using the Result type already defined above it: on a match, return `{ ok: true, value }` with the cents; on a malformed price, return `{ ok: false, error }` carrying the exact message the throw used to carry, `` `unparseable price: ${price}` ``. Keep the format rule as it is: a dollar sign, digits, a dot, exactly two digits. Hidden type tests require that `value` be unreachable until the caller narrows on `ok`. Example: `parsePrice('$4.50')` returns `{ ok: true, value: 450 }`, and `parsePrice('4.99')` returns `{ ok: false, error: 'unparseable price: 4.99' }`.",
      estimatedMinutes: 12,
      functionName: 'parsePrice',
      starter: `export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E }

// Rewrite parsePrice to return a Result instead of throwing.
export function parsePrice(price: string): number {
  const match = /^\\$(\\d+)\\.(\\d{2})$/.exec(price)
  if (match === null) {
    throw new Error(\`unparseable price: \${price}\`)
  }
  return Number(match[1]) * 100 + Number(match[2])
}

console.log(parsePrice('$4.50'))
`,
      typeFixture: `${consoleShim}
const parsed = parsePrice('$4.50')

// @ts-expect-error the value is only available after narrowing on ok
const direct: number = parsed.value
void direct

if (parsed.ok) {
  const cents: number = parsed.value
  void cents
} else {
  const message: string = parsed.error
  void message
}

// @ts-expect-error the error branch has no value field to read
const fromError = !parsed.ok && parsed.value
void fromError
`,
      tests: [
        {
          name: 'parses a well-formed price',
          args: ['$4.50'],
          expected: { ok: true, value: 450 },
        },
        {
          name: 'parses a price with more dollars',
          args: ['$12.00'],
          expected: { ok: true, value: 1200 },
        },
        {
          name: 'reports a missing dollar sign as a value, not a throw',
          args: ['4.99'],
          expected: { ok: false, error: 'unparseable price: 4.99' },
        },
        {
          name: 'parses a cents-only price',
          args: ['$0.05'],
          expected: { ok: true, value: 5 },
        },
        {
          name: 'reports the empty string',
          args: [''],
          expected: { ok: false, error: 'unparseable price: ' },
        },
        {
          name: 'rejects a single cents digit',
          args: ['$4.5'],
          expected: { ok: false, error: 'unparseable price: $4.5' },
        },
        {
          name: 'rejects three cents digits',
          args: ['$4.505'],
          expected: { ok: false, error: 'unparseable price: $4.505' },
        },
      ],
    },
    {
      id: 'withdraw-typed-errors',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Tag the withdrawal failures with what callers need',
      prompt:
        "withdraw deducts an amount from a balance, and today its two failures throw Errors whose messages callers would have to string-match to tell apart. Rewrite it to return `Result<number, WithdrawError>`, defining `WithdrawError` as a discriminated union of two members: `{ kind: 'invalid-amount'; amountCents: number }` when the amount is not a positive whole number, and `{ kind: 'insufficient-funds'; shortfallCents: number }` when the amount exceeds the balance, carrying how much is missing. Check the amount first, then the funds; success returns the new balance. Hidden type tests require narrowing on `ok` and then on `kind`, with each error member exposing only its own field. Example: `withdraw(1000, 250)` returns `{ ok: true, value: 750 }`, and `withdraw(500, 900)` returns `{ ok: false, error: { kind: 'insufficient-funds', shortfallCents: 400 } }`.",
      estimatedMinutes: 15,
      functionName: 'withdraw',
      starter: `export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E }

// Define WithdrawError and return a Result instead of throwing.
export function withdraw(
  balanceCents: number,
  amountCents: number,
): number {
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    throw new Error('invalid amount')
  }
  if (amountCents > balanceCents) {
    throw new Error('insufficient funds')
  }
  return balanceCents - amountCents
}

console.log(withdraw(1000, 250))
`,
      typeFixture: `${consoleShim}
const outcome = withdraw(1000, 250)

if (outcome.ok) {
  const newBalance: number = outcome.value
  void newBalance
} else if (outcome.error.kind === 'insufficient-funds') {
  const shortfall: number = outcome.error.shortfallCents
  void shortfall
} else {
  const attempted: number = outcome.error.amountCents
  void attempted
}

// @ts-expect-error the new balance is only available after narrowing on ok
const direct: number = outcome.value
void direct

// @ts-expect-error shortfall exists only on the insufficient-funds error
const wrongBranch = !outcome.ok && outcome.error.kind === 'invalid-amount' && outcome.error.shortfallCents
void wrongBranch
`,
      tests: [
        {
          name: 'withdraws within the balance',
          args: [1000, 250],
          expected: { ok: true, value: 750 },
        },
        {
          name: 'withdraws the exact balance',
          args: [1000, 1000],
          expected: { ok: true, value: 0 },
        },
        {
          name: 'reports the shortfall when funds are insufficient',
          args: [500, 900],
          expected: {
            ok: false,
            error: { kind: 'insufficient-funds', shortfallCents: 400 },
          },
        },
        {
          name: 'rejects a zero amount',
          args: [500, 0],
          expected: {
            ok: false,
            error: { kind: 'invalid-amount', amountCents: 0 },
          },
        },
        {
          name: 'rejects a negative amount',
          args: [500, -25],
          expected: {
            ok: false,
            error: { kind: 'invalid-amount', amountCents: -25 },
          },
        },
        {
          name: 'rejects a fractional amount',
          args: [500, 2.5],
          expected: {
            ok: false,
            error: { kind: 'invalid-amount', amountCents: 2.5 },
          },
        },
      ],
    },
    {
      id: 'import-settings-result',
      kind: 'refactor',
      completionMode: 'tests-and-static-checks-pass',
      title: 'Drain the throws out of the settings importer',
      prompt:
        'importSettings already validates like lesson 31 taught: it parses unknown JSON and checks every field. But each failure throws a bare Error, so callers get one anonymous channel for four different problems and the signature admits none of them. Refactor it to return `Result<Settings, ImportError>` with no `throw` left anywhere in the file. Define `ImportError` as a union tagged by `kind` with exactly four members: `invalid-json`, `not-an-object`, `invalid-theme`, and `invalid-font-size`, each replacing the throw at the corresponding check. Keep the validation rules and their order exactly as they are. Example: `importSettings(\'{"theme":"dark","fontSize":14}\')` returns `{ ok: true, value: { theme: \'dark\', fontSize: 14 } }`, and `importSettings(\'garbage\')` returns `{ ok: false, error: { kind: \'invalid-json\' } }`.',
      estimatedMinutes: 18,
      functionName: 'importSettings',
      originalCode: `export type Settings = {
  theme: 'light' | 'dark'
  fontSize: number
}

export function importSettings(raw: string): Settings {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('bad json')
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('not an object')
  }

  const theme =
    'theme' in parsed && (parsed.theme === 'light' || parsed.theme === 'dark')
      ? parsed.theme
      : null
  if (theme === null) {
    throw new Error('bad theme')
  }

  const fontSize =
    'fontSize' in parsed && typeof parsed.fontSize === 'number'
      ? parsed.fontSize
      : null
  if (fontSize === null) {
    throw new Error('bad font size')
  }

  return { theme, fontSize }
}

console.log(importSettings('{"theme":"dark","fontSize":14}'))
`,
      starter: `export type Settings = {
  theme: 'light' | 'dark'
  fontSize: number
}

export function importSettings(raw: string): Settings {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('bad json')
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('not an object')
  }

  const theme =
    'theme' in parsed && (parsed.theme === 'light' || parsed.theme === 'dark')
      ? parsed.theme
      : null
  if (theme === null) {
    throw new Error('bad theme')
  }

  const fontSize =
    'fontSize' in parsed && typeof parsed.fontSize === 'number'
      ? parsed.fontSize
      : null
  if (fontSize === null) {
    throw new Error('bad font size')
  }

  return { theme, fontSize }
}

console.log(importSettings('{"theme":"dark","fontSize":14}'))
`,
      goals: [
        'Define Result<Settings, ImportError> as the return type, with ImportError a union of four kind-tagged members, one per failure.',
        'Replace every throw with an { ok: false, error } return carrying the matching kind, leaving the validation rules and their order untouched.',
        'Keep the file free of throw entirely; the JSON.parse boundary converts its exception into the invalid-json member.',
      ],
      staticChecks: [
        {
          kind: 'forbid-text',
          text: 'throw',
          message:
            'No throws remain: every failure returns as a tagged Result value.',
        },
        {
          kind: 'require-text',
          text: 'Result<',
          message:
            'Return a Result so the signature admits that importing can fail.',
        },
        {
          kind: 'require-text',
          text: 'kind',
          message:
            'Tag each failure with a kind so callers can branch without matching message text.',
        },
        {
          kind: 'no-any',
          message:
            'Keep the boundary precise. An any would hide both the failures and the shapes.',
        },
      ],
      typeFixture: `${consoleShim}
const imported = importSettings('{"theme":"dark","fontSize":14}')

// @ts-expect-error settings are only available after narrowing on ok
const direct: Settings = imported.value
void direct

if (imported.ok) {
  const size: number = imported.value.fontSize
  void size
} else if (imported.error.kind === 'invalid-json') {
  const handled: 'invalid-json' = imported.error.kind
  void handled
}

// @ts-expect-error timeout is not a failure this import can produce
const impossible = !imported.ok && imported.error.kind === 'timeout'
void impossible
`,
      tests: [
        {
          name: 'imports dark settings',
          args: ['{"theme":"dark","fontSize":14}'],
          expected: { ok: true, value: { theme: 'dark', fontSize: 14 } },
        },
        {
          name: 'imports light settings',
          args: ['{"theme":"light","fontSize":11}'],
          expected: { ok: true, value: { theme: 'light', fontSize: 11 } },
        },
        {
          name: 'tags text that is not JSON',
          args: ['garbage'],
          expected: { ok: false, error: { kind: 'invalid-json' } },
        },
        {
          name: 'tags a JSON payload that is not an object',
          args: ['"just text"'],
          expected: { ok: false, error: { kind: 'not-an-object' } },
        },
        {
          name: 'tags JSON null as not an object',
          args: ['null'],
          expected: { ok: false, error: { kind: 'not-an-object' } },
        },
        {
          name: 'tags an unknown theme',
          args: ['{"theme":"blue","fontSize":14}'],
          expected: { ok: false, error: { kind: 'invalid-theme' } },
        },
        {
          name: 'tags a missing theme',
          args: ['{"fontSize":14}'],
          expected: { ok: false, error: { kind: 'invalid-theme' } },
        },
        {
          name: 'tags a string font size',
          args: ['{"theme":"dark","fontSize":"14"}'],
          expected: { ok: false, error: { kind: 'invalid-font-size' } },
        },
      ],
    },
    {
      id: 'result-tradeoffs-review',
      kind: 'written',
      completionMode: 'submitted-with-reference-review',
      title: 'Explain which failures belong in the signature',
      prompt:
        'A teammate reviews your Result refactor and asks: "Why not try/catch? It\'s built in, everyone knows it, and now every caller has to unwrap these objects." In your own words, respond. Explain: what a throwing function\'s signature hides and what the caught value\'s type costs under strict mode, what the Result union forces at call sites and how a kind-tagged error union plus the never tripwire behaves when the failure set grows, why throwing boundaries like JSON.parse should be converted once rather than caught everywhere, and which failures you would still throw for and why. Use a short example of your own.',
      estimatedMinutes: 12,
      referenceAnswer:
        "try/catch is built in, but look at what the types say on each side of it. A throwing parser's signature reads (price: string) => number, which is a promise it cannot keep; the failure channel is invisible, so nothing marks the call sites that need care, and a new throw added deep in a call tree changes no type anywhere. On the catching side, strict mode types the caught value unknown, because JavaScript lets anything be thrown, so the handler must narrow with instanceof before reading a message, and even then it cannot tell the failure it meant to handle from an unrelated bug that happened to throw inside the same try. Invisible on the way out, anonymous on the way in.\n\nThe unwrapping my teammate dislikes is the feature. Result<number, ParseError> puts failure in the return value, the one channel the compiler fully checks, so reading value before narrowing on ok is a compile error, not a convention. Forgetting the failure case stops being possible. Tagging the error union pays off as the code grows: give each failure a kind, switch over it with a never-typed default, and adding a fourth failure kind next quarter turns every unupdated handler into a compile error with a location. With exceptions, growing the failure set is silent; with a tagged Result, it is a to-do list from the compiler, the same exhaustiveness guarantee discriminated unions gave app states in lesson 26.\n\nConverting at the boundary is about doing the ugly part once. JSON.parse throws, the platform throws, libraries throw; wrapping each call site in its own try/catch re-scatters the anonymous channel everywhere. One small function per throwing boundary, catching, narrowing the unknown, and returning a Result, means the entire interior of the program deals in checked values. That mirrors last lesson's validators: absorb the chaos at the edge, pass proof inward.\n\nBut I would not convert everything, and this is the part of the objection I agree with. Result is for failures in the function's job description, the ones a competent caller can respond to specifically: malformed input, insufficient funds, a missing record. A violated invariant, an impossible branch, an index that cannot be wrong but is, has no caller that can handle it; returning it as a value launders a bug into control flow and lets the program limp forward in a corrupted state. Those should throw, loudly, and be caught only near the top, where crashing or coarse recovery is the honest response. The test is one question: is there a specific thing the caller should do with this failure? Yes, Result. No, throw.",
      rubric: [
        {
          id: 'invisible-channel',
          label: 'What throwing hides',
          description:
            'Explains that throws are absent from signatures so call sites carry no warning, and that strict mode types caught values unknown, requiring narrowing and blurring intended failures with unrelated bugs.',
        },
        {
          id: 'compiler-forced-handling',
          label: 'What Result forces',
          description:
            'Explains that failure in the return value makes unhandled cases compile errors, and that a kind-tagged error union with a never tripwire turns growth of the failure set into located compile errors.',
        },
        {
          id: 'boundary-conversion',
          label: 'Convert once at the boundary',
          description:
            'Argues for wrapping throwing platform and library calls in one boundary function returning a Result, rather than scattering try/catch through the interior.',
        },
        {
          id: 'when-to-throw',
          label: 'What should still throw',
          description:
            'Distinguishes recoverable, expected failures from bugs and invariant violations, keeping throws for the latter with a defensible reason rather than converting everything.',
        },
      ],
    },
  ],
  approaches: {
    'parse-price-result': [
      {
        name: 'Two returns, one honest signature',
        code: `export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E }

export function parsePrice(price: string): Result<number, string> {
  const match = /^\\$(\\d+)\\.(\\d{2})$/.exec(price)

  // Failure is a value now: same information the old Error carried,
  // but visible in the signature and impossible to overlook.
  if (match === null) {
    return { ok: false, error: \`unparseable price: \${price}\` }
  }

  return { ok: true, value: Number(match[1]) * 100 + Number(match[2]) }
}`,
        explanation:
          "The regex and the arithmetic are untouched; the entire refactor is in what leaves the function. Where the old version tore down the stack with an Error, this one returns the failure member of the union, carrying the identical message as data, and the success path wraps its number in the ok member. The gain is all at the call sites, enforced by the discriminant: parsed.value does not type-check until an if or a switch has established parsed.ok, so the malformed-price case cannot be forgotten, only handled. Note what happened to the opening example's crash-in-map problem: mapping parsePrice over a price list now yields an array of Results, every element present, with the bad entries marked instead of the whole computation gone.",
        complexity:
          'O(n) time in the price length for the regex match, O(1) space. The guarantee that matters is the signature: every outcome the function can produce is in its return type.',
      },
    ],
    'withdraw-typed-errors': [
      {
        name: 'A kind per failure, data in each',
        code: `export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E }

export type WithdrawError =
  | { kind: 'invalid-amount'; amountCents: number }
  | { kind: 'insufficient-funds'; shortfallCents: number }

export function withdraw(
  balanceCents: number,
  amountCents: number,
): Result<number, WithdrawError> {
  // A withdrawal must be a whole, positive number of cents.
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    return { ok: false, error: { kind: 'invalid-amount', amountCents } }
  }

  // The error carries what the caller needs to respond: how short.
  if (amountCents > balanceCents) {
    return {
      ok: false,
      error: {
        kind: 'insufficient-funds',
        shortfallCents: amountCents - balanceCents,
      },
    }
  }

  return { ok: true, value: balanceCents - amountCents }
}`,
        explanation:
          "WithdrawError is a discriminated union nested inside the failure half of another discriminated union, and each layer does one job: ok routes between success and failure, kind routes between failure responses. What the tagged members carry is the design decision worth studying. The invalid-amount member holds the rejected amount so an interface can echo it back; the insufficient-funds member holds the computed shortfall rather than the raw inputs, because 'add $4.00 more' is the response callers actually build, and computing it here means no caller re-derives it wrong. The old throwing version made both failures the same type with different prose, leaving callers to string-match; here the compiler knows shortfallCents exists only on one member and enforces the narrowing that proves which.",
        complexity:
          'O(1) time and space. The guarantee that matters is that each failure kind exposes exactly the data a caller needs to respond to it.',
      },
    ],
    'import-settings-result': [
      {
        name: 'Throws become tagged returns',
        code: `export type Settings = {
  theme: 'light' | 'dark'
  fontSize: number
}

export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E }

// Each way the import can fail, tagged so callers can respond per kind.
export type ImportError =
  | { kind: 'invalid-json' }
  | { kind: 'not-an-object' }
  | { kind: 'invalid-theme' }
  | { kind: 'invalid-font-size' }

export function importSettings(raw: string): Result<Settings, ImportError> {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { ok: false, error: { kind: 'invalid-json' } }
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return { ok: false, error: { kind: 'not-an-object' } }
  }

  const theme =
    'theme' in parsed && (parsed.theme === 'light' || parsed.theme === 'dark')
      ? parsed.theme
      : null
  if (theme === null) {
    return { ok: false, error: { kind: 'invalid-theme' } }
  }

  const fontSize =
    'fontSize' in parsed && typeof parsed.fontSize === 'number'
      ? parsed.fontSize
      : null
  if (fontSize === null) {
    return { ok: false, error: { kind: 'invalid-font-size' } }
  }

  return { ok: true, value: { theme, fontSize } }
}

console.log(importSettings('{"theme":"dark","fontSize":14}'))
`,
        explanation:
          "The validation ladder is lesson 31's and it did not move; every check, narrowing step, and even their order is preserved, which the behavior tests pin. What changed is the failure channel. Four anonymous throws, distinguishable only by prose, became four tagged members of ImportError, and the signature grew from a false promise of Settings into the full account Result<Settings, ImportError>. The try/catch survives, but inverted in purpose: instead of re-throwing a cleaner Error, it converts JSON.parse's exception into the invalid-json value, making this function the boundary where the throwing world ends. Callers narrow on ok, then on kind, and a switch over the kinds with a never tripwire will refuse to compile when this union gains a fifth failure, which is the growth story throws can never offer.",
        complexity:
          'O(n) time in the input length for the parse and checks, O(n) space for the parsed structure. The guarantee that matters is the signature: four tagged failures and one success, nothing invisible.',
      },
    ],
  },
}
