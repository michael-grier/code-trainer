import Concept from './concept.mdx'

import type { Lesson } from '../../types'

export const lesson: Lesson = {
  slug: 'props-state-and-derived-state',
  title: 'Props, State, and Derived State',
  summary: 'Separate source-of-truth state from values that can be derived during render.',
  track: 'frontend',
  order: 34,
  concept: Concept,
  problems: [
    {
      id: 'stored-vs-derived-trace',
      kind: 'trace',
      completionMode: 'structured-answer-correct',
      title: 'Predict where the stored copy drifts from the truth',
      prompt:
        'This plain TypeScript store keeps a stored matchCount next to the items and query it is computed from, exactly like the component in the lesson. setQuery keeps the copy in sync, removeItem does not, and report prints the stored copy next to a count derived fresh from the current items and query. Read the program without running it, predict the console output, and answer the questions.',
      estimatedMinutes: 10,
      code: `type Store = {
  items: string[]
  query: string
  matchCount: number
}

const store: Store = {
  items: ['apple', 'banana', 'cherry'],
  query: '',
  matchCount: 3,
}

function setQuery(nextQuery: string) {
  store.query = nextQuery
  store.matchCount = store.items.filter((item) =>
    item.includes(nextQuery),
  ).length
}

function removeItem(target: string) {
  store.items = store.items.filter((item) => item !== target)
}

function report() {
  const visible = store.items.filter((item) => item.includes(store.query))
  console.log(\`stored=\${store.matchCount} actual=\${visible.length}\`)
}

setQuery('an')
report()
removeItem('banana')
report()
setQuery('')
report()
`,
      questions: [
        {
          id: 'output-order',
          type: 'output-order',
          label: 'Which lines print, in order?',
          options: [
            'stored=0 actual=0',
            'stored=1 actual=0',
            'stored=1 actual=1',
            'stored=2 actual=2',
            'stored=3 actual=2',
            'stored=3 actual=3',
          ],
          expected: ['stored=1 actual=1', 'stored=1 actual=0', 'stored=2 actual=2'],
        },
        {
          id: 'why-disagree',
          type: 'multiple-choice',
          label: 'Why do stored and actual disagree in the second report?',
          options: [
            'removeItem changed items but never recomputed matchCount, so the stored copy still describes the old list',
            'report reads the store before removeItem finishes updating it',
            'filter returns a new array, so removeItem lost the connection to the original items',
            'matchCount was initialized to 3 and can only be lowered by removeItem',
          ],
          answer:
            'removeItem changed items but never recomputed matchCount, so the stored copy still describes the old list',
        },
        {
          id: 'why-agree-again',
          type: 'multiple-choice',
          label: 'Why do they agree again in the third report?',
          options: [
            "setQuery recomputes matchCount from the current items, so it repaired the copy as a side effect of the query change",
            'the empty query resets the store to its initial values',
            'removeItem finally applied its pending update to matchCount',
            'report writes actual back into matchCount after each print',
          ],
          answer:
            "setQuery recomputes matchCount from the current items, so it repaired the copy as a side effect of the query change",
        },
      ],
      explanation:
        "setQuery('an') updates both copies: query becomes 'an' and matchCount is recomputed over all three items, finding only banana, so the first report prints stored=1 actual=1 and everything looks healthy. removeItem('banana') then rewrites items to ['apple', 'cherry'] and touches nothing else. The derived count in report is computed fresh from that new list, so actual drops to 0, but matchCount is a stored copy that no code updated, so it still says 1. That second line, stored=1 actual=0, is stale derived state in its purest form: the wrong number comes from the update path that forgot the copy, not from any line that ran. The final setQuery('') happens to repair the copy, because setQuery recomputes matchCount from the current items, and the empty query matches both remaining items, so the last report prints stored=2 actual=2. That accidental repair is why this bug hides so well in real components: whichever update path syncs the copy makes the screen look right again, and the user only sees the lie in between.",
    },
    {
      id: 'fix-stale-remaining-count',
      kind: 'debug',
      completionMode: 'all-tests-pass',
      title: 'Fix the task board that miscounts remaining work',
      prompt:
        "runTaskBoard drives a small task-board state manager through a list of actions: 'add' appends an open task, 'toggle' flips a task between open and done, and 'read' records how many tasks are still open. It should return the recorded counts, but toggling a task never changes the count. Find the stored copy of a derivable fact and fix the bug by deriving the count at read time. Example: `runTaskBoard([{ type: 'add', title: 'a' }, { type: 'add', title: 'b' }, { type: 'toggle', title: 'a' }, { type: 'read' }])` should return `[1]`.",
      estimatedMinutes: 15,
      functionName: 'runTaskBoard',
      brokenCode: `type Task = { title: string; done: boolean }

type BoardAction =
  | { type: 'add'; title: string }
  | { type: 'toggle'; title: string }
  | { type: 'read' }

export function runTaskBoard(actions: BoardAction[]): number[] {
  const state = {
    tasks: [] as Task[],
    remainingCount: 0,
  }
  const readings: number[] = []

  for (const action of actions) {
    if (action.type === 'add') {
      state.tasks = [...state.tasks, { title: action.title, done: false }]
      state.remainingCount += 1
    } else if (action.type === 'toggle') {
      state.tasks = state.tasks.map((task) =>
        task.title === action.title ? { ...task, done: !task.done } : task,
      )
    } else {
      readings.push(state.remainingCount)
    }
  }

  return readings
}

console.log(
  runTaskBoard([
    { type: 'add', title: 'a' },
    { type: 'add', title: 'b' },
    { type: 'toggle', title: 'a' },
    { type: 'read' },
  ]),
)
`,
      bugHints: [
        'remainingCount is fully determined by tasks. Which update paths keep the copy in sync, and which forget it?',
        'The toggle branch updates tasks correctly. The bug is the line it is missing, not a line it has.',
        'Instead of patching the toggle branch, delete remainingCount and compute the open-task count where the read happens.',
      ],
      tests: [
        {
          name: 'counts freshly added tasks',
          args: [
            [
              { type: 'add', title: 'a' },
              { type: 'add', title: 'b' },
              { type: 'read' },
            ],
          ],
          expected: [2],
        },
        {
          name: 'completing a task lowers the count',
          args: [
            [
              { type: 'add', title: 'a' },
              { type: 'add', title: 'b' },
              { type: 'toggle', title: 'a' },
              { type: 'read' },
            ],
          ],
          expected: [1],
        },
        {
          name: 'reads between updates see the current truth',
          args: [
            [
              { type: 'add', title: 'a' },
              { type: 'read' },
              { type: 'toggle', title: 'a' },
              { type: 'read' },
              { type: 'add', title: 'b' },
              { type: 'read' },
            ],
          ],
          expected: [1, 0, 1],
        },
        {
          name: 'reopening a task raises the count again',
          args: [
            [
              { type: 'add', title: 'a' },
              { type: 'toggle', title: 'a' },
              { type: 'read' },
              { type: 'toggle', title: 'a' },
              { type: 'read' },
            ],
          ],
          expected: [0, 1],
        },
        {
          name: 'toggling a missing title changes nothing',
          args: [
            [
              { type: 'add', title: 'a' },
              { type: 'toggle', title: 'b' },
              { type: 'read' },
            ],
          ],
          expected: [1],
        },
        {
          name: 'an empty board has zero remaining',
          args: [[{ type: 'read' }]],
          expected: [0],
        },
      ],
    },
    {
      id: 'derive-visible-todos',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Implement a derived-state selector for visible todos',
      prompt:
        "Implement `deriveVisibleTodos`. It takes the source-of-truth state of a todo list and computes the derived view: `todos` is an array of `{ title, done }` records, `filter` is 'all', 'active', or 'completed', and `query` is search text. Return the titles of the todos that pass the filter ('active' keeps open todos, 'completed' keeps done todos, 'all' keeps everything) and whose title contains the query, compared case-insensitively. Keep the titles in the same order they appear in `todos`, and treat an empty query as matching every title. Example: `deriveVisibleTodos([{ title: 'Buy milk', done: false }, { title: 'Walk dog', done: true }, { title: 'Buy stamps', done: false }], 'active', 'buy')` returns `['Buy milk', 'Buy stamps']`.",
      estimatedMinutes: 15,
      functionName: 'deriveVisibleTodos',
      starter: `type Todo = { title: string; done: boolean }

type TodoFilter = 'all' | 'active' | 'completed'

export function deriveVisibleTodos(
  todos: Todo[],
  filter: TodoFilter,
  query: string,
): string[] {
  return []
}

console.log(
  deriveVisibleTodos(
    [
      { title: 'Buy milk', done: false },
      { title: 'Walk dog', done: true },
      { title: 'Buy stamps', done: false },
    ],
    'active',
    'buy',
  ),
)
`,
      tests: [
        {
          name: 'filters open todos matching the query',
          args: [
            [
              { title: 'Buy milk', done: false },
              { title: 'Walk dog', done: true },
              { title: 'Buy stamps', done: false },
            ],
            'active',
            'buy',
          ],
          expected: ['Buy milk', 'Buy stamps'],
        },
        {
          name: 'completed filter with an empty query keeps every done todo',
          args: [
            [
              { title: 'Buy milk', done: false },
              { title: 'Walk dog', done: true },
              { title: 'Buy stamps', done: false },
            ],
            'completed',
            '',
          ],
          expected: ['Walk dog'],
        },
        {
          name: 'matches the query regardless of letter case',
          args: [
            [
              { title: 'Buy milk', done: false },
              { title: 'Walk dog', done: true },
            ],
            'all',
            'MILK',
          ],
          expected: ['Buy milk'],
        },
        {
          name: 'preserves the original todo order, not alphabetical order',
          args: [
            [
              { title: 'zebra care', done: false },
              { title: 'aquarium cleaning', done: false },
              { title: 'mail run', done: false },
            ],
            'active',
            'a',
          ],
          expected: ['zebra care', 'aquarium cleaning', 'mail run'],
        },
        {
          name: 'returns an empty list when nothing matches',
          args: [
            [
              { title: 'Buy milk', done: false },
              { title: 'Walk dog', done: true },
            ],
            'active',
            'stamps',
          ],
          expected: [],
        },
        {
          name: 'handles an empty todo list',
          args: [[], 'all', 'anything'],
          expected: [],
        },
      ],
    },
    {
      id: 'store-vs-derive-review',
      kind: 'written',
      completionMode: 'submitted-with-reference-review',
      title: 'Explain the store-versus-derive rule',
      prompt:
        'A teammate asks how you decide whether a value belongs in useState or in a plain const in the component body. In your own words, explain: what makes a value source of truth versus derived, why storing a derived value in state creates a bug even when every current handler is correct, and why computing derived values during render is safe. Use a short example of your own, and say when you would consider caching a derivation instead.',
      estimatedMinutes: 12,
      referenceAnswer:
        "A value belongs in state only when it is source of truth: a fact the component learns from events and cannot recompute from anything else, like the text the user typed or the list of items after removals. Anything computable from props and existing state, like a filtered list, a count, or a formatted label, is derived, and it belongs in a plain const in the component body.\n\nStoring a derived value in state creates a second copy of a fact the component already knows, and every update path becomes responsible for keeping the copy in sync. The current handlers can all be correct and the bug still exists, because it lives in the paths that do not update the copy, including paths that have not been written yet. A search component that stores matchCount in state can update it faithfully when the query changes and still show a stale count the moment a remove handler changes the list without touching the copy.\n\nDeriving during render is safe because a render is just a call of the component function: React re-runs it on every state change, so a const computed from props and state is rebuilt from the current values every time and can never disagree with them. The recomputation is almost always too cheap to notice. Caching only becomes worth considering when a derivation is measurably expensive, thousands of items through heavy work per keystroke, and even then the move is to measure first and cache second, not to store the result in state.",
      rubric: [
        {
          id: 'source-of-truth-test',
          label: 'Source-of-truth test',
          description:
            'States the deciding question: can this value be computed from props and existing state? Only facts that cannot be recomputed belong in state.',
        },
        {
          id: 'sync-burden',
          label: 'Why the stored copy is a bug',
          description:
            'Explains that a stored derived value obligates every update path, present and future, to sync it, so the bug lives in the paths that skip the update, with a concrete stale example.',
        },
        {
          id: 'render-recompute',
          label: 'Why deriving in render is safe',
          description:
            'Explains that React re-runs the component function on every state change, so a value derived in the body is recomputed from current values and cannot go stale.',
        },
        {
          id: 'caching-judgment',
          label: 'When to cache',
          description:
            'Reserves caching for derivations with a measured, real cost instead of reaching for it by default.',
        },
      ],
    },
  ],
  approaches: {
    'fix-stale-remaining-count': [
      {
        name: 'Delete the copy, derive at read time',
        code: `type Task = { title: string; done: boolean }

type BoardAction =
  | { type: 'add'; title: string }
  | { type: 'toggle'; title: string }
  | { type: 'read' }

export function runTaskBoard(actions: BoardAction[]): number[] {
  // tasks is the only source of truth; the remaining count is derivable,
  // so the state no longer stores a copy of it.
  const state = { tasks: [] as Task[] }
  const readings: number[] = []

  for (const action of actions) {
    if (action.type === 'add') {
      state.tasks = [...state.tasks, { title: action.title, done: false }]
    } else if (action.type === 'toggle') {
      state.tasks = state.tasks.map((task) =>
        task.title === action.title ? { ...task, done: !task.done } : task,
      )
    } else {
      // Derive the count from the current tasks at the moment of the read,
      // so no update path can leave it out of date.
      readings.push(state.tasks.filter((task) => !task.done).length)
    }
  }

  return readings
}`,
        explanation:
          'The broken version keeps remainingCount as a stored copy of a fact that tasks already determines. The add branch syncs the copy and the toggle branch forgets to, which is exactly the stale-derived-state shape from the lesson: the bug is a missing line, not a wrong one. Patching the toggle branch with done-aware count math would fix today\'s tests and leave the trap armed for the next action anyone adds. Deleting remainingCount and filtering the open tasks at read time fixes every update path at once, because the count is rebuilt from the source of truth each time it is needed.',
        complexity:
          'O(a * t) time for a actions over up to t tasks, since toggles and reads each scan the task list; O(t) space.',
      },
    ],
    'derive-visible-todos': [
      {
        name: 'Filter by status, then by lowercased query',
        code: `type Todo = { title: string; done: boolean }

type TodoFilter = 'all' | 'active' | 'completed'

export function deriveVisibleTodos(
  todos: Todo[],
  filter: TodoFilter,
  query: string,
): string[] {
  // Lowercase the query once, outside the loop, so every title
  // comparison happens in a single letter case.
  const loweredQuery = query.toLowerCase()

  return todos
    .filter((todo) => {
      // 'all' keeps everything; the other two filters compare done directly.
      if (filter === 'active') return !todo.done
      if (filter === 'completed') return todo.done
      return true
    })
    .filter((todo) => todo.title.toLowerCase().includes(loweredQuery))
    .map((todo) => todo.title)
}`,
        explanation:
          "The selector is a pure function of the source-of-truth state, which is what makes it safe to run on every render: same todos, filter, and query always produce the same titles. Two details carry the tests. Lowercasing both sides makes the match case-insensitive, so 'MILK' finds 'Buy milk'; a plain includes on the raw strings fails that case. And because filter preserves array order, the result follows the original todo order with no sorting step, which the zebra-before-aquarium test checks directly. The empty query needs no special case, since every string includes the empty string.",
        complexity: 'O(n * m) time for n todos with titles of length up to m; O(n) space for the result.',
      },
    ],
  },
}
