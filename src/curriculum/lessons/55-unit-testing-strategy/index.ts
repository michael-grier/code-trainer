import Concept from './concept.mdx'

import type { Lesson } from '../../types'

export const lesson: Lesson = {
  slug: 'unit-testing-strategy',
  title: 'Unit Testing Strategy',
  summary:
    'Choose useful unit boundaries and test behavior without overfitting implementation details.',
  track: 'production',
  order: 55,
  concept: Concept,
  problems: [
    {
      id: 'time-formatter-hidden-clock',
      kind: 'debug',
      completionMode: 'all-tests-pass',
      title: 'Fix the formatter that reads the clock in secret',
      prompt:
        "formatRelativeTime labels how long ago an event happened. It takes nowMs, the current time as the caller sees it, and thenMs, the event time, both in epoch milliseconds. The contract: under a minute of elapsed time (including future timestamps) is 'just now'; under an hour is whole minutes, like '5m ago'; under a day is whole hours, like '2h ago'; anything older is whole days, like '3d ago'. The tests pass a fixed nowMs, yet the function keeps disagreeing with them, and the label it prints depends on today's date rather than on the arguments. Find the hidden dependency and fix it. Example: `formatRelativeTime(1_700_000_000_000, 1_700_000_000_000 - 300_000)` should return `'5m ago'`.",
      estimatedMinutes: 15,
      functionName: 'formatRelativeTime',
      brokenCode: `export function formatRelativeTime(
  nowMs: number,
  thenMs: number,
): string {
  const elapsedMs = Date.now() - thenMs

  if (elapsedMs < 60_000) {
    return 'just now'
  }

  if (elapsedMs < 3_600_000) {
    return \`\${Math.floor(elapsedMs / 60_000)}m ago\`
  }

  if (elapsedMs < 86_400_000) {
    return \`\${Math.floor(elapsedMs / 3_600_000)}h ago\`
  }

  return \`\${Math.floor(elapsedMs / 86_400_000)}d ago\`
}

console.log(formatRelativeTime(1_700_000_000_000, 1_700_000_000_000 - 300_000))
`,
      bugHints: [
        'The tests hand the function a nowMs value. Does the function ever read it?',
        'The sample asks about a five-minute gap, yet it prints a label measured in days. Where could that huge elapsed time be coming from?',
        'Replace the hidden clock read with the parameter the caller controls.',
      ],
      tests: [
        {
          name: 'labels a thirty second old event as just now',
          args: [1_700_000_000_000, 1_700_000_000_000 - 30_000],
          expected: 'just now',
        },
        {
          name: 'counts whole minutes',
          args: [1_700_000_000_000, 1_700_000_000_000 - 300_000],
          expected: '5m ago',
        },
        {
          name: 'stays in minutes just under an hour',
          args: [1_700_000_000_000, 1_700_000_000_000 - 3_599_000],
          expected: '59m ago',
        },
        {
          name: 'switches to hours after sixty minutes',
          args: [1_700_000_000_000, 1_700_000_000_000 - 2 * 3_600_000],
          expected: '2h ago',
        },
        {
          name: 'switches to days after twenty-four hours',
          args: [1_700_000_000_000, 1_700_000_000_000 - 3 * 86_400_000],
          expected: '3d ago',
        },
        {
          name: 'treats a future timestamp as just now',
          args: [1_700_000_000_000, 1_700_000_000_000 + 5_000],
          expected: 'just now',
        },
      ],
    },
    {
      id: 'inject-retry-jitter',
      kind: 'refactor',
      completionMode: 'tests-and-static-checks-pass',
      title: 'Give the retry delay a seam for its randomness',
      prompt:
        'computeRetryDelay decides how long a client waits before retrying a failed request. The wait doubles from 200ms per attempt and caps at 10,000ms, and a little jitter is added on top so a crowd of clients does not retry in lockstep. Right now the function generates the jitter itself, so no test can pin its output. Refactor it to take the jitter as a second parameter named jitterMs and add that to the capped backoff. The caller decides where jitter comes from; this function just does arithmetic. Example: `computeRetryDelay(1, 250)` returns `650`.',
      estimatedMinutes: 15,
      functionName: 'computeRetryDelay',
      originalCode: `export function computeRetryDelay(attempt: number): number {
  // Double the wait each attempt, starting at 200ms, capped at 10 seconds.
  const backoffMs = Math.min(200 * 2 ** attempt, 10_000)

  // Spread clients out so they do not all retry at the same instant.
  return backoffMs + Math.random() * 100
}

console.log(computeRetryDelay(3))
`,
      starter: `export function computeRetryDelay(attempt: number): number {
  // Double the wait each attempt, starting at 200ms, capped at 10 seconds.
  const backoffMs = Math.min(200 * 2 ** attempt, 10_000)

  // Spread clients out so they do not all retry at the same instant.
  return backoffMs + Math.random() * 100
}

console.log(computeRetryDelay(3))
`,
      goals: [
        'Accept the jitter through a second parameter named jitterMs and add it to the capped backoff.',
        'Remove every source of randomness from inside the function, so the same arguments always return the same delay.',
        'Keep the backoff behavior unchanged: 200ms doubled per attempt, capped at 10,000ms.',
      ],
      staticChecks: [
        {
          kind: 'forbid-text',
          text: 'Math.random',
          message:
            'The refactored function must not generate randomness itself. The caller supplies the jitter.',
        },
        {
          kind: 'require-text',
          text: 'jitterMs',
          message:
            'Accept the injected jitter through a parameter named jitterMs.',
        },
      ],
      tests: [
        {
          name: 'returns the bare backoff when jitter is zero',
          args: [0, 0],
          expected: 200,
        },
        {
          name: 'adds the injected jitter to the doubled backoff',
          args: [1, 250],
          expected: 650,
        },
        {
          name: 'keeps doubling on later attempts',
          args: [3, 125],
          expected: 1725,
        },
        {
          name: 'caps the backoff at ten seconds',
          args: [10, 0],
          expected: 10_000,
        },
        {
          name: 'adds jitter on top of the cap',
          args: [7, 999],
          expected: 10_999,
        },
        {
          name: 'handles jitter larger than the base delay',
          args: [0, 450],
          expected: 650,
        },
      ],
    },
    {
      id: 'choose-what-to-test',
      kind: 'written',
      completionMode: 'submitted-with-reference-review',
      title: 'Decide what deserves a unit test',
      prompt:
        "You inherit shipping.ts, which exports three functions. quoteShipping(cart, rateTable) is pure arithmetic over its two arguments and holds most of the module's logic. buildTrackingId() returns 'TRK-' plus the current epoch milliseconds plus a random three-digit suffix, both generated inside the function. submitShipment(client, shipment) is four lines that call client.post('/shipments', shipment) and return the response. For each function, decide: unit test it as is, refactor it first, or leave it out of the unit suite. Justify every call using the behavior-versus-implementation rule and the seam rule from the lesson.",
      estimatedMinutes: 15,
      referenceAnswer:
        "quoteShipping is where the unit tests belong. It is pure: everything it needs arrives through its parameters and everything it produces comes back in the return value, so tests can pin the contract directly. I would cover a typical cart, an empty cart, boundary weights where the rate table changes bands, and rounding, all through inputs and outputs, never by inspecting how the function walks the table. Those tests survive any rewrite of the internals and fail only when a quoted price actually changes.\n\nbuildTrackingId cannot be tested as written, because it reads two hidden dependencies, the clock and the random generator, so it returns a different id on every call and no expected value is ever stable. Refactor first: give it a seam by accepting nowMs and the random suffix (or a random value to derive it from) as parameters, keeping only the formatting logic inside. Then a deterministic test can assert the exact id for fixed inputs, such as buildTrackingId(1_700_000_000_000, 42) producing 'TRK-1700000000000-042'. The production caller passes Date.now() and its random source at the edge. Testing it without the refactor forces a loose regex over nondeterministic output, which checks the shape but never the values.\n\nsubmitShipment is wiring, so it stays out of the unit suite. A unit test would hand it a fake client and assert the fake was called with the shipment, which restates the implementation as an assertion; renaming the client method or batching the call would break the test with no user-visible change. Its real risks live at the boundary with the server, so an integration test against a real or in-memory endpoint covers it honestly.",
      rubric: [
        {
          id: 'pure-first',
          label: 'Pure logic tested through its contract',
          description:
            'Targets quoteShipping for thorough unit tests and pins its behavior through inputs and outputs, including boundary and empty-cart cases, without asserting on internals.',
        },
        {
          id: 'seam-before-test',
          label: 'Seam before test',
          description:
            'Refactors buildTrackingId to inject the clock and randomness before testing it, instead of writing a loose pattern match around nondeterministic output.',
        },
        {
          id: 'wiring-skipped',
          label: 'Wiring left to integration tests',
          description:
            'Identifies submitShipment as wiring where a mocked unit test would only mirror the implementation, and assigns it to integration tests instead.',
        },
        {
          id: 'rules-cited',
          label: 'Decisions tied to the rules',
          description:
            'Justifies each decision with the behavior-versus-implementation rule or the seam rule, not with blanket coverage goals.',
        },
      ],
    },
    {
      id: 'discount-engine-test-plan',
      kind: 'design',
      completionMode: 'submitted-with-rubric-review',
      title: 'Plan the unit tests for a discount engine',
      prompt:
        'Design the unit test plan for the pricing engine described in the scenario before anyone implements it. Work through each section; every answer should lean on a rule from the lesson.',
      estimatedMinutes: 25,
      scenario:
        'Your team is about to build priceOrder(order, rules, nowMs) for a storefront. An order holds line items with unit prices in cents and quantities. Rules apply in priority order and come in three shapes: a percentage off a matching line item, a fixed amount off the whole order, and a promo code that is only valid between a start and an end timestamp. The final total is rounded to whole cents and must never go below zero. The engine is pure TypeScript with no IO, and it will be maintained by people who were not in the room when it was designed.',
      sections: [
        {
          id: 'contract-tests',
          type: 'short-answer',
          label: 'Behaviors to pin',
          prompt:
            'List five or six unit tests you would write first, each as a test name that states an observable behavior of priceOrder. Include at least one boundary case.',
        },
        {
          id: 'clock-seam',
          type: 'short-answer',
          label: 'Controlling time',
          prompt:
            'Promo codes expire. Explain where the seam for time sits in this design, then describe one deterministic test, in prose or code, that proves an expired code is ignored.',
        },
        {
          id: 'clock-strategy',
          type: 'tradeoff',
          label: 'How tests control the clock',
          prompt:
            'Pick how tests should get control of the current time, and defend your choice against the alternatives.',
          options: [
            'Pass nowMs into priceOrder as a parameter',
            'Stub the global Date.now inside each test',
            'Schedule test runs at times when no fixture code expires',
            'Read the time from a module-level variable that tests overwrite',
          ],
        },
        {
          id: 'one-reason',
          type: 'short-answer',
          label: 'Keeping failures readable',
          prompt:
            'Rules stack, so a single order can exercise several rules at once. Describe how you will keep each test failing for one reason as the rule set grows, including how fixtures are built and how tests are named.',
        },
      ],
      rubric: [
        {
          id: 'observable-contracts',
          label: 'Contracts, not internals',
          description:
            'The test list names user-visible outcomes, such as rounding, priority order between stacked rules, the zero floor, and expired codes being ignored, rather than internal steps of the calculation.',
        },
        {
          id: 'boundary-coverage',
          label: 'Boundary cases planned',
          description:
            'Includes at least one boundary test, such as a code whose window ends exactly at nowMs or a discount that would push the total below zero.',
        },
        {
          id: 'time-as-parameter',
          label: 'Time enters through the seam',
          description:
            'Treats nowMs as the seam: expiry tests pass fixed timestamps and need no stubbing, patching, or waiting for the wall clock.',
        },
        {
          id: 'tradeoff-defended',
          label: 'Clock tradeoff defended',
          description:
            'Chooses parameter injection and names a concrete failure of at least one rejected option, such as a global stub leaking into other tests or hiding the time dependency from the signature.',
        },
        {
          id: 'isolated-failures',
          label: 'One reason to fail',
          description:
            'Plans one behavior per test with names that read as sentences, and builds fresh per-test fixtures instead of one shared order object that tests mutate.',
        },
      ],
      referenceAnswer:
        "Behaviors to pin first: 'applies a percentage discount to the matching line item', 'applies rules in priority order when two rules target the same item', 'ignores a promo code whose window ended before nowMs', 'applies a promo code whose window contains nowMs', 'never returns a total below zero when discounts exceed the order value', and 'rounds the final total to whole cents'. Each name states something a caller can observe in the returned total, so any rewrite of the internal rule pipeline leaves them green, and each failure message reads as a broken promise.\n\nTime already has its seam in this design: nowMs is a parameter, and the engine never reads the real clock. A deterministic expiry test builds a promo code valid from 1_000 to 2_000 and asserts that priceOrder(order, [code], 2_001) leaves the total unchanged while priceOrder(order, [code], 1_500) discounts it. Passing the boundary value 2_000 itself pins whether the window is inclusive, which is exactly the kind of decision future maintainers will otherwise guess at.\n\nOn the clock tradeoff, parameter injection wins. Stubbing the global Date.now works until one test forgets to restore it and poisons the rest of the suite, and it hides the time dependency from everyone reading the signature. Scheduling runs around expiry times is surrendering determinism entirely. A module-level variable that tests overwrite is shared mutable state with the same leak problem as the stub, minus the honesty of a parameter.\n\nTo keep failures readable as rules stack: one rule per test wherever possible, plus one dedicated test for each interaction that actually matters, like priority between two rules on the same item. Fixtures come from a small helper such as makeOrder(overrides) that returns a fresh object on every call, so no test can mutate another's input. With behavior-stating names and independent fixtures, a red run reads as a list of exactly which promises broke, and nothing else.",
    },
  ],
  approaches: {
    'time-formatter-hidden-clock': [
      {
        name: 'Read the clock the caller passed in',
        code: `export function formatRelativeTime(
  nowMs: number,
  thenMs: number,
): string {
  // Use the caller's clock, never the real one. Same arguments,
  // same label, on any machine, at any time of day.
  const elapsedMs = nowMs - thenMs

  // Under a minute, including future timestamps, reads as fresh.
  if (elapsedMs < 60_000) {
    return 'just now'
  }

  // Each band divides by its unit and floors, so 59 minutes stays in minutes.
  if (elapsedMs < 3_600_000) {
    return \`\${Math.floor(elapsedMs / 60_000)}m ago\`
  }

  if (elapsedMs < 86_400_000) {
    return \`\${Math.floor(elapsedMs / 3_600_000)}h ago\`
  }

  return \`\${Math.floor(elapsedMs / 86_400_000)}d ago\`
}`,
        explanation:
          'Every branch of the broken version was already correct. The bug sat in the first line: elapsedMs came from the real clock instead of the nowMs parameter, so the function had a hidden input the tests could not control, and its answer drifted as real time passed. Switching to nowMs makes the function pure, and the future-timestamp case falls out for free, because a negative elapsedMs lands in the under-a-minute branch.',
        complexity:
          'O(1) time and space. The guarantee that matters here is determinism: the label depends only on the two arguments.',
      },
    ],
    'inject-retry-jitter': [
      {
        name: 'Jitter as a parameter',
        code: `export function computeRetryDelay(
  attempt: number,
  jitterMs: number,
): number {
  // Double the wait each attempt, starting at 200ms, capped at 10 seconds.
  const backoffMs = Math.min(200 * 2 ** attempt, 10_000)

  // The jitter arrives from the caller, so the function decides nothing
  // random itself and every call with the same arguments returns the same delay.
  return backoffMs + jitterMs
}`,
        explanation:
          'The backoff formula never changes; the only move is pushing the randomness out through a seam. Production code now calls computeRetryDelay(attempt, someRandomMs) with a random value generated at the edge, while tests pass fixed jitter values and assert exact delays. The function went from unpinnable to fully deterministic by deleting one expression and adding one parameter.',
        complexity:
          'O(1) time and space. The payoff is determinism: tests pin exact delays instead of asserting a range around a random one.',
      },
    ],
  },
}
