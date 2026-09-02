import Concept from './concept.mdx'

import type { Lesson } from '../../types'

export const lesson: Lesson = {
  slug: 'hooks-and-custom-hooks',
  title: 'Hooks and Custom Hooks',
  summary:
    'Encapsulate reusable stateful behavior while preserving React rules and dependencies.',
  track: 'frontend',
  order: 35,
  concept: Concept,
  problems: [
    {
      id: 'hook-slot-trace',
      kind: 'trace',
      completionMode: 'structured-answer-correct',
      title: 'Predict where a skipped hook mispairs the slots',
      prompt:
        "This is the lesson's miniature of React's hook storage: one slot array per component, one cursor that resets each render, and hooks identified by nothing but call order. The first two renders call both hooks; between them, slot 1 is overwritten to simulate a state update. The third render skips the first hook call. Read the program without running it, predict the console output, and answer the questions.",
      estimatedMinutes: 10,
      code: `const hookValues: unknown[] = []
let cursor = 0

function useValue<T>(initial: T): T {
  if (cursor >= hookValues.length) {
    hookValues.push(initial)
  }
  const value = hookValues[cursor] as T
  cursor += 1
  return value
}

function render(skipFirst: boolean) {
  cursor = 0
  const lines: string[] = []

  if (!skipFirst) {
    const name = useValue('ada')
    lines.push(\`name=\${name}\`)
  }

  const theme = useValue('dark')
  lines.push(\`theme=\${theme}\`)

  console.log(lines.join(' '))
}

render(false)
hookValues[1] = 'light'
render(false)
render(true)
`,
      questions: [
        {
          id: 'output-order',
          type: 'output-order',
          label: 'Which lines print, in order?',
          options: [
            'name=ada theme=dark',
            'name=ada theme=light',
            'name=ada',
            'theme=ada',
            'theme=dark',
            'theme=light',
          ],
          expected: ['name=ada theme=dark', 'name=ada theme=light', 'theme=ada'],
        },
        {
          id: 'why-theme-ada',
          type: 'multiple-choice',
          label: "Why does the third render print theme=ada?",
          options: [
            'Skipping the first call left the cursor at 0, so the theme call read slot 0, which holds the name',
            "The array reset when a render used fewer hooks, so the theme fell back to the first value ever stored",
            "useValue('dark') always returns the oldest slot when the render is shorter than the array",
            'The overwrite of slot 1 between renders moved the name value into the theme slot',
          ],
          answer:
            'Skipping the first call left the cursor at 0, so the theme call read slot 0, which holds the name',
        },
        {
          id: 'real-react-rule',
          type: 'multiple-choice',
          label: 'What discipline makes real React components immune to this?',
          options: [
            'Calling every hook on every render, in the same order, at the top level, before any early return',
            'Giving each useState call a unique initial value so React can tell the slots apart',
            'Declaring hooks inside the JSX so React pairs them with elements instead of slots',
            'Wrapping conditional hooks in a try/catch so a missing slot falls back to the initial value',
          ],
          answer:
            'Calling every hook on every render, in the same order, at the top level, before any early return',
        },
      ],
      explanation:
        "The first render pushes 'ada' into slot 0 and 'dark' into slot 1 as the cursor walks, printing name=ada theme=dark. The line between renders overwrites slot 1 with 'light', simulating a theme update, and the second render walks the same two calls in the same order, so each call finds its own slot: name=ada theme=light. The third render is the interesting one. skipFirst makes the name call never happen, so the theme call is the first call of the render and reads whatever the cursor points at, which is slot 0, the name's slot. It prints theme=ada, one hook silently wearing another hook's state. Nothing crashed in the miniature, which is exactly why real React refuses to continue when a render's hook count changes: the alternative to that error is this silent mispairing. The discipline that prevents it is the rules of hooks, calling every hook on every render in the same order, which keeps each call permanently aligned with its slot.",
    },
    {
      id: 'fix-poll-early-return',
      kind: 'react-code',
      completionMode: 'all-tests-pass',
      title: 'Fix the poll that crashes after voting',
      prompt:
        "This is the poll from the lesson opener. It works until someone votes: then the early return skips the choice hook, the render calls fewer hooks than the one before it, and React throws instead of rendering the thanks message. Fix it so the vote flow works, keeping both pieces of state and all three buttons exactly as they are. The rule to apply: every hook call happens on every render, above any return; conditionals belong in what you render, not in which hooks you call. Your component is rendered for real and clicked. Example: clicking `spaces` and then `vote` must put `thanks for voting` on screen instead of crashing.",
      estimatedMinutes: 10,
      componentName: 'Poll',
      starter: `import { useState } from 'react'

export function Poll() {
  const [voted, setVoted] = useState(false)

  if (voted) {
    return <p>thanks for voting</p>
  }

  const [choice, setChoice] = useState('tabs')

  return (
    <div>
      <p>choice: {choice}</p>
      <button onClick={() => setChoice('tabs')}>tabs</button>
      <button onClick={() => setChoice('spaces')}>spaces</button>
      <button onClick={() => setVoted(true)}>vote</button>
    </div>
  )
}
`,
      tests: [
        {
          name: 'shows the default choice',
          props: {},
          expect: [{ type: 'text-present', text: 'choice: tabs' }],
        },
        {
          name: 'switches the choice',
          props: {},
          steps: [{ action: 'click', text: 'spaces' }],
          expect: [{ type: 'text-present', text: 'choice: spaces' }],
        },
        {
          name: 'voting shows the thanks screen',
          props: {},
          steps: [{ action: 'click', text: 'vote' }],
          expect: [
            { type: 'text-present', text: 'thanks for voting' },
            { type: 'text-absent', text: 'choice' },
          ],
        },
        {
          name: 'voting after choosing still works',
          props: {},
          steps: [
            { action: 'click', text: 'spaces' },
            { action: 'click', text: 'vote' },
          ],
          expect: [{ type: 'text-present', text: 'thanks for voting' }],
        },
        {
          name: 're-choosing tabs keeps tabs',
          props: {},
          steps: [
            { action: 'click', text: 'spaces' },
            { action: 'click', text: 'tabs' },
          ],
          expect: [{ type: 'text-present', text: 'choice: tabs' }],
        },
      ],
    },
    {
      id: 'faq-use-toggle',
      kind: 'react-code',
      completionMode: 'all-tests-pass',
      title: 'Give every FAQ item its own toggle',
      prompt:
        "FaqList renders a list of question-and-answer entries, but its one shared `open` state means every question opens and closes together — and clicking a second question closes the first. Rebuild it the lesson's way: extract a `useToggle(initial)` custom hook returning the flag and a toggle action, and give each entry its own FaqItem component that calls the hook once, so every question owns an independent open state. Each entry renders its question as a button; clicking it shows the answer, clicking again hides it. Remember why the hook cannot be called inside the `.map` callback: a hook in a loop breaks the call-order rule the trace problem demonstrated. Your component is rendered for real and clicked. Example: with two entries, clicking the first question must show only the first answer.",
      estimatedMinutes: 18,
      componentName: 'FaqList',
      starter: `import { useState } from 'react'

type FaqEntry = { question: string; answer: string }

// Extract a useToggle custom hook and give each item its own component,
// so every question owns an independent open state.
export function FaqList({ items }: { items: FaqEntry[] }) {
  const [open, setOpen] = useState(false)

  return (
    <ul>
      {items.map((entry) => (
        <li key={entry.question}>
          <button onClick={() => setOpen(!open)}>{entry.question}</button>
          {open && <p>{entry.answer}</p>}
        </li>
      ))}
    </ul>
  )
}
`,
      tests: [
        {
          name: 'starts with every answer hidden',
          props: {
            items: [
              {
                question: 'What is a render?',
                answer: 'One call of the component function.',
              },
              {
                question: 'What is state?',
                answer: 'Memory React keeps between renders.',
              },
            ],
          },
          expect: [
            { type: 'text-present', text: 'What is a render?' },
            { type: 'text-present', text: 'What is state?' },
            { type: 'text-absent', text: 'One call of the component function.' },
            { type: 'text-absent', text: 'Memory React keeps between renders.' },
          ],
        },
        {
          name: 'opening one item leaves the other closed',
          props: {
            items: [
              {
                question: 'What is a render?',
                answer: 'One call of the component function.',
              },
              {
                question: 'What is state?',
                answer: 'Memory React keeps between renders.',
              },
            ],
          },
          steps: [{ action: 'click', text: 'What is a render?' }],
          expect: [
            { type: 'text-present', text: 'One call of the component function.' },
            { type: 'text-absent', text: 'Memory React keeps between renders.' },
          ],
        },
        {
          name: 'both items can be open at once',
          props: {
            items: [
              {
                question: 'What is a render?',
                answer: 'One call of the component function.',
              },
              {
                question: 'What is state?',
                answer: 'Memory React keeps between renders.',
              },
            ],
          },
          steps: [
            { action: 'click', text: 'What is a render?' },
            { action: 'click', text: 'What is state?' },
          ],
          expect: [
            { type: 'text-present', text: 'One call of the component function.' },
            { type: 'text-present', text: 'Memory React keeps between renders.' },
          ],
        },
        {
          name: 'a second click closes the item again',
          props: {
            items: [
              {
                question: 'What is a render?',
                answer: 'One call of the component function.',
              },
            ],
          },
          steps: [
            { action: 'click', text: 'What is a render?' },
            { action: 'click', text: 'What is a render?' },
          ],
          expect: [
            { type: 'text-absent', text: 'One call of the component function.' },
          ],
        },
        {
          name: 'opening the second item leaves the first closed',
          props: {
            items: [
              {
                question: 'What is a render?',
                answer: 'One call of the component function.',
              },
              {
                question: 'What is state?',
                answer: 'Memory React keeps between renders.',
              },
            ],
          },
          steps: [{ action: 'click', text: 'What is state?' }],
          expect: [
            { type: 'text-present', text: 'Memory React keeps between renders.' },
            { type: 'text-absent', text: 'One call of the component function.' },
          ],
        },
      ],
    },
    {
      id: 'custom-hooks-review',
      kind: 'written',
      completionMode: 'submitted-with-reference-review',
      title: 'Explain what a custom hook shares',
      prompt:
        'A teammate builds a `useCart()` custom hook wrapping useState, calls it in the header and in the checkout page, and files a bug: adding an item in one place does not show up in the other. In your own words, explain: what a custom hook actually packages and why the two calls cannot see each other, how React associates hook calls with stored state and why that forbids conditional or looped hook calls, what the actual fix for the shared cart is, and one way a custom hook API can prevent misuse. Use a short example of your own.',
      estimatedMinutes: 12,
      referenceAnswer:
        "The bug report assumes a custom hook is a container of state. It is a container of logic. useCart() is a plain function that happens to call useState, and a useState call always stores its value in the slots of whichever component is currently rendering. The header's call claims slots in the header; the checkout page's call claims slots in the checkout page. Same code, two independent states, by design — exactly as two components each calling useState(0) do not share a counter. The hook packaged the cart logic for reuse; it never promised one cart.\n\nWhy slots? React identifies hook calls by nothing but call order. Each component instance keeps a list; each render resets a cursor and walks the list as the hooks fire, so the first call reads slot 0, the second slot 1. That bookkeeping is the entire reason for the rules of hooks: a hook call inside an if, after an early return, or in a .map callback can change how many calls a render makes, and then every hook after the skipped one reads its neighbor's slot. React detects the count change and throws — 'Rendered fewer hooks than expected' — because the alternative is components silently reading each other's state, one slot off.\n\nThe fix for the cart is ownership, not hook machinery. If two distant components must read the same cart, the cart needs one owner above both — lifted state passed down as props at small scale, or a context or store at app scale (lesson 39's subject). A custom hook can still wrap the access so callers write useCart(), but the state the hook reads must live in the shared owner, not in a fresh useState per caller.\n\nOn API design: a hook, like a component, should expose intentions instead of raw machinery. If useCart returned its setter, any caller could overwrite the whole cart with anything; returning addItem and removeItem actions means every possible caller manipulation is one the logic anticipated. My own example: a useDisclosure hook that returns { open, close, toggle } rather than setOpen — the calendar widget that calls close() cannot accidentally hand the state a string, and when the hook later needs to run an animation on close, every call site already funnels through the one function that can do it.",
      rubric: [
        {
          id: 'logic-not-state',
          label: 'Hooks share logic, not state',
          description:
            'Explains that each call of a custom hook claims fresh state slots in the calling component, so two callers are independent by design rather than by bug.',
        },
        {
          id: 'slot-model',
          label: 'The call-order model',
          description:
            'Describes React pairing hook calls to per-component slots by call order, and derives the rules of hooks from it: conditional, looped, or early-return-skipped calls shift every later hook into the wrong slot.',
        },
        {
          id: 'sharing-fix',
          label: 'The real sharing fix',
          description:
            'Moves the shared cart to a single owner above both consumers (lifted state, context, or a store), possibly still wrapped in a hook, instead of expecting the hook to share.',
        },
        {
          id: 'api-design',
          label: 'Hook API prevents misuse',
          description:
            'Shows a hook exposing named actions rather than a raw setter, with a concrete example of what the narrower API prevents.',
        },
      ],
    },
  ],
  approaches: {
    'fix-poll-early-return': [
      {
        name: 'Hooks first, decisions after',
        code: `import { useState } from 'react'

export function Poll() {
  // Every hook runs on every render, in the same order, before any return.
  const [voted, setVoted] = useState(false)
  const [choice, setChoice] = useState('tabs')

  // The conditional moves below the hooks: render less, but never call less.
  if (voted) {
    return <p>thanks for voting</p>
  }

  return (
    <div>
      <p>choice: {choice}</p>
      <button onClick={() => setChoice('tabs')}>tabs</button>
      <button onClick={() => setChoice('spaces')}>spaces</button>
      <button onClick={() => setVoted(true)}>vote</button>
    </div>
  )
}`,
        explanation:
          "The fix moves one line. In the broken version, the render after the vote click takes the early return and calls one hook where the previous render called two, and React refuses to guess which slot the missing call would have claimed. With both useState calls above the conditional, every render makes the same two calls in the same order no matter what the state says, so voted stays paired with slot 0 and choice with slot 1 forever. What changed conceptually is where the condition acts: it now chooses between two JSX returns, which React is completely indifferent to, instead of choosing how many hooks run, which React cannot tolerate. The thanks render still does less work; it just never calls less.",
        complexity:
          'O(1) render work. The guarantee that matters is the pairing: every render calls the same hooks in the same order, so no state can migrate between slots.',
      },
    ],
    'faq-use-toggle': [
      {
        name: 'A hook for the logic, a component per item',
        code: `import { useState } from 'react'

// One reusable piece of stateful logic. Every component that calls it gets
// its own independent state slot.
function useToggle(initial: boolean): [boolean, () => void] {
  const [on, setOn] = useState(initial)
  const toggle = () => setOn((current) => !current)
  return [on, toggle]
}

type FaqEntry = { question: string; answer: string }

// One item per component, so each call of useToggle belongs to exactly one
// question. Calling the hook inside a loop in FaqList would break the
// one-call-order-per-component rule.
function FaqItem({ entry }: { entry: FaqEntry }) {
  const [open, toggle] = useToggle(false)

  return (
    <li>
      <button onClick={toggle}>{entry.question}</button>
      {open && <p>{entry.answer}</p>}
    </li>
  )
}

export function FaqList({ items }: { items: FaqEntry[] }) {
  return (
    <ul>
      {items.map((entry) => (
        <FaqItem key={entry.question} entry={entry} />
      ))}
    </ul>
  )
}`,
        explanation:
          "Two extractions solve the two halves of the problem. useToggle packages the flip logic once and exposes toggle rather than the raw setter, using the functional update form so a toggle never depends on a stale reading of the flag. FaqItem is the half the rules of hooks force: the toggle state must be per-question, but a hook cannot be called inside the .map callback, because a list that changes length would change the component's hook call count, the exact mispairing the trace problem showed. Giving each entry its own component dissolves the conflict — each FaqItem instance carries its own slot list, so each question's open flag is independent, which is precisely what the shared-state starter got wrong when opening one question opened them all. FaqList itself ends up stateless, a pure mapper from props to items, which is the lesson 33 shape falling out of the hook rules on their own.",
        complexity:
          'O(n) render work for n entries. The guarantee that matters is independence: each item owns one toggle slot, so no click can affect another item.',
      },
    ],
  },
}
