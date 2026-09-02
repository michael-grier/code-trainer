import Concept from './concept.mdx'

import type { Lesson } from '../../types'

export const lesson: Lesson = {
  slug: 'accessibility-and-keyboard-ux',
  title: 'Accessibility and Keyboard UX',
  summary:
    'Create interfaces that work with semantics, focus, keyboard navigation, and assistive tech.',
  track: 'frontend',
  order: 38,
  concept: Concept,
  problems: [
    {
      id: 'name-the-waitlist-form',
      kind: 'react-code',
      completionMode: 'all-tests-pass',
      title: 'Give the waitlist form its accessible names',
      prompt:
        "WaitlistForm works perfectly with a mouse: two inputs with text sitting near them, a join button, and sensible messages. But nothing connects the visible words to the fields, so neither input has an accessible name — and this problem's grader interacts with your component the way assistive technology does: it locates each input by its accessible name and cannot type into a field it cannot identify. Give the email input the accessible name `email address` and the referral input `referral code`. Any real naming mechanism works — the harness resolves a wrapping `<label>`, an `htmlFor`/`id` association, or an `aria-label`, the way assistive tech does — and since both names have visible text sitting right there, the native-first move is to turn those paragraphs into labels. Keep the behavior exactly as it is: joining with a blank or whitespace email shows `enter your email`, otherwise `joined as EMAIL`; a nonempty referral shows `referral: CODE`. Example: typing into the field named `email address` and clicking `join waitlist` must put `joined as ada@example.com` on screen.",
      estimatedMinutes: 12,
      componentName: 'WaitlistForm',
      starter: `import { useState } from 'react'

// Works fine with a mouse. Give every control an accessible name, so the
// grader (and a screen reader) can find each input by its purpose.
export function WaitlistForm() {
  const [email, setEmail] = useState('')
  const [referral, setReferral] = useState('')
  const [status, setStatus] = useState<string | null>(null)

  const handleJoin = () => {
    setStatus(email.trim() === '' ? 'enter your email' : \`joined as \${email}\`)
  }

  return (
    <div>
      <p>email address</p>
      <input value={email} onChange={(event) => setEmail(event.target.value)} />
      <p>referral code</p>
      <input
        value={referral}
        onChange={(event) => setReferral(event.target.value)}
      />
      {referral !== '' && <p>referral: {referral}</p>}
      <button onClick={handleJoin}>join waitlist</button>
      {status !== null && <p role="alert">{status}</p>}
    </div>
  )
}
`,
      tests: [
        {
          name: 'a named email field can be filled and submitted',
          props: {},
          steps: [
            { action: 'type', into: 'email address', value: 'ada@example.com' },
            { action: 'click', text: 'join waitlist' },
          ],
          expect: [{ type: 'text-present', text: 'joined as ada@example.com' }],
        },
        {
          name: 'a named referral field can be filled',
          props: {},
          steps: [{ action: 'type', into: 'referral code', value: 'GRACE10' }],
          expect: [{ type: 'text-present', text: 'referral: GRACE10' }],
        },
        {
          name: 'joining without an email explains itself',
          props: {},
          steps: [{ action: 'click', text: 'join waitlist' }],
          expect: [
            { type: 'text-present', text: 'enter your email' },
            { type: 'text-absent', text: 'joined as' },
          ],
        },
        {
          name: 'a whitespace email is not an email',
          props: {},
          steps: [
            { action: 'type', into: 'email address', value: '   ' },
            { action: 'click', text: 'join waitlist' },
          ],
          expect: [{ type: 'text-present', text: 'enter your email' }],
        },
        {
          name: 'the referral line stays hidden until used',
          props: {},
          expect: [{ type: 'text-absent', text: 'referral:' }],
        },
      ],
    },
    {
      id: 'roving-focus-index',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Implement the roving-focus helper',
      prompt:
        "Composite widgets like menus and toolbars take one Tab stop for the whole group and move focus internally with the keyboard. Implement nextFocusIndex, the pure function at the heart of that pattern. Given the currently focused item's index, the pressed key, and the item count, return the next index: `ArrowDown` and `ArrowRight` move forward, wrapping from the last item to the first; `ArrowUp` and `ArrowLeft` move backward, wrapping from the first to the last; `Home` jumps to index 0 and `End` to the last item; any other key leaves the index unchanged. When the widget is empty (`itemCount` is 0) return -1 for every key. Example: `nextFocusIndex(3, 'ArrowDown', 4)` returns `0`, and `nextFocusIndex(0, 'ArrowUp', 4)` returns `3`.",
      estimatedMinutes: 12,
      functionName: 'nextFocusIndex',
      starter: `export function nextFocusIndex(
  activeIndex: number,
  key: string,
  itemCount: number,
): number {
  return activeIndex
}

console.log(nextFocusIndex(3, 'ArrowDown', 4))
`,
      tests: [
        {
          name: 'arrow down moves forward',
          args: [0, 'ArrowDown', 4],
          expected: 1,
        },
        {
          name: 'arrow down wraps from the last item',
          args: [3, 'ArrowDown', 4],
          expected: 0,
        },
        {
          name: 'arrow up wraps from the first item',
          args: [0, 'ArrowUp', 4],
          expected: 3,
        },
        {
          name: 'arrow left moves backward',
          args: [2, 'ArrowLeft', 4],
          expected: 1,
        },
        { name: 'home jumps to the start', args: [1, 'Home', 4], expected: 0 },
        { name: 'end jumps to the last item', args: [1, 'End', 4], expected: 3 },
        {
          name: 'unrelated keys change nothing',
          args: [2, 'a', 4],
          expected: 2,
        },
        {
          name: 'an empty widget has no focus target',
          args: [0, 'ArrowDown', 0],
          expected: -1,
        },
        {
          name: 'enter is not a movement key',
          args: [0, 'Enter', 4],
          expected: 0,
        },
        {
          name: 'a one-item widget wraps onto itself',
          args: [0, 'ArrowRight', 1],
          expected: 0,
        },
      ],
    },
    {
      id: 'dropdown-a11y-design',
      kind: 'design',
      completionMode: 'submitted-with-rubric-review',
      title: 'Design the accessibility contract for a dropdown menu',
      prompt:
        'Design the semantics, keyboard behavior, and focus management for the actions menu described in the scenario, then defend your focus-strategy decision.',
      estimatedMinutes: 25,
      scenario:
        'Your design system needs an actions menu: a trigger button labeled with an ellipsis icon that opens a small list of actions (rename, duplicate, delete) next to a document row. Designers want it to look nothing like a native select. It must be fully usable with a screen reader and with only a keyboard: opening, browsing the actions, activating one, and backing out. There may be fifty document rows on screen, each with its own menu.',
      sections: [
        {
          id: 'semantics',
          type: 'short-answer',
          label: 'Elements and names',
          prompt:
            'Choose the elements for the trigger and the menu items, and give the icon-only trigger its accessible name. Say what ARIA state on the trigger communicates open versus closed, and why the items are buttons rather than links or divs.',
        },
        {
          id: 'keyboard-map',
          type: 'short-answer',
          label: 'Keyboard map',
          prompt:
            'Write the full keyboard map: what Enter or Space does on the trigger, what ArrowDown, ArrowUp, Home, End, Enter, and Escape do inside the open menu, and what Tab does while the menu is open.',
        },
        {
          id: 'focus-strategy',
          type: 'tradeoff',
          label: 'Focus strategy inside the menu',
          prompt:
            'Choose how focus moves among the menu items and justify it, considering fifty menus on one page and the roving helper from this lesson.',
          options: [
            'Roving tabindex: the active item holds tabIndex 0 and real DOM focus, all others tabIndex -1, arrows move the focus',
            'aria-activedescendant: DOM focus stays on the container, and an attribute points at the visually highlighted item',
            'Natural tab order: every menu item is a Tab stop while the menu is open',
          ],
        },
        {
          id: 'focus-lifecycle',
          type: 'short-answer',
          label: 'Focus lifecycle',
          prompt:
            'Say where focus goes when the menu opens, when an action is chosen, when Escape closes it, and when the user clicks elsewhere — and why returning focus matters for the row-of-fifty case.',
        },
      ],
      rubric: [
        {
          id: 'native-first',
          label: 'Native elements first',
          description:
            'The trigger and items are real <button> elements, with the div-plus-role rebuild rejected; the icon-only trigger gets an accessible name (aria-label such as "document actions"), and aria-expanded communicates open state.',
        },
        {
          id: 'complete-keyboard-map',
          label: 'A complete keyboard map',
          description:
            'Enter/Space opens, arrows move with wrapping, Home/End jump, Enter activates the focused item, Escape closes, and Tab is handled deliberately (typically closing the menu and moving on) — no key left undefined.',
        },
        {
          id: 'one-tab-stop',
          label: 'One tab stop per widget',
          description:
            'The chosen focus strategy keeps each menu to a single tab stop with internal arrow navigation; either roving tabindex or aria-activedescendant earns credit when argued (roving is the expected default for real-focus benefits such as scroll-into-view).',
        },
        {
          id: 'focus-lifecycle',
          label: 'Focus never dangles',
          description:
            'Opening moves focus to the first item (or the trigger retains it with activedescendant), choosing an action and Escape both return focus to the trigger, and the destructive case is covered: when delete removes the row and its trigger, focus moves to a surviving neighbor (next or previous row, or the list) rather than falling to <body>.',
        },
        {
          id: 'announced-state',
          label: 'State is announced, not just drawn',
          description:
            'Open/closed and the active item are conveyed programmatically (aria-expanded, focus or activedescendant movement), not by styling alone.',
        },
      ],
      referenceAnswer:
        'Elements and names. The trigger is a real <button> with aria-label="document actions" — the ellipsis glyph is decoration, and voice-control and screen-reader users need a name — plus aria-expanded toggling "false"/"true" so the state is announced, and aria-haspopup="menu" to set expectations. The menu container takes role="menu"; each action is a <button role="menuitem">. Buttons rather than divs because every behavior this widget needs — focusability, activation, announcement — ships with the element, and rebuilding it on divs is how keyboard users get locked out. Buttons rather than links because rename, duplicate, and delete are actions, not navigation; a link promises a destination.\n\nKeyboard map. On the closed trigger: Enter or Space opens the menu and moves focus to the first item; ArrowDown does the same (a common convenience). Inside the open menu: ArrowDown/ArrowUp move to the next and previous item, wrapping at the ends; Home and End jump to the first and last item; Enter (and Space) activates the focused item, performs the action, and closes the menu; Escape closes without acting; Tab closes the menu and moves focus onward in the page, because a popup should not trap the tab order. Every key has a defined outcome, which is the difference between a keyboard map and keyboard luck.\n\nFocus strategy. Roving tabindex, with the lesson\'s nextFocusIndex as the movement logic: the active item has tabIndex 0 and holds real DOM focus, the rest are tabIndex -1, and arrow handlers move both the index and the focus. Real focus buys real browser behavior — the active item scrolls into view in a long menu, :focus styling works, and screen readers announce each item as focus lands on it — at the cost of managing tabIndex values, which the helper makes mechanical. aria-activedescendant is a legitimate alternative that keeps DOM focus on the container, but it trades away scroll-into-view and native announcements for bookkeeping of the same complexity. Natural tab order is wrong outright: fifty menus of three items would put up to 150 stops in the page tab order, and this lesson\'s one-tab-stop rule for composite widgets exists precisely to prevent that.\n\nFocus lifecycle. Opening moves focus to the first menu item. Activating rename or duplicate closes the menu and returns focus to the trigger button, so the user is standing exactly where they were, next to the row they were operating on — with fifty rows, dumping focus to <body> would force a blind user to Tab back through dozens of controls to regain their place. Delete is the exception that proves the rule: it destroys the row and the trigger with it, so returning to the trigger has no target, and focus must move to the next row\'s trigger instead (or the previous row\'s when the last row died, or the list container when the list is now empty). Escape returns focus to the trigger. A click elsewhere closes the menu without stealing focus from wherever the click landed. The invariant: the menu borrows focus and always hands it to something that still exists.',
    },
    {
      id: 'semantics-review',
      kind: 'written',
      completionMode: 'submitted-with-reference-review',
      title: 'Explain what the div button costs',
      prompt:
        "A teammate's PR builds a settings page where every button is a styled div with an onClick, labels sit next to inputs as plain paragraphs, and the stylesheet sets `outline: none` globally because the focus rings clashed with the design. It looks pixel-perfect and works in their demo. In your own words, review it. Explain: everything a real <button> provides that the divs silently dropped and who loses each piece, why adjacent text is not a label and what association does, what removing focus outlines does to a keyboard user, and the one rule you would apply before reaching for ARIA to patch any of it. Use a short example of your own.",
      estimatedMinutes: 12,
      referenceAnswer:
        "The demo works because the demo had a mouse. A real <button> carries four behaviors the styled divs dropped in one move: it sits in the tab order, so keyboard users can reach it; it activates on both Enter and Space, so reaching it means being able to press it; it exposes the button role, so a screen reader announces 'Save, button' instead of reading decorative text; and it participates in form semantics and the disabled state consistently. Each loss has a specific victim. The keyboard user Tabs straight past every control on the page — the settings cannot be operated at all without a pointer. The screen-reader user hears the label text but nothing announcing it as pressable, so the page reads as prose with no controls in it. Voice-control users fare no better: 'click Save' targets recognized controls, and a div is not one.\n\nThe paragraph-next-to-input pattern fails for the same underlying reason: proximity is a visual relationship, and assistive tech reads structure, not layout. Without htmlFor/id association, a wrapping label, or an aria-label, the input has no accessible name — a screen reader entering it announces 'edit text', full stop, and the user is left guessing which of nine settings fields they are in. Association also gives every user a bigger click target, since clicking an associated label focuses its field. The fix is mechanical: htmlFor on the label, id on the input, or wrap the input in the label.\n\nThe global outline: none is the quietest of the three and arguably the cruelest. The focus ring is the keyboard user's only indication of where they are standing; removing it without a replacement leaves them navigating a page with no cursor, no highlight, nothing. Designs are allowed to restyle focus — a brand-colored ring, an offset, :focus-visible so mouse clicks do not flash it — but never to delete it. If the rings clashed with the design, the task was to design a focus style, and that task was skipped, not solved.\n\nBefore ARIA patches any of this, the first rule of ARIA applies: do not use it where a native element already does the job. role='button' plus tabIndex plus a keydown handler for Enter plus another for Space is five pieces of hand-maintained code reimplementing <button>, and the first refactor that touches one of them breaks the widget silently. My own example: a 'copy link' div I reviewed that had grown role and tabIndex but only an Enter handler — Space, the key half of keyboard users press for buttons, scrolled the page instead. It became a <button> in a two-line diff, and every behavior arrived at once, tested by browser vendors instead of by us.",
      rubric: [
        {
          id: 'button-inventory',
          label: 'What <button> provides',
          description:
            'Enumerates the dropped behaviors — tab-order membership, Enter and Space activation, the announced role — and names who loses each (keyboard, screen-reader, voice-control users).',
        },
        {
          id: 'name-association',
          label: 'Labels are associations',
          description:
            'Explains that adjacent text gives no accessible name, what htmlFor/id or wrapping changes for announcement and click target, and the resulting unnamed-field experience.',
        },
        {
          id: 'focus-visibility',
          label: 'Focus must stay visible',
          description:
            'Identifies the focus outline as the keyboard user\'s only position indicator, permits restyling (including :focus-visible) but not removal.',
        },
        {
          id: 'aria-last',
          label: 'ARIA as last resort',
          description:
            'States the first rule of ARIA and shows why patching the div with role/tabIndex/handlers is fragile reimplementation compared to the native element, ideally with a concrete example.',
        },
      ],
    },
  ],
  approaches: {
    'name-the-waitlist-form': [
      {
        name: 'Real labels: the visible text becomes the name',
        code: `import { useState } from 'react'

export function WaitlistForm() {
  const [email, setEmail] = useState('')
  const [referral, setReferral] = useState('')
  const [status, setStatus] = useState<string | null>(null)

  const handleJoin = () => {
    setStatus(email.trim() === '' ? 'enter your email' : \`joined as \${email}\`)
  }

  return (
    <div>
      <label>
        email address
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <label>
        referral code
        <input
          value={referral}
          onChange={(event) => setReferral(event.target.value)}
        />
      </label>
      {referral !== '' && <p>referral: {referral}</p>}
      <button onClick={handleJoin}>join waitlist</button>
      {status !== null && <p role="alert">{status}</p>}
    </div>
  )
}`,
        explanation:
          "The behavior is untouched; every change is naming, and the fix is the native-first one: the loose paragraphs become real <label> elements wrapping their inputs, so the visible text is the accessible name with no ARIA involved. That one association does three jobs — screen readers announce 'email address' on entering the field, clicking the words focuses the input (a bigger target for everyone), and the harness can now resolve the field the same way AT does. An aria-label carrying the same text would also pass, and it is the right tool when a control has no visible text; with the text sitting right there, the label association is simpler and keeps one source of truth for the name. The starter's failure mode is worth remembering: the grader did not fail assertions, it could not find the inputs at all — which is precisely the experience of a screen-reader user handed a form of unnamed fields.",
        complexity:
          'O(1) render work. The guarantee that matters is the contract: every interactive control exposes a machine-readable name that matches its visible purpose.',
      },
    ],
    'roving-focus-index': [
      {
        name: 'Modular arithmetic per key group',
        code: `export function nextFocusIndex(
  activeIndex: number,
  key: string,
  itemCount: number,
): number {
  // An empty widget has nothing to focus, whatever the key.
  if (itemCount === 0) {
    return -1
  }

  if (key === 'ArrowDown' || key === 'ArrowRight') {
    return (activeIndex + 1) % itemCount
  }

  // Adding itemCount before the modulo keeps the backward wrap positive:
  // (0 - 1 + 4) % 4 is 3, where (0 - 1) % 4 would be -1.
  if (key === 'ArrowUp' || key === 'ArrowLeft') {
    return (activeIndex - 1 + itemCount) % itemCount
  }

  if (key === 'Home') {
    return 0
  }

  if (key === 'End') {
    return itemCount - 1
  }

  // Every other key is not a movement key; the position stands.
  return activeIndex
}`,
        explanation:
          "The empty-widget guard comes first so no arithmetic runs against a zero count, and -1 gives callers an unambiguous nothing-to-focus signal. Both arrow directions accept the vertical and horizontal key, which is how real menus behave and costs one extra comparison per branch. The forward wrap is a plain modulo; the backward wrap adds itemCount before taking the remainder, because JavaScript's % keeps the sign of its left operand and would hand back -1 at the front edge — the one-item test pins both wraps onto the same index. Everything that is not a movement key, including Enter, returns the index unchanged, which matters in the real widget: Enter's job is activation, handled elsewhere, and a movement function that also moved on Enter would yank focus at the moment of selection. The function is pure by design — index in, index out — so the component that owns the menu applies it in a keydown handler and moves real focus with the result.",
        complexity:
          'O(1) time and space. The guarantee that matters is totality: every key and every count, including zero and one, maps to a defined index.',
      },
    ],
  },
}
