import Concept from './concept.mdx'

import type { Lesson } from '../../types'

// Shared preamble for every type fixture below. The grader's fixed lib chain
// deliberately excludes DOM types, so the console used by each problem's
// sample log call must be declared inside the fixture.
const consoleDeclaration = `// The graded lib chain has no DOM types, so declare the console used by
// the sample log call.
declare const console: { log: (...values: unknown[]) => void }
`

export const lesson: Lesson = {
  slug: 'utility-types-and-mapped-types',
  title: 'Utility Types and Mapped Types',
  summary: 'Transform object shapes and API contracts with TypeScript type tools.',
  track: 'js-ts-core',
  order: 28,
  concept: Concept,
  problems: [
    {
      id: 'derive-settings-update',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Derive an update type that cannot drift',
      prompt:
        'EditorSettings describes an editor\'s saved preferences. Its update type is currently a placeholder. First, replace SettingsUpdate with a type derived from EditorSettings that accepts any subset of its fields, so a field added or renamed in EditorSettings updates this type automatically. Then implement applySettingsUpdate to return a new settings object with the update\'s fields applied over the current values. Your submission is compiled against hidden type tests as well as run: SettingsUpdate must accept an empty object and any subset of fields, reject keys EditorSettings lacks, and reject wrong value types. Example: `applySettingsUpdate({ theme: "light", fontSize: 14, autosave: true }, { fontSize: 16 })` returns `{ theme: "light", fontSize: 16, autosave: true }`.',
      estimatedMinutes: 12,
      functionName: 'applySettingsUpdate',
      starter: `export type EditorSettings = {
  theme: 'light' | 'dark'
  fontSize: number
  autosave: boolean
}

// Replace this alias with a type derived from EditorSettings.
export type SettingsUpdate = Record<string, unknown>

export function applySettingsUpdate(
  current: EditorSettings,
  update: SettingsUpdate,
): EditorSettings {
  return current
}

console.log(
  applySettingsUpdate(
    { theme: 'light', fontSize: 14, autosave: true },
    { fontSize: 16 },
  ),
)
`,
      typeFixture: `${consoleDeclaration}
const emptyUpdate: SettingsUpdate = {}
const singleField: SettingsUpdate = { fontSize: 16 }
const everyField: SettingsUpdate = { theme: 'dark', fontSize: 12, autosave: false }
void emptyUpdate
void singleField
void everyField

const applied: EditorSettings = applySettingsUpdate(
  { theme: 'light', fontSize: 14, autosave: true },
  { fontSize: 16 },
)
void applied

// @ts-expect-error the update type must reject keys EditorSettings does not have
const unknownKey: SettingsUpdate = { fontsize: 16 }
void unknownKey

// @ts-expect-error each update field must keep its original value type
const wrongValueType: SettingsUpdate = { fontSize: '16' }
void wrongValueType
`,
      tests: [
        {
          name: 'updates a single field',
          args: [
            { theme: 'light', fontSize: 14, autosave: true },
            { fontSize: 16 },
          ],
          expected: { theme: 'light', fontSize: 16, autosave: true },
        },
        {
          name: 'empty update leaves every field unchanged',
          args: [{ theme: 'dark', fontSize: 12, autosave: false }, {}],
          expected: { theme: 'dark', fontSize: 12, autosave: false },
        },
        {
          name: 'updates every field at once',
          args: [
            { theme: 'light', fontSize: 14, autosave: true },
            { theme: 'dark', fontSize: 18, autosave: false },
          ],
          expected: { theme: 'dark', fontSize: 18, autosave: false },
        },
        {
          name: 'updates two fields and keeps the third',
          args: [
            { theme: 'light', fontSize: 14, autosave: true },
            { theme: 'dark', autosave: false },
          ],
          expected: { theme: 'dark', fontSize: 14, autosave: false },
        },
        {
          name: 'keeps unrelated fields when toggling autosave',
          args: [
            { theme: 'dark', fontSize: 20, autosave: false },
            { autosave: true },
          ],
          expected: { theme: 'dark', fontSize: 20, autosave: true },
        },
      ],
    },
    {
      id: 'map-changed-flags',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Write the mapped type behind a change report',
      prompt:
        'diffFlags compares two objects that have the same keys and reports which fields changed. Replace the ChangedFlags placeholder with a mapped type you write yourself: one entry per key of T, every value a boolean. Then implement diffFlags so each flag is true exactly when that field\'s value differs between before and after, compared with !==. The hidden type tests require ChangedFlags<T> to demand every key of T, reject keys T lacks, and use boolean values throughout. Example: `diffFlags({ email: "ada@example.com", remember: true }, { email: "grace@example.com", remember: true })` returns `{ email: true, remember: false }`.',
      estimatedMinutes: 18,
      functionName: 'diffFlags',
      starter: `// Rewrite ChangedFlags as a mapped type over the keys of T.
export type ChangedFlags<T> = Record<string, boolean>

export function diffFlags<T extends Record<string, unknown>>(
  before: T,
  after: T,
): ChangedFlags<T> {
  return {}
}

console.log(
  diffFlags(
    { email: 'ada@example.com', remember: true },
    { email: 'grace@example.com', remember: true },
  ),
)
`,
      typeFixture: `${consoleDeclaration}
type SessionForm = { email: string; remember: boolean }

const sessionFlags: ChangedFlags<SessionForm> = { email: true, remember: false }
void sessionFlags

const inferredFlags = diffFlags(
  { email: 'ada@example.com', remember: true },
  { email: 'grace@example.com', remember: true },
)
const emailChanged: boolean = inferredFlags.email
void emailChanged

// @ts-expect-error the flags object must require every key of the source
const missingKey: ChangedFlags<SessionForm> = { email: true }
void missingKey

// @ts-expect-error flag values must be booleans, not the source value types
const wrongValue: ChangedFlags<SessionForm> = { email: 'yes', remember: false }
void wrongValue

// @ts-expect-error the flags must not allow keys the source lacks
inferredFlags.rememberMe
`,
      tests: [
        {
          name: 'flags the changed field and clears the unchanged one',
          args: [
            { email: 'ada@example.com', remember: true },
            { email: 'grace@example.com', remember: true },
          ],
          expected: { email: true, remember: false },
        },
        {
          name: 'identical objects produce all-false flags',
          args: [
            { count: 3, label: 'drafts' },
            { count: 3, label: 'drafts' },
          ],
          expected: { count: false, label: false },
        },
        {
          name: 'every field changed produces all-true flags',
          args: [
            { page: 1, query: 'cats', exact: false },
            { page: 2, query: 'dogs', exact: true },
          ],
          expected: { page: true, query: true, exact: true },
        },
        {
          name: 'empty objects produce an empty flags object',
          args: [{}, {}],
          expected: {},
        },
        {
          name: 'a number and its string form count as changed',
          args: [{ port: 8080 }, { port: '8080' }],
          expected: { port: true },
        },
        {
          name: 'null compared to null counts as unchanged',
          args: [
            { note: null, pinned: true },
            { note: null, pinned: false },
          ],
          expected: { note: false, pinned: true },
        },
      ],
    },
    {
      id: 'derive-account-projections',
      kind: 'refactor',
      completionMode: 'tests-and-static-checks-pass',
      title: 'Replace hand-copied projections with derived types',
      prompt:
        'UserAccount is the stored shape of a user, hash included. PublicUser and AccountUpdate were hand-copied from it, so nothing ties them to the source: a rename in UserAccount would leave both compiling and wrong, exactly the drift this lesson opened with. Refactor the types without changing runtime behavior. Derive PublicUser from UserAccount with Omit so it is always every field except passwordHash. Derive AccountUpdate with Partial and Omit so it accepts any subset of email and displayName and rejects both id and passwordHash. Keep toPublicUser returning an object that genuinely lacks a passwordHash key at runtime, since Omit only removes the field from the type. Example: `toPublicUser({ id: "u1", email: "ada@example.com", displayName: "Ada", passwordHash: "a1b2c3" })` returns `{ id: "u1", email: "ada@example.com", displayName: "Ada" }`.',
      estimatedMinutes: 20,
      functionName: 'toPublicUser',
      originalCode: `export type UserAccount = {
  id: string
  email: string
  displayName: string
  passwordHash: string
}

export type PublicUser = {
  id: string
  email: string
  displayName: string
}

export type AccountUpdate = {
  email?: string
  displayName?: string
}

export function toPublicUser(account: UserAccount): PublicUser {
  return {
    id: account.id,
    email: account.email,
    displayName: account.displayName,
  }
}

console.log(
  toPublicUser({
    id: 'u1',
    email: 'ada@example.com',
    displayName: 'Ada',
    passwordHash: 'a1b2c3',
  }),
)
`,
      starter: `export type UserAccount = {
  id: string
  email: string
  displayName: string
  passwordHash: string
}

export type PublicUser = {
  id: string
  email: string
  displayName: string
}

export type AccountUpdate = {
  email?: string
  displayName?: string
}

export function toPublicUser(account: UserAccount): PublicUser {
  return {
    id: account.id,
    email: account.email,
    displayName: account.displayName,
  }
}

console.log(
  toPublicUser({
    id: 'u1',
    email: 'ada@example.com',
    displayName: 'Ada',
    passwordHash: 'a1b2c3',
  }),
)
`,
      goals: [
        'Derive PublicUser from UserAccount with Omit, so a rename or added field in the source propagates instead of drifting.',
        'Derive AccountUpdate from UserAccount so it accepts any subset of the editable fields and can never name id or passwordHash.',
        'Keep toPublicUser returning an object without a passwordHash key at runtime; the type change alone does not remove the data.',
      ],
      staticChecks: [
        {
          kind: 'require-text',
          text: 'Omit<UserAccount',
          message:
            'Derive PublicUser from UserAccount with Omit instead of restating its fields.',
        },
        {
          kind: 'require-text',
          text: 'Partial<',
          message:
            'Derive AccountUpdate with Partial instead of hand-writing optional fields.',
        },
        {
          kind: 'forbid-text',
          text: 'displayName?:',
          message:
            'AccountUpdate must be derived from UserAccount, not a hand-copied list of optional fields.',
        },
        {
          kind: 'no-any',
          message:
            'Keep the projections fully typed; any would hide exactly the drift this refactor removes.',
        },
      ],
      typeFixture: `${consoleDeclaration}
const publicShape: PublicUser = {
  id: 'u1',
  email: 'ada@example.com',
  displayName: 'Ada',
}
void publicShape

const fromReturnType: ReturnType<typeof toPublicUser> = {
  id: 'u2',
  email: 'grace@example.com',
  displayName: 'Grace',
}
void fromReturnType

const emptyAccountUpdate: AccountUpdate = {}
const nameOnly: AccountUpdate = { displayName: 'Grace' }
void emptyAccountUpdate
void nameOnly

// @ts-expect-error the public shape must not include the password hash
const leaked: PublicUser = { id: 'u1', email: 'a@example.com', displayName: 'Ada', passwordHash: 'x' }
void leaked

// @ts-expect-error updates must not be able to change the id
const idUpdate: AccountUpdate = { id: 'u2' }
void idUpdate

// @ts-expect-error updates must not be able to touch the password hash
const hashUpdate: AccountUpdate = { passwordHash: 'x' }
void hashUpdate
`,
      tests: [
        {
          name: 'drops the password hash key entirely',
          args: [
            {
              id: 'u1',
              email: 'ada@example.com',
              displayName: 'Ada',
              passwordHash: 'a1b2c3',
            },
          ],
          expected: { id: 'u1', email: 'ada@example.com', displayName: 'Ada' },
        },
        {
          name: 'keeps every public field value',
          args: [
            {
              id: 'u2',
              email: 'grace@example.com',
              displayName: 'Grace Hopper',
              passwordHash: 'zzz',
            },
          ],
          expected: {
            id: 'u2',
            email: 'grace@example.com',
            displayName: 'Grace Hopper',
          },
        },
        {
          name: 'drops an empty-string hash too',
          args: [
            { id: 'u3', email: 'lin@example.com', displayName: 'Lin', passwordHash: '' },
          ],
          expected: { id: 'u3', email: 'lin@example.com', displayName: 'Lin' },
        },
        {
          name: 'keeps an empty display name',
          args: [
            { id: 'u4', email: 'sam@example.com', displayName: '', passwordHash: 'h' },
          ],
          expected: { id: 'u4', email: 'sam@example.com', displayName: '' },
        },
        {
          name: 'keeps punctuation-heavy values intact',
          args: [
            { id: 'u5', email: 'x+y@example.com', displayName: 'X. Y.', passwordHash: '##' },
          ],
          expected: { id: 'u5', email: 'x+y@example.com', displayName: 'X. Y.' },
        },
      ],
    },
    {
      id: 'derive-or-declare-review',
      kind: 'written',
      completionMode: 'submitted-with-reference-review',
      title: 'Explain when to derive a type and when to declare it',
      prompt:
        'A teammate opens a pull request that does three things: it replaces a hand-copied `UserUpdate` type with `Partial<User>`, it adds `type PublicUser = Omit<User, \'passwordHash\'>` and returns `{ ...account }` from the function that produces one, and it derives the JSON body sent to a third-party billing API from that same `User` type. In your own words, explain: what the first change buys that the hand-copied version could not, why the second change does not do what its name suggests and what has to change for the type to be honest, and why the third change is the one to push back on. Use a short example of your own.',
      estimatedMinutes: 12,
      referenceAnswer:
        'Partial<User> is computed from User every time the compiler reads it, so the two cannot disagree. The hand-copied version was a second, independent list of fields that happened to match on the day it was written; nothing tied it to the source, so a rename in User left it stale and still perfectly valid on its own terms. That is what makes the drift silent: the stale update type keeps compiling everywhere, and the mismatch surfaces only as an update that quietly does nothing at runtime. With the derived version the same rename fails to compile at the one call site still passing the old field name, which is exactly where a person needs to look. A derived type has no opinions of its own; it is the source plus one transformation, so writing it out by hand only gives it room to drift.\n\nThe second change removes nothing. Omit computes a new type without passwordHash, but types are erased at compile time, so nothing in the emitted JavaScript acts on it. Returning `{ ...account }` copies every key the runtime object actually has, hash included, and the compiler accepts it because an object with extra properties is still assignable to the narrower type. The result is a value typed PublicUser that still carries the secret, which is worse than having no type at all, because the signature now swears the hash is gone; serialize it into a response and the hash ships to the client. Making the type honest takes a real line of runtime code, destructuring the field away so the object genuinely lacks the key: `const { passwordHash: _dropped, ...publicFields } = account`. The standard to hold every derived type to is that the type describes the data and some actual code makes the data match.\n\nThe third change is the one to push back on, because it derives across a boundary that should stay independent. Deriving is right when there is one source of truth and the second type is mechanically related to it: an update payload, a summary view, a labels table. A third-party billing API request shape is not that. It evolves on someone else\'s schedule, for reasons that have nothing to do with your domain model. Derive it from User and every internal rename silently becomes a change to what you send over the wire, a breaking change for a system you do not control, and nothing will flag it because the derived type just follows along. Two types that merely resemble each other today should be declared separately on purpose, with an explicit conversion function between them, so that changing one forces a visible decision about the other. The test is not whether the shapes match but whether there is one source of truth: one source, derive; two, declare both and convert.',
      rubric: [
        {
          id: 'derivation-prevents-drift',
          label: 'What deriving buys',
          description:
            'Explains that a derived type recomputes from its source and so cannot fall behind, and that a rename surfaces as a compile error at the call site instead of as silently stale behavior at runtime.',
        },
        {
          id: 'types-are-erased',
          label: 'Omit relabels, it does not remove',
          description:
            'Identifies that Omit is compile-time only, that a spread still copies the excluded key because extra properties remain assignable, and that honest removal requires runtime code such as destructuring the field away.',
        },
        {
          id: 'one-source-of-truth',
          label: 'When deriving is wrong',
          description:
            'Argues that types evolving on different schedules, such as an external wire format and an internal model, should be declared separately with an explicit conversion, using the one-source-of-truth test rather than shape similarity.',
        },
      ],
    },
  ],
  approaches: {
    'derive-settings-update': [
      {
        name: 'Partial plus spread',
        code: `export type EditorSettings = {
  theme: 'light' | 'dark'
  fontSize: number
  autosave: boolean
}

// Derived, not copied: every field of EditorSettings, made optional.
// A rename in the source now breaks stale call sites at compile time.
export type SettingsUpdate = Partial<EditorSettings>

export function applySettingsUpdate(
  current: EditorSettings,
  update: SettingsUpdate,
): EditorSettings {
  // Spread the update last so its fields win over the current values.
  // Absent optional fields produce no key, so they change nothing.
  return { ...current, ...update }
}`,
        explanation:
          'The type is the important half of this problem. Partial<EditorSettings> recomputes the update shape from the source every time the compiler looks at it, so it accepts {} and any subset of fields, rejects unknown keys through excess property checking, and keeps each field\'s value type. The runtime half is one spread: update comes second, so any field it carries overwrites the current value, and fields it omits leave the current value in place. The result is a new object, so the caller\'s settings are never mutated.',
        complexity:
          'O(1) time and space for a fixed field count. The guarantee that matters is compile-time: the update type cannot drift from EditorSettings.',
      },
    ],
    'map-changed-flags': [
      {
        name: 'Mapped type filled in by a key walk',
        code: `// Same keys as T, every value a boolean. [K in keyof T] walks the
// source's keys, and ignoring T[K] maps each one to boolean.
export type ChangedFlags<T> = { [K in keyof T]: boolean }

export function diffFlags<T extends Record<string, unknown>>(
  before: T,
  after: T,
): ChangedFlags<T> {
  // Start empty and fill one flag per key. The cast is honest: the
  // object only satisfies ChangedFlags<T> once the loop completes.
  const flags = {} as ChangedFlags<T>

  // Object.keys returns string[], so tell the compiler these are T's keys.
  for (const key of Object.keys(before) as Array<keyof T>) {
    flags[key] = before[key] !== after[key]
  }

  return flags
}`,
        explanation:
          'ChangedFlags<T> is the lesson\'s mapped-type machinery applied directly: iterate keyof T and map every key to boolean. Because it is derived, a key added to the source type demands a flag automatically. At runtime the flags object is built key by key, and two casts bridge the gap between what the compiler can see and what the loop guarantees: the empty object literal is not yet a full ChangedFlags<T>, and Object.keys is typed as string[] even though these strings are exactly T\'s keys. Both casts are local to the construction site, which is the right place for them.',
        complexity: 'O(k) time and space for k keys.',
      },
    ],
    'derive-account-projections': [
      {
        name: 'Omit and Partial with a destructuring strip',
        code: `export type UserAccount = {
  id: string
  email: string
  displayName: string
  passwordHash: string
}

// Everything except the hash is public. Derived, so a rename in
// UserAccount propagates here instead of drifting.
export type PublicUser = Omit<UserAccount, 'passwordHash'>

// Editable fields only: never the identifier, never the hash.
export type AccountUpdate = Partial<Omit<UserAccount, 'id' | 'passwordHash'>>

export function toPublicUser(account: UserAccount): PublicUser {
  // Omit removed passwordHash from the type only. This destructuring
  // removes it from the runtime object, so the two stay in agreement.
  const { passwordHash: _dropped, ...publicFields } = account
  return publicFields
}`,
        explanation:
          'Both projections become one-liners that name their relationship to the source. PublicUser uses Omit rather than Pick deliberately: the field being excluded, passwordHash, is the one the type exists to exclude, so naming it keeps the intent readable. AccountUpdate composes two utilities, Omit to remove the fields callers may never touch and Partial to make the rest optional. The function body changes from listing fields to destructuring the secret one away, which keeps the runtime object aligned with what the type claims; returning { ...account } would satisfy the compiler while leaking the hash. A rename in UserAccount now surfaces as compile errors in the fixture and call sites instead of as silently stale copies.',
        complexity:
          'O(1) runtime work. The meaningful guarantee is that the projection types recompute from UserAccount, so they cannot drift, and the returned object carries no passwordHash key.',
      },
    ],
  },
}
