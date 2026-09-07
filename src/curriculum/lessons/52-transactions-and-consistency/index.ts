import Concept from './concept.mdx'

import type { Lesson } from '../../types'

export const lesson: Lesson = {
  slug: 'transactions-and-consistency',
  title: 'Transactions and Consistency',
  summary:
    'Protect multi-step data changes with transactional thinking and consistency rules.',
  track: 'backend-data',
  order: 52,
  concept: Concept,
  problems: [
    {
      id: 'lost-update-trace',
      kind: 'trace',
      completionMode: 'structured-answer-correct',
      title: 'Trace two concurrent withdrawals',
      prompt:
        'Two withdrawals of 80 run at the same time against an account holding 100. The database is simulated with zero-delay timers, so every read and write yields to the event loop. Read the program without running it, predict the console output in order and the final balance, then answer the questions.',
      estimatedMinutes: 12,
      code: `let balance = 100

function readBalance(): Promise<number> {
  return new Promise((resolve) => setTimeout(() => resolve(balance), 0))
}

function writeBalance(next: number): Promise<void> {
  return new Promise((resolve) =>
    setTimeout(() => {
      balance = next
      resolve()
    }, 0),
  )
}

async function withdraw(who: string, amount: number) {
  const current = await readBalance()
  console.log(\`\${who} read \${current}\`)
  if (current < amount) {
    console.log(\`\${who} rejected\`)
    return
  }
  await writeBalance(current - amount)
  console.log(\`\${who} wrote \${current - amount}\`)
}

await Promise.all([withdraw('ada', 80), withdraw('grace', 80)])
console.log(\`final balance \${balance}\`)
`,
      questions: [
        {
          id: 'output-order',
          type: 'output-order',
          label: 'Which lines print, in order?',
          options: [
            'ada read 100',
            'ada rejected',
            'ada wrote 20',
            'final balance 20',
            'final balance -60',
            'grace read 100',
            'grace read 20',
            'grace rejected',
            'grace wrote 20',
          ],
          expected: [
            'ada read 100',
            'grace read 100',
            'ada wrote 20',
            'grace wrote 20',
            'final balance 20',
          ],
        },
        {
          id: 'final-balance',
          type: 'final-value',
          label: 'What is the value of balance when the program ends?',
          variable: 'balance',
          expected: 20,
        },
        {
          id: 'why-both-read-100',
          type: 'multiple-choice',
          label: "Why does grace read 100 rather than 20?",
          options: [
            "both reads are scheduled before either write runs: ada's read resolves, then grace's read resolves, and ada's write is queued after both",
            'setTimeout callbacks run in reverse order of scheduling',
            'the await in withdraw blocks the whole program until ada finishes',
            'readBalance returns a cached value from the first call',
          ],
          answer:
            "both reads are scheduled before either write runs: ada's read resolves, then grace's read resolves, and ada's write is queued after both",
        },
        {
          id: 'which-fix',
          type: 'multiple-choice',
          label:
            'Which single change to the write makes it impossible for both withdrawals to succeed?',
          options: [
            'have writeBalance apply the change only if the balance still covers the amount, so the second write finds 20 and rejects',
            'add a second await before readBalance so the reads are spaced out',
            'log the balance before and after each write',
            'run the two withdrawals with Promise.allSettled instead of Promise.all',
          ],
          answer:
            'have writeBalance apply the change only if the balance still covers the amount, so the second write finds 20 and rejects',
        },
      ],
      explanation:
        "Promise.all starts both withdrawals synchronously. Each calls readBalance, which schedules a timer, and then suspends at its await. Two timers are now queued, ada's first. The event loop runs ada's timer: it resolves with 100, and ada's continuation is queued as a microtask, which prints 'ada read 100' and schedules ada's write timer. Grace's read timer was queued before that write timer, so it runs next and also resolves with 100, printing 'grace read 100' and scheduling grace's write. Then ada's write sets balance to 20 and prints 'ada wrote 20', and grace's write sets balance to 20 again, printing 'grace wrote 20'. Both checks passed against the same stale 100, and the final balance is 20 after 160 was withdrawn, the lost update from the lesson. The fix that closes the gap is to make the write conditional on the current value, the single-statement form of the lesson's second fix; spacing out reads or changing how the promises are collected does not stop two handlers from deciding on the same stale number.",
    },
    {
      id: 'apply-optimistic-writes',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Apply versioned writes optimistically',
      prompt:
        'Implement `applyOptimisticWrites`. It receives an account `{ balance, version }` and a list of writes `{ id, expectedVersion, delta }` in the order they reach the database, and applies them one at a time with optimistic concurrency. A write whose `expectedVersion` does not equal the account\'s current version is a conflict: it changes nothing and is reported as `{ id, status: "conflict" }`. A write whose version matches but would take the balance below zero changes nothing, leaves the version unchanged, and is reported as `{ id, status: "insufficient" }`. Otherwise the delta is applied, the version increases by one, and the write is reported as `{ id, status: "applied" }`. Return `{ account, outcomes }` with the final account and one outcome per write in input order. Never mutate the input account. Example: `applyOptimisticWrites({ balance: 100, version: 1 }, [{ id: "ada", expectedVersion: 1, delta: -80 }, { id: "grace", expectedVersion: 1, delta: -80 }])` returns `{ account: { balance: 20, version: 2 }, outcomes: [{ id: "ada", status: "applied" }, { id: "grace", status: "conflict" }] }`.',
      estimatedMinutes: 15,
      functionName: 'applyOptimisticWrites',
      starter: `type Account = { balance: number; version: number }

type Write = { id: string; expectedVersion: number; delta: number }

type Outcome = { id: string; status: 'applied' | 'conflict' | 'insufficient' }

export function applyOptimisticWrites(
  account: Account,
  writes: Write[],
): { account: Account; outcomes: Outcome[] } {
  return { account, outcomes: [] }
}

console.log(
  applyOptimisticWrites({ balance: 100, version: 1 }, [
    { id: 'ada', expectedVersion: 1, delta: -80 },
    { id: 'grace', expectedVersion: 1, delta: -80 },
  ]),
)
`,
      tests: [
        {
          name: 'applies a write whose expected version matches and bumps the version',
          args: [{ balance: 100, version: 1 }, [{ id: 'w1', expectedVersion: 1, delta: -80 }]],
          expected: {
            account: { balance: 20, version: 2 },
            outcomes: [{ id: 'w1', status: 'applied' }],
          },
        },
        {
          name: 'rejects the second of two writes that both read version 1',
          args: [
            { balance: 100, version: 1 },
            [
              { id: 'ada', expectedVersion: 1, delta: -80 },
              { id: 'grace', expectedVersion: 1, delta: -80 },
            ],
          ],
          expected: {
            account: { balance: 20, version: 2 },
            outcomes: [
              { id: 'ada', status: 'applied' },
              { id: 'grace', status: 'conflict' },
            ],
          },
        },
        {
          name: 'a retried write carrying the new version is judged on the new balance',
          args: [
            { balance: 100, version: 1 },
            [
              { id: 'ada', expectedVersion: 1, delta: -80 },
              { id: 'grace', expectedVersion: 1, delta: -80 },
              { id: 'grace-retry', expectedVersion: 2, delta: -80 },
            ],
          ],
          expected: {
            account: { balance: 20, version: 2 },
            outcomes: [
              { id: 'ada', status: 'applied' },
              { id: 'grace', status: 'conflict' },
              { id: 'grace-retry', status: 'insufficient' },
            ],
          },
        },
        {
          name: 'rejects a withdrawal that would go negative without changing the version',
          args: [{ balance: 50, version: 3 }, [{ id: 'w1', expectedVersion: 3, delta: -80 }]],
          expected: {
            account: { balance: 50, version: 3 },
            outcomes: [{ id: 'w1', status: 'insufficient' }],
          },
        },
        {
          name: 'allows a withdrawal to exactly zero',
          args: [{ balance: 80, version: 1 }, [{ id: 'w1', expectedVersion: 1, delta: -80 }]],
          expected: {
            account: { balance: 0, version: 2 },
            outcomes: [{ id: 'w1', status: 'applied' }],
          },
        },
        {
          name: 'applies deposits with the same version discipline',
          args: [
            { balance: 10, version: 1 },
            [
              { id: 'd1', expectedVersion: 1, delta: 40 },
              { id: 'd2', expectedVersion: 2, delta: 5 },
            ],
          ],
          expected: {
            account: { balance: 55, version: 3 },
            outcomes: [
              { id: 'd1', status: 'applied' },
              { id: 'd2', status: 'applied' },
            ],
          },
        },
        {
          name: 'returns the account unchanged for an empty batch',
          args: [{ balance: 10, version: 7 }, []],
          expected: { account: { balance: 10, version: 7 }, outcomes: [] },
        },
        {
          name: 'the first of two same-version writes wins, whatever its size',
          args: [
            { balance: 100, version: 1 },
            [
              { id: 'w1', expectedVersion: 1, delta: -1 },
              { id: 'w2', expectedVersion: 1, delta: -1 },
            ],
          ],
          expected: {
            account: { balance: 99, version: 2 },
            outcomes: [
              { id: 'w1', status: 'applied' },
              { id: 'w2', status: 'conflict' },
            ],
          },
        },
      ],
    },
    {
      id: 'fix-transaction-retry',
      kind: 'debug',
      completionMode: 'all-tests-pass',
      title: 'Fix the retry loop around a serializable transaction',
      prompt:
        'runWithRetry models the retry loop around a transaction. To keep it testable it receives the scripted outcome of each attempt, `{ ok: true }` or `{ ok: false, code }` where code is a SQLSTATE such as "40001" (serialization failure), "40P01" (deadlock), or "23505" (unique violation), plus the maximum number of attempts. Walk the attempts in order: a successful attempt returns `{ status: "committed", attempts }`. A failure with a retryable code, "40001" or "40P01", is retried unless this was already attempt number maxAttempts, in which case return `{ status: "failed", attempts, code }` with that code. A failure with any other code returns `{ status: "failed", attempts, code }` immediately, because the same request will fail the same way again. If the script runs out before a commit, return `{ status: "failed", attempts, code: "exhausted" }`. In production the loop retried a duplicate-key violation five times and once looped through serialization failures without limit. Example: `runWithRetry([{ ok: false, code: "23505" }, { ok: true }], 3)` returns `{ status: "failed", attempts: 1, code: "23505" }`.',
      estimatedMinutes: 15,
      functionName: 'runWithRetry',
      brokenCode: `type Attempt = { ok: true } | { ok: false; code: string }

type RetryResult = {
  status: 'committed' | 'failed'
  attempts: number
  code?: string
}

export function runWithRetry(attempts: Attempt[], maxAttempts: number): RetryResult {
  let tries = 0

  // Keep trying until something commits.
  for (const attempt of attempts) {
    tries += 1
    if (attempt.ok) {
      return { status: 'committed', attempts: tries }
    }
  }

  const last = attempts[attempts.length - 1]

  return {
    status: 'failed',
    attempts: tries,
    code: last && !last.ok ? last.code : undefined,
  }
}

console.log(runWithRetry([{ ok: false, code: '23505' }, { ok: true }], 3))
`,
      bugHints: [
        'Which errors mean "nothing is wrong with your data, try again," and which mean the same request will fail identically every time?',
        'The loop never looks at maxAttempts. Where does the cap belong, and what code is reported when it is hit?',
        'When the script ends without a commit and without a non-retryable error, the prompt asks for a specific code.',
      ],
      tests: [
        {
          name: 'commits on the first try',
          args: [[{ ok: true }], 3],
          expected: { status: 'committed', attempts: 1 },
        },
        {
          name: 'retries a serialization failure and commits',
          args: [[{ ok: false, code: '40001' }, { ok: true }], 3],
          expected: { status: 'committed', attempts: 2 },
        },
        {
          name: 'retries a deadlock and commits',
          args: [
            [{ ok: false, code: '40P01' }, { ok: false, code: '40001' }, { ok: true }],
            3,
          ],
          expected: { status: 'committed', attempts: 3 },
        },
        {
          name: 'does not retry a unique violation',
          args: [[{ ok: false, code: '23505' }, { ok: true }], 3],
          expected: { status: 'failed', attempts: 1, code: '23505' },
        },
        {
          name: 'does not retry a check violation',
          args: [[{ ok: false, code: '23514' }, { ok: true }], 3],
          expected: { status: 'failed', attempts: 1, code: '23514' },
        },
        {
          name: 'stops after maxAttempts even when failures stay retryable',
          args: [
            [
              { ok: false, code: '40001' },
              { ok: false, code: '40001' },
              { ok: false, code: '40001' },
              { ok: true },
            ],
            3,
          ],
          expected: { status: 'failed', attempts: 3, code: '40001' },
        },
        {
          name: 'reports exhaustion when the script ends before a commit',
          args: [[{ ok: false, code: '40001' }], 3],
          expected: { status: 'failed', attempts: 1, code: 'exhausted' },
        },
      ],
    },
    {
      id: 'lost-update-review',
      kind: 'written',
      completionMode: 'submitted-with-reference-review',
      title: 'Explain the lost update',
      prompt:
        'A teammate reads the opener and concludes the fix is to wrap the withdrawal handler\'s read and write in BEGIN and COMMIT. In your own words: why did both withdrawals succeed, why does a plain transaction at the default isolation level not prevent it, what are the three fixes the lesson gave and what does each cost, and which one would you choose for the prepaid account and why? Mention which database errors a handler should retry and which it should not.',
      estimatedMinutes: 12,
      referenceAnswer:
        'Both withdrawals succeeded because each handler decided in application code from a value it had read, and the two reads happened before either write. Ada read 100, Grace read 100, Ada wrote 20, Grace wrote 20. Grace\'s check was against a balance that was already stale by the time she acted on it, and her write overwrote Ada\'s. The final 20 after 160 was withdrawn is a lost update.\n\nWrapping the read and write in BEGIN and COMMIT does not stop it, because a transaction promises atomicity, all statements or none, not isolation from other sessions. At the default read committed level each statement sees data committed so far, and nothing prevents another transaction from changing a row this one has already read. The opener\'s sessions were each atomic and the result was still wrong.\n\nThe first fix is a row lock: SELECT ... FOR UPDATE makes the second handler wait until the first commits, so it reads 20 and rejects. It is simple and correct; its cost is waiting, which becomes serious if a handler holds the lock across a network call, and it introduces deadlocks when two transactions lock the same rows in opposite orders, which must be prevented by locking in one agreed order and handled by retry. The second fix is a single conditional statement, UPDATE ... SET balance = balance - 80 WHERE balance >= 80, so the database checks and changes the current row atomically and the second run affects zero rows. It holds no lock across application code and cannot lose an update, but it only works when the whole rule fits in the statement. The third fix is optimistic concurrency: a version column, and a write conditioned on the version the handler read, bumping it on success. Nothing waits and nothing deadlocks; the cost is handling the zero-row conflict case in every handler and retrying more under heavy contention.\n\nFor a prepaid account the rule fits in one statement, so I would choose the conditional update and treat UPDATE 0 as insufficient funds with a 409. If the handler grew to need several reads or a user round trip, I would move to versioned rows. A handler should retry serialization failures (40001) and deadlocks (40P01), because they mean the data is fine and the attempt was unlucky, with a cap on attempts. It should not retry constraint violations such as a duplicate key (23505) or a check failure, because the same request will fail identically every time; those belong to the caller as 4xx responses.',
      rubric: [
        {
          id: 'lost-update-mechanism',
          label: 'Explains the lost update',
          description:
            'Describes both handlers reading 100 before either write, deciding on the stale value, and the second write overwriting the first, giving the 20 after 160 withdrawn.',
        },
        {
          id: 'atomicity-vs-isolation',
          label: 'Separates atomicity from isolation',
          description:
            'Explains that BEGIN and COMMIT give all-or-nothing, not protection from concurrent sessions, and that read committed lets another transaction change a row after this one read it.',
        },
        {
          id: 'three-fixes-with-costs',
          label: 'Names the three fixes and their costs',
          description:
            'Covers row locks (waiting, deadlocks, lock order), single conditional updates (cheapest, only when the rule fits in SQL), and versioned rows (conflict handling, retries under contention).',
        },
        {
          id: 'choice-and-retry-policy',
          label: 'Chooses a fix and a retry policy',
          description:
            'Picks a fix for the prepaid account with a reason, and states that serialization failures and deadlocks are retried with a cap while constraint violations are not.',
        },
      ],
    },
  ],
  approaches: {
    'apply-optimistic-writes': [
      {
        name: 'Check the version, then the rule, then apply',
        code: `type Account = { balance: number; version: number }

type Write = { id: string; expectedVersion: number; delta: number }

type Outcome = { id: string; status: 'applied' | 'conflict' | 'insufficient' }

export function applyOptimisticWrites(
  account: Account,
  writes: Write[],
): { account: Account; outcomes: Outcome[] } {
  // Work on a copy so the caller's account is never edited in place.
  let current: Account = { ...account }
  const outcomes: Outcome[] = []

  for (const write of writes) {
    // The version check is the whole idea: a writer that read an older
    // version is acting on stale data, so its write must not land.
    if (write.expectedVersion !== current.version) {
      outcomes.push({ id: write.id, status: 'conflict' })
      continue
    }

    // The business rule runs on the current balance, which is safe here
    // because the version check just proved nobody changed it since the read.
    if (current.balance + write.delta < 0) {
      outcomes.push({ id: write.id, status: 'insufficient' })
      continue
    }

    // Apply and bump the version together, so every later writer that read
    // the old version will conflict.
    current = {
      balance: current.balance + write.delta,
      version: current.version + 1,
    }
    outcomes.push({ id: write.id, status: 'applied' })
  }

  return { account: current, outcomes }
}`,
        explanation:
          'The function is the database\'s side of optimistic concurrency, made visible. Each write arrives carrying the version its handler read, and the first check compares that against the version the row has now. In the two-withdrawal test both writes carry version 1; the first matches, applies, and moves the row to version 2, so the second finds a mismatch and is reported as a conflict without touching the balance, which is what the UPDATE ... WHERE version = 1 in the lesson does when it affects zero rows. The insufficient case comes after the version check on purpose: a rejected withdrawal is a real decision about current data, so it must be made against a balance the check just proved fresh, and it leaves the version alone because nothing changed. Building a new account object on each applied write, rather than mutating, is what lets the same input account be handed to several calls.',
        complexity:
          'O(n) time for n writes, O(n) space for the outcomes. The guarantee that matters is that two writes carrying the same expected version can never both apply.',
      },
    ],
    'fix-transaction-retry': [
      {
        name: 'Retry only what can succeed on a second try, and cap it',
        code: `type Attempt = { ok: true } | { ok: false; code: string }

type RetryResult = {
  status: 'committed' | 'failed'
  attempts: number
  code?: string
}

// Serialization failures and deadlocks mean the data is fine and the attempt
// was unlucky. Every other SQLSTATE will fail the same way again.
const retryableCodes = new Set(['40001', '40P01'])

export function runWithRetry(attempts: Attempt[], maxAttempts: number): RetryResult {
  let tries = 0

  for (const attempt of attempts) {
    tries += 1

    if (attempt.ok) {
      return { status: 'committed', attempts: tries }
    }

    // A non-retryable error ends the loop at once, and so does hitting the
    // cap: retrying forever turns a contended row into an outage.
    if (!retryableCodes.has(attempt.code) || tries >= maxAttempts) {
      return { status: 'failed', attempts: tries, code: attempt.code }
    }
  }

  // The script ended without a commit or a terminal error.
  return { status: 'failed', attempts: tries, code: 'exhausted' }
}`,
        explanation:
          'The broken loop retried on any failure and stopped only when the script ran out, which is two bugs. Retrying a unique or check violation is wasted work at best, because the same statement fails the same way every time, and at worst it hammers the database five times per bad request; those codes belong to the caller as a 409 or 400. Ignoring maxAttempts meant a row under heavy contention could keep a handler spinning through serialization failures indefinitely. The fix classifies the error first, exactly as lesson 43 classified HTTP failures into transient and permanent: only SQLSTATE 40001 and 40P01 are retried, everything else returns immediately with its code, and a retryable failure on the last permitted attempt returns that code rather than trying again. The exhausted case is kept separate so a caller can tell "the database kept refusing" from "we ran out of scripted attempts."',
        complexity:
          'O(min(n, maxAttempts)) time for n scripted attempts, O(1) space. The guarantee that matters is that no non-retryable error is ever retried and no retryable one is retried more than maxAttempts times.',
      },
    ],
  },
}
