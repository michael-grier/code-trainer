import Concept from './concept.mdx'

import type { Lesson } from '../../types'

export const lesson: Lesson = {
  slug: 'browser-storage-and-offline-friendly-state',
  title: 'Browser Storage and Offline-Friendly State',
  summary:
    'Persist browser state defensively and design around offline or reload behavior.',
  track: 'frontend',
  order: 42,
  concept: Concept,
  problems: [
    {
      id: 'versioned-settings-restore',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Restore settings across missing, broken, and outdated saves',
      prompt:
        "Implement restoreSettings, the one door through which saved settings re-enter the app. The current shape is `{ version: 2, theme: 'light' | 'dark', fontSizePx: number }`, with defaults `{ version: 2, theme: 'light', fontSizePx: 14 }`. The input is whatever storage held: `null` on a first visit, or any string an old version, a corrupted write, or a curious user left behind. Return the defaults for null, unparseable JSON, and any unrecognized or mistyped shape. A well-formed version-2 value is returned as-is. A well-formed version-1 value — `{ version: 1, theme, fontSize }`, which stored points instead of pixels — is migrated: same theme, `fontSizePx` equal to `Math.round(fontSize * 4 / 3)`, version 2. Check every field before trusting any of it. Example: `restoreSettings('{\"version\":1,\"theme\":\"dark\",\"fontSize\":12}')` returns `{ version: 2, theme: 'dark', fontSizePx: 16 }`, and `restoreSettings('{corrupted')` returns the defaults.",
      estimatedMinutes: 15,
      functionName: 'restoreSettings',
      starter: `type Settings = { version: 2; theme: 'light' | 'dark'; fontSizePx: number }

const defaults: Settings = { version: 2, theme: 'light', fontSizePx: 14 }

export function restoreSettings(raw: string | null): Settings {
  return defaults
}

console.log(restoreSettings('{"version":1,"theme":"dark","fontSize":12}'))
`,
      tests: [
        {
          name: 'a first visit gets the defaults',
          args: [null],
          expected: { version: 2, theme: 'light', fontSizePx: 14 },
        },
        {
          name: 'a current save is returned as-is',
          args: ['{"version":2,"theme":"dark","fontSizePx":16}'],
          expected: { version: 2, theme: 'dark', fontSizePx: 16 },
        },
        {
          name: 'a version-1 save is migrated from points to pixels',
          args: ['{"version":1,"theme":"dark","fontSize":12}'],
          expected: { version: 2, theme: 'dark', fontSizePx: 16 },
        },
        {
          name: 'migration rounds to whole pixels',
          args: ['{"version":1,"theme":"light","fontSize":9}'],
          expected: { version: 2, theme: 'light', fontSizePx: 12 },
        },
        {
          name: 'corrupted text falls back to defaults',
          args: ['{corrupted'],
          expected: { version: 2, theme: 'light', fontSizePx: 14 },
        },
        {
          name: 'an unknown future version is not trusted',
          args: ['{"version":3,"theme":"dark","fontSizePx":16}'],
          expected: { version: 2, theme: 'light', fontSizePx: 14 },
        },
        {
          name: 'an invented theme is rejected',
          args: ['{"version":2,"theme":"blue","fontSizePx":16}'],
          expected: { version: 2, theme: 'light', fontSizePx: 14 },
        },
        {
          name: 'a mistyped field rejects the whole value',
          args: ['{"version":2,"theme":"dark","fontSizePx":"16"}'],
          expected: { version: 2, theme: 'light', fontSizePx: 14 },
        },
        {
          name: 'valid JSON of the wrong kind entirely',
          args: ['"dark"'],
          expected: { version: 2, theme: 'light', fontSizePx: 14 },
        },
      ],
    },
    {
      id: 'defensive-draft-editor',
      kind: 'react-code',
      completionMode: 'all-tests-pass',
      title: 'Stop the draft editor from crashing on first visit',
      prompt:
        "This is the lesson's draft editor, wired to a storage stand-in with localStorage's exact contract — and it crashes during its very first render for any user with nothing saved, because `JSON.parse(getItem(...))` never met `null`, and the `as string` cast silenced the type system's warning. Fix the restore path the lesson's way: write a `restoreDraft` function that returns the saved text only when storage holds parseable JSON with a string `text` field, and `''` for everything else — missing, corrupted, or mis-shaped — then use it as a lazy `useState` initializer. Keep the input, the `draft:` line, and both buttons exactly as they are. The tests share the storage across mounts, exactly as reloads share the real thing, and one of them corrupts it on purpose. Example: on a first visit the screen must show `draft: (empty)` instead of crashing, and after typing `hello`, a remount must show `draft: hello`.",
      estimatedMinutes: 15,
      componentName: 'DraftEditor',
      starter: `import { useState } from 'react'

// A stand-in with localStorage's exact contract: string values, null for
// missing keys, persistence across mounts. Tests share it the way reloads
// share the real thing.
const fakeLocalStorage = {
  values: new Map<string, string>(),
  getItem(key: string): string | null {
    return fakeLocalStorage.values.has(key)
      ? fakeLocalStorage.values.get(key)!
      : null
  },
  setItem(key: string, value: string) {
    fakeLocalStorage.values.set(key, String(value))
  },
}

type SavedDraft = { text: string }

export function DraftEditor() {
  const [text, setText] = useState(
    () =>
      (JSON.parse(fakeLocalStorage.getItem('draft') as string) as SavedDraft)
        .text,
  )

  const update = (next: string) => {
    setText(next)
    fakeLocalStorage.setItem('draft', JSON.stringify({ text: next }))
  }

  return (
    <div>
      <input
        aria-label="draft"
        value={text}
        onChange={(event) => update(event.target.value)}
      />
      <p>draft: {text === '' ? '(empty)' : text}</p>
      <button onClick={() => fakeLocalStorage.setItem('draft', '{not json')}>
        corrupt saved data
      </button>
      <button onClick={() => update('')}>clear draft</button>
    </div>
  )
}
`,
      tests: [
        {
          name: 'a first visit starts empty instead of crashing',
          props: {},
          expect: [{ type: 'text-present', text: 'draft: (empty)' }],
        },
        {
          name: 'typing shows and saves the draft',
          props: {},
          steps: [{ action: 'type', into: 'draft', value: 'hello' }],
          expect: [{ type: 'text-present', text: 'draft: hello' }],
        },
        {
          name: 'the draft survives a reload',
          props: {},
          expect: [{ type: 'text-present', text: 'draft: hello' }],
        },
        {
          name: 'clearing empties the draft and persists that too',
          props: {},
          steps: [{ action: 'click', text: 'clear draft' }],
          expect: [{ type: 'text-present', text: 'draft: (empty)' }],
        },
        {
          name: 'corrupting storage does not disturb the current screen',
          props: {},
          steps: [{ action: 'click', text: 'corrupt saved data' }],
          expect: [{ type: 'text-present', text: 'draft: (empty)' }],
        },
        {
          name: 'a reload after corruption falls back instead of crashing',
          props: {},
          expect: [{ type: 'text-present', text: 'draft: (empty)' }],
        },
      ],
    },
    {
      id: 'offline-notes-design',
      kind: 'design',
      completionMode: 'submitted-with-rubric-review',
      title: 'Design the offline story for a notes app',
      prompt:
        'Design what persists, when it flushes, and what reconnection does for the notes app described in the scenario, then defend your write-timing decision.',
      estimatedMinutes: 25,
      scenario:
        'Your team’s notes app syncs to a server: users browse their note list, open a note, and edit it. Product requirements: an editor that never loses typed work — not to a crashed tab, a laptop lid, or a subway tunnel; edits made offline reach the server when the connection returns; the note list should open instantly on revisit even before the network answers; and one user may have the app open in two tabs. The server is the source of truth for notes, and lesson 39’s cache layer already manages fetched data in memory.',
      sections: [
        {
          id: 'persistence-inventory',
          type: 'entity-list',
          label: 'Persistence inventory',
          prompt:
            'List what the app persists in browser storage (and what it deliberately does not), with one line each: the in-progress edit, the pending-sync queue, the note-list snapshot, auth material, UI preferences. Use the lesson’s classification to justify each.',
        },
        {
          id: 'write-timing',
          type: 'tradeoff',
          label: 'When the draft hits storage',
          prompt:
            'Choose when the in-progress edit is written to storage and justify it against the never-lose-work requirement and storage’s synchronous, quota-limited nature.',
          options: [
            'Write-through: persist on every keystroke, inside the change handler',
            'Debounced: persist at most every few hundred milliseconds of quiet',
            'On lifecycle events only: persist on blur, tab-hide, and page-unload',
          ],
        },
        {
          id: 'offline-mutations',
          type: 'short-answer',
          label: 'Offline edits and reconnection',
          prompt:
            'Describe how edits made offline are represented (an outbox or equivalent), what replaying them on reconnect looks like, what happens when the server’s copy changed meanwhile, and how the outbox survives a crash mid-offline-session.',
        },
        {
          id: 'shape-evolution',
          type: 'short-answer',
          label: 'Old saves, two tabs',
          prompt:
            'Say how every stored payload defends against next year’s code (versioning and the restore path) and what the two-tabs requirement means for how much each tab may trust its own copy of storage.',
        },
      ],
      rubric: [
        {
          id: 'classified-inventory',
          label: 'Inventory follows the classification',
          description:
            'Drafts, the outbox, and preferences persist as client state; the note-list snapshot is persisted only as an explicit cache concern (or deliberately not at all) rather than loose app state; secrets are kept out of localStorage with a reason.',
        },
        {
          id: 'defensible-write-timing',
          label: 'Write timing argued from the requirement',
          description:
            'The chosen strategy is defended against work loss (a crash between debounce ticks, unload events not firing) and against cost (synchronous writes per keystroke); debounced-plus-lifecycle or write-through with small payloads both earn credit when argued honestly.',
        },
        {
          id: 'durable-outbox',
          label: 'The outbox is durable and replayable',
          description:
            'Offline mutations are persisted as an ordered queue that survives crashes, replayed on reconnect, with a stated answer for conflicts (last-write-wins, prompt, or merge) rather than silent loss.',
        },
        {
          id: 'versioned-and-validated',
          label: 'Every restore is defensive and versioned',
          description:
            'Stored payloads carry versions; restores run through parse-validate-migrate-or-default; nothing read from storage is trusted raw.',
        },
        {
          id: 'multi-tab-humility',
          label: 'Tabs do not trust their own copy',
          description:
            'Acknowledges that another tab may write storage at any time: re-read or reconcile at sensible moments (focus, before replay) instead of assuming an in-memory copy of storage stays true.',
        },
      ],
      referenceAnswer:
        "Persistence inventory. The in-progress edit persists: it is client state only this browser knows, and it is the one thing the requirements say may never be lost — keyed per note, as { version, noteId, text, editedAt }. The pending-sync outbox persists: an ordered list of mutations made while offline, because an offline session that ends in a crash must still sync later. UI preferences persist as ordinary small client state. The note-list snapshot is persisted, but strictly as the cache layer's own storage — a serialized cache entry with its fetchedAt, owned and invalidated by lesson 39's machinery — so the instant-open requirement is met without creating a second, unmanaged copy of server state. Auth tokens do not go in localStorage: every script on the page can read it, which is the next lesson's opening threat; session material belongs in httpOnly cookies or memory.\n\nWrite timing. Debounced, a few hundred milliseconds of quiet, plus flushes on blur, tab-hide, and unload. Write-through on every keystroke is the simplest correctness argument, but it performs a synchronous write per character and rewrites the full payload each time; a debounce keeps the loss window to less than a second of typing while cutting writes by an order of magnitude. The lifecycle flushes close the debounce's one hole — the user who types and immediately closes the lid — and the unload flush is treated as best-effort, because unload handlers are not guaranteed; the debounce tick is the workhorse, the lifecycle events are the seatbelt. Every write is try-wrapped: a full quota costs persistence, never typing.\n\nOffline edits and reconnection. Each save attempted while offline appends a mutation to the persisted outbox — { version, noteId, baseRevision, text, queuedAt } — and the editor keeps working against local state. On reconnect (an online event or a successful probe), the outbox replays in order; each acknowledged mutation is removed, and the note cache is invalidated so the next read refetches truth. If the server's copy changed while we were away — its revision no longer matches baseRevision — the safe default is to keep both: apply nothing silently, surface 'this note changed while you were offline' with the local text preserved, and let the user choose. Because the outbox is persisted before it is replayed, a crash mid-offline-session loses nothing: the next launch finds the queue and resumes.\n\nOld saves and two tabs. Every payload carries a version, and every restore runs the same door: parse in a try, shape-check field by field, migrate known old versions, default the rest — drafts are worth migrating, never worth crashing over. Two tabs mean this tab's in-memory picture of storage can be stale the moment another tab writes: so storage is re-read at the moments it matters — on focus, and before replaying the outbox — and the outbox replay tolerates finding entries a sibling tab already synced (replay is idempotent per mutation, keyed by a queued id). The stance that keeps all of it honest is the lesson's: every byte read from storage, including bytes this very session wrote, is treated as a stranger.",
    },
    {
      id: 'storage-review',
      kind: 'written',
      completionMode: 'submitted-with-reference-review',
      title: 'Explain why storage reads are untrusted input',
      prompt:
        'A teammate’s PR persists the app’s entire Redux-style store to localStorage on every action and rehydrates it on boot with a bare `JSON.parse(localStorage.getItem("state")!)`, spread straight into the initial state. It works on their machine. In your own words, review it. Explain: every way that read can go wrong and who hits each case, why the non-null assertion is the type system being overruled rather than satisfied, what deserves persistence out of a whole store and what does not (use the client/server classification), and how versioning keeps next quarter’s deploy from crashing this quarter’s users. Use a short example of your own.',
      estimatedMinutes: 12,
      referenceAnswer:
        "The read can go wrong four separate ways, and each one has a real person attached. getItem returns null for anyone who has never visited — so the bare parse crashes exactly the users seeing the app for the first time, the one audience with no loyalty yet. The value can be unparseable: a write interrupted by a crashed tab, a quota hit partway, a user poking devtools — JSON.parse throws and boot dies. The value can parse into the wrong shape: the store from three releases ago, faithfully saved by our own code, now missing the slice the new reducer expects — the spread quietly installs a half-formed state and the crash happens later, far from the cause, which is worse than at boot. And the value can be right-shaped but wrong-content: another tab wrote mid-session. Storage is external input — the sender is 'any past version of us, or anyone at the keyboard' — and it gets the lesson 31 treatment: null-check, try/catch, shape-check, default. The non-null assertion is the tell: getItem's type is string | null precisely because the null case is real, and the ! does not make it false, it makes the compiler stop saying it.\n\nPersisting the entire store fails the classification before it fails the parser. A store mixes client state with server state, and each persists badly for a different reason. The server-state slices — fetched lists, entities — become a shadow cache with no fetchedAt, no staleness, no invalidation: users boot into yesterday's data presented as today's, and the real cache layer fights the ghost. Ephemeral client state — open modals, in-flight flags — rehydrates into nonsense: a spinner for a request nobody made. What earns persistence is the small durable core: drafts, preferences, maybe a cursor of where the user was. Persist that explicitly, per key, through explicit restore functions — not the store wholesale because it is the object nearest to hand.\n\nVersioning is what keeps the surviving keys alive across deploys. Saved state outlives the code that wrote it; next quarter's rename meets this quarter's payload in some user's browser, and no compiler sees the collision because one side of it is data at rest. A version field in every payload, a restore that migrates known versions and defaults unknown ones, turns that collision into either a silent upgrade or a clean reset. My example: we renamed a filters slice and shipped without a migration; every returning user booted with filters undefined and a crash in the first selector, while every new user — empty storage — was fine. The bug report literally read 'app works only in incognito'. One version bump and a ten-line migration later, the same deploy was a non-event.\n\nThe rule that summarizes the review: storage is a boundary, and boundaries get doors, not spreads. One restore function per key, defensive on the way in, versioned on the way through, defaults on the way out.",
      rubric: [
        {
          id: 'failure-inventory',
          label: 'The four ways a read fails',
          description:
            'Names null-on-first-visit, unparseable text, outdated shape from older app versions, and cross-tab interference, each with who encounters it — not just "it might fail".',
        },
        {
          id: 'assertion-overrule',
          label: 'The ! overrules, not satisfies',
          description:
            'Identifies the non-null assertion as silencing a true warning: string | null is the API’s honest type and the assertion changes the compiler’s knowledge, not the runtime value.',
        },
        {
          id: 'selective-persistence',
          label: 'Classification decides what persists',
          description:
            'Splits the store: durable client state (drafts, preferences) persists via explicit per-key restores; server-state slices do not persist as loose state because they form an unmanaged shadow cache; ephemeral UI state is excluded.',
        },
        {
          id: 'versioned-migration',
          label: 'Versions bridge deploys',
          description:
            'Explains that stored data outlives its writing code, and that a version field plus migrate-or-default restore turns shape changes into upgrades instead of crashes, with a concrete scenario.',
        },
      ],
    },
  ],
  approaches: {
    'versioned-settings-restore': [
      {
        name: 'One door: parse, verify, migrate, default',
        code: `type Settings = { version: 2; theme: 'light' | 'dark'; fontSizePx: number }

const defaults: Settings = { version: 2, theme: 'light', fontSizePx: 14 }

export function restoreSettings(raw: string | null): Settings {
  if (raw === null) {
    return defaults
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return defaults
  }

  if (typeof parsed !== 'object' || parsed === null || !('version' in parsed)) {
    return defaults
  }

  // Current shape: check every field before trusting any of it.
  if (
    parsed.version === 2 &&
    'theme' in parsed &&
    (parsed.theme === 'light' || parsed.theme === 'dark') &&
    'fontSizePx' in parsed &&
    typeof parsed.fontSizePx === 'number'
  ) {
    return { version: 2, theme: parsed.theme, fontSizePx: parsed.fontSizePx }
  }

  // Version 1 stored fontSize in points; migrate it forward.
  if (
    parsed.version === 1 &&
    'theme' in parsed &&
    (parsed.theme === 'light' || parsed.theme === 'dark') &&
    'fontSize' in parsed &&
    typeof parsed.fontSize === 'number'
  ) {
    return {
      version: 2,
      theme: parsed.theme,
      fontSizePx: Math.round(parsed.fontSize * (4 / 3)),
    }
  }

  return defaults
}`,
        explanation:
          "The function is lesson 31's boundary door pointed at storage, with one addition: the version routing. The failure ladder runs in order of when each case can strike — null before parsing, the try around JSON.parse for text that is not JSON at all, then the object-and-version gate before any shape is considered. Each version branch checks every field, lesson 31's rule that a predicate must earn its whole claim: a version-2 stamp on a payload with a string fontSizePx is a corrupted value wearing a valid badge, and it defaults. The migration branch is where versioning pays off — a faithful version-1 user's theme survives and their point-based size converts at 4/3 with a round to whole pixels, so an upgrade feels like nothing instead of a reset. Unknown versions, including future ones written by a newer build in another tab, take the defaults deliberately: guessing at a shape this code never knew is how migrations corrupt data. The result is built fresh rather than returned as the parsed object, so no unchecked extra fields ride along into the app.",
        complexity:
          'O(n) time in the payload length for the parse, O(n) space for the parsed value. The guarantee that matters is totality: every possible string, and null, maps to a valid Settings value.',
      },
    ],
    'defensive-draft-editor': [
      {
        name: 'A defensive restore behind a lazy initializer',
        code: `import { useState } from 'react'

// A stand-in with localStorage's exact contract: string values, null for
// missing keys, persistence across mounts. Tests share it the way reloads
// share the real thing.
const fakeLocalStorage = {
  values: new Map<string, string>(),
  getItem(key: string): string | null {
    return fakeLocalStorage.values.has(key)
      ? fakeLocalStorage.values.get(key)!
      : null
  },
  setItem(key: string, value: string) {
    fakeLocalStorage.values.set(key, String(value))
  },
}

// Storage is external data: missing, corrupted, and outdated values are all
// normal, so the restore parses defensively and falls back to empty.
function restoreDraft(): string {
  const raw = fakeLocalStorage.getItem('draft')
  if (raw === null) {
    return ''
  }

  try {
    const parsed: unknown = JSON.parse(raw)
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'text' in parsed &&
      typeof parsed.text === 'string'
    ) {
      return parsed.text
    }
  } catch {
    // Malformed JSON from an old or corrupted write: fall through.
  }

  return ''
}

export function DraftEditor() {
  const [text, setText] = useState(restoreDraft)

  const update = (next: string) => {
    setText(next)
    fakeLocalStorage.setItem('draft', JSON.stringify({ text: next }))
  }

  return (
    <div>
      <input
        aria-label="draft"
        value={text}
        onChange={(event) => update(event.target.value)}
      />
      <p>draft: {text === '' ? '(empty)' : text}</p>
      <button onClick={() => fakeLocalStorage.setItem('draft', '{not json')}>
        corrupt saved data
      </button>
      <button onClick={() => update('')}>clear draft</button>
    </div>
  )
}`,
        explanation:
          "The starter's one line did four jobs badly; the fix gives each job a home. restoreDraft is the lesson's single door: the null short-circuit handles the first visit that crashed the starter, the try absorbs the '{not json' the corruption button plants, and the shape check — object, not null, has a string text — rejects anything an older or stranger writer left, so every road leads either to proven text or to ''. The as string cast is simply gone; the null case is handled instead of hidden. useState(restoreDraft) passes the function itself, the lazy-initializer form, so storage is read once on mount rather than on every keystroke's render. Writing stays in the change handler where the event lives, saving the parsed shape the restore expects. The test sequence is the point of the design: type, remount, and the draft survives; corrupt, remount, and the app calmly starts empty — durability when storage cooperates, composure when it does not.",
        complexity:
          'O(n) restore work in the saved draft length, once per mount. The guarantee that matters is that no content of storage — including none at all — can prevent the editor from rendering.',
      },
    ],
  },
}
