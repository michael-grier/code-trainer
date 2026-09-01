import Concept from './concept.mdx'

import type { Lesson } from '../../types'

// The type grader compiles submissions without DOM libs (see typeWorker.ts),
// so each fixture declares the console the starter's sample call uses.
const consoleDeclaration = `declare const console: { log: (...values: unknown[]) => void }

`

export const lesson: Lesson = {
  slug: 'generics-and-reusable-abstractions',
  title: 'Generics and Reusable Abstractions',
  summary: 'Write reusable typed helpers without losing inference or clarity.',
  track: 'js-ts-core',
  order: 27,
  concept: Concept,
  problems: [
    {
      id: 'generic-first-or-default',
      kind: 'refactor',
      completionMode: 'tests-and-static-checks-pass',
      title: 'Replace any with one shared type parameter',
      prompt:
        'firstOrDefault returns the first item of an array, or the fallback when the array is empty. Its behavior is correct, but every type in the signature is any, so callers lose their types and a fallback of the wrong type is accepted silently. Refactor the signature so a single type parameter links the array, the fallback, and the result: given a string[] and a string fallback the result must be a string, and a call like `firstOrDefault(["draft"], 0)` must become a compile error. Do not change the runtime behavior. Example: `firstOrDefault(["draft", "sent"], "none")` returns `"draft"`, and `firstOrDefault([], "none")` returns `"none"`.',
      estimatedMinutes: 12,
      functionName: 'firstOrDefault',
      originalCode: `export function firstOrDefault(items: any[], fallback: any): any {
  return items.length > 0 ? items[0] : fallback
}

console.log(firstOrDefault(['draft', 'sent'], 'none'))
`,
      starter: `export function firstOrDefault(items: any[], fallback: any): any {
  return items.length > 0 ? items[0] : fallback
}

console.log(firstOrDefault(['draft', 'sent'], 'none'))
`,
      goals: [
        'Declare one type parameter and use it for the array elements, the fallback, and the return type.',
        'Keep the runtime behavior identical, including for falsy first items such as 0, false, and null.',
        'Remove every any from the function.',
      ],
      staticChecks: [
        {
          kind: 'no-any',
          message:
            'The refactored signature must not use any. Declare a type parameter instead.',
        },
      ],
      tests: [
        {
          name: 'returns the first item when one exists',
          args: [['draft', 'sent'], 'none'],
          expected: 'draft',
        },
        {
          name: 'returns the fallback for an empty array',
          args: [[], 'none'],
          expected: 'none',
        },
        {
          name: 'keeps a falsy first number instead of the fallback',
          args: [[0, 5], 9],
          expected: 0,
        },
        {
          name: 'keeps a false first item instead of the fallback',
          args: [[false], true],
          expected: false,
        },
        {
          name: 'keeps a null first item instead of the fallback',
          args: [[null, 'x'], 'y'],
          expected: null,
        },
      ],
      typeFixture: `${consoleDeclaration}const chosenLabel = firstOrDefault(['draft', 'sent'], 'none')
const labelCheck: string = chosenLabel
void labelCheck

const chosenLimit = firstOrDefault([10, 20], 0)
const limitCheck: number = chosenLimit
void limitCheck

// @ts-expect-error the fallback must have the same type as the array items
firstOrDefault(['draft'], 0)
`,
    },
    {
      id: 'generic-pluck',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Pluck a column without losing its type',
      prompt:
        'Implement `pluck(items, key)`: given an array of records and a property name, return an array of that property\'s values in the same order. The starter compiles but erases every type. Redesign the signature with two type parameters so that key may only name a property the records actually have, and the result element type is that property\'s type: plucking "wins" from records whose wins is a number must produce number[], and a key the records lack must be a compile error. Example: `pluck([{ name: "Ada", wins: 3 }, { name: "Grace", wins: 5 }], "wins")` returns `[3, 5]`.',
      estimatedMinutes: 15,
      functionName: 'pluck',
      starter: `// Redesign this signature: it accepts any key and answers with unknown,
// so callers lose the property type they could see at the call site.
export function pluck(items: unknown[], key: string): unknown[] {
  return []
}

console.log(
  pluck(
    [
      { name: 'Ada', wins: 3 },
      { name: 'Grace', wins: 5 },
    ],
    'wins',
  ),
)
`,
      tests: [
        {
          name: 'plucks a number property from each record',
          args: [
            [
              { name: 'Ada', wins: 3 },
              { name: 'Grace', wins: 5 },
            ],
            'wins',
          ],
          expected: [3, 5],
        },
        {
          name: 'plucks a string property in order',
          args: [
            [
              { name: 'Ada', wins: 3 },
              { name: 'Grace', wins: 5 },
            ],
            'name',
          ],
          expected: ['Ada', 'Grace'],
        },
        {
          name: 'returns an empty array for no records',
          args: [[], 'anything'],
          expected: [],
        },
        {
          name: 'keeps duplicate values, one per record',
          args: [[{ id: 1 }, { id: 1 }, { id: 2 }], 'id'],
          expected: [1, 1, 2],
        },
        {
          name: 'plucks array-valued properties intact',
          args: [[{ tags: ['a', 'b'] }], 'tags'],
          expected: [['a', 'b']],
        },
      ],
      typeFixture: `${consoleDeclaration}const fixturePlayers = [
  { name: 'Ada', wins: 3 },
  { name: 'Grace', wins: 5 },
]

const fixtureWins = pluck(fixturePlayers, 'wins')
const fixtureWinsCheck: number[] = fixtureWins
void fixtureWinsCheck

const fixtureNames = pluck(fixturePlayers, 'name')
const fixtureNamesCheck: string[] = fixtureNames
void fixtureNamesCheck

// @ts-expect-error pluck must reject a key the items do not have
pluck(fixturePlayers, 'losses')
`,
    },
    {
      id: 'generic-index-by',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Design the signature of an indexing helper',
      prompt:
        'Implement `indexBy(items, key)`: build a lookup object whose keys are each record\'s value at `key` and whose values are the records themselves. When two records share a key value, the later record wins. The type-level requirements are the interview signal here: the lookup\'s values must keep the caller\'s exact record type, `key` must name a property the records have, and because object keys are strings, that property\'s values must be strings, so indexing by a numeric property must be a compile error. You will need a constraint that ties the two type parameters together, such as `Record<K, string>`. Example: `indexBy([{ id: "a1", name: "Ada", wins: 3 }], "id")` returns `{ a1: { id: "a1", name: "Ada", wins: 3 } }`.',
      estimatedMinutes: 20,
      functionName: 'indexBy',
      starter: `// Design the signature yourself. The returned lookup must keep the
// caller's record type, and key must name a string-valued property.
export function indexBy(
  items: Array<Record<string, unknown>>,
  key: string,
): Record<string, unknown> {
  return {}
}

console.log(
  indexBy(
    [
      { id: 'a1', name: 'Ada', wins: 3 },
      { id: 'g2', name: 'Grace', wins: 5 },
    ],
    'id',
  ),
)
`,
      tests: [
        {
          name: 'indexes records by a unique string key',
          args: [
            [
              { id: 'a1', name: 'Ada', wins: 3 },
              { id: 'g2', name: 'Grace', wins: 5 },
            ],
            'id',
          ],
          expected: {
            a1: { id: 'a1', name: 'Ada', wins: 3 },
            g2: { id: 'g2', name: 'Grace', wins: 5 },
          },
        },
        {
          name: 'lets a later record overwrite an earlier one',
          args: [
            [
              { sku: 'x', qty: 1 },
              { sku: 'y', qty: 2 },
              { sku: 'x', qty: 7 },
            ],
            'sku',
          ],
          expected: { x: { sku: 'x', qty: 7 }, y: { sku: 'y', qty: 2 } },
        },
        {
          name: 'returns an empty lookup for no records',
          args: [[], 'id'],
          expected: {},
        },
        {
          name: 'handles key values that look numeric',
          args: [[{ code: '7', label: 'seven' }], 'code'],
          expected: { '7': { code: '7', label: 'seven' } },
        },
        {
          name: 'keeps only the last record for a fully shared key',
          args: [
            [
              { name: 'Ada', role: 'admin' },
              { name: 'Grace', role: 'admin' },
            ],
            'role',
          ],
          expected: { admin: { name: 'Grace', role: 'admin' } },
        },
      ],
      typeFixture: `${consoleDeclaration}const fixtureTrainers = [
  { id: 'a1', name: 'Ada', wins: 3 },
  { id: 'g2', name: 'Grace', wins: 5 },
]

const fixtureById = indexBy(fixtureTrainers, 'id')
const fixtureEntry: { id: string; name: string; wins: number } | undefined =
  fixtureById['a1']
void fixtureEntry

// @ts-expect-error wins holds numbers, so it cannot serve as the index key
indexBy(fixtureTrainers, 'wins')

// @ts-expect-error a key the records do not have must be rejected
indexBy(fixtureTrainers, 'email')
`,
    },
    {
      id: 'generic-tradeoffs-review',
      kind: 'written',
      completionMode: 'submitted-with-reference-review',
      title: 'Explain when a generic earns its complexity',
      prompt:
        'A teammate opens a pull request where every helper takes a type parameter, including one whose T appears in exactly one position. In your own words, explain: what a type parameter buys that any and unknown do not, the test for whether a type parameter earns its place in a signature, when a union is the honest choice, and where overloads fit. Use one or two short signatures of your own as examples.',
      estimatedMinutes: 12,
      referenceAnswer:
        'A type parameter preserves the relationship between what a caller passes in and what comes back. any also accepts every type, but it does so by erasing the answer: the caller loses the type it had at the call site, and misuse compiles and crashes at runtime. unknown is safe but one-directional, since the result comes back unknown and every caller must re-narrow a type it already knew. Only a type parameter carries the caller\'s type through the signature, so `first<T>(items: T[]): T | undefined` gives a string[] caller back a string without a cast.\n\nThe test for whether a type parameter earns its place: it must appear in at least two positions of the signature, linking them, or be tied to another parameter through a constraint such as `K extends keyof T`. A parameter used once links nothing. `describe<T extends { length: number }>(value: T): string` says exactly the same thing as `describe(value: { length: number }): string`, with one more name for the reader to track, so the single-use parameter should be replaced by its constraint.\n\nA union is the honest choice when the set of acceptable types is closed and the output does not depend on which member arrived. `formatId(id: string | number): string` promises exactly that; writing it as `<T extends string | number>` hints at an input-output link that does not exist. Overloads are for the rare case where a small fixed set of input types each produce genuinely different output types and no single generic signature can express the pairing, for example a lookup that returns one shape for a single key and another for an array of keys. The implementation behind overloads is checked loosely, so they come last. The practical order is: plain types, then a union, then a generic once something in the output truly depends on something in the input.',
      rubric: [
        {
          id: 'preserves-relationship',
          label: 'What generics buy',
          description:
            'Explains that a type parameter preserves the caller\'s type through the signature, where any erases it and unknown forces re-narrowing.',
        },
        {
          id: 'two-position-test',
          label: 'Earning the parameter',
          description:
            'States the test that a type parameter must link at least two positions, or be tied to another parameter by a constraint, and applies it to a concrete signature.',
        },
        {
          id: 'honest-alternatives',
          label: 'Unions and overloads',
          description:
            'Identifies when a closed union is more honest than a generic, and reserves overloads for fixed input-output pairings a single signature cannot express.',
        },
      ],
    },
  ],
  approaches: {
    'generic-first-or-default': [
      {
        name: 'One type parameter linking all three positions',
        code: `export function firstOrDefault<T>(items: T[], fallback: T): T {
  // Check length rather than using || or ??, so falsy and null
  // first items are still returned instead of the fallback.
  return items.length > 0 ? items[0] : fallback
}`,
        explanation:
          'The body never changes; the refactor is entirely in the signature. Declaring T once and using it for the elements, the fallback, and the result makes every call site self-checking: TypeScript infers T from the array, and a fallback of another type fails to compile, which is exactly the mismatch the any version waved through. Note that the length check is load-bearing at runtime. Writing `items[0] ?? fallback` would wrongly replace a null first item, and `items[0] || fallback` would replace 0 and false too.',
        complexity:
          'O(1) time and space. The guarantee is at the type level: input, fallback, and result share one inferred type per call site.',
      },
    ],
    'generic-pluck': [
      {
        name: 'keyof constraint with an indexed-access result',
        code: `export function pluck<T, K extends keyof T>(items: T[], key: K): Array<T[K]> {
  // K is proven to be a real property name of T, so item[key]
  // needs no runtime existence check and no cast.
  return items.map((item) => item[key])
}`,
        explanation:
          'T captures the record shape from the first argument, keyof T lists its legal property names, and the constraint holds K inside that list, so a misspelled or missing key is a compile error at the call site. The result type Array<T[K]> reads the property\'s type back out: plucking wins from records with a numeric wins gives number[], plucking name gives string[]. Typing key as string instead would accept any string and force the result down to unknown[], which is the starter\'s exact problem.',
        complexity: 'O(n) time and O(n) space for n records.',
      },
    ],
    'generic-index-by': [
      {
        name: 'Constraint tying the key to its value type',
        code: `export function indexBy<K extends string, T extends Record<K, string>>(
  items: T[],
  key: K,
): Record<string, T> {
  const lookup: Record<string, T> = {}

  for (const item of items) {
    // item[key] is typed string by the constraint, so it can serve
    // as an object key. Later records overwrite earlier ones.
    lookup[item[key]] = item
  }

  return lookup
}`,
        explanation:
          'The interesting decision is the constraint T extends Record<K, string>, which ties the two parameters together: whatever property K names, its values must be strings, because they become the lookup\'s keys. That is why indexing the numeric wins property fails to compile instead of producing surprise stringified keys. K extends keyof T cannot express this, since it restricts which properties exist but says nothing about their value types. The result Record<string, T> keeps the caller\'s full record type, so reads off the lookup need no casting. The overwrite rule for duplicate key values is deliberate and documented in the prompt, keeping the behavior deterministic.',
        complexity: 'O(n) time and O(n) space for n records.',
      },
    ],
  },
}
