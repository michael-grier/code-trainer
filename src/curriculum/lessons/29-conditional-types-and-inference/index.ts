import Concept from './concept.mdx'

import type { Lesson } from '../../types'

// The type grader compiles submissions with the ES lib chain only (no DOM),
// so `console` is not declared there. Each fixture opens with this shim so
// the starter's sample console.log call type-checks. See src/runtime/typeWorker.ts.
const consoleShim =
  'declare const console: { log: (...values: unknown[]) => void }\n'

export const lesson: Lesson = {
  slug: 'conditional-types-and-inference',
  title: 'Conditional Types and Inference',
  summary:
    'Use conditional types and inferred positions to express advanced type relationships.',
  track: 'js-ts-core',
  order: 29,
  concept: Concept,
  problems: [
    {
      id: 'unwrap-array-value',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Unwrap one array layer with a conditional type',
      prompt:
        "unwrapValue accepts either a plain value or an array of values and hands back a single value: the first element of an array, or a non-array input unchanged. Its return type is the placeholder alias `Unwrapped<T>`, which currently changes nothing, so callers who pass an array get an array-typed result back. Rewrite `Unwrapped` as a conditional type using `infer`: an array type resolves to its element type, one layer only, and any other type passes through unchanged. Then finish unwrapValue to match. Arrays are assumed non-empty. Hidden type tests compile beneath your submission: `unwrapValue([3, 4, 5])` must be a number, `unwrapValue('solo')` a string, and a nested array must unwrap exactly one layer. Example: `unwrapValue([3, 4, 5])` returns `3`, and `unwrapValue('solo')` returns `'solo'`.",
      estimatedMinutes: 12,
      functionName: 'unwrapValue',
      starter: `// Rewrite Unwrapped as a conditional type that unwraps one array layer.
export type Unwrapped<T> = T

export function unwrapValue<T>(value: T): Unwrapped<T> {
  return value as Unwrapped<T>
}

console.log(unwrapValue([3, 4, 5]))
`,
      typeFixture: `${consoleShim}
const fromArray: number = unwrapValue([3, 4, 5])
const fromPlain: string = unwrapValue('solo')
const oneLayerOnly: boolean[] = unwrapValue([[true, false], [false]])
void fromArray
void fromPlain
void oneLayerOnly

// @ts-expect-error a string array unwraps to string, not number
const wrongElement: number = unwrapValue(['a', 'b'])
void wrongElement

// @ts-expect-error a plain number stays a number, not an array
const stillPlain: number[] = unwrapValue(5)
void stillPlain
`,
      tests: [
        { name: 'takes the first element of an array', args: [[3, 4, 5]], expected: 3 },
        { name: 'passes a plain string through', args: ['solo'], expected: 'solo' },
        {
          name: 'unwraps a nested array one layer only',
          args: [[['a'], ['b', 'c']]],
          expected: ['a'],
        },
        { name: 'unwraps a single-element array', args: [[7]], expected: 7 },
        { name: 'passes a plain boolean through', args: [false], expected: false },
        { name: 'keeps a falsy first element', args: [[0, 1]], expected: 0 },
        { name: 'passes null through', args: [null], expected: null },
      ],
    },
    {
      id: 'without-channels',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Build the union filter that distribution powers',
      prompt:
        "Notification channels form the union `Channel`. withoutChannels returns the channels that remain after banning some, and its return type should say exactly which members can still appear, which is what the placeholder alias `Without<T, U>` fails to do. Rewrite `Without` yourself as the distributive conditional from the lesson, mapping banned members to `never` so they vanish from the union; do not reach for the built-in Exclude. Then implement the function to filter in input order. Hidden type tests require that `withoutChannels(['email', 'sms', 'webhook', 'push'], ['webhook'])` have the type `Array<'email' | 'sms' | 'push'>` and that `'webhook'` be unassignable to `Without<Channel, 'webhook'>`. Example: `withoutChannels(['email', 'sms', 'webhook', 'push'], ['webhook'])` returns `['email', 'sms', 'push']`.",
      estimatedMinutes: 15,
      functionName: 'withoutChannels',
      starter: `export type Channel = 'email' | 'sms' | 'webhook' | 'push'

// Rewrite Without as a conditional type that removes U's members from T.
export type Without<T, U> = T

export function withoutChannels<Banned extends Channel>(
  channels: readonly Channel[],
  banned: readonly Banned[],
): Array<Without<Channel, Banned>> {
  return []
}

console.log(withoutChannels(['email', 'sms', 'webhook', 'push'], ['webhook']))
`,
      typeFixture: `${consoleShim}
const kept: Without<Channel, 'webhook'> = 'email'
void kept

const remaining: Array<'email' | 'sms' | 'push'> = withoutChannels(
  ['email', 'sms', 'webhook', 'push'],
  ['webhook'],
)
void remaining

const twoBanned: Array<'email' | 'push'> = withoutChannels(
  ['email', 'push'],
  ['sms', 'webhook'],
)
void twoBanned

// @ts-expect-error the banned member is removed from the result type
const removed: Without<Channel, 'webhook'> = 'webhook'
void removed

// @ts-expect-error only channels can be banned
withoutChannels(['email'], ['fax'])
`,
      tests: [
        {
          name: 'removes one banned channel',
          args: [['email', 'sms', 'webhook', 'push'], ['webhook']],
          expected: ['email', 'sms', 'push'],
        },
        {
          name: 'removes two banned channels',
          args: [['email', 'push'], ['sms', 'webhook']],
          expected: ['email', 'push'],
        },
        {
          name: 'removes every occurrence of a banned channel',
          args: [['email', 'email', 'sms'], ['email']],
          expected: ['sms'],
        },
        { name: 'empty input stays empty', args: [[], ['webhook']], expected: [] },
        {
          name: 'banning everything present leaves nothing',
          args: [['webhook', 'webhook'], ['webhook']],
          expected: [],
        },
        {
          name: 'banning nothing keeps the input',
          args: [['email', 'sms'], []],
          expected: ['email', 'sms'],
        },
      ],
    },
    {
      id: 'derive-searchable-keys',
      kind: 'refactor',
      completionMode: 'tests-and-static-checks-pass',
      title: 'Derive the searchable keys from the record',
      prompt:
        "searchOrders filters orders by running a substring match on one field, so only string-valued fields make sense to search. The allowed keys are currently a hand-picked union: nothing ties `'id' | 'customer'` to Order, so a string field added to Order stays unsearchable and a renamed one leaves this union compiling and stale. Refactor `SearchableKey` into a derivation: write a mapped type whose `as` clause keeps a key when its value type extends string and renames it to `never` otherwise, then take `keyof` the result. Keep searchOrders' behavior exactly as it is: case-sensitive substring matching, input order preserved. Example: `searchOrders(orders, 'customer', 'Ada')` returns every order whose customer name contains `'Ada'`.",
      estimatedMinutes: 18,
      functionName: 'searchOrders',
      originalCode: `type Order = {
  id: string
  customer: string
  itemCount: number
  totalCents: number
}

// Hand-picked list of Order's string-valued keys. Nothing ties it to Order.
type SearchableKey = 'id' | 'customer'

export function searchOrders(
  orders: Order[],
  key: SearchableKey,
  query: string,
): Order[] {
  return orders.filter((order) => order[key].includes(query))
}

console.log(
  searchOrders(
    [
      { id: 'ord_1', customer: 'Ada Lovelace', itemCount: 3, totalCents: 4200 },
      { id: 'ord_2', customer: 'Grace Hopper', itemCount: 1, totalCents: 900 },
    ],
    'customer',
    'Ada',
  ),
)
`,
      starter: `type Order = {
  id: string
  customer: string
  itemCount: number
  totalCents: number
}

// Hand-picked list of Order's string-valued keys. Nothing ties it to Order.
type SearchableKey = 'id' | 'customer'

export function searchOrders(
  orders: Order[],
  key: SearchableKey,
  query: string,
): Order[] {
  return orders.filter((order) => order[key].includes(query))
}

console.log(
  searchOrders(
    [
      { id: 'ord_1', customer: 'Ada Lovelace', itemCount: 3, totalCents: 4200 },
      { id: 'ord_2', customer: 'Grace Hopper', itemCount: 1, totalCents: 900 },
    ],
    'customer',
    'Ada',
  ),
)
`,
      goals: [
        'Derive SearchableKey from Order with a key-remapping mapped type whose as clause maps non-string-valued keys to never.',
        'Keep the runtime behavior identical: case-sensitive substring match on the chosen field, input order preserved.',
        'After the refactor, a string field added to Order becomes searchable with no further edits, and a rename in Order breaks stale call sites at compile time.',
      ],
      staticChecks: [
        {
          kind: 'require-text',
          text: 'never',
          message:
            'Filter keys by renaming the rejected ones to never in the as clause.',
        },
        {
          kind: 'require-text',
          text: 'extends string',
          message:
            'Test each value type with a conditional: keep the key when T[K] extends string.',
        },
        {
          kind: 'forbid-text',
          text: "'id' | 'customer'",
          message:
            'Derive the searchable keys from Order instead of hand-listing them.',
        },
        {
          kind: 'no-any',
          message:
            'Keep the key types precise. An any would let unsearchable fields through.',
        },
      ],
      typeFixture: `${consoleShim}
const byId: SearchableKey = 'id'
const byCustomer: SearchableKey = 'customer'
void byId
void byCustomer

const found: Order[] = searchOrders(
  [{ id: 'ord_1', customer: 'Ada Lovelace', itemCount: 3, totalCents: 4200 }],
  'id',
  'ord',
)
void found

// @ts-expect-error number-valued keys cannot be searched with a string query
searchOrders([], 'itemCount', '3')

// @ts-expect-error keys that Order does not have are rejected
searchOrders([], 'notes', 'gift')
`,
      tests: [
        {
          name: 'matches a customer substring across orders',
          args: [
            [
              { id: 'ord_1', customer: 'Ada Lovelace', itemCount: 3, totalCents: 4200 },
              { id: 'ord_2', customer: 'Grace Hopper', itemCount: 1, totalCents: 900 },
              { id: 'ord_3', customer: 'Adaline Weber', itemCount: 2, totalCents: 1500 },
            ],
            'customer',
            'Ada',
          ],
          expected: [
            { id: 'ord_1', customer: 'Ada Lovelace', itemCount: 3, totalCents: 4200 },
            { id: 'ord_3', customer: 'Adaline Weber', itemCount: 2, totalCents: 1500 },
          ],
        },
        {
          name: 'matches an exact id',
          args: [
            [
              { id: 'ord_1', customer: 'Ada Lovelace', itemCount: 3, totalCents: 4200 },
              { id: 'ord_2', customer: 'Grace Hopper', itemCount: 1, totalCents: 900 },
            ],
            'id',
            'ord_2',
          ],
          expected: [
            { id: 'ord_2', customer: 'Grace Hopper', itemCount: 1, totalCents: 900 },
          ],
        },
        {
          name: 'stays case-sensitive',
          args: [
            [
              { id: 'ord_1', customer: 'Ada Lovelace', itemCount: 3, totalCents: 4200 },
            ],
            'customer',
            'ada',
          ],
          expected: [],
        },
        {
          name: 'an empty query matches every order',
          args: [
            [
              { id: 'ord_1', customer: 'Ada Lovelace', itemCount: 3, totalCents: 4200 },
              { id: 'ord_2', customer: 'Grace Hopper', itemCount: 1, totalCents: 900 },
            ],
            'id',
            '',
          ],
          expected: [
            { id: 'ord_1', customer: 'Ada Lovelace', itemCount: 3, totalCents: 4200 },
            { id: 'ord_2', customer: 'Grace Hopper', itemCount: 1, totalCents: 900 },
          ],
        },
        {
          name: 'an empty order list returns empty',
          args: [[], 'customer', 'Ada'],
          expected: [],
        },
      ],
    },
    {
      id: 'conditional-types-review',
      kind: 'written',
      completionMode: 'submitted-with-reference-review',
      title: 'Explain distribution and deriving through functions',
      prompt:
        "A teammate's pull request hand-writes the result type of an async loader as a copy of its payload, and hand-prunes a status union into a second, shorter union a few lines below the first. Asked about it, they say conditional types are unreadable magic. In your own words, explain: why the hand-written copies compile today and how each one fails later, what `Awaited<ReturnType<typeof fn>>` computes and why it cannot fall behind, how a distributive conditional like `Exclude` processes a union member by member including where the removed members go, and one situation where you would side with your teammate and keep a hand-written type. Use a short example of your own.",
      estimatedMinutes: 10,
      referenceAnswer:
        "The copies compile because nothing contradicts them yet. A hand-written result type is a second description of the same payload, consistent with itself, and the compiler only compares it against the function at seams; optional fields and extra properties on values passed through variables can keep those seams quiet. So the loader's payload can gain or rename a field while the copy stays behind, still compiling, and the failure shows up at runtime as an undefined read far from the cause. The pruned union fails the other way: when the source union gains a member, the pruned copy silently keeps excluding decisions made against last month's members.\n\n`Awaited<ReturnType<typeof fn>>` replaces the first copy with a computation. `typeof fn` is the function's type; `ReturnType` is a conditional type that asks whether that type matches `(...args) => infer R` and captures the return position as R; `Awaited` asks whether R matches `Promise<infer U>` and captures the payload. Because the compiler recomputes the answer from the function every time it checks the code, the derived type cannot fall behind: change the payload and every stale read fails to compile at the exact line to fix.\n\nDistribution is what makes `Exclude<T, U>`, which is just `T extends U ? never : T`, act as a filter. When the tested type is a bare type parameter holding a union, the compiler runs the conditional once per member and unions the results. For `Exclude<'draft' | 'sent' | 'paid', 'draft'>` it asks three times: 'draft' matches U and becomes never, 'sent' and 'paid' do not and pass through. The removed member does not linger as some placeholder; never is the type with no values, so it vanishes when the results are joined, leaving `'sent' | 'paid'`. That is also the behavior to watch for when you did not want it: to test a union as one whole, wrap both sides in tuples, `[T] extends [U]`.\n\nI would side with my teammate at an ownership boundary. `ReturnType` pointed at a third-party client's function welds their release schedule into my contracts: their rename becomes my breaking change, silently. There, the right move is a hand-declared type and an explicit conversion at the boundary, the same one-source-of-truth test as lesson 28: derive within one source of truth, declare and convert across two.",
      rubric: [
        {
          id: 'silent-drift',
          label: 'Why copies fail silently',
          description:
            'Explains that hand-written copies are internally consistent and only checked at seams, so a source change leaves them compiling while behavior breaks at runtime.',
        },
        {
          id: 'derivation-mechanics',
          label: 'What the derivation computes',
          description:
            'Walks Awaited<ReturnType<typeof fn>> as two conditional matches with infer captures, and explains that recomputation is what prevents drift.',
        },
        {
          id: 'distribution',
          label: 'Distribution member by member',
          description:
            'Describes the per-member evaluation of a distributive conditional on a concrete union, including never vanishing from the joined result.',
        },
        {
          id: 'when-to-hand-write',
          label: 'When hand-writing wins',
          description:
            'Names a legitimate case for a declared type, such as an ownership boundary or a stable union, rather than treating derivation as always right.',
        },
      ],
    },
  ],
  approaches: {
    'unwrap-array-value': [
      {
        name: 'One conditional with an infer capture',
        code: `// One array layer unwraps to its element type; anything else passes through.
export type Unwrapped<T> = T extends readonly (infer Element)[] ? Element : T

export function unwrapValue<T>(value: T): Unwrapped<T> {
  // The conditional resolves per call site, so inside the function the
  // compiler cannot relate the runtime branch to it; the cast is the honest
  // bridge, local to the one line that needs it.
  return (Array.isArray(value) ? value[0] : value) as Unwrapped<T>
}`,
        explanation:
          "The alias asks one structural question: is T an array? Matching against `readonly (infer Element)[]` accepts both mutable and readonly arrays, because a mutable array is assignable to a readonly one, and captures the element type in the same motion. The fallback branch returns T unchanged, which is what makes the alias safe to apply to any input. A nested array matches the same pattern with Element captured as the inner array type, so exactly one layer comes off. The runtime body mirrors the two branches with Array.isArray, but the compiler cannot connect a runtime check to a conditional type's outcome, so the function ends in a cast: it is doing the same job the construction-site casts in lesson 28 did, asserting locally what the surrounding code proves.",
        complexity:
          'O(1) time and space. The guarantee that matters is compile-time: each call site gets the unwrapped type computed from its own argument.',
      },
    ],
    'without-channels': [
      {
        name: 'Distributive never filter with a narrowing predicate',
        code: `export type Channel = 'email' | 'sms' | 'webhook' | 'push'

// A bare T before extends distributes: each member of the union is tested
// against U on its own, and the never results vanish from the final union.
export type Without<T, U> = T extends U ? never : T

export function withoutChannels<Banned extends Channel>(
  channels: readonly Channel[],
  banned: readonly Banned[],
): Array<Without<Channel, Banned>> {
  // includes narrows nothing here; widen banned so any channel can be asked.
  const bannedList: readonly Channel[] = banned
  return channels.filter(
    (channel): channel is Without<Channel, Banned> =>
      !bannedList.includes(channel),
  )
}`,
        explanation:
          "Without is the standard library's Exclude written out. Because T stands bare before extends, `Without<Channel, 'webhook'>` runs four times, once per member: the banned member matches U and becomes never, the other three pass through, and never vanishes when the results rejoin. The runtime filter carries a type predicate on its callback so the filtered array's element type matches what the conditional computed; without it, filter would return the unfiltered Channel[]. The one wrinkle is includes: banned is typed readonly Banned[], and includes on that array only accepts Banned arguments, so the code widens banned to readonly Channel[] first, which is safe because Banned extends Channel.",
        complexity:
          'O(n * b) time for n channels and b banned entries, O(n) space for the result. Each banned check scans the banned list.',
      },
    ],
    'derive-searchable-keys': [
      {
        name: 'Key filter with as and never',
        code: `type Order = {
  id: string
  customer: string
  itemCount: number
  totalCents: number
}

// Keep the keys whose value type is string; the as clause renames every
// other key to never, which drops it from the mapped result entirely.
type StringKeys<T> = keyof {
  [K in keyof T as T[K] extends string ? K : never]: T[K]
}

// Derived from Order, so a new string field becomes searchable on its own
// and a renamed one breaks stale call sites instead of compiling around them.
type SearchableKey = StringKeys<Order>

export function searchOrders(
  orders: Order[],
  key: SearchableKey,
  query: string,
): Order[] {
  return orders.filter((order) => order[key].includes(query))
}

console.log(
  searchOrders(
    [
      { id: 'ord_1', customer: 'Ada Lovelace', itemCount: 3, totalCents: 4200 },
      { id: 'ord_2', customer: 'Grace Hopper', itemCount: 1, totalCents: 900 },
    ],
    'customer',
    'Ada',
  ),
)`,
        explanation:
          "The mapped type walks Order's keys and asks the lesson's conditional question per key: does this value type extend string? id and customer survive with their own names; itemCount and totalCents are renamed to never and dropped. keyof then reads the survivors off as the union 'id' | 'customer', which is exactly what the hand-written version said, with one difference that matters: it is recomputed from Order on every compile. The function body did not change at all, and it did not need to: order[key] indexed by the derived union is still string, so includes stays legal. The behavior tests pin the semantics the refactor must preserve, substring matching, case sensitivity, and input order.",
        complexity:
          'O(n * m) time for n orders and query length factored into each includes scan of a field of length m; O(n) space for the result.',
      },
    ],
  },
}
