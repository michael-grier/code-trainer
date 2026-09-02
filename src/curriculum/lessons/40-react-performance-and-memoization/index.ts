import Concept from './concept.mdx'

import type { Lesson } from '../../types'

export const lesson: Lesson = {
  slug: 'react-performance-and-memoization',
  title: 'React Performance and Memoization',
  summary:
    'Measure render costs and apply memoization only where it changes user-facing performance.',
  track: 'frontend',
  order: 40,
  concept: Concept,
  problems: [
    {
      id: 'shallow-identity-trace',
      kind: 'trace',
      completionMode: 'structured-answer-correct',
      title: 'Predict what shallow comparison accepts and rejects',
      prompt:
        "This is the lesson's miniature of the comparison memo performs: shallowEqual checks each prop with Object.is, and buildProps stands in for a component body, rebuilding its object and function on every call, exactly as a render rebuilds inline props. Two calls produce the props of two consecutive renders. Read the program without running it, predict the console output, and answer the questions.",
      estimatedMinutes: 10,
      code: `function shallowEqual(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
): boolean {
  const keys = Object.keys(a)
  if (keys.length !== Object.keys(b).length) {
    return false
  }
  return keys.every((key) => Object.is(a[key], b[key]))
}

function buildProps() {
  return {
    label: 'Report',
    filters: { region: 'west' },
    onExport: () => 'exported',
  }
}

const firstRender = buildProps()
const secondRender = buildProps()

console.log(\`same object: \${shallowEqual(firstRender, firstRender)}\`)
console.log(\`rebuilt props: \${shallowEqual(firstRender, secondRender)}\`)
console.log(\`rebuilt filters alone: \${firstRender.filters === secondRender.filters}\`)
console.log(\`primitive label alone: \${firstRender.label === secondRender.label}\`)
`,
      questions: [
        {
          id: 'output-order',
          type: 'output-order',
          label: 'Which lines print, in order?',
          options: [
            'same object: true',
            'same object: false',
            'rebuilt props: true',
            'rebuilt props: false',
            'rebuilt filters alone: false',
            'rebuilt filters alone: true',
            'primitive label alone: true',
            'primitive label alone: false',
          ],
          expected: [
            'same object: true',
            'rebuilt props: false',
            'rebuilt filters alone: false',
            'primitive label alone: true',
          ],
        },
        {
          id: 'why-rebuilt-fails',
          type: 'multiple-choice',
          label: 'Why does the rebuilt-props comparison fail when every field looks identical?',
          options: [
            'Each buildProps call creates a new filters object and a new function, and Object.is compares identity, not contents',
            'shallowEqual rejects any object containing a function, because functions cannot be compared',
            "The two objects have different key counts once the arrow function is included",
            'Object.is treats all objects as unequal, including an object compared against itself',
          ],
          answer:
            'Each buildProps call creates a new filters object and a new function, and Object.is compares identity, not contents',
        },
        {
          id: 'memo-consequence',
          type: 'multiple-choice',
          label: 'What does this mean for a memoized component?',
          options: [
            'A memoized child re-renders whenever its parent passes freshly built objects or functions, even when their contents are identical',
            'memo performs a deep comparison, so rebuilt objects with equal contents still skip the render',
            'memo only works for components whose props are all functions',
            'A memoized child never re-renders until it is unmounted',
          ],
          answer:
            'A memoized child re-renders whenever its parent passes freshly built objects or functions, even when their contents are identical',
        },
      ],
      explanation:
        "The first comparison passes trivially: an object against itself is the same value at every key, which is the situation memo enjoys when a parent passes stable, unchanged props. The second is the lesson. buildProps ran twice, and although the code inside was identical, each run created a fresh filters object and a fresh arrow function — Object.is asks 'same value?', not 'same contents?', so both of those keys fail and shallowEqual returns false. The last two lines isolate the split: the rebuilt filters objects are not ===, while the primitive label survives, because 'Report' is the same string value wherever it is written. Mapped back to React: a parent rendering <Report filters={{ region }} onExport={() => save()} /> rebuilds both values every render, so a memo around Report compares, finds them new, and skips nothing — memoized in name, re-rendering in fact. The stable-identity tools, useMemo and useCallback, exist precisely to make those two lines print true.",
    },
    {
      id: 'memoize-the-report',
      kind: 'react-code',
      completionMode: 'all-tests-pass',
      title: 'Stop the report from recomputing on every keystroke',
      prompt:
        "This is the opener's dashboard: the note input and the expensive report share a parent, so every keystroke re-renders the report, and its on-screen render counter proves it. Fix it with memo: wrap Report so React skips its render when its props are unchanged. Do not restructure the component or change any displayed text — the counter, powered by a ref, must read `computed 1 times` after any amount of typing, because the report's `region` prop never changes while the user types. Your component is rendered for real and its renders are counted. Example: typing three characters into the note must leave `west report computed 1 times` on screen alongside `note length: 3`.",
      estimatedMinutes: 12,
      componentName: 'Dashboard',
      starter: `import { useRef, useState } from 'react'

function Report({ region }: { region: string }) {
  // Render-count instrumentation, not a pattern: mutating a ref during
  // render breaks React's purity rules and would double-count under
  // StrictMode. This course's runner renders once, so the count is exact.
  const renders = useRef(0)
  renders.current += 1

  return (
    <p>
      {region} report computed {renders.current} times
    </p>
  )
}

export function Dashboard({ region }: { region: string }) {
  const [note, setNote] = useState('')

  return (
    <div>
      <input
        aria-label="note"
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />
      <p>note length: {note.length}</p>
      <Report region={region} />
    </div>
  )
}
`,
      tests: [
        {
          name: 'renders the report once on mount',
          props: { region: 'west' },
          expect: [
            { type: 'text-present', text: 'west report computed 1 times' },
          ],
        },
        {
          name: 'typing does not recompute the report',
          props: { region: 'west' },
          steps: [
            { action: 'type', into: 'note', value: 'a' },
            { action: 'type', into: 'note', value: 'ab' },
            { action: 'type', into: 'note', value: 'abc' },
          ],
          expect: [
            { type: 'text-present', text: 'west report computed 1 times' },
            { type: 'text-present', text: 'note length: 3' },
            { type: 'text-absent', text: 'computed 4 times' },
          ],
        },
        {
          name: 'a different region still renders its report',
          props: { region: 'east' },
          expect: [
            { type: 'text-present', text: 'east report computed 1 times' },
          ],
        },
        {
          name: 'the note keeps working while the report holds still',
          props: { region: 'west' },
          steps: [{ action: 'type', into: 'note', value: 'hello' }],
          expect: [
            { type: 'text-present', text: 'note length: 5' },
            { type: 'text-present', text: 'computed 1 times' },
          ],
        },
        {
          name: 'an empty note renders cleanly',
          props: { region: 'west' },
          expect: [{ type: 'text-present', text: 'note length: 0' }],
        },
      ],
    },
    {
      id: 'stabilize-the-callback',
      kind: 'react-code',
      completionMode: 'all-tests-pass',
      title: 'Fix the memoized button that still re-renders',
      prompt:
        "SaveButton is already wrapped in memo — and its counter climbs with every keystroke anyway. The parent rebuilds handleSave on each render, so the memoized child receives a brand-new function identity every time, and the shallow comparison fails on the onSave prop. Fix it with useCallback: give handleSave one stable identity across renders. The save logic already uses a functional update, so the callback needs nothing from any particular render and an empty dependency list is honest. Do not remove the memo or change any displayed text. Your component is rendered for real and its renders are counted. Example: typing three characters and clicking `save note` must leave `save button rendered 1 times` and `saved 1 times` on screen together.",
      estimatedMinutes: 12,
      componentName: 'NoteEditor',
      starter: `import { memo, useRef, useState } from 'react'

// Already memoized — and still re-rendering. The problem is the identity
// of the onSave prop, not the memo.
const SaveButton = memo(function SaveButton({ onSave }: { onSave: () => void }) {
  const renders = useRef(0)
  renders.current += 1

  return (
    <div>
      <button onClick={onSave}>save note</button>
      <p>save button rendered {renders.current} times</p>
    </div>
  )
})

export function NoteEditor() {
  const [note, setNote] = useState('')
  const [savedCount, setSavedCount] = useState(0)

  const handleSave = () => setSavedCount((current) => current + 1)

  return (
    <div>
      <input
        aria-label="note"
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />
      <p>saved {savedCount} times</p>
      <SaveButton onSave={handleSave} />
    </div>
  )
}
`,
      tests: [
        {
          name: 'renders the save button once on mount',
          props: {},
          expect: [
            { type: 'text-present', text: 'save button rendered 1 times' },
          ],
        },
        {
          name: 'typing does not re-render the memoized button',
          props: {},
          steps: [
            { action: 'type', into: 'note', value: 'a' },
            { action: 'type', into: 'note', value: 'ab' },
            { action: 'type', into: 'note', value: 'abc' },
          ],
          expect: [
            { type: 'text-present', text: 'save button rendered 1 times' },
            { type: 'text-absent', text: 'rendered 4 times' },
          ],
        },
        {
          name: 'saving still works through the stable callback',
          props: {},
          steps: [{ action: 'click', text: 'save note' }],
          expect: [{ type: 'text-present', text: 'saved 1 times' }],
        },
        {
          name: 'repeated saves accumulate',
          props: {},
          steps: [
            { action: 'click', text: 'save note' },
            { action: 'click', text: 'save note' },
          ],
          expect: [{ type: 'text-present', text: 'saved 2 times' }],
        },
        {
          name: 'saving does not re-render the button either',
          props: {},
          steps: [
            { action: 'type', into: 'note', value: 'draft' },
            { action: 'click', text: 'save note' },
          ],
          expect: [
            { type: 'text-present', text: 'saved 1 times' },
            { type: 'text-present', text: 'save button rendered 1 times' },
          ],
        },
      ],
    },
    {
      id: 'memoization-review',
      kind: 'written',
      completionMode: 'submitted-with-reference-review',
      title: 'Explain when memoization earns its keep',
      prompt:
        'A teammate opens a PR titled "perf pass": every component is wrapped in memo, every function in useCallback, every derived value in useMemo — no profile attached, and one memoized list is still re-rendering on every keystroke anyway. In your own words, review it. Explain: why blanket memoization has real costs even when it does not break anything, how a memoized component can still re-render on every parent render and how you would find the guilty prop, what the dependency lists of useMemo and useCallback actually declare and the bug a wrong one creates, and the process you would ask for instead of the blanket pass. Use a short example of your own.',
      estimatedMinutes: 12,
      referenceAnswer:
        "Blanket memoization is not free even when it is harmless. Every memo adds a props comparison to every render of that boundary; every useCallback and useMemo allocates and checks a dependency list; and every one of them adds a question the next reader must answer — what is this caching, and is its list still honest? Spent on components that render in microseconds, which is most components, those costs buy nothing perceptible. Worse, blanket application dilutes the signal: when everything is wrapped, nothing tells you which wrapper is load-bearing, and future edits treat them all as noise. The default from lesson 34 still stands — recomputation is usually the cheapest, safest option — and memoization is the targeted exception for measured hot spots.\n\nThe still-re-rendering list is the tell that the pass was mechanical. memo compares props shallowly, with Object.is per key: primitives compare by value, but objects, arrays, and functions compare by identity, and a parent that writes an inline object or arrow function rebuilds a fresh identity every render. One such prop and the comparison fails every time — memoized in name, re-rendering in fact. To find the guilty prop, I profile the list, then check its props one by one for values built during the parent's render: an inline style object, items.filter(...) called in the JSX, an inline onSelect arrow. Each is a new identity per render. The fix is to stabilize exactly those: useMemo for the derived array, useCallback for the handler — or to pass primitives instead, which need no machinery at all.\n\nThe dependency lists are declarations, not dials: they state which values the cached computation reads, so React knows when the cache is invalid. Omit a dependency and the cache keeps replaying a result computed from an old value — lesson 34's stale-copy bug rebuilt at the cache layer, and nastier, because it only appears when the omitted input changes alone. A useCallback whose body reads state with an empty list is the classic: the button works in the demo and saves stale data in production. Functional updates and honest lists are the discipline that keeps the caches truthful.\n\nWhat I would ask for instead: a profile first — React DevTools Profiler, record the slow interaction, find the components with real render cost. Memoize those boundaries, stabilize the specific identity-typed props they receive, and re-profile to confirm the render counts and timings actually moved. My example: a table that lagged on search input. The profile showed 300 row components re-rendering per keystroke; one memo on the row plus one useCallback on its onSelect took the interaction from 120ms to 8ms. The other forty components in that tree never got wrapped, because they never showed up in the profile — and that PR was five lines instead of five hundred.",
      rubric: [
        {
          id: 'costs-of-blanket',
          label: 'Blanket memoization has costs',
          description:
            'Names the comparison overhead, dependency-list maintenance, and readability cost, and defends cheap recomputation as the correct default for unmeasured components.',
        },
        {
          id: 'defeated-memo',
          label: 'Finding the defeated memo',
          description:
            'Explains shallow comparison by identity, identifies inline objects/arrays/functions as fresh identities per render, and gives a concrete method for locating the guilty prop.',
        },
        {
          id: 'deps-are-declarations',
          label: 'Dependency lists declare reads',
          description:
            'Frames useMemo/useCallback lists as statements of what the computation reads, with the stale-cache bug that a missing dependency creates.',
        },
        {
          id: 'measure-first-process',
          label: 'A measure-first process',
          description:
            'Prescribes profile → targeted memoization → re-profile, with a concrete example showing narrow fixes beating the blanket pass.',
        },
      ],
    },
  ],
  approaches: {
    'memoize-the-report': [
      {
        name: 'One memo at the expensive boundary',
        code: `import { memo, useRef, useState } from 'react'

// memo: skip the re-render entirely when the props shallow-compare equal.
const Report = memo(function Report({ region }: { region: string }) {
  // Render-count instrumentation, not a pattern: mutating a ref during
  // render breaks React's purity rules and would double-count under
  // StrictMode. This course's runner renders once, so the count is exact.
  const renders = useRef(0)
  renders.current += 1

  return (
    <p>
      {region} report computed {renders.current} times
    </p>
  )
})

export function Dashboard({ region }: { region: string }) {
  const [note, setNote] = useState('')

  return (
    <div>
      <input
        aria-label="note"
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />
      <p>note length: {note.length}</p>
      <Report region={region} />
    </div>
  )
}
`,
        explanation:
          "One wrapper, no other changes — and that is the point of the exercise. The dashboard's re-renders are correct behavior: the note is controlled state, so every keystroke renders the owner, and React's default walks into the children. memo installs a checkpoint at the one boundary where that walk is expensive: before re-rendering Report, React shallow-compares the new props to the old, and region is a string, so the comparison is by value and passes while the user types. The render counter proves the skip — it can only advance inside Report's body, and it stays at 1 through any amount of typing. Two things make this memo trustworthy where blanket ones are not: the props are primitives, so no inline object can silently defeat the comparison, and the component was demonstrably the expensive one, which is what earns the wrapper under the lesson's measure-first rule. When region does change, the comparison fails and the report recomputes, exactly as it should — memo is skip-when-same, never freeze. Two caveats keep the claim honest: memo only skips parent-triggered renders (state or context inside Report would still render it), and React documents the skip as an optimization it may not always apply, so nothing correct may depend on it.",
        complexity:
          'O(1) additional comparison per parent render, in exchange for skipping the child render when props are unchanged. The contract that matters: the report re-renders when its inputs change, and the skip is an optimization React applies, not a guarantee correctness may lean on.',
      },
    ],
    'stabilize-the-callback': [
      {
        name: 'useCallback with a functional update',
        code: `import { memo, useCallback, useRef, useState } from 'react'

const SaveButton = memo(function SaveButton({ onSave }: { onSave: () => void }) {
  const renders = useRef(0)
  renders.current += 1

  return (
    <div>
      <button onClick={onSave}>save note</button>
      <p>save button rendered {renders.current} times</p>
    </div>
  )
})

export function NoteEditor() {
  const [note, setNote] = useState('')
  const [savedCount, setSavedCount] = useState(0)

  // useCallback keeps one function identity across renders; the functional
  // update means it needs nothing from any particular render, so the empty
  // dependency list is honest.
  const handleSave = useCallback(() => {
    setSavedCount((current) => current + 1)
  }, [])

  return (
    <div>
      <input
        aria-label="note"
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />
      <p>saved {savedCount} times</p>
      <SaveButton onSave={handleSave} />
    </div>
  )
}
`,
        explanation:
          "The starter is the trace problem's lesson happening live: the memo was in place, but handleSave was an arrow function rebuilt in every render of NoteEditor, so the onSave prop failed Object.is every time and the memo skipped nothing. useCallback fixes the identity, not the function — React hands back the same function object on every render whose dependencies are unchanged, and with an empty list that means one identity for the component's lifetime. The empty list is only honest because of the functional update: the callback never reads savedCount from its closure, it asks React for the current value at call time, so there is no render whose values it depends on. Written as setSavedCount(savedCount + 1) instead, the empty list would be a lie — the classic stale-callback bug where every save writes 1. The last test pins the full contract: saving updates the count, and even that parent re-render leaves the button at rendered 1 times, because its one prop never changed identity.",
        complexity:
          'O(1) work per render for the identity check. The guarantee that matters is the pairing: the memo can only hold because every prop it compares is stable, and the callback stays correct because it reads state at call time.',
      },
    ],
  },
}
