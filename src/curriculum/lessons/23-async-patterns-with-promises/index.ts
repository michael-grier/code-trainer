import Concept from './concept.mdx'

import type { Lesson } from '../../types'

export const lesson: Lesson = {
  slug: 'async-patterns-with-promises',
  title: 'Async Patterns with Promises',
  summary: 'Compose promise workflows and handle asynchronous control flow reliably.',
  track: 'js-ts-core',
  order: 23,
  concept: Concept,
  problems: [
    {
      id: 'await-suspension-trace',
      kind: 'trace',
      completionMode: 'structured-answer-correct',
      title: 'Predict where the function suspends',
      prompt:
        'Read the program below without running it. An async function is called from the top level, and a .then callback is attached to its result. Using the suspension model, predict the exact console output and answer the questions.',
      estimatedMinutes: 10,
      code: `async function loadConfig() {
  console.log('reading config')
  const theme = await Promise.resolve('dark')
  console.log(\`theme is \${theme}\`)
  return theme
}

console.log('boot')
const pending = loadConfig()
console.log('after call')
pending.then((theme) => console.log(\`applied \${theme}\`))
console.log('render')
`,
      questions: [
        {
          id: 'output-order',
          type: 'output-order',
          label: 'Which lines print, in order?',
          options: [
            'boot',
            'reading config',
            'after call',
            'render',
            'theme is dark',
            'applied dark',
            'theme is undefined',
            'applied undefined',
          ],
          expected: [
            'boot',
            'reading config',
            'after call',
            'render',
            'theme is dark',
            'applied dark',
          ],
        },
        {
          id: 'value-of-pending',
          type: 'multiple-choice',
          label:
            "What does the variable pending hold on the line right after loadConfig() is called?",
          options: [
            'a pending promise, because loadConfig suspended at its await before finishing',
            "the string 'dark', because Promise.resolve makes the await instant",
            'undefined, because async functions only return once their body completes',
            "a fulfilled promise already holding 'dark'",
          ],
          answer:
            'a pending promise, because loadConfig suspended at its await before finishing',
        },
        {
          id: 'sync-start',
          type: 'multiple-choice',
          label: "Why does 'reading config' print before 'after call'?",
          options: [
            'an async function body runs synchronously until its first await',
            'console.log calls inside async functions jump the queue',
            'the entire body of an async function is deferred until the call stack empties',
            "the await on Promise.resolve('dark') completes before the function returns",
          ],
          answer: 'an async function body runs synchronously until its first await',
        },
        {
          id: 'resume-after-sync',
          type: 'multiple-choice',
          label: "Why does 'render' print before 'theme is dark'?",
          options: [
            'the await suspended loadConfig and returned control to the top level, so the remaining synchronous lines finished first',
            'template literals are slower to evaluate than plain strings',
            "the .then attached to pending delays the log of 'theme is dark'",
            'await blocks the thread, so the top-level code had to finish during the block',
          ],
          answer:
            'the await suspended loadConfig and returned control to the top level, so the remaining synchronous lines finished first',
        },
      ],
      explanation:
        "The call loadConfig() runs the body synchronously up to the first await, which is why 'reading config' prints immediately after 'boot'. At the await, the function suspends: it stops mid-line, hands a pending promise back to the caller, and control returns to the top level. That pending promise is what the variable holds, even though Promise.resolve('dark') settled instantly, because the function body has not finished. The top level keeps going, printing 'after call', attaching the .then callback, and printing 'render'. Only after the synchronous code completes does the suspended function resume, print 'theme is dark', and return, which fulfills its promise and finally runs the .then callback to print 'applied dark'. Nothing here blocks. The suspension frees the thread, and the code after the await behaves exactly like a callback scheduled for later.",
    },
    {
      id: 'fix-escaped-rejection',
      kind: 'debug',
      completionMode: 'all-tests-pass',
      title: 'Fix the fallback that never fires',
      prompt:
        'userNameOrGuest looks up a user asynchronously and is supposed to return "guest" whenever the lookup fails. The try/catch looks right, yet unknown ids make the whole call reject instead of falling back. Find why the rejection escapes the catch and fix it. Example: `userNameOrGuest([{ id: 1, name: "Ada" }], 99)` should resolve to `"guest"`.',
      estimatedMinutes: 12,
      functionName: 'userNameOrGuest',
      brokenCode: `type UserRecord = { id: number; name: string }

// Simulates an async lookup: resolves with the name, or rejects
// a moment later when no user has the requested id.
function lookupUser(users: UserRecord[], id: number): Promise<string> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = users.find((candidate) => candidate.id === id)
      if (user) {
        resolve(user.name)
      } else {
        reject(new Error(\`no user with id \${id}\`))
      }
    }, 0)
  })
}

export async function userNameOrGuest(
  users: UserRecord[],
  id: number,
): Promise<string> {
  try {
    return lookupUser(users, id)
  } catch {
    return 'guest'
  }
}

userNameOrGuest([{ id: 1, name: 'Ada' }], 1).then((name) => console.log(name))
`,
      bugHints: [
        'When does lookupUser actually reject: while the try block is still running, or after userNameOrGuest has already returned?',
        'return lookupUser(users, id) hands back a pending promise and exits the try block immediately. What is left to catch with when the rejection arrives?',
        'await turns a rejection back into a throw at the await line. Where would an await keep the failure inside the try?',
      ],
      tests: [
        {
          name: 'finds a user by id',
          args: [
            [
              { id: 1, name: 'Ada' },
              { id: 2, name: 'Grace' },
            ],
            2,
          ],
          expected: 'Grace',
        },
        {
          name: 'finds the only user',
          args: [[{ id: 1, name: 'Ada' }], 1],
          expected: 'Ada',
        },
        {
          name: 'falls back to guest for an unknown id',
          args: [[{ id: 1, name: 'Ada' }], 99],
          expected: 'guest',
        },
        {
          name: 'falls back to guest when there are no users',
          args: [[], 1],
          expected: 'guest',
        },
        {
          name: 'does not fall back for a found empty name',
          args: [[{ id: 3, name: '' }], 3],
          expected: '',
        },
      ],
    },
    {
      id: 'settle-in-order',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Report every outcome in input order',
      prompt:
        'Implement `settleInOrder`. Each task spec describes one piece of async work: `runTask` (provided in the starter) turns a spec into a promise that waits `delayMs` milliseconds, then resolves with `value`, or rejects with an error whose message is `value` when `rejects` is true. Start all the tasks so their delays overlap, wait for every one to settle, and return the outcomes in input order regardless of which finished first. Report a success as `{ status: "fulfilled", value }` and a failure as `{ status: "rejected", reason }`, where reason is the error message. One failed task must not discard the others\' results. Example: `settleInOrder([{ value: "user", delayMs: 1 }, { value: "orders down", delayMs: 0, rejects: true }])` resolves to `[{ status: "fulfilled", value: "user" }, { status: "rejected", reason: "orders down" }]`.',
      estimatedMinutes: 18,
      functionName: 'settleInOrder',
      starter: `type TaskSpec = {
  value: string
  delayMs: number
  rejects?: boolean
}

type Outcome =
  | { status: 'fulfilled'; value: string }
  | { status: 'rejected'; reason: string }

// Turns one spec into the running work it describes.
function runTask(task: TaskSpec): Promise<string> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (task.rejects) {
        reject(new Error(task.value))
      } else {
        resolve(task.value)
      }
    }, task.delayMs)
  })
}

export function settleInOrder(tasks: TaskSpec[]): Promise<Outcome[]> {
  return Promise.resolve([])
}

settleInOrder([
  { value: 'user', delayMs: 1 },
  { value: 'orders down', delayMs: 0, rejects: true },
]).then((outcomes) => console.log(outcomes))
`,
      tests: [
        {
          name: 'keeps input order when completion order differs',
          args: [
            [
              { value: 'user', delayMs: 1 },
              { value: 'orders', delayMs: 0 },
            ],
          ],
          expected: [
            { status: 'fulfilled', value: 'user' },
            { status: 'fulfilled', value: 'orders' },
          ],
        },
        {
          name: 'reports a rejection without discarding the successes',
          args: [
            [
              { value: 'user', delayMs: 0 },
              { value: 'orders down', delayMs: 0, rejects: true },
              { value: 'alerts', delayMs: 1 },
            ],
          ],
          expected: [
            { status: 'fulfilled', value: 'user' },
            { status: 'rejected', reason: 'orders down' },
            { status: 'fulfilled', value: 'alerts' },
          ],
        },
        {
          name: 'handles a single rejecting task',
          args: [[{ value: 'service down', delayMs: 0, rejects: true }]],
          expected: [{ status: 'rejected', reason: 'service down' }],
        },
        {
          name: 'handles every task rejecting',
          args: [
            [
              { value: 'first down', delayMs: 1, rejects: true },
              { value: 'second down', delayMs: 0, rejects: true },
            ],
          ],
          expected: [
            { status: 'rejected', reason: 'first down' },
            { status: 'rejected', reason: 'second down' },
          ],
        },
        {
          name: 'handles no tasks',
          args: [[]],
          expected: [],
        },
        {
          name: 'handles every task fulfilling',
          args: [
            [
              { value: 'a', delayMs: 0 },
              { value: 'b', delayMs: 1 },
              { value: 'c', delayMs: 0 },
            ],
          ],
          expected: [
            { status: 'fulfilled', value: 'a' },
            { status: 'fulfilled', value: 'b' },
            { status: 'fulfilled', value: 'c' },
          ],
        },
      ],
    },
    {
      id: 'sequential-vs-parallel-review',
      kind: 'written',
      completionMode: 'submitted-with-reference-review',
      title: 'Explain when to await in line',
      prompt:
        'A teammate asks when they should await calls one at a time and when they should use Promise.all, and why an error from their code sometimes appears as an unhandled rejection far from where it was thrown. In your own words, explain: the decision rule for sequential versus parallel awaits and what each choice costs, how a rejection travels through await and try/catch, and the specific mistake that lets a rejection escape a try block. Use a short example of your own.',
      estimatedMinutes: 12,
      referenceAnswer:
        "The decision rule is about dependency, not style. When one step needs the previous step's result, sequential awaits are correct: the second call cannot start until the first finishes, and separate await lines state that honestly. When the steps are independent, sequential awaits are a pure waste, because each one delays creating the next promise, so you pay the sum of the latencies. Starting all the promises first and then writing await Promise.all([...]) overlaps the waits, so you pay only the longest single latency, and the results come back in input order, so destructuring is safe.\n\nErrors travel with the promise. A rejected promise carries its error until something consumes it, and await is a consumer: it rethrows the rejection at the await line, which is why try/catch around an await works exactly like try/catch around synchronous code. The escape happens when the promise leaves the try block still pending. Writing `return fetchUser()` inside a try, without await, returns a pending promise and exits the block immediately. When that promise rejects a moment later, the catch is long gone, so the rejection flows to the caller, and if the caller only attached a .then, it surfaces as an unhandled rejection nowhere near the real bug. `return await fetchUser()` keeps the rejection inside the try. The same reasoning covers bare .then chains: a chain with no .catch at the end sends any rejection into the void, so either finish the chain with .catch or convert it to an awaited try/catch.",
      rubric: [
        {
          id: 'dependency-rule',
          label: 'Dependency rule',
          description:
            'States that sequential awaits are for dependent steps and Promise.all is for independent ones, with the cost stated as sum of latencies versus longest single latency.',
        },
        {
          id: 'rejection-through-await',
          label: 'Rejection through await',
          description:
            'Explains that await rethrows a rejection at the await line, so try/catch handles it like a synchronous throw.',
        },
        {
          id: 'escape-mechanism',
          label: 'The escape',
          description:
            'Identifies returning an un-awaited promise from inside a try (or a .then chain with no .catch) as the way rejections escape, and shows the fix with a concrete example.',
        },
      ],
    },
  ],
  approaches: {
    'fix-escaped-rejection': [
      {
        name: 'Await inside the try',
        code: `export async function userNameOrGuest(
  users: UserRecord[],
  id: number,
): Promise<string> {
  try {
    // await rethrows a rejection right here, while the try block
    // is still active, so the catch below can handle it.
    return await lookupUser(users, id)
  } catch {
    return 'guest'
  }
}`,
        explanation:
          'The broken version returns the pending promise from lookupUser and exits the try block immediately, so when the rejection arrives a moment later there is no catch left to receive it, and the whole call rejects. Adding await makes the function suspend inside the try until the lookup settles. A fulfillment flows through as the return value, and a rejection is rethrown at the await line, where the catch converts it into the guest fallback. This is the one place where `return await` is not redundant: without it the catch is decoration.',
        complexity:
          'No meaningful complexity note; the fix changes error routing, not work done. The guarantee it restores is that userNameOrGuest never rejects.',
      },
    ],
    'settle-in-order': [
      {
        name: 'Map each task to an outcome, then Promise.all',
        code: `export function settleInOrder(tasks: TaskSpec[]): Promise<Outcome[]> {
  // Start every task now, before any waiting, so the delays overlap
  // instead of running single file.
  const outcomes = tasks.map((task) =>
    runTask(task).then(
      (value): Outcome => ({ status: 'fulfilled', value }),
      (error: unknown): Outcome => ({
        status: 'rejected',
        reason: error instanceof Error ? error.message : String(error),
      }),
    ),
  )

  // Every mapped promise fulfills with an Outcome, even for failed
  // tasks, so this Promise.all can never reject. Its input-order
  // guarantee is what keeps results aligned with tasks.
  return Promise.all(outcomes)
}`,
        explanation:
          'The map starts all the tasks in one synchronous pass, which is what makes the work parallel: every timer is running before anything is awaited. Each task promise is then converted into a promise that always fulfills, by giving .then both a success handler and a failure handler that wrap the result in a tagged outcome. Converting failures into values is the trick that lets Promise.all be used here at all. Since no mapped promise can reject, the combined promise cannot fail fast and discard results, and its input-order guarantee lines each outcome up with the task that produced it. Total time is the longest single task delay, not the sum.',
        complexity:
          'O(n) outcome objects for n tasks. Wall-clock time is the maximum task delay rather than the sum, because all tasks start before any settle.',
      },
    ],
  },
}
