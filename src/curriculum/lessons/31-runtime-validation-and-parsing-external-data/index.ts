import Concept from './concept.mdx'

import type { Lesson } from '../../types'

// The type grader compiles submissions with the ES lib chain only (no DOM),
// so `console` is not declared there. Each fixture opens with this shim so
// the starter's sample console.log call type-checks. See src/runtime/typeWorker.ts.
const consoleShim =
  'declare const console: { log: (...values: unknown[]) => void }\n'

export const lesson: Lesson = {
  slug: 'runtime-validation-and-parsing-external-data',
  title: 'Runtime Validation and Parsing External Data',
  summary: 'Validate untrusted inputs and bridge runtime data with static types.',
  track: 'js-ts-core',
  order: 31,
  concept: Concept,
  problems: [
    {
      id: 'profile-type-predicate',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Prove an unknown value is a profile',
      prompt:
        "isProfile receives a value of type unknown, fresh from a JSON boundary, and must decide whether it is a Profile: an object with a string `name` and a `savedArticles` array containing only numbers. First, change the return type into a type predicate, `value is Profile`, so a true result narrows the value for the caller. Then build the check as a ladder: object but not null, each field present, each field the right type, and every element of the array a number. Extra fields are fine; a wrong or missing field is not. This problem is graded on malformed runtime values as well as by the compiler. Example: `isProfile({ name: 'Ada', savedArticles: [1, 2] })` returns `true`, and `isProfile({ name: 'Ada', savedArticles: 'none' })` returns `false`.",
      estimatedMinutes: 15,
      functionName: 'isProfile',
      starter: `export type Profile = {
  name: string
  savedArticles: number[]
}

// Turn the return type into a type predicate, then prove every field.
export function isProfile(value: unknown): boolean {
  return false
}

console.log(isProfile({ name: 'Ada', savedArticles: [1, 2] }))
`,
      typeFixture: `${consoleShim}
declare const incoming: unknown

// @ts-expect-error unknown cannot be read until a check proves the shape
incoming.name

if (isProfile(incoming)) {
  const name: string = incoming.name
  const savedCount: number = incoming.savedArticles.length
  void name
  void savedCount
}

// @ts-expect-error outside the guarded branch the value is still unknown
incoming.savedArticles
`,
      tests: [
        {
          name: 'accepts a well-formed profile',
          args: [{ name: 'Ada', savedArticles: [1, 2] }],
          expected: true,
        },
        {
          name: 'accepts an empty article list',
          args: [{ name: 'Ada', savedArticles: [] }],
          expected: true,
        },
        {
          name: 'rejects a missing article list',
          args: [{ name: 'Ada' }],
          expected: false,
        },
        {
          name: 'rejects a numeric name',
          args: [{ name: 42, savedArticles: [1] }],
          expected: false,
        },
        {
          name: 'rejects a string where the array belongs',
          args: [{ name: 'Ada', savedArticles: 'none' }],
          expected: false,
        },
        {
          name: 'rejects a string hiding inside the array',
          args: [{ name: 'Ada', savedArticles: [1, '2'] }],
          expected: false,
        },
        { name: 'rejects null', args: [null], expected: false },
        { name: 'rejects a bare array', args: [[]], expected: false },
        {
          name: 'allows extra fields it did not check',
          args: [{ name: 'Ada', savedArticles: [1], theme: 'dark' }],
          expected: true,
        },
      ],
    },
    {
      id: 'parse-profile-boundary',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Parse a profile at the boundary',
      prompt:
        'parseProfile is the one door through which stored profile JSON enters the app. Change its return type to `Profile | null` and implement it to absorb every failure the boundary can produce: text that is not JSON at all (JSON.parse throws, so catch it), JSON of the wrong shape, and JSON null. When the parsed value is an object with a string `name` and a numbers-only `savedArticles` array, return the parsed value itself, typed by your checks rather than by a cast; otherwise return null. Fields you did not check pass through unchanged. This problem is graded on malformed runtime inputs as well as by the compiler. Example: `parseProfile(\'{"name":"Ada","savedArticles":[1,2]}\')` returns `{ name: \'Ada\', savedArticles: [1, 2] }`, and `parseProfile(\'not json\')` returns `null`.',
      estimatedMinutes: 15,
      functionName: 'parseProfile',
      starter: `export type Profile = {
  name: string
  savedArticles: number[]
}

// Return Profile | null: null for malformed JSON and mismatched shapes.
export function parseProfile(raw: string): Profile {
  return JSON.parse(raw) as Profile
}

console.log(parseProfile('{"name":"Ada","savedArticles":[1,2]}'))
`,
      typeFixture: `${consoleShim}
const parsed = parseProfile('{"name":"Ada","savedArticles":[1,2]}')

// @ts-expect-error the result may be null and must be narrowed first
const firstName: string = parsed.name
void firstName

if (parsed !== null) {
  const ids: number[] = parsed.savedArticles
  void ids
}

// @ts-expect-error a raw JSON string is not a parsed Profile
const direct: Profile = '{"name":"Ada","savedArticles":[1,2]}'
void direct
`,
      tests: [
        {
          name: 'parses a well-formed profile',
          args: ['{"name":"Ada","savedArticles":[1,2]}'],
          expected: { name: 'Ada', savedArticles: [1, 2] },
        },
        {
          name: 'absorbs text that is not JSON',
          args: ['not json'],
          expected: null,
        },
        { name: 'absorbs the empty string', args: [''], expected: null },
        {
          name: 'rejects the wrong shape from the opening bug',
          args: ['{"name":"Ada","savedArticles":"none"}'],
          expected: null,
        },
        {
          name: 'rejects a JSON string payload',
          args: ['"Ada"'],
          expected: null,
        },
        { name: 'rejects JSON null', args: ['null'], expected: null },
        {
          name: 'keeps extra fields it did not check',
          args: ['{"name":"Ada","savedArticles":[1],"theme":"dark"}'],
          expected: { name: 'Ada', savedArticles: [1], theme: 'dark' },
        },
      ],
    },
    {
      id: 'restore-cart-without-casts',
      kind: 'refactor',
      completionMode: 'tests-and-static-checks-pass',
      title: 'Replace the cart cast with checked parsing',
      prompt:
        'restoreCart reads a saved shopping cart back from storage, and today it is one cast deep: whatever the storage held becomes a SavedCart by assertion, so a corrupted or outdated payload crashes far from here. Refactor it to parse instead of claim. Change the return type to `SavedCart | null`, catch the throw from JSON.parse, and check the whole shape: an object whose `items` is an array of `{ sku: string; quantity: number }` entries and whose `couponCode` is a string or null. Build the returned items list from entries a type predicate has checked, use no type assertions anywhere, and return null the moment any check fails. This problem is graded on malformed runtime inputs as well as by the compiler. Example: `restoreCart(\'{"items":[{"sku":"sku_1","quantity":2}],"couponCode":null}\')` returns `{ items: [{ sku: \'sku_1\', quantity: 2 }], couponCode: null }`, and `restoreCart(\'garbage\')` returns `null`.',
      estimatedMinutes: 20,
      functionName: 'restoreCart',
      originalCode: `export type SavedCart = {
  items: { sku: string; quantity: number }[]
  couponCode: string | null
}

// Trusts whatever the storage held. The cast claims; nothing checks.
export function restoreCart(raw: string): SavedCart {
  return JSON.parse(raw) as SavedCart
}

console.log(
  restoreCart('{"items":[{"sku":"sku_1","quantity":2}],"couponCode":null}'),
)
`,
      starter: `export type SavedCart = {
  items: { sku: string; quantity: number }[]
  couponCode: string | null
}

// Trusts whatever the storage held. The cast claims; nothing checks.
export function restoreCart(raw: string): SavedCart {
  return JSON.parse(raw) as SavedCart
}

console.log(
  restoreCart('{"items":[{"sku":"sku_1","quantity":2}],"couponCode":null}'),
)
`,
      goals: [
        'Return SavedCart | null, with null covering malformed JSON, a non-object payload, missing fields, bad item entries, and a mistyped coupon code.',
        'Treat the parsed value as unknown and narrow it with runtime checks; no type assertion anywhere in the file.',
        'Validate each item with a type predicate and build the returned list from checked entries, so the result is constructed rather than claimed.',
      ],
      staticChecks: [
        {
          kind: 'forbid-text',
          text: ' as ',
          message:
            'No type assertions. Prove the shape with runtime checks instead of claiming it.',
        },
        {
          kind: 'require-text',
          text: 'unknown',
          message:
            'Hold the parsed value as unknown until your checks narrow it.',
        },
        {
          kind: 'require-text',
          text: 'try',
          message:
            'JSON.parse throws on malformed text; the boundary must catch it.',
        },
        {
          kind: 'no-any',
          message:
            'Keep the boundary honest. An any would let unchecked data flow inward.',
        },
      ],
      typeFixture: `${consoleShim}
const restored = restoreCart('{"items":[],"couponCode":null}')

// @ts-expect-error the result may be null and must be narrowed before use
const itemCount: number = restored.items.length
void itemCount

if (restored !== null) {
  const coupon: string | null = restored.couponCode
  void coupon
}

// @ts-expect-error a possibly-null cart is not a SavedCart
const direct: SavedCart = restoreCart('{"items":[],"couponCode":null}')
void direct
`,
      tests: [
        {
          name: 'restores a cart with one item',
          args: ['{"items":[{"sku":"sku_1","quantity":2}],"couponCode":null}'],
          expected: {
            items: [{ sku: 'sku_1', quantity: 2 }],
            couponCode: null,
          },
        },
        {
          name: 'restores a cart with a coupon',
          args: [
            '{"items":[{"sku":"sku_1","quantity":2}],"couponCode":"SAVE10"}',
          ],
          expected: {
            items: [{ sku: 'sku_1', quantity: 2 }],
            couponCode: 'SAVE10',
          },
        },
        {
          name: 'absorbs text that is not JSON',
          args: ['garbage'],
          expected: null,
        },
        {
          name: 'rejects a payload that is an array, not a cart',
          args: ['[]'],
          expected: null,
        },
        {
          name: 'rejects a cart missing its coupon field',
          args: ['{"items":[]}'],
          expected: null,
        },
        {
          name: 'rejects an item with a string quantity',
          args: ['{"items":[{"sku":"sku_1","quantity":"2"}],"couponCode":null}'],
          expected: null,
        },
        {
          name: 'rejects a numeric coupon code',
          args: ['{"items":[],"couponCode":10}'],
          expected: null,
        },
        {
          name: 'restores an empty cart',
          args: ['{"items":[],"couponCode":null}'],
          expected: { items: [], couponCode: null },
        },
      ],
    },
    {
      id: 'boundary-validation-review',
      kind: 'written',
      completionMode: 'submitted-with-reference-review',
      title: 'Explain why the boundary needs running code',
      prompt:
        'A teammate defends a `JSON.parse(response) as OrderList` cast in a fetch wrapper: "We wrote the server. The shape is guaranteed, and a validator is just the type system\'s job done twice." In your own words, respond. Explain: why compile-time types cannot secure data that arrives at runtime no matter who wrote the sender, what a type predicate adds over a boolean check and what obligation its signature creates, what parse-don\'t-validate changes about where proof lives, and where you would place the one parse in an app so the interior never re-checks. Finish with the strongest version of your teammate\'s point you agree with. Use a short example of your own.',
      estimatedMinutes: 12,
      referenceAnswer:
        "Owning the server does not put the server's output inside the compiler's view. TypeScript checks one program's source at compile time; the bytes that arrive in a response exist only at runtime, produced by whatever version of the sender is deployed, transformed by whatever sits between, read from whatever a user's disk still holds. The cast does not bridge that gap, it papers over it: `as OrderList` tells the compiler to stop watching precisely where nothing else is watching either. When the shapes disagree — an old cached payload, a migration that renamed a field, a partial deploy — the failure is a TypeError deep in rendering code, far from the fetch, with a stack trace pointing at the wrong place. The guarantee my teammate is citing is real, but it is an operational guarantee about deployment discipline, and the type system cannot see it.\n\nA boolean check alone does not close the gap either, because its knowledge stays at runtime. `looksLikeOrderList(data)` returning true convinces me, not the compiler, and the next line still needs a cast to proceed. A type predicate — `value is OrderList` — is the piece that carries runtime evidence into the type system: in the true branch the value simply is an OrderList, no assertion needed. The signature also creates a real obligation, since the compiler believes it unconditionally. A predicate whose body checks half the fields is a cast with better manners, so the checks must cover exactly what the signature claims, including element-by-element checks inside arrays, which is where hand-rolled validators most often go soft.\n\nParse-don't-validate moves the proof into the value itself. Instead of asking \"is this valid?\" somewhere and hoping every path asked first, the boundary function returns `OrderList | null`: possession of an OrderList is the proof, and the null forces every caller to face the failure case where it can still be handled sensibly. That is last lesson's smart constructor standing at the app's outer door. And it should stand there once: in the fetch wrapper or storage reader where bytes enter, so everything inward receives typed, examined values and never re-suspects them. Guards sprinkled through the interior mean no layer trusts the last one, which is the defensive re-checking typed signatures exist to end.\n\nThe strongest version of the point I agree with: the validator must not become a second, drifting copy of the type. If OrderList changes and the hand-written predicate lags, we have rebuilt lesson 28's copy-drift bug with extra steps. That argues for deriving the two from one definition — a schema library like Zod generates the checks and infers the type from one source — or at minimum keeping the predicate beside the type it proves. It does not argue for the cast, which is agreeing to check nothing.",
      rubric: [
        {
          id: 'runtime-gap',
          label: 'Why the cast cannot work',
          description:
            'Explains that compile-time checking cannot observe runtime bytes regardless of who wrote the sender, and that the cast disables scrutiny exactly where none exists, moving failures far from the boundary.',
        },
        {
          id: 'predicate-obligation',
          label: 'What a predicate adds and owes',
          description:
            'Distinguishes a type predicate from a boolean check by the narrowing it carries into the type system, and names the obligation that the body must fully cover what the signature claims.',
        },
        {
          id: 'parse-dont-validate',
          label: 'Where proof lives',
          description:
            'Explains returning the typed value or null from one boundary function so possession proves parsing, with callers forced to handle failure, placed once at the edge rather than re-checked in the interior.',
        },
        {
          id: 'steelman',
          label: 'The point worth conceding',
          description:
            'Concedes a defensible version of the objection, such as validator drift arguing for a single source of truth, without conceding the cast itself.',
        },
      ],
    },
  ],
  approaches: {
    'profile-type-predicate': [
      {
        name: 'A ladder of narrowing checks',
        code: `export type Profile = {
  name: string
  savedArticles: number[]
}

export function isProfile(value: unknown): value is Profile {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    typeof value.name === 'string' &&
    'savedArticles' in value &&
    Array.isArray(value.savedArticles) &&
    value.savedArticles.every((entry) => typeof entry === 'number')
  )
}`,
        explanation:
          "Every clause stands on the one before it, which is what makes the single && chain legal as well as correct. The object check must precede the null check's partner because typeof null is 'object'; the in checks must precede the field reads because unknown permits no property access; and each typeof pins a field the in check only proved present. The array gets the same two-step with Array.isArray, and then the check most hand-rolled guards skip: every walks the elements, which is the line that catches [1, '2']. Extra fields pass untouched because no clause asks about them, matching structural typing. The signature is the contract to respect here: the compiler believes value is Profile wherever this returns true, so the body must earn exactly that, no less.",
        complexity:
          'O(n) time in the article count for the element walk, O(1) space.',
      },
    ],
    'parse-profile-boundary': [
      {
        name: 'Catch, check, and return the narrowed value',
        code: `export type Profile = {
  name: string
  savedArticles: number[]
}

function isProfile(value: unknown): value is Profile {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    typeof value.name === 'string' &&
    'savedArticles' in value &&
    Array.isArray(value.savedArticles) &&
    value.savedArticles.every((entry) => typeof entry === 'number')
  )
}

export function parseProfile(raw: string): Profile | null {
  // JSON.parse throws on malformed text; the boundary absorbs that too.
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }

  // The predicate narrows parsed, so the typed value is returned, not a claim.
  return isProfile(parsed) ? parsed : null
}`,
        explanation:
          "The function absorbs the boundary's three failure modes in order of when they can strike. Malformed text never reaches the shape check because JSON.parse throws first, and the try/catch converts that throw into the same null every other failure produces, so callers face one failure channel instead of two. Typing parsed as unknown is what keeps the middle honest: nothing can be read from it until the predicate has spoken. The last line is the parse-don't-validate move in miniature. Inside the ternary's true branch the predicate has already narrowed parsed to Profile, so the value returns carrying its proof, and no cast appears in the file. JSON null falls out for free, since null fails the predicate's object-and-not-null rungs.",
        complexity:
          'O(n) time in the input length for the parse plus the element walk, O(n) space for the parsed structure.',
      },
    ],
    'restore-cart-without-casts': [
      {
        name: 'Guard the entries, build the result',
        code: `export type SavedCart = {
  items: { sku: string; quantity: number }[]
  couponCode: string | null
}

function isCartItem(value: unknown): value is SavedCart['items'][number] {
  return (
    typeof value === 'object' &&
    value !== null &&
    'sku' in value &&
    typeof value.sku === 'string' &&
    'quantity' in value &&
    typeof value.quantity === 'number'
  )
}

export function restoreCart(raw: string): SavedCart | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return null
  }
  if (!('items' in parsed) || !('couponCode' in parsed)) {
    return null
  }

  const { items, couponCode } = parsed
  if (!Array.isArray(items)) {
    return null
  }

  // Rebuild the list from checked entries so the result is constructed,
  // not claimed.
  const checkedItems: SavedCart['items'] = []
  for (const item of items) {
    if (!isCartItem(item)) {
      return null
    }
    checkedItems.push(item)
  }

  if (typeof couponCode !== 'string' && couponCode !== null) {
    return null
  }

  return { items: checkedItems, couponCode }
}

console.log(
  restoreCart('{"items":[{"sku":"sku_1","quantity":2}],"couponCode":null}'),
)
`,
        explanation:
          "The refactor turns one line of trust into a sequence of small proofs, each ending in the same null so every corruption looks identical to callers. The early returns walk the ladder from the lesson: object, not null, fields present, then the destructure that gives the two fields as unknowns to examine separately. The item loop is where construction replaces assertion. Each element passes through the isCartItem predicate before entering checkedItems, so the array in the result is built from values the program examined, and a single bad entry rejects the whole cart rather than smuggling itself through. The couponCode check mirrors its union: string or null, nothing else. No cast appears anywhere, which the static checks enforce; the compiler accepts the final object because every piece was narrowed on the way in, and that is the difference between a shape the program proved and a shape the old code merely announced.",
        complexity:
          'O(n) time in the payload size for the parse and the item walk, O(n) space for the rebuilt list.',
      },
    ],
  },
}
