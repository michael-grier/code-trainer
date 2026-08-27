import Concept from './concept.mdx'

import type { Lesson } from '../../types'

export const lesson: Lesson = {
  slug: 'api-design-and-resource-modeling',
  title: 'API Design and Resource Modeling',
  summary:
    'Design resource-oriented APIs with clear shapes, errors, and evolution paths.',
  track: 'backend-data',
  order: 47,
  concept: Concept,
  problems: [
    {
      id: 'parse-list-query',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Validate the query parameters of a list endpoint',
      prompt:
        'Implement `parseListQuery`. It receives the raw query parameters of `GET /invoices` as a record of strings and either normalizes them or rejects them. The rules: `limit` defaults to 20 and, when present, must be a whole number from 1 to 100; `cursor` defaults to null and, when present, must not be an empty string; `sort` defaults to "createdAt" and, when present, must be one of "createdAt", "total", or "status". Unknown parameters are ignored. On success return `{ ok: true, query: { limit, cursor, sort } }`. On failure return `{ ok: false, errors }`, collecting every problem in the fixed order limit, cursor, sort, using these exact strings: "limit must be a whole number between 1 and 100", "cursor must not be empty", "sort must be one of createdAt, total, status". Example: `parseListQuery({ limit: "25", sort: "total" })` returns `{ ok: true, query: { limit: 25, cursor: null, sort: "total" } }`.',
      estimatedMinutes: 20,
      functionName: 'parseListQuery',
      starter: `type ListQuery = {
  limit: number
  cursor: string | null
  sort: 'createdAt' | 'total' | 'status'
}

type ParseResult =
  | { ok: true; query: ListQuery }
  | { ok: false; errors: string[] }

export function parseListQuery(params: Record<string, string>): ParseResult {
  return { ok: false, errors: [] }
}

console.log(parseListQuery({ limit: '25', sort: 'total' }))
`,
      tests: [
        {
          name: 'applies every default when no parameters arrive',
          args: [{}],
          expected: {
            ok: true,
            query: { limit: 20, cursor: null, sort: 'createdAt' },
          },
        },
        {
          name: 'normalizes valid limit and sort',
          args: [{ limit: '25', sort: 'total' }],
          expected: {
            ok: true,
            query: { limit: 25, cursor: null, sort: 'total' },
          },
        },
        {
          name: 'passes a cursor through untouched',
          args: [{ cursor: 'aW52XzQy' }],
          expected: {
            ok: true,
            query: { limit: 20, cursor: 'aW52XzQy', sort: 'createdAt' },
          },
        },
        {
          name: 'rejects a limit that is not a number',
          args: [{ limit: 'abc' }],
          expected: {
            ok: false,
            errors: ['limit must be a whole number between 1 and 100'],
          },
        },
        {
          name: 'rejects a fractional limit',
          args: [{ limit: '2.5' }],
          expected: {
            ok: false,
            errors: ['limit must be a whole number between 1 and 100'],
          },
        },
        {
          name: 'rejects a limit above the maximum page size',
          args: [{ limit: '5000' }],
          expected: {
            ok: false,
            errors: ['limit must be a whole number between 1 and 100'],
          },
        },
        {
          name: 'rejects a sort field the API does not expose',
          args: [{ sort: 'passwordHash' }],
          expected: {
            ok: false,
            errors: ['sort must be one of createdAt, total, status'],
          },
        },
        {
          name: 'collects every error in limit, cursor, sort order',
          args: [{ limit: '0', cursor: '', sort: 'nope' }],
          expected: {
            ok: false,
            errors: [
              'limit must be a whole number between 1 and 100',
              'cursor must not be empty',
              'sort must be one of createdAt, total, status',
            ],
          },
        },
        {
          name: 'ignores parameters the endpoint does not know',
          args: [{ debug: 'true', limit: '10' }],
          expected: {
            ok: true,
            query: { limit: 10, cursor: null, sort: 'createdAt' },
          },
        },
      ],
    },
    {
      id: 'fix-lying-status-codes',
      kind: 'debug',
      completionMode: 'all-tests-pass',
      title: 'Fix the handler whose status codes lie',
      prompt:
        'getInvoiceResponse is the pure handler behind `GET /invoices/:id`. It receives the invoice list and the raw id string from the URL. It should return 400 with `{ error: { code: "invalid_id", message: "invoice id must be a positive whole number" } }` when the id is not a positive whole number, 404 with `{ error: { code: "not_found", message: "invoice <id> not found" } }` when no invoice matches, and 200 with `{ invoice }` on success. Right now it reports a malformed id as a server failure, reports a missing invoice as a success, and uses a different error shape on each path. Make every response honest. Example: `getInvoiceResponse([{ id: 1, total: 40, status: "draft" }], "9")` should return `{ status: 404, body: { error: { code: "not_found", message: "invoice 9 not found" } } }`.',
      estimatedMinutes: 15,
      functionName: 'getInvoiceResponse',
      brokenCode: `type Invoice = { id: number; total: number; status: string }

type HandlerResponse = { status: number; body: unknown }

export function getInvoiceResponse(
  invoices: Invoice[],
  rawId: string,
): HandlerResponse {
  const id = Number(rawId)

  if (Number.isNaN(id)) {
    return { status: 500, body: { message: 'something went wrong' } }
  }

  const invoice = invoices.find((candidate) => candidate.id === id)

  if (!invoice) {
    return { status: 200, body: { invoice: null } }
  }

  return { status: 200, body: { invoice } }
}

console.log(getInvoiceResponse([{ id: 1, total: 40, status: 'draft' }], '9'))
`,
      bugHints: [
        'Which status family does a malformed id belong to: did the caller make the mistake, or did the server fail?',
        'What do a cache and a monitoring dashboard conclude when a missing invoice comes back as 200?',
        'Number("2.5") is not NaN. What besides letters should the id check reject?',
        'The lesson used one error shape everywhere: { error: { code, message } }.',
      ],
      tests: [
        {
          name: 'returns 200 with the invoice when it exists',
          args: [[{ id: 1, total: 40, status: 'draft' }], '1'],
          expected: {
            status: 200,
            body: { invoice: { id: 1, total: 40, status: 'draft' } },
          },
        },
        {
          name: 'finds the right invoice among several',
          args: [
            [
              { id: 1, total: 40, status: 'draft' },
              { id: 2, total: 90, status: 'sent' },
            ],
            '2',
          ],
          expected: {
            status: 200,
            body: { invoice: { id: 2, total: 90, status: 'sent' } },
          },
        },
        {
          name: 'returns 404 with a structured error for a missing invoice',
          args: [[{ id: 1, total: 40, status: 'draft' }], '9'],
          expected: {
            status: 404,
            body: {
              error: { code: 'not_found', message: 'invoice 9 not found' },
            },
          },
        },
        {
          name: 'returns 400 for an id that is not a number',
          args: [[{ id: 1, total: 40, status: 'draft' }], 'abc'],
          expected: {
            status: 400,
            body: {
              error: {
                code: 'invalid_id',
                message: 'invoice id must be a positive whole number',
              },
            },
          },
        },
        {
          name: 'returns 400 for a fractional id',
          args: [[{ id: 1, total: 40, status: 'draft' }], '2.5'],
          expected: {
            status: 400,
            body: {
              error: {
                code: 'invalid_id',
                message: 'invoice id must be a positive whole number',
              },
            },
          },
        },
        {
          name: 'returns 400 for a zero or negative id',
          args: [[{ id: 1, total: 40, status: 'draft' }], '0'],
          expected: {
            status: 400,
            body: {
              error: {
                code: 'invalid_id',
                message: 'invoice id must be a positive whole number',
              },
            },
          },
        },
      ],
    },
    {
      id: 'book-club-api-design',
      kind: 'design',
      completionMode: 'submitted-with-rubric-review',
      title: 'Model the API for a book club app',
      prompt:
        'Design the resources and endpoints for the book club app described in the scenario, then defend one routing decision.',
      estimatedMinutes: 25,
      scenario:
        'You are building the backend for a book club app. Users can browse clubs, join a club, and leave it. Each club keeps a reading list of picks, and the club owner adds and removes picks. The mobile team needs: a club list screen, a club detail screen showing its picks, a join button, and a leave button. Some clubs have thousands of members, and the club list will eventually hold tens of thousands of clubs.',
      sections: [
        {
          id: 'resources',
          type: 'entity-list',
          label: 'Resources',
          prompt:
            'Name the resources the API exposes, as nouns. For each, say whether it is a top-level collection or a sub-resource of another, and note any field worth calling out (for example, who owns a club).',
        },
        {
          id: 'endpoints',
          type: 'endpoint-list',
          label: 'Endpoints',
          prompt:
            'List the endpoints as method plus path, one per operation the mobile team needs, plus pick management for the owner. For each, give the success status code, and mark which list endpoints are paginated and why.',
        },
        {
          id: 'membership-routing',
          type: 'tradeoff',
          label: 'Membership routes',
          prompt:
            'A membership connects a user and a club. Choose where membership routes live and justify the choice using the clients this API serves: which requests do the join and leave buttons send, and what status codes come back when a user joins a club twice or leaves one they never joined?',
          options: [
            'Nested under clubs: POST /clubs/:clubId/members and DELETE /clubs/:clubId/members/:userId',
            'Flat top-level collection: POST /memberships and DELETE /memberships/:membershipId',
          ],
        },
        {
          id: 'error-shape',
          type: 'short-answer',
          label: 'Errors',
          prompt:
            'Define the one error body shape every endpoint shares, and show the exact status and body returned when someone who is not the owner tries to add a pick.',
        },
      ],
      rubric: [
        {
          id: 'noun-resources',
          label: 'Nouns, not verbs',
          description:
            'Resources are named as nouns (clubs, picks, members or memberships) and no URL contains a verb like join, leave, or add. Join and leave are expressed through HTTP methods on a membership resource.',
        },
        {
          id: 'honest-status-codes',
          label: 'Status codes match their families',
          description:
            'Creation returns 201, reads return 200, a missing club returns 404, a non-owner adding a pick returns 403, and a malformed request returns 400. No failure travels inside a 200.',
        },
        {
          id: 'paginated-lists',
          label: 'Unbounded lists are paginated',
          description:
            'The club list and the member list of a large club take a limit and cursor and return a nextCursor, since both grow without bound. Small bounded lists, like the picks of one club, may reasonably skip pagination if the answer says why.',
        },
        {
          id: 'tradeoff-grounded-in-clients',
          label: 'Routing tradeoff argued from clients',
          description:
            'The nested-versus-flat membership choice is justified by the requests the join and leave buttons actually send, not by taste. Either option can earn full credit with client-grounded reasoning.',
        },
        {
          id: 'consistent-error-shape',
          label: 'One error shape',
          description:
            'A single { error: { code, message } } body shape is defined once and used for the 403, 404, and 400 cases rather than a different shape per endpoint.',
        },
      ],
      referenceAnswer:
        'Resources. Three nouns cover the app: clubs (top-level collection, each with an ownerId), picks (sub-resource of a club, since a pick has no meaning outside its club), and members (sub-resource of a club, connecting a user to it). Users exist as a resource too but this feature set only reads them through memberships.\n\nEndpoints. GET /clubs returns the club list, paginated with limit and cursor because tens of thousands of clubs will not fit in one response; 200 with { items, nextCursor }. GET /clubs/:clubId returns one club for the detail screen, 200, or 404 with a structured error when the id matches nothing. GET /clubs/:clubId/picks returns the reading list, 200; a reading list is short and bounded, so pagination is defensible to skip, but the members list is not: GET /clubs/:clubId/members must take limit and cursor because some clubs have thousands of members. POST /clubs/:clubId/picks adds a pick, 201, owner only. DELETE /clubs/:clubId/picks/:pickId removes one, 200 (or 204). POST /clubs/:clubId/members joins the club, 201. DELETE /clubs/:clubId/members/:userId leaves it, 200.\n\nMembership routing. I would nest under clubs. Both buttons live on the club detail screen, where the client already holds clubId, so the join button sends POST /clubs/:clubId/members with no body and the leave button sends DELETE /clubs/:clubId/members/:userId, no extra lookups. The flat /memberships design forces the client to remember or re-fetch a membershipId before it can leave, an extra round trip for no gain at this scale. Flat wins when memberships become a thing you query across clubs, for example an admin screen listing every membership one user holds; nothing in this product needs that yet. Joining twice returns 409 Conflict, a 4xx because the caller made the mistake, with code "already_member"; leaving a club you never joined returns 404, because the membership resource being deleted does not exist. Both feel idempotent to the user, but the honest codes tell the client exactly what happened.\n\nErrors. Every endpoint shares { error: { code, message } }, where code is stable and machine-readable and message is free to change. A non-owner adding a pick gets 403 Forbidden with { "error": { "code": "not_club_owner", "message": "only the club owner can add picks" } }: the caller is authenticated, so 401 is wrong, and the request is well-formed, so 400 is wrong; 403 says "known caller, not allowed."',
    },
    {
      id: 'action-resource-review',
      kind: 'written',
      completionMode: 'submitted-with-reference-review',
      title: 'Decide when an action deserves a resource',
      prompt:
        'A teammate wants to add POST /invoices/:id/send, arguing that "send" is an action and actions get action endpoints. In your own words: why does resource modeling resist verbs in URLs, what noun is hiding inside "send an invoice," how would you model it as a sub-resource and what does that buy, and when would you accept a verb-named endpoint anyway? Use concrete endpoints and status codes in your answer.',
      estimatedMinutes: 12,
      referenceAnswer:
        'Resource modeling resists verbs in URLs because the HTTP method is already the verb, and everything between the client and the handler branches on parts it can see. When URLs name things and methods carry the action, a cache knows GET /invoices/42 is safe to store, a permission layer knows every path under /invoices/42 is about invoice 42, and a new client can guess the whole API from one example. A URL like /invoices/42/send tells the infrastructure nothing, so each verb endpoint is one more route where caching, permissions, and conventions have to be wired by hand, which is exactly how the missed ownership check happens.\n\nThe noun hiding inside "send an invoice" is the sending itself: a delivery, or a send record. Model it as POST /invoices/42/deliveries, returning 201 Created with the new delivery, for example { "delivery": { "id": 7, "invoiceId": 42, "sentAt": "..." } }. That buys three things. The action reuses plain resource semantics, creation via POST and 201, instead of inventing a convention. GET /invoices/42/deliveries falls out for free as an audit trail of every send. And retry behavior becomes explicit: POST is not idempotent, so the client knows a blind retry risks a duplicate email, the same care every creation endpoint needs.\n\nI would accept a verb-named endpoint when no honest noun exists and forcing one produces something nobody would guess. A search endpoint like POST /invoices/search is a common example: "search" yields no stored thing, and pretending it does, say by creating a "search resource," is more confusing than the verb. The discipline is a strong default. When the noun is real, use it; when the noun has to be invented to satisfy the rule, the rule has stopped paying for itself.',
      rubric: [
        {
          id: 'why-nouns',
          label: 'Why URLs stay nouns',
          description:
            'Explains that the method already carries the verb and that caching, shared permission checks, and client guessability depend on requests whose meaning is visible to infrastructure.',
        },
        {
          id: 'sub-resource-modeling',
          label: 'Finds the hidden noun',
          description:
            'Names a concrete noun for the send action (a delivery, reminder, or send record), models it as POST on a sub-resource returning 201, and notes at least one thing this buys, such as a free audit-trail list or standard creation semantics.',
        },
        {
          id: 'retry-awareness',
          label: 'Idempotency of the action',
          description:
            'Connects the action to retry behavior: POST is not idempotent, so retrying the send risks a duplicate, unlike GET, PUT, or DELETE.',
        },
        {
          id: 'knows-the-limit',
          label: 'Knows when the rule stops paying',
          description:
            'Gives a case where a verb endpoint is the honest choice because no real noun exists, rather than claiming the discipline always applies.',
        },
      ],
    },
  ],
  approaches: {
    'parse-list-query': [
      {
        name: 'Validate each parameter, collect errors as values',
        code: `type ListQuery = {
  limit: number
  cursor: string | null
  sort: 'createdAt' | 'total' | 'status'
}

type ParseResult =
  | { ok: true; query: ListQuery }
  | { ok: false; errors: string[] }

const allowedSorts = ['createdAt', 'total', 'status'] as const

export function parseListQuery(params: Record<string, string>): ParseResult {
  const errors: string[] = []

  // Start every field at its default, then let a valid parameter override it.
  let limit = 20
  let cursor: string | null = null
  let sort: ListQuery['sort'] = 'createdAt'

  if ('limit' in params) {
    // Number() rejects letters, and Number.isInteger rejects fractions,
    // so "abc", "2.5", and "" all fail here instead of reaching the database.
    const parsed = Number(params.limit)
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) {
      errors.push('limit must be a whole number between 1 and 100')
    } else {
      limit = parsed
    }
  }

  if ('cursor' in params) {
    // The cursor is opaque, so the only check is that one was actually sent.
    if (params.cursor === '') {
      errors.push('cursor must not be empty')
    } else {
      cursor = params.cursor
    }
  }

  if ('sort' in params) {
    // Checking against an allowlist keeps unexposed fields out of the sort.
    const candidate = allowedSorts.find((field) => field === params.sort)
    if (candidate === undefined) {
      errors.push('sort must be one of createdAt, total, status')
    } else {
      sort = candidate
    }
  }

  // Checking fields in limit, cursor, sort order above is what makes
  // the error list deterministic, so report all of them in one response.
  if (errors.length > 0) {
    return { ok: false, errors }
  }

  return { ok: true, query: { limit, cursor, sort } }
}`,
        explanation:
          'Each parameter follows the same shape: start from the default, and let a valid value override it or a bad one push an exact error string. Errors are ordinary values in an array, never thrown, so the caller gets every problem in one response instead of one per round trip. The limit check is where naive versions fail: parseInt("2.5") quietly returns 2, so the reference uses Number plus Number.isInteger to reject fractions, and the range check catches Number("") turning into 0. The sort allowlist does double duty, validating the value and narrowing its type to the union, so no cast is needed.',
        complexity:
          'O(1) time and space; the interesting guarantee is that the error list is deterministic, always ordered limit, cursor, sort.',
      },
    ],
    'fix-lying-status-codes': [
      {
        name: 'One status per outcome, one error shape',
        code: `type Invoice = { id: number; total: number; status: string }

type HandlerResponse = { status: number; body: unknown }

export function getInvoiceResponse(
  invoices: Invoice[],
  rawId: string,
): HandlerResponse {
  const id = Number(rawId)

  // A malformed id is the caller's mistake, so it belongs in the 4xx
  // family. Number.isInteger also rejects "2.5", which NaN checks miss.
  if (!Number.isInteger(id) || id < 1) {
    return {
      status: 400,
      body: {
        error: {
          code: 'invalid_id',
          message: 'invoice id must be a positive whole number',
        },
      },
    }
  }

  const invoice = invoices.find((candidate) => candidate.id === id)

  // A well-formed question with no answer is 404, never a 200 with null,
  // so caches and monitoring see the miss for what it is.
  if (!invoice) {
    return {
      status: 404,
      body: {
        error: { code: 'not_found', message: \`invoice \${id} not found\` },
      },
    }
  }

  return { status: 200, body: { invoice } }
}`,
        explanation:
          'The broken handler lied in three ways, one per response family. Reporting a malformed id as 500 blames the server for a typo the caller made, so retry logic retries a request that can never succeed and the on-call dashboard fills with noise; 400 tells the caller to fix the request. Reporting a missing invoice as 200 with a null body teaches caches to store the failure as a success and forces every client to learn a private convention; 404 is the honest answer to a well-formed question about a thing that does not exist. And the mixed error shapes, a bare message on one path and nothing on another, force one parser per path; both failure responses now share { error: { code, message } }. The validation itself also tightened, because Number.isNaN lets "2.5" and "0" through, and neither is a usable id.',
        complexity:
          'O(n) time over the invoice list, O(1) space. The guarantee that matters is behavioral: each outcome maps to exactly one status family, and both failures share one error shape.',
      },
    ],
  },
}
