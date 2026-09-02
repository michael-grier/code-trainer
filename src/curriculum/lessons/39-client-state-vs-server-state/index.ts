import Concept from './concept.mdx'

import type { Lesson } from '../../types'

export const lesson: Lesson = {
  slug: 'client-state-vs-server-state',
  title: 'Client State vs Server State',
  summary:
    'Choose where data lives and how it updates across UI, cache, and backend boundaries.',
  track: 'frontend',
  order: 39,
  concept: Concept,
  problems: [
    {
      id: 'cache-read-decision',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Implement the cache-read decision',
      prompt:
        "Implement readFromCache, the decision at the heart of a freshness policy. The cache maps keys to entries of `{ data, fetchedAtMs }`. Given the cache, a key, the current time, and a stale-time threshold, return a discriminated union: `{ kind: 'miss' }` when the key has no entry, `{ kind: 'fresh', data }` when the entry's age is strictly less than `staleTimeMs`, and `{ kind: 'stale', data }` otherwise — stale entries still carry their data, because stale-while-revalidate shows the old copy while refetching. An entry exactly `staleTimeMs` old is already stale. Example: with an entry fetched at 1000, `readFromCache(cache, 'tasks', 1500, 30000)` returns `{ kind: 'fresh', data: [...] }`, and at now 31000 it returns `{ kind: 'stale', data: [...] }`.",
      estimatedMinutes: 12,
      functionName: 'readFromCache',
      starter: `type CacheEntry = { data: string[]; fetchedAtMs: number }

type CacheDecision =
  | { kind: 'miss' }
  | { kind: 'fresh'; data: string[] }
  | { kind: 'stale'; data: string[] }

export function readFromCache(
  cache: Record<string, CacheEntry>,
  key: string,
  nowMs: number,
  staleTimeMs: number,
): CacheDecision {
  return { kind: 'miss' }
}

console.log(
  readFromCache({ tasks: { data: ['a', 'b'], fetchedAtMs: 1000 } }, 'tasks', 1500, 30000),
)
`,
      tests: [
        {
          name: 'an unknown key is a miss',
          args: [
            { tasks: { data: ['a', 'b'], fetchedAtMs: 1000 } },
            'projects',
            1500,
            30000,
          ],
          expected: { kind: 'miss' },
        },
        {
          name: 'a young entry is fresh',
          args: [
            { tasks: { data: ['a', 'b'], fetchedAtMs: 1000 } },
            'tasks',
            1500,
            30000,
          ],
          expected: { kind: 'fresh', data: ['a', 'b'] },
        },
        {
          name: 'an old entry is stale but keeps its data',
          args: [
            { tasks: { data: ['a', 'b'], fetchedAtMs: 1000 } },
            'tasks',
            40000,
            30000,
          ],
          expected: { kind: 'stale', data: ['a', 'b'] },
        },
        {
          name: 'age exactly at the threshold is stale',
          args: [
            { tasks: { data: ['a', 'b'], fetchedAtMs: 1000 } },
            'tasks',
            31000,
            30000,
          ],
          expected: { kind: 'stale', data: ['a', 'b'] },
        },
        {
          name: 'one millisecond younger is fresh',
          args: [
            { tasks: { data: ['a', 'b'], fetchedAtMs: 1000 } },
            'tasks',
            30999,
            30000,
          ],
          expected: { kind: 'fresh', data: ['a', 'b'] },
        },
        {
          name: 'a zero stale time trusts nothing',
          args: [
            { tasks: { data: ['a', 'b'], fetchedAtMs: 1000 } },
            'tasks',
            1000,
            0,
          ],
          expected: { kind: 'stale', data: ['a', 'b'] },
        },
        {
          name: 'an inherited name is not an entry',
          args: [
            { tasks: { data: ['a', 'b'], fetchedAtMs: 1000 } },
            'toString',
            1500,
            30000,
          ],
          expected: { kind: 'miss' },
        },
        {
          name: 'an empty cache always misses',
          args: [{}, 'tasks', 1000, 30000],
          expected: { kind: 'miss' },
        },
      ],
    },
    {
      id: 'fix-racing-search',
      kind: 'react-code',
      completionMode: 'all-tests-pass',
      title: 'Stop the stale response from winning',
      prompt:
        "This is the racing search from the lesson. Its miniature network holds every request until a delivery button resolves it, so the tests can replay the race exactly: type `a`, narrow to `ap`, deliver the newer response, then deliver the older one — and the stale `a` results overwrite the correct screen. Fix the effect with the lesson's cleanup pattern: a `superseded` flag (or equivalent) set in the cleanup, checked before applying the response, so a response is only applied by the request that is still current. Keep the input, the messages, and both delivery buttons exactly as they are. Your component is rendered for real, with response order controlled by the tests. Example: after typing `a`, then `ap`, then delivering newest and oldest in that order, the screen must still show `found: apple, apricot` with no banana in sight.",
      estimatedMinutes: 15,
      componentName: 'ProductSearch',
      starter: `import { useEffect, useState } from 'react'

// A miniature network: requests wait here until a delivery button resolves
// them, so response order is driven by the test, not by timing.
type PendingRequest = { query: string; resolve: (items: string[]) => void }
const pendingRequests: PendingRequest[] = []
const catalog = ['apple', 'apricot', 'banana']

function searchApi(query: string): Promise<string[]> {
  return new Promise((resolve) => {
    pendingRequests.push({ query, resolve })
  })
}

function deliver(request: PendingRequest | undefined) {
  if (request) {
    request.resolve(catalog.filter((item) => item.includes(request.query)))
  }
}

export function ProductSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<string[] | null>(null)

  useEffect(() => {
    if (query === '') {
      setResults(null)
      return
    }
    searchApi(query).then((items) => setResults(items))
  }, [query])

  return (
    <div>
      <input
        aria-label="search"
        value={query}
        onChange={(event) => {
          // A new question invalidates the old answer immediately: clear the
          // results in the handler so the screen never pairs them with the
          // new query while its request is in flight.
          setQuery(event.target.value)
          setResults(null)
        }}
      />
      {query === '' && <p>type to search</p>}
      {query !== '' && results === null && <p>searching…</p>}
      {results !== null && <p>found: {results.join(', ')}</p>}
      <button onClick={() => deliver(pendingRequests.shift())}>deliver oldest</button>
      <button onClick={() => deliver(pendingRequests.pop())}>deliver newest</button>
    </div>
  )
}
`,
      tests: [
        {
          name: 'invites a search before any request',
          props: {},
          expect: [
            { type: 'text-present', text: 'type to search' },
            { type: 'text-absent', text: 'found:' },
          ],
        },
        {
          name: 'shows results when the response arrives',
          props: {},
          steps: [
            { action: 'type', into: 'search', value: 'ap' },
            { action: 'click', text: 'deliver oldest' },
          ],
          expect: [{ type: 'text-present', text: 'found: apple, apricot' }],
        },
        {
          name: 'in-order responses land normally',
          props: {},
          steps: [
            { action: 'type', into: 'search', value: 'a' },
            { action: 'type', into: 'search', value: 'ap' },
            { action: 'click', text: 'deliver oldest' },
            { action: 'click', text: 'deliver newest' },
          ],
          expect: [
            { type: 'text-present', text: 'found: apple, apricot' },
            { type: 'text-absent', text: 'banana' },
          ],
        },
        {
          name: 'a stale response cannot overwrite a newer one',
          props: {},
          steps: [
            { action: 'type', into: 'search', value: 'a' },
            { action: 'type', into: 'search', value: 'ap' },
            { action: 'click', text: 'deliver newest' },
            { action: 'click', text: 'deliver oldest' },
          ],
          expect: [
            { type: 'text-present', text: 'found: apple, apricot' },
            { type: 'text-absent', text: 'banana' },
          ],
        },
        {
          name: 'a new query clears the old answer while it waits',
          props: {},
          steps: [
            { action: 'type', into: 'search', value: 'ap' },
            { action: 'click', text: 'deliver oldest' },
            { action: 'type', into: 'search', value: 'ban' },
          ],
          expect: [
            { type: 'text-present', text: 'searching…' },
            { type: 'text-absent', text: 'found:' },
          ],
        },
        {
          name: 'an in-flight search says so',
          props: {},
          steps: [{ action: 'type', into: 'search', value: 'ban' }],
          expect: [
            { type: 'text-present', text: 'searching…' },
            { type: 'text-absent', text: 'found:' },
          ],
        },
      ],
    },
    {
      id: 'project-board-state-design',
      kind: 'design',
      completionMode: 'submitted-with-rubric-review',
      title: 'Decide where the project board’s state lives',
      prompt:
        'Classify every piece of state in the scenario as client or server state, then design how the server pieces are fetched, kept fresh, and updated after mutations.',
      estimatedMinutes: 25,
      scenario:
        'You are building a project board. The board shows columns of task cards fetched from the API; several teammates use the same board at once. The user can: filter cards by assignee (a dropdown), collapse columns they do not care about, select a card to open a details panel, edit the card title in that panel and save it, and drag cards between columns. Product wants edits to feel instant, the board to reflect teammates’ changes reasonably soon, and no user to ever lose a half-typed title because the board refreshed.',
      sections: [
        {
          id: 'classification',
          type: 'entity-list',
          label: 'State inventory',
          prompt:
            'List each piece of state (task cards, filter choice, collapsed columns, selected card, in-progress title edit, drag state) and classify it as client or server state, with one line of justification each using the whose-truth test.',
        },
        {
          id: 'fetch-policy',
          type: 'short-answer',
          label: 'Fetching and freshness',
          prompt:
            'Describe how the board data is fetched and modeled (statuses included), and the freshness policy that keeps teammates’ changes appearing without hammering the API.',
        },
        {
          id: 'mutation-flow',
          type: 'tradeoff',
          label: 'After a mutation',
          prompt:
            'Choose how the board updates when the user saves a title or drags a card, and justify it against the instant-feel requirement and the shared-board requirement.',
          options: [
            'Refetch after mutation: send the write, then invalidate and refetch the board',
            'Optimistic update: apply the change locally at once, send the write, roll back on failure',
            'Update from response: send the write, apply the updated entity the server returns',
          ],
        },
        {
          id: 'edit-protection',
          type: 'short-answer',
          label: 'Protecting the half-typed title',
          prompt:
            'A background refetch lands while the user is mid-edit in the details panel. Explain why the naive design loses their typing, and how your state classification prevents it.',
        },
      ],
      rubric: [
        {
          id: 'correct-classification',
          label: 'Classification uses the ownership test',
          description:
            'Cards are server state; filter, collapsed columns, selection, drag state, and the in-progress edit are client state — each justified by whose job it is to know the true value, not by where the data is displayed.',
        },
        {
          id: 'status-modeling',
          label: 'Requests carry statuses',
          description:
            'Board data is modeled with explicit request states (loading, error, success at minimum), not a bare nullable value, so failures and in-flight states have honest screens.',
        },
        {
          id: 'freshness-policy',
          label: 'A deliberate freshness policy',
          description:
            'Teammate visibility is handled by a stale-time plus revalidation policy (interval, focus, or after mutations), with a stated reason for the chosen cadence rather than refetch-always or refetch-never.',
        },
        {
          id: 'mutation-reasoning',
          label: 'Mutation flow argued from requirements',
          description:
            'The chosen mutation strategy is defended against both the instant-feel and shared-board requirements, including the failure path (rollback or reconciliation); any of the three options can earn credit with honest tradeoffs.',
        },
        {
          id: 'edit-isolation',
          label: 'The draft is client state',
          description:
            'The in-progress title lives in client state seeded from the server copy once (named as a draft), so refetches update the cache without touching the user’s typing until they save or discard.',
        },
      ],
      referenceAnswer:
        "State inventory. Task cards: server state — the board is shared, so the server is the only party that knows the true card list; my copy is a snapshot. Filter choice: client state — it describes what this user wants to see, and no one else's truth constrains it. Collapsed columns: client state, same reasoning (worth persisting locally, but still owned here). Selected card: client state — it is a UI position, meaningful only in this session. The in-progress title edit: client state — it is this user's unsaved intention, and the server must not be able to overwrite it. Drag state: transient client state during the gesture; the drop becomes a mutation against server state.\n\nFetching and freshness. The board query is modeled with the four-state union — idle, loading, error with a message and retry, success with the columns — so every screen has an honest source, and each response is guarded against supersession so a slow response cannot overwrite a newer one. Freshness: entries carry fetchedAt with a stale time on the order of tens of seconds; reads within it use the cache, reads past it show the cached board and revalidate in the background (stale-while-revalidate), and a focus-triggered revalidation catches the user returning to the tab. That cadence keeps teammates' changes visible within seconds without polling the API on every render.\n\nAfter a mutation. Optimistic update, with rollback. The instant-feel requirement rules out waiting on a refetch round-trip for drags — a card that hangs mid-drag while the network thinks feels broken. On save or drop: apply the change to the cached board immediately, send the write, and on failure restore the previous cache snapshot and surface the error. To serve the shared-board requirement, follow the confirmed write with an invalidation so the next revalidation reconciles anything teammates changed meanwhile. Update-from-response is a reasonable middle ground for the title save, where a one-round-trip delay is tolerable; refetch-after-mutation alone fails the instant-feel bar for drag.\n\nProtecting the half-typed title. The naive design copies the card into the panel's state and also lets refetches replace whatever the panel reads — or worse, binds the input straight to the cached card — so a background refetch mid-edit repaints the input with the server's title and the typing is gone. The classification prevents it: the draft is client state, seeded from the server copy once when the panel opens (a deliberate initial-value copy, lesson 34's initialItems pattern, named draftTitle to say so). Refetches update the cache and the board behind the panel; the input reads only the draft. On save the draft becomes a mutation; on cancel it is discarded. If the server copy changed underneath a still-open draft, the panel can say so — 'this card changed while you were editing' — but it never substitutes its text for the user's.",
    },
    {
      id: 'server-state-review',
      kind: 'written',
      completionMode: 'submitted-with-reference-review',
      title: 'Explain what makes server state a cache',
      prompt:
        'A teammate reviews your PR and asks why you "overcomplicated" a product list: they would have written one useState and one fetch in an effect, and they point out it works in the demo. In your own words, explain: the ownership test that separates client from server state and what each demands, the request-status modeling their version lacks and what screens it makes impossible, the race their version loses and the cleanup rule that fixes it, and what freshness and invalidation add once the data can change on the server. Finish with when their simple version is actually fine. Use a short example of your own.',
      estimatedMinutes: 12,
      referenceAnswer:
        "The test I use: if this value is wrong, whose job is it to know the right one? The product list's truth lives on the server — other clients change it, it ages, and getting a copy is an async operation that can fail. That makes my copy a cache entry, not owned state, and caches have obligations that owned state never has: a status, a defense against response reordering, and a freshness policy. The query in the search box, by contrast, is ours: synchronous, authoritative, governed by the ordinary state rules. The one-useState version treats both the same, which is exactly the overcomplication in reverse — it simplifies away obligations that still exist.\n\nStatus first. A bare `products` that starts null cannot distinguish 'not asked yet', 'asking', 'failed', and 'the server said there are none'. Those are four different screens — an invitation, a spinner, a retry button, an empty-state message — and the flat version can only render two of them, so a failed fetch becomes an eternal spinner. The four-state discriminated union from lesson 26 makes each screen renderable from an honest source, and the error state is the one you cannot retrofit after launch without touching every consumer.\n\nThe race is the bug the demo will never show, because demos have fast, ordered networks. Two in-flight requests — a refetch racing a filter change — resolve in whatever order the network pleases, and the naive `.then(setProducts)` applies whichever lands last. The rule that fixes it: a response may only be applied by the request that is still current. The effect's cleanup sets a superseded flag (or aborts the fetch outright with lesson 24's controller), and the stale response is dropped instead of applied. Ten lines, and the class of wrong-screen bugs disappears.\n\nFreshness and invalidation are what remain once the data can change without you. A snapshot fetched at page load is a lie by lunchtime; a stale-time policy shows the cached copy while revalidating past a threshold, and your own mutations invalidate immediately — after the user deletes a product, the cached list is known-wrong, and the next read must refetch. My example: a dashboard that cached team headcount forever; HR updated the roster and the dashboard disagreed with it for a week. One invalidation on the mutation and a five-minute stale time ended it.\n\nWhen their version is fine: data that is fetched once and genuinely static for the session — a country list, a config blob — where staleness is acceptable by design, failure can fall back to a default, and no second request will ever race the first. Then one useState and one effect is not naive, it is proportionate. The skill is telling the two cases apart before the demo network stops flattering the code.",
      rubric: [
        {
          id: 'ownership-test',
          label: 'The ownership test',
          description:
            'States the whose-truth test and derives the cache obligations (status, race defense, freshness) that server state carries and client state does not.',
        },
        {
          id: 'status-union',
          label: 'Statuses make screens possible',
          description:
            'Shows what the flat nullable version cannot render — distinct loading, error/retry, and empty states — and applies the discriminated-union modeling.',
        },
        {
          id: 'race-rule',
          label: 'The supersession rule',
          description:
            'Explains the out-of-order response bug and the cleanup-based fix: only the still-current request may apply its response, via flag or abort.',
        },
        {
          id: 'freshness-invalidation',
          label: 'Freshness and invalidation',
          description:
            'Covers stale-time revalidation for others’ changes and immediate invalidation after own mutations, with a concrete staleness consequence.',
        },
        {
          id: 'proportionality',
          label: 'When simple is right',
          description:
            'Names a legitimate case for the bare fetch-into-state version (static, sessionlong data with no races) rather than defending the machinery unconditionally.',
        },
      ],
    },
  ],
  approaches: {
    'cache-read-decision': [
      {
        name: 'Guard the miss, then compare the age',
        code: `type CacheEntry = { data: string[]; fetchedAtMs: number }

type CacheDecision =
  | { kind: 'miss' }
  | { kind: 'fresh'; data: string[] }
  | { kind: 'stale'; data: string[] }

export function readFromCache(
  cache: Record<string, CacheEntry>,
  key: string,
  nowMs: number,
  staleTimeMs: number,
): CacheDecision {
  // An own-property check, so inherited names like 'toString' cannot pose
  // as cache entries.
  if (!Object.hasOwn(cache, key)) {
    return { kind: 'miss' }
  }

  const entry = cache[key]

  // Age equal to the stale time is already stale: fresh means strictly
  // younger than the threshold.
  const ageMs = nowMs - entry.fetchedAtMs
  if (ageMs < staleTimeMs) {
    return { kind: 'fresh', data: entry.data }
  }

  return { kind: 'stale', data: entry.data }
}`,
        explanation:
          "Three outcomes, three returns, in the order that keeps each check simple: the miss is handled before any arithmetic can run against a missing entry, and what remains is one age comparison. The miss check uses Object.hasOwn rather than an undefined comparison, because a plain object inherits names like toString from its prototype — a lookup by that key would find a function, sail past an undefined check, and hand back a non-miss result with no data. The strict less-than is the deliberate detail — the boundary tests pin it from both sides, with an entry exactly at the threshold going stale and one millisecond younger staying fresh — and it makes a zero stale time mean 'trust nothing', which is the honest degenerate case. Stale still carries the data because the whole point of the third state is stale-while-revalidate: the caller shows the aged copy immediately and refetches behind it, so the user sees content now and truth shortly. Returning a discriminated union rather than a boolean-plus-maybe-data means every caller must say what it does in all three cases, which is lesson 26 keeping this cache honest.",
        complexity:
          'O(1) time and space per read. The guarantee that matters is the contract: every read yields exactly one of miss, fresh, or stale, with data present whenever an entry exists.',
      },
    ],
    'fix-racing-search': [
      {
        name: 'A superseded flag in the cleanup',
        code: `import { useEffect, useState } from 'react'

// A miniature network: requests wait here until a delivery button resolves
// them, so response order is driven by the test, not by timing.
type PendingRequest = { query: string; resolve: (items: string[]) => void }
const pendingRequests: PendingRequest[] = []
const catalog = ['apple', 'apricot', 'banana']

function searchApi(query: string): Promise<string[]> {
  return new Promise((resolve) => {
    pendingRequests.push({ query, resolve })
  })
}

function deliver(request: PendingRequest | undefined) {
  if (request) {
    request.resolve(catalog.filter((item) => item.includes(request.query)))
  }
}

export function ProductSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<string[] | null>(null)

  useEffect(() => {
    if (query === '') {
      setResults(null)
      return
    }

    // The cleanup marks this render's request as superseded, so a response
    // that arrives after the query moved on is ignored instead of applied.
    let superseded = false
    searchApi(query).then((items) => {
      if (!superseded) {
        setResults(items)
      }
    })
    return () => {
      superseded = true
    }
  }, [query])

  return (
    <div>
      <input
        aria-label="search"
        value={query}
        onChange={(event) => {
          // A new question invalidates the old answer immediately: clear the
          // results in the handler so the screen never pairs them with the
          // new query while its request is in flight.
          setQuery(event.target.value)
          setResults(null)
        }}
      />
      {query === '' && <p>type to search</p>}
      {query !== '' && results === null && <p>searching…</p>}
      {results !== null && <p>found: {results.join(', ')}</p>}
      <button onClick={() => deliver(pendingRequests.shift())}>deliver oldest</button>
      <button onClick={() => deliver(pendingRequests.pop())}>deliver newest</button>
    </div>
  )
}`,
        explanation:
          "The fix is entirely inside the effect, and it leans on the schedule lesson 36 pinned down: when the query changes, React runs the old effect's cleanup before the new effect, so the `a` request's superseded flag is already true by the time the `ap` request exists. Each effect run closes over its own flag, which is what makes this correct with any number of in-flight requests — every response checks the flag belonging to its own request, and only the one whose cleanup has not run may touch state. The race test replays the exact failure: newest delivered first paints the right screen, and the late oldest response now hits a dead flag and is dropped. In production the same cleanup would also abort the network call with lesson 24's AbortController — the flag stops the state write, the signal stops the work — but the rule is identical either way: a response may only be applied by the request that is still current.",
        complexity:
          'O(1) work per response beyond the filter itself. The guarantee that matters is the invariant: the screen only ever shows results for the query currently in the input.',
      },
    ],
  },
}
