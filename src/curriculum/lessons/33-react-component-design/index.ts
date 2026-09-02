import Concept from './concept.mdx'

import type { Lesson } from '../../types'

export const lesson: Lesson = {
  slug: 'react-component-design',
  title: 'React Component Design',
  summary:
    'Design components with clear boundaries, accessible structure, and maintainable APIs.',
  track: 'frontend',
  order: 33,
  concept: Concept,
  problems: [
    {
      id: 'alert-kind-union',
      kind: 'react-code',
      completionMode: 'all-tests-pass',
      title: 'Rebuild the alert around a severity union',
      prompt:
        "This Alert is the one from the lesson: three optional boolean props, a hidden priority order, and contradictory calls that compile. Redesign its props API around a single `kind` prop typed `'success' | 'error' | 'warning'`, keep `message`, and render the severity's label, a colon and a space, then the message — `Error: disk is full`. Your component is rendered for real and the screen is checked. Example: rendering with `kind=\"error\"` and `message=\"disk is full\"` must put `Error: disk is full` on screen, with no priority ternary left to decide anything.",
      estimatedMinutes: 12,
      componentName: 'Alert',
      starter: `type AlertProps = {
  success?: boolean
  error?: boolean
  warning?: boolean
  message: string
}

// Replace the three booleans with one kind prop: 'success' | 'error' | 'warning'.
export function Alert({ success, error, warning, message }: AlertProps) {
  const label = success ? 'Success' : error ? 'Error' : warning ? 'Warning' : 'Notice'

  return (
    <p>
      {label}: {message}
    </p>
  )
}
`,
      tests: [
        {
          name: 'renders an error with its label',
          props: { kind: 'error', message: 'disk is full' },
          expect: [
            { type: 'text-present', text: 'Error: disk is full' },
            { type: 'text-absent', text: 'Success' },
          ],
        },
        {
          name: 'renders a success',
          props: { kind: 'success', message: 'profile saved' },
          expect: [{ type: 'text-present', text: 'Success: profile saved' }],
        },
        {
          name: 'renders a warning',
          props: { kind: 'warning', message: 'battery low' },
          expect: [
            { type: 'text-present', text: 'Warning: battery low' },
            { type: 'text-absent', text: 'Error' },
          ],
        },
        {
          name: 'keeps message text intact',
          props: { kind: 'success', message: '2 files uploaded' },
          expect: [{ type: 'text-present', text: 'Success: 2 files uploaded' }],
        },
        {
          name: 'handles punctuation in messages',
          props: { kind: 'warning', message: '12% battery, plug in' },
          expect: [
            { type: 'text-present', text: 'Warning: 12% battery, plug in' },
          ],
        },
      ],
    },
    {
      id: 'product-shelf-ownership',
      kind: 'react-code',
      completionMode: 'all-tests-pass',
      title: 'Split the shelf into an owner and a presentational row',
      prompt:
        "Build ProductShelf, a component that shows products and a running cart count. It receives `products`, an array of `{ name, priceCents }`. Render the count as `items in cart: N`, and for each product a line with `NAME at $PRICE` (price in dollars with two decimals, so 150 cents is $1.50) and a button labeled `add NAME`. Clicking a product's button adds it to the cart; the same product can be added more than once. Design it the lesson's way: ProductShelf owns the cart state, and a presentational ProductRow component in the same file renders one product from props and reports clicks through an `onAdd` callback. Your component is rendered for real and clicked. Example: with Apple at 150 cents, clicking `add Apple` twice puts `items in cart: 2` on screen.",
      estimatedMinutes: 18,
      componentName: 'ProductShelf',
      starter: `import { useState } from 'react'

type Product = { name: string; priceCents: number }

// ProductShelf owns the cart; add a presentational ProductRow that renders
// one product from props and reports clicks through an onAdd callback.
export function ProductShelf({ products }: { products: Product[] }) {
  const [cart, setCart] = useState<string[]>([])

  return (
    <div>
      <p>items in cart: {cart.length}</p>
    </div>
  )
}
`,
      tests: [
        {
          name: 'renders every product with its price',
          props: {
            products: [
              { name: 'Apple', priceCents: 150 },
              { name: 'Bread', priceCents: 325 },
            ],
          },
          expect: [
            { type: 'text-present', text: 'Apple at $1.50' },
            { type: 'text-present', text: 'Bread at $3.25' },
            { type: 'text-present', text: 'items in cart: 0' },
          ],
        },
        {
          name: 'adding a product raises the count',
          props: {
            products: [
              { name: 'Apple', priceCents: 150 },
              { name: 'Bread', priceCents: 325 },
            ],
          },
          steps: [{ action: 'click', text: 'add Apple' }],
          expect: [
            { type: 'text-present', text: 'items in cart: 1' },
            { type: 'text-absent', text: 'items in cart: 0' },
          ],
        },
        {
          name: 'different products accumulate',
          props: {
            products: [
              { name: 'Apple', priceCents: 150 },
              { name: 'Bread', priceCents: 325 },
            ],
          },
          steps: [
            { action: 'click', text: 'add Apple' },
            { action: 'click', text: 'add Bread' },
          ],
          expect: [{ type: 'text-present', text: 'items in cart: 2' }],
        },
        {
          name: 'the same product can be added twice',
          props: { products: [{ name: 'Apple', priceCents: 150 }] },
          steps: [
            { action: 'click', text: 'add Apple' },
            { action: 'click', text: 'add Apple' },
          ],
          expect: [{ type: 'text-present', text: 'items in cart: 2' }],
        },
        {
          name: 'an empty shelf still shows the cart',
          props: { products: [] },
          expect: [
            { type: 'text-present', text: 'items in cart: 0' },
            { type: 'text-absent', text: 'add' },
          ],
        },
      ],
    },
    {
      id: 'notification-system-design',
      kind: 'design',
      completionMode: 'submitted-with-rubric-review',
      title: 'Design the component API for a notification system',
      prompt:
        'Design the components for the in-app notification system described in the scenario, then defend your content-strategy decision.',
      estimatedMinutes: 25,
      scenario:
        'Your product needs in-app notifications: short messages that appear in a stack in a corner of the screen. Product requirements so far: notifications have a severity (success, error, warning, and marketing wants "announcement" next quarter); most show plain text, but two teams need custom content — one wants a progress bar inside the notification, the other wants a message with an undo button; each notification has a dismiss control; error notifications stay until dismissed while the rest auto-dismiss after a few seconds; several features in different parts of the app need to trigger notifications.',
      sections: [
        {
          id: 'components',
          type: 'entity-list',
          label: 'Components',
          prompt:
            'Name the components in the system and give each a one-line responsibility. Say which are presentational and which hold state.',
        },
        {
          id: 'props-api',
          type: 'short-answer',
          label: 'Props contract',
          prompt:
            'Write the props type of the single-notification component as TypeScript. Severity must not be modeled as boolean flags; say how a caller is stopped from claiming two severities, and how next quarter\'s "announcement" severity gets added.',
        },
        {
          id: 'state-owner',
          type: 'short-answer',
          label: 'State ownership',
          prompt:
            'Where does the list of active notifications live, given that features all over the app trigger them and the stack renders in one corner? Say who appends, who removes on dismiss and on auto-dismiss timeout, and what the notification component itself stores.',
        },
        {
          id: 'content-strategy',
          type: 'tradeoff',
          label: 'Content strategy',
          prompt:
            'Two teams need custom content (a progress bar, an undo button) inside otherwise-standard notifications. Choose how the notification component receives its content and justify the choice against both the plain-text majority and the two custom cases.',
          options: [
            'A message: string prop, plus a new prop for each custom need (progressPercent, undoLabel, onUndo)',
            'A children slot: the frame owns severity, dismiss, and timing; callers compose their own content',
            'Variant components: TextNotification, ProgressNotification, UndoNotification, each with its own props',
          ],
        },
      ],
      rubric: [
        {
          id: 'severity-union',
          label: 'Severity is a union',
          description:
            "Severity is one prop with a literal union type ('success' | 'error' | 'warning' | ...), so two severities cannot be claimed at once and the announcement severity is added by extending the union, not by adding a boolean.",
        },
        {
          id: 'single-owner',
          label: 'One owner for the stack',
          description:
            'The active-notification list lives in one owner near the root (state, context, or a small store), appended to by triggering features and removed by the owner on dismiss and timeout. The notification component itself holds no list state.',
        },
        {
          id: 'events-up',
          label: 'Events flow up',
          description:
            'Dismiss and undo are callbacks the owner passes down; the notification reports the event rather than removing itself, so the owner keeps the list truthful.',
        },
        {
          id: 'content-tradeoff',
          label: 'Content strategy argued from the cases',
          description:
            'The chosen content approach is justified against the plain-text majority and both custom cases, weighing prop growth against composition. The children-slot answer is the expected fit, but another choice argued honestly from the cases can earn credit.',
        },
        {
          id: 'lifetime-policy',
          label: 'Auto-dismiss policy has an owner',
          description:
            'The stay-until-dismissed rule for errors versus auto-dismiss for the rest is decided in one place, derived from severity, rather than re-implemented by each caller.',
        },
      ],
      referenceAnswer:
        "Components. Three parts cover the system. NotificationProvider (stateful) lives near the app root: it owns the array of active notifications, exposes a notify() function to the rest of the app, and removes entries on dismiss or timeout. NotificationStack (presentational) renders the array into the corner, one child per entry. Notification (presentational) renders one entry: severity styling, the content, and the dismiss button, reporting clicks through onDismiss.\n\nProps contract. type NotificationProps = { severity: 'success' | 'error' | 'warning'; onDismiss: () => void; children: ReactNode }. Severity is a single literal-union prop, so a caller cannot claim two severities — there is one slot, and the compiler rejects values outside the union. Next quarter's announcement severity is one union member and one entry in the label/style lookup, with no new prop and no priority order to maintain.\n\nState ownership. The list lives in the provider at the root, because triggering features are scattered across the app and the stack renders in one corner: the closest component that needs the whole list is above all of them. Features append by calling notify(); the provider removes entries when a notification's onDismiss fires and when its own timer for an entry expires. The auto-dismiss policy is the provider's job too, derived from severity — errors get no timer, everything else gets a few seconds — so no caller re-decides lifetime. The Notification component stores nothing: its severity, content, and callbacks all arrive as props, which is what keeps the provider's list the single source of truth.\n\nContent strategy. The children slot. The plain-text majority pays almost nothing — callers pass a string as children. The progress-bar and undo teams compose their content inside the standard frame without the shared component learning what a progress bar is, and the third custom need costs zero API changes. Growing a prop per custom case (progressPercent, onUndo) turns the shared component into a union of every team's internals and requires a release per need; variant components triple the surface while duplicating the frame, dismiss, and timing logic that should exist once. The frame owns what it must understand — severity, dismissal, timing — and understands nothing about content, which is composition over configuration exactly.",
    },
    {
      id: 'component-api-review',
      kind: 'written',
      completionMode: 'submitted-with-reference-review',
      title: 'Explain how you judge a component API',
      prompt:
        "A teammate's pull request adds a fourth boolean prop to a shared Card component — `compact`, `bordered`, `clickable`, and now `inlineActions` — plus a `dismissed` state inside the Card so it can hide itself. In your own words, review it. Explain: what accumulating boolean props does to a component's usable states and when the moment arrives to convert to a variant union, what is wrong with the Card owning its own dismissed state and who should, when you would push content through children instead of adding props, and one case where a boolean prop is genuinely the right call. Use a short example of your own.",
      estimatedMinutes: 12,
      referenceAnswer:
        "Each new boolean doubles the states a caller can express, and the meaningful states grow far slower than the expressible ones. Four booleans is sixteen combinations; if compact-plus-inlineActions renders badly and clickable-plus-bordered was never designed, the component now compiles calls its own author never intended, and it resolves the nonsense privately, with whatever precedence its internals happen to encode. The moment to convert is when the flags stop being independent — when documentation would need to say 'don't combine X with Y', that sentence is a union type wearing prose: a single variant prop with literal members ('compact' | 'comfortable', or a kind union) makes the invalid combinations unwritable rather than merely discouraged, and the next variant is a new member instead of a fifth flag.\n\nThe dismissed state inside Card splits one fact across two components. The parent rendered the card because its data said to; if the card hides itself privately, the parent still believes it is showing a card, and it cannot re-show it, count visible cards, or animate the removal, because the truth moved somewhere it cannot reach. Dismissal is an event, not a private decision: the card should take onDismiss and report the click, and the owner of whatever list or flag put the card on screen removes it. State lives in the closest component that needs to read it, and here that is the parent, not the card.\n\nChildren over props is the call when the component is being configured with content it does not need to understand. If inlineActions exists so callers can show their own buttons in the card's footer, the card has started absorbing its callers' layouts one prop at a time. A children or footer slot lets every caller compose its own actions with no API change and no shared release; the card keeps only the props it interprets — the variant that picks its styling, the callbacks it fires.\n\nA boolean earns its place when it answers a genuinely independent yes-or-no question that the component itself must act on. disabled is the classic: any card variant can be disabled, disabled combines meaningfully with everything, and no second flag competes with it. The test I use for the whole API: could a teammate misuse this component in a way that compiles? Every yes is a place where the props are describing the design instead of enforcing it.",
      rubric: [
        {
          id: 'boolean-explosion',
          label: 'Boolean props and usable states',
          description:
            'Explains that independent booleans multiply expressible states past the designed ones, with the conversion trigger being flags that are no longer independent, fixed by a literal-union variant prop that makes invalid combinations unwritable.',
        },
        {
          id: 'state-ownership',
          label: 'Who owns dismissed',
          description:
            "Identifies self-dismissal as splitting one fact across components, breaking the parent's ability to re-show, count, or coordinate; dismissal should be a callback event handled by the owner of what put the card on screen.",
        },
        {
          id: 'children-over-props',
          label: 'When children wins',
          description:
            'Distinguishes props the component interprets from content it merely displays, moving pass-through content to children or slots so callers compose without API growth.',
        },
        {
          id: 'honest-boolean',
          label: 'A defensible boolean',
          description:
            'Names a legitimately independent boolean such as disabled and says what makes it safe: it combines meaningfully with every variant and competes with no other flag.',
        },
      ],
    },
  ],
  approaches: {
    'alert-kind-union': [
      {
        name: 'One union prop and a label lookup',
        code: `type AlertProps = {
  kind: 'success' | 'error' | 'warning'
  message: string
}

// The union has one slot, so a caller cannot claim two severities, and the
// label becomes a lookup instead of a priority order.
const labels = {
  success: 'Success',
  error: 'Error',
  warning: 'Warning',
} as const

export function Alert({ kind, message }: AlertProps) {
  return (
    <p>
      {labels[kind]}: {message}
    </p>
  )
}`,
        explanation:
          "The redesign deletes more than it adds. Three optional booleans meant eight expressible combinations and a ternary chain quietly ranking them; one kind prop means exactly three expressible alerts, and the invalid calls from the lesson's opener stop compiling instead of rendering the wrong label. The labels object is typed as const so labels[kind] is a plain, exhaustive lookup: adding a severity later means one union member and one entry, and forgetting the entry is a compile error, the same growth story the discriminated unions of lesson 26 offered. Rendering is a single path with no conditionals, which is the visible sign the ambiguity is gone from the API rather than handled inside it.",
        complexity:
          'O(1) render work. The guarantee that matters is the contract: a caller cannot express an alert with zero or two severities.',
      },
    ],
    'product-shelf-ownership': [
      {
        name: 'Stateful owner, presentational row',
        code: `import { useState } from 'react'

type Product = { name: string; priceCents: number }

type ProductRowProps = {
  product: Product
  onAdd: (name: string) => void
}

// Presentational: everything it shows arrives as props, and the only thing
// it sends back is the event, through the callback the owner handed it.
function ProductRow({ product, onAdd }: ProductRowProps) {
  return (
    <li>
      {product.name} at \${(product.priceCents / 100).toFixed(2)}{' '}
      <button onClick={() => onAdd(product.name)}>add {product.name}</button>
    </li>
  )
}

export function ProductShelf({ products }: { products: Product[] }) {
  // The cart lives in the one component that needs to know its size.
  const [cart, setCart] = useState<string[]>([])

  return (
    <div>
      <p>items in cart: {cart.length}</p>
      <ul>
        {products.map((product) => (
          <ProductRow
            key={product.name}
            product={product}
            onAdd={(name) => setCart([...cart, name])}
          />
        ))}
      </ul>
    </div>
  )
}`,
        explanation:
          "The split follows the lesson's ownership rule rather than the visual layout. ProductShelf is the only component that needs the cart, so the cart's useState lives there and nowhere else; ProductRow gets a product to show and a callback to report with, which leaves it unable to touch state it does not own and trivially reusable anywhere a product needs rendering. The count is derived from cart.length in render, lesson 34's rule, so no add path can leave it stale. Two details carry the tests: the setter builds a new array with spread rather than pushing into the old one, since a mutated array compares as unchanged and skips the re-render, and each row's key is the product name so React tracks rows across renders.",
        complexity:
          'O(n) render work for n products, O(k) cart space for k additions. The guarantee that matters is ownership: one component can change the cart, and rows can only report events.',
      },
    ],
  },
}
