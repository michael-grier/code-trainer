import Concept from './concept.mdx'

import type { Lesson } from '../../types'

const requestBuilderOriginal = `type OrdersRequest = { url: string; headers: Record<string, string> }

export function buildOrdersRequest(
  customerId: number,
  cursor: string | null,
): OrdersRequest {
  const baseUrl = process.env.ORDERS_URL ?? 'http://localhost:3000'
  const url = new URL('/orders', baseUrl)
  url.searchParams.set('customerId', String(customerId))
  if (cursor !== null) {
    url.searchParams.set('cursor', cursor)
  }

  return {
    url: url.toString(),
    headers: {
      accept: 'application/json',
      'x-api-key': process.env.ORDERS_API_KEY ?? '',
    },
  }
}

console.log(buildOrdersRequest(7, null))
`

const acceptJson = 'application/json'

export const lesson: Lesson = {
  slug: 'integration-and-contract-testing',
  title: 'Integration and Contract Testing',
  summary:
    'Test module and service boundaries with contracts that catch real regressions.',
  track: 'production',
  order: 56,
  concept: Concept,
  problems: [
    {
      id: 'inject-request-target',
      kind: 'refactor',
      completionMode: 'tests-and-static-checks-pass',
      title: 'Let tests choose where the request goes',
      prompt:
        'buildOrdersRequest assembles the request the billing module sends to the orders service. Right now it reads the base URL and the API key from process.env inside the function, so a test cannot point it at a local service or check the credential it attaches. Refactor it to take `baseUrl` and `apiKey` as its first two parameters, followed by `customerId` and `cursor`, and to use nothing but its parameters. The request shape is unchanged: the URL is `/orders` resolved against the base URL with `customerId` and, when present, `cursor` as query parameters, and the headers are `accept: application/json` and `x-api-key` set to the key. Example: `buildOrdersRequest("https://orders.internal", "key-123", 7, null)` returns `{ url: "https://orders.internal/orders?customerId=7", headers: { accept: "application/json", "x-api-key": "key-123" } }`.',
      estimatedMinutes: 15,
      functionName: 'buildOrdersRequest',
      originalCode: requestBuilderOriginal,
      starter: requestBuilderOriginal,
      goals: [
        'Accept baseUrl and apiKey as the first two parameters instead of reading them from the environment.',
        'Keep the URL and header shape identical, so the request the service receives does not change.',
        'Leave nothing inside the function that depends on where or when it runs.',
      ],
      staticChecks: [
        {
          kind: 'forbid-text',
          text: 'process.env',
          message:
            'The builder must not read the environment. Its inputs arrive as parameters.',
        },
        {
          kind: 'require-text',
          text: 'baseUrl',
          message: 'Accept the base URL through a parameter named baseUrl.',
        },
        {
          kind: 'require-text',
          text: 'apiKey',
          message: 'Accept the credential through a parameter named apiKey.',
        },
      ],
      tests: [
        {
          name: 'builds the first page request from the injected base URL and key',
          args: ['https://orders.internal', 'key-123', 7, null],
          expected: {
            url: 'https://orders.internal/orders?customerId=7',
            headers: { accept: acceptJson, 'x-api-key': 'key-123' },
          },
        },
        {
          name: 'adds the cursor for a later page',
          args: ['https://orders.internal', 'key-123', 7, 'aW52XzQy'],
          expected: {
            url: 'https://orders.internal/orders?customerId=7&cursor=aW52XzQy',
            headers: { accept: acceptJson, 'x-api-key': 'key-123' },
          },
        },
        {
          name: 'points at a local fake when told to',
          args: ['http://127.0.0.1:3000', 'test', 7, null],
          expected: {
            url: 'http://127.0.0.1:3000/orders?customerId=7',
            headers: { accept: acceptJson, 'x-api-key': 'test' },
          },
        },
        {
          name: 'resolves the path against the base URL as before',
          args: ['https://api.example.com/v2/', 'k', 9, null],
          expected: {
            url: 'https://api.example.com/orders?customerId=9',
            headers: { accept: acceptJson, 'x-api-key': 'k' },
          },
        },
        {
          name: 'encodes a cursor with reserved characters',
          args: ['https://orders.internal', 'k', 1, 'a b&c'],
          expected: {
            url: 'https://orders.internal/orders?customerId=1&cursor=a+b%26c',
            headers: { accept: acceptJson, 'x-api-key': 'k' },
          },
        },
        {
          name: 'attaches whichever key the caller supplies',
          args: ['https://orders.internal', 'staging-key', 3, null],
          expected: {
            url: 'https://orders.internal/orders?customerId=3',
            headers: { accept: acceptJson, 'x-api-key': 'staging-key' },
          },
        },
      ],
    },
    {
      id: 'parse-orders-response',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Write the orders contract as a parser',
      prompt:
        'Implement `parseOrdersResponse`, the executable contract between the billing module and the orders service. It receives the decoded response body as `unknown` and returns `{ ok: true, orders, nextCursor }` or `{ ok: false, errors }`. The contract: the body must be an object (not an array or null), else the only error is "body must be an object"; it must have a `data` property that is an object, else the only error is "data must be an object". Inside `data`, `items` must be an array, else push "data.items must be an array"; each item must be an object with a whole-number `id`, else push "data.items[<index>].id must be a whole number" and skip the item, and a whole-number `totalCents`, else push "data.items[<index>].totalCents must be a whole number" and skip it; `nextCursor` must be a string or null, else push "data.nextCursor must be a string or null". Check items before the cursor. Fields the consumer does not read are ignored, and each returned order carries only `id` and `totalCents`. Return all collected errors together. Example: `parseOrdersResponse({ items: [{ id: 1, totalCents: 1800 }], nextCursor: null })` returns `{ ok: false, errors: ["data must be an object"] }`.',
      estimatedMinutes: 20,
      functionName: 'parseOrdersResponse',
      starter: `type Order = { id: number; totalCents: number }

type ParsedOrders =
  | { ok: true; orders: Order[]; nextCursor: string | null }
  | { ok: false; errors: string[] }

export function parseOrdersResponse(body: unknown): ParsedOrders {
  return { ok: false, errors: [] }
}

console.log(
  parseOrdersResponse({ items: [{ id: 1, totalCents: 1800 }], nextCursor: null }),
)
`,
      tests: [
        {
          name: 'parses the real envelope into orders',
          args: [
            {
              data: {
                items: [
                  { id: 1, totalCents: 1800 },
                  { id: 2, totalCents: 250 },
                ],
                nextCursor: null,
              },
            },
          ],
          expected: {
            ok: true,
            orders: [
              { id: 1, totalCents: 1800 },
              { id: 2, totalCents: 250 },
            ],
            nextCursor: null,
          },
        },
        {
          name: 'keeps a string cursor',
          args: [{ data: { items: [], nextCursor: 'aW52XzQy' } }],
          expected: { ok: true, orders: [], nextCursor: 'aW52XzQy' },
        },
        {
          name: 'rejects the shape the old fake returned',
          args: [{ items: [{ id: 1, totalCents: 1800 }], nextCursor: null }],
          expected: { ok: false, errors: ['data must be an object'] },
        },
        {
          name: 'rejects a body that is not an object',
          args: ['[]'],
          expected: { ok: false, errors: ['body must be an object'] },
        },
        {
          name: 'rejects a fractional total, naming the item',
          args: [{ data: { items: [{ id: 1, totalCents: 18.5 }], nextCursor: null } }],
          expected: {
            ok: false,
            errors: ['data.items[0].totalCents must be a whole number'],
          },
        },
        {
          name: 'reports every bad item and the cursor together',
          args: [
            {
              data: {
                items: [{ id: 'x', totalCents: 1 }, { id: 2, totalCents: 250 }, { id: 3 }],
                nextCursor: 7,
              },
            },
          ],
          expected: {
            ok: false,
            errors: [
              'data.items[0].id must be a whole number',
              'data.items[2].totalCents must be a whole number',
              'data.nextCursor must be a string or null',
            ],
          },
        },
        {
          name: 'ignores extra fields the consumer does not read',
          args: [
            {
              data: {
                items: [{ id: 1, totalCents: 5, status: 'paid' }],
                nextCursor: null,
                total: 1,
              },
            },
          ],
          expected: { ok: true, orders: [{ id: 1, totalCents: 5 }], nextCursor: null },
        },
      ],
    },
    {
      id: 'boundary-test-placement-review',
      kind: 'written',
      completionMode: 'submitted-with-reference-review',
      title: 'Explain why the unit test stayed green',
      prompt:
        'A teammate reads the opener and proposes fixing it by updating the fake client to return the new envelope. In your own words: why did the unit test keep passing after the service changed, why is updating the fake not a fix, what a contract test is and which side of the boundary it would have failed on, when a fake with real behavior is the right substitute for the real dependency, and where you would place unit, integration, and contract tests for the billing module. Use the sumOutstanding example throughout.',
      estimatedMinutes: 12,
      referenceAnswer:
        'The unit test kept passing because it tested sumOutstanding against a fake that encoded what the author believed the orders service returned. The service changed its envelope to { data: { items, nextCursor } }, but nothing connected the fake to the service, so the fake kept returning { items, nextCursor } and the arithmetic under test kept summing it correctly. The test measured the belief, not the boundary.\n\nUpdating the fake restores the belief to true today and leaves the mechanism intact: the next time the service changes, the fake will be stale again and the test will stay green again. A fake cannot detect drift because a fake is drift waiting to happen. The fix is a test that crosses the real boundary or a contract that both sides check.\n\nA contract test writes the agreed shape of the message as something executable, here a parser that takes unknown and returns typed orders or a list of exact problems. The billing module uses it at its boundary, so a drifted response becomes the error "data must be an object" instead of a TypeError three lines later, and the orders team runs the same parser against their real responses in their own suite. The envelope change would have failed on the provider side first, in the pull request that introduced it, because the consumer\'s contract said the items live at the top level. The contract is written from the consumer\'s side and tolerant of extra fields, so the provider can add to the response without breaking anyone.\n\nA fake with real behavior is the right substitute when the real dependency is too slow, too expensive, or not under your control, like a payment provider: an in-memory implementation of the same interface that really stores and filters, so a wrong query shape still fails. A mock that returns two orders whatever it is asked catches nothing.\n\nPlacement for the billing module: unit tests for the summing and the request builder, which are pure once the base URL and key are parameters; one integration test that runs sumOutstanding through the real HTTP client against the orders service started locally, crossing the boundary for real; and the contract parser used by the consumer at runtime and by the provider in its tests, so the shape is checked on both sides on every change.',
      rubric: [
        {
          id: 'drift-explained',
          label: 'Explains test double drift',
          description:
            'States that the fake encoded a belief about the service, that nothing tied it to the real response, and that the test therefore measured the belief rather than the boundary.',
        },
        {
          id: 'fake-update-rejected',
          label: 'Rejects updating the fake as the fix',
          description:
            'Argues that refreshing the fake only resets the same failure mode and that a real boundary crossing or an executable contract is required.',
        },
        {
          id: 'contract-both-sides',
          label: 'Contract test on both sides',
          description:
            'Describes the contract as an executable parser or schema used by the consumer and verified by the provider against real responses, names which side would have failed, and notes consumer-side tolerance of extra fields.',
        },
        {
          id: 'placement',
          label: 'Places each test kind',
          description:
            'Assigns unit tests to the pure logic, an integration test to the real client-service crossing, and the contract to both sides, and says when a behaving fake replaces a real dependency.',
        },
      ],
    },
    {
      id: 'billing-boundary-test-plan',
      kind: 'design',
      completionMode: 'submitted-with-rubric-review',
      title: 'Plan the boundary tests for the billing module',
      prompt:
        'Design the integration and contract tests for the billing module described in the scenario, deciding what runs for real, what is faked with behavior, and how the tests stay independent.',
      estimatedMinutes: 25,
      scenario:
        'The billing module has three boundaries. It reads orders from the orders service over HTTP, the one from the opener, which another team owns and deploys weekly. It stores invoices in a PostgreSQL database the billing team owns. And it charges cards through a third-party payment provider that bills per API call and offers a sandbox that is slow and occasionally unavailable. The module\'s own logic, summing orders and computing invoice totals, is pure. The suite runs on every pull request and must finish in under five minutes. Last quarter two incidents came from these boundaries: the orders envelope change from the opener, and an invoice insert that violated a NOT NULL constraint added by a migration the tests never exercised.',
      sections: [
        {
          id: 'boundaries',
          type: 'entity-list',
          label: 'Each boundary',
          prompt:
            'For each of the three boundaries, say whether the tests cross it for real, use a fake with real behavior, or use a contract, and why, referring to cost, ownership, and the incidents.',
        },
        {
          id: 'contract',
          type: 'short-answer',
          label: 'The orders contract',
          prompt:
            'Describe the executable contract for the orders response: what it checks, what it deliberately ignores, where the consumer uses it, and how the orders team runs it against their real responses.',
        },
        {
          id: 'database',
          type: 'tradeoff',
          label: 'The invoice database',
          prompt:
            'Choose how the invoice storage boundary is tested and justify it with the NOT NULL incident and the five-minute budget.',
          options: [
            'Run the real PostgreSQL in a container with migrations applied, one transaction per test rolled back at the end',
            'Use an in-memory repository fake that implements the same interface and keeps rows in a Map',
          ],
        },
        {
          id: 'isolation',
          type: 'short-answer',
          label: 'Keeping tests independent',
          prompt:
            'Explain how integration tests create and clean up their data so they can run in any order and in parallel, and what happens when the payment sandbox is unavailable during a run.',
        },
      ],
      rubric: [
        {
          id: 'boundary-decisions-reasoned',
          label: 'Each boundary decided with reasons',
          description:
            'Orders service gets a contract plus a local integration run or a behaving fake; the owned database is crossed for real or faked with a stated reason; the paid third-party provider is faked with real behavior, each tied to cost, ownership, or an incident.',
        },
        {
          id: 'contract-executable',
          label: 'Contract is executable and consumer-driven',
          description:
            'The orders contract is a parser or schema that names exact problems, ignores fields the consumer does not read, runs at the consumer boundary, and is verified by the provider against real responses.',
        },
        {
          id: 'database-tradeoff',
          label: 'Database choice argued from the incident and budget',
          description:
            'Either option can earn credit, but the answer must note that only the real database with migrations applied would have caught the NOT NULL incident, and weigh container startup time against the five-minute budget.',
        },
        {
          id: 'isolation-and-unavailability',
          label: 'Isolation and unavailability handled',
          description:
            'Tests create their own data with unique identifiers and clean up by transaction rollback or truncation, and the payment boundary does not depend on the sandbox being up during pull request runs.',
        },
      ],
      referenceAnswer:
        'Boundaries. Orders service: another team owns it and it changed under us once already, so it gets an executable contract used by the consumer and verified by the provider, plus one integration test that runs sumOutstanding through the real HTTP client against the orders service started locally from its published image; if that image is unavailable in CI, a fake with real behavior that serves recorded real responses through the contract. Invoice database: we own it and the second incident lived there, so it is crossed for real in a container with the migrations applied. Payment provider: it bills per call and its sandbox is slow and flaky, so the suite uses a fake that implements the same interface with real behavior, recording charges, refusing over-limit amounts, and returning the provider\'s documented error shapes; one manual or nightly job exercises the sandbox for real, outside the pull request budget.\n\nThe orders contract. parseOrdersResponse takes the decoded body as unknown and checks only what billing reads: an object with a data object, an items array whose entries have whole-number id and totalCents, and a nextCursor that is a string or null, naming each problem with its path. It ignores every other field so the orders team can add to the response without breaking us. Billing calls it on every response, so drift becomes a clear error at the boundary. The orders team imports the same parser into their integration suite and runs it against real responses from their handlers, so a change to the envelope fails their pull request before it deploys.\n\nThe invoice database. Run the real PostgreSQL in a container with migrations applied. The NOT NULL incident was a migration the tests never exercised; an in-memory Map has no constraints and cannot fail that way, so the fake would have passed the exact insert that broke production. A container starts in a few seconds and migrations for a young schema apply in under a minute, which fits the five-minute budget when the container is started once per run and each test wraps its work in a transaction that is rolled back at the end, leaving no rows behind and letting tests run in parallel on separate connections. The Map fake is the right choice only for the pure invoice-total logic, which does not need a database at all.\n\nIsolation. Every integration test creates its own customer and orders with unique identifiers generated per test, never relying on shared seed rows, and cleans up by rolling back its transaction or truncating the tables it touched. Tests therefore pass in any order and in parallel. The payment fake means the pull request suite never calls the sandbox, so an outage there cannot fail a run; the nightly sandbox job reports separately, and a failure there is a signal to check the fake against the provider\'s current behavior, which is the contract idea applied to a third party.',
    },
  ],
  approaches: {
    'inject-request-target': [
      {
        name: 'Inputs through parameters, nothing from the environment',
        code: `type OrdersRequest = { url: string; headers: Record<string, string> }

export function buildOrdersRequest(
  baseUrl: string,
  apiKey: string,
  customerId: number,
  cursor: string | null,
): OrdersRequest {
  // Resolving against the caller's base URL is what lets a test point this
  // at a local fake service and production point it at the real one.
  const url = new URL('/orders', baseUrl)
  url.searchParams.set('customerId', String(customerId))
  if (cursor !== null) {
    url.searchParams.set('cursor', cursor)
  }

  // The credential is a parameter too, so a test can assert exactly which
  // key was attached instead of whatever the environment held.
  return {
    url: url.toString(),
    headers: { accept: 'application/json', 'x-api-key': apiKey },
  }
}`,
        explanation:
          'The URL and header construction is untouched; the whole refactor moves the two hidden inputs into the parameter list. Before, the function had four inputs and admitted to two, and the missing two were read from the environment at call time, so a test could only check the request against whatever ORDERS_URL happened to be. Now every input is visible in the signature, the function is pure, and the same builder serves production, staging, and a fake on a local port depending only on what the caller passes. Production reads the environment once at startup, in the config parser from lesson 45, and hands the values down; this function never needs to know where they came from.',
        complexity:
          'O(1) time and space. The guarantee that matters is that the request depends only on the arguments, so a test can target any service and pin the exact request.',
      },
    ],
    'parse-orders-response': [
      {
        name: 'Check the envelope, then each item, then the cursor',
        code: `type Order = { id: number; totalCents: number }

type ParsedOrders =
  | { ok: true; orders: Order[]; nextCursor: string | null }
  | { ok: false; errors: string[] }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function parseOrdersResponse(body: unknown): ParsedOrders {
  // The envelope checks stop early, because nothing below them can be
  // described usefully when the outer shape is wrong.
  if (!isRecord(body)) {
    return { ok: false, errors: ['body must be an object'] }
  }
  const data = body.data
  if (!isRecord(data)) {
    return { ok: false, errors: ['data must be an object'] }
  }

  const errors: string[] = []
  const orders: Order[] = []

  if (!Array.isArray(data.items)) {
    errors.push('data.items must be an array')
  } else {
    data.items.forEach((item, index) => {
      // Each problem names its path, so a provider reading the error knows
      // exactly which field of which item drifted.
      if (!isRecord(item) || !Number.isInteger(item.id)) {
        errors.push(\`data.items[\${index}].id must be a whole number\`)
        return
      }
      if (!Number.isInteger(item.totalCents)) {
        errors.push(\`data.items[\${index}].totalCents must be a whole number\`)
        return
      }
      // Only the fields the consumer reads are copied out; extras are ignored.
      orders.push({ id: item.id as number, totalCents: item.totalCents as number })
    })
  }

  const cursor = data.nextCursor
  if (cursor !== null && typeof cursor !== 'string') {
    errors.push('data.nextCursor must be a string or null')
  }

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  return { ok: true, orders, nextCursor: cursor as string | null }
}`,
        explanation:
          'The parser is the contract written as code, and its shape follows lesson 31: an unknown comes in, a typed value or a list of exact problems goes out, and nothing past the boundary sees an unchecked field. The two envelope checks return immediately, because reporting item problems inside a body that is not even an object would be noise; once the envelope holds, every remaining problem is collected so a provider sees all of them in one run. Number.isInteger does double duty, rejecting both non-numbers and fractions, which is why a total of 18.5 cents is refused. Copying out only id and totalCents is the consumer-driven tolerance the lesson described: a status field or a total count added by the provider passes through untouched, so the contract constrains what billing needs and nothing more.',
        complexity:
          'O(n) time and space for n items. The guarantee that matters is that a drifted response becomes a named error at the boundary rather than a crash deeper in.',
      },
    ],
  },
}
