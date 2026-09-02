import Concept from './concept.mdx'

import type { Lesson } from '../../types'

export const lesson: Lesson = {
  slug: 'forms-and-validation',
  title: 'Forms and Validation',
  summary:
    'Build form flows that validate user input and communicate errors accessibly.',
  track: 'frontend',
  order: 37,
  concept: Concept,
  problems: [
    {
      id: 'signup-validator',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Implement the signup validator',
      prompt:
        "Implement validateSignup, the pure validator this lesson's form derives its errors from. It takes `{ name, email }` and returns an errors object: `name` maps to `'name is required'` when the name is empty or only whitespace, and `email` maps to `'enter a valid email'` when the email fails lesson 30's rules — exactly one `@` with a nonempty name before it, and a domain after it containing a dot that is neither the domain's first nor last character. A field that passes contributes no key at all, so a fully valid input returns `{}`. No React anywhere: this is a plain function over data. Example: `validateSignup({ name: '', email: 'ada@example' })` returns `{ name: 'name is required', email: 'enter a valid email' }`, and `validateSignup({ name: 'Ada', email: 'ada@example.com' })` returns `{}`.",
      estimatedMinutes: 12,
      functionName: 'validateSignup',
      starter: `type SignupValues = { name: string; email: string }

type SignupErrors = { name?: string; email?: string }

export function validateSignup(values: SignupValues): SignupErrors {
  return {}
}

console.log(validateSignup({ name: '', email: 'ada@example' }))
`,
      tests: [
        {
          name: 'accepts a valid signup',
          args: [{ name: 'Ada', email: 'ada@example.com' }],
          expected: {},
        },
        {
          name: 'flags both fields on an empty form',
          args: [{ name: '', email: '' }],
          expected: { name: 'name is required', email: 'enter a valid email' },
        },
        {
          name: 'treats whitespace as a missing name',
          args: [{ name: '   ', email: 'ada@example.com' }],
          expected: { name: 'name is required' },
        },
        {
          name: 'rejects a domain without a dot',
          args: [{ name: 'Ada', email: 'ada@example' }],
          expected: { email: 'enter a valid email' },
        },
        {
          name: 'rejects an empty name before the @',
          args: [{ name: 'Ada', email: '@example.com' }],
          expected: { email: 'enter a valid email' },
        },
        {
          name: 'rejects a second @',
          args: [{ name: 'Ada', email: 'ada@@example.com' }],
          expected: { email: 'enter a valid email' },
        },
        {
          name: 'rejects a domain ending in a dot',
          args: [{ name: 'Ada', email: 'ada@example.' }],
          expected: { email: 'enter a valid email' },
        },
        {
          name: 'accepts subdomains alongside a missing name',
          args: [{ name: '', email: 'grace@mail.example.com' }],
          expected: { name: 'name is required' },
        },
      ],
    },
    {
      id: 'gate-the-signup-form',
      kind: 'react-code',
      completionMode: 'all-tests-pass',
      title: 'Stop the form from scolding and shrugging',
      prompt:
        "This is the opener's form: right validation, wrong timing, and a submit that ignores it — it scolds both fields on first paint and welcomes an empty name when clicked. Fix both decisions without touching the validator. Add per-field `touched` state, set when a field is first edited, and a `submitted` flag, set on the first submit attempt; show a field's error only when it is touched or a submit happened. Then make the submit consult the derived errors: on an invalid attempt stay on the form with every error visible, and only a valid submission may show `welcome, NAME`. Keep both labeled inputs, the error messages, and the `sign up` button as they are. Your form is rendered for real and typed into. Example: on first paint no error is visible, and typing `ada@` into the email field makes `enter a valid email` appear.",
      estimatedMinutes: 18,
      componentName: 'SignupForm',
      starter: `import { useState } from 'react'

type SignupValues = { name: string; email: string }
type SignupErrors = { name?: string; email?: string }

function validateSignup(values: SignupValues): SignupErrors {
  const errors: SignupErrors = {}

  if (values.name.trim() === '') {
    errors.name = 'name is required'
  }

  const at = values.email.indexOf('@')
  const domain = values.email.slice(at + 1)
  const dot = domain.indexOf('.')
  if (
    at <= 0 ||
    at !== values.email.lastIndexOf('@') ||
    dot <= 0 ||
    domain.endsWith('.')
  ) {
    errors.email = 'enter a valid email'
  }

  return errors
}

// The validation is right; the timing is not. Gate what the user sees and
// what submit accepts.
export function SignupForm() {
  const [values, setValues] = useState<SignupValues>({ name: '', email: '' })
  const [welcomeName, setWelcomeName] = useState<string | null>(null)

  const errors = validateSignup(values)

  if (welcomeName !== null) {
    return <p>welcome, {welcomeName}</p>
  }

  return (
    <div>
      <label>
        name
        <input
          aria-label="name"
          value={values.name}
          onChange={(event) => setValues({ ...values, name: event.target.value })}
        />
      </label>
      {errors.name && <p role="alert">{errors.name}</p>}
      <label>
        email
        <input
          aria-label="email"
          value={values.email}
          onChange={(event) => setValues({ ...values, email: event.target.value })}
        />
      </label>
      {errors.email && <p role="alert">{errors.email}</p>}
      <button onClick={() => setWelcomeName(values.name)}>sign up</button>
    </div>
  )
}
`,
      tests: [
        {
          name: 'starts without scolding the empty form',
          props: {},
          expect: [
            { type: 'text-absent', text: 'name is required' },
            { type: 'text-absent', text: 'enter a valid email' },
          ],
        },
        {
          name: 'a touched invalid email shows its error live',
          props: {},
          steps: [{ action: 'type', into: 'email', value: 'ada@' }],
          expect: [
            { type: 'text-present', text: 'enter a valid email' },
            { type: 'text-absent', text: 'name is required' },
          ],
        },
        {
          name: 'fixing the email clears the error',
          props: {},
          steps: [
            { action: 'type', into: 'email', value: 'ada@' },
            { action: 'type', into: 'email', value: 'ada@example.com' },
          ],
          expect: [{ type: 'text-absent', text: 'enter a valid email' }],
        },
        {
          name: 'submitting empty surfaces every error',
          props: {},
          steps: [{ action: 'click', text: 'sign up' }],
          expect: [
            { type: 'text-present', text: 'name is required' },
            { type: 'text-present', text: 'enter a valid email' },
            { type: 'text-absent', text: 'welcome' },
          ],
        },
        {
          name: 'a valid submission welcomes by name',
          props: {},
          steps: [
            { action: 'type', into: 'name', value: 'Ada' },
            { action: 'type', into: 'email', value: 'ada@example.com' },
            { action: 'click', text: 'sign up' },
          ],
          expect: [
            { type: 'text-present', text: 'welcome, Ada' },
            { type: 'text-absent', text: 'sign up' },
          ],
        },
        {
          name: 'an invalid submission stays on the form',
          props: {},
          steps: [
            { action: 'type', into: 'name', value: 'Ada' },
            { action: 'click', text: 'sign up' },
          ],
          expect: [
            { type: 'text-present', text: 'enter a valid email' },
            { type: 'text-absent', text: 'welcome' },
          ],
        },
      ],
    },
    {
      id: 'settings-form-design',
      kind: 'design',
      completionMode: 'submitted-with-rubric-review',
      title: 'Design the validation architecture for a settings form',
      prompt:
        'Design the form-state and validation architecture for the settings page described in the scenario, then defend your error-timing decision.',
      estimatedMinutes: 25,
      scenario:
        "Your app's settings page is one long form: display name (required), email (must be valid), a username (3-20 characters, checked against the server for availability), notification preferences (a group of toggles, no validation), and a danger zone where typing the project name confirms deletion. The form saves as a whole with one Save button. Product wants: errors that guide rather than scold, no lost work if the user navigates between settings sections, and the Save button always reachable by keyboard.",
      sections: [
        {
          id: 'state-shape',
          type: 'short-answer',
          label: 'State shape',
          prompt:
            'Write the state the form component holds, as TypeScript. Distinguish the values, the interaction tracking, and anything the server contributes, and say which pieces are derived rather than stored.',
        },
        {
          id: 'validation-placement',
          type: 'tradeoff',
          label: 'Where validation runs',
          prompt:
            'Choose where the synchronous validation rules run and justify it. Say separately how the server-checked username availability fits your choice, since it cannot be computed in render.',
          options: [
            'Derived in render: one pure validate(values) called every render, availability tracked as separate server state',
            'In change handlers: each onChange updates the values and a stored errors state together',
            'On submit only: validate once in the save handler and store the result for display',
          ],
        },
        {
          id: 'error-timing',
          type: 'short-answer',
          label: 'When errors show',
          prompt:
            'Define the visibility policy per field kind: the required name, the format-checked email, the server-checked username, and the deletion confirmation. Say what the first paint shows and what a failed Save shows.',
        },
        {
          id: 'save-behavior',
          type: 'short-answer',
          label: 'The Save button',
          prompt:
            'Decide whether Save is ever disabled, what an invalid click does, and how a keyboard-only user and a screen-reader user each learn why a save was rejected.',
        },
      ],
      rubric: [
        {
          id: 'derived-errors',
          label: 'Errors are derived',
          description:
            'Synchronous validation is a pure function of the values, called in render, with no stored errors state to go stale; only values and interaction flags (touched, submitted) are stored.',
        },
        {
          id: 'server-state-separated',
          label: 'Server checks modeled separately',
          description:
            'Username availability is recognized as asynchronous server state that cannot be derived in render — tracked with its own pending/known status rather than jammed into the synchronous validator.',
        },
        {
          id: 'timing-policy',
          label: 'A per-field timing policy',
          description:
            'Error visibility is gated on touched-or-submitted with sensible per-field variation, the first paint shows no errors, and a failed save reveals everything fixable.',
        },
        {
          id: 'reachable-save',
          label: 'Save stays alive',
          description:
            'The Save button is never disabled as the validity signal: an invalid click marks the form submitted, reveals the errors, and announces them (role="alert" or equivalent) so keyboard and screen-reader users get the same feedback path.',
        },
        {
          id: 'unsaved-work-preserved',
          label: 'Work survives navigation',
          description:
            'Form state lives in an owner that outlives section switches (lifted above the sections), so moving between settings sections does not unmount and discard edits.',
        },
      ],
      referenceAnswer:
        "State shape. The component stores the truth and the interaction history, nothing derivable: `values: { displayName: string; email: string; username: string; notifications: Record<string, boolean>; deleteConfirmation: string }`, `touched: Partial<Record<Field, boolean>>`, `submitted: boolean`, and for the server check `usernameStatus: { kind: 'unchecked' } | { kind: 'checking' } | { kind: 'available' } | { kind: 'taken' }` — a discriminated union, lesson 26 style. The errors object is not state: `const errors = validateSettings(values)` derives it in render. This state lives in the settings page component above the individual sections, so switching sections re-renders children but never unmounts the owner, and no edit is lost.\n\nWhere validation runs. Derived in render. The pure validator gives the same guarantees it gave the signup form: recomputed from current values on every keystroke, impossible to leave stale, and testable without React. Storing errors from change handlers rebuilds lesson 34's stale copy — the danger-zone field and the email would each need every handler to remember the sync. Submit-only validation starves the user of live feedback while they are in a field fixing it. The username availability check is the one thing render cannot compute: it is server state, fetched when the username field settles, tracked in usernameStatus with an explicit 'checking' state. The synchronous validator still owns the length rule (3-20 characters), so the server is only asked about plausible names, and the form treats 'taken' as one more visible error at display time.\n\nWhen errors show. First paint shows nothing: every field starts untouched and unsubmitted. The name and email show their errors once touched, live, clearing as the user fixes them. The username shows its format error once touched, and its availability result whenever one is known — including the 'checking' state, so silence is never ambiguous. The deletion confirmation never shows a red error for merely being empty, because empty is its safe state; the delete action simply stays inert until the typed name matches. A failed Save sets submitted and reveals every outstanding error at once, which is the user's fix-list.\n\nThe Save button. Never disabled. A disabled Save is a dead end that explains nothing — to a keyboard user it is a button that swallows Enter, to a screen-reader user it is a control with no story. Save stays live and focusable; an invalid click sets submitted, scrolls or moves focus to the first invalid field, and the error messages sit in role=\"alert\" containers so they are announced as they appear. A valid click saves, with the button's label reflecting progress. The rejected click is not a failure of the form; it is the feedback mechanism.",
    },
    {
      id: 'forms-review',
      kind: 'written',
      completionMode: 'submitted-with-reference-review',
      title: 'Explain the three decisions every form makes',
      prompt:
        "A teammate's checkout form stores `isCardValid` in state and updates it inside every onChange, shows all errors from the moment the page loads, and disables the Pay button until everything validates. It mostly works, and they want to know why you would restructure it. In your own words, explain: the three separate decisions a form makes (truth, knowledge, presentation-and-acceptance) and where each lives, why the stored `isCardValid` will eventually lie even though every current handler updates it, why errors-on-first-paint and a disabled Pay button are both feedback failures, and what the accessible wiring for a rejected submission looks like. Use a short example of your own.",
      estimatedMinutes: 12,
      referenceAnswer:
        "A form makes three decisions that deserve to live in three different places. The truth: what has the user typed? That is controlled-input state, values flowing from useState into each input's value and back through onChange — one owner, no DOM buffer holding anything React does not know. The knowledge: what is wrong right now? That is a derived value, a pure validate(values) called in render, recomputed on every keystroke. And the presentation and acceptance: which errors do we show, and do we take the submission? Those are the only places interaction state — touched, submitted — belongs. The checkout form collapses all three into one layer, which is why each of its behaviors is hard to change without breaking another.\n\nThe stored isCardValid is lesson 34's stale copy wearing payment clothing. Today every handler that changes the card number also updates the flag, so it looks fine. But the flag is derivable from the values, which means the truth already exists elsewhere, and the copy obligates every present and future code path to re-synchronize it: the autofill handler someone adds next quarter, the 'use saved card' button, the reset after a declined charge. The first path that changes values without touching the flag makes the form lie, and the bug will be reported as intermittent because it depends on which path ran last. Deriving card validity in render deletes the entire category: same validator, zero sync obligations.\n\nThe two UX choices fail the same way: they break the feedback loop at opposite ends. Errors on first paint scold a user who has done nothing, which trains them to ignore red text — the one thing error text cannot afford. The disabled Pay button is worse: the user's primary action becomes inert with no explanation, and the form withholds the very interaction that could produce one. Invert both. Show a field's error once the user has touched it or attempted to submit; keep Pay always clickable, and let an invalid click set submitted, reveal every outstanding error, and move focus to the first one. The rejected click is the feedback mechanism, not a failure to prevent.\n\nAccessibly, a rejected submission needs to reach users who cannot see the red. Each input carries a real label; each error message is programmatically tied to its field and lives in a role=\"alert\" region so it is announced when it appears; focus moves to the first invalid field so the keyboard user is standing where the work is. My own example: a promo-code field whose error only turned the border red — a screen-reader user hit Pay, heard nothing, and the order silently never went through. The fix was one role=\"alert\" and a focus call: same validation, finally communicated.",
      rubric: [
        {
          id: 'three-decisions',
          label: 'Truth, knowledge, presentation',
          description:
            'Separates controlled-input values, render-derived validation, and interaction-gated display/acceptance as three decisions with three homes, rather than one tangled layer.',
        },
        {
          id: 'stale-flag',
          label: 'Why the stored flag lies',
          description:
            'Identifies isCardValid as a stored copy of a derivable fact whose sync obligation falls on every future code path, with a concrete path (autofill, saved card, reset) that breaks it.',
        },
        {
          id: 'feedback-failures',
          label: 'Both UX choices break feedback',
          description:
            'Explains first-paint errors as scolding that trains users to ignore errors, and the disabled submit as removing the interaction that explains rejection, with the invalid-click-reveals-errors policy as the fix.',
        },
        {
          id: 'accessible-rejection',
          label: 'Accessible rejection path',
          description:
            'Describes labels, programmatically attached role="alert" errors, and focus management on a rejected submit, so non-visual users receive the same feedback.',
        },
      ],
    },
  ],
  approaches: {
    'signup-validator': [
      {
        name: 'One errors object, built rule by rule',
        code: `type SignupValues = { name: string; email: string }

type SignupErrors = { name?: string; email?: string }

export function validateSignup(values: SignupValues): SignupErrors {
  const errors: SignupErrors = {}

  if (values.name.trim() === '') {
    errors.name = 'name is required'
  }

  // One @ with a nonempty name before it, and a domain whose dot is neither
  // its first nor last character: the rules from lesson 30's parser.
  const at = values.email.indexOf('@')
  const domain = values.email.slice(at + 1)
  const dot = domain.indexOf('.')
  if (
    at <= 0 ||
    at !== values.email.lastIndexOf('@') ||
    dot <= 0 ||
    domain.endsWith('.')
  ) {
    errors.email = 'enter a valid email'
  }

  return errors
}`,
        explanation:
          "The function builds the errors object field by field and only adds a key when a rule fails, so validity is simply the absence of keys and a clean input returns {} — which is what lets the form ask 'is anything wrong' by checking the fields it knows. The name rule trims first, so whitespace cannot impersonate a name. The email arithmetic is lesson 30's: at <= 0 rejects a missing @ and an empty local name in one comparison, the lastIndexOf check rejects a second @, dot <= 0 rejects a missing and a leading dot together, and endsWith catches the trailing one. Everything here is deliberately React-free: the component derives from it in render, a unit test calls it with plain objects, and a server could run the identical rules, which is exactly the reuse lesson 31 promised from validators that are pure functions over data.",
        complexity:
          'O(n) time in the email length for the index scans, O(1) space beyond the domain slice.',
      },
    ],
    'gate-the-signup-form': [
      {
        name: 'Touched and submitted gate the same derived errors',
        code: `import { useState } from 'react'

type SignupValues = { name: string; email: string }
type SignupErrors = { name?: string; email?: string }

function validateSignup(values: SignupValues): SignupErrors {
  const errors: SignupErrors = {}

  if (values.name.trim() === '') {
    errors.name = 'name is required'
  }

  const at = values.email.indexOf('@')
  const domain = values.email.slice(at + 1)
  const dot = domain.indexOf('.')
  if (
    at <= 0 ||
    at !== values.email.lastIndexOf('@') ||
    dot <= 0 ||
    domain.endsWith('.')
  ) {
    errors.email = 'enter a valid email'
  }

  return errors
}

export function SignupForm() {
  const [values, setValues] = useState<SignupValues>({ name: '', email: '' })
  const [touched, setTouched] = useState<{ name?: boolean; email?: boolean }>({})
  const [submitted, setSubmitted] = useState(false)
  const [welcomeName, setWelcomeName] = useState<string | null>(null)

  // Derived on every render from the current values: never stored, never stale.
  const errors = validateSignup(values)

  const updateField = (field: keyof SignupValues, value: string) => {
    setValues({ ...values, [field]: value })
    setTouched({ ...touched, [field]: true })
  }

  // Showing is a separate decision from knowing: only fields the user has
  // touched, or a submit attempt, earn an error message.
  const visibleError = (field: keyof SignupErrors) =>
    touched[field] || submitted ? errors[field] : undefined

  const handleSubmit = () => {
    setSubmitted(true)
    if (errors.name === undefined && errors.email === undefined) {
      setWelcomeName(values.name)
    }
  }

  if (welcomeName !== null) {
    return <p>welcome, {welcomeName}</p>
  }

  return (
    <div>
      <label>
        name
        <input
          aria-label="name"
          value={values.name}
          onChange={(event) => updateField('name', event.target.value)}
        />
      </label>
      {visibleError('name') && <p role="alert">{errors.name}</p>}
      <label>
        email
        <input
          aria-label="email"
          value={values.email}
          onChange={(event) => updateField('email', event.target.value)}
        />
      </label>
      {visibleError('email') && <p role="alert">{errors.email}</p>}
      <button onClick={handleSubmit}>sign up</button>
    </div>
  )
}`,
        explanation:
          "The validator and the errors derivation are untouched from the starter; everything added is interaction state and gating. touched records which fields the user has engaged with, set inside the same handler that updates the value, so a field earns live feedback from its first keystroke — and because the errors are derived, fixing the email clears its message on the next render with no cleanup code. submitted covers the user who goes straight for the button: the first attempt flips it, every error becomes visible at once, and the attempt is rejected because handleSubmit now consults the derived errors before accepting. That one guard closes the opener's second bug, where the form validated and then welcomed an empty name anyway. The button stays enabled throughout, deliberately: the rejected click is what reveals the fix-list, which is the feedback a disabled button can never give.",
        complexity:
          'O(n) validation work per keystroke in the email length, one render per edit. The guarantee that matters is the separation: the errors cannot go stale, and nothing invalid can reach the welcome state.',
      },
    ],
  },
}
