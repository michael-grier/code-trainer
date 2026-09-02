import Concept from './concept.mdx'

import type { Lesson } from '../../types'

export const lesson: Lesson = {
  slug: 'routing-and-layout-architecture',
  title: 'Routing and Layout Architecture',
  summary:
    'Structure nested routes, layouts, and navigation for durable client apps.',
  track: 'frontend',
  order: 41,
  concept: Concept,
  problems: [
    {
      id: 'route-matcher',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Implement the route matcher',
      prompt:
        "Implement matchRoute, the kernel of every router. Given a pattern like `/projects/:projectId/tasks/:taskId` and a concrete path, return the captured params when the pattern describes the path, or null when it does not. The rules: split both strings on `/` and ignore the empty pieces that leading or trailing slashes leave behind, so `/users/` and `/users` are the same segments; the segment counts must be equal; a pattern segment starting with `:` captures the path segment under its name; any other segment must match exactly. A pattern with no params that matches returns `{}`. Example: `matchRoute('/users/:id', '/users/42')` returns `{ id: '42' }`, and `matchRoute('/users/:id', '/users')` returns `null`.",
      estimatedMinutes: 15,
      functionName: 'matchRoute',
      starter: `export function matchRoute(
  pattern: string,
  path: string,
): Record<string, string> | null {
  return null
}

console.log(matchRoute('/users/:id', '/users/42'))
`,
      tests: [
        {
          name: 'captures a single param',
          args: ['/users/:id', '/users/42'],
          expected: { id: '42' },
        },
        {
          name: 'rejects a path with extra segments',
          args: ['/users', '/users/42'],
          expected: null,
        },
        {
          name: 'rejects a path with missing segments',
          args: ['/users/:id', '/users'],
          expected: null,
        },
        {
          name: 'captures multiple params',
          args: ['/projects/:projectId/tasks/:taskId', '/projects/p1/tasks/t9'],
          expected: { projectId: 'p1', taskId: 't9' },
        },
        {
          name: 'rejects a static segment mismatch',
          args: ['/users/settings', '/users/42'],
          expected: null,
        },
        {
          name: 'matches the root against itself',
          args: ['/', '/'],
          expected: {},
        },
        {
          name: 'ignores a trailing slash',
          args: ['/users/', '/users'],
          expected: {},
        },
        {
          name: 'rejects a different resource entirely',
          args: ['/users/:id', '/orders/42'],
          expected: null,
        },
        {
          name: 'captures values with dashes',
          args: ['/docs/:page', '/docs/getting-started'],
          expected: { page: 'getting-started' },
        },
      ],
    },
    {
      id: 'lift-the-shell',
      kind: 'react-code',
      completionMode: 'all-tests-pass',
      title: 'Make the shell survive navigation',
      prompt:
        "This is the mail app from the lesson: each page renders its own copy of Shell, so navigating swaps the whole subtree, remounts the chrome, and resets the filter the user just typed. Fix the architecture by inverting the nesting: render one Shell in MailApp that wraps the swapped page content, and reduce InboxPage and ArchivePage to pure content components with no shell and no navigation props. Do not change Shell itself or any displayed text. Your component is rendered for real and navigated. Example: typing `urgent` into the filter and clicking `archive` must leave both `filtering: urgent` and `archive: 5 stored` on screen.",
      estimatedMinutes: 15,
      componentName: 'MailApp',
      starter: `import { useState } from 'react'

type Page = 'inbox' | 'archive'

type ShellProps = {
  onNavigate: (page: Page) => void
  children: React.ReactNode
}

// The app chrome: navigation plus a filter box that should survive
// navigation between pages.
function Shell({ onNavigate, children }: ShellProps) {
  const [filter, setFilter] = useState('')

  return (
    <div>
      <button onClick={() => onNavigate('inbox')}>inbox</button>
      <button onClick={() => onNavigate('archive')}>archive</button>
      <input
        aria-label="filter"
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
      />
      <p>filtering: {filter}</p>
      {children}
    </div>
  )
}

function InboxPage({ onNavigate }: { onNavigate: (page: Page) => void }) {
  return (
    <Shell onNavigate={onNavigate}>
      <p>inbox: 2 unread</p>
    </Shell>
  )
}

function ArchivePage({ onNavigate }: { onNavigate: (page: Page) => void }) {
  return (
    <Shell onNavigate={onNavigate}>
      <p>archive: 5 stored</p>
    </Shell>
  )
}

export function MailApp() {
  const [page, setPage] = useState<Page>('inbox')

  return page === 'inbox' ? (
    <InboxPage onNavigate={setPage} />
  ) : (
    <ArchivePage onNavigate={setPage} />
  )
}
`,
      tests: [
        {
          name: 'starts on the inbox',
          props: {},
          expect: [
            { type: 'text-present', text: 'inbox: 2 unread' },
            { type: 'text-absent', text: 'archive: 5 stored' },
          ],
        },
        {
          name: 'navigating swaps the page content',
          props: {},
          steps: [{ action: 'click', text: 'archive' }],
          expect: [
            { type: 'text-present', text: 'archive: 5 stored' },
            { type: 'text-absent', text: 'inbox: 2 unread' },
          ],
        },
        {
          name: 'the filter works on the current page',
          props: {},
          steps: [{ action: 'type', into: 'filter', value: 'urgent' }],
          expect: [{ type: 'text-present', text: 'filtering: urgent' }],
        },
        {
          name: 'the filter survives navigating away',
          props: {},
          steps: [
            { action: 'type', into: 'filter', value: 'urgent' },
            { action: 'click', text: 'archive' },
          ],
          expect: [
            { type: 'text-present', text: 'filtering: urgent' },
            { type: 'text-present', text: 'archive: 5 stored' },
          ],
        },
        {
          name: 'the filter survives a round trip',
          props: {},
          steps: [
            { action: 'type', into: 'filter', value: 'urgent' },
            { action: 'click', text: 'archive' },
            { action: 'click', text: 'inbox' },
          ],
          expect: [
            { type: 'text-present', text: 'filtering: urgent' },
            { type: 'text-present', text: 'inbox: 2 unread' },
          ],
        },
      ],
    },
    {
      id: 'workspace-route-design',
      kind: 'design',
      completionMode: 'submitted-with-rubric-review',
      title: 'Design the routes and layouts for a project workspace',
      prompt:
        'Design the route table, layout nesting, and URL policy for the workspace described in the scenario, then defend your URL decisions.',
      estimatedMinutes: 25,
      scenario:
        "You are structuring the client app for a project workspace. Screens: a login page (no app chrome); a dashboard listing the user's projects; a project view with tabs for board, docs, and settings, all sharing a project header with the project name and members; a document view inside docs for reading one document; and a not-found screen. The board supports filtering by assignee, and support regularly asks users to \"send me the link to exactly what you're seeing.\" The sidebar (dashboard navigation) has a collapsed/expanded toggle users expect to stay put while they move around.",
      sections: [
        {
          id: 'route-table',
          type: 'entity-list',
          label: 'Route table',
          prompt:
            'List the route patterns in matching order, each with the screen it shows and any params it captures. Include the not-found route and say why the order you chose is safe.',
        },
        {
          id: 'layout-tree',
          type: 'short-answer',
          label: 'Layout nesting',
          prompt:
            'Describe the layout tree: which layouts exist, which routes render inside which, and where the sidebar toggle and the project header live so they survive the navigations they should.',
        },
        {
          id: 'url-policy',
          type: 'tradeoff',
          label: 'The assignee filter',
          prompt:
            "Decide where the board's assignee filter lives, keeping in mind the support team's link requests, and justify the choice.",
          options: [
            'In the URL as a query parameter: /projects/:id/board?assignee=ada',
            'In component state inside the board page',
            'In app-level client state (context or store) so it persists across projects',
          ],
        },
        {
          id: 'edge-cases',
          type: 'short-answer',
          label: 'Edges',
          prompt:
            'Say what happens on an unknown project id (a valid pattern match with no such entity), what the login page does about the app layout, and where the user lands after logging in from a deep link.',
        },
      ],
      rubric: [
        {
          id: 'ordered-table',
          label: 'A safe, ordered route table',
          description:
            'Patterns cover every screen with params where entities vary (/projects/:projectId, nested docs/:docId), specific routes precede parameterized ones where they could collide, and a catch-all not-found route closes the table.',
        },
        {
          id: 'nested-layouts',
          label: 'Layouts nest and persist',
          description:
            'An app shell (with the sidebar) wraps authenticated routes, a project layout (with the header) wraps the three tabs, login renders outside the shell, and each piece of persistent chrome state lives at the layout level that survives the relevant navigations.',
        },
        {
          id: 'url-classification',
          label: 'URL policy uses the share test',
          description:
            'The assignee filter goes in the URL (or the alternative is defended against the send-me-the-link requirement), while the sidebar toggle is kept out of it as session-local state, applying who-needs-it-back-later.',
        },
        {
          id: 'honest-edges',
          label: 'Edges are handled honestly',
          description:
            'An unknown project id renders a not-found or error state distinct from routing 404 (the pattern matched; the entity is missing — server state, lesson 39), and post-login navigation returns the user to the deep link they arrived at.',
        },
        {
          id: 'param-flow',
          label: 'Params flow from the match',
          description:
            'Captured params (projectId, docId) are the single source for which entity each screen loads, rather than duplicated selection state that can drift from the URL.',
        },
      ],
      referenceAnswer:
        "Route table, in matching order: `/login` → login screen, no params. `/` → dashboard. `/projects/:projectId/board` → board tab. `/projects/:projectId/docs` → docs list tab. `/projects/:projectId/docs/:docId` → single document. `/projects/:projectId/settings` → settings tab. `*` (catch-all, last) → not-found. Ordering is safe because every static segment that could collide with a param sits in a different position here — but the discipline still applies: if a `/projects/new` screen appears later, it must be listed before `/projects/:projectId`, or 'new' becomes a project id. The catch-all goes last so it only claims what nothing else matched.\n\nLayout nesting. Three layers. The app shell — sidebar with its collapsed toggle — wraps every authenticated route: dashboard and all project routes render in its slot, so the toggle's state lives in the shell and survives every navigation in the app. The project layout — header with name and members, fetched once per project from :projectId — wraps the three tab routes; switching board to docs to settings swaps content inside it, so the header neither refetches nor flickers. The document view nests inside the docs tab's slot. Login renders outside the app shell entirely, which is what 'no chrome' means structurally: it is a sibling of the shell, not a child with pieces hidden. Each decision is the same test: the sidebar toggle must survive project switches, so it lives above them; the project header must survive tab switches but not project switches, so it lives between them.\n\nThe assignee filter: in the URL as a query parameter. The deciding requirement is support's 'send me the link to exactly what you're seeing' — a filter in component state produces links that lie, showing the sender's filtered board and the receiver's unfiltered one. The URL also makes refresh and back/forward preserve the view for free. Component state fails the share test outright; app-level persistence is worse — it makes the filter follow the user across projects invisibly, so the same link renders differently depending on session history, which is exactly what shared links must never do. The sidebar toggle is the counterexample that keeps the policy honest: nobody needs it back from a link, so it stays out of the URL, in the shell's local state.\n\nEdges. An unknown project id is not a routing failure — `/projects/xyz/board` matches the pattern perfectly — it is a server-state miss: the project query returns not-found, and the project layout renders a 'project not found' state inside the app shell, keeping the sidebar usable. The routing 404 (catch-all) is reserved for URLs no pattern claims. Login preserves deep links: hitting `/projects/p1/docs/d4` while signed out redirects to `/login` carrying the intended destination, and completing login navigates there, not to the dashboard — support's links must work even for users who get logged out on the way.",
    },
    {
      id: 'routing-review',
      kind: 'written',
      completionMode: 'submitted-with-reference-review',
      title: 'Explain the two halves of routing architecture',
      prompt:
        "A teammate's app keeps the current screen in a top-level useState, renders a copy of the sidebar-and-header chrome inside every page component, and routes with a chain of if statements checking exact strings. It works in the demo. In your own words, review the architecture. Explain: what breaks when the location lives only in component state and what makes the URL a different kind of state, why per-page chrome resets its own state on every navigation and the inversion that fixes it, what pattern matching with params adds over exact-string comparison and why route order matters once patterns exist, and one piece of state you would deliberately keep out of the URL. Use a short example of your own.",
      estimatedMinutes: 12,
      referenceAnswer:
        "The useState location fails the moment anyone uses a browser like a browser. Refresh: the state is gone and the app resets to its default screen. Share: the link carries none of the location, so the recipient lands somewhere else — 'send me the link to what you're seeing' becomes impossible. Back button: the browser leaves the site instead of leaving the screen. The URL is state the browser co-owns — bookmarkable, restorable, wired into history — and keeping the location anywhere else means fighting every feature the address bar provides. Structurally it is lesson 36's situation: the browser's location is an external system, and the app synchronizes with it rather than replacing it.\n\nThe per-page chrome is a tree-position bug, not a reuse bug. A component is a recipe; state lives in instances; and an instance survives only while its position in the tree keeps the same component type. When navigation swaps PageA for PageB, everything inside the old page unmounts — including its copy of the chrome — and PageB mounts a brand-new chrome whose useState calls run fresh. My example: a search box in a header that each page rendered separately; every navigation blanked the search, and the 'fix' someone shipped moved the text into a global store, treating an architecture problem as a state problem. The real fix is the inversion: one layout instance owns the chrome and exposes a children slot, navigation swaps only the slot's content, and the chrome's state survives because its instance does. The rule generalizes into nested layouts: whatever must survive a navigation lives at or above the layout that persists across it.\n\nExact-string routing cannot express entities. The if-chain needs a line per project, per document — which is to say it cannot be written. Patterns with params ('/projects/:projectId') match by shape and capture the varying segment, turning one declaration into every project's route and handing the screen its data as params, which then serve as the single source for what to load — no separate selectedProject state to drift out of sync with the address bar. Order arrives as a cost the moment patterns exist: patterns overlap, so the table is tried top to bottom and first match wins, meaning '/projects/new' must precede '/projects/:projectId' or 'new' is captured as an id, and the catch-all not-found sits last to claim only what nothing else did.\n\nDeliberately out of the URL: the sidebar's collapsed state — and its whole category, session-local UI posture. The test is who needs it back later: a shared link must reproduce which screen, which entity, which view-defining filters, because the recipient needs those; nobody needs the sender's collapsed sidebar, half-typed draft, or open dropdown, and encoding them makes links brittle and history noisy. State the browser should restore goes in the URL; state only this session cares about stays in components.",
      rubric: [
        {
          id: 'url-as-state',
          label: 'What the URL uniquely provides',
          description:
            'Names the concrete failures of state-only location (refresh, sharing, back button) and frames the URL as browser-co-owned state the app synchronizes with.',
        },
        {
          id: 'instance-persistence',
          label: 'Why per-page chrome resets',
          description:
            'Explains state living in instances and instances dying with tree position, then gives the layout inversion — one persistent layout with a content slot — as the structural fix.',
        },
        {
          id: 'patterns-and-order',
          label: 'Patterns, params, and order',
          description:
            'Shows what :param matching adds over string equality (entity routes, captured data as the single source), and why ordered matching with specific-before-param and a trailing catch-all becomes necessary.',
        },
        {
          id: 'url-restraint',
          label: 'Knowing what to keep out',
          description:
            'Applies the who-needs-it-back-later test to exclude session-local UI state from the URL with a concrete example.',
        },
      ],
    },
  ],
  approaches: {
    'route-matcher': [
      {
        name: 'Segment walk with param capture',
        code: `export function matchRoute(
  pattern: string,
  path: string,
): Record<string, string> | null {
  // Split on '/' and drop the empty pieces a leading or trailing slash
  // leaves behind, so '/users/' and '/users' describe the same segments.
  const patternSegments = pattern.split('/').filter((segment) => segment !== '')
  const pathSegments = path.split('/').filter((segment) => segment !== '')

  if (patternSegments.length !== pathSegments.length) {
    return null
  }

  const params: Record<string, string> = {}

  for (let index = 0; index < patternSegments.length; index += 1) {
    const patternSegment = patternSegments[index]
    const pathSegment = pathSegments[index]

    if (patternSegment.startsWith(':')) {
      params[patternSegment.slice(1)] = pathSegment
    } else if (patternSegment !== pathSegment) {
      return null
    }
  }

  return params
}`,
        explanation:
          "Filtering out empty segments after the split does three jobs in one line: it absorbs the leading slash both strings carry, normalizes trailing slashes so '/users/' and '/users' agree, and makes the root path '/' an empty segment list that matches itself with zero comparisons. The length check then rejects too-long and too-short paths before any walking, which is what makes the loop body simple: at each position, a segment is either a capture or a constraint. Captures never fail — whatever sits in a :param position becomes the value, dashes and all — while static segments are exact-equality constraints whose first failure ends the match. Returning the params object even when empty keeps the contract clean for callers: null means 'not this route', an object means 'this route, with this data', and a route table is just this function tried down an ordered list until something non-null comes back.",
        complexity:
          'O(n) time in the path length for the split and walk, O(p) space for p captured params. The guarantee that matters is the contract: a non-null result means every static segment matched and every param is filled.',
      },
    ],
    'lift-the-shell': [
      {
        name: 'One shell, pages as pure content',
        code: `import { useState } from 'react'

type Page = 'inbox' | 'archive'

type ShellProps = {
  onNavigate: (page: Page) => void
  children: React.ReactNode
}

// The app chrome: navigation plus a filter box that should survive
// navigation between pages.
function Shell({ onNavigate, children }: ShellProps) {
  const [filter, setFilter] = useState('')

  return (
    <div>
      <button onClick={() => onNavigate('inbox')}>inbox</button>
      <button onClick={() => onNavigate('archive')}>archive</button>
      <input
        aria-label="filter"
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
      />
      <p>filtering: {filter}</p>
      {children}
    </div>
  )
}

function InboxPage() {
  return <p>inbox: 2 unread</p>
}

function ArchivePage() {
  return <p>archive: 5 stored</p>
}

export function MailApp() {
  const [page, setPage] = useState<Page>('inbox')

  // One Shell instance wraps the app; navigation swaps only the content
  // inside it, so the chrome and its state survive every page change.
  return (
    <Shell onNavigate={setPage}>
      {page === 'inbox' ? <InboxPage /> : <ArchivePage />}
    </Shell>
  )
}`,
        explanation:
          "Shell's code is untouched — the bug was never in the shell, it was in where the shell stood. In the starter, the page swap happened above the shell, so React unmounted the whole page subtree, shell included, and every navigation ran useState('') again on a fresh instance. Inverted, the Shell element occupies the same position in MailApp's output on every render, so React keeps its instance and its filter alive, and the ternary now chooses only what fills the children slot. The pages shrink to pure content in the same move: they no longer need onNavigate or any knowledge of the chrome, which is the layout/content split every router's Outlet formalizes. The round-trip test pins the payoff — type, navigate away, navigate back, and the filter is still there, because the component that owns it never left the tree. The page content itself still unmounts and remounts on each swap, which is correct: content state belongs to content, chrome state to chrome, and the tree now says so.",
        complexity:
          'O(1) additional render work. The guarantee that matters is structural: the chrome and its state persist across every navigation, because no navigation can unmount a layout that contains it.',
      },
    ],
  },
}
