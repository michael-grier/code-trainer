import Concept from './concept.mdx'

import type { Lesson } from '../../types'

export const lesson: Lesson = {
  slug: 'browser-networking-and-fetch-patterns',
  title: 'Browser Networking and Fetch Patterns',
  summary:
    'Handle fetch lifecycles, retries, loading states, and network failures.',
  track: 'frontend',
  order: 43,
  concept: Concept,
  problems: [
    {
      id: 'fetch-settles-trace',
      kind: 'trace',
      completionMode: 'structured-answer-correct',
      title: 'Predict what resolves and what rejects',
      prompt:
        "This is the lesson's miniature of fetch's promise contract: miniFetch fulfills for any response the server manages to send, whatever its status, and rejects only when no response exists at all. attempt awaits one call and logs which side of the try it landed on. Three attempts run in order: a healthy 200, a server crash answering 500, and a cut cable. Read the program without running it, predict the console output, and answer the questions.",
      estimatedMinutes: 10,
      code: `type FetchOutcome =
  | { kind: 'response'; status: number }
  | { kind: 'network-error' }

// A miniature of fetch's promise contract: any response from the server
// fulfills, and only a transport failure rejects.
function miniFetch(outcome: FetchOutcome): Promise<{ status: number }> {
  if (outcome.kind === 'response') {
    return Promise.resolve({ status: outcome.status })
  }
  return Promise.reject(new Error('network down'))
}

async function attempt(label: string, outcome: FetchOutcome) {
  try {
    const response = await miniFetch(outcome)
    console.log(\`\${label}: resolved with status \${response.status}\`)
  } catch (error) {
    console.log(\`\${label}: rejected (\${(error as Error).message})\`)
  }
}

await attempt('healthy', { kind: 'response', status: 200 })
await attempt('server crash', { kind: 'response', status: 500 })
await attempt('cable cut', { kind: 'network-error' })
`,
      questions: [
        {
          id: 'output-order',
          type: 'output-order',
          label: 'Which lines print, in order?',
          options: [
            'healthy: resolved with status 200',
            'healthy: rejected (network down)',
            'server crash: resolved with status 500',
            'server crash: rejected (network down)',
            'cable cut: rejected (network down)',
            'cable cut: resolved with status 500',
          ],
          expected: [
            'healthy: resolved with status 200',
            'server crash: resolved with status 500',
            'cable cut: rejected (network down)',
          ],
        },
        {
          id: 'why-500-resolves',
          type: 'multiple-choice',
          label: 'Why does the server crash land in the try, not the catch?',
          options: [
            "fetch's promise models the transport: a 500 is a delivered response, so the promise fulfills, and only the absence of any response rejects",
            'Status 500 is inside the range fetch considers successful',
            'The try/catch only catches synchronous errors, and promises never reject inside async functions',
            'miniFetch retries 500s internally until they succeed',
          ],
          answer:
            "fetch's promise models the transport: a 500 is a delivered response, so the promise fulfills, and only the absence of any response rejects",
        },
        {
          id: 'consequence',
          type: 'multiple-choice',
          label: 'What does this contract require of code that consumes fetch?',
          options: [
            'Check response.ok or response.status after awaiting, because the catch block alone only sees transport failures',
            'Wrap every fetch in two nested try/catch blocks, one per failure kind',
            'Nothing extra: a catch block handles every possible failure',
            'Convert every response to text before deciding anything',
          ],
          answer:
            'Check response.ok or response.status after awaiting, because the catch block alone only sees transport failures',
        },
      ],
      explanation:
        "The healthy attempt resolves with 200 — no surprises. The middle line is the one this lesson exists for: the server crash also resolves, printing 'server crash: resolved with status 500', because miniFetch — like fetch — fulfills for any outcome where a response was delivered, and a 500 is a delivered response with an unhappy number in it. Only the cable cut, where no response exists at all, rejects and lands in the catch. The awaits are sequential, so the three lines print in call order. The consequence is the discipline the practice problems drill: after awaiting fetch, the catch block has only told you about transport failures, and the status check — response.ok, or reading response.status — is where HTTP failures are caught. Skipping it sends 500s down the success path, which is how the lesson's opening dashboard crashed in render while its author believed failure was handled.",
    },
    {
      id: 'plan-the-retry',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Implement the retry planner',
      prompt:
        "Implement planRetry, the judgment call at the heart of resilient fetching. Given the outcome of an attempt — `{ kind: 'network-error' }` or `{ kind: 'http', status }` — the attempt number just completed (starting at 1), and the attempt budget, return `{ retry: false }` or `{ retry: true, delayMs }`. The rules: once `attempt >= maxAttempts` the budget is spent, never retry. Only transient outcomes retry: network errors, any 5xx status, and 429; every other HTTP status is permanent — a 404 stays a 404 — and so, notably, are successes. The delay is exponential with a cap: `200 * 2^(attempt - 1)` milliseconds, capped at 5000. Example: `planRetry({ kind: 'http', status: 503 }, 2, 4)` returns `{ retry: true, delayMs: 400 }`, and `planRetry({ kind: 'http', status: 404 }, 1, 4)` returns `{ retry: false }`.",
      estimatedMinutes: 15,
      functionName: 'planRetry',
      starter: `type RequestOutcome =
  | { kind: 'network-error' }
  | { kind: 'http'; status: number }

type RetryPlan = { retry: false } | { retry: true; delayMs: number }

export function planRetry(
  outcome: RequestOutcome,
  attempt: number,
  maxAttempts: number,
): RetryPlan {
  return { retry: false }
}

console.log(planRetry({ kind: 'http', status: 503 }, 2, 4))
`,
      tests: [
        {
          name: 'a network error retries with the base delay',
          args: [{ kind: 'network-error' }, 1, 4],
          expected: { retry: true, delayMs: 200 },
        },
        {
          name: 'a 503 on the second attempt doubles the delay',
          args: [{ kind: 'http', status: 503 }, 2, 4],
          expected: { retry: true, delayMs: 400 },
        },
        {
          name: 'a 429 is the server asking for patience, not refusal',
          args: [{ kind: 'http', status: 429 }, 3, 4],
          expected: { retry: true, delayMs: 800 },
        },
        {
          name: 'a 404 will be a 404 the tenth time',
          args: [{ kind: 'http', status: 404 }, 1, 4],
          expected: { retry: false },
        },
        {
          name: 'a 400 means the request itself is wrong',
          args: [{ kind: 'http', status: 400 }, 1, 4],
          expected: { retry: false },
        },
        {
          name: 'the budget boundary itself refuses',
          args: [{ kind: 'http', status: 500 }, 4, 4],
          expected: { retry: false },
        },
        {
          name: 'past the budget refuses even network errors',
          args: [{ kind: 'network-error' }, 6, 4],
          expected: { retry: false },
        },
        {
          name: 'the delay stops growing at the cap',
          args: [{ kind: 'http', status: 500 }, 7, 10],
          expected: { retry: true, delayMs: 5000 },
        },
        {
          name: 'a success is not retried',
          args: [{ kind: 'http', status: 200 }, 1, 4],
          expected: { retry: false },
        },
      ],
    },
    {
      id: 'report-the-status',
      kind: 'react-code',
      completionMode: 'all-tests-pass',
      title: 'Give the 500 its own path',
      prompt:
        "This is the lesson's dashboard, wired to a miniature network whose responses the tests script through the respond buttons. Its author handled transport failure — the catch shows `could not reach the server` — but a 500 sails down the success path: the error body has no `items`, the state records a successful load of `undefined`, and the render crashes on `.length`, far from the fetch. Fix `load` the lesson's way: after awaiting, check `response.ok` before parsing, and route a non-OK response to the error state with the message `server error (STATUS)` — for a 500, `server error (500)`. Keep every displayed message, the state union, and all four buttons exactly as they are. Your component is rendered for real, with response order and status scripted by the tests. Example: clicking `load items` then `respond 500` must put `server error (500)` on screen, with no crash and no `loaded`.",
      estimatedMinutes: 15,
      componentName: 'StatusDashboard',
      starter: `import { useState } from 'react'

// A miniature network: requests wait here until a respond button settles
// them, so the tests control status codes and failures exactly.
type FakeResponse = { ok: boolean; status: number; json: () => Promise<unknown> }
type PendingFetch = {
  resolve: (response: FakeResponse) => void
  reject: (error: Error) => void
}
const pendingFetches: PendingFetch[] = []

function fakeFetch(): Promise<FakeResponse> {
  return new Promise((resolve, reject) => {
    pendingFetches.push({ resolve, reject })
  })
}

function respond(status: number, body: unknown) {
  pendingFetches.shift()?.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  })
}

function failNetwork() {
  pendingFetches.shift()?.reject(new TypeError('fetch failed'))
}

type DashboardState =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | { phase: 'loaded'; items: string[] }

export function StatusDashboard() {
  const [state, setState] = useState<DashboardState>({ phase: 'idle' })

  const load = async () => {
    setState({ phase: 'loading' })
    try {
      const response = await fakeFetch()
      const body = (await response.json()) as { items: string[] }
      setState({ phase: 'loaded', items: body.items })
    } catch {
      setState({ phase: 'error', message: 'could not reach the server' })
    }
  }

  return (
    <div>
      {state.phase === 'idle' && <p>no items loaded</p>}
      {state.phase === 'loading' && <p>loading…</p>}
      {state.phase === 'error' && <p role="alert">{state.message}</p>}
      {state.phase === 'loaded' && <p>loaded {state.items.length} items</p>}
      <button onClick={load}>load items</button>
      <button onClick={() => respond(200, { items: ['a', 'b', 'c'] })}>
        respond 200
      </button>
      <button onClick={() => respond(500, { error: 'database down' })}>
        respond 500
      </button>
      <button onClick={failNetwork}>fail network</button>
    </div>
  )
}
`,
      tests: [
        {
          name: 'starts idle',
          props: {},
          expect: [{ type: 'text-present', text: 'no items loaded' }],
        },
        {
          name: 'a successful response loads the items',
          props: {},
          steps: [
            { action: 'click', text: 'load items' },
            { action: 'click', text: 'respond 200' },
          ],
          expect: [{ type: 'text-present', text: 'loaded 3 items' }],
        },
        {
          name: 'a server error is reported as one',
          props: {},
          steps: [
            { action: 'click', text: 'load items' },
            { action: 'click', text: 'respond 500' },
          ],
          expect: [
            { type: 'text-present', text: 'server error (500)' },
            { type: 'text-absent', text: 'loaded' },
            { type: 'text-absent', text: 'undefined' },
          ],
        },
        {
          name: 'a network failure is reported distinctly',
          props: {},
          steps: [
            { action: 'click', text: 'load items' },
            { action: 'click', text: 'fail network' },
          ],
          expect: [
            { type: 'text-present', text: 'could not reach the server' },
          ],
        },
        {
          name: 'a retry after an error can succeed',
          props: {},
          steps: [
            { action: 'click', text: 'load items' },
            { action: 'click', text: 'respond 500' },
            { action: 'click', text: 'load items' },
            { action: 'click', text: 'respond 200' },
          ],
          expect: [
            { type: 'text-present', text: 'loaded 3 items' },
            { type: 'text-absent', text: 'server error' },
          ],
        },
        {
          name: 'an in-flight request shows loading',
          props: {},
          steps: [
            { action: 'click', text: 'load items' },
            { action: 'click', text: 'respond 200' },
            { action: 'click', text: 'load items' },
          ],
          expect: [
            { type: 'text-present', text: 'loading…' },
            { type: 'text-absent', text: 'loaded' },
          ],
        },
      ],
    },
    {
      id: 'retry-safety-review',
      kind: 'written',
      completionMode: 'submitted-with-reference-review',
      title: 'Explain what fetch promises and what deserves a retry',
      prompt:
        'A teammate ships a "resilient fetch" wrapper: every rejection and every non-200 response is retried immediately, up to fifty times, for every request in the app — including the checkout POST. They point out that error rates on the dashboard went down. In your own words, review it. Explain: what fetch\'s promise actually models and why non-200s were reaching their retry loop at all, which outcomes are worth retrying and which are permanent, what immediate unbounded retries do to an already-struggling server, why the checkout POST is the most dangerous request to auto-retry, and what an honest give-up looks like. Use a short example of your own.',
      estimatedMinutes: 12,
      referenceAnswer:
        "Start with what their wrapper is actually seeing. fetch's promise models the transport, not the conversation: it fulfills for any delivered response — 200, 404, 500 alike — and rejects only when no response exists (offline, DNS, abort). So their wrapper handles two very different feeds: rejections, which are genuine transport failures, and non-200 fulfillments, which are the server speaking. Lumping them into one retry loop is the first mistake, because the two families have opposite prognoses.\n\nRetry-worthiness is a question about whether the world can plausibly have changed by the next attempt. Transient outcomes: network errors (connectivity returns), 5xx (servers recover), and 429, which is the server explicitly requesting patience. Permanent outcomes: the rest of 4xx. A 404 will be a 404 the tenth time; a 400 or 422 means the request itself is malformed, and resending it is asking the same wrong question louder; a 401 or 403 needs a credential change, not repetition. Their wrapper retries all of these fifty times, which is why the dashboard 'improved' — permanent failures now take fifty attempts to be recorded once, and some transient blips genuinely resolve. The error rate fell partly because errors are being retried into eventual timeouts instead of counted.\n\nImmediate, unbounded retries are also a weapon pointed at their own backend. A server returning 500s is usually struggling; fifty instant retries per client multiplies its load exactly when it can least afford it, and a fleet of clients doing so is a self-inflicted stampede that can hold an outage open. The standard discipline is exponential backoff with a cap — 200ms, 400ms, 800ms, capped at a few seconds — so a recovering server gets air, plus a small attempt budget, three or four, not fifty.\n\nThe checkout POST is the worst of all worlds. A retry presumes the previous attempt did nothing, and for a POST that charges a card, that presumption can be false in the expensive direction: the server may have processed the charge and died before answering, so the 'failed' attempt succeeded invisibly, and the retry runs it again. Automatic retries belong to requests that can be repeated harmlessly — reads, and writes made idempotent by design (the backend track covers idempotency keys, which are how payment APIs make retries safe). Until then, a checkout failure is surfaced, not silently re-fired.\n\nAn honest give-up is a state, not an absence: when the budget is spent, land in the error member of the status union with a message that distinguishes server trouble from connectivity, and a manual retry control. My example: a status widget that auto-retried a decommissioned endpoint forever — the 404 never changed, but the spinner never stopped, and users waited politely on a request that could not succeed. Three retries and an honest 'this feature is unavailable' would have respected everyone's time, including the server's.",
      rubric: [
        {
          id: 'transport-contract',
          label: "What fetch's promise models",
          description:
            'States that fetch fulfills for any delivered response and rejects only on transport failure, and uses it to explain why non-200s reached the retry loop through the success path.',
        },
        {
          id: 'transient-vs-permanent',
          label: 'Transient versus permanent',
          description:
            'Sorts outcomes by whether the world can change before the next attempt: network/5xx/429 retryable, other 4xx permanent, successes never retried — with the 404-stays-404 style reasoning.',
        },
        {
          id: 'backoff-and-budget',
          label: 'Backoff, cap, and budget',
          description:
            'Explains what immediate unbounded retries do to a struggling server and prescribes capped exponential backoff with a small attempt budget.',
        },
        {
          id: 'idempotency-danger',
          label: 'The non-idempotent POST',
          description:
            'Identifies that a failed-looking attempt may have succeeded invisibly, so auto-retrying a charging POST risks double execution; reserves automatic retries for safely repeatable requests.',
        },
        {
          id: 'honest-giveup',
          label: 'Giving up is a state',
          description:
            'Describes the budget-exhausted path as an explicit error state with a distinguishing message and manual retry, not a silent or infinite loop.',
        },
      ],
    },
  ],
  approaches: {
    'plan-the-retry': [
      {
        name: 'Budget first, then triage, then backoff',
        code: `type RequestOutcome =
  | { kind: 'network-error' }
  | { kind: 'http'; status: number }

type RetryPlan = { retry: false } | { retry: true; delayMs: number }

export function planRetry(
  outcome: RequestOutcome,
  attempt: number,
  maxAttempts: number,
): RetryPlan {
  if (attempt >= maxAttempts) {
    return { retry: false }
  }

  const transient =
    outcome.kind === 'network-error' ||
    outcome.status === 429 ||
    outcome.status >= 500

  if (!transient) {
    return { retry: false }
  }

  // Exponential backoff with a cap: 200, 400, 800, ... up to 5000.
  const delayMs = Math.min(200 * 2 ** (attempt - 1), 5000)
  return { retry: true, delayMs }
}`,
        explanation:
          "Three questions, asked in the order that keeps each one simple. The budget check comes first because it overrides everything: a spent budget refuses even a fresh network error, and putting it first means no other branch needs to remember it. The triage is one boolean built from the lesson's transient list — network errors, 5xx, and 429 — and notice what falls through it: not just the permanent 4xx family, but successes too, since a 200 handed to a retry planner should plan nothing. That narrowing rides on lesson 26's machinery: checking kind first is what lets the status reads compile at all. The delay line is the whole backoff policy in one expression — the exponent uses the just-completed attempt so the first retry waits the base 200ms, and Math.min supplies the cap, which the attempt-7 test pins by demanding 5000 where uncapped growth would ask for 12800. Returning a plan rather than sleeping keeps the function pure and testable; the caller owns the timer, and lesson 24's AbortController can still cancel the wait.",
        complexity:
          'O(1) time and space. The guarantee that matters is totality with restraint: every outcome maps to an explicit plan, and only outcomes the world might change ever earn one.',
      },
    ],
    'report-the-status': [
      {
        name: 'One ok-check, three honest exits',
        code: `import { useState } from 'react'

// A miniature network: requests wait here until a respond button settles
// them, so the tests control status codes and failures exactly.
type FakeResponse = { ok: boolean; status: number; json: () => Promise<unknown> }
type PendingFetch = {
  resolve: (response: FakeResponse) => void
  reject: (error: Error) => void
}
const pendingFetches: PendingFetch[] = []

function fakeFetch(): Promise<FakeResponse> {
  return new Promise((resolve, reject) => {
    pendingFetches.push({ resolve, reject })
  })
}

function respond(status: number, body: unknown) {
  pendingFetches.shift()?.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  })
}

function failNetwork() {
  pendingFetches.shift()?.reject(new TypeError('fetch failed'))
}

type DashboardState =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | { phase: 'loaded'; items: string[] }

export function StatusDashboard() {
  const [state, setState] = useState<DashboardState>({ phase: 'idle' })

  const load = async () => {
    setState({ phase: 'loading' })
    try {
      const response = await fakeFetch()

      // fetch fulfills for every response the server manages to send; only
      // the status says whether it was an answer or an apology.
      if (!response.ok) {
        setState({ phase: 'error', message: \`server error (\${response.status})\` })
        return
      }

      const body = (await response.json()) as { items: string[] }
      setState({ phase: 'loaded', items: body.items })
    } catch {
      setState({ phase: 'error', message: 'could not reach the server' })
    }
  }

  return (
    <div>
      {state.phase === 'idle' && <p>no items loaded</p>}
      {state.phase === 'loading' && <p>loading…</p>}
      {state.phase === 'error' && <p role="alert">{state.message}</p>}
      {state.phase === 'loaded' && <p>loaded {state.items.length} items</p>}
      <button onClick={load}>load items</button>
      <button onClick={() => respond(200, { items: ['a', 'b', 'c'] })}>
        respond 200
      </button>
      <button onClick={() => respond(500, { error: 'database down' })}>
        respond 500
      </button>
      <button onClick={failNetwork}>fail network</button>
    </div>
  )
}`,
        explanation:
          "The fix is four lines, and their position is the entire point: the ok-check sits after the await and before the parse. After the await, because that is where the response exists at all — the catch below it only ever sees transport failures, which is fetch's contract. Before the parse, because a non-OK body is an apology, not data: the starter parsed { error: 'database down' }, cast it into having items, recorded a successful load of undefined, and crashed in render at .length — outside the try, far from the fetch, exactly where this family of bug always surfaces. With the early return in place, each of the network's three moods gets its own exit into the status union: ok responses parse and load, non-OK responses become 'server error (status)', and rejections keep the catch's connectivity message. The union from lesson 39 is what makes the render side trivial — .length is only reachable in the loaded member, so no phase can ever ask undefined for its length again. The retry test closes the loop: an error is a state you leave by loading again, not a dead end.",
        complexity:
          'O(1) work per response beyond the parse. The guarantee that matters is exhaustiveness: every way the network can answer — or fail to — lands in exactly one member of the state union.',
      },
    ],
  },
}
