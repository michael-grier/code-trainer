import Concept from './concept.mdx'

import type { Lesson } from '../../types'

const invoiceRoutes = [
  'GET /invoices',
  'POST /invoices',
  'GET /invoices/:id',
  'PATCH /invoices/:id',
  'GET /invoices/:id/reminders',
]

const firstOrder = { id: 1, sku: 'mug-blue', quantity: 1 }
const firstReply = { status: 201, body: { order: firstOrder } }
const emptyState = { orders: [], replies: {} }
const stateAfterFirst = {
  orders: [firstOrder],
  replies: { chk_7f3a: firstReply },
}
const invalidOrderResponse = {
  status: 400,
  body: {
    error: {
      code: 'invalid_order',
      message: 'sku must be a non-empty string and quantity a positive whole number',
    },
  },
}

// Each test gets its own copy so a submission that mutates its input cannot
// leak changes into the next test's fixture.
const invoiceFixture = () => [
  { id: 1, total: 40, status: 'draft' },
  { id: 2, total: 90, status: 'paid' },
]

export const lesson: Lesson = {
  slug: 'http-apis-and-request-lifecycle',
  title: 'HTTP APIs and Request Lifecycle',
  summary:
    'Trace requests through routing, validation, authorization, handlers, and responses.',
  track: 'backend-data',
  order: 46,
  concept: Concept,
  problems: [
    {
      id: 'match-route',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Match a request to a route',
      prompt:
        'Implement `matchRoute`. It receives the route table as strings of the form "METHOD /path/pattern", plus the request method and path, and reports the routing decision. A pattern segment that starts with ":" captures exactly one non-empty path segment as a string parameter; every other segment must match literally, and the segment counts must be equal. Ignore anything from "?" onward in the path and ignore a trailing slash. If a route matches both path and method, return `{ kind: "match", route, params }` with the matching route string and its captured parameters. If at least one route matches the path but none matches the method, return `{ kind: "method-not-allowed", allowed }` listing the methods of the path-matching routes in route-table order. Otherwise return `{ kind: "not-found" }`. Example: `matchRoute(["GET /invoices", "GET /invoices/:id", "PATCH /invoices/:id"], "DELETE", "/invoices/42")` returns `{ kind: "method-not-allowed", allowed: ["GET", "PATCH"] }`.',
      estimatedMinutes: 20,
      functionName: 'matchRoute',
      starter: `type RouteMatch =
  | { kind: 'match'; route: string; params: Record<string, string> }
  | { kind: 'method-not-allowed'; allowed: string[] }
  | { kind: 'not-found' }

export function matchRoute(
  routes: string[],
  method: string,
  path: string,
): RouteMatch {
  return { kind: 'not-found' }
}

console.log(
  matchRoute(
    ['GET /invoices', 'GET /invoices/:id', 'PATCH /invoices/:id'],
    'DELETE',
    '/invoices/42',
  ),
)
`,
      tests: [
        {
          name: 'matches a literal collection route',
          args: [invoiceRoutes, 'GET', '/invoices'],
          expected: { kind: 'match', route: 'GET /invoices', params: {} },
        },
        {
          name: 'captures a path parameter as a string',
          args: [invoiceRoutes, 'GET', '/invoices/42'],
          expected: {
            kind: 'match',
            route: 'GET /invoices/:id',
            params: { id: '42' },
          },
        },
        {
          name: 'matches a nested sub-resource route',
          args: [invoiceRoutes, 'GET', '/invoices/42/reminders'],
          expected: {
            kind: 'match',
            route: 'GET /invoices/:id/reminders',
            params: { id: '42' },
          },
        },
        {
          name: 'ignores the query string when matching',
          args: [invoiceRoutes, 'GET', '/invoices?limit=5'],
          expected: { kind: 'match', route: 'GET /invoices', params: {} },
        },
        {
          name: 'reports method-not-allowed with allowed methods in route order',
          args: [invoiceRoutes, 'DELETE', '/invoices/42'],
          expected: { kind: 'method-not-allowed', allowed: ['GET', 'PATCH'] },
        },
        {
          name: 'reports not-found when no pattern matches the path',
          args: [invoiceRoutes, 'GET', '/customers/7'],
          expected: { kind: 'not-found' },
        },
        {
          name: 'does not let a parameter span two segments',
          args: [invoiceRoutes, 'GET', '/invoices/42/history'],
          expected: { kind: 'not-found' },
        },
        {
          name: 'does not match when the request has fewer segments than the pattern',
          args: [invoiceRoutes, 'GET', '/'],
          expected: { kind: 'not-found' },
        },
        {
          name: 'tolerates a trailing slash',
          args: [invoiceRoutes, 'POST', '/invoices/'],
          expected: { kind: 'match', route: 'POST /invoices', params: {} },
        },
      ],
    },
    {
      id: 'create-order-idempotent',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Make order creation safe to retry',
      prompt:
        'Implement `createOrder`, the pure handler behind `POST /orders`. It receives the current state, `{ orders, replies }`, where `replies` maps idempotency keys to stored responses, and a request `{ headers, body }`. Steps, in order: if the `idempotency-key` header is missing or empty, respond 400 with `{ error: { code: "missing_idempotency_key", message: "Idempotency-Key header is required" } }`. If `replies` already holds that key, return the stored response and the state unchanged, without looking at the body. Otherwise validate the body: it must be an object with a non-empty string `sku` and a positive whole-number `quantity`, or respond 400 with `{ error: { code: "invalid_order", message: "sku must be a non-empty string and quantity a positive whole number" } }` and store nothing. On success create `{ id: orders.length + 1, sku, quantity }`, respond 201 with `{ order }`, and return new state with the order appended and the response stored under the key. Always return `{ response: { status, body }, state }` and never mutate the input state. Example: `createOrder({ orders: [], replies: {} }, { headers: { "idempotency-key": "chk_7f3a" }, body: { sku: "mug-blue", quantity: 1 } })` returns `{ response: { status: 201, body: { order: { id: 1, sku: "mug-blue", quantity: 1 } } }, state: { orders: [{ id: 1, sku: "mug-blue", quantity: 1 }], replies: { chk_7f3a: { status: 201, body: { order: { id: 1, sku: "mug-blue", quantity: 1 } } } } } }`.',
      estimatedMinutes: 25,
      functionName: 'createOrder',
      starter: `type Order = { id: number; sku: string; quantity: number }

type Reply = { status: number; body: unknown }

type OrderState = { orders: Order[]; replies: Record<string, Reply> }

type OrderRequest = { headers: Record<string, string>; body: unknown }

export function createOrder(
  state: OrderState,
  request: OrderRequest,
): { response: Reply; state: OrderState } {
  return { response: { status: 500, body: null }, state }
}

console.log(
  createOrder(
    { orders: [], replies: {} },
    {
      headers: { 'idempotency-key': 'chk_7f3a' },
      body: { sku: 'mug-blue', quantity: 1 },
    },
  ),
)
`,
      tests: [
        {
          name: 'creates the first order with 201 and records the reply under its key',
          args: [
            emptyState,
            {
              headers: { 'idempotency-key': 'chk_7f3a' },
              body: { sku: 'mug-blue', quantity: 1 },
            },
          ],
          expected: { response: firstReply, state: stateAfterFirst },
        },
        {
          name: 'replays the stored reply for a repeated key without creating a second order',
          args: [
            stateAfterFirst,
            {
              headers: { 'idempotency-key': 'chk_7f3a' },
              body: { sku: 'mug-blue', quantity: 1 },
            },
          ],
          expected: { response: firstReply, state: stateAfterFirst },
        },
        {
          name: 'creates a second order for a new key',
          args: [
            stateAfterFirst,
            {
              headers: { 'idempotency-key': 'chk_9b21' },
              body: { sku: 'mug-red', quantity: 2 },
            },
          ],
          expected: {
            response: {
              status: 201,
              body: { order: { id: 2, sku: 'mug-red', quantity: 2 } },
            },
            state: {
              orders: [firstOrder, { id: 2, sku: 'mug-red', quantity: 2 }],
              replies: {
                chk_7f3a: firstReply,
                chk_9b21: {
                  status: 201,
                  body: { order: { id: 2, sku: 'mug-red', quantity: 2 } },
                },
              },
            },
          },
        },
        {
          name: 'rejects a request with no Idempotency-Key header',
          args: [emptyState, { headers: {}, body: { sku: 'mug-blue', quantity: 1 } }],
          expected: {
            response: {
              status: 400,
              body: {
                error: {
                  code: 'missing_idempotency_key',
                  message: 'Idempotency-Key header is required',
                },
              },
            },
            state: emptyState,
          },
        },
        {
          name: 'rejects a non-positive quantity and stores nothing',
          args: [
            emptyState,
            {
              headers: { 'idempotency-key': 'chk_0000' },
              body: { sku: 'mug-blue', quantity: 0 },
            },
          ],
          expected: { response: invalidOrderResponse, state: emptyState },
        },
        {
          name: 'rejects a body that is not an object',
          args: [
            emptyState,
            { headers: { 'idempotency-key': 'chk_0000' }, body: 'mug-blue' },
          ],
          expected: { response: invalidOrderResponse, state: emptyState },
        },
        {
          name: 'rejects a fractional quantity',
          args: [
            emptyState,
            {
              headers: { 'idempotency-key': 'chk_0000' },
              body: { sku: 'mug-blue', quantity: 1.5 },
            },
          ],
          expected: { response: invalidOrderResponse, state: emptyState },
        },
        {
          name: 'replays before validating, so a known key answers even with a bad body',
          args: [
            stateAfterFirst,
            { headers: { 'idempotency-key': 'chk_7f3a' }, body: null },
          ],
          expected: { response: firstReply, state: stateAfterFirst },
        },
      ],
    },
    {
      id: 'fix-update-stage-order',
      kind: 'debug',
      completionMode: 'all-tests-pass',
      title: 'Fix the update handler that acts before it decides',
      prompt:
        'applyInvoiceUpdate is the pure handler behind `PATCH /invoices/:id`. It receives the invoice list, the invoice id, and the patch, and returns `{ status, body, invoices }` where `invoices` is the list after the request. The rules: a missing invoice is 404 with `{ error: { code: "not_found", message: "invoice <id> not found" } }`; a paid invoice cannot change and is 409 with `{ error: { code: "invoice_paid", message: "invoice <id> is paid and can no longer change" } }`; the patch may contain `total` (a number of at least 0) and `status` (one of "draft", "sent", "paid"), and any problem is 400 with `{ error: { code: "invalid_patch", message } }` where message joins every problem with "; " in patch field order using "total must be a number of at least 0", "status must be one of draft, sent, paid", and "unknown field <name>". On any failure the returned list must equal the input list. On success return 200 with `{ invoice }` and the list with that invoice replaced. In production, rejected patches are leaving invoices half-changed and a request for an unknown id crashes the process. Fix the stage order. Example: `applyInvoiceUpdate([{ id: 1, total: 40, status: "draft" }], 1, { total: -5 })` should return `{ status: 400, body: { error: { code: "invalid_patch", message: "total must be a number of at least 0" } }, invoices: [{ id: 1, total: 40, status: "draft" }] }`.',
      estimatedMinutes: 20,
      functionName: 'applyInvoiceUpdate',
      brokenCode: `type Invoice = { id: number; total: number; status: 'draft' | 'sent' | 'paid' }

type UpdateResponse = { status: number; body: unknown; invoices: Invoice[] }

const statuses = ['draft', 'sent', 'paid'] as const

export function applyInvoiceUpdate(
  invoices: Invoice[],
  id: number,
  patch: Record<string, unknown>,
): UpdateResponse {
  const index = invoices.findIndex((candidate) => candidate.id === id)
  const invoice = invoices[index]
  const errors: string[] = []

  for (const [field, value] of Object.entries(patch)) {
    if (field === 'total') {
      invoice.total = value as number
      if (typeof value !== 'number' || value < 0) {
        errors.push('total must be a number of at least 0')
      }
    } else if (field === 'status') {
      invoice.status = value as Invoice['status']
      if (!statuses.some((status) => status === value)) {
        errors.push('status must be one of draft, sent, paid')
      }
    } else {
      errors.push(\`unknown field \${field}\`)
    }
  }

  if (index === -1) {
    return {
      status: 404,
      body: { error: { code: 'not_found', message: \`invoice \${id} not found\` } },
      invoices,
    }
  }

  if (errors.length > 0) {
    return {
      status: 400,
      body: { error: { code: 'invalid_patch', message: errors.join('; ') } },
      invoices,
    }
  }

  return { status: 200, body: { invoice }, invoices }
}

console.log(
  applyInvoiceUpdate([{ id: 1, total: 40, status: 'draft' }], 1, { total: -5 }),
)
`,
      bugHints: [
        'List the stages in the order the function runs them. Which one changes state, and what runs after it?',
        'The type of invoice says Invoice, but what is invoices[-1] at runtime?',
        'One rule from the prompt is never checked at all. Where in the order does a rule about the current state of the resource belong?',
        'Validate the whole patch into a separate object first. Only when it is clean should a new invoice be built, and the input list should not be edited in place.',
      ],
      tests: [
        {
          name: 'applies a valid total change and returns the updated list',
          args: [invoiceFixture(), 1, { total: 55 }],
          expected: {
            status: 200,
            body: { invoice: { id: 1, total: 55, status: 'draft' } },
            invoices: [
              { id: 1, total: 55, status: 'draft' },
              { id: 2, total: 90, status: 'paid' },
            ],
          },
        },
        {
          name: 'applies a status change',
          args: [invoiceFixture(), 1, { status: 'sent' }],
          expected: {
            status: 200,
            body: { invoice: { id: 1, total: 40, status: 'sent' } },
            invoices: [
              { id: 1, total: 40, status: 'sent' },
              { id: 2, total: 90, status: 'paid' },
            ],
          },
        },
        {
          name: 'returns 404 for a missing invoice instead of crashing',
          args: [invoiceFixture(), 9, { total: 55 }],
          expected: {
            status: 404,
            body: { error: { code: 'not_found', message: 'invoice 9 not found' } },
            invoices: invoiceFixture(),
          },
        },
        {
          name: 'rejects a negative total and leaves the invoice untouched',
          args: [invoiceFixture(), 1, { total: -5 }],
          expected: {
            status: 400,
            body: {
              error: {
                code: 'invalid_patch',
                message: 'total must be a number of at least 0',
              },
            },
            invoices: invoiceFixture(),
          },
        },
        {
          name: 'rejects an invalid patch entirely, applying none of its fields',
          args: [invoiceFixture(), 1, { total: 55, status: 'archived' }],
          expected: {
            status: 400,
            body: {
              error: {
                code: 'invalid_patch',
                message: 'status must be one of draft, sent, paid',
              },
            },
            invoices: invoiceFixture(),
          },
        },
        {
          name: 'rejects an unknown field',
          args: [invoiceFixture(), 1, { ownerId: 7 }],
          expected: {
            status: 400,
            body: {
              error: { code: 'invalid_patch', message: 'unknown field ownerId' },
            },
            invoices: invoiceFixture(),
          },
        },
        {
          name: 'refuses to change a paid invoice with 409',
          args: [invoiceFixture(), 2, { total: 10 }],
          expected: {
            status: 409,
            body: {
              error: {
                code: 'invoice_paid',
                message: 'invoice 2 is paid and can no longer change',
              },
            },
            invoices: invoiceFixture(),
          },
        },
        {
          name: 'reports every problem in patch field order',
          args: [invoiceFixture(), 1, { total: 'lots', status: 'archived' }],
          expected: {
            status: 400,
            body: {
              error: {
                code: 'invalid_patch',
                message:
                  'total must be a number of at least 0; status must be one of draft, sent, paid',
              },
            },
            invoices: invoiceFixture(),
          },
        },
      ],
    },
    {
      id: 'timeout-and-idempotency-review',
      kind: 'written',
      completionMode: 'submitted-with-reference-review',
      title: 'Explain why a timeout is not a no',
      prompt:
        'A teammate proposes fixing the duplicate-order incident by having the client never retry POST requests. In your own words: why does a timed-out request tell the client nothing about what the server did, why is "never retry" a poor fix, how do idempotency keys make the retry safe, where in the request pipeline does the key check belong and why there, and what does the mechanism cost? Use concrete headers, status codes, and pipeline stages.',
      estimatedMinutes: 12,
      referenceAnswer:
        'A timeout is the client deciding to stop waiting. The request may never have reached the server, it may have arrived and be in progress, or it may have finished with a response that is still in flight. All three look identical from the client, so a timeout says nothing about whether the server acted. In the incident the server did act both times: it created order 1 during attempt 1, and order 2 during attempt 2, while the client saw two timeouts and told the customer checkout had failed.\n\nNever retrying trades one failure for another. Without retries every transient blip, a slow database or a dropped packet, becomes a user-visible failure, and the user retries by hand, clicking the button again, which is the same duplicate with a worse experience. The client cannot fix this because it cannot distinguish the three outcomes; the server can, if the two attempts identify themselves as the same operation.\n\nThat is what an idempotency key does. The client generates one key per operation, not per attempt, and sends it as the Idempotency-Key header on every attempt. The server stores the response it produced under that key and, when the key arrives again, replays the stored response instead of running the handler. Attempt 1 still creates order 1, because nothing un-sends a request, but attempt 2 gets 201 with order 1 back in a millisecond and creates nothing. POST becomes safe to retry.\n\nThe check belongs after routing and authentication and before the handler, and specifically before body validation. It has to come after authentication because keys must be scoped to the caller, so one user cannot replay another user\'s reply. It has to come before the handler because the handler is the stage that does the work, and the whole point is to skip it. It comes before validation because a stored reply means the work is done, and the honest answer for a repeated key is the answer that work produced, regardless of the body on the retry.\n\nThe cost is state and edge cases. The server needs a store of keys and replies with an expiry so it does not grow forever. A retry that arrives while the first attempt is still running finds no stored reply yet, so production systems mark a key as in progress and answer the overlap with 409 or by waiting. Those costs are why the mechanism goes on the endpoints where a duplicate is expensive, such as checkout and payments, rather than on every route.',
      rubric: [
        {
          id: 'timeout-ambiguity',
          label: 'Timeout tells the client nothing',
          description:
            'Explains that a timed-out request may not have arrived, may be in progress, or may have completed, and that the client cannot tell which.',
        },
        {
          id: 'never-retry-cost',
          label: 'Why never retrying is a poor fix',
          description:
            'Argues that removing retries turns transient failures into user-visible ones and that users retry by hand anyway, so the duplicate returns with a worse experience.',
        },
        {
          id: 'key-mechanism',
          label: 'Idempotency keys explained correctly',
          description:
            'Describes one key per operation sent on every attempt, the server storing and replaying the response for a repeated key, and the first attempt still doing its work.',
        },
        {
          id: 'pipeline-placement',
          label: 'Key check placed in the pipeline with reasons',
          description:
            'Places the check after authentication (keys scoped to the caller) and before the handler and body validation, with a reason for each ordering.',
        },
        {
          id: 'honest-costs',
          label: 'Names the costs',
          description:
            'Mentions at least two of: a key store with expiry, in-flight retries needing an in-progress marker or 409, and limiting the mechanism to endpoints where duplicates are expensive.',
        },
      ],
    },
  ],
  approaches: {
    'match-route': [
      {
        name: 'Compare segment by segment, collect the near misses',
        code: `type RouteMatch =
  | { kind: 'match'; route: string; params: Record<string, string> }
  | { kind: 'method-not-allowed'; allowed: string[] }
  | { kind: 'not-found' }

export function matchRoute(
  routes: string[],
  method: string,
  path: string,
): RouteMatch {
  // Drop the query string, then split into segments. Filtering empty
  // strings handles the leading slash and a trailing one in the same step.
  const requestSegments = path
    .split('?')[0]
    .split('/')
    .filter((segment) => segment !== '')

  // Methods of routes whose path matched but whose method did not.
  const allowed: string[] = []

  for (const route of routes) {
    const [routeMethod, pattern] = route.split(' ')
    const patternSegments = pattern
      .split('/')
      .filter((segment) => segment !== '')

    // A parameter captures exactly one segment, so the counts must agree.
    if (patternSegments.length !== requestSegments.length) continue

    const params: Record<string, string> = {}
    let matched = true

    for (let i = 0; i < patternSegments.length; i++) {
      const expected = patternSegments[i]
      const actual = requestSegments[i]

      if (expected.startsWith(':')) {
        // Captured values stay strings; parsing "42" is the handler's job.
        params[expected.slice(1)] = actual
      } else if (expected !== actual) {
        matched = false
        break
      }
    }

    if (!matched) continue

    if (routeMethod === method) {
      return { kind: 'match', route, params }
    }

    allowed.push(routeMethod)
  }

  // The path exists but not with this method: 405 with an Allow list is the
  // honest answer. Only when no path matched at all is it a 404.
  if (allowed.length > 0) {
    return { kind: 'method-not-allowed', allowed }
  }

  return { kind: 'not-found' }
}`,
        explanation:
          'The matcher compares one pattern segment against one request segment, so a parameter can never swallow two segments and a request with the wrong number of segments is rejected before any comparison. The part that separates a good router from a naive one is what happens on a miss. Instead of returning not-found at the first route that fails, the loop remembers every route whose path matched and only returns not-found when that list is empty; otherwise it reports method-not-allowed with the methods that would have worked, in table order. Query strings are stripped before splitting because they are not part of the path, and captured parameters are left as strings because turning "42" into a number, or rejecting "abc", belongs to the handler that knows what the id means.',
        complexity:
          'O(r × s) time for r routes and s path segments, O(s) space for the segments and parameters. The guarantee that matters is the 404 versus 405 distinction, which tells a client whether the resource exists.',
      },
    ],
    'create-order-idempotent': [
      {
        name: 'Reject, replay, validate, then create',
        code: `type Order = { id: number; sku: string; quantity: number }

type Reply = { status: number; body: unknown }

type OrderState = { orders: Order[]; replies: Record<string, Reply> }

type OrderRequest = { headers: Record<string, string>; body: unknown }

export function createOrder(
  state: OrderState,
  request: OrderRequest,
): { response: Reply; state: OrderState } {
  const key = request.headers['idempotency-key']

  // Without a key the server cannot recognize a retry, so refuse up front.
  if (key === undefined || key === '') {
    return {
      response: {
        status: 400,
        body: {
          error: {
            code: 'missing_idempotency_key',
            message: 'Idempotency-Key header is required',
          },
        },
      },
      state,
    }
  }

  // A stored reply means this operation already ran. Replay it and skip
  // everything else, including validation: the work is done.
  const stored = state.replies[key]
  if (stored !== undefined) {
    return { response: stored, state }
  }

  // The body is unknown until each field is checked. Nothing is stored for
  // a rejected body, because nothing happened.
  const body = request.body
  const record =
    typeof body === 'object' && body !== null
      ? (body as Record<string, unknown>)
      : undefined
  const sku = record?.sku
  const quantity = record?.quantity

  if (
    typeof sku !== 'string' ||
    sku === '' ||
    typeof quantity !== 'number' ||
    !Number.isInteger(quantity) ||
    quantity < 1
  ) {
    return {
      response: {
        status: 400,
        body: {
          error: {
            code: 'invalid_order',
            message:
              'sku must be a non-empty string and quantity a positive whole number',
          },
        },
      },
      state,
    }
  }

  // The handler stage: build the order and the reply, then return new state
  // with both recorded. The input state is never edited.
  const order: Order = { id: state.orders.length + 1, sku, quantity }
  const response: Reply = { status: 201, body: { order } }

  return {
    response,
    state: {
      orders: [...state.orders, order],
      replies: { ...state.replies, [key]: response },
    },
  }
}`,
        explanation:
          'The function is the lesson\'s pipeline in miniature, and the order of its four checks is the content. The missing-key check comes first because a request the server cannot recognize on retry should not be allowed to create anything. The replay check comes before validation because a stored reply proves the work already happened, and the only honest response is the one that work produced, whatever body the retry carried. Validation comes before creation so a bad body changes nothing and stores nothing, leaving the key free for a corrected attempt. Creation returns new state with the order appended and the reply recorded rather than pushing into the input, which is what lets the tests hand the same state object to several calls and what makes the handler safe to reason about.',
        complexity:
          'O(1) time per request with a Map-like store, O(k) space for k stored replies. The guarantee that matters is that a repeated key never creates a second order.',
      },
    ],
    'fix-update-stage-order': [
      {
        name: 'Look up, reject, validate, then build a new invoice',
        code: `type Invoice = { id: number; total: number; status: 'draft' | 'sent' | 'paid' }

type UpdateResponse = { status: number; body: unknown; invoices: Invoice[] }

const statuses = ['draft', 'sent', 'paid'] as const

export function applyInvoiceUpdate(
  invoices: Invoice[],
  id: number,
  patch: Record<string, unknown>,
): UpdateResponse {
  // Stage 1: look up. find returns undefined for a miss, and the check runs
  // before anything reads a field, so a bad id is a 404 and not a crash.
  const invoice = invoices.find((candidate) => candidate.id === id)
  if (!invoice) {
    return {
      status: 404,
      body: { error: { code: 'not_found', message: \`invoice \${id} not found\` } },
      invoices,
    }
  }

  // Stage 2: rules about the resource's current state. The request may be
  // well-formed and still impossible, which is what 409 says.
  if (invoice.status === 'paid') {
    return {
      status: 409,
      body: {
        error: {
          code: 'invoice_paid',
          message: \`invoice \${id} is paid and can no longer change\`,
        },
      },
      invoices,
    }
  }

  // Stage 3: validate the whole patch into a separate object. The invoice
  // is not touched, so a rejected patch leaves nothing half-applied.
  const errors: string[] = []
  const changes: Partial<Invoice> = {}

  for (const [field, value] of Object.entries(patch)) {
    if (field === 'total') {
      if (typeof value !== 'number' || value < 0) {
        errors.push('total must be a number of at least 0')
      } else {
        changes.total = value
      }
    } else if (field === 'status') {
      const match = statuses.find((status) => status === value)
      if (match === undefined) {
        errors.push('status must be one of draft, sent, paid')
      } else {
        changes.status = match
      }
    } else {
      errors.push(\`unknown field \${field}\`)
    }
  }

  if (errors.length > 0) {
    return {
      status: 400,
      body: { error: { code: 'invalid_patch', message: errors.join('; ') } },
      invoices,
    }
  }

  // Stage 4: act, once, by building a new invoice and a new list.
  const updated: Invoice = { ...invoice, ...changes }

  return {
    status: 200,
    body: { invoice: updated },
    invoices: invoices.map((candidate) =>
      candidate.id === id ? updated : candidate,
    ),
  }
}`,
        explanation:
          'The broken handler ran its stages in the wrong order and skipped one. It wrote each patch field onto the invoice as it went and only collected errors afterward, so a patch with one bad field left the good fields applied and returned 400 with a list that no longer matched the caller\'s view. It also read the invoice before checking whether the lookup found anything; the type said Invoice because indexing an array never produces undefined in the type system, but invoices[-1] is undefined at runtime and the first assignment crashed. And no stage ever checked the paid rule. The fix is the order from the lesson: look up and stop with 404, apply state rules and stop with 409, validate the entire patch into a separate changes object and stop with 400, and only then build a new invoice and a new list. Nothing edits the input, which is what makes the failure branches able to return it unchanged.',
        complexity:
          'O(n) time over the invoice list and O(n) space for the new list. The guarantee that matters is atomicity: a rejected request changes nothing, and an accepted one changes exactly one invoice.',
      },
    ],
  },
}
