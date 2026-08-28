import Concept from './concept.mdx'

import type { Lesson } from '../../types'

export const lesson: Lesson = {
  slug: 'cancellation-timeouts-and-abortcontroller',
  title: 'Cancellation, Timeouts, and AbortController',
  summary: 'Design async workflows that cancel, time out, and clean up correctly.',
  track: 'js-ts-core',
  order: 24,
  concept: Concept,
  problems: [
    {
      id: 'fix-ignored-signal',
      kind: 'debug',
      completionMode: 'all-tests-pass',
      title: 'Fix the export that ignores its cancel button',
      prompt:
        'runExportJobs simulates an export screen. It runs the jobs in order, and `cancelBeforeJob` is the moment the user presses cancel: just before the job at that index starts (pass a number past the end for a user who never cancels). Pressing cancel should stop the export there, so jobs from that index on never run, and the result should report `cancelled: true`. Right now the cancel press aborts the controller, yet every job still runs. Find the missing half of the handshake. Example: `runExportJobs(["users", "orders", "logs", "metrics"], 2)` should return `{ completed: ["users", "orders"], cancelled: true }`.',
      estimatedMinutes: 15,
      functionName: 'runExportJobs',
      brokenCode: `type ExportOutcome = {
  completed: string[]
  cancelled: boolean
}

export async function runExportJobs(
  jobNames: string[],
  cancelBeforeJob: number,
): Promise<ExportOutcome> {
  const controller = new AbortController()
  const completed: string[] = []

  for (let index = 0; index < jobNames.length; index += 1) {
    // The user presses cancel just before this job starts.
    if (index === cancelBeforeJob) {
      controller.abort()
    }

    // Simulate the job's async work, then record it as done.
    await Promise.resolve()
    completed.push(jobNames[index])
  }

  return { completed, cancelled: controller.signal.aborted }
}

runExportJobs(['users', 'orders', 'logs', 'metrics'], 2).then((outcome) =>
  console.log(outcome),
)
`,
      bugHints: [
        'abort() only flips signal.aborted to true and fires an event. It does not stop any loop by itself.',
        'The cancel side of the handshake is wired up. Where does the work side ever read controller.signal?',
        'Add a checkpoint: before running each job, ask whether the signal has been aborted, and stop if it has.',
      ],
      tests: [
        {
          name: 'stops at the job where cancel arrives',
          args: [['users', 'orders', 'logs', 'metrics'], 2],
          expected: { completed: ['users', 'orders'], cancelled: true },
        },
        {
          name: 'runs nothing when cancel arrives before the first job',
          args: [['users', 'orders'], 0],
          expected: { completed: [], cancelled: true },
        },
        {
          name: 'runs everything when the user never cancels',
          args: [['users', 'orders', 'logs'], 99],
          expected: {
            completed: ['users', 'orders', 'logs'],
            cancelled: false,
          },
        },
        {
          name: 'cancels before the final job',
          args: [['a', 'b', 'c'], 2],
          expected: { completed: ['a', 'b'], cancelled: true },
        },
        {
          name: 'handles an empty job list',
          args: [[], 99],
          expected: { completed: [], cancelled: false },
        },
      ],
    },
    {
      id: 'checkpointed-sync',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Sync records with a cancellation checkpoint',
      prompt:
        'Implement `syncRecords`. It syncs record ids in order, and `abortBeforeRecord` says when cancellation arrives: the controller you create must abort just before the record at that index starts (pass `-1`, or any index past the end, for a run that is never cancelled). Before each record, check the signal at a checkpoint. If the signal is aborted, stop syncing: every remaining record goes into `skipped` in its original order, and `aborted` reports whether the abort happened. Each synced record should involve one `await` to stand in for the network call. Example: `syncRecords(["r1", "r2", "r3", "r4"], 2)` returns `{ synced: ["r1", "r2"], skipped: ["r3", "r4"], aborted: true }`.',
      estimatedMinutes: 18,
      functionName: 'syncRecords',
      starter: `type SyncResult = {
  synced: string[]
  skipped: string[]
  aborted: boolean
}

export async function syncRecords(
  recordIds: string[],
  abortBeforeRecord: number,
): Promise<SyncResult> {
  return { synced: [], skipped: [], aborted: false }
}

syncRecords(['r1', 'r2', 'r3', 'r4'], 2).then((result) => console.log(result))
`,
      tests: [
        {
          name: 'stops at the checkpoint and skips the rest',
          args: [['r1', 'r2', 'r3', 'r4'], 2],
          expected: {
            synced: ['r1', 'r2'],
            skipped: ['r3', 'r4'],
            aborted: true,
          },
        },
        {
          name: 'syncs everything when never aborted',
          args: [['r1', 'r2', 'r3'], -1],
          expected: { synced: ['r1', 'r2', 'r3'], skipped: [], aborted: false },
        },
        {
          name: 'skips everything when aborted before the first record',
          args: [['r1', 'r2', 'r3'], 0],
          expected: { synced: [], skipped: ['r1', 'r2', 'r3'], aborted: true },
        },
        {
          name: 'treats an abort index past the end as never aborted',
          args: [['r1', 'r2'], 5],
          expected: { synced: ['r1', 'r2'], skipped: [], aborted: false },
        },
        {
          name: 'aborts before the final record',
          args: [['r1', 'r2', 'r3'], 2],
          expected: { synced: ['r1', 'r2'], skipped: ['r3'], aborted: true },
        },
        {
          name: 'handles an empty record list',
          args: [[], -1],
          expected: { synced: [], skipped: [], aborted: false },
        },
      ],
    },
    {
      id: 'latest-wins-trace',
      kind: 'trace',
      completionMode: 'structured-answer-correct',
      title: 'Predict which search results render',
      prompt:
        'Read the program below without running it. fakeSearch simulates a request that answers after delayMs, and search follows the keep-latest pattern from the lesson: each call aborts the previous request before starting its own. The user searches "ca" with a slow 30ms response, then immediately searches "cat" with a fast 10ms response. Predict the console output and answer the questions.',
      estimatedMinutes: 12,
      code: `function fakeSearch(
  query: string,
  delayMs: number,
  signal: AbortSignal,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve(\`\${query}-results\`), delayMs)

    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        reject(new Error('aborted'))
      },
      { once: true },
    )
  })
}

let latestController: AbortController | null = null

async function search(query: string, delayMs: number) {
  latestController?.abort()

  const controller = new AbortController()
  latestController = controller

  try {
    const results = await fakeSearch(query, delayMs, controller.signal)
    console.log(\`rendered \${results}\`)
  } catch {
    console.log(\`dropped \${query}\`)
  }
}

search('ca', 30)
search('cat', 10)
`,
      questions: [
        {
          id: 'output-order',
          type: 'output-order',
          label: 'Which lines print, in order?',
          options: [
            'rendered ca-results',
            'dropped ca',
            'rendered cat-results',
            'dropped cat',
          ],
          expected: ['dropped ca', 'rendered cat-results'],
        },
        {
          id: 'why-ca-never-renders',
          type: 'multiple-choice',
          label:
            'The "ca" timer was set for 30ms. Why does "rendered ca-results" never print?',
          options: [
            "search('cat', 10) aborted the ca controller, so the abort listener cleared ca's timer and rejected its promise",
            "the ca timer fired, but its results arrived after cat's and were overwritten on screen",
            'JavaScript automatically discards the older of two pending promises',
            "the 10ms timer resets the 30ms timer because both share the event loop",
          ],
          answer:
            "search('cat', 10) aborted the ca controller, so the abort listener cleared ca's timer and rejected its promise",
        },
        {
          id: 'first-abort-call',
          type: 'multiple-choice',
          label:
            "What does latestController?.abort() do during the first call, search('ca', 30)?",
          options: [
            'nothing, because latestController is still null',
            "it aborts ca's own controller before the request starts",
            'it throws, because you cannot call abort on null',
            'it creates a new controller and aborts it immediately',
          ],
          answer: 'nothing, because latestController is still null',
        },
        {
          id: 'missing-cleartimeout',
          type: 'multiple-choice',
          label:
            'Suppose the abort listener rejected the promise but did not call clearTimeout. What would change?',
          options: [
            "the printed output would be the same, but ca's timer would still fire at 30ms and call resolve on an already-rejected promise, doing nothing",
            '"rendered ca-results" would print at 30ms, after "rendered cat-results"',
            'the ca promise would settle twice, throwing an error at 30ms',
            '"dropped ca" would not print until the 30ms timer fired',
          ],
          answer:
            "the printed output would be the same, but ca's timer would still fire at 30ms and call resolve on an already-rejected promise, doing nothing",
        },
      ],
      explanation:
        "Both search calls run their synchronous part first. search('ca', 30) finds latestController null, so the optional call does nothing; it stores its controller and suspends at the await. search('cat', 10) then aborts that stored controller, which fires ca's abort listener synchronously: the listener clears ca's 30ms timer and rejects ca's promise. That rejection lands in ca's catch block on the microtask queue, so \"dropped ca\" prints first. Ten milliseconds later cat's timer resolves and \"rendered cat-results\" prints. The clearTimeout in the abort listener is cleanup, not correctness of the output: a promise can only settle once, so without it the late resolve at 30ms would be ignored, but the timer would still run for no reason and, in a bigger program, keep its closure alive.",
    },
    {
      id: 'cooperative-model-review',
      kind: 'written',
      completionMode: 'submitted-with-reference-review',
      title: 'Explain why abort() did not stop the work',
      prompt:
        'A teammate added an AbortController to a long-running import, wired a cancel button to controller.abort(), and is confused that pressing cancel changes nothing. In your own words, explain: what abort() actually does, why the import kept running, the two ways an async function can notice a signal and when each fits, what cleanup each way owes, and one thing cancellation cannot undo. Use a short example of your own.',
      estimatedMinutes: 12,
      referenceAnswer:
        "Calling abort() does exactly two things: it flips signal.aborted from false to true, permanently, and it fires one abort event on the signal. It does not stop any loop, interrupt any await, or reject any promise on its own. Cancellation in JavaScript is cooperative, so the work itself must read the signal and agree to stop. Your import kept running because nothing in it ever looks at the signal; the cancel button is wired to a flag nobody checks.\n\nThere are two ways for the work to check. Work shaped like a loop of steps polls at checkpoints: before each step it reads signal.aborted and returns early when it is true, for example `if (signal.aborted) return { rows, aborted: true }` at the top of each pass of the import loop. The limit is granularity, because an abort during one slow step is only noticed at the next checkpoint. Work with nothing to poll, like a single delay or a wrapped callback, listens for the abort event instead, and rejects its promise the moment the event fires, so the caller is released immediately.\n\nEach style owes cleanup. The event style must remove its abort listener when the work finishes normally and clear its timer when the abort wins, because listeners left on a long-lived signal leak and orphaned timers fire into code that no longer wants them. Both styles must handle a signal that arrives already aborted, since the abort event fired in the past and will not fire again for a new listener.\n\nFinally, cancellation cannot undo work that already happened. Aborting a request does not reach into the server: if the import already wrote 400 rows, those rows are written, and cancelling a POST and retrying can perform the write twice. Aborted is not undone.",
      rubric: [
        {
          id: 'cooperative-model',
          label: 'Cooperative model',
          description:
            'States that abort() only sets signal.aborted and fires one event, and that work which never reads the signal runs to completion.',
        },
        {
          id: 'two-observation-styles',
          label: 'Two ways to observe',
          description:
            'Distinguishes checkpoint polling for step-shaped work from the abort event for delay- or callback-shaped work, including the granularity limit of polling.',
        },
        {
          id: 'cleanup-duties',
          label: 'Cleanup duties',
          description:
            'Names the cleanup each style owes: remove listeners on normal completion, clear timers on abort, and check for an already-aborted signal before starting.',
        },
        {
          id: 'cannot-undo',
          label: 'Limits of cancellation',
          description:
            'Explains that an aborted request is not an undone request, with the server-side write or retry consequence.',
        },
      ],
    },
  ],
  approaches: {
    'fix-ignored-signal': [
      {
        name: 'Add the missing checkpoint',
        code: `type ExportOutcome = {
  completed: string[]
  cancelled: boolean
}

export async function runExportJobs(
  jobNames: string[],
  cancelBeforeJob: number,
): Promise<ExportOutcome> {
  const controller = new AbortController()
  const completed: string[] = []

  for (let index = 0; index < jobNames.length; index += 1) {
    // The cancel side of the handshake: the user presses cancel
    // just before this job starts.
    if (index === cancelBeforeJob) {
      controller.abort()
    }

    // The work side: a checkpoint that reads the signal before
    // committing to the next job, and stops cleanly if it is set.
    if (controller.signal.aborted) {
      break
    }

    await Promise.resolve()
    completed.push(jobNames[index])
  }

  return { completed, cancelled: controller.signal.aborted }
}`,
        explanation:
          'The broken version had only half the handshake. abort() flipped signal.aborted and fired the abort event, but no line of the loop ever read the signal, so every job ran and the function even reported cancelled: true next to a fully completed list. The fix is one checkpoint before each job: read signal.aborted, and break out of the loop the moment it is true. The final report can keep reading controller.signal.aborted, which is false only when cancel never arrived.',
        complexity:
          'O(n) time over the jobs actually run. The point is behavioral: cancellation now stops work at the first checkpoint after the abort instead of being silently ignored.',
      },
    ],
    'checkpointed-sync': [
      {
        name: 'Checkpoint before each record',
        code: `type SyncResult = {
  synced: string[]
  skipped: string[]
  aborted: boolean
}

export async function syncRecords(
  recordIds: string[],
  abortBeforeRecord: number,
): Promise<SyncResult> {
  const controller = new AbortController()
  const synced: string[] = []

  for (let index = 0; index < recordIds.length; index += 1) {
    // The cancel side: cancellation arrives just before this record.
    if (index === abortBeforeRecord) {
      controller.abort()
    }

    // Checkpoint: read the signal before starting the record. Once it
    // is aborted, everything from here on is skipped, not synced.
    if (controller.signal.aborted) {
      return {
        synced,
        skipped: recordIds.slice(index),
        aborted: true,
      }
    }

    // One await stands in for the network call for this record.
    await Promise.resolve()
    synced.push(recordIds[index])
  }

  return { synced, skipped: [], aborted: controller.signal.aborted }
}`,
        explanation:
          'The shape is the checkpoint pattern from the lesson: one signal read before each unit of work, and a clean early return that reports exactly how far the sync got. slice(index) captures every unsynced record in original order, which is the bookkeeping a caller needs to resume later. The edge cases fall out of the same checkpoint: abortBeforeRecord 0 aborts before any work, so everything is skipped, and -1 or an index past the end means the abort branch never runs, so the signal stays unaborted and the final report says aborted: false.',
        complexity:
          'O(n) time and O(n) space for the result arrays. An abort at record k does the work of k records, never more, because the checkpoint runs before each record starts.',
      },
    ],
  },
}
