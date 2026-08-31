import Concept from './concept.mdx'

import type { Lesson } from '../../types'

export const lesson: Lesson = {
  slug: 'javascript-runtime-fundamentals',
  title: 'JavaScript Runtime Fundamentals',
  summary:
    'Reason about values, references, coercion, execution context, and runtime behavior.',
  track: 'js-ts-core',
  order: 20,
  concept: Concept,
  problems: [
    {
      id: 'value-reference-trace',
      kind: 'trace',
      completionMode: 'structured-answer-correct',
      title: 'Predict what copies and what shares',
      prompt:
        'Read the program below without running it. A number is "copied" and changed, an object gains a second name, and a function mutates its parameter. Predict the console output and answer the questions.',
      estimatedMinutes: 10,
      code: `function rename(user: { name: string }, nextName: string) {
  user.name = nextName
  console.log(\`inside rename: \${user.name}\`)
}

let visits = 10
let visitsCopy = visits
visitsCopy += 5
console.log(\`visits is \${visits}\`)
console.log(\`visitsCopy is \${visitsCopy}\`)

const profile = { name: 'Ada' }
const alias = profile
rename(profile, 'Grace')

console.log(\`profile name is \${profile.name}\`)
console.log(\`alias name is \${alias.name}\`)
console.log(profile === alias)
`,
      questions: [
        {
          id: 'output-order',
          type: 'output-order',
          label: 'Which lines print, in order?',
          options: [
            'visits is 10',
            'visits is 15',
            'visitsCopy is 15',
            'inside rename: Grace',
            'profile name is Ada',
            'profile name is Grace',
            'alias name is Ada',
            'alias name is Grace',
            'true',
            'false',
          ],
          expected: [
            'visits is 10',
            'visitsCopy is 15',
            'inside rename: Grace',
            'profile name is Grace',
            'alias name is Grace',
            'true',
          ],
        },
        {
          id: 'why-alias-changed',
          type: 'multiple-choice',
          label:
            'rename was passed profile, never alias. Why does alias.name read "Grace" afterward?',
          options: [
            'profile, alias, and the user parameter all hold references to one object, so the mutation is visible through every name',
            'rename returned a new object that replaced alias',
            'const alias = profile copied the object, and rename updated both copies',
            'template literals re-read profile.name each time it is logged, refreshing alias too',
          ],
          answer:
            'profile, alias, and the user parameter all hold references to one object, so the mutation is visible through every name',
        },
        {
          id: 'why-visits-unchanged',
          type: 'multiple-choice',
          label: 'Why is visits still 10 after visitsCopy += 5?',
          options: [
            'assignment copies a primitive value, so visitsCopy is an independent number and changing it cannot reach visits',
            'let variables cannot be changed after another variable reads them',
            'visitsCopy += 5 creates a new variable that shadows the old visitsCopy',
            'numbers are references too, but += always allocates a fresh number for both variables',
          ],
          answer:
            'assignment copies a primitive value, so visitsCopy is an independent number and changing it cannot reach visits',
        },
      ],
      explanation:
        'The number and the object follow two different assignment rules. visits holds a primitive, so let visitsCopy = visits copied the value 10 into a second, independent variable; adding 5 changed only the copy, which is why the first two lines print 10 and 15. profile holds a reference, so const alias = profile copied the directions, not the object, and calling rename(profile, ...) assigned those same directions to the user parameter. That makes three names for one object. The mutation user.name = nextName runs while the rename frame is on the stack and prints "inside rename: Grace", and after the frame pops, both profile.name and alias.name read Grace because there was only ever one object to change. The final line prints true because === on objects compares identity, and profile and alias are the same object.',
    },
    {
      id: 'fix-discount-mutation',
      kind: 'debug',
      completionMode: 'all-tests-pass',
      title: 'Fix the preview that corrupts the cart',
      prompt:
        'previewDiscount should report the cart\'s original total alongside the total after a percentage discount, without changing the cart. It currently returns the same number for both, because its "working copy" of the prices is not a copy. Find the aliasing bug and make the preview leave the cart alone. Example: `previewDiscount({ prices: [40, 60] }, 25)` should return `{ original: 100, discounted: 75 }`.',
      estimatedMinutes: 15,
      functionName: 'previewDiscount',
      brokenCode: `type Cart = { prices: number[] }

export function previewDiscount(
  cart: Cart,
  percent: number,
): { original: number; discounted: number } {
  // Take a working copy of the cart so the caller's prices stay intact.
  const preview = cart

  for (let index = 0; index < preview.prices.length; index += 1) {
    preview.prices[index] = (preview.prices[index] * (100 - percent)) / 100
  }

  const discounted = preview.prices.reduce((sum, price) => sum + price, 0)
  const original = cart.prices.reduce((sum, price) => sum + price, 0)

  return { original, discounted }
}

console.log(previewDiscount({ prices: [40, 60] }, 25))
`,
      bugHints: [
        'How many price arrays exist after const preview = cart runs?',
        'The loop writes through preview.prices. Which array does cart.prices read from afterward?',
        'Array methods like map and slice build a brand-new array; assignment never does.',
      ],
      tests: [
        {
          name: 'reports the original total and the discounted total',
          args: [{ prices: [40, 60] }, 25],
          expected: { original: 100, discounted: 75 },
        },
        {
          name: 'handles a single price',
          args: [{ prices: [10] }, 50],
          expected: { original: 10, discounted: 5 },
        },
        {
          name: 'handles several prices with a small discount',
          args: [{ prices: [100, 200, 300] }, 10],
          expected: { original: 600, discounted: 540 },
        },
        {
          name: 'keeps the original visible under a full discount',
          args: [{ prices: [20, 20, 20] }, 100],
          expected: { original: 60, discounted: 0 },
        },
        {
          name: 'handles an empty cart',
          args: [{ prices: [] }, 30],
          expected: { original: 0, discounted: 0 },
        },
        {
          name: 'handles a zero discount',
          args: [{ prices: [80] }, 0],
          expected: { original: 80, discounted: 80 },
        },
      ],
    },
    {
      id: 'apply-settings-update',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Implement a pure settings updater',
      prompt:
        'Implement `applySettingsUpdate`. It receives saved settings and a partial update, and returns a new settings object with the update applied. Neither argument may be mutated. Fields present in the update replace the saved ones, except `notifications`: an update there merges into the saved notifications rather than replacing them, so keys the update leaves out keep their saved values. Example: `applySettingsUpdate({ theme: "light", fontSize: 14, notifications: { email: true, sms: false } }, { notifications: { sms: true } })` returns `{ theme: "light", fontSize: 14, notifications: { email: true, sms: true } }`.',
      estimatedMinutes: 18,
      functionName: 'applySettingsUpdate',
      starter: `type NotificationSettings = { email: boolean; sms: boolean }

type Settings = {
  theme: string
  fontSize: number
  notifications: NotificationSettings
}

type SettingsUpdate = {
  theme?: string
  fontSize?: number
  notifications?: Partial<NotificationSettings>
}

export function applySettingsUpdate(
  settings: Settings,
  update: SettingsUpdate,
): Settings {
  return settings
}

console.log(
  applySettingsUpdate(
    { theme: 'light', fontSize: 14, notifications: { email: true, sms: false } },
    { notifications: { sms: true } },
  ),
)
`,
      tests: [
        {
          name: 'applies a top-level field update',
          args: [
            {
              theme: 'light',
              fontSize: 14,
              notifications: { email: true, sms: false },
            },
            { theme: 'dark' },
          ],
          expected: {
            theme: 'dark',
            fontSize: 14,
            notifications: { email: true, sms: false },
          },
        },
        {
          name: 'merges a partial notifications update without dropping saved keys',
          args: [
            {
              theme: 'light',
              fontSize: 14,
              notifications: { email: true, sms: false },
            },
            { notifications: { sms: true } },
          ],
          expected: {
            theme: 'light',
            fontSize: 14,
            notifications: { email: true, sms: true },
          },
        },
        {
          name: 'returns the same values for an empty update',
          args: [
            {
              theme: 'dark',
              fontSize: 16,
              notifications: { email: false, sms: true },
            },
            {},
          ],
          expected: {
            theme: 'dark',
            fontSize: 16,
            notifications: { email: false, sms: true },
          },
        },
        {
          name: 'applies updates at both levels at once',
          args: [
            {
              theme: 'light',
              fontSize: 14,
              notifications: { email: true, sms: false },
            },
            { fontSize: 18, notifications: { email: false } },
          ],
          expected: {
            theme: 'light',
            fontSize: 18,
            notifications: { email: false, sms: false },
          },
        },
        {
          name: 'applies a full update covering every field',
          args: [
            {
              theme: 'light',
              fontSize: 14,
              notifications: { email: true, sms: false },
            },
            {
              theme: 'dark',
              fontSize: 20,
              notifications: { email: false, sms: true },
            },
          ],
          expected: {
            theme: 'dark',
            fontSize: 20,
            notifications: { email: false, sms: true },
          },
        },
        {
          name: 'merges a notifications update that names both keys',
          args: [
            {
              theme: 'dark',
              fontSize: 12,
              notifications: { email: false, sms: false },
            },
            { notifications: { email: true, sms: true } },
          ],
          expected: {
            theme: 'dark',
            fontSize: 12,
            notifications: { email: true, sms: true },
          },
        },
      ],
    },
    {
      id: 'values-vs-references-review',
      kind: 'written',
      completionMode: 'submitted-with-reference-review',
      title: 'Explain values versus references',
      prompt:
        'A teammate just lost an afternoon to a function that "copied" an object and still corrupted the caller\'s data. In your own words, explain: what assignment actually copies for primitives and for objects, why const did not protect the object, why passing an object into a function lets the function change the caller\'s data, and what an honest copy takes. Use a short example of your own.',
      estimatedMinutes: 12,
      referenceAnswer:
        "Assignment always copies what the variable holds. For a primitive like a number or string, the variable holds the value itself, so the copy is independent and changing one variable can never affect the other. For an object or array, the variable holds a reference, directions to the one object in memory, so assignment copies the directions and both variables now lead to the same object. `const copy = original` therefore creates a second name, not a second object.\n\nconst never protected the object because it constrains the variable, not the value. It forbids reassignment, pointing the name at something new, and says nothing about mutation, editing the object the name leads to. `const cart` still allows `cart.items = 3`.\n\nPassing an argument is an assignment into the function's stack frame. An object argument copies the reference into the parameter, so the parameter and the caller's variable lead to the same object, and any mutation through the parameter is a mutation of the caller's data. That is exactly how a function that looks self-contained corrupts state it was never meant to own.\n\nAn honest copy is an explicit new object: `{ ...original }` for objects, `slice` or `map` for arrays. These copy one level, and each property is itself copied by assignment, so nested objects are still shared. Copy every level you intend to change: `{ ...saved, notifications: { ...saved.notifications, sms: true } }` rebuilds both levels and leaves the original untouched.",
      rubric: [
        {
          id: 'copy-rule',
          label: 'What assignment copies',
          description:
            'States that assignment copies the value for primitives and the reference for objects, so object assignment creates a second name for one object.',
        },
        {
          id: 'const-and-mutation',
          label: 'Reassignment versus mutation',
          description:
            'Distinguishes reassignment from mutation and explains that const forbids only reassignment, so the object stays editable.',
        },
        {
          id: 'parameters-share',
          label: 'Function parameters share',
          description:
            'Explains that passing an object assigns the reference into the new stack frame, so mutating a parameter mutates the caller\'s object.',
        },
        {
          id: 'real-copies',
          label: 'Making a real copy',
          description:
            'Shows that spread or slice copies one level and that nested data needs each changed level rebuilt, with a concrete example.',
        },
      ],
    },
  ],
  approaches: {
    'fix-discount-mutation': [
      {
        name: 'Build the discounted prices as a new array',
        code: `type Cart = { prices: number[] }

export function previewDiscount(
  cart: Cart,
  percent: number,
): { original: number; discounted: number } {
  // map builds a brand-new array, so writing the discounted prices
  // here can never reach the caller's numbers.
  const discountedPrices = cart.prices.map(
    (price) => (price * (100 - percent)) / 100,
  )

  // cart.prices is untouched, so this total really is the original.
  const original = cart.prices.reduce((sum, price) => sum + price, 0)
  const discounted = discountedPrices.reduce((sum, price) => sum + price, 0)

  return { original, discounted }
}`,
        explanation:
          'The broken version wrote const preview = cart, which copies the reference, not the cart, so preview.prices and cart.prices were one array. The loop then overwrote the only copy of the prices, and by the time the function summed cart.prices for the original total, the originals were gone, which is why both numbers came out equal. Replacing the loop with map removes the aliasing entirely: the discounted values live in a fresh array, and the caller\'s cart is never written to. Copying with cart.prices.slice() before the loop would also work, but map says "new array derived from the old one" in a single step.',
        complexity: 'O(n) time over the prices, O(n) space for the new array.',
      },
    ],
    'apply-settings-update': [
      {
        name: 'Spread each level that changes',
        code: `type NotificationSettings = { email: boolean; sms: boolean }

type Settings = {
  theme: string
  fontSize: number
  notifications: NotificationSettings
}

type SettingsUpdate = {
  theme?: string
  fontSize?: number
  notifications?: Partial<NotificationSettings>
}

export function applySettingsUpdate(
  settings: Settings,
  update: SettingsUpdate,
): Settings {
  return {
    // Copy every saved top-level field into a brand-new object.
    ...settings,
    // Fields the update names win over the copies above.
    ...update,
    // The spread of update would replace notifications wholesale and
    // drop saved keys the update left out, so rebuild that level as
    // its own merged copy. Spreading undefined contributes nothing,
    // which handles updates with no notifications field.
    notifications: { ...settings.notifications, ...update.notifications },
  }
}`,
        explanation:
          'The two top-level spreads produce a new object where update fields override saved ones, and because the result is a fresh object, neither argument is written to. The subtlety is the nested level. A single { ...settings, ...update } would copy the update\'s notifications reference as-is: a partial update like { sms: true } would become the entire notifications object, silently dropping email, and the result would share that nested object with the update argument. Rebuilding notifications from both sources fixes the merge and the sharing at once. This is the shallow-copy rule from the lesson applied in reverse: spread copies one level, so every level where values change gets its own spread.',
        complexity:
          'O(1) for this fixed shape; the guarantee that matters is that both arguments are left unmutated.',
      },
    ],
  },
}
