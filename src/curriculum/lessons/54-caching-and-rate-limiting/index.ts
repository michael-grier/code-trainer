import Concept from './concept.mdx'

import type { Lesson } from '../../types'

const invoiceOrigin = {
  ada: [{ id: 1, total: 1800 }],
  grace: [{ id: 2, total: 250 }],
}
const adaEntry = { value: [{ id: 1, total: 1800 }], expiresAt: 6000 }
const adaInvoices = [{ id: 1, total: 1800 }]

const smallBucket = { capacity: 5, refillPerSecond: 1 }

export const lesson: Lesson = {
  slug: 'caching-and-rate-limiting',
  title: 'Caching and Rate Limiting',
  summary:
    'Improve reliability and performance with cache and limit strategies.',
  track: 'backend-data',
  order: 54,
  concept: Concept,
  problems: [
    {
      id: 'fix-cache-key-and-ttl',
      kind: 'debug',
      completionMode: 'all-tests-pass',
      title: 'Fix the cache that serves one user to another',
      prompt:
        'readInvoicesCached is the pure form of the opener\'s cached read. It receives the cache as a record from key to `{ value, expiresAt }`, the origin as a record from user id to that user\'s invoices, the authenticated user id, the current time, and the TTL in milliseconds. It must return `{ value, source, cache }`. The key for a user\'s invoices is `invoices:<userId>`. If the cache holds that key and its expiresAt is strictly greater than now, return the cached value with source "cache" and the cache unchanged. Otherwise read the user\'s invoices from the origin, return them with source "origin", and return a new cache that adds or replaces the entry with `expiresAt` equal to now plus TTL, leaving other keys untouched and never mutating the input. In production Grace saw Ada\'s invoices, and entries were served long after they expired. Fix both. Example: `readInvoicesCached({ "invoices:ada": { value: [{ id: 1, total: 1800 }], expiresAt: 6000 } }, { ada: [{ id: 1, total: 1800 }], grace: [{ id: 2, total: 250 }] }, "grace", 3000, 5000)` returns `{ value: [{ id: 2, total: 250 }], source: "origin", cache: { "invoices:ada": { value: [{ id: 1, total: 1800 }], expiresAt: 6000 }, "invoices:grace": { value: [{ id: 2, total: 250 }], expiresAt: 8000 } } }`.',
      estimatedMinutes: 12,
      functionName: 'readInvoicesCached',
      brokenCode: `type Entry = { value: unknown; expiresAt: number }

type Cache = Record<string, Entry>

type CachedRead = { value: unknown; source: 'cache' | 'origin'; cache: Cache }

export function readInvoicesCached(
  cache: Cache,
  origin: Record<string, unknown>,
  userId: string,
  now: number,
  ttl: number,
): CachedRead {
  const hit = cache['invoices']
  if (hit) {
    return { value: hit.value, source: 'cache', cache }
  }

  const value = origin[userId]

  return {
    value,
    source: 'origin',
    cache: { ...cache, invoices: { value, expiresAt: now + ttl } },
  }
}

console.log(
  readInvoicesCached(
    { 'invoices:ada': { value: [{ id: 1, total: 1800 }], expiresAt: 6000 } },
    { ada: [{ id: 1, total: 1800 }], grace: [{ id: 2, total: 250 }] },
    'grace',
    3000,
    5000,
  ),
)
`,
      bugHints: [
        'What does the answer depend on that the key does not mention?',
        'An entry carries expiresAt. Where is it compared against now, and what should an expired entry count as?',
        'Expiry at exactly now: is the entry still fresh? The prompt says strictly greater.',
      ],
      tests: [
        {
          name: 'misses on an empty cache and stores the value under a per-user key',
          args: [{}, invoiceOrigin, 'ada', 1000, 5000],
          expected: {
            value: adaInvoices,
            source: 'origin',
            cache: { 'invoices:ada': adaEntry },
          },
        },
        {
          name: 'hits for the same user before the entry expires',
          args: [{ 'invoices:ada': adaEntry }, invoiceOrigin, 'ada', 3000, 5000],
          expected: {
            value: adaInvoices,
            source: 'cache',
            cache: { 'invoices:ada': adaEntry },
          },
        },
        {
          name: "never serves one user's cached invoices to another",
          args: [{ 'invoices:ada': adaEntry }, invoiceOrigin, 'grace', 3000, 5000],
          expected: {
            value: [{ id: 2, total: 250 }],
            source: 'origin',
            cache: {
              'invoices:ada': adaEntry,
              'invoices:grace': { value: [{ id: 2, total: 250 }], expiresAt: 8000 },
            },
          },
        },
        {
          name: 'treats an expired entry as a miss and refreshes it',
          args: [{ 'invoices:ada': adaEntry }, invoiceOrigin, 'ada', 7000, 5000],
          expected: {
            value: adaInvoices,
            source: 'origin',
            cache: { 'invoices:ada': { value: adaInvoices, expiresAt: 12000 } },
          },
        },
        {
          name: 'treats an entry expiring exactly now as expired',
          args: [{ 'invoices:ada': adaEntry }, invoiceOrigin, 'ada', 6000, 5000],
          expected: {
            value: adaInvoices,
            source: 'origin',
            cache: { 'invoices:ada': { value: adaInvoices, expiresAt: 11000 } },
          },
        },
        {
          name: 'leaves unrelated keys already in the cache untouched',
          args: [
            { 'clubs:list': { value: [], expiresAt: 9999 } },
            invoiceOrigin,
            'ada',
            1000,
            5000,
          ],
          expected: {
            value: adaInvoices,
            source: 'origin',
            cache: {
              'clubs:list': { value: [], expiresAt: 9999 },
              'invoices:ada': adaEntry,
            },
          },
        },
      ],
    },
    {
      id: 'apply-token-bucket',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Implement a token bucket',
      prompt:
        'Implement `applyTokenBucket`. It receives the bucket configuration `{ capacity, refillPerSecond }` and the requests of one caller as `{ id, at, cost }`, in non-decreasing order of `at` (whole seconds), and decides each one. The bucket starts full at the time of the first request. Before deciding a request, refill: add `(at - previousAt) * refillPerSecond` tokens, capped at capacity, where previousAt is the previous request\'s time (the first request refills nothing). If `cost` is less than or equal to the tokens available, the request is allowed and the cost is spent. Otherwise it is refused, no tokens are spent, and `retryAfterSeconds` is the shortfall divided by the refill rate, rounded up. Return one `{ id, allowed, tokensAfter, retryAfterSeconds }` per request in order, with retryAfterSeconds 0 for allowed requests. Example: `applyTokenBucket({ capacity: 5, refillPerSecond: 1 }, [{ id: "a", at: 0, cost: 5 }, { id: "b", at: 0, cost: 3 }])` returns `[{ id: "a", allowed: true, tokensAfter: 0, retryAfterSeconds: 0 }, { id: "b", allowed: false, tokensAfter: 0, retryAfterSeconds: 3 }]`.',
      estimatedMinutes: 20,
      functionName: 'applyTokenBucket',
      starter: `type Bucket = { capacity: number; refillPerSecond: number }

type LimitedRequest = { id: string; at: number; cost: number }

type Decision = {
  id: string
  allowed: boolean
  tokensAfter: number
  retryAfterSeconds: number
}

export function applyTokenBucket(
  bucket: Bucket,
  requests: LimitedRequest[],
): Decision[] {
  return []
}

console.log(
  applyTokenBucket({ capacity: 5, refillPerSecond: 1 }, [
    { id: 'a', at: 0, cost: 5 },
    { id: 'b', at: 0, cost: 3 },
  ]),
)
`,
      tests: [
        {
          name: 'allows a burst up to capacity then refuses',
          args: [
            smallBucket,
            [
              { id: 'r1', at: 0, cost: 1 },
              { id: 'r2', at: 0, cost: 1 },
              { id: 'r3', at: 0, cost: 1 },
              { id: 'r4', at: 0, cost: 1 },
              { id: 'r5', at: 0, cost: 1 },
              { id: 'r6', at: 0, cost: 1 },
            ],
          ],
          expected: [
            { id: 'r1', allowed: true, tokensAfter: 4, retryAfterSeconds: 0 },
            { id: 'r2', allowed: true, tokensAfter: 3, retryAfterSeconds: 0 },
            { id: 'r3', allowed: true, tokensAfter: 2, retryAfterSeconds: 0 },
            { id: 'r4', allowed: true, tokensAfter: 1, retryAfterSeconds: 0 },
            { id: 'r5', allowed: true, tokensAfter: 0, retryAfterSeconds: 0 },
            { id: 'r6', allowed: false, tokensAfter: 0, retryAfterSeconds: 1 },
          ],
        },
        {
          name: 'refills one token per second and allows again',
          args: [
            smallBucket,
            [
              { id: 'a', at: 0, cost: 5 },
              { id: 'b', at: 0, cost: 1 },
              { id: 'c', at: 2, cost: 1 },
            ],
          ],
          expected: [
            { id: 'a', allowed: true, tokensAfter: 0, retryAfterSeconds: 0 },
            { id: 'b', allowed: false, tokensAfter: 0, retryAfterSeconds: 1 },
            { id: 'c', allowed: true, tokensAfter: 1, retryAfterSeconds: 0 },
          ],
        },
        {
          name: 'never refills above capacity',
          args: [
            smallBucket,
            [
              { id: 'a', at: 0, cost: 2 },
              { id: 'b', at: 100, cost: 1 },
            ],
          ],
          expected: [
            { id: 'a', allowed: true, tokensAfter: 3, retryAfterSeconds: 0 },
            { id: 'b', allowed: true, tokensAfter: 4, retryAfterSeconds: 0 },
          ],
        },
        {
          name: 'tells a refused caller how long to wait for its cost',
          args: [
            smallBucket,
            [
              { id: 'a', at: 0, cost: 5 },
              { id: 'b', at: 0, cost: 3 },
            ],
          ],
          expected: [
            { id: 'a', allowed: true, tokensAfter: 0, retryAfterSeconds: 0 },
            { id: 'b', allowed: false, tokensAfter: 0, retryAfterSeconds: 3 },
          ],
        },
        {
          name: 'does not spend tokens on a refused request',
          args: [
            smallBucket,
            [
              { id: 'a', at: 0, cost: 4 },
              { id: 'b', at: 0, cost: 2 },
              { id: 'c', at: 0, cost: 1 },
            ],
          ],
          expected: [
            { id: 'a', allowed: true, tokensAfter: 1, retryAfterSeconds: 0 },
            { id: 'b', allowed: false, tokensAfter: 1, retryAfterSeconds: 1 },
            { id: 'c', allowed: true, tokensAfter: 0, retryAfterSeconds: 0 },
          ],
        },
        {
          name: 'smooths a steady stream at the refill rate',
          args: [
            { capacity: 2, refillPerSecond: 1 },
            [
              { id: 'a', at: 0, cost: 1 },
              { id: 'b', at: 0, cost: 1 },
              { id: 'c', at: 0, cost: 1 },
              { id: 'd', at: 1, cost: 1 },
              { id: 'e', at: 1, cost: 1 },
              { id: 'f', at: 3, cost: 1 },
            ],
          ],
          expected: [
            { id: 'a', allowed: true, tokensAfter: 1, retryAfterSeconds: 0 },
            { id: 'b', allowed: true, tokensAfter: 0, retryAfterSeconds: 0 },
            { id: 'c', allowed: false, tokensAfter: 0, retryAfterSeconds: 1 },
            { id: 'd', allowed: true, tokensAfter: 0, retryAfterSeconds: 0 },
            { id: 'e', allowed: false, tokensAfter: 0, retryAfterSeconds: 1 },
            { id: 'f', allowed: true, tokensAfter: 1, retryAfterSeconds: 0 },
          ],
        },
        {
          name: 'returns no decisions for no requests',
          args: [smallBucket, []],
          expected: [],
        },
      ],
    },
    {
      id: 'book-club-cache-and-limits',
      kind: 'design',
      completionMode: 'submitted-with-rubric-review',
      title: 'Plan caching and rate limits for the book club API',
      prompt:
        'Decide what the book club API caches, under which keys and for how long, how it limits callers, and where that state lives.',
      estimatedMinutes: 25,
      scenario:
        'The book club API from lessons 47 through 51 runs on six instances behind a load balancer. Its hottest endpoints are the public club list (GET /clubs, paginated, tens of thousands of clubs, changes a few times a minute), the club detail page (GET /clubs/:id, includes the member count), the signed-in home screen (GET /me/clubs, the caller\'s memberships), the join and leave buttons (POST and DELETE on /clubs/:id/members), and login (POST /login). Joins and leaves happen constantly. Last month a bug in the mobile app retried the club list in a tight loop from a few thousand devices, and last week a credential-stuffing attack hit login with millions of guesses from a rotating set of addresses.',
      sections: [
        {
          id: 'cache-plan',
          type: 'entity-list',
          label: 'What to cache',
          prompt:
            'For each read endpoint, say whether to cache it, the exact cache key, the TTL, and how the entry is invalidated or allowed to go stale, with the reason "how wrong can this be" for each.',
        },
        {
          id: 'stampede',
          type: 'short-answer',
          label: 'Expiry on the club list',
          prompt:
            'The club list is the most requested page and its entries expire together. Describe what happens at expiry under load and the mechanism you would use to keep the database from seeing more than one query per page.',
        },
        {
          id: 'limit-state',
          type: 'tradeoff',
          label: 'Where limiter state lives',
          prompt:
            'Choose where rate-limit counters live and justify it with the six-instance deployment and the two incidents in the scenario.',
          options: [
            'A shared store such as Redis, updated atomically, adding a network call to every request',
            'An in-memory token bucket per instance, with each instance given one sixth of the limit',
          ],
        },
        {
          id: 'limits',
          type: 'short-answer',
          label: 'The limits themselves',
          prompt:
            'Give the rate limits you would set: the key, the algorithm, the capacity and refill rate for the club list and for login, and the exact response a limited caller receives.',
        },
      ],
      rubric: [
        {
          id: 'keys-carry-inputs',
          label: 'Cache keys include every input',
          description:
            'The club list key includes the page cursor and limit, the club detail key includes the club id, and the home screen is either keyed by user id or deliberately not cached; no key omits an input the response depends on.',
        },
        {
          id: 'ttl-by-tolerance',
          label: 'TTL and invalidation chosen by tolerance for staleness',
          description:
            'Each cached endpoint has a TTL justified by how wrong it may be, and writes that change member counts or memberships either invalidate the affected keys or the answer explains why brief staleness is acceptable there.',
        },
        {
          id: 'stampede-handled',
          label: 'Stampede recognized and prevented',
          description:
            'Describes simultaneous misses at expiry causing one origin query per request, and names single-flight (one in-flight load per key), jittered TTLs, or stale-while-revalidate as the mitigation.',
        },
        {
          id: 'shared-state-tradeoff',
          label: 'Limiter state tradeoff argued from the deployment',
          description:
            'Either option can earn credit, but the answer must explain that per-instance state multiplies the effective limit by the instance count and depends on even load balancing, and weigh that against the network call and dependency a shared store adds, especially for the login limit.',
        },
        {
          id: 'concrete-limits',
          label: 'Limits are concrete and keyed correctly',
          description:
            'Names a token bucket (or equivalent) with capacity and refill for the club list keyed by user or address, a strict per-address and per-account limit on login, and a 429 response carrying Retry-After.',
        },
      ],
      referenceAnswer:
        'What to cache. GET /clubs: cache each page under clubs:list:cursor=<cursor>:limit=<limit>, TTL 30 seconds. The list changes a few times a minute and a new club appearing half a minute late is fine; nothing depends on it being exact. GET /clubs/:id: cache under clubs:<id>, TTL 10 seconds, and invalidate on join and leave for that club so the member count is never more than one write behind for long; a count that is a few seconds stale is acceptable, a count that is minutes stale on a club whose members are joining live is not. GET /me/clubs: key clubs:me:<userId> from the session, never from a header, TTL 5 seconds, invalidated when that user joins or leaves; or leave it uncached, since it is an indexed lookup by user id and staleness after the user\'s own click is the kind users notice immediately. Login and the join and leave writes are never cached.\n\nExpiry on the club list. Every page entry filled at the same moment expires at the same moment, and at that instant every request in flight for that page misses and runs the paginated query, so a popular first page can send hundreds of identical queries to the database in the same second. I would keep one in-flight promise per key so the first miss runs the query and the rest await its result, giving one query per page per expiry, add a few seconds of random jitter to each TTL so pages do not expire together, and for the first page serve the stale entry while refreshing it in the background.\n\nWhere limiter state lives. A shared store. Six instances each holding their own bucket means a caller limited to 100 requests per minute actually gets 600, and last month\'s retry loop would have been limited at six times the intended rate, or not at all if the load balancer sent a device\'s retries to different instances. Splitting the limit six ways assumes perfectly even balancing and still lets one instance refuse a caller another would accept. For login the per-instance option is a security hole: the credential-stuffing attack spreads across instances by construction. The shared store costs one round trip per request and a dependency the API cannot run without, which is why the limiter should fail open for the club list if the store is down and fail closed for login.\n\nThe limits. Club list: token bucket keyed by user id when signed in, otherwise by client address, capacity 60 and refill 1 per second, so a real user paging quickly is never limited and a tight retry loop is capped at one request per second per device after its first burst. Login: two buckets, one per client address with capacity 20 and refill 1 per minute, and one per account name with capacity 10 and refill 1 per minute, so a rotating set of addresses still cannot guess more than ten passwords per account per minute, plus a global cap on login attempts to protect the database. A limited caller receives 429 Too Many Requests with a Retry-After header in seconds computed from the bucket\'s shortfall, and the same error body shape as every other endpoint.',
    },
    {
      id: 'cache-and-limit-review',
      kind: 'written',
      completionMode: 'submitted-with-reference-review',
      title: 'Explain the leak and the boundary',
      prompt:
        'A teammate proposes fixing the opener by moving the cache lookup after the authorization check and adding a per-minute request counter in the same module. In your own words: why did the cache serve Ada\'s invoices to Grace, why is moving the lookup not the fix, what a cache key must contain and how staleness is bounded, why a per-minute counter is not a rate limit, and what is wrong with keeping the counter in the module. Use the numbers from the lesson\'s transcripts.',
      estimatedMinutes: 12,
      referenceAnswer:
        'The cache served Ada\'s invoices to Grace because its key was the string invoices, with nothing about who was asking. Authentication and the ownership check both ran for Grace, but the cache sat in front of the load with a key that treated every user\'s request as the same question, so the first answer filled the entry and Grace\'s request hit it. Moving the lookup after the authorization check changes nothing: Grace is authorized to see her own invoices, so the check passes, and the lookup then returns whatever the key holds, which is still Ada\'s list. The check gates who may ask; the key decides which answer they get.\n\nA cache key must contain every input the answer depends on: the user, any filter or page parameter, the locale or version if the response varies by them. Anything omitted becomes a channel from one caller to another. Staleness is bounded by the TTL, chosen by how wrong the data may be, and by invalidation, where the write that changes the data deletes the keys that depended on it. Five seconds was fine for an invoice list; it would be wrong for a payment result, which should not be cached at all.\n\nA per-minute counter allows double the limit at the window boundary. The lesson\'s run allowed 200 requests inside one second against a limit of 100 per minute, because 150 requests at second 59 and 150 at second 60 landed in two different windows, and each window allowed its full 100 before rejecting the rest. A token bucket has no boundary: capacity sets the largest burst and refill sets the sustained rate, and once the burst is spent nothing gets through faster than the refill, with the shortfall giving an honest Retry-After for the 429.\n\nKeeping the counter in the module means keeping it in one process. Lesson 45 showed that module scope is process scope, and the API runs on several instances, so each instance enforces its own copy of the limit and a caller gets the limit multiplied by the instance count. Limiter state has to live in a store every instance shares and update atomically, which costs a network call per request and is the price of a limit that actually holds.',
      rubric: [
        {
          id: 'leak-mechanism',
          label: 'Explains the leak through the key',
          description:
            'Attributes the leak to a cache key lacking the user, and explains why reordering the lookup after authorization does not fix it since the key still selects the wrong answer.',
        },
        {
          id: 'key-and-staleness',
          label: 'Key contents and staleness bounds',
          description:
            'States that the key must include every input the response depends on, and that staleness is bounded by a TTL chosen for tolerance plus invalidation on writes, with an example of data that must not be cached.',
        },
        {
          id: 'window-boundary',
          label: 'Fixed window versus token bucket',
          description:
            'Explains the double-limit burst at a window boundary using the 200-in-one-second result and describes the token bucket\'s capacity and refill as the fix, with Retry-After from the shortfall.',
        },
        {
          id: 'shared-state',
          label: 'Limiter state must be shared',
          description:
            'Connects module scope to per-process state, explains that per-instance counters multiply the limit by the instance count, and names a shared atomic store as the requirement.',
        },
      ],
    },
  ],
  approaches: {
    'fix-cache-key-and-ttl': [
      {
        name: 'Put the user in the key and the clock in the check',
        code: `type Entry = { value: unknown; expiresAt: number }

type Cache = Record<string, Entry>

type CachedRead = { value: unknown; source: 'cache' | 'origin'; cache: Cache }

export function readInvoicesCached(
  cache: Cache,
  origin: Record<string, unknown>,
  userId: string,
  now: number,
  ttl: number,
): CachedRead {
  // The answer depends on the user, so the user is part of the question.
  const key = \`invoices:\${userId}\`

  // A hit is only a hit while it is still alive; an entry expiring exactly
  // now is already stale.
  const hit = cache[key]
  if (hit !== undefined && hit.expiresAt > now) {
    return { value: hit.value, source: 'cache', cache }
  }

  const value = origin[userId]

  // Return a new cache with this entry added or replaced. Other keys are
  // carried over untouched, and the caller's object is never mutated.
  return {
    value,
    source: 'origin',
    cache: { ...cache, [key]: { value, expiresAt: now + ttl } },
  }
}`,
        explanation:
          'The broken read had one key for every user and never looked at expiresAt, which produced the two production symptoms directly: the first user to fill the entry defined everyone\'s answer, and that answer lived until the process restarted. The fix puts the user id into the key, so Grace\'s lookup cannot find Ada\'s entry, and compares expiresAt against the injected clock with a strict greater-than, so an entry at its expiry instant counts as gone and is refreshed. Taking now as a parameter instead of calling Date.now() is what makes the boundary testable to the millisecond. Returning a new cache object rather than assigning into the old one keeps the function pure, which is why the same cache fixture can be handed to several tests.',
        complexity:
          'O(1) time for the lookup and O(k) space to copy a cache of k entries on a miss. The guarantee that matters is that a cached value is only ever returned to the user it was computed for, and only while it is fresh.',
      },
    ],
    'apply-token-bucket': [
      {
        name: 'Refill for elapsed time, then spend or refuse',
        code: `type Bucket = { capacity: number; refillPerSecond: number }

type LimitedRequest = { id: string; at: number; cost: number }

type Decision = {
  id: string
  allowed: boolean
  tokensAfter: number
  retryAfterSeconds: number
}

export function applyTokenBucket(
  bucket: Bucket,
  requests: LimitedRequest[],
): Decision[] {
  // The bucket starts full at the moment of the first request.
  let tokens = bucket.capacity
  let lastAt = requests.length > 0 ? requests[0].at : 0
  const decisions: Decision[] = []

  for (const request of requests) {
    // Refill continuously: tokens accrue for the seconds since the last
    // request, but the bucket never holds more than its capacity.
    const elapsed = request.at - lastAt
    tokens = Math.min(bucket.capacity, tokens + elapsed * bucket.refillPerSecond)
    lastAt = request.at

    if (request.cost <= tokens) {
      tokens -= request.cost
      decisions.push({
        id: request.id,
        allowed: true,
        tokensAfter: tokens,
        retryAfterSeconds: 0,
      })
      continue
    }

    // A refused request spends nothing. The wait is however long the refill
    // takes to cover the shortfall, rounded up to whole seconds.
    const shortfall = request.cost - tokens
    decisions.push({
      id: request.id,
      allowed: false,
      tokensAfter: tokens,
      retryAfterSeconds: Math.ceil(shortfall / bucket.refillPerSecond),
    })
  }

  return decisions
}`,
        explanation:
          'The bucket never runs a timer. Each request first computes how many tokens arrived since the previous request, elapsed seconds times the refill rate, and adds them with a cap at capacity, which is why a caller who waits a hundred seconds finds a full bucket and not a hundred tokens. Then it either spends the cost or refuses. Refusing spends nothing, so a large refused request does not starve a smaller one that arrives in the same second, and the shortfall divided by the refill rate gives the caller a truthful Retry-After. Because the state is just two numbers, tokens and the time they were last computed, the same logic fits in a shared store\'s atomic script, which is how it is enforced across instances.',
        complexity:
          'O(n) time for n requests, O(1) state beyond the output. The guarantee that matters is that over any span longer than the initial burst, the allowed cost never exceeds the refill rate times the span plus the capacity.',
      },
    ],
  },
}
