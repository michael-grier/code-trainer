import Concept from './concept.mdx'

import type { Lesson } from '../../types'

const sessionStore = {
  s_ada: { userId: 'ada', role: 'member', expiresAt: 2000 },
  s_grace: { userId: 'grace', role: 'admin', expiresAt: 1500 },
}

const adaInvoice = { id: 1, ownerId: 'ada', status: 'sent' }
const ada = { id: 'ada', role: 'member' }
const linus = { id: 'linus', role: 'member' }
const grace = { id: 'grace', role: 'accountant' }
const root = { id: 'root', role: 'admin' }

const deleteSessions = {
  s_ada: { userId: 'ada', role: 'member' },
  s_root: { userId: 'root', role: 'admin' },
}
const unauthenticated = {
  status: 401,
  body: { error: { code: 'unauthenticated', message: 'sign in to continue' } },
}
const hiddenInvoice2 = {
  status: 404,
  body: { error: { code: 'not_found', message: 'invoice 2 not found' } },
}

// Each test gets its own copy so a submission that mutates its input cannot
// leak changes into the next test's fixture.
const invoiceFixture = () => [
  { id: 1, ownerId: 'ada' },
  { id: 2, ownerId: 'grace' },
]

export const lesson: Lesson = {
  slug: 'authentication-and-authorization',
  title: 'Authentication and Authorization',
  summary:
    'Separate identity from permission checks and enforce authorization server-side.',
  track: 'backend-data',
  order: 48,
  concept: Concept,
  problems: [
    {
      id: 'authenticate-session-cookie',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Turn a Cookie header into a user',
      prompt:
        'Implement `authenticate`, the authentication stage. It receives the session store, a record from session id to `{ userId, role, expiresAt }`, the request headers as a record with lowercase names, and the current time as a number. Read the `cookie` header, which is a string of `name=value` pairs separated by "; ", and find the pair named `session`. If there is no cookie header, no session pair, or its value is empty, return `{ ok: false, status: 401, code: "missing_session" }`. If the store has no entry for the id, return `{ ok: false, status: 401, code: "unknown_session" }`. If the entry\'s `expiresAt` is less than or equal to now, return `{ ok: false, status: 401, code: "expired_session" }`. Otherwise return `{ ok: true, user: { id, role } }` built from the entry. Example: `authenticate({ s_ada: { userId: "ada", role: "member", expiresAt: 2000 } }, { cookie: "theme=dark; session=s_ada" }, 1000)` returns `{ ok: true, user: { id: "ada", role: "member" } }`.',
      estimatedMinutes: 15,
      functionName: 'authenticate',
      starter: `type Role = 'member' | 'accountant' | 'admin'

type Session = { userId: string; role: Role; expiresAt: number }

type AuthResult =
  | { ok: true; user: { id: string; role: Role } }
  | {
      ok: false
      status: 401
      code: 'missing_session' | 'unknown_session' | 'expired_session'
    }

export function authenticate(
  sessions: Record<string, Session>,
  headers: Record<string, string>,
  now: number,
): AuthResult {
  return { ok: false, status: 401, code: 'missing_session' }
}

console.log(
  authenticate(
    { s_ada: { userId: 'ada', role: 'member', expiresAt: 2000 } },
    { cookie: 'theme=dark; session=s_ada' },
    1000,
  ),
)
`,
      tests: [
        {
          name: 'resolves a valid session cookie to its user',
          args: [sessionStore, { cookie: 'session=s_ada' }, 1000],
          expected: { ok: true, user: { id: 'ada', role: 'member' } },
        },
        {
          name: 'finds the session cookie among other cookies',
          args: [
            sessionStore,
            { cookie: 'theme=dark; session=s_grace; lang=en' },
            1000,
          ],
          expected: { ok: true, user: { id: 'grace', role: 'admin' } },
        },
        {
          name: 'rejects a request with no Cookie header',
          args: [sessionStore, { accept: 'application/json' }, 1000],
          expected: { ok: false, status: 401, code: 'missing_session' },
        },
        {
          name: 'rejects a Cookie header without a session cookie',
          args: [sessionStore, { cookie: 'theme=dark' }, 1000],
          expected: { ok: false, status: 401, code: 'missing_session' },
        },
        {
          name: 'rejects an empty session value',
          args: [sessionStore, { cookie: 'session=' }, 1000],
          expected: { ok: false, status: 401, code: 'missing_session' },
        },
        {
          name: 'rejects a session id the store does not know',
          args: [sessionStore, { cookie: 'session=s_forged' }, 1000],
          expected: { ok: false, status: 401, code: 'unknown_session' },
        },
        {
          name: 'rejects a session that has expired',
          args: [sessionStore, { cookie: 'session=s_grace' }, 1500],
          expected: { ok: false, status: 401, code: 'expired_session' },
        },
        {
          name: 'accepts a session one tick before it expires',
          args: [sessionStore, { cookie: 'session=s_grace' }, 1499],
          expected: { ok: true, user: { id: 'grace', role: 'admin' } },
        },
      ],
    },
    {
      id: 'authorize-invoice-action',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Write the invoice authorization guard',
      prompt:
        'Implement `authorizeInvoice`, the guard every invoice route calls after loading the invoice. It receives the authenticated user `{ id, role }`, the action ("read", "update", "delete", or "void"), and the invoice `{ id, ownerId, status }`, and returns a decision. The rules: an admin may do anything. A member may read, update, and delete invoices they own and nothing else. An accountant may read and void any invoice but may not update or delete. A caller who may not read the invoice must not learn that it exists, so every action they attempt returns `{ allowed: false, status: 404 }`. A caller who may read it but may not perform the action returns `{ allowed: false, status: 403 }`. Allowed actions return `{ allowed: true }`. Example: `authorizeInvoice({ id: "ada", role: "member" }, "void", { id: 1, ownerId: "ada", status: "sent" })` returns `{ allowed: false, status: 403 }`, because Ada can read her invoice but voiding needs the accountant role.',
      estimatedMinutes: 15,
      functionName: 'authorizeInvoice',
      starter: `type Role = 'member' | 'accountant' | 'admin'

type User = { id: string; role: Role }

type Invoice = { id: number; ownerId: string; status: string }

type Action = 'read' | 'update' | 'delete' | 'void'

type Decision = { allowed: true } | { allowed: false; status: 403 | 404 }

export function authorizeInvoice(
  user: User,
  action: Action,
  invoice: Invoice,
): Decision {
  return { allowed: false, status: 403 }
}

console.log(
  authorizeInvoice({ id: 'ada', role: 'member' }, 'void', {
    id: 1,
    ownerId: 'ada',
    status: 'sent',
  }),
)
`,
      tests: [
        {
          name: 'lets the owner read their invoice',
          args: [ada, 'read', adaInvoice],
          expected: { allowed: true },
        },
        {
          name: 'lets the owner update their invoice',
          args: [ada, 'update', adaInvoice],
          expected: { allowed: true },
        },
        {
          name: 'lets the owner delete their invoice',
          args: [ada, 'delete', adaInvoice],
          expected: { allowed: true },
        },
        {
          name: "hides another member's invoice with 404 on read",
          args: [linus, 'read', adaInvoice],
          expected: { allowed: false, status: 404 },
        },
        {
          name: "hides another member's invoice with 404 even for delete",
          args: [linus, 'delete', adaInvoice],
          expected: { allowed: false, status: 404 },
        },
        {
          name: 'forbids the owner from voiding with 403, since they know it exists',
          args: [ada, 'void', adaInvoice],
          expected: { allowed: false, status: 403 },
        },
        {
          name: 'lets an accountant read any invoice',
          args: [grace, 'read', adaInvoice],
          expected: { allowed: true },
        },
        {
          name: 'lets an accountant void any invoice',
          args: [grace, 'void', adaInvoice],
          expected: { allowed: true },
        },
        {
          name: 'forbids an accountant from updating with 403',
          args: [grace, 'update', adaInvoice],
          expected: { allowed: false, status: 403 },
        },
        {
          name: 'forbids an accountant from deleting with 403',
          args: [grace, 'delete', adaInvoice],
          expected: { allowed: false, status: 403 },
        },
        {
          name: 'lets an admin do anything',
          args: [root, 'delete', adaInvoice],
          expected: { allowed: true },
        },
      ],
    },
    {
      id: 'fix-trusted-identity-claims',
      kind: 'debug',
      completionMode: 'all-tests-pass',
      title: 'Fix the delete handler that believes the request',
      prompt:
        'deleteInvoice is the pure handler behind `DELETE /invoices/:id`. It receives the session store, the invoice list, the request `{ headers, body }`, and the invoice id, and returns `{ status, body, invoices }`. The rules: identity comes only from the `session` cookie looked up in the store; a missing or unknown session is 401 with `{ error: { code: "unauthenticated", message: "sign in to continue" } }`. The owner or an admin may delete; anyone else, and any id that does not exist, gets 404 with `{ error: { code: "not_found", message: "invoice <id> not found" } }` so that other users\' invoices stay hidden. Success is 200 with `{ deleted: id }` and the list without that invoice. A penetration test found that sending `{ "role": "admin" }` in the body deletes anyone\'s invoice, and the 401 and 403 responses are swapped. Fix it. Example: `deleteInvoice({ s_ada: { userId: "ada", role: "member" } }, [{ id: 1, ownerId: "ada" }, { id: 2, ownerId: "grace" }], { headers: { cookie: "session=s_ada" }, body: { role: "admin" } }, 2)` should return `{ status: 404, body: { error: { code: "not_found", message: "invoice 2 not found" } }, invoices: [{ id: 1, ownerId: "ada" }, { id: 2, ownerId: "grace" }] }`.',
      estimatedMinutes: 15,
      functionName: 'deleteInvoice',
      brokenCode: `type Session = { userId: string; role: 'member' | 'admin' }

type Invoice = { id: number; ownerId: string }

type DeleteRequest = { headers: Record<string, string>; body: unknown }

type DeleteResponse = { status: number; body: unknown; invoices: Invoice[] }

function readSessionId(headers: Record<string, string>): string | undefined {
  const pair = (headers.cookie ?? '')
    .split(';')
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith('session='))
  const id = pair?.slice('session='.length)
  return id === '' ? undefined : id
}

function fail(status: number, code: string, message: string, invoices: Invoice[]) {
  return { status, body: { error: { code, message } }, invoices }
}

export function deleteInvoice(
  sessions: Record<string, Session>,
  invoices: Invoice[],
  request: DeleteRequest,
  id: number,
): DeleteResponse {
  // Some clients send who they are in the body, so prefer that when present.
  const claims = (request.body ?? {}) as { userId?: string; role?: string }
  const sessionId = readSessionId(request.headers)
  const session = sessionId === undefined ? undefined : sessions[sessionId]
  const userId = claims.userId ?? session?.userId
  const role = claims.role ?? session?.role

  const invoice = invoices.find((candidate) => candidate.id === id)
  if (!invoice) {
    return fail(404, 'not_found', \`invoice \${id} not found\`, invoices)
  }

  if (userId === undefined) {
    return fail(403, 'forbidden', 'you may not delete this invoice', invoices)
  }

  if (invoice.ownerId !== userId && role !== 'admin') {
    return fail(401, 'unauthenticated', 'sign in to continue', invoices)
  }

  return {
    status: 200,
    body: { deleted: id },
    invoices: invoices.filter((candidate) => candidate.id !== id),
  }
}

console.log(
  deleteInvoice(
    { s_ada: { userId: 'ada', role: 'member' } },
    [
      { id: 1, ownerId: 'ada' },
      { id: 2, ownerId: 'grace' },
    ],
    { headers: { cookie: 'session=s_ada' }, body: { role: 'admin' } },
    2,
  ),
)
`,
      bugHints: [
        'Who wrote request.body? Which of the values the handler reads are facts the server established, and which are claims?',
        'A missing session means the server does not know who is asking. Which status says "sign in", and which says "I know you, and no"?',
        'The rules say a caller who may not delete an invoice gets the same answer as a caller asking for an invoice that does not exist. Which status is that, and why?',
        'Authenticate first: resolve the session or stop with 401 before loading anything.',
      ],
      tests: [
        {
          name: 'lets the owner delete their invoice',
          args: [
            deleteSessions,
            invoiceFixture(),
            { headers: { cookie: 'session=s_ada' }, body: {} },
            1,
          ],
          expected: {
            status: 200,
            body: { deleted: 1 },
            invoices: [{ id: 2, ownerId: 'grace' }],
          },
        },
        {
          name: 'lets an admin delete any invoice',
          args: [
            deleteSessions,
            invoiceFixture(),
            { headers: { cookie: 'session=s_root' }, body: {} },
            2,
          ],
          expected: {
            status: 200,
            body: { deleted: 2 },
            invoices: [{ id: 1, ownerId: 'ada' }],
          },
        },
        {
          name: 'returns 401 when there is no session at all',
          args: [deleteSessions, invoiceFixture(), { headers: {}, body: {} }, 1],
          expected: { ...unauthenticated, invoices: invoiceFixture() },
        },
        {
          name: 'returns 401 for a session id the store does not know',
          args: [
            deleteSessions,
            invoiceFixture(),
            { headers: { cookie: 'session=s_forged' }, body: {} },
            1,
          ],
          expected: { ...unauthenticated, invoices: invoiceFixture() },
        },
        {
          name: "hides another user's invoice with 404",
          args: [
            deleteSessions,
            invoiceFixture(),
            { headers: { cookie: 'session=s_ada' }, body: {} },
            2,
          ],
          expected: { ...hiddenInvoice2, invoices: invoiceFixture() },
        },
        {
          name: 'ignores a userId claimed in the body',
          args: [
            deleteSessions,
            invoiceFixture(),
            { headers: { cookie: 'session=s_ada' }, body: { userId: 'grace' } },
            2,
          ],
          expected: { ...hiddenInvoice2, invoices: invoiceFixture() },
        },
        {
          name: 'ignores a role claimed in the body',
          args: [
            deleteSessions,
            invoiceFixture(),
            { headers: { cookie: 'session=s_ada' }, body: { role: 'admin' } },
            2,
          ],
          expected: { ...hiddenInvoice2, invoices: invoiceFixture() },
        },
        {
          name: 'does not let body claims stand in for a missing session',
          args: [
            deleteSessions,
            invoiceFixture(),
            { headers: {}, body: { userId: 'ada', role: 'admin' } },
            1,
          ],
          expected: { ...unauthenticated, invoices: invoiceFixture() },
        },
        {
          name: 'returns 404 for a missing invoice',
          args: [
            deleteSessions,
            invoiceFixture(),
            { headers: { cookie: 'session=s_ada' }, body: {} },
            9,
          ],
          expected: {
            status: 404,
            body: { error: { code: 'not_found', message: 'invoice 9 not found' } },
            invoices: invoiceFixture(),
          },
        },
      ],
    },
    {
      id: 'two-questions-review',
      kind: 'written',
      completionMode: 'submitted-with-reference-review',
      title: 'Explain the two questions',
      prompt:
        'A teammate argues that since every route already checks for a valid session, adding per-route ownership checks is redundant. In your own words: what is the difference between authentication and authorization, why does a session check not answer the second question, why must the authorization decision be made per resource rather than once at the front of the pipeline, where must the identity it uses come from, and when should a refusal be a 401, a 403, or a 404? Use the invoice example and concrete status codes.',
      estimatedMinutes: 12,
      referenceAnswer:
        'Authentication answers "who is this?" and authorization answers "may this person do this to this thing?" A valid session settles the first question completely and the second not at all. In the opener, Grace had a real password and a real session, so she was authenticated, and the server returned Ada\'s invoice because it never asked whether Grace was allowed to see invoice 1. The session check proves the caller is a known user; it says nothing about which resources that user owns or what their role permits.\n\nThe second question cannot be answered at the front of the pipeline because it depends on the resource. "May Grace read invoice 1?" needs invoice 1\'s ownerId, which the server does not have until it loads the invoice. That makes authorization object-level: load the resource, then run a guard that takes the authenticated user, the action, and the resource, and only then run the handler. A single check at the door can enforce "must be signed in" and maybe "must be an admin," but it cannot enforce "must own this invoice," and ownership is where the opener\'s leak lived.\n\nThe identity the guard uses must come from the authentication stage, meaning the session store\'s answer for the cookie, never from the request. A body field like userId or a header like x-user-id is a claim the client wrote, and the client can write anything. The debug problem\'s handler let a body saying role: "admin" override the session and deleted anyone\'s invoice; the fix is to stop reading identity from the request at all.\n\nThe three refusals mean different things. 401 means the server does not know who is asking: no cookie, an unknown session id, an expired session. The fix is to sign in, so it is wrong to answer 403 here. 403 means the caller is known and the action is not permitted, and it is right when the caller already knows the resource exists, such as Ada trying to void her own invoice without the accountant role. 404 is the answer when the caller could not even read the resource, such as a member asking for another member\'s invoice, because a 403 would confirm the invoice exists and let an attacker map every id. The rule is: hide existence from callers who could not read; refuse honestly otherwise.',
      rubric: [
        {
          id: 'two-questions',
          label: 'Separates the two questions',
          description:
            'Defines authentication as establishing identity and authorization as deciding permission, and explains that a valid session answers only the first, using the Grace-reads-Ada example or an equivalent.',
        },
        {
          id: 'per-resource',
          label: 'Authorization is per resource',
          description:
            'Explains that the decision depends on the loaded resource (its owner or state), so it must run after loading and before the handler, not once at the front of the pipeline.',
        },
        {
          id: 'identity-source',
          label: 'Identity comes from the session',
          description:
            'States that the user passed to the guard must come from the session store, and that body fields or headers naming a user or role are untrusted claims.',
        },
        {
          id: 'status-codes',
          label: 'Distinguishes 401, 403, and 404',
          description:
            '401 for unknown identity, 403 for a known caller refused an action on a resource they can see, 404 to hide resources the caller could not read, with the reason for hiding.',
        },
      ],
    },
  ],
  approaches: {
    'authenticate-session-cookie': [
      {
        name: 'Parse the cookie, look up the session, check the clock',
        code: `type Role = 'member' | 'accountant' | 'admin'

type Session = { userId: string; role: Role; expiresAt: number }

type AuthResult =
  | { ok: true; user: { id: string; role: Role } }
  | {
      ok: false
      status: 401
      code: 'missing_session' | 'unknown_session' | 'expired_session'
    }

export function authenticate(
  sessions: Record<string, Session>,
  headers: Record<string, string>,
  now: number,
): AuthResult {
  // The Cookie header is one string of "name=value" pairs. Split, trim,
  // and find the pair we own; every other cookie is irrelevant here.
  const pair = (headers.cookie ?? '')
    .split(';')
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith('session='))
  const sessionId = pair?.slice('session='.length) ?? ''

  if (sessionId === '') {
    return { ok: false, status: 401, code: 'missing_session' }
  }

  // A forged, deleted, or mistyped id is simply absent from the store.
  const session = sessions[sessionId]
  if (session === undefined) {
    return { ok: false, status: 401, code: 'unknown_session' }
  }

  // Expiry is compared against the injected clock so the check is testable.
  if (session.expiresAt <= now) {
    return { ok: false, status: 401, code: 'expired_session' }
  }

  // Only this function builds a user, so holding one is proof of authentication.
  return { ok: true, user: { id: session.userId, role: session.role } }
}`,
        explanation:
          'The function is three checks in the order the failures happen: no usable cookie, no matching session, session too old. All three return 401 because the caller\'s next step is the same for each, sign in, and the code field records which one happened for logs and clients. The cookie parsing is the part most submissions get wrong: the header is one string, other cookies may precede or follow the session pair, and an explicitly empty value is the same as a missing one. Taking now as a parameter instead of calling Date.now() is what makes the expiry boundary testable to the exact tick. On success the function returns a freshly built user rather than the raw session, so handlers receive exactly the fields they need and nothing else.',
        complexity:
          'O(c) time for c cookies in the header and O(1) for the store lookup. The guarantee that matters is that a User value can only come from this function.',
      },
    ],
    'authorize-invoice-action': [
      {
        name: 'Decide readability first, then the action',
        code: `type Role = 'member' | 'accountant' | 'admin'

type User = { id: string; role: Role }

type Invoice = { id: number; ownerId: string; status: string }

type Action = 'read' | 'update' | 'delete' | 'void'

type Decision = { allowed: true } | { allowed: false; status: 403 | 404 }

export function authorizeInvoice(
  user: User,
  action: Action,
  invoice: Invoice,
): Decision {
  if (user.role === 'admin') {
    return { allowed: true }
  }

  const isOwner = invoice.ownerId === user.id
  const canRead = isOwner || user.role === 'accountant'

  // A caller who may not read the invoice must not learn it exists, so every
  // action they attempt gets the same answer as a made-up id: 404.
  if (!canRead) {
    return { allowed: false, status: 404 }
  }

  if (action === 'read') {
    return { allowed: true }
  }

  // From here the caller can see the invoice, so a refusal is an honest 403.
  if (action === 'void') {
    return user.role === 'accountant'
      ? { allowed: true }
      : { allowed: false, status: 403 }
  }

  // update and delete belong to the owner alone.
  return isOwner ? { allowed: true } : { allowed: false, status: 403 }
}`,
        explanation:
          'The guard settles the visibility question before the action question, because the two refusal codes depend on it. Admins short-circuit at the top. For everyone else, canRead is computed once: owners and accountants can see the invoice, other members cannot, and for those members every action returns 404 so that probing ids reveals nothing. Once the caller can read, the remaining refusals are 403, which is honest because the caller already knows the invoice exists. Voiding is a role permission, so it checks the role; updating and deleting are ownership permissions, so they check isOwner, which is why an accountant who can read and void still gets 403 on update. Keeping the whole decision in one pure function means every route makes the same call and a missed check cannot hide in a handler.',
        complexity:
          'O(1) time and space. The guarantee that matters is that the 404 versus 403 distinction is decided by readability, so no refusal leaks the existence of an invoice the caller could not read.',
      },
    ],
    'fix-trusted-identity-claims': [
      {
        name: 'Identity from the session only, then the honest codes',
        code: `type Session = { userId: string; role: 'member' | 'admin' }

type Invoice = { id: number; ownerId: string }

type DeleteRequest = { headers: Record<string, string>; body: unknown }

type DeleteResponse = { status: number; body: unknown; invoices: Invoice[] }

function readSessionId(headers: Record<string, string>): string | undefined {
  const pair = (headers.cookie ?? '')
    .split(';')
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith('session='))
  const id = pair?.slice('session='.length)
  return id === '' ? undefined : id
}

function fail(status: number, code: string, message: string, invoices: Invoice[]) {
  return { status, body: { error: { code, message } }, invoices }
}

export function deleteInvoice(
  sessions: Record<string, Session>,
  invoices: Invoice[],
  request: DeleteRequest,
  id: number,
): DeleteResponse {
  // Authenticate first, from the cookie alone. The body is never consulted
  // for identity: anything in it is a claim the client wrote.
  const sessionId = readSessionId(request.headers)
  const session = sessionId === undefined ? undefined : sessions[sessionId]
  if (!session) {
    return fail(401, 'unauthenticated', 'sign in to continue', invoices)
  }

  // Authorize per resource. A caller who may not delete this invoice gets the
  // same 404 as a missing id, so other users' invoices stay invisible.
  const invoice = invoices.find((candidate) => candidate.id === id)
  const mayDelete =
    invoice !== undefined &&
    (invoice.ownerId === session.userId || session.role === 'admin')
  if (!mayDelete) {
    return fail(404, 'not_found', \`invoice \${id} not found\`, invoices)
  }

  return {
    status: 200,
    body: { deleted: id },
    invoices: invoices.filter((candidate) => candidate.id !== id),
  }
}`,
        explanation:
          'The broken handler had three faults that share one root: it did not keep the two questions apart. It merged identity from the body with identity from the session and let the body win, so a request carrying role: "admin" became an admin without a session at all. It answered a missing identity with 403, which tells an anonymous caller they are known and refused, and answered a refused caller with 401, which tells a signed-in user to sign in. And it looked the invoice up before establishing who was asking, which is the wrong order for the pipeline. The fix authenticates first from the cookie alone and stops with 401, then authorizes against the loaded invoice and stops with 404 for both a missing id and a caller who may not delete, so the two cases are indistinguishable from outside. The body is not read anywhere.',
        complexity:
          'O(n) time over the invoice list, O(n) space for the filtered result. The guarantee that matters is that no field of the request can change who the server believes is asking.',
      },
    ],
  },
}
