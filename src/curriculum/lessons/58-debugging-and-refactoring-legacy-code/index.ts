import Concept from './concept.mdx'

import type { Lesson } from '../../types'

const shipmentOriginal = `type Order = {
  id: number
  country: string
  totalCents: number
  express: boolean
  items: number
}

type Shipment = { carrier: string; costCents: number; label: string }

export function describeShipment(order: Order): Shipment {
  var carrier = ''
  var cost = 0
  if (order.country === 'US') {
    if (order.express) {
      carrier = 'FastPost'
      cost = 1500
      if (order.totalCents >= 10000) {
        cost = 0
      }
    } else {
      carrier = 'GroundCo'
      cost = 500
      if (order.totalCents >= 5000) {
        cost = 0
      }
    }
  } else {
    if (order.express) {
      carrier = 'FastPost'
      cost = 3500
      if (order.totalCents >= 10000) {
        cost = 0
      }
    } else {
      carrier = 'GroundCo'
      cost = 1500
      if (order.totalCents >= 5000) {
        cost = 0
      }
    }
  }
  if (order.items > 5) {
    cost = cost + 200
  }
  order.totalCents = order.totalCents + cost
  var label = 'Order #' + order.id + ' via ' + carrier + ' (' + (cost === 0 ? 'free' : cost + 'c') + ')'
  return { carrier: carrier, costCents: cost, label: label }
}

console.log(describeShipment({ id: 7, country: 'US', totalCents: 4200, express: false, items: 2 }))
`

// Each characterization test gets its own order so a submission that mutates
// its argument, as the original does, cannot leak into the next test.
const order = (overrides: Record<string, unknown>) => ({
  id: 7,
  country: 'US',
  totalCents: 4200,
  express: false,
  items: 2,
  ...overrides,
})

export const lesson: Lesson = {
  slug: 'debugging-and-refactoring-legacy-code',
  title: 'Debugging and Refactoring Legacy Code',
  summary:
    'Isolate failures and improve code incrementally without breaking behavior.',
  track: 'production',
  order: 58,
  concept: Concept,
  problems: [
    {
      id: 'fix-late-fee-boundaries',
      kind: 'debug',
      completionMode: 'all-tests-pass',
      title: 'Fix the late fee the bisect blamed',
      prompt:
        'lateFeeCents computes the late fee on an invoice from its total in cents and the number of days late. The policy: no fee through the tenth day late inclusive; after that, two percent of the total per full week past the grace period, so days 11 through 16 charge nothing and day 17 charges one week; the rate is capped at twenty percent; the fee is rounded to whole cents. The bisected commit "tidy late fee rounding" changed this function, and finance reports that an invoice 20 days late was charged 400 instead of 200. Restore the policy, including the grace comparison the commit rewrote, even though the rounding change is the only one with a visible symptom. Example: `lateFeeCents(10000, 20)` returns `200`.',
      estimatedMinutes: 10,
      functionName: 'lateFeeCents',
      brokenCode: `// Late fee: nothing during the grace period, then 2% of the total per
// week late, capped at 20%.
export function lateFeeCents(totalCents: number, daysLate: number): number {
  if (daysLate < 10) return 0
  const weeksLate = Math.ceil((daysLate - 10) / 7)
  const rate = Math.min(0.02 * weeksLate, 0.2)
  return Math.round(totalCents * rate)
}

console.log(lateFeeCents(10000, 20))
`,
      bugHints: [
        'The bisected diff touched two lines. Which one decides how a partial week counts, and does the other change any output at all?',
        'Twenty days late is ten days past grace. Is that one full week or two?',
        'The existing test used 24 days, where floor and ceiling agree. Pick inputs where they do not.',
      ],
      tests: [
        {
          name: 'charges nothing on the last day of the grace period',
          args: [10000, 10],
          expected: 0,
        },
        {
          name: 'charges nothing before a full week has passed after grace',
          args: [10000, 16],
          expected: 0,
        },
        {
          name: 'charges one week at exactly seven days after grace',
          args: [10000, 17],
          expected: 200,
        },
        {
          name: 'charges one week for an invoice 20 days late',
          args: [10000, 20],
          expected: 200,
        },
        {
          name: 'charges two weeks for an invoice 24 days late',
          args: [10000, 24],
          expected: 400,
        },
        {
          name: 'caps the fee at 20 percent',
          args: [10000, 200],
          expected: 2000,
        },
        {
          name: 'charges nothing when not late at all',
          args: [10000, 0],
          expected: 0,
        },
        {
          name: 'rounds to whole cents',
          args: [1234, 17],
          expected: 25,
        },
      ],
    },
    {
      id: 'refactor-legacy-shipment',
      kind: 'refactor',
      completionMode: 'tests-and-static-checks-pass',
      title: 'Shrink the legacy shipping function under its tests',
      prompt:
        'describeShipment decides the carrier, cost, and label for an order. Its four copy-pasted branches encode a small table: express ships via FastPost and ground via GroundCo; the base cost is 1500 for domestic express, 500 for domestic ground, 3500 for international express, and 1500 for international ground, where domestic means country "US"; shipping is free when the order total is at least 10000 for express or at least 5000 for ground; and orders with more than five items pay a 200 surcharge on top of whatever the base cost is, including free. The label is `Order #<id> via <carrier> (<cost>c)` or `(free)` when the cost is zero. The characterization tests below are green against the original. Refactor it so every test stays green, the function no longer modifies the order it receives, no `var` remains, and the module fits in 30 non-blank lines. Example: `describeShipment({ id: 7, country: "US", totalCents: 4200, express: false, items: 2 })` returns `{ carrier: "GroundCo", costCents: 500, label: "Order #7 via GroundCo (500c)" }`.',
      estimatedMinutes: 25,
      functionName: 'describeShipment',
      originalCode: shipmentOriginal,
      starter: shipmentOriginal,
      goals: [
        'Replace the four duplicated branches with a lookup keyed by zone and speed.',
        'Stop mutating the order argument; the function should compute and return, nothing else.',
        'Use const or let instead of var, and keep the module within 30 non-blank lines.',
      ],
      staticChecks: [
        {
          kind: 'no-mutation',
          targets: ['order'],
          message:
            'describeShipment must not change the order it was given. Compute the shipment from it and return.',
        },
        {
          kind: 'forbid-text',
          text: 'var ',
          message: 'Replace var with const or let.',
        },
        {
          kind: 'max-lines',
          max: 30,
          message:
            'Keep the module to 30 non-blank lines by replacing the duplicated branches with a table.',
        },
      ],
      tests: [
        {
          name: 'domestic ground below the free threshold',
          args: [order({})],
          expected: {
            carrier: 'GroundCo',
            costCents: 500,
            label: 'Order #7 via GroundCo (500c)',
          },
        },
        {
          name: 'domestic ground at the free threshold',
          args: [order({ totalCents: 5000 })],
          expected: {
            carrier: 'GroundCo',
            costCents: 0,
            label: 'Order #7 via GroundCo (free)',
          },
        },
        {
          name: 'domestic express below its higher free threshold',
          args: [order({ express: true, totalCents: 9999 })],
          expected: {
            carrier: 'FastPost',
            costCents: 1500,
            label: 'Order #7 via FastPost (1500c)',
          },
        },
        {
          name: 'domestic express at the free threshold',
          args: [order({ express: true, totalCents: 10000 })],
          expected: {
            carrier: 'FastPost',
            costCents: 0,
            label: 'Order #7 via FastPost (free)',
          },
        },
        {
          name: 'international ground',
          args: [order({ country: 'DE' })],
          expected: {
            carrier: 'GroundCo',
            costCents: 1500,
            label: 'Order #7 via GroundCo (1500c)',
          },
        },
        {
          name: 'international express',
          args: [order({ country: 'DE', express: true })],
          expected: {
            carrier: 'FastPost',
            costCents: 3500,
            label: 'Order #7 via FastPost (3500c)',
          },
        },
        {
          name: 'bulk surcharge applies on top of free shipping',
          args: [order({ totalCents: 5000, items: 6 })],
          expected: {
            carrier: 'GroundCo',
            costCents: 200,
            label: 'Order #7 via GroundCo (200c)',
          },
        },
        {
          name: 'bulk surcharge applies to a paid rate',
          args: [order({ country: 'DE', items: 9 })],
          expected: {
            carrier: 'GroundCo',
            costCents: 1700,
            label: 'Order #7 via GroundCo (1700c)',
          },
        },
      ],
    },
    {
      id: 'debugging-process-review',
      kind: 'written',
      completionMode: 'submitted-with-reference-review',
      title: 'Explain how three test runs found the bug',
      prompt:
        'A teammate is impressed that the late-fee bug was located in three test runs and asks how to do that next time. In your own words: why was the first step a failing test rather than reading the code, how git bisect used that test and why the test had to be automatic and reliable, why the existing test never caught the bug, what characterization tests would have done for the "tidy" commit, and what rule about commits would have made the bisect result unambiguous. Use the late-fee numbers.',
      estimatedMinutes: 12,
      referenceAnswer:
        'The first step was a failing test because a ticket is a claim and a test is a fact. Writing lateFeeCents(10000, 20) and expecting 200 turned "finance says the fee is wrong" into something that fails in a tenth of a second at a desk, so every theory about the cause could be checked instantly instead of argued, and the fix could not regress later because the test stays. It also forced the expected value to be stated precisely: twenty days late is ten past grace, one full week, 200 cents, which is the policy, not the ticket\'s number.\n\ngit bisect took that test as its oracle. Given a known-bad commit, HEAD, and a known-good one, the commit that added the fee, it checked out the middle commit, ran the test, and used pass or fail to discard half the range, then repeated. Eight commits took three runs and named "tidy late fee rounding" as the first bad commit. The test had to be automatic, because bisect run needs a command that exits non-zero on bad, and reliable, because a flaky check would have sent the search to the wrong commit; a manual "does it look right" cannot be halved.\n\nThe existing test never caught the bug because it checked one input, 24 days, where the two rounding rules agree: fourteen days past grace is exactly two weeks whether you floor or ceil, so 400 was right before and after the change. The commit changed two lines, the grace comparison from inclusive of day 10 to exclusive and the week count from rounding down to rounding up; only the rounding change alters any output, since day 10 yields zero weeks either way, and the single test sat where floor and ceiling agree.\n\nCharacterization tests would have recorded the current answer at every boundary before the tidy: day 10 charges 0, day 16 charges 0, day 17 charges 200, day 20 charges 200, the cap at 2000. Any of those would have gone red the moment the comparison or the rounding changed, and the author would have seen that "tidy" was not a tidy.\n\nThe rule is that a refactor never shares a commit with a behavior change. Had the boundary changes been intended, they belonged in their own commit with their own tests and a message naming the new policy; then a bisect landing on it would say what changed and why, and a reviewer of the tidy commit would have seen only structure.',
      rubric: [
        {
          id: 'reproduce-first',
          label: 'Reproduction before theory',
          description:
            'Explains that the failing test made the bug a fast, repeatable fact, forced a precise expected value, and remains as a regression guard.',
        },
        {
          id: 'bisect-mechanics',
          label: 'Bisect explained with its precondition',
          description:
            'Describes halving between known-good and known-bad commits using the test as the oracle, and states that the check must be automatic and reliable for bisect run to land on the right commit.',
        },
        {
          id: 'coverage-gap',
          label: 'Why the existing test missed it',
          description:
            'Points out that 24 days is where floor and ceiling agree, so a single happy-path test was silent exactly where the rounding change bites, and names characterization tests at the boundaries as the guard.',
        },
        {
          id: 'commit-discipline',
          label: 'Refactor and behavior change kept apart',
          description:
            'States that a cleanup commit must not change behavior, and that intended policy changes belong in their own commit with tests and a message, so bisect and review are unambiguous.',
        },
      ],
    },
    {
      id: 'strangler-pricing-plan',
      kind: 'design',
      completionMode: 'submitted-with-rubric-review',
      title: 'Plan the replacement of a legacy pricing module',
      prompt:
        'Plan how to replace the legacy pricing module described in the scenario without a feature freeze, and defend your approach to the parts that cannot be tested first.',
      estimatedMinutes: 25,
      scenario:
        'A storefront\'s pricing module is 2,400 lines in one file, written over six years, with no tests. It handles four kinds of input: plain orders, orders with promo codes, wholesale orders with tiered pricing, and a legacy "partner" order type that two customers still use and nobody fully understands. It is called from checkout, from the admin quote tool, and from a nightly report, and a bug in it last quarter over-discounted wholesale orders for a week before anyone noticed. The team needs to add a new subscription order type in the next two months, and the current code cannot express it. A rewrite was proposed and rejected because nothing could ship until it was finished.',
      sections: [
        {
          id: 'safety-net',
          type: 'short-answer',
          label: 'The safety net',
          prompt:
            'Describe how you would build characterization tests for the module before changing it: where the inputs come from, how expected values are chosen, and what you do with an answer that looks wrong.',
        },
        {
          id: 'paths',
          type: 'entity-list',
          label: 'Replacement order',
          prompt:
            'List the order in which the four existing input kinds and the new subscription type move to new code, with the reason for each position and how traffic is routed between old and new during the transition.',
        },
        {
          id: 'partner-orders',
          type: 'tradeoff',
          label: 'The partner order type',
          prompt:
            'Nobody understands the partner path and two customers depend on it. Choose how to handle it and justify the choice with the risk and the two-month deadline.',
          options: [
            'Characterize it from production inputs and leave it on the old code until last, or indefinitely',
            'Rewrite it from the two customers\' contracts and switch them over first, since the surface is small',
          ],
        },
        {
          id: 'detection',
          type: 'short-answer',
          label: 'Catching regressions',
          prompt:
            'The wholesale bug went unnoticed for a week. Describe how the transition detects a pricing difference between old and new code before customers do, and what happens when one is found.',
        },
      ],
      rubric: [
        {
          id: 'characterization-plan',
          label: 'Characterization tests built from real inputs',
          description:
            'Captures representative inputs from production or logs for each input kind, records the current outputs as expectations without judging them, files surprising answers as separate findings, and gets the grid green before any change.',
        },
        {
          id: 'strangler-order',
          label: 'Path-by-path replacement with routing',
          description:
            'Moves one input kind at a time behind a switch, starting with the best-understood or the one blocking the new feature, builds the subscription type on the new code, and deletes old code only when nothing routes to it.',
        },
        {
          id: 'partner-tradeoff',
          label: 'Partner path decided from risk',
          description:
            'Either option can earn credit, but the answer must weigh the unknown behavior and two dependent customers against the deadline, and explain how the chosen option avoids breaking those customers.',
        },
        {
          id: 'shadow-comparison',
          label: 'Old and new compared before cutover',
          description:
            'Runs the new code in shadow alongside the old for real inputs, compares outputs, alerts on any difference, and treats a difference as a stop-and-investigate rather than a silent cutover.',
        },
      ],
      referenceAnswer:
        'Safety net. Capture real inputs before touching anything: sample orders of each of the four kinds from production logs or the database, a few hundred per kind, weighted toward the boundaries the code has conditionals for, and run them through the current module to record its outputs. Those recorded outputs become the expected values of the characterization tests, exactly as the module answers today, right or wrong. When an answer looks wrong, and some will, file it as a separate finding with the input attached and keep the recorded value in the test, because the test\'s job is to detect change, not to define the policy; changing the policy is a later commit with its own test. Run the grid on every change to the file from now on.\n\nReplacement order. First, plain orders: the best-understood path with the most traffic and the simplest rules, which proves the routing switch and the new module\'s shape. Second, the new subscription type, built only on the new code, because it is the deadline and the old code cannot express it; nothing about it needs the legacy path. Third, promo codes, which share most of their logic with plain orders. Fourth, wholesale tiers, which had last quarter\'s bug and therefore need the most careful comparison before cutover. Last, partner orders. Routing is a switch at the module entry that sends each input kind to old or new code by a flag per kind, so a path can move and move back without a deploy, and all three callers, checkout, the quote tool, and the nightly report, go through the same switch so no caller is left on old code by accident. The old file is deleted when every kind routes to new code.\n\nPartner orders. Characterize from production inputs and leave them on the old code until last, possibly indefinitely. Two customers depend on behavior nobody can describe, so a rewrite from their contracts would be a rewrite from documents that may not match what the code does, and a difference would surface as a wrong invoice to a customer. The recorded outputs from real partner orders pin the current behavior, the switch keeps those orders on the code that produces it, and the deadline is unaffected because the subscription type never touches that path. If the partner path must move later, it moves with its characterization grid green and a shadow comparison, with the two customers told in advance.\n\nDetection. Before any path cuts over, the new code runs in shadow: every real input for that kind is priced by both old and new, the old answer is used, and the pair is logged and compared. Any difference raises an alert with the input attached, and it is a stop, not a note, because the wholesale incident was exactly a silent difference that ran for a week. A difference is either a bug in the new code, fixed and re-shadowed, or a bug in the old code, which becomes a filed finding and a deliberate policy decision before cutover. Cutover happens after a clean week of shadow traffic for that kind, and the switch stays in place for a week after so a rollback is a flag flip rather than a deploy.',
    },
  ],
  approaches: {
    'fix-late-fee-boundaries': [
      {
        name: 'Reverse both lines of the tidy, and know which one mattered',
        code: `// Late fee: nothing through the tenth day late, then 2% of the total per
// full week past the grace period, capped at 20%.
export function lateFeeCents(totalCents: number, daysLate: number): number {
  // The grace period includes day 10, so the fee starts on day 11.
  if (daysLate <= 10) return 0

  // Only completed weeks count: days 11 through 16 are zero weeks.
  const weeksLate = Math.floor((daysLate - 10) / 7)
  const rate = Math.min(0.02 * weeksLate, 0.2)

  return Math.round(totalCents * rate)
}`,
        explanation:
          'Both lines of the bisected diff are reversed. The week count goes back to floor so a partial week does not charge as a full one, which is the change that produced the 400. The grace comparison goes back to less-than-or-equal to say what the policy says, though it never changed an output: on day 10 the week count is zero under either comparison, which is why the day-10 test documents the policy rather than catching the bug. The tests pin every boundary the single original test missed: the last grace day, the six days before the first full week, the first full week at day 17, the reported 20-day case, the 24-day case where both roundings agreed, and the cap. With those in the suite, the next commit that touches a comparison in this function turns red at the exact input it changed, which is what the tidy commit needed and did not have.',
        complexity:
          'O(1) time and space. The guarantee that matters is that the fee is now pinned at every boundary of the policy, not at one point where two readings coincide.',
      },
    ],
    'refactor-legacy-shipment': [
      {
        name: 'A rate table instead of four branches',
        code: `type Order = {
  id: number
  country: string
  totalCents: number
  express: boolean
  items: number
}

type Shipment = { carrier: string; costCents: number; label: string }

// The four copy-pasted branches were this table: a base rate by zone and
// speed, and a free-shipping threshold that depends only on speed.
const baseRateCents = {
  domestic: { express: 1500, ground: 500 },
  international: { express: 3500, ground: 1500 },
}
const freeAboveCents = { express: 10000, ground: 5000 }

export function describeShipment(order: Order): Shipment {
  const zone = order.country === 'US' ? 'domestic' : 'international'
  const speed = order.express ? 'express' : 'ground'
  const carrier = order.express ? 'FastPost' : 'GroundCo'

  const baseCost = order.totalCents >= freeAboveCents[speed] ? 0 : baseRateCents[zone][speed]
  // The bulk surcharge applies even when the base shipping is free.
  const costCents = baseCost + (order.items > 5 ? 200 : 0)

  const price = costCents === 0 ? 'free' : \`\${costCents}c\`
  return { carrier, costCents, label: \`Order #\${order.id} via \${carrier} (\${price})\` }
}`,
        explanation:
          'Reading the four branches side by side shows they differ only in two numbers each, which is the signature of a table pretending to be code. The refactor names the two axes, zone and speed, looks the base rate up, and expresses the free-shipping rule once, since its threshold depends only on speed. Each step was made with the characterization tests green: extract the carrier choice, extract the rate table, replace the branches with the lookup, delete the branches, then remove the side effect. That last step matters beyond tidiness. The original added the shipping cost to the order\'s total in place, so every caller that reused the order object afterward saw a changed total, and any test that shared a fixture across calls got a different answer on the second call; the no-mutation check exists so the refactor cannot keep that behavior by accident. The bulk surcharge is applied after the free-shipping decision on purpose, because the characterization test for six items on a free order pins that a free order still pays the surcharge.',
        complexity:
          'O(1) time and space. The guarantee that matters is behavioral equivalence: every characterization test that was green before the refactor is green after it, and the input is no longer modified.',
      },
    ],
  },
}
