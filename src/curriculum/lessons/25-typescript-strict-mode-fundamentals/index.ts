import Concept from './concept.mdx'

import type { Lesson } from '../../types'

// Type fixtures compile beneath the submission with the ES-only lib chain
// from src/runtime/typeGrader.ts, where no global console exists. Each
// fixture therefore declares the console the sample call uses; the runtime
// runner supplies the real one.
const consoleDeclaration =
  'declare const console: { log(...values: unknown[]): void }\n'

export const lesson: Lesson = {
  slug: 'typescript-strict-mode-fundamentals',
  title: 'TypeScript Strict-Mode Fundamentals',
  summary:
    'Use strict TypeScript settings to make invalid states visible at compile time.',
  track: 'js-ts-core',
  order: 25,
  concept: Concept,
  problems: [
    {
      id: 'fix-silenced-lookup',
      kind: 'debug',
      completionMode: 'all-tests-pass',
      title: 'Fix the lookup that silenced the compiler',
      prompt:
        'isFeatureEnabled reports whether a named feature flag is on. A flag that is not in the list should count as off and return false. The compiler flagged this lookup as possibly undefined, and someone silenced it with a non-null assertion instead of handling the missing case, so unknown flag names now crash. Remove the assertion and handle the missing flag honestly. Example: `isFeatureEnabled([{ name: "search", enabled: true }], "billing")` should return `false`.',
      estimatedMinutes: 12,
      functionName: 'isFeatureEnabled',
      brokenCode: `type Feature = {
  name: string
  enabled: boolean
}

export function isFeatureEnabled(features: Feature[], name: string): boolean {
  // find returns Feature | undefined; the ! asserts the flag always exists.
  const feature = features.find((candidate) => candidate.name === name)!
  return feature.enabled
}

console.log(isFeatureEnabled([{ name: 'search', enabled: true }], 'search'))
`,
      bugHints: [
        'Run the sample call with a flag name that is not in the list. What does find return then?',
        'The ! removed the compiler error, not the undefined value. The crash it warned about is still there.',
        'A missing flag should read as off. Optional chaining with a ?? default, or an explicit undefined check, both say that honestly.',
      ],
      tests: [
        {
          name: 'reports an enabled flag',
          args: [[{ name: 'search', enabled: true }], 'search'],
          expected: true,
        },
        {
          name: 'reports a disabled flag',
          args: [[{ name: 'search', enabled: false }], 'search'],
          expected: false,
        },
        {
          name: 'finds a flag later in the list',
          args: [
            [
              { name: 'search', enabled: true },
              { name: 'export', enabled: false },
            ],
            'export',
          ],
          expected: false,
        },
        {
          name: 'treats an unknown flag as off instead of crashing',
          args: [[{ name: 'search', enabled: true }], 'billing'],
          expected: false,
        },
        {
          name: 'treats every flag as off when the list is empty',
          args: [[], 'search'],
          expected: false,
        },
        {
          name: 'matches names case-sensitively',
          args: [[{ name: 'Search', enabled: true }], 'search'],
          expected: false,
        },
      ],
      typeFixture: `${consoleDeclaration}
const flagFromEmptyList: boolean = isFeatureEnabled([], 'anything')
void flagFromEmptyList

// @ts-expect-error a single flag object is not a flag list
isFeatureEnabled({ name: 'search', enabled: true }, 'search')
`,
    },
    {
      id: 'read-unknown-setting',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Read a numeric setting from unknown config',
      prompt:
        'Config for your service arrives through JSON.parse, so nothing about its shape is guaranteed: the whole value might not be an object, the key might be missing, and the value under the key might not be a number. Implement `readNumberSetting(raw, key, fallback)`. Keep `raw` typed as `unknown`, not `any`, and return the value stored under `key` only when runtime checks prove it is a number; in every other case return `fallback`. A stored 0 is a valid number and must be returned, not replaced by the fallback. Example: `readNumberSetting({ timeoutMs: 250 }, "timeoutMs", 5000)` returns `250`, and `readNumberSetting(null, "timeoutMs", 5000)` returns `5000`.',
      estimatedMinutes: 18,
      functionName: 'readNumberSetting',
      starter: `export function readNumberSetting(
  raw: unknown,
  key: string,
  fallback: number,
): number {
  return fallback
}

console.log(readNumberSetting({ timeoutMs: 250 }, 'timeoutMs', 5000))
`,
      tests: [
        {
          name: 'returns a number stored under the key',
          args: [{ timeoutMs: 250 }, 'timeoutMs', 5000],
          expected: 250,
        },
        {
          name: 'falls back when the key is missing',
          args: [{ retries: 3 }, 'timeoutMs', 5000],
          expected: 5000,
        },
        {
          name: 'falls back when the config is null',
          args: [null, 'timeoutMs', 5000],
          expected: 5000,
        },
        {
          name: 'falls back when the config is an unparsed JSON string',
          args: ['{"timeoutMs":250}', 'timeoutMs', 5000],
          expected: 5000,
        },
        {
          name: 'falls back when the stored value is a numeric string',
          args: [{ timeoutMs: '250' }, 'timeoutMs', 5000],
          expected: 5000,
        },
        {
          name: 'returns a stored zero instead of the fallback',
          args: [{ volume: 0 }, 'volume', 10],
          expected: 0,
        },
      ],
      typeFixture: `${consoleDeclaration}
const parsed: unknown = JSON.parse('{"timeoutMs":250}')
const settingFromParsed: number = readNumberSetting(parsed, 'timeoutMs', 5000)
void settingFromParsed

// Reject an any parameter: any would accept the same calls while silencing
// every unsafe read inside the function. 0 extends 1 & T only when T is any.
type FixtureIsAny<T> = 0 extends 1 & T ? true : false
type FixtureRawParam = Parameters<typeof readNumberSetting>[0]
const rawStaysUnknown: FixtureIsAny<FixtureRawParam> extends true
  ? never
  : unknown extends FixtureRawParam
    ? true
    : never = true
void rawStaysUnknown

// @ts-expect-error an unproven value must not be read as an object
parsed.timeoutMs
`,
    },
    {
      id: 'type-the-order-boundary',
      kind: 'refactor',
      completionMode: 'tests-and-static-checks-pass',
      title: 'Refactor the any-typed order summary into an honest contract',
      prompt:
        'summarizeOrder formats a one-line description of an order. Because the parameter is any, the compiler accepted a coupon read that crashes for every order without a coupon, including the sample call below. Replace any with a real Order type: items is an array of item name strings, totalCents is a number, and coupon is optional, carrying a string code when present. Handle the missing coupon explicitly. Keep the output format unchanged: item count, total as dollars with two decimals, and the coupon code appended only when a coupon exists. Example: `summarizeOrder({ items: ["tea", "mug"], totalCents: 1250 })` returns `"2 items for $12.50"`.',
      estimatedMinutes: 20,
      functionName: 'summarizeOrder',
      originalCode: `export function summarizeOrder(order: any): string {
  const itemCount = order.items.length
  const dollars = (order.totalCents / 100).toFixed(2)

  if (order.coupon.code !== undefined) {
    return \`\${itemCount} items for $\${dollars} with coupon \${order.coupon.code}\`
  }

  return \`\${itemCount} items for $\${dollars}\`
}

console.log(summarizeOrder({ items: ['tea', 'mug'], totalCents: 1250 }))
`,
      starter: `export function summarizeOrder(order: any): string {
  const itemCount = order.items.length
  const dollars = (order.totalCents / 100).toFixed(2)

  if (order.coupon.code !== undefined) {
    return \`\${itemCount} items for $\${dollars} with coupon \${order.coupon.code}\`
  }

  return \`\${itemCount} items for $\${dollars}\`
}

console.log(summarizeOrder({ items: ['tea', 'mug'], totalCents: 1250 }))
`,
      goals: [
        'Type the parameter with a named Order type: items as string[], totalCents as number, and an optional coupon holding a string code.',
        'Handle the missing coupon explicitly, so orders without one format cleanly instead of crashing.',
        'Keep the formatted output identical for orders with and without a coupon.',
      ],
      staticChecks: [
        {
          kind: 'no-any',
          message:
            'The refactor must remove any entirely. An any parameter is what let the crashing coupon read compile.',
        },
      ],
      tests: [
        {
          name: 'formats an order without a coupon',
          args: [{ items: ['tea', 'mug'], totalCents: 1250 }],
          expected: '2 items for $12.50',
        },
        {
          name: 'appends the coupon code when a coupon exists',
          args: [
            {
              items: ['tea', 'mug', 'kettle'],
              totalCents: 8000,
              coupon: { code: 'SAVE10' },
            },
          ],
          expected: '3 items for $80.00 with coupon SAVE10',
        },
        {
          name: 'formats an empty order',
          args: [{ items: [], totalCents: 0 }],
          expected: '0 items for $0.00',
        },
        {
          name: 'renders cents with two decimals',
          args: [{ items: ['poster', 'frame'], totalCents: 999 }],
          expected: '2 items for $9.99',
        },
        {
          name: 'pads a small couponed total',
          args: [
            {
              items: ['sticker', 'sticker'],
              totalCents: 5,
              coupon: { code: 'FREESHIP' },
            },
          ],
          expected: '2 items for $0.05 with coupon FREESHIP',
        },
      ],
      typeFixture: `${consoleDeclaration}
const plainSummary: string = summarizeOrder({ items: ['tea'], totalCents: 500 })
void plainSummary

const discountedSummary: string = summarizeOrder({
  items: ['tea'],
  totalCents: 500,
  coupon: { code: 'SAVE10' },
})
void discountedSummary

// @ts-expect-error an order without totalCents must be rejected
summarizeOrder({ items: ['tea'] })

// @ts-expect-error item names must be strings
summarizeOrder({ items: [42], totalCents: 500 })

// @ts-expect-error a coupon must carry its code
summarizeOrder({ items: ['tea'], totalCents: 500, coupon: {} })
`,
    },
    {
      id: 'strictness-tradeoff-review',
      kind: 'written',
      completionMode: 'submitted-with-reference-review',
      title: 'Explain what strict mode buys',
      prompt:
        'A teammate proposes turning off strict mode for your team\'s new service, arguing that any and non-null assertions let people ship faster and the errors are "just noise". Write your response. Cover: what noImplicitAny and strictNullChecks actually catch, with a concrete bug each; why a non-null assertion hides a crash rather than fixing it; and why unknown beats any for external data such as parsed JSON. Use a short example of your own.',
      estimatedMinutes: 12,
      referenceAnswer:
        "Strict mode changes where bugs surface, not whether they exist. noImplicitAny catches values the compiler was silently giving up on: an untyped parameter like applyDiscount(price, percent) accepts a call such as applyDiscount(2000, '10%'), the string arithmetic yields NaN, and the NaN travels into totals with no error anywhere. With the flag on, the missing annotations are a compile error and the bad call fails at the call site. strictNullChecks makes absence part of the type: users.find(...) returns User | undefined, so reading .email without ruling out the undefined case is a compile error pointing at the exact expression that would have thrown at runtime.\n\nA non-null assertion does not fix that error, it deletes the check. Writing find(...)!.email compiles, and when the value really is missing the program still crashes, now with no warning anywhere in the code. The guard the compiler wanted, if (user === undefined) or user?.email, handles the case instead of denying it. Each ! in a codebase marks a spot where the original crash is still live.\n\nFor external data the choice between any and unknown is the honest version of the same trade. Typing JSON.parse output as any lets code claim a string is a number: const total: number = response.total compiles even when the server sent \"12.50\", and total + 5 quietly produces the string '12.505', a wrong answer with no crash to point at it. unknown also means \"could be anything\", but it forbids every use until a runtime check proves the shape, so the typeof checks that were always necessary become checks the compiler enforces. The cost of strict mode is writing branches for cases that were always possible. The saving is that those cases show up as red squiggles during development instead of as production incidents.",
      rubric: [
        {
          id: 'flags-with-bugs',
          label: 'Flags tied to concrete bugs',
          description:
            'Names noImplicitAny and strictNullChecks and gives a specific bug each one catches, such as string arithmetic through untyped parameters or an unguarded possibly-undefined read.',
        },
        {
          id: 'assertion-cost',
          label: 'Non-null assertion cost',
          description:
            'Explains that ! removes the compile-time check while leaving the runtime crash in place, and names an honest alternative such as a guard, optional chaining, or a ?? default.',
        },
        {
          id: 'unknown-over-any',
          label: 'unknown over any at boundaries',
          description:
            'Contrasts any (disables checking and spreads) with unknown (blocks use until runtime checks narrow it), grounded in an external-data example like parsed JSON.',
        },
      ],
    },
  ],
  approaches: {
    'fix-silenced-lookup': [
      {
        name: 'Guard the lookup instead of asserting it',
        code: `type Feature = {
  name: string
  enabled: boolean
}

export function isFeatureEnabled(features: Feature[], name: string): boolean {
  // find returns Feature | undefined, and the type now tells the truth.
  const feature = features.find((candidate) => candidate.name === name)
  // Optional chaining handles the missing flag, and ?? turns the
  // resulting undefined into the documented default: off.
  return feature?.enabled ?? false
}`,
        explanation:
          'The broken version silenced the compiler with a non-null assertion, which removed the diagnostic but not the undefined value, so unknown flag names crashed on the property read. Dropping the ! restores the honest type Feature | undefined, and the ?. plus ?? pair handles it: a missing flag reads as undefined, which the ?? converts to false. An explicit if (feature === undefined) return false is equally correct. Note that ?? is the right default operator here; || would also override enabled: false, and a disabled flag must stay false rather than fall through to a default.',
        complexity: 'O(n) time over the flag list, O(1) space.',
      },
    ],
    'read-unknown-setting': [
      {
        name: 'Earn each read with a runtime check',
        code: `export function readNumberSetting(
  raw: unknown,
  key: string,
  fallback: number,
): number {
  // Prove the config is an object at all. typeof null is also
  // 'object', so the null test is part of the proof.
  if (typeof raw !== 'object' || raw === null) {
    return fallback
  }

  // We know it is an object but nothing about its values, so read
  // them as a bag of unknowns rather than casting to a hoped-for shape.
  const value = (raw as Record<string, unknown>)[key]

  // The value itself must prove it is a number. This typeof check is
  // also what returns a stored 0 instead of the fallback: 0 is a
  // number, so no truthiness shortcut belongs here.
  return typeof value === 'number' ? value : fallback
}`,
        explanation:
          'The parameter stays unknown, so the compiler rejects every read until a runtime check narrows it, which is exactly the discipline external data needs. The one cast in the solution claims only what the guards above it have proven: a non-null object, with values still unknown. Casting further, to any or to a specific shape, would let a numeric string or missing key slip through as if it were a number. The final typeof check deliberately avoids patterns like Number(value) || fallback, which would coerce numeric strings the config never promised and replace a legitimate stored 0 with the fallback.',
        complexity:
          'O(1) time and space. The guarantee that matters is that every returned non-fallback value passed a typeof number check at runtime.',
      },
    ],
    'type-the-order-boundary': [
      {
        name: 'Name the shape and mark the coupon optional',
        code: `type Coupon = {
  code: string
}

type Order = {
  items: string[]
  totalCents: number
  // The ? records in the type that some orders have no coupon, which
  // forces every reader to handle that case before touching code.
  coupon?: Coupon
}

export function summarizeOrder(order: Order): string {
  const itemCount = order.items.length
  const dollars = (order.totalCents / 100).toFixed(2)

  // Guard the whole coupon, not a property on it. Reading
  // order.coupon.code before this check is a compile error now.
  if (order.coupon !== undefined) {
    return \`\${itemCount} items for $\${dollars} with coupon \${order.coupon.code}\`
  }

  return \`\${itemCount} items for $\${dollars}\`
}`,
        explanation:
          'The original checked order.coupon.code !== undefined, but with an any parameter the compiler could not point out that order.coupon itself might be missing, so the check crashed before it ran. The refactor states the truth in the type: coupon?: Coupon gives order.coupon the type Coupon | undefined, and strictNullChecks then rejects any unguarded .code read, in this function and in every future caller of the type. Behavior for well-formed orders is unchanged; the only new code path is the one that used to throw. One caution carried over from the lesson: types are erased at runtime, so if orders ever arrive from outside the program, the boundary should validate them as unknown data first.',
        complexity:
          'O(1) time and space. The guarantee that matters: no code path reads coupon properties without the compiler having seen the undefined case handled.',
      },
    ],
  },
}
