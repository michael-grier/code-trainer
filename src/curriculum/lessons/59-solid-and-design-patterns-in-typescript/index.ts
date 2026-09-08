import Concept from './concept.mdx'

import type { Lesson } from '../../types'

const discountOriginal = `type Cart = { subtotalCents: number; itemCount: number }

type Rule =
  | { kind: 'percent'; percent: number }
  | { kind: 'fixed'; amountCents: number }
  | { kind: 'bulk'; minItems: number; percent: number }

export function applyDiscount(rule: Rule, cart: Cart): number {
  let discount = 0
  if (rule.kind === 'percent') {
    discount = Math.round((cart.subtotalCents * rule.percent) / 100)
  } else if (rule.kind === 'fixed') {
    discount = rule.amountCents
  } else if (rule.kind === 'bulk') {
    if (cart.itemCount >= rule.minItems) {
      discount = Math.round((cart.subtotalCents * rule.percent) / 100)
    } else {
      discount = 0
    }
  }
  if (discount > cart.subtotalCents) {
    discount = cart.subtotalCents
  }
  return cart.subtotalCents - discount
}

console.log(
  applyDiscount({ kind: 'percent', percent: 10 }, { subtotalCents: 5000, itemCount: 2 }),
)
`

const smallCart = { subtotalCents: 5000, itemCount: 2 }

export const lesson: Lesson = {
  slug: 'solid-and-design-patterns-in-typescript',
  title: 'SOLID and Design Patterns in TypeScript',
  summary:
    'Apply design principles and patterns pragmatically in TypeScript systems.',
  track: 'production',
  order: 59,
  concept: Concept,
  problems: [
    {
      id: 'discount-strategy-table',
      kind: 'refactor',
      completionMode: 'tests-and-static-checks-pass',
      title: 'Turn the rule chain into a strategy table',
      prompt:
        'applyDiscount computes the amount a cart pays after one discount rule. Rules come in three kinds: a percentage off the subtotal, a fixed amount off, and a bulk percentage that applies only when the cart has at least minItems items; the discount never exceeds the subtotal, and percentages are rounded to whole cents. The function branches on rule.kind in a chain, so a fourth kind can be added to the union without anyone touching the chain, and the cart silently gets no discount. Refactor it to dispatch through a table of strategies keyed by `Rule[\'kind\']`, one function per kind, so the compiler refuses a kind with no strategy, with no `switch` and no comparisons of rule.kind left in the code. Behavior must not change. Your submission is also type-checked under strict settings, so a table that misses a kind fails to compile. Example: `applyDiscount({ kind: "percent", percent: 10 }, { subtotalCents: 5000, itemCount: 2 })` returns `4500`.',
      estimatedMinutes: 20,
      functionName: 'applyDiscount',
      originalCode: discountOriginal,
      starter: discountOriginal,
      // Compiled beneath the submission under strict settings, so the lesson's
      // promise, that a strategy table missing a rule kind is a compile error,
      // is graded by the compiler rather than by a text check alone.
      typeFixture: `const fixtureTotal: number = applyDiscount(
  { kind: 'percent', percent: 10 },
  { subtotalCents: 5000, itemCount: 2 },
)
void fixtureTotal
`,
      goals: [
        "Build a table of strategies whose keys are Rule['kind'], so every kind in the union must have an entry.",
        'Dispatch by looking up the strategy for the rule, with no switch or kind comparisons in the function body.',
        'Keep the rounding, the bulk threshold, and the never-below-zero cap exactly as they were.',
      ],
      staticChecks: [
        {
          kind: 'forbid-text',
          text: 'rule.kind ===',
          message:
            'Dispatch through a strategy table keyed by kind instead of comparing kinds one by one.',
        },
        {
          kind: 'forbid-text',
          text: 'switch',
          message: 'No switch over the kind either; the table is the dispatch.',
        },
        {
          kind: 'require-text',
          text: 'Rule[',
          message:
            "Key the strategy table by Rule['kind'] so the compiler checks that every kind has a strategy.",
        },
      ],
      tests: [
        {
          name: 'takes a percentage off the subtotal',
          args: [{ kind: 'percent', percent: 10 }, smallCart],
          expected: 4500,
        },
        {
          name: 'takes a fixed amount off',
          args: [{ kind: 'fixed', amountCents: 700 }, smallCart],
          expected: 4300,
        },
        {
          name: 'applies a bulk discount when the cart is large enough',
          args: [
            { kind: 'bulk', minItems: 3, percent: 20 },
            { subtotalCents: 9000, itemCount: 3 },
          ],
          expected: 7200,
        },
        {
          name: 'applies no bulk discount below the item threshold',
          args: [{ kind: 'bulk', minItems: 3, percent: 20 }, smallCart],
          expected: 5000,
        },
        {
          name: 'never discounts below zero',
          args: [{ kind: 'fixed', amountCents: 9999 }, smallCart],
          expected: 0,
        },
        {
          name: 'rounds a percentage to whole cents',
          args: [
            { kind: 'percent', percent: 15 },
            { subtotalCents: 999, itemCount: 1 },
          ],
          expected: 849,
        },
        {
          name: 'a zero percent rule changes nothing',
          args: [{ kind: 'percent', percent: 0 }, smallCart],
          expected: 5000,
        },
      ],
    },
    {
      id: 'fix-trial-charge-contract',
      kind: 'debug',
      completionMode: 'all-tests-pass',
      title: 'Fix the subscription that breaks the billing run',
      prompt:
        'chargeAll is the nightly billing run. It receives every subscription as `{ id, plan, priceCents }` where plan is "monthly", "annual", or "trial", and must return `{ charged, skipped, totalCents }`: `charged` lists `{ id, amountCents }` for each subscription that owes something, in input order, where a monthly plan owes priceCents and an annual plan owes twelve times priceCents; `skipped` lists the ids of subscriptions that owe nothing, in input order; `totalCents` sums the charges. Trial plans owe nothing. Since trials were added, the run throws partway through and half the customers go uncharged. Make every plan honor the contract of a subscription so the run completes. Example: `chargeAll([{ id: "a", plan: "monthly", priceCents: 1000 }, { id: "t", plan: "trial", priceCents: 0 }])` returns `{ charged: [{ id: "a", amountCents: 1000 }], skipped: ["t"], totalCents: 1000 }`.',
      estimatedMinutes: 12,
      functionName: 'chargeAll',
      brokenCode: `type Subscription = {
  id: string
  plan: 'monthly' | 'annual' | 'trial'
  priceCents: number
}

type ChargeRun = {
  charged: { id: string; amountCents: number }[]
  skipped: string[]
  totalCents: number
}

export function chargeAll(subscriptions: Subscription[]): ChargeRun {
  const charged: { id: string; amountCents: number }[] = []
  let totalCents = 0

  for (const subscription of subscriptions) {
    let amountCents: number
    if (subscription.plan === 'monthly') {
      amountCents = subscription.priceCents
    } else if (subscription.plan === 'annual') {
      amountCents = subscription.priceCents * 12
    } else {
      // Trials are free, so there is nothing sensible to charge.
      throw new Error(\`cannot charge a trial subscription: \${subscription.id}\`)
    }
    charged.push({ id: subscription.id, amountCents })
    totalCents += amountCents
  }

  return { charged, skipped: [], totalCents }
}

// The sample run uses paid plans only; add a trial to it to see the crash.
console.log(
  chargeAll([
    { id: 'a', plan: 'monthly', priceCents: 1000 },
    { id: 'b', plan: 'annual', priceCents: 500 },
  ]),
)
`,
      bugHints: [
        'What does the run promise about every subscription it is handed? Does a trial keep that promise?',
        'A subscription that owes nothing is still a subscription. The contract says return an amount, and zero is an amount.',
        'The result has a skipped list the broken code never fills. What belongs in it?',
      ],
      tests: [
        {
          name: 'charges a monthly subscription its price',
          args: [[{ id: 'a', plan: 'monthly', priceCents: 1000 }]],
          expected: {
            charged: [{ id: 'a', amountCents: 1000 }],
            skipped: [],
            totalCents: 1000,
          },
        },
        {
          name: 'charges an annual subscription twelve months',
          args: [[{ id: 'b', plan: 'annual', priceCents: 1000 }]],
          expected: {
            charged: [{ id: 'b', amountCents: 12000 }],
            skipped: [],
            totalCents: 12000,
          },
        },
        {
          name: 'skips a trial instead of failing the whole run',
          args: [
            [
              { id: 'a', plan: 'monthly', priceCents: 1000 },
              { id: 't', plan: 'trial', priceCents: 0 },
              { id: 'b', plan: 'annual', priceCents: 500 },
            ],
          ],
          expected: {
            charged: [
              { id: 'a', amountCents: 1000 },
              { id: 'b', amountCents: 6000 },
            ],
            skipped: ['t'],
            totalCents: 7000,
          },
        },
        {
          name: 'a run of only trials charges nothing',
          args: [
            [
              { id: 't1', plan: 'trial', priceCents: 0 },
              { id: 't2', plan: 'trial', priceCents: 0 },
            ],
          ],
          expected: { charged: [], skipped: ['t1', 't2'], totalCents: 0 },
        },
        {
          name: 'an empty run charges nothing',
          args: [[]],
          expected: { charged: [], skipped: [], totalCents: 0 },
        },
        {
          name: 'keeps charge order equal to input order',
          args: [
            [
              { id: 'b', plan: 'annual', priceCents: 100 },
              { id: 'a', plan: 'monthly', priceCents: 100 },
            ],
          ],
          expected: {
            charged: [
              { id: 'b', amountCents: 1200 },
              { id: 'a', amountCents: 100 },
            ],
            skipped: [],
            totalCents: 1300,
          },
        },
      ],
    },
    {
      id: 'abstraction-judgment-review',
      kind: 'written',
      completionMode: 'submitted-with-reference-review',
      title: 'Decide which abstractions to refuse',
      prompt:
        'A teammate proposes four changes to the book club codebase: (1) replace the two-case switch over sort order in the club list, "newest" and "name", with a strategy table; (2) replace the notification switch from the opener with a Record keyed by the channel union; (3) split the twelve-method ClubRepository interface into the three groups its callers actually use; (4) introduce an abstract PaymentProvider class hierarchy for the single Stripe integration the app has. In your own words, say which principle each proposal appeals to, accept the ones that pay for themselves and refuse the ones that do not, and give the reason for each in terms of reasons to change, callers, and what the compiler would enforce.',
      estimatedMinutes: 12,
      referenceAnswer:
        'Proposal 1 appeals to the open/closed principle, and I would refuse it. Sort order has two cases, "newest" and "name", with no third in sight, and a switch with a never check in the default already makes the compiler refuse an unhandled member. A strategy table would move two lines of code into a record and add a lookup, so a reader now checks two places to see what sorting does, for flexibility nobody has asked for. Abstract in the direction the code has changed, and sort order has not changed.\n\nProposal 2 appeals to open/closed as well, and I would accept it, because the opener already showed the axis of growth: channels went from two to three with a production error, and a fourth is likely. A Record keyed by the Channel union makes adding a channel one entry in one place and turns a missing sender into a compile error, TS2741 in the lesson\'s transcript, instead of an unknown-channel exception. Each sender becomes its own function with its own tests, which is the single-responsibility payoff on top.\n\nProposal 3 appeals to interface segregation, and I would accept it if the three groups match real callers. A twelve-method interface means every fake in every test implements twelve methods and every caller depends on methods it never calls, so a change to the reporting queries recompiles and re-reviews the join flow. Splitting it so the join handler depends on a two-method membership interface shrinks each fake, narrows each dependency, and lets the compiler tell you exactly which callers a method change touches.\n\nProposal 4 appeals to dependency inversion, and I would refuse the hierarchy while keeping the idea. With one payment provider there is nothing to substitute, and an abstract class plus a concrete subclass is indirection for a second implementation that does not exist. What the checkout code does need is to receive its payment client through a parameter typed as a small interface, the seam from lesson 55, so tests can pass a fake with real behavior. That is one function type or a two-method interface, not a class hierarchy, and it can grow into an adapter for a second provider the day one arrives.',
      rubric: [
        {
          id: 'principles-identified',
          label: 'Names the principle behind each proposal',
          description:
            'Correctly attributes the sort and notification proposals to open/closed, the repository split to interface segregation, and the payment hierarchy to dependency inversion.',
        },
        {
          id: 'refuses-premature-abstraction',
          label: 'Refuses the two that do not pay',
          description:
            'Declines the two-case sort strategy table and the single-provider class hierarchy, citing no axis of growth, added indirection, and the never check or a small injected interface as the sufficient alternative.',
        },
        {
          id: 'accepts-with-compiler-argument',
          label: 'Accepts with enforcement reasons',
          description:
            'Accepts the channel Record because the compiler refuses a missing sender and the axis has already grown, and accepts the interface split because fakes and callers shrink and dependencies become precise.',
        },
        {
          id: 'reasons-to-change',
          label: 'Argues from reasons to change and callers',
          description:
            'Grounds each decision in what will change, who calls it, and what the compiler enforces, rather than in pattern names or file counts.',
        },
      ],
    },
    {
      id: 'notification-module-design',
      kind: 'design',
      completionMode: 'submitted-with-rubric-review',
      title: 'Structure the notification module',
      prompt:
        'Design the structure of the book club\'s notification module so it grows along the axes described in the scenario, with the compiler enforcing completeness where it can.',
      estimatedMinutes: 25,
      scenario:
        'The book club app notifies users when a club they belong to adds a pick, when someone joins a club they own, and when a reading deadline is a day away. Notifications go out over email and SMS today, push next month, and possibly in-app later. Each channel has its own provider client with its own request shape and failure modes; the SMS provider has a 160-character limit and bills per message. Users choose which events they want on which channels. The team has been bitten twice by the opener\'s failure, a channel or event added in one place and missed in another, and once by a provider outage that took every notification down with it. Delivery must be retried on transient provider errors and never duplicated.',
      sections: [
        {
          id: 'axes',
          type: 'short-answer',
          label: 'Axes of growth',
          prompt:
            'Name the things this module will grow along and the things that will stay fixed, and say which growth the compiler should enforce and how.',
        },
        {
          id: 'interfaces',
          type: 'entity-list',
          label: 'Interfaces and tables',
          prompt:
            'List the interfaces and keyed tables the module is built from: what each contains, what depends on it, and which principle it serves. Keep every interface as small as its callers need.',
        },
        {
          id: 'provider-boundary',
          type: 'tradeoff',
          label: 'Provider clients',
          prompt:
            'Choose how the module talks to the provider clients and justify it with the outage, the differing request shapes, and testability.',
          options: [
            'One adapter per provider implementing a shared Sender interface, injected into the module',
            'Call each provider\'s client directly from the channel code, keeping the module simpler',
          ],
        },
        {
          id: 'retries',
          type: 'short-answer',
          label: 'Retry and idempotency',
          prompt:
            'Describe where retry and deduplication live so that every channel gets them without each channel implementing them, and name the pattern you are using.',
        },
      ],
      rubric: [
        {
          id: 'axes-named',
          label: 'Growth axes identified and enforced',
          description:
            'Identifies channels and event types as the growth axes, keeps the core send flow fixed, and uses union-keyed Record types so a missing sender or event formatter fails to compile.',
        },
        {
          id: 'small-interfaces',
          label: 'Interfaces sized to their callers',
          description:
            'Defines a one-function Sender, a formatter per event, and a preferences lookup as separate small interfaces, and can say which caller depends on each.',
        },
        {
          id: 'adapter-tradeoff',
          label: 'Provider boundary argued from outage and tests',
          description:
            'Either option can earn credit, but the answer must weigh the adapter\'s isolation of provider shapes and outages and its testability with fakes against the indirection cost, and state what breaks under the alternative.',
        },
        {
          id: 'decorator-for-retry',
          label: 'Retry and dedup as a wrapper',
          description:
            'Places retry and idempotency-key deduplication in a decorator around the Sender interface (or an equivalent single wrapper), so every channel inherits them, with a note on which errors are retried and how duplicates are keyed.',
        },
      ],
      referenceAnswer:
        'Axes of growth. Two things grow: the set of channels, email and SMS now, push next month, in-app later; and the set of event types, pick added, member joined, deadline approaching, with more to come. What stays fixed is the flow: an event occurs, the user\'s preferences pick channels, each chosen channel formats and sends, delivery is retried and deduplicated. Both growth axes are unions in TypeScript, and both are enforced with Record types keyed by the union: Record<Channel, Sender> and Record<EventType, Formatter>. Adding a channel or an event without its entry is a compile error, which is the failure the team has hit twice turned into a build failure.\n\nInterfaces and tables. Sender: one function from a formatted message to a delivery result, one per channel, keyed in Record<Channel, Sender>; the send flow depends on it and nothing else about a channel. Formatter: one function from an event to a message per channel, keyed in Record<EventType, Record<Channel, Formatter>>, so the SMS formatter for a deadline can truncate to 160 characters while the email one includes the whole pick list; the send flow depends on it. PreferenceLookup: one function from user and event type to the channels they want, owned by the preferences code; the send flow depends on it. ProviderClient adapters: one per provider, each implementing Sender over that provider\'s own client. Each interface is a single function or two, so a test fake is a line long and no caller depends on more than it uses.\n\nProvider clients. One adapter per provider behind the shared Sender interface, injected into the module. The provider outage took every notification down because the channel code called providers directly and a thrown error in one escaped into the loop; with adapters, each provider\'s failure modes are translated into the Sender result type at the boundary, and the send flow treats a failed channel as a failed channel rather than a crashed run. The differing request shapes stay inside the adapters, which is where lesson 56\'s contract parser lives too. Tests inject fakes with real behavior, a Sender that records messages and can be told to fail, so the flow is tested without a provider. Direct calls are simpler for one channel and one provider, and the scenario has neither.\n\nRetry and idempotency. A decorator: withRetry(withIdempotency(sender)) wraps any Sender and returns a Sender, so every channel gets both by construction and no channel implements either. The idempotency wrapper keys each delivery by event id, user id, and channel, records completed keys, and skips a repeat, which is lesson 46\'s idempotency key applied to outbound messages. The retry wrapper retries only transient results, a provider timeout or a 429 with backoff, and never a rejected message such as an invalid phone number, which is lesson 43\'s classification. Because both are wrappers on the interface, adding push next month means writing one adapter and one entry; retry and dedup are already there.',
    },
  ],
  approaches: {
    'discount-strategy-table': [
      {
        name: 'A record of strategies keyed by the union',
        code: `type Cart = { subtotalCents: number; itemCount: number }

type Rule =
  | { kind: 'percent'; percent: number }
  | { kind: 'fixed'; amountCents: number }
  | { kind: 'bulk'; minItems: number; percent: number }

// One strategy per rule kind. Keying the table by Rule['kind'] means adding
// a kind to the union without a strategy is a compile error, not a cart
// that silently gets no discount. Each strategy receives its own rule shape.
const discountStrategies: {
  [K in Rule['kind']]: (rule: Extract<Rule, { kind: K }>, cart: Cart) => number
} = {
  percent: (rule, cart) => Math.round((cart.subtotalCents * rule.percent) / 100),
  fixed: (rule) => rule.amountCents,
  bulk: (rule, cart) =>
    cart.itemCount >= rule.minItems
      ? Math.round((cart.subtotalCents * rule.percent) / 100)
      : 0,
}

export function applyDiscount(rule: Rule, cart: Cart): number {
  // The lookup replaces the chain. The cast widens the strategy's parameter
  // back to Rule, because the table entry was already chosen by rule.kind.
  const strategy = discountStrategies[rule.kind] as (rule: Rule, cart: Cart) => number
  const discount = Math.min(strategy(rule, cart), cart.subtotalCents)
  return cart.subtotalCents - discount
}`,
        explanation:
          'The chain of kind comparisons becomes a table with one entry per kind, and the function body becomes a lookup, a cap, and a subtraction. The behavior is identical, which the characterization tests confirm, and two properties are new. The table\'s type is a mapped type over Rule[\'kind\'], so each strategy is typed with exactly its own rule shape and the compiler refuses the table if any kind lacks an entry; a plain Record<Rule[\'kind\'], ...> gives the same completeness guarantee with a slightly wider parameter type, and either satisfies the checks. And each strategy is a separate function with one reason to change: a new rounding rule for percentages touches one line and cannot alter how fixed discounts behave. The cap on the discount stays outside the table, because it applies to every kind and belongs to the flow rather than to any strategy.',
        complexity:
          'O(1) time and space. The guarantee that matters is completeness: every member of the Rule union has a strategy, checked at compile time.',
      },
    ],
    'fix-trial-charge-contract': [
      {
        name: 'Honor the contract: a trial owes zero',
        code: `type Subscription = {
  id: string
  plan: 'monthly' | 'annual' | 'trial'
  priceCents: number
}

type ChargeRun = {
  charged: { id: string; amountCents: number }[]
  skipped: string[]
  totalCents: number
}

// Every plan answers the same question, "how much is owed," with a number.
// A trial's answer is zero, which is what lets it flow through the run.
function amountOwedCents(subscription: Subscription): number {
  if (subscription.plan === 'monthly') return subscription.priceCents
  if (subscription.plan === 'annual') return subscription.priceCents * 12
  return 0
}

export function chargeAll(subscriptions: Subscription[]): ChargeRun {
  const charged: { id: string; amountCents: number }[] = []
  const skipped: string[] = []
  let totalCents = 0

  for (const subscription of subscriptions) {
    const amountCents = amountOwedCents(subscription)

    // Owing nothing is a normal outcome, reported rather than thrown, so one
    // free subscription cannot stop the customers after it from being charged.
    if (amountCents === 0) {
      skipped.push(subscription.id)
      continue
    }

    charged.push({ id: subscription.id, amountCents })
    totalCents += amountCents
  }

  return { charged, skipped, totalCents }
}`,
        explanation:
          'The trial plan satisfied the Subscription type and then refused to behave as one: where the contract of the run says every subscription yields an amount, the trial threw, and because the loop had no way to continue past a throw, the customers after it were never charged. The fix makes the substitute honor the contract. A trial owes zero, so the amount function returns zero, and the run records the subscription as skipped and moves on. Extracting the amount into its own function also gives the three plans one place to live, and the exhaustive if-chain there is small enough that a never check would be the right next step if a fourth plan arrives. The skipped list, which the broken code returned empty, now carries the information the throw was trying to express, in a form the caller can act on after the run completes for everyone.',
        complexity:
          'O(n) time and space for n subscriptions. The guarantee that matters is that no subscription can stop the run, because every plan returns an amount.',
      },
    ],
  },
}
