import Concept from './concept.mdx'

import type { Lesson } from '../../types'

const twentyRuns = [
  ...Array.from({ length: 19 }, () => 'pass' as const),
  'fail' as const,
]

export const lesson: Lesson = {
  slug: 'end-to-end-testing',
  title: 'End-to-End Testing',
  summary:
    'Use E2E tests for critical user flows while managing cost and flake risk.',
  track: 'production',
  order: 57,
  concept: Concept,
  problems: [
    {
      id: 'fix-wait-for-condition',
      kind: 'debug',
      completionMode: 'all-tests-pass',
      title: 'Fix the helper that waits for a condition',
      prompt:
        'waitForCondition is the polling loop behind every "wait until the status appears" step, written as a pure function so its timing can be tested exactly. It receives the condition\'s result at each poll as an array of booleans (poll 1 is index 0, and a missing entry means the condition was still false), the interval between polls in milliseconds, and the timeout. Polls happen at 0 ms, then every interval, for as long as the elapsed time is less than or equal to the timeout. Return `{ ok: true, elapsedMs, polls }` for the first poll where the condition holds, with elapsedMs the time of that poll and polls the number of polls made. If the timeout passes first, return `{ ok: false, elapsedMs: timeoutMs, polls }` with the number of polls made. In production the helper checks once and gives up, so tests fail whenever a page needs more than an instant. Example: `waitForCondition([false, false, false, true], 100, 5000)` returns `{ ok: true, elapsedMs: 300, polls: 4 }`.',
      estimatedMinutes: 15,
      functionName: 'waitForCondition',
      brokenCode: `type WaitResult = { ok: boolean; elapsedMs: number; polls: number }

export function waitForCondition(
  checks: boolean[],
  intervalMs: number,
  timeoutMs: number,
): WaitResult {
  // Check the condition and report what we found.
  const holds = checks[0] ?? false
  return { ok: holds, elapsedMs: 0, polls: 1 }
}

console.log(waitForCondition([false, false, false, true], 100, 5000))
`,
      bugHints: [
        'How many times does the broken helper look at the condition? What does "wait" mean if it looks once?',
        'Keep polling while the elapsed time is still within the timeout, advancing by the interval after each false result.',
        'A poll that lands exactly at the timeout still counts. After that, stop and report the timeout, not the next poll time.',
      ],
      tests: [
        {
          name: 'succeeds immediately when the condition already holds',
          args: [[true], 50, 1000],
          expected: { ok: true, elapsedMs: 0, polls: 1 },
        },
        {
          name: 'keeps polling until the condition becomes true',
          args: [[false, false, false, true], 100, 5000],
          expected: { ok: true, elapsedMs: 300, polls: 4 },
        },
        {
          name: 'gives up at the timeout and reports it',
          args: [[false, false, false], 100, 250],
          expected: { ok: false, elapsedMs: 250, polls: 3 },
        },
        {
          name: 'succeeds on a poll that lands exactly at the timeout',
          args: [[false, false, true], 100, 200],
          expected: { ok: true, elapsedMs: 200, polls: 3 },
        },
        {
          name: 'treats missing checks as the condition still being false',
          args: [[false], 100, 350],
          expected: { ok: false, elapsedMs: 350, polls: 4 },
        },
        {
          name: 'does not poll again after the timeout',
          args: [[false, false, false, false, true], 100, 300],
          expected: { ok: false, elapsedMs: 300, polls: 4 },
        },
        {
          name: 'a zero timeout still checks once',
          args: [[false, true], 100, 0],
          expected: { ok: false, elapsedMs: 0, polls: 1 },
        },
      ],
    },
    {
      id: 'classify-test-runs',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Find the flaky tests in the run history',
      prompt:
        'Implement `classifyTestRuns`. It receives the suite\'s run history as a record from test name to an array of outcomes, each "pass" or "fail", oldest first, and returns one report per test: `{ name, status, failRate }`. failRate is failures divided by runs, rounded to two decimal places. status is "stable" when no run failed, "broken" when every run failed, and "flaky" otherwise. Tests with no recorded runs are left out. Sort the reports by failRate descending, then by name ascending. Example: `classifyTestRuns({ "checkout completes": ["pass", "pass"], "toast appears after save": ["pass", "fail"] })` returns `[{ name: "toast appears after save", status: "flaky", failRate: 0.5 }, { name: "checkout completes", status: "stable", failRate: 0 }]`.',
      estimatedMinutes: 15,
      functionName: 'classifyTestRuns',
      starter: `type Outcome = 'pass' | 'fail'

type TestReport = {
  name: string
  status: 'stable' | 'flaky' | 'broken'
  failRate: number
}

export function classifyTestRuns(
  history: Record<string, Outcome[]>,
): TestReport[] {
  return []
}

console.log(
  classifyTestRuns({
    'checkout completes': ['pass', 'pass'],
    'toast appears after save': ['pass', 'fail'],
  }),
)
`,
      tests: [
        {
          name: 'labels always-passing, sometimes-failing, and always-failing tests',
          args: [
            {
              'checkout completes': ['pass', 'pass', 'pass', 'pass'],
              'toast appears after save': ['pass', 'fail', 'pass', 'fail'],
              'legacy export': ['fail', 'fail', 'fail', 'fail'],
            },
          ],
          expected: [
            { name: 'legacy export', status: 'broken', failRate: 1 },
            { name: 'toast appears after save', status: 'flaky', failRate: 0.5 },
            { name: 'checkout completes', status: 'stable', failRate: 0 },
          ],
        },
        {
          name: 'rounds the fail rate to two decimals',
          args: [{ a: ['fail', 'pass', 'pass'] }],
          expected: [{ name: 'a', status: 'flaky', failRate: 0.33 }],
        },
        {
          name: 'orders equal rates by name',
          args: [{ b: ['pass'], a: ['pass'] }],
          expected: [
            { name: 'a', status: 'stable', failRate: 0 },
            { name: 'b', status: 'stable', failRate: 0 },
          ],
        },
        {
          name: 'a single failing run is broken, not flaky',
          args: [{ once: ['fail'] }],
          expected: [{ name: 'once', status: 'broken', failRate: 1 }],
        },
        {
          name: 'skips tests with no recorded runs',
          args: [{ never: [], ran: ['pass'] }],
          expected: [{ name: 'ran', status: 'stable', failRate: 0 }],
        },
        {
          name: 'returns an empty report for an empty history',
          args: [{}],
          expected: [],
        },
        {
          name: 'a test that failed once in twenty runs is still flaky',
          args: [{ login: twentyRuns }],
          expected: [{ name: 'login', status: 'flaky', failRate: 0.05 }],
        },
      ],
    },
    {
      id: 'e2e-trust-review',
      kind: 'written',
      completionMode: 'submitted-with-reference-review',
      title: 'Explain the 177 milliseconds',
      prompt:
        'A teammate reads the opener, sees the one-second sleep pass, and proposes adding a one-second sleep after every click in the suite plus two automatic retries for good measure. In your own words: why did the first version fail at 177 milliseconds, why is the sleep not a fix even though it passed, what the correct wait looks like and why it is both faster and more reliable, why retries make things worse, and what an end-to-end suite should and should not cover. Use the transcript numbers.',
      estimatedMinutes: 12,
      referenceAnswer:
        'The first version failed because it read the status line 177 milliseconds after the test started, and the server takes about 300 milliseconds to answer the save. The page was correct; the test asked its question before the answer existed. Nothing in the test waited for the outcome it was asserting.\n\nThe one-second sleep passed because one second happens to be longer than 300 milliseconds on that machine on that day. It is a guess about timing, and the transcript already shows the guess failing at 100 milliseconds. On a slower CI runner, or when the server is under load, one second will be too short too, and the test will fail with no code change. Meanwhile every passing run waits the full second, so a 300-millisecond feature costs 1103 milliseconds to check, and a suite of such tests spends most of its time asleep.\n\nThe correct wait polls for the condition, the status region containing "Saved", and stops the moment it holds, giving up only after a generous timeout such as five seconds. The transcript shows it passing in about 890 milliseconds including browser startup and navigation, faster than the sleep, and it would pass on a machine ten times slower because the limit is not a guess about the normal case but a ceiling on the pathological one. It fails only when the status genuinely never appears, which is the one thing the test exists to detect.\n\nAutomatic retries hide the race instead of fixing it. A test that fails one run in four and is retried twice shows green almost always, so nobody looks at the timing bug in the test, or the real race in the product that the flake may be pointing at. The honest tool is a record of every run and a failure rate per test, so broken tests block the merge, flaky tests are quarantined with an owner, and stable tests are trusted.\n\nThe suite should cover the flows whose failure is an incident: sign up, sign in, the core action, the payment. Each test creates its own user and data with unique identifiers so tests do not share state, finds elements by role and accessible name so markup changes do not break them, and runs against an environment nobody else is writing to. Everything else, validation messages, edge cases, error paths, belongs to unit and integration tests that run in milliseconds and say exactly what broke.',
      rubric: [
        {
          id: 'timing-diagnosed',
          label: 'Diagnoses the timing failure',
          description:
            'Explains that the assertion ran before the 300 ms server response, using the 177 ms figure, and that the page itself was correct.',
        },
        {
          id: 'sleep-rejected',
          label: 'Rejects the sleep with reasons',
          description:
            'Argues that a fixed sleep is a timing guess that fails on slower machines and wastes time on every passing run, citing the 100 ms failure and the 1103 ms pass.',
        },
        {
          id: 'condition-wait',
          label: 'Describes the condition wait',
          description:
            'Describes polling for the outcome with a generous timeout, notes it finished faster than the sleep in the transcript, and explains why it is reliable on slow machines.',
        },
        {
          id: 'retries-and-scope',
          label: 'Retries and suite scope',
          description:
            'Explains that automatic retries hide flakes and possible product races, proposes measuring failure rates instead, and limits the suite to critical flows with per-test data and role-based locators.',
        },
      ],
    },
    {
      id: 'book-club-e2e-plan',
      kind: 'design',
      completionMode: 'submitted-with-rubric-review',
      title: 'Plan the end-to-end suite for the book club app',
      prompt:
        'Design the end-to-end suite for the book club app: which flows it covers, how each test gets its data, where it runs, and how flaky tests are handled.',
      estimatedMinutes: 25,
      scenario:
        'The book club app from the backend track now has a web client. Users sign up with an email, sign in, browse clubs, open a club, join it, leave it, and club owners add picks to the reading list. The team has unit tests for the client components and the API handlers, and integration tests for the API against a real database. They have no browser tests. A pull request pipeline must finish in under ten minutes. The staging environment is shared with the product team, who use it for demos and sometimes delete clubs during them. Last month a release shipped with the join button posting to a route that had been renamed; every unit test passed.',
      sections: [
        {
          id: 'flows',
          type: 'entity-list',
          label: 'Flows to cover',
          prompt:
            'List the end-to-end tests you would write, each as a user flow, and for each say why it earns a browser test rather than being left to unit or integration tests. Name at least one thing you would deliberately not cover end to end.',
        },
        {
          id: 'data',
          type: 'short-answer',
          label: 'Test data',
          prompt:
            'Describe how each test gets a user, a club, and membership state to work with, how tests avoid depending on each other, and what cleanup is needed.',
        },
        {
          id: 'environment',
          type: 'tradeoff',
          label: 'Where the suite runs',
          prompt:
            'Choose the environment the suite runs against on every pull request and justify it with the shared staging problem and the ten-minute budget.',
          options: [
            'Start the full application and a fresh database inside the pipeline for each run',
            'Run against the shared staging environment with test accounts',
          ],
        },
        {
          id: 'flakes',
          type: 'short-answer',
          label: 'Waiting and flakes',
          prompt:
            'State the rule tests follow for waiting on the page, how elements are located, and the policy when a test starts failing intermittently.',
        },
      ],
      rubric: [
        {
          id: 'critical-flows-only',
          label: 'Critical flows, with reasons',
          description:
            'Covers sign up, sign in, join and leave, and an owner adding a pick, justified by the wiring they exercise (the renamed-route incident), and explicitly leaves validation messages and edge cases to lower-level tests.',
        },
        {
          id: 'per-test-data',
          label: 'Each test creates its own data',
          description:
            'Tests create a fresh user with a unique email and their own club through the app or a seeding route, never depend on rows another test or a demo left behind, and cleanup is not load-bearing.',
        },
        {
          id: 'environment-tradeoff',
          label: 'Environment argued from the scenario',
          description:
            'Either option can earn credit, but the answer must address the product team deleting clubs on shared staging and the ten-minute budget, and describe how a per-run environment is started or how staging interference is prevented.',
        },
        {
          id: 'wait-and-flake-policy',
          label: 'Waiting rule and flake policy',
          description:
            'States that tests wait for conditions with a timeout and never sleep for a duration, locate by role and accessible name, and handle intermittent failures by measuring failure rate and quarantining with an owner rather than retrying.',
        },
      ],
      referenceAnswer:
        'Flows. Five browser tests: sign up and land signed in; sign in with an existing account; open a club and join it, then see the member count and the leave button change; leave a club; and, as an owner, add a pick and see it in the reading list. Each crosses the seam the unit tests cannot see, the client calling the real route with the real payload and rendering the real response, which is exactly where the renamed-route incident lived. Deliberately not covered end to end: every validation message on the sign-up form, error states for a failing network, pagination edge cases on the club list, and permission refusals for non-owners. Those have precise unit and integration tests already, and each would add seconds and a new way to flake for no wiring the five flows do not already exercise.\n\nData. Every test creates its own user through the real sign-up flow or a test-only seeding endpoint, with an email containing a unique run identifier, so no two tests and no two runs touch the same account. Tests that need a club create one as that user; the join test creates a club under a second fresh user and joins it as the first. Nothing reads a row it did not create, so order and parallelism do not matter, and cleanup is a courtesy: a nightly job deletes test-tagged users, but a crashed run leaving data behind cannot fail anyone.\n\nEnvironment. Start the application and a fresh database inside the pipeline for each run. Shared staging is used for demos and the product team deletes clubs during them, so a test that created a club and then found it gone would fail for reasons that have nothing to do with the code, and the suite would be red on demo days. A per-run environment costs startup time, around a minute for the app and a database container with migrations applied, which fits the ten-minute budget with five tests that each take a few seconds, and it makes every run start from the same known state. Staging with test accounts is defensible only if the team can guarantee isolation, for example a dedicated tenant nobody else touches, which this scenario says they cannot.\n\nWaiting and flakes. Tests wait for conditions with a generous timeout and never for a duration: after clicking Join, wait for the leave button to appear, not for a second to pass. Elements are found by role and accessible name, so the join button is found as the button named Join and the member count as its labelled region, which survives markup changes and doubles as an accessibility check. Every run records each test\'s outcome; a test that fails every run blocks the merge, one that fails intermittently is quarantined the same day with an owner and a deadline, and the fix is found by reading the failure artifacts, a screenshot and network log captured on failure, rather than by adding retries.',
    },
  ],
  approaches: {
    'fix-wait-for-condition': [
      {
        name: 'Poll until the condition holds or the timeout passes',
        code: `type WaitResult = { ok: boolean; elapsedMs: number; polls: number }

export function waitForCondition(
  checks: boolean[],
  intervalMs: number,
  timeoutMs: number,
): WaitResult {
  let elapsedMs = 0
  let polls = 0

  // Keep looking while there is still time, including a poll that lands
  // exactly on the timeout. Each poll reads the next scripted result.
  while (elapsedMs <= timeoutMs) {
    polls += 1
    if (checks[polls - 1] === true) {
      return { ok: true, elapsedMs, polls }
    }
    elapsedMs += intervalMs
  }

  // Out of time: report the timeout itself, not the time of a poll that
  // never happened.
  return { ok: false, elapsedMs: timeoutMs, polls }
}`,
        explanation:
          'The broken helper looked once and reported, which is the opener\'s immediate assertion wearing a helper\'s name. The fix is the loop: poll, and if the condition does not hold, advance by the interval and poll again while the elapsed time is still within the timeout. Two edges carry the tests. The loop condition uses less-than-or-equal so a poll that lands exactly at the timeout still counts, which is what lets a condition that becomes true at 200 ms succeed under a 200 ms limit. And the failure branch reports the timeout as the elapsed time rather than the next poll time, because the caller asked how long it waited, not when it would have looked next. In a real browser library the scripted booleans are replaced by evaluating a locator, but the loop, the interval, and the ceiling are the same.',
        complexity:
          'O(t / i) polls for timeout t and interval i, O(1) space. The guarantee that matters is that the wait ends as soon as the condition holds and never later than the timeout.',
      },
    ],
    'classify-test-runs': [
      {
        name: 'Count failures, name the pattern, sort by rate',
        code: `type Outcome = 'pass' | 'fail'

type TestReport = {
  name: string
  status: 'stable' | 'flaky' | 'broken'
  failRate: number
}

export function classifyTestRuns(
  history: Record<string, Outcome[]>,
): TestReport[] {
  const reports: TestReport[] = []

  for (const [name, runs] of Object.entries(history)) {
    // A test with no runs has no rate, so it has no report.
    if (runs.length === 0) continue

    const failures = runs.filter((run) => run === 'fail').length
    const failRate = Math.round((failures / runs.length) * 100) / 100

    // Always failing is a broken test; sometimes failing is the flake the
    // lesson warned about; never failing is the only kind worth trusting.
    const status =
      failures === 0 ? 'stable' : failures === runs.length ? 'broken' : 'flaky'

    reports.push({ name, status, failRate })
  }

  // Worst offenders first, with a stable name order for equal rates.
  return reports.sort(
    (a, b) => b.failRate - a.failRate || a.name.localeCompare(b.name),
  )
}`,
        explanation:
          'The classifier turns a run history into the three categories that need different responses. The rate is failures over runs, rounded to two decimals so 1 in 3 reads as 0.33 and reports are comparable. The status is decided by the two boundaries, zero failures and all failures, with everything between them flaky, which is why a single failure in twenty runs is still flaky: it happened, and a retry policy would have hidden it. Tests with no runs are skipped rather than reported as stable, because a rate of zero over zero runs would be a claim the data does not support. Sorting by rate descending with a name tiebreaker puts the tests that need attention at the top of the report and keeps the order deterministic.',
        complexity:
          'O(r + t log t) time for r total runs across t tests, O(t) space. The guarantee that matters is that any test with at least one failure among passes is surfaced as flaky, never averaged into stable.',
      },
    ],
  },
}
