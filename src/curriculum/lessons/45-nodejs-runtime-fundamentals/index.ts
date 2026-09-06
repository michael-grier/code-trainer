import Concept from './concept.mdx'

import type { Lesson } from '../../types'

export const lesson: Lesson = {
  slug: 'nodejs-runtime-fundamentals',
  title: 'Node.js Runtime Fundamentals',
  summary:
    'Reason about Node execution, modules, async I/O, and server-side runtime constraints.',
  track: 'backend-data',
  order: 45,
  concept: Concept,
  problems: [
    {
      id: 'blocked-handler-trace',
      kind: 'trace',
      completionMode: 'structured-answer-correct',
      title: 'Trace a handler that blocks the thread',
      prompt:
        'A request handler schedules a cleanup timer, a retry timer, and a promise reaction, then builds a report synchronously for fifty milliseconds before it finishes. Read the program without running it, predict the console output in order, and answer the questions. The file is an ES module running under Node.js.',
      estimatedMinutes: 10,
      code: `console.log('request received')

setTimeout(() => console.log('cleanup timer'), 10)

setTimeout(() => console.log('retry timer'), 0)

Promise.resolve().then(() => console.log('cache updated'))

const start = Date.now()
while (Date.now() - start < 50) {
  // build the report on the main thread
}

console.log('report built')
`,
      questions: [
        {
          id: 'output-order',
          type: 'output-order',
          label: 'Which lines print, in order?',
          options: [
            'cache updated',
            'cleanup timer',
            'report built',
            'request received',
            'retry timer',
          ],
          expected: [
            'request received',
            'report built',
            'cache updated',
            'retry timer',
            'cleanup timer',
          ],
        },
        {
          id: 'timers-during-block',
          type: 'multiple-choice',
          label:
            "Both timers came due while the while loop was running. Why does neither print before 'report built'?",
          options: [
            'nothing interrupts a running function; a due timer only runs once the current stack run finishes and the loop takes its next turn',
            'the while loop resets every pending timer each time it checks Date.now()',
            'timers are paused whenever the main thread is busy and restart their delay afterward',
            'console.log calls made inside timer callbacks are buffered until the script ends',
          ],
          answer:
            'nothing interrupts a running function; a due timer only runs once the current stack run finishes and the loop takes its next turn',
        },
        {
          id: 'timer-order',
          type: 'multiple-choice',
          label:
            "The 10 ms cleanup timer was scheduled before the 0 ms retry timer, and both were overdue when the loop ended. Why does 'retry timer' print first?",
          options: [
            'overdue timers run in the order of their due times, and the retry timer was due about 9 ms earlier',
            'timers scheduled later in the source always run first',
            'a 0 ms timer runs as a microtask, so it drains with the promise reactions',
            'the cleanup timer was cancelled by the while loop and rescheduled',
          ],
          answer:
            'overdue timers run in the order of their due times, and the retry timer was due about 9 ms earlier',
        },
        {
          id: 'second-request',
          type: 'multiple-choice',
          label:
            'If this were a request handler and a second request arrived 5 ms into the while loop, when would its handler start?',
          options: [
            "after 'report built', because the request waits in the socket queue until the current handler returns and the loop reaches it",
            'immediately, because Node starts a new thread for each incoming request',
            "between 'request received' and 'report built', at the moment it arrives",
            'never, because a blocked server drops any request it cannot answer within 50 ms',
          ],
          answer:
            "after 'report built', because the request waits in the socket queue until the current handler returns and the loop reaches it",
        },
      ],
      explanation:
        "The script is one stack run, and nothing interrupts it: 'request received' prints, both timers and the promise reaction are queued, the while loop burns fifty milliseconds, and 'report built' prints. During those fifty milliseconds both timers came due, but a due timer is only a callback waiting for a turn, and turns are handed out between stack runs. When the script ends, the microtask queue drains first, printing 'cache updated'. Then the loop runs the overdue timers in due-time order: the retry timer was due after about 1 ms and the cleanup timer after 10 ms, so 'retry timer' prints before 'cleanup timer' even though the cleanup timer was scheduled first. A second request arriving during the loop would wait the same way, sitting in the operating system's socket queue until the current handler returned, which is exactly why one blocking handler stalls a whole Node server.",
    },
    {
      id: 'read-server-config',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Parse the server environment at startup',
      prompt:
        'Implement `readServerConfig`. It receives the process environment as a record whose values are strings or undefined, and either returns a typed config or reports every problem. The rules: `PORT` defaults to 3000 and, when present, must be a whole number from 1 to 65535; `NODE_ENV` defaults to "development" and, when present, must be one of "development", "test", or "production"; `DATABASE_URL` is required and must not be empty; `LOG_REQUESTS` defaults to false and, when present, must be exactly the string "true" or "false". Variables the server does not read are ignored. On success return `{ ok: true, config: { port, nodeEnv, databaseUrl, logRequests } }`. On failure return `{ ok: false, errors }`, collecting every problem in the fixed order PORT, NODE_ENV, DATABASE_URL, LOG_REQUESTS, using these exact strings: "PORT must be a whole number between 1 and 65535", "NODE_ENV must be one of development, test, production", "DATABASE_URL is required", `LOG_REQUESTS must be "true" or "false"`. Example: `readServerConfig({ PORT: "8080", DATABASE_URL: "postgres://db/app", LOG_REQUESTS: "false" })` returns `{ ok: true, config: { port: 8080, nodeEnv: "development", databaseUrl: "postgres://db/app", logRequests: false } }`.',
      estimatedMinutes: 20,
      functionName: 'readServerConfig',
      starter: `type ServerConfig = {
  port: number
  nodeEnv: 'development' | 'test' | 'production'
  databaseUrl: string
  logRequests: boolean
}

type ConfigResult =
  | { ok: true; config: ServerConfig }
  | { ok: false; errors: string[] }

export function readServerConfig(
  env: Record<string, string | undefined>,
): ConfigResult {
  return { ok: false, errors: [] }
}

console.log(
  readServerConfig({
    PORT: '8080',
    DATABASE_URL: 'postgres://db/app',
    LOG_REQUESTS: 'false',
  }),
)
`,
      tests: [
        {
          name: 'applies every default when only DATABASE_URL is set',
          args: [{ DATABASE_URL: 'postgres://localhost/app' }],
          expected: {
            ok: true,
            config: {
              port: 3000,
              nodeEnv: 'development',
              databaseUrl: 'postgres://localhost/app',
              logRequests: false,
            },
          },
        },
        {
          name: 'parses a full production environment',
          args: [
            {
              PORT: '8080',
              NODE_ENV: 'production',
              DATABASE_URL: 'postgres://db/app',
              LOG_REQUESTS: 'true',
            },
          ],
          expected: {
            ok: true,
            config: {
              port: 8080,
              nodeEnv: 'production',
              databaseUrl: 'postgres://db/app',
              logRequests: true,
            },
          },
        },
        {
          name: 'treats the string "false" as false, not as a truthy string',
          args: [{ DATABASE_URL: 'postgres://db/app', LOG_REQUESTS: 'false' }],
          expected: {
            ok: true,
            config: {
              port: 3000,
              nodeEnv: 'development',
              databaseUrl: 'postgres://db/app',
              logRequests: false,
            },
          },
        },
        {
          name: 'rejects a port that is not a number',
          args: [{ PORT: 'eighty', DATABASE_URL: 'postgres://db/app' }],
          expected: {
            ok: false,
            errors: ['PORT must be a whole number between 1 and 65535'],
          },
        },
        {
          name: 'rejects a port outside the valid range',
          args: [{ PORT: '70000', DATABASE_URL: 'postgres://db/app' }],
          expected: {
            ok: false,
            errors: ['PORT must be a whole number between 1 and 65535'],
          },
        },
        {
          name: 'rejects an unknown NODE_ENV',
          args: [{ NODE_ENV: 'prod', DATABASE_URL: 'postgres://db/app' }],
          expected: {
            ok: false,
            errors: ['NODE_ENV must be one of development, test, production'],
          },
        },
        {
          name: 'requires DATABASE_URL and rejects an empty one',
          args: [{ DATABASE_URL: '' }],
          expected: { ok: false, errors: ['DATABASE_URL is required'] },
        },
        {
          name: 'rejects a LOG_REQUESTS value that is neither "true" nor "false"',
          args: [{ DATABASE_URL: 'postgres://db/app', LOG_REQUESTS: '1' }],
          expected: {
            ok: false,
            errors: ['LOG_REQUESTS must be "true" or "false"'],
          },
        },
        {
          name: 'collects every error in PORT, NODE_ENV, DATABASE_URL, LOG_REQUESTS order',
          args: [{ PORT: '0', NODE_ENV: 'staging', LOG_REQUESTS: 'yes' }],
          expected: {
            ok: false,
            errors: [
              'PORT must be a whole number between 1 and 65535',
              'NODE_ENV must be one of development, test, production',
              'DATABASE_URL is required',
              'LOG_REQUESTS must be "true" or "false"',
            ],
          },
        },
        {
          name: 'ignores variables the server does not read',
          args: [
            { DATABASE_URL: 'postgres://db/app', HOME: '/root', PATH: '/usr/bin' },
          ],
          expected: {
            ok: true,
            config: {
              port: 3000,
              nodeEnv: 'development',
              databaseUrl: 'postgres://db/app',
              logRequests: false,
            },
          },
        },
      ],
    },
    {
      id: 'fix-shared-request-state',
      kind: 'debug',
      completionMode: 'all-tests-pass',
      title: 'Fix the handler that ships orders to the wrong user',
      prompt:
        'shipOrders handles a batch of concurrent fulfillment requests, one per user id. For each user it loads their orders (simulated with a zero-delay timer) and returns a shipping line of the form "<orders joined by ", "> shipped to <userId>", in the same order as the input. In production, orders are being shipped to whichever user made the most recent request. Find why and fix it without changing loadOrders or the output format. Example: `shipOrders(["ada", "grace"])` should resolve to `["ada-order-1, ada-order-2 shipped to ada", "grace-order-1, grace-order-2 shipped to grace"]`.',
      estimatedMinutes: 15,
      functionName: 'shipOrders',
      brokenCode: `// Module scope lives as long as the process, and every request shares it.
let currentUser = ''

function loadOrders(userId: string): Promise<string[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve([\`\${userId}-order-1\`, \`\${userId}-order-2\`]), 0)
  })
}

function describeShipment(orders: string[]): string {
  return \`\${orders.join(', ')} shipped to \${currentUser}\`
}

export async function shipOrders(userIds: string[]): Promise<string[]> {
  return Promise.all(
    userIds.map(async (userId) => {
      currentUser = userId
      const orders = await loadOrders(userId)
      return describeShipment(orders)
    }),
  )
}

shipOrders(['ada', 'grace']).then((lines) => console.log(lines))
`,
      bugHints: [
        'Walk two users through shipOrders with the event loop in mind. What is the value of currentUser when the first handler resumes after its await?',
        'A module-scope variable is shared by every request the process ever serves. Is there any request-specific value stored there?',
        'describeShipment needs to know who the orders belong to. Where should that information come from?',
      ],
      tests: [
        {
          name: "ships one user's orders to that user",
          args: [['ada']],
          expected: ['ada-order-1, ada-order-2 shipped to ada'],
        },
        {
          name: 'keeps two concurrent users apart',
          args: [['ada', 'grace']],
          expected: [
            'ada-order-1, ada-order-2 shipped to ada',
            'grace-order-1, grace-order-2 shipped to grace',
          ],
        },
        {
          name: 'keeps three concurrent users apart',
          args: [['ada', 'grace', 'linus']],
          expected: [
            'ada-order-1, ada-order-2 shipped to ada',
            'grace-order-1, grace-order-2 shipped to grace',
            'linus-order-1, linus-order-2 shipped to linus',
          ],
        },
        {
          name: 'returns results in request order',
          args: [['zed', 'amy']],
          expected: [
            'zed-order-1, zed-order-2 shipped to zed',
            'amy-order-1, amy-order-2 shipped to amy',
          ],
        },
        {
          name: 'handles an empty batch',
          args: [[]],
          expected: [],
        },
        {
          name: "does not leak a previous batch's user into the next",
          args: [['ada']],
          expected: ['ada-order-1, ada-order-2 shipped to ada'],
        },
      ],
    },
    {
      id: 'blocking-handler-review',
      kind: 'written',
      completionMode: 'submitted-with-reference-review',
      title: 'Explain why one slow handler stalls the server',
      prompt:
        'A teammate reports that the health check endpoint times out whenever someone requests the monthly report, and proposes fixing it by marking the report handler async. In your own words: why does a single slow handler delay unrelated requests in Node, why does async I/O normally prevent this, why will the async keyword not help here, and what would? Include what the fix costs, and one example of per-request work that must not be done synchronously even though it is not computation.',
      estimatedMinutes: 12,
      referenceAnswer:
        'Node runs all JavaScript on one thread driven by the event loop. Each request handler is a callback that runs to completion before the loop picks the next one, so while the report handler is summing rows, the health check request sits in the socket queue untouched. It is not that the health handler got slower; it never started until the report finished. That is why its latency equals the report time almost exactly.\n\nMost handlers do not have this problem because most of what they do is waiting, and Node never waits on the JavaScript thread. A database query or file read is handed to the operating system or to Node\'s helper thread pool, the handler awaits a promise, and at that await the thread goes back to the loop to serve other requests. When the result arrives it is queued as a callback. A handler that awaits a 30 ms query costs other requests nothing during those 30 ms.\n\nThe async keyword will not help the report, because async only changes what happens at an await, and the report has none. An async function runs synchronously until its first await, so an async buildReport with only loops in it still holds the thread for the whole computation. There is no operating system to hand arithmetic to. The fix for real computation is another thread: a worker_threads Worker that runs the loops and posts the result back, so the main thread only waits for a message. The cost is real: starting a worker and copying the data across takes tens of milliseconds and adds a second file and a message protocol, so it is wrong for a five-millisecond job and right for a one-second one. Chunking the loop with periodic awaits is a lighter alternative that keeps the loop responsive at the price of a slower report.\n\nWaiting can still block if you use the synchronous API for it. readFileSync in a handler parks the thread for the whole disk read even though no computation happens, so per-request file reads, and anything else with a Sync suffix, must use the promise form. Synchronous I/O is fine only at startup, before there is anyone to keep waiting.',
      rubric: [
        {
          id: 'single-thread-model',
          label: 'Explains the single-thread stall',
          description:
            'States that Node runs handlers one at a time on one thread, that a running handler is never interrupted, and that the health request waited in the queue rather than running slowly.',
        },
        {
          id: 'async-io-handoff',
          label: 'Explains why async I/O avoids it',
          description:
            'Describes I/O being handed to the operating system or thread pool, with await returning the thread to the loop so waiting costs other requests nothing.',
        },
        {
          id: 'async-keyword-limit',
          label: 'Knows async does not move computation',
          description:
            'Explains that an async function runs synchronously until its first await, so marking a computation-only handler async changes nothing.',
        },
        {
          id: 'fix-with-cost',
          label: 'Proposes a fix and its cost',
          description:
            'Names worker threads (or chunking the work with periodic yields) and states what the fix costs in overhead or complexity, rather than presenting it as free.',
        },
        {
          id: 'sync-io-trap',
          label: 'Names synchronous I/O as a blocking trap',
          description:
            'Gives an example such as readFileSync in a handler and explains that it blocks the thread despite being waiting rather than computing.',
        },
      ],
    },
  ],
  approaches: {
    'read-server-config': [
      {
        name: 'Default first, then let a valid value override or a bad one report',
        code: `type ServerConfig = {
  port: number
  nodeEnv: 'development' | 'test' | 'production'
  databaseUrl: string
  logRequests: boolean
}

type ConfigResult =
  | { ok: true; config: ServerConfig }
  | { ok: false; errors: string[] }

const nodeEnvs = ['development', 'test', 'production'] as const

export function readServerConfig(
  env: Record<string, string | undefined>,
): ConfigResult {
  const errors: string[] = []

  // Start every setting at its default so a missing variable is never an error
  // unless the rules say it is required.
  let port = 3000
  let nodeEnv: ServerConfig['nodeEnv'] = 'development'
  let databaseUrl = ''
  let logRequests = false

  if (env.PORT !== undefined) {
    // Number() turns "eighty" into NaN and Number.isInteger rejects "80.5",
    // so only a real whole number in range reaches the config.
    const parsed = Number(env.PORT)
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
      errors.push('PORT must be a whole number between 1 and 65535')
    } else {
      port = parsed
    }
  }

  if (env.NODE_ENV !== undefined) {
    // Matching against the allowlist both validates the value and narrows it
    // to the union, so no cast is needed.
    const match = nodeEnvs.find((candidate) => candidate === env.NODE_ENV)
    if (match === undefined) {
      errors.push('NODE_ENV must be one of development, test, production')
    } else {
      nodeEnv = match
    }
  }

  // Required means both "must be present" and "must not be empty".
  if (env.DATABASE_URL === undefined || env.DATABASE_URL === '') {
    errors.push('DATABASE_URL is required')
  } else {
    databaseUrl = env.DATABASE_URL
  }

  if (env.LOG_REQUESTS !== undefined) {
    // Compare against the two exact strings. Truthiness would treat "false"
    // as true, which is the bug this whole function exists to prevent.
    if (env.LOG_REQUESTS === 'true') {
      logRequests = true
    } else if (env.LOG_REQUESTS !== 'false') {
      errors.push('LOG_REQUESTS must be "true" or "false"')
    }
  }

  // Checking in PORT, NODE_ENV, DATABASE_URL, LOG_REQUESTS order above is what
  // keeps the error list deterministic; report all of them at once.
  if (errors.length > 0) {
    return { ok: false, errors }
  }

  return { ok: true, config: { port, nodeEnv, databaseUrl, logRequests } }
}`,
        explanation:
          'Each variable follows the same shape as the query parser from lesson 47: start from the default, then let a valid value override it or a bad one push an exact error string. The two checks that catch naive versions are the boolean and the number. LOG_REQUESTS must be compared against the literal strings "true" and "false", because every environment value is a string and "false" is truthy. PORT goes through Number plus Number.isInteger so that "eighty", "80.5", and "" are all rejected, and the range check keeps "0" and "70000" out. Errors are collected as values rather than thrown so that a misconfigured deployment reports every problem on the first failed start instead of one per restart.',
        complexity:
          'O(1) time and space. The guarantee that matters is behavioral: the function runs once at startup, and a process that gets past it holds a config whose types are real.',
      },
    ],
    'fix-shared-request-state': [
      {
        name: 'Keep request data in the request',
        code: `function loadOrders(userId: string): Promise<string[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve([\`\${userId}-order-1\`, \`\${userId}-order-2\`]), 0)
  })
}

// The user now travels as a parameter, so each call sees the user it was
// given rather than whichever request most recently wrote to module scope.
function describeShipment(orders: string[], userId: string): string {
  return \`\${orders.join(', ')} shipped to \${userId}\`
}

export async function shipOrders(userIds: string[]): Promise<string[]> {
  return Promise.all(
    userIds.map(async (userId) => {
      const orders = await loadOrders(userId)
      return describeShipment(orders, userId)
    }),
  )
}`,
        explanation:
          'The broken version stored the current user in a module-scope variable, and module scope is shared by every request the process serves. Walk two users through it: ada\'s handler sets currentUser to "ada" and awaits, which hands the thread back to the loop; grace\'s handler runs, sets currentUser to "grace", and awaits. When ada\'s lookup resolves, her handler resumes and describeShipment reads currentUser, which now says "grace". Every handler except the last one in the batch reads the wrong user, which matches the production symptom of orders going to whoever asked most recently. The fix deletes the shared variable and passes userId down as a parameter, so the value each handler needs lives in that handler\'s own call, which no other request can touch. When a value must reach code many calls deep without a parameter on every function, Node\'s AsyncLocalStorage carries per-request context safely across awaits; a parameter is still the first thing to reach for.',
        complexity:
          'O(n) time for n users, with all lookups in flight at once. The guarantee that matters is isolation: no request can observe or overwrite another request\'s user.',
      },
    ],
  },
}
