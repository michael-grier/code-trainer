import Concept from './concept.mdx'

import type { Lesson } from '../../types'

export const lesson: Lesson = {
  slug: 'effects-and-synchronization',
  title: 'Effects and Synchronization',
  summary:
    'Use effects for external synchronization without creating stale or redundant state.',
  track: 'frontend',
  order: 36,
  concept: Concept,
  problems: [
    {
      id: 'effect-schedule-trace',
      kind: 'trace',
      completionMode: 'structured-answer-correct',
      title: 'Predict the connect and disconnect schedule',
      prompt:
        "This is the lesson's miniature of React's effect schedule: renderWithEffect logs the render, then re-runs the effect only when its one dependency changed, cleaning up the previous effect first. connect logs when it runs and returns a cleanup that logs when it runs. The program renders with news twice, then sports, then simulates unmount by calling the last cleanup. Read the program without running it, predict the console output, and answer the questions.",
      estimatedMinutes: 10,
      code: `function connect(channel: string) {
  console.log(\`connect \${channel}\`)
  return () => console.log(\`disconnect \${channel}\`)
}

let renderCount = 0
let activeChannel: string | null = null
let activeCleanup: (() => void) | null = null

function renderWithEffect(channel: string) {
  renderCount += 1
  console.log(\`render \${renderCount}: \${channel}\`)

  // After a render commits, React compares the deps to last time and only
  // then re-runs the effect, cleaning up the previous one first.
  if (activeChannel !== channel) {
    if (activeCleanup !== null) {
      activeCleanup()
    }
    activeCleanup = connect(channel)
    activeChannel = channel
  }
}

renderWithEffect('news')
renderWithEffect('news')
renderWithEffect('sports')
activeCleanup?.()
`,
      questions: [
        {
          id: 'output-order',
          type: 'output-order',
          label: 'Which lines print, in order?',
          options: [
            'render 1: news',
            'connect news',
            'render 2: news',
            'render 3: sports',
            'disconnect news',
            'connect sports',
            'disconnect sports',
            'render 4: sports',
          ],
          expected: [
            'render 1: news',
            'connect news',
            'render 2: news',
            'render 3: sports',
            'disconnect news',
            'connect sports',
            'disconnect sports',
          ],
        },
        {
          id: 'skipped-effect',
          type: 'multiple-choice',
          label: 'Why does the second render log no connect at all?',
          options: [
            'The dependency was unchanged, so the effect is skipped entirely and the old connection stays live',
            'The effect only ever runs after the first render, like an empty dependency array',
            'connect detects the duplicate channel and returns without logging',
            'The cleanup from the first render cancelled the second connect before it could log',
          ],
          answer:
            'The dependency was unchanged, so the effect is skipped entirely and the old connection stays live',
        },
        {
          id: 'cleanup-order',
          type: 'multiple-choice',
          label: 'When the channel changes to sports, why does disconnect news print before connect sports?',
          options: [
            'The previous effect is cleaned up before the new effect runs, so there is never a moment with two live connections',
            'Cleanups always run at unmount, and switching channels unmounts the component',
            'console.log statements inside cleanups are flushed before other logs',
            'connect sports triggers disconnect news as part of subscribing',
          ],
          answer:
            'The previous effect is cleaned up before the new effect runs, so there is never a moment with two live connections',
        },
      ],
      explanation:
        "The first render logs render 1: news, and since there is no previous effect, connect news follows: effects run after their render, never during. The second render logs render 2: news and nothing else, which is the dependency comparison doing its job: the channel is unchanged, so the effect is skipped and the existing connection stays live. The third render changes the dependency, and the schedule runs in the order that keeps the world consistent: disconnect news first, then connect sports, so the old subscription is gone before the new one exists and no moment has two live connections. The final disconnect sports is the unmount half of the contract, the same cleanup function doing its job one last time. The three facts to carry into real effects: render first, effect after; unchanged deps skip the effect; and cleanup of the old effect always precedes the next run.",
    },
    {
      id: 'fix-stale-badge',
      kind: 'react-code',
      completionMode: 'all-tests-pass',
      title: 'Fix the badge by deleting its effect',
      prompt:
        'This is the name badge from the lesson opener: fullName lives in state and an effect keeps it "in sync", except its dependency list only names first, so editing the last name leaves the badge stale until an unrelated edit repairs it. Fix it the lesson\'s way: this value never needed an effect. Delete the effect and the fullName state entirely and derive the badge text in render from first and last. Keep both labeled inputs and the `badge: ` line as they are. Your component is rendered for real and typed into. Example: typing `Hopper` into the last-name input must immediately put `badge: Ada Hopper` on screen.',
      estimatedMinutes: 10,
      componentName: 'NameBadge',
      starter: `import { useEffect, useState } from 'react'

export function NameBadge() {
  const [first, setFirst] = useState('Ada')
  const [last, setLast] = useState('Lovelace')
  const [fullName, setFullName] = useState('Ada Lovelace')

  useEffect(() => {
    setFullName(\`\${first} \${last}\`)
  }, [first])

  return (
    <div>
      <input aria-label="first name" value={first} onChange={(e) => setFirst(e.target.value)} />
      <input aria-label="last name" value={last} onChange={(e) => setLast(e.target.value)} />
      <p>badge: {fullName}</p>
    </div>
  )
}
`,
      tests: [
        {
          name: 'shows the initial badge',
          props: {},
          expect: [{ type: 'text-present', text: 'badge: Ada Lovelace' }],
        },
        {
          name: 'changing the last name updates the badge',
          props: {},
          steps: [{ action: 'type', into: 'last name', value: 'Hopper' }],
          expect: [{ type: 'text-present', text: 'badge: Ada Hopper' }],
        },
        {
          name: 'changing the first name updates the badge',
          props: {},
          steps: [{ action: 'type', into: 'first name', value: 'Grace' }],
          expect: [{ type: 'text-present', text: 'badge: Grace Lovelace' }],
        },
        {
          name: 'changing both updates both parts',
          props: {},
          steps: [
            { action: 'type', into: 'first name', value: 'Grace' },
            { action: 'type', into: 'last name', value: 'Hopper' },
          ],
          expect: [{ type: 'text-present', text: 'badge: Grace Hopper' }],
        },
        {
          name: 'clearing the last name leaves only the first',
          props: {},
          steps: [{ action: 'type', into: 'last name', value: '' }],
          expect: [
            { type: 'text-present', text: 'badge: Ada' },
            { type: 'text-absent', text: 'Lovelace' },
          ],
        },
      ],
    },
    {
      id: 'channel-viewer-cleanup',
      kind: 'react-code',
      completionMode: 'all-tests-pass',
      title: 'Subscribe with a cleanup that keeps up with the channel',
      prompt:
        "ChannelViewer shows the last message from a message hub — a real external system, defined above the component. Its effect subscribes once, on mount, to whatever channel was selected then: the empty dependency array means switching channels changes the label but not the subscription, and nothing ever unsubscribes. Fix the effect so it synchronizes with the chosen channel: it must re-run when `channel` changes, and it must return the unsubscribe function `hub.subscribe` hands back, so the old channel is disconnected before the new one connects. Keep the buttons and both display lines as they are. Your component is rendered for real and clicked. Example: after clicking `sports` and then `ping news`, the screen must still say `last message: none yet`, because the news subscription is gone.",
      estimatedMinutes: 15,
      componentName: 'ChannelViewer',
      starter: `import { useEffect, useState } from 'react'

// A miniature external system: not React state, just listeners in a map.
const hub = {
  listeners: new Map<string, Set<(message: string) => void>>(),
  subscribe(channel: string, listener: (message: string) => void) {
    const existing = hub.listeners.get(channel) ?? new Set()
    existing.add(listener)
    hub.listeners.set(channel, existing)
    return () => {
      existing.delete(listener)
    }
  },
  emit(channel: string, message: string) {
    for (const listener of hub.listeners.get(channel) ?? []) {
      listener(message)
    }
  },
}

export function ChannelViewer() {
  const [channel, setChannel] = useState('news')
  const [lastMessage, setLastMessage] = useState('none yet')

  // Subscribe to the chosen channel so messages reach the screen.
  useEffect(() => {
    hub.subscribe(channel, (message) => setLastMessage(message))
  }, [])

  return (
    <div>
      <p>listening to {channel}</p>
      <p>last message: {lastMessage}</p>
      <button onClick={() => setChannel('news')}>news</button>
      <button onClick={() => setChannel('sports')}>sports</button>
      <button onClick={() => hub.emit('news', 'news update')}>ping news</button>
      <button onClick={() => hub.emit('sports', 'sports update')}>ping sports</button>
    </div>
  )
}
`,
      tests: [
        {
          name: 'starts listening to news',
          props: {},
          expect: [
            { type: 'text-present', text: 'listening to news' },
            { type: 'text-present', text: 'last message: none yet' },
          ],
        },
        {
          name: 'receives messages on the subscribed channel',
          props: {},
          steps: [{ action: 'click', text: 'ping news' }],
          expect: [{ type: 'text-present', text: 'last message: news update' }],
        },
        {
          name: 'ignores channels it never subscribed to',
          props: {},
          steps: [{ action: 'click', text: 'ping sports' }],
          expect: [{ type: 'text-present', text: 'last message: none yet' }],
        },
        {
          name: 'switching channels subscribes to the new one',
          props: {},
          steps: [
            { action: 'click', text: 'sports' },
            { action: 'click', text: 'ping sports' },
          ],
          expect: [{ type: 'text-present', text: 'last message: sports update' }],
        },
        {
          name: 'switching channels unsubscribes from the old one',
          props: {},
          steps: [
            { action: 'click', text: 'sports' },
            { action: 'click', text: 'ping news' },
          ],
          expect: [
            { type: 'text-present', text: 'last message: none yet' },
            { type: 'text-absent', text: 'news update' },
          ],
        },
        {
          name: 'switching back resubscribes',
          props: {},
          steps: [
            { action: 'click', text: 'sports' },
            { action: 'click', text: 'news' },
            { action: 'click', text: 'ping news' },
          ],
          expect: [{ type: 'text-present', text: 'last message: news update' }],
        },
      ],
    },
    {
      id: 'effects-review',
      kind: 'written',
      completionMode: 'submitted-with-reference-review',
      title: 'Explain what earns logic an effect',
      prompt:
        'A teammate\'s component has three effects: one computes `filteredItems` into state whenever `items` or `query` changes, one watches a `submitted` flag and posts the form when it flips to true, and one opens a websocket connection with an empty dependency array and no cleanup. In your own words, review all three. Explain: the test that decides whether logic belongs in an effect at all, where the first two pieces of logic should live instead and what each misplacement costs, what is wrong with the third effect\'s dependency array and missing cleanup, and what the dependency list actually declares. Use a short example of your own.',
      estimatedMinutes: 12,
      referenceAnswer:
        "The test for all three: is anything outside React involved? An effect exists to synchronize an external system — a server, a subscription, a timer, the document — with props and state. If the logic only reads React values and produces React values, an effect is the wrong home, and two of these three fail the test.\n\nThe filteredItems effect is derived state wearing effect clothing. Filtering items by query touches nothing external, so it belongs in render as a plain const: `const filteredItems = items.filter(...)`. The effect version costs a stored copy plus an extra render — React commits a screen with the stale list, runs the effect, sets state, renders again — and the copy goes stale the moment someone edits the dependency list wrong, which is the badge bug from this lesson. Deleting the state and the effect removes every version of that failure.\n\nThe submitted-flag effect is event logic that lost its event. Some handler set submitted to true; the knowledge of why lives in that handler, and the posting should happen there, in the submit handler itself. Routed through a flag and an effect, the logic now fires whenever the flag is true for any reason — a reset that forgets to clear it re-posts the form — and reading the code requires reconstructing a causal chain the handler stated directly. Effects respond to values changing; handlers respond to things happening. Posting a form is a thing happening.\n\nThe websocket effect is the one that genuinely earns the hook, and both of its details are wrong. The empty dependency array is only honest if the effect reads no changing values; if the connection depends on a room or user id, [] means the socket keeps synchronizing a value from the first render forever — the component displays one room while listening to another. And the missing cleanup is a leak with a delay: every mount opens a connection nothing closes, and remounts stack them, producing duplicate messages that appear far from the cause. The rule is symmetry: the effect returns the disconnect for the connect it performed, so React can close the old socket before opening the next and at unmount.\n\nWhich is what the dependency list actually is: not a performance dial, but a factual declaration of which values the effect reads, so React knows which renders must be followed by a re-synchronization. My own example: an effect that sets document.title to `${unread} unread` must list [unread] — not to run less, but because the title genuinely depends on it; omit it and the browser tab confidently displays a count from the past.",
      rubric: [
        {
          id: 'external-test',
          label: 'The external-system test',
          description:
            'States the deciding question — is anything outside React involved — and applies it to sort the three effects, keeping only the websocket as legitimate synchronization.',
        },
        {
          id: 'derive-not-effect',
          label: 'Derived state out of effects',
          description:
            'Moves the filtered list into render as a derived value, naming the costs of the effect version: a stored copy, an extra render with a stale screen, and staleness when the dependency list is wrong.',
        },
        {
          id: 'events-in-handlers',
          label: 'Event logic in handlers',
          description:
            'Moves the form post into the handler that knows why the state changed, explaining that flag-watching effects fire on the value rather than the event and invite re-fires.',
        },
        {
          id: 'deps-and-cleanup',
          label: 'Honest deps, symmetric cleanup',
          description:
            'Explains the dependency list as a declaration of what the effect reads rather than a frequency control, and requires the effect to return the undo of whatever it started.',
        },
      ],
    },
  ],
  approaches: {
    'fix-stale-badge': [
      {
        name: 'Delete the effect, derive in render',
        code: `import { useState } from 'react'

export function NameBadge() {
  const [first, setFirst] = useState('Ada')
  const [last, setLast] = useState('Lovelace')

  // Derived during render: recomputed from the current values every time,
  // with no effect, no third state, and no dependency list to forget.
  const fullName = \`\${first} \${last}\`

  return (
    <div>
      <input aria-label="first name" value={first} onChange={(e) => setFirst(e.target.value)} />
      <input aria-label="last name" value={last} onChange={(e) => setLast(e.target.value)} />
      <p>badge: {fullName}</p>
    </div>
  )
}
`,
        explanation:
          "The fix is a deletion, the same shape as lesson 34's: the effect, the third useState, and the import of useEffect all go, replaced by one const computed in render. The broken version failed the external-system test — nothing outside React was involved, so there was nothing to synchronize, and the effect was maintaining a stored copy of a derivable string. That design was fragile twice over: the [first] dependency list made the copy stale on last-name edits, and even the 'correct' [first, last] version would have cost an extra render per keystroke with a momentarily wrong screen committed between the two. Deriving in render closes every version of the bug at once, because a value recomputed from current state on every render has no update path to forget.",
        complexity:
          'O(1) render work per keystroke, one render instead of two. The guarantee that matters is that the badge cannot disagree with the inputs, because it is computed from them.',
      },
    ],
    'channel-viewer-cleanup': [
      {
        name: 'Honest deps, returned cleanup',
        code: `import { useEffect, useState } from 'react'

// A miniature external system: not React state, just listeners in a map.
const hub = {
  listeners: new Map<string, Set<(message: string) => void>>(),
  subscribe(channel: string, listener: (message: string) => void) {
    const existing = hub.listeners.get(channel) ?? new Set()
    existing.add(listener)
    hub.listeners.set(channel, existing)
    return () => {
      existing.delete(listener)
    }
  },
  emit(channel: string, message: string) {
    for (const listener of hub.listeners.get(channel) ?? []) {
      listener(message)
    }
  },
}

export function ChannelViewer() {
  const [channel, setChannel] = useState('news')
  const [lastMessage, setLastMessage] = useState('none yet')

  // Synchronize the subscription with the chosen channel: connect after
  // render, disconnect before the next connect and on unmount.
  useEffect(() => {
    return hub.subscribe(channel, (message) => setLastMessage(message))
  }, [channel])

  return (
    <div>
      <p>listening to {channel}</p>
      <p>last message: {lastMessage}</p>
      <button onClick={() => setChannel('news')}>news</button>
      <button onClick={() => setChannel('sports')}>sports</button>
      <button onClick={() => hub.emit('news', 'news update')}>ping news</button>
      <button onClick={() => hub.emit('sports', 'sports update')}>ping sports</button>
    </div>
  )
}
`,
        explanation:
          "Two edits, each fixing one half of the synchronization contract. Listing [channel] makes the dependency list state the truth — the effect reads channel — so switching channels re-runs it and the subscription follows the label instead of freezing on the mount-time value; the starter's [] was the component confidently displaying a channel it was not listening to. Returning hub.subscribe's result hands React the undo for exactly what the effect did, and the trace problem's schedule says when it fires: before the next run, so the news listener is removed before the sports one is added, and at unmount, so nothing leaks. The starter without it accumulated one listener per subscription forever, the leak whose symptom — messages from a channel you left — appears far from the effect that caused it. The one-line body is worth noticing: when the external API returns its own unsubscribe, the entire correct effect is `return subscribe(...)`.",
        complexity:
          'O(1) work per channel switch and per message. The guarantee that matters is the invariant the schedule enforces: at most one live subscription, always for the channel on screen.',
      },
    ],
  },
}
