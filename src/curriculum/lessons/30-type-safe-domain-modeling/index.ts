import Concept from './concept.mdx'

import type { Lesson } from '../../types'

// The type grader compiles submissions with the ES lib chain only (no DOM),
// so `console` is not declared there. Each fixture opens with this shim so
// the starter's sample console.log call type-checks. See src/runtime/typeWorker.ts.
const consoleShim =
  'declare const console: { log: (...values: unknown[]) => void }\n'

export const lesson: Lesson = {
  slug: 'type-safe-domain-modeling',
  title: 'Type-Safe Domain Modeling',
  summary: 'Represent domain rules with types that prevent invalid states.',
  track: 'js-ts-core',
  order: 30,
  concept: Concept,
  problems: [
    {
      id: 'branded-email-constructor',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Brand an email behind a validating constructor',
      prompt:
        "sendReceipt should only ever receive an email that has been validated, but Email is currently a bare alias of string, so any string reaches it. First, rebrand `Email` as a branded string type that raw strings cannot satisfy. Then implement parseEmail, the only door into the type: it returns the input as an Email when every rule passes and null otherwise. The rules: exactly one `@` with a nonempty name before it, and a domain after it containing a dot that is neither the domain's first nor last character. Hidden type tests require that a raw string and an un-narrowed `Email | null` both fail to reach sendReceipt. Example: `parseEmail('ada@example.com')` returns `'ada@example.com'`, and `parseEmail('ada@example')` returns `null`.",
      estimatedMinutes: 15,
      functionName: 'parseEmail',
      starter: `// Replace this alias with a branded email type raw strings cannot satisfy.
export type Email = string

// Return the input as a validated Email when it passes every rule, or null.
export function parseEmail(raw: string): Email | null {
  return null
}

export function sendReceipt(to: Email): string {
  return \`receipt sent to \${to}\`
}

console.log(parseEmail('ada@example.com'))
`,
      typeFixture: `${consoleShim}
const parsed = parseEmail('ada@example.com')

if (parsed !== null) {
  const receipt: string = sendReceipt(parsed)
  void receipt
}

// @ts-expect-error the parse result may be null and must be narrowed first
sendReceipt(parseEmail('ada@example.com'))

// @ts-expect-error a raw string cannot pose as a validated email
sendReceipt('ada@example.com')
`,
      tests: [
        {
          name: 'accepts a well-formed address',
          args: ['ada@example.com'],
          expected: 'ada@example.com',
        },
        {
          name: 'rejects an empty name before the @',
          args: ['@example.com'],
          expected: null,
        },
        { name: 'rejects an empty domain', args: ['ada@'], expected: null },
        {
          name: 'rejects a domain without a dot',
          args: ['ada@example'],
          expected: null,
        },
        {
          name: 'rejects a second @',
          args: ['ada@@example.com'],
          expected: null,
        },
        {
          name: 'rejects a domain starting with a dot',
          args: ['ada@.com'],
          expected: null,
        },
        {
          name: 'rejects a domain ending with a dot',
          args: ['ada@example.'],
          expected: null,
        },
        {
          name: 'accepts dots in the name and subdomains',
          args: ['ada.lovelace@mail.example.com'],
          expected: 'ada.lovelace@mail.example.com',
        },
      ],
    },
    {
      id: 'readonly-line-item',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Construct a line item that stays valid',
      prompt:
        'createLineItem builds an order line for a shop that sells whole units, between 1 and 99 per line. The current LineItem type lets any code change a constructed item afterward, so the validation the constructor will do could be undone one line later. First, mark both fields of `LineItem` readonly. Then implement createLineItem: return `{ sku, quantity }` when quantity is a whole number from 1 to 99, and null otherwise. Hidden type tests require that assigning to a constructed item\'s fields fails to compile and that the possibly-null result must be narrowed before use. Example: `createLineItem(\'sku_1\', 2)` returns `{ sku: \'sku_1\', quantity: 2 }`, and `createLineItem(\'sku_1\', 0)` returns `null`.',
      estimatedMinutes: 12,
      functionName: 'createLineItem',
      starter: `// Give LineItem readonly fields so a constructed item cannot be changed.
export type LineItem = { sku: string; quantity: number }

// Return a LineItem when quantity is a whole number from 1 to 99, or null.
export function createLineItem(
  sku: string,
  quantity: number,
): LineItem | null {
  return { sku, quantity }
}

console.log(createLineItem('sku_1', 2))
`,
      typeFixture: `${consoleShim}
const item = createLineItem('sku_1', 2)

if (item !== null) {
  const quantity: number = item.quantity
  void quantity
  // @ts-expect-error quantity cannot be reassigned after construction
  item.quantity = 5
  // @ts-expect-error sku cannot be reassigned after construction
  item.sku = 'sku_2'
}

// @ts-expect-error the result may be null and must be narrowed before use
const direct: LineItem = createLineItem('sku_9', 0)
void direct
`,
      tests: [
        {
          name: 'builds a valid line item',
          args: ['sku_1', 2],
          expected: { sku: 'sku_1', quantity: 2 },
        },
        { name: 'rejects a zero quantity', args: ['sku_1', 0], expected: null },
        {
          name: 'rejects a negative quantity',
          args: ['sku_1', -3],
          expected: null,
        },
        {
          name: 'rejects a fractional quantity',
          args: ['sku_1', 2.5],
          expected: null,
        },
        {
          name: 'rejects a quantity past the limit',
          args: ['sku_1', 100],
          expected: null,
        },
        {
          name: 'accepts the upper boundary',
          args: ['sku_1', 99],
          expected: { sku: 'sku_1', quantity: 99 },
        },
        {
          name: 'accepts the lower boundary',
          args: ['sku_1', 1],
          expected: { sku: 'sku_1', quantity: 1 },
        },
      ],
    },
    {
      id: 'brand-refund-ids',
      kind: 'refactor',
      completionMode: 'tests-and-static-checks-pass',
      title: 'Make the refund ids unswappable',
      prompt:
        "refundOrder takes an order id and a customer id, both plain strings, and its own sample call at the bottom has already swapped them without a complaint from the compiler. Refactor the ids into branded types. Define a `Brand` helper, brand `OrderId` and `CustomerId` from it, and add smart constructors `orderId` and `customerId` as the only places the raw-to-branded casts happen. Change refundOrder's signature to take the branded types, keep the returned string exactly as it is, and fix the sample call to construct its ids and pass them in the right order. Example: `refundOrder(orderId('ord_741'), customerId('cus_209'), 1500)` returns `'refund 1500 on ord_741 to customer cus_209'`.",
      estimatedMinutes: 18,
      functionName: 'refundOrder',
      originalCode: `export function refundOrder(
  orderId: string,
  customerId: string,
  amountCents: number,
): string {
  return \`refund \${amountCents} on \${orderId} to customer \${customerId}\`
}

const order = 'ord_741'
const customer = 'cus_209'

console.log(refundOrder(customer, order, 1500))
`,
      starter: `export function refundOrder(
  orderId: string,
  customerId: string,
  amountCents: number,
): string {
  return \`refund \${amountCents} on \${orderId} to customer \${customerId}\`
}

const order = 'ord_741'
const customer = 'cus_209'

console.log(refundOrder(customer, order, 1500))
`,
      goals: [
        'Define a Brand helper and brand OrderId and CustomerId from it, so the two id types are structurally distinct from each other and from string.',
        'Add smart constructors orderId and customerId, confining the raw-to-branded cast to exactly those two functions.',
        'Take the branded types in refundOrder, keep the returned string identical, and fix the swapped sample call using the constructors.',
      ],
      staticChecks: [
        {
          kind: 'require-text',
          text: 'Brand<',
          message:
            'Brand both id types from a shared Brand helper instead of aliasing string.',
        },
        {
          kind: 'require-text',
          text: 'OrderId',
          message:
            'Give the order id its own branded type named OrderId.',
        },
        {
          kind: 'forbid-text',
          text: 'orderId: string',
          message:
            "refundOrder must demand the branded OrderId, not a raw string.",
        },
        {
          kind: 'forbid-text',
          text: 'customerId: string',
          message:
            'refundOrder must demand the branded CustomerId, not a raw string.',
        },
        {
          kind: 'no-any',
          message:
            'Keep the ids precise. An any would let any value into either slot.',
        },
      ],
      typeFixture: `${consoleShim}
const fixtureOrder = orderId('ord_1')
const fixtureCustomer = customerId('cus_9')

const receipt: string = refundOrder(fixtureOrder, fixtureCustomer, 500)
void receipt

// @ts-expect-error raw strings cannot be passed where branded ids are required
refundOrder('ord_1', 'cus_9', 500)

// @ts-expect-error the customer slot rejects a raw string too
refundOrder(fixtureOrder, 'cus_9', 500)

// @ts-expect-error the two id types cannot be swapped
refundOrder(fixtureCustomer, fixtureOrder, 500)
`,
      tests: [
        {
          name: 'formats a refund receipt',
          args: ['ord_741', 'cus_209', 1500],
          expected: 'refund 1500 on ord_741 to customer cus_209',
        },
        {
          name: 'formats a zero amount',
          args: ['ord_1', 'cus_9', 0],
          expected: 'refund 0 on ord_1 to customer cus_9',
        },
        {
          name: 'keeps empty ids honest',
          args: ['', '', 25],
          expected: 'refund 25 on  to customer ',
        },
        {
          name: 'formats a large amount',
          args: ['ord_x', 'cus_x', 99999],
          expected: 'refund 99999 on ord_x to customer cus_x',
        },
        {
          name: 'formats a one-cent refund',
          args: ['ord_2', 'cus_2', 1],
          expected: 'refund 1 on ord_2 to customer cus_2',
        },
      ],
    },
    {
      id: 'domain-modeling-review',
      kind: 'written',
      completionMode: 'submitted-with-reference-review',
      title: 'Explain what branding buys and what it costs',
      prompt:
        "A teammate reviews your branded-id refactor and pushes back: \"OrderId is still just a string at runtime, so this is theater — and now every id needs a constructor call.\" In your own words, respond. Explain: what structural difference the brand creates and why a bare `type OrderId = string` alias creates none, why the cast inside a smart constructor is acceptable when scattered casts are not, how a validated-and-readonly value lets downstream code stop re-checking, and one place in a codebase where you would agree with your teammate and leave a plain string alone. Use a short example of your own.",
      estimatedMinutes: 10,
      referenceAnswer:
        "The runtime observation is correct and beside the point. An OrderId is a plain string in the emitted JavaScript, exactly as a discriminated union is a plain object and readonly is nothing at all: every guarantee TypeScript offers is compile-time, and this one is no more theater than the rest. What the brand changes is assignability. `type OrderId = string` is only a second name for string, so it forbids nothing; `string & { readonly __brand: 'OrderId' }` is a structurally different type that no plain string and no CustomerId satisfies. With bare strings, swapping `refundOrder(customer, order)` compiles and refunds the wrong account at runtime. With brands, the same swap is a compile error naming both types at the exact argument. The bug moves from production to the editor, which is the entire trade this lesson's track keeps making.\n\nThe constructor question is about where an unproven claim is allowed to live. `raw as OrderId` asserts something the compiler cannot check, and an assertion scattered across a codebase is a lie waiting to age. Confined to one smart constructor, it becomes the definition of the type: every OrderId in the program passed through that door, so holding the type is proof of having entered through it. When the constructor also validates, as with an email parser returning `Email | null`, the door does real work: callers are forced by the null in the type to narrow before an Email exists, so skipping validation stops being possible rather than merely discouraged.\n\nThat proof is what lets the interior of the program relax. A signature like `sendReceipt(to: Email)` states its precondition, so its body never re-checks, and marking validated structures readonly keeps a later line from breaking what the constructor established. Without this, every layer validates defensively because no layer can trust the previous one, and the same string gets checked four times on its way through the stack.\n\nWhere I would agree: a value that is born and dies inside one function, or one the type system already separates. Branding a log message that goes straight into a template, or giving `quantity: number` a brand when no other number travels beside it, adds a constructor call and a concept without removing any real mistake. The test is whether two values of the same primitive type can plausibly cross paths. Ids that travel together in argument lists: brand them. A string that never meets another string: leave it alone.",
      rubric: [
        {
          id: 'structural-difference',
          label: 'What the brand changes',
          description:
            'Explains that a bare alias creates no new type while the brand intersection is structurally distinct, moving the swap bug from runtime to a compile error, and acknowledges the brand is erased at runtime.',
        },
        {
          id: 'constructor-discipline',
          label: 'Why one cast is fine',
          description:
            'Argues that confining the cast to a smart constructor turns an unproven assertion into the single defined door into the type, especially when the constructor validates and returns T | null.',
        },
        {
          id: 'proof-carrying-signatures',
          label: 'Trusting the interior',
          description:
            'Explains that demanding the branded type in signatures lets downstream code stop re-validating, with readonly preserving the invariant after construction.',
        },
        {
          id: 'when-not-to-brand',
          label: 'When to leave it plain',
          description:
            'Gives a sensible case for not branding, tied to whether same-typed values can realistically be confused, rather than defending brands everywhere.',
        },
      ],
    },
  ],
  approaches: {
    'branded-email-constructor': [
      {
        name: 'Brand plus one guarded cast',
        code: `// The brand exists only in the type system; at runtime an Email is a string.
export type Email = string & { readonly __brand: 'Email' }

export function parseEmail(raw: string): Email | null {
  const at = raw.indexOf('@')

  // Exactly one @ with a nonempty name before it.
  if (at <= 0 || at !== raw.lastIndexOf('@')) {
    return null
  }

  // The domain needs a dot that is neither its first nor last character.
  const domain = raw.slice(at + 1)
  const dot = domain.indexOf('.')
  if (dot <= 0 || domain.endsWith('.')) {
    return null
  }

  // The one place in the program where the claim is made.
  return raw as Email
}

export function sendReceipt(to: Email): string {
  return \`receipt sent to \${to}\`
}`,
        explanation:
          "The type is one intersection: a string that also claims a __brand no runtime string has, which is exactly what stops raw strings at sendReceipt's door. All the interest is in how the rules translate to index arithmetic. `at <= 0` rejects both a missing @ (indexOf returns -1) and an empty name (@ at position 0) in one comparison, and comparing indexOf against lastIndexOf rejects a second @ without scanning. The same trick handles the domain: `dot <= 0` covers no dot and a leading dot together, and endsWith catches the trailing one. Only after every rule passes does the single cast run, so an Email value is a receipt for the checks above it. The null return keeps failure visible to the compiler: every caller must narrow before an Email exists to use.",
        complexity:
          'O(n) time in the address length for the index scans, O(1) extra space beyond the domain slice.',
      },
    ],
    'readonly-line-item': [
      {
        name: 'Validate once, freeze the result',
        code: `export type LineItem = {
  readonly sku: string
  readonly quantity: number
}

export function createLineItem(
  sku: string,
  quantity: number,
): LineItem | null {
  // Reject anything but a whole quantity the shop can actually fulfill.
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    return null
  }

  return { sku, quantity }
}`,
        explanation:
          "The guard does all three rejections in one condition, and the order matters less than the completeness: Number.isInteger throws out fractions along with NaN and the infinities, then the range check pins the whole numbers to 1 through 99 inclusive, boundaries in. What makes this domain modeling rather than input checking is the pairing with the readonly fields. Validation proves the invariant at construction; readonly means no later assignment can un-prove it, so any code holding a non-null LineItem can trust the quantity without looking. The compile-time nature of that promise is worth restating: the emitted object is an ordinary mutable object, and readonly protects against your own code's assignments, which is where the realistic bugs live.",
        complexity:
          'O(1) time and space. The guarantee that matters is the invariant: a non-null LineItem always holds a whole quantity from 1 to 99.',
      },
    ],
    'brand-refund-ids': [
      {
        name: 'Two brands, two constructors, one fixed call',
        code: `type Brand<T, Name extends string> = T & { readonly __brand: Name }

export type OrderId = Brand<string, 'OrderId'>
export type CustomerId = Brand<string, 'CustomerId'>

// The only doors into the branded types: every id in the program makes its
// claim exactly once, here.
export function orderId(raw: string): OrderId {
  return raw as OrderId
}

export function customerId(raw: string): CustomerId {
  return raw as CustomerId
}

export function refundOrder(
  order: OrderId,
  customer: CustomerId,
  amountCents: number,
): string {
  return \`refund \${amountCents} on \${order} to customer \${customer}\`
}

const order = orderId('ord_741')
const customer = customerId('cus_209')

console.log(refundOrder(order, customer, 1500))
`,
        explanation:
          "The Brand helper is written once and stamped twice, giving the two ids brands that differ from each other as well as from string, which is what makes the swap a type error in both directions. Each constructor is a single cast with a name, and the discipline is that these two functions are the only casts: any OrderId in the program came through orderId, so the type is evidence of origin. The function body is untouched, and the runtime tests confirm it, because a branded string is a string; the whole refactor happens in the erased layer. The last change is the one the original was authored to need: the sample call was passing the customer first, and under the new signature that stopped compiling, which is precisely the failure mode the brands exist to create.",
        complexity:
          'O(1) runtime work beyond string formatting. The guarantee that matters is compile-time: order and customer ids cannot swap or admit raw strings.',
      },
    ],
  },
}
