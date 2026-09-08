import Concept from './concept.mdx'

import type { Lesson } from '../../types'

const launchInputs = {
  dailyActiveUsers: 100000,
  requestsPerUserPerDay: 40,
  peakMultiplier: 5,
  averageResponseBytes: 5000,
  writesPerUserPerDay: 3,
  averageRowBytes: 500,
  retentionDays: 365,
}

export const lesson: Lesson = {
  slug: 'system-design-capstone',
  title: 'System Design Capstone',
  summary:
    'Synthesize product requirements, APIs, data models, reliability, and tradeoffs.',
  track: 'production',
  order: 60,
  concept: Concept,
  problems: [
    {
      id: 'estimate-capacity',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Turn users into requests, bytes, and rows',
      prompt:
        'Implement `estimateCapacity`, the back-of-envelope arithmetic from the lesson as a function. It receives `{ dailyActiveUsers, requestsPerUserPerDay, peakMultiplier, averageResponseBytes, writesPerUserPerDay, averageRowBytes, retentionDays }` and returns `{ averageRps, peakRps, egressGbPerDay, storageGbAtRetention }`. Requests per day are users times requests per user; averageRps divides that by 86,400 seconds; peakRps multiplies averageRps by the peak multiplier; egressGbPerDay is requests per day times bytes per response divided by one billion; storageGbAtRetention is users times writes per user times bytes per row times retention days, divided by one billion. Keep intermediate values unrounded and round only the four outputs, each to two decimal places. Example: `estimateCapacity({ dailyActiveUsers: 100000, requestsPerUserPerDay: 40, peakMultiplier: 5, averageResponseBytes: 5000, writesPerUserPerDay: 3, averageRowBytes: 500, retentionDays: 365 })` returns `{ averageRps: 46.3, peakRps: 231.48, egressGbPerDay: 20, storageGbAtRetention: 54.75 }`.',
      estimatedMinutes: 12,
      functionName: 'estimateCapacity',
      starter: `type CapacityInputs = {
  dailyActiveUsers: number
  requestsPerUserPerDay: number
  peakMultiplier: number
  averageResponseBytes: number
  writesPerUserPerDay: number
  averageRowBytes: number
  retentionDays: number
}

type CapacityEstimate = {
  averageRps: number
  peakRps: number
  egressGbPerDay: number
  storageGbAtRetention: number
}

export function estimateCapacity(inputs: CapacityInputs): CapacityEstimate {
  return { averageRps: 0, peakRps: 0, egressGbPerDay: 0, storageGbAtRetention: 0 }
}

console.log(
  estimateCapacity({
    dailyActiveUsers: 100000,
    requestsPerUserPerDay: 40,
    peakMultiplier: 5,
    averageResponseBytes: 5000,
    writesPerUserPerDay: 3,
    averageRowBytes: 500,
    retentionDays: 365,
  }),
)
`,
      tests: [
        {
          name: 'estimates the book club launch scenario',
          args: [launchInputs],
          expected: {
            averageRps: 46.3,
            peakRps: 231.48,
            egressGbPerDay: 20,
            storageGbAtRetention: 54.75,
          },
        },
        {
          name: 'scales linearly with users',
          args: [{ ...launchInputs, dailyActiveUsers: 1000000 }],
          expected: {
            averageRps: 462.96,
            peakRps: 2314.81,
            egressGbPerDay: 200,
            storageGbAtRetention: 547.5,
          },
        },
        {
          name: 'a peak multiplier of one makes peak equal average',
          args: [{ ...launchInputs, peakMultiplier: 1 }],
          expected: {
            averageRps: 46.3,
            peakRps: 46.3,
            egressGbPerDay: 20,
            storageGbAtRetention: 54.75,
          },
        },
        {
          name: 'zero users need nothing',
          args: [{ ...launchInputs, dailyActiveUsers: 0 }],
          expected: {
            averageRps: 0,
            peakRps: 0,
            egressGbPerDay: 0,
            storageGbAtRetention: 0,
          },
        },
        {
          name: 'a one megabyte response dominates egress',
          args: [{ ...launchInputs, averageResponseBytes: 1000000 }],
          expected: {
            averageRps: 46.3,
            peakRps: 231.48,
            egressGbPerDay: 4000,
            storageGbAtRetention: 54.75,
          },
        },
        {
          name: 'retention scales storage',
          args: [{ ...launchInputs, retentionDays: 30 }],
          expected: {
            averageRps: 46.3,
            peakRps: 231.48,
            egressGbPerDay: 20,
            storageGbAtRetention: 4.5,
          },
        },
        {
          name: 'rounds to two decimals',
          args: [{ ...launchInputs, dailyActiveUsers: 12345 }],
          expected: {
            averageRps: 5.72,
            peakRps: 28.58,
            egressGbPerDay: 2.47,
            storageGbAtRetention: 6.76,
          },
        },
      ],
    },
    {
      id: 'book-club-at-scale-design',
      kind: 'design',
      completionMode: 'submitted-with-rubric-review',
      title: 'Design the book club at a million daily users',
      prompt:
        'Design the book club platform for the scale in the scenario, working from numbers and requirements to the API, data, consistency, and caching decisions, and finish with the components that result.',
      estimatedMinutes: 40,
      scenario:
        'The book club app is being rebuilt for a million daily active users. Users browse and search clubs, join and leave them, follow a club\'s reading list, and receive notifications when their clubs add picks or reach reading deadlines. Each user makes about forty requests a day, mostly reads of club pages and reading lists; writes are joins, leaves, picks, and notification preferences, about three per user per day. Traffic peaks at five times the average in the evenings. Some clubs have hundreds of thousands of members. Club pages may show a member count that is a few seconds stale, but a user who joins must see themselves as a member immediately, and nobody may be charged twice for a paid club. Picks and memberships must be kept for as long as the club exists. The team is six engineers who have run a single PostgreSQL database before and nothing more exotic.',
      sections: [
        {
          id: 'requirements-and-numbers',
          type: 'short-answer',
          label: 'Requirements and numbers',
          prompt:
            'Separate the functional from the non-functional requirements, state the assumptions you are making, and give the back-of-envelope estimate: average and peak requests per second, egress per day, and storage growth, using the lesson\'s formulas.',
        },
        {
          id: 'api',
          type: 'endpoint-list',
          label: 'API',
          prompt:
            'List the endpoints as method plus path with success status codes, marking which are paginated, which require idempotency keys, and which authorization each needs.',
        },
        {
          id: 'data-and-consistency',
          type: 'entity-list',
          label: 'Data and consistency',
          prompt:
            'List the tables with keys, the indexes each hot query needs, the delete behavior of each foreign key, and how the join and paid-club flows avoid the lost update and the double charge.',
        },
        {
          id: 'member-count',
          type: 'tradeoff',
          label: 'Member counts on huge clubs',
          prompt:
            'A club page shows a member count, some clubs have hundreds of thousands of members, and the count may be a few seconds stale. Choose how to produce it at this scale and justify it with the read and write numbers.',
          options: [
            'Cache the club page per club with a short TTL and compute the count on cache miss',
            'Maintain a member_count column updated in the same transaction as each join and leave',
          ],
        },
        {
          id: 'components',
          type: 'short-answer',
          label: 'Components',
          prompt:
            'Name the components that result and what each holds, say which are stateless, and name at least two things you deliberately left out because the numbers do not require them.',
        },
      ],
      rubric: [
        {
          id: 'numbers-first',
          label: 'Requirements separated and numbers computed',
          description:
            'Lists functional and non-functional requirements separately with stated assumptions, and computes roughly 460 average and 2300 peak requests per second, about 200 GB egress per day, and about 550 GB of storage a year from the scenario\'s inputs.',
        },
        {
          id: 'api-discipline',
          label: 'API follows the resource rules',
          description:
            'Endpoints are nouns with methods, lists are paginated, creation returns 201, the paid join carries an idempotency key, and each endpoint names its authorization (member, owner, or anyone).',
        },
        {
          id: 'data-and-races',
          label: 'Data model with indexes and race handling',
          description:
            'Tables have primary and foreign keys with deliberate delete behavior, hot queries have composite indexes, joining uses the membership primary key or a conditional insert rather than read-then-write, and the paid join is made idempotent.',
        },
        {
          id: 'count-tradeoff',
          label: 'Member count argued from the numbers',
          description:
            'Either option can earn credit, but the answer must weigh a per-club cache with stampede protection against a counter updated per join, using the read-heavy ratio and the allowed staleness, and name the failure mode of the chosen option.',
        },
        {
          id: 'components-justified',
          label: 'Components sized to the estimate',
          description:
            'Names a load balancer, stateless application instances, a primary database with a replica, and a shared cache and limiter store, and explicitly leaves out sharding, a message queue, or multi-region with a numeric reason.',
        },
      ],
      referenceAnswer:
        'Requirements and numbers. Functional: browse and search clubs, view a club and its reading list, join and leave, add and remove picks as owner, set notification preferences, receive notifications. Non-functional: a million daily users at forty requests each, five-times evening peak, reads roughly ten to one over writes, club pages may be seconds stale but a join must be visible to the joiner immediately, no double charge on paid clubs, picks and memberships retained for the club\'s life, and a team comfortable with one PostgreSQL. Assumptions: 5 KB average response, 500 bytes per written row, a year of retention as the planning horizon. Numbers: 40 million requests a day, 463 average and about 2,300 peak requests per second, 200 GB egress a day, and 1,000,000 × 3 × 500 B × 365 ≈ 550 GB of storage a year. Two thousand three hundred requests per second at peak, mostly cacheable reads, is within reach of a handful of instances and one primary with a replica.\n\nAPI. GET /clubs (200, paginated by cursor, anyone), GET /clubs/search?q= (200, paginated, anyone), GET /clubs/:id (200, anyone; 404 for missing), GET /clubs/:id/picks (200, paginated, anyone), POST /clubs/:id/picks (201, owner), DELETE /clubs/:id/picks/:pickId (200, owner), GET /clubs/:id/members (200, paginated, member), POST /clubs/:id/members (201, signed-in; 409 if already a member; idempotency key required when the club is paid, since the join charges), DELETE /clubs/:id/members/:userId (200, that user or owner; 404 hides other users\' memberships), GET /me/clubs (200, paginated, signed-in), PUT /me/notification-preferences (200, signed-in). All errors share { error: { code, message } }.\n\nData and consistency. users (id PK, email UNIQUE), clubs (id PK, name, owner_id FK users ON DELETE SET NULL, paid boolean), memberships (user_id FK users ON DELETE CASCADE, club_id FK clubs ON DELETE CASCADE, joined_at, PK (user_id, club_id)), picks (id PK, club_id FK clubs ON DELETE CASCADE, suggested_by FK users ON DELETE SET NULL, title, position, UNIQUE (club_id, position)), payments (id PK, user_id, club_id, idempotency_key UNIQUE, amount_cents, status). Indexes: memberships (club_id, joined_at DESC) for the members tab, picks (club_id, position) for reading lists, clubs (name text_pattern_ops) for prefix search, payments (idempotency_key) via the unique constraint. Joining is INSERT ... ON CONFLICT DO NOTHING on the membership primary key, so two concurrent joins cannot both succeed and no read-then-write exists; the joiner sees themselves as a member immediately because their own next read goes to the primary or bypasses the cache for their own membership. The paid join stores the payment under the client\'s idempotency key before charging, so a retried request finds the key and returns the stored result instead of charging again, lesson 46\'s mechanism with lesson 52\'s unique constraint enforcing it.\n\nMember counts. Cache the club page per club with a ten-second TTL, computing the count on miss with COUNT over the membership index, protected by single-flight so a popular club\'s expiry sends one query, not thousands. Reads outnumber writes ten to one and staleness of seconds is allowed, so the cache absorbs almost all page loads, and the count never drifts because nothing maintains a copy. A member_count column would put a row update on every join and leave, contending on the club row of a huge club exactly when it is popular, and would drift on any path that forgot it; it wins only if the count must be exact or reads of one club are so hot that even one COUNT per ten seconds is too many, which the numbers do not suggest.\n\nComponents. A load balancer; six to ten stateless application instances that hold nothing per request in module scope; one PostgreSQL primary with a streaming replica for read scaling and failover; one shared cache and rate-limiter store such as Redis; a small worker pool consuming a notifications table for sends, so the request path never waits on a provider. Left out on purpose: database sharding, because 550 GB a year and 2,300 peak requests per second fit one primary for years; a message broker, because a notifications table polled by workers gives the needed decoupling at this volume with tools the team already runs; and multi-region, because the availability requirement is met by replica failover and the team has never operated cross-region replication.',
    },
    {
      id: 'reliability-and-rollout-plan',
      kind: 'design',
      completionMode: 'submitted-with-rubric-review',
      title: 'Plan reliability, observability, and rollout',
      prompt:
        'For the system you designed, plan what happens when each component fails, how the team knows the system is healthy, and how changes reach production safely.',
      estimatedMinutes: 30,
      scenario:
        'The book club platform from the previous problem is about to launch with the components you chose: a load balancer, stateless application instances, a primary database with a replica, a shared cache and limiter store, and notification workers calling an email and an SMS provider. The team wants an explicit answer for every failure they can name before launch, a dashboard that tells them within a minute whether users are affected, and a way to ship the weekly release without a maintenance window. Last month\'s incident on the old system was a slow notification provider that stalled request handling for twenty minutes, and nobody noticed until users tweeted.',
      sections: [
        {
          id: 'failures',
          type: 'entity-list',
          label: 'Failure modes',
          prompt:
            'For each component, describe what happens to users when it fails, what the system does automatically, and what a person must do, including the slow-provider incident.',
        },
        {
          id: 'observability',
          type: 'short-answer',
          label: 'Knowing within a minute',
          prompt:
            'Describe the signals on the launch dashboard and the alerts wired to them, stating why each signal is expressed the way it is (for example percentiles rather than averages, or status families rather than raw counts).',
        },
        {
          id: 'rollout',
          type: 'tradeoff',
          label: 'Shipping the weekly release',
          prompt:
            'Choose how a release reaches the fleet and justify it with the rolling-deploy compatibility window and the rollback the team needs.',
          options: [
            'Canary one instance behind the load balancer, watch the dashboard, then roll the rest with the previous version kept deployable',
            'Deploy all instances at once during the lowest-traffic hour with a prepared rollback script',
          ],
        },
        {
          id: 'provider-isolation',
          type: 'short-answer',
          label: 'The slow provider',
          prompt:
            'Explain precisely why a slow notification provider stalled request handling on the old system and which parts of the new design make that impossible, naming timeouts, retry policy, idempotency, and where the send happens.',
        },
      ],
      rubric: [
        {
          id: 'failure-per-component',
          label: 'Every component has a failure answer',
          description:
            'Covers instance loss (balancer routes around, no state lost), primary loss (replica promotion with a stated unavailability window), cache loss (fall through, limiter fails open for reads and closed for login), and provider slowness, with what is automatic and what needs a person.',
        },
        {
          id: 'signals-reasoned',
          label: 'Dashboard signals with reasons',
          description:
            'Uses per-endpoint latency percentiles rather than averages, error rates by status family, saturation of database and cache, and notification queue depth, with an alert threshold and a reason for each choice.',
        },
        {
          id: 'rollout-tradeoff',
          label: 'Rollout argued from the compatibility window',
          description:
            'Either option can earn credit, but the answer must address that two code versions run together during a rolling deploy, that schema changes follow expand-migrate-contract, and how rollback works, and name the risk the alternative carries.',
        },
        {
          id: 'provider-isolated',
          label: 'Provider isolation explained',
          description:
            'Diagnoses the stall as request handlers waiting on the provider without a timeout, and shows the new design sends from workers off the request path with timeouts, transient-only retries, and idempotency keys so retries cannot double-send.',
        },
      ],
      referenceAnswer:
        'Failure modes. An application instance dies: the load balancer\'s health check drops it within seconds, in-flight requests on it fail and clients retry idempotent reads, nothing is lost because instances hold no per-request state, and a person replaces it at leisure. The database primary dies: the replica is promoted automatically, writes fail for the ten to thirty seconds that takes, reads continue from the replica, and a person confirms replication is re-established and provisions a new replica. The cache store dies: every read falls through to the database, which the estimate sized to survive peak without the cache, though with higher latency; the rate limiter fails open for reads so users are not locked out and fails closed for login so an outage cannot become a credential-stuffing window; a person restores the store and watches the stampede on refill, which single-flight bounds. A notification provider is slow or down: workers time out each send, retry transient failures with backoff, and leave permanent failures in the table for a person to inspect; users see delayed notifications and nothing else, because no request handler is waiting on a provider.\n\nObservability. Per-endpoint request rate and latency as p50, p95, and p99, because the opener\'s four-second p99 hid behind a half-second average and the users who tweet are the ones at p99. Error rate by status family per endpoint, since a 5xx spike is the system failing and a 4xx spike is clients or an attack, and they page different people. Database saturation: connection pool usage, replication lag, and the slowest queries. Cache hit ratio and store latency. Notification queue depth and oldest unsent age, which is the signal that would have caught last month\'s incident in a minute instead of twenty. Alerts: p99 above one second on any user-facing endpoint for five minutes, 5xx rate above one percent for two minutes, replication lag above thirty seconds, queue oldest age above five minutes. Each alert names a runbook.\n\nRollout. Canary one instance, watch the dashboard for ten minutes comparing its error rate and p99 against the fleet, then roll the rest one at a time with the previous version kept deployable. During the roll two versions run against one schema, so every migration follows expand-migrate-contract from lesson 53: additive schema first, code that handles both shapes, contract in a later release. Rollback is redeploying the previous version, which still works because the schema was not contracted. Deploying everything at once in a quiet hour avoids the mixed-version window but turns every bad release into a full outage discovered by everyone at once, and the rollback script is a promise tested least when it matters most; the canary tests the release on real traffic with one instance\'s worth of blast radius.\n\nThe slow provider. On the old system the request handler that created a pick also called the email provider inline, with no timeout. When the provider slowed, every such handler held its connection and its instance\'s capacity for as long as the provider took, the pool filled, and unrelated requests queued behind them, which is lesson 45\'s blocked thread at the fleet scale. In the new design the handler inserts a notification row and returns; workers send it later with a five-second timeout per call, retry only timeouts and 5xx or 429 with backoff, never a rejected address, and key each send by notification id and channel so a retry after a timeout cannot deliver twice. A slow provider now shows up as queue age on the dashboard, alerts in a minute, and affects nothing but notification latency.',
    },
    {
      id: 'three-decisions-review',
      kind: 'written',
      completionMode: 'submitted-with-reference-review',
      title: 'Defend the three decisions that matter',
      prompt:
        'In your own words, name the three decisions in your book club design that matter most to whether it works at a million daily users, and for each say what it costs, what it buys, which number or requirement it traces to, and the number at which you would change your mind. Then name one thing you left out and the number at which you would add it.',
      estimatedMinutes: 15,
      referenceAnswer:
        'First, paginating every list and caching club pages. It costs a cursor in every list client, a ten-second staleness window on club pages, and an invalidation obligation on the few writes that change a page. It buys the difference in the opener, roughly ninety-five times the throughput and a p99 measured in milliseconds instead of seconds, and it is what lets 2,300 peak requests per second, ninety percent of them reads, land on one primary. It traces to the read-heavy ratio and the requirement that club pages may be seconds stale. I would change the caching decision if the product required exact member counts on every load; then the counter column with its transactional update and drift repair becomes worth its cost.\n\nSecond, making the join a conditional insert on the membership primary key and the paid join idempotent by key. It costs an idempotency store and a client that generates keys per operation, and it costs saying 409 to a second join instead of silently succeeding. It buys the two hard requirements: no lost update when two joins race, and no double charge when a client retries a timed-out payment. It traces directly to "nobody may be charged twice" and to lesson 52\'s lost update. I would not change this at any scale, because the failure it prevents is a correctness failure rather than a performance one; what would change is where the idempotency store lives if it outgrew the primary.\n\nThird, one PostgreSQL primary with a replica rather than a sharded or distributed store. It costs a ceiling: a single primary handles the writes, and a failover takes tens of seconds of write unavailability. It buys simplicity a six-person team can operate, transactions and constraints that enforce the data model, and every lesson of this track applying unchanged. It traces to the estimate, 550 GB a year and about 175 writes per second at peak, both far inside one primary\'s range. I would change my mind at roughly ten times the write rate sustained, or when the working set stopped fitting in the primary\'s memory, and the first move then would be to split the notifications and payments tables into their own database before considering sharding clubs.\n\nLeft out: a message broker for notifications. A table polled by workers gives the decoupling at this volume with a tool the team already runs. I would add a broker when the notifications table\'s insert rate or its polling load became visible on the database dashboard, roughly when notifications exceeded a few thousand per second, or when a second consumer of the same events appeared and the table became a queue with two readers.',
      rubric: [
        {
          id: 'three-decisions-traced',
          label: 'Three decisions traced to numbers or requirements',
          description:
            'Names three concrete decisions (such as pagination and caching, idempotent and race-free joins, and a single primary with replica) and ties each to a specific estimate or stated requirement.',
        },
        {
          id: 'costs-and-benefits',
          label: 'Each decision has a cost and a benefit',
          description:
            'States what each decision costs (staleness, an extra store, a write ceiling, indirection) as well as what it buys, rather than listing benefits alone.',
        },
        {
          id: 'change-thresholds',
          label: 'Names the number that would change the decision',
          description:
            'Gives a threshold or condition for each decision at which the alternative becomes right, and distinguishes correctness decisions that do not change with scale from performance decisions that do.',
        },
        {
          id: 'omission-justified',
          label: 'A deliberate omission with its trigger',
          description:
            'Names one component left out (sharding, a broker, multi-region) with the numeric or organizational condition that would justify adding it.',
        },
      ],
    },
  ],
  approaches: {
    'estimate-capacity': [
      {
        name: 'Requests per day first, then everything derives from it',
        code: `type CapacityInputs = {
  dailyActiveUsers: number
  requestsPerUserPerDay: number
  peakMultiplier: number
  averageResponseBytes: number
  writesPerUserPerDay: number
  averageRowBytes: number
  retentionDays: number
}

type CapacityEstimate = {
  averageRps: number
  peakRps: number
  egressGbPerDay: number
  storageGbAtRetention: number
}

const SECONDS_PER_DAY = 86_400
const BYTES_PER_GB = 1_000_000_000

// Round only at the end, so intermediate values keep their precision and the
// outputs read like a whiteboard estimate.
const round2 = (value: number) => Math.round(value * 100) / 100

export function estimateCapacity(inputs: CapacityInputs): CapacityEstimate {
  // Everything about traffic derives from requests per day.
  const requestsPerDay = inputs.dailyActiveUsers * inputs.requestsPerUserPerDay
  const averageRps = requestsPerDay / SECONDS_PER_DAY

  // Everything about storage derives from rows written per day, held for the
  // retention window.
  const rowsPerDay = inputs.dailyActiveUsers * inputs.writesPerUserPerDay

  return {
    averageRps: round2(averageRps),
    peakRps: round2(averageRps * inputs.peakMultiplier),
    egressGbPerDay: round2((requestsPerDay * inputs.averageResponseBytes) / BYTES_PER_GB),
    storageGbAtRetention: round2(
      (rowsPerDay * inputs.averageRowBytes * inputs.retentionDays) / BYTES_PER_GB,
    ),
  }
}`,
        explanation:
          'The estimator encodes the lesson\'s whiteboard arithmetic so the same inputs always give the same numbers and a changed assumption is one edit rather than a redo. Two intermediate values carry everything: requests per day, from which average and peak rates and egress follow, and rows per day, from which storage over the retention window follows. The constants are named so a reader can check the units, and rounding happens once at the end so the two-decimal outputs are faithful to the full-precision arithmetic rather than compounding rounding errors. The launch scenario produces 46 requests per second average and 231 at peak, 20 GB of egress a day, and 55 GB of storage a year, which is the evidence behind the lesson\'s claim that the book club at this scale needs one database and a few instances.',
        complexity:
          'O(1) time and space. The guarantee that matters is repeatability: an estimate that can be re-run when an assumption changes is one that can be argued with.',
      },
    ],
  },
}
