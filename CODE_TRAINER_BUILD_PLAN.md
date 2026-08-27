# Code Trainer Build Plan

This document is a handoff-ready implementation plan for building **Code Trainer**, a browser-based interview prep app for intermediate full-stack TypeScript engineers.

It supersedes the earlier 25-lesson, frontend-only curriculum target. The new target is a deployed app with a richer, track-based curriculum, approximately 60 progressively structured lessons, multiple interactive problem types, guest progress through localStorage, and authenticated cloud progress sync through a lightweight backend.

## 1. Product Goal

Build a self-contained web app that teaches interview-ready engineering skills through:

- Structured conceptual lessons authored in MDX.
- Interactive practice problems.
- Browser-based TypeScript code execution.
- Deterministic grading where possible.
- Guided self-review for higher-level design and architecture exercises.
- Persistent guest progress through `localStorage`.
- Authenticated cloud progress sync across devices.

The curriculum, MDX content, code execution, and grading should remain browser-side. The backend should be limited to authentication and user progress persistence.

## 2. Target User

Intermediate full-stack engineers who already know basic JavaScript/TypeScript and React, and want to prepare for interviews covering:

- Algorithms and data structures.
- JavaScript runtime behavior.
- TypeScript type system and project design.
- React and frontend engineering.
- Backend TypeScript, APIs, and data modeling.
- Testing, debugging, refactoring, system design, and production readiness.

## 3. Core Product Principles

- The first screen is the usable learning dashboard, not a marketing page.
- Lessons are concise enough to finish in one focused session.
- Every lesson has practice, not just reading.
- Auto-grade only what can be graded honestly.
- Use structured self-review for design, architecture, and tradeoff problems.
- Keep the learning runtime browser-side and deterministic.
- Use the backend only for authentication and user-specific progress sync.
- Preserve guest mode so users can try the app without signing in.
- Prefer shadcn/ui for interface primitives and patterns.
- Keep the guided path linear by default, but let users inspect their progress and manually open any lesson from the curriculum map.

## 4. Required Tech Stack

Use these exact choices unless explicitly changed later:

- TypeScript
- React 19
- React Router DOM 7
- Vite 8
- `@vitejs/plugin-react`
- `@tailwindcss/vite`
- `@mdx-js/rollup`
- Tailwind CSS 4
- shadcn/ui as the primary component system
- Radix UI only through shadcn/ui unless a raw primitive is needed
- `class-variance-authority`
- `tailwind-merge`
- `clsx`
- `lucide-react`
- `sonner`
- `next-themes`
- `@monaco-editor/react`
- Sucrase
- `@fontsource-variable/geist`
- Clerk through `@clerk/clerk-react` for authentication
- Convex through `convex` for authenticated progress persistence and sync
- ESLint flat config with TypeScript, React Hooks, and React Refresh plugins

Required scripts:

```json
{
  "dev": "vite",
  "build": "tsc -b && vite build",
  "lint": "eslint .",
  "preview": "vite preview"
}
```

Recommended helper scripts:

```json
{
  "convex:dev": "convex dev",
  "convex:deploy": "convex deploy"
}
```

## 5. High-Level App Structure

Use this approximate source layout:

```text
src/
  app/
    App.tsx
    router.tsx
    providers.tsx
  components/
    app/
      AppShell.tsx
      AuthButtons.tsx
      Header.tsx
      MobileNav.tsx
      ProgressSidebar.tsx
      SyncStatus.tsx
      ThemeToggle.tsx
    learning/
      CurriculumMap.tsx
      LessonCard.tsx
      LessonHeader.tsx
      LessonProgressTable.tsx
      ProblemHeader.tsx
      ProblemNavigation.tsx
      PrerequisiteNotice.tsx
    problems/
      ProblemRenderer.tsx
      CodeProblemView.tsx
      DebugProblemView.tsx
      RefactorProblemView.tsx
      TraceProblemView.tsx
      WrittenProblemView.tsx
      DesignProblemView.tsx
      ApproachesPanel.tsx
      RubricReview.tsx
      StaticCheckResults.tsx
      TestResults.tsx
    editor/
      CodeEditor.tsx
      DiffEditor.tsx
      ReadOnlyCode.tsx
    mdx/
      Mdx.tsx
    ui/
      button.tsx
      card.tsx
      tabs.tsx
      popover.tsx
      dropdown-menu.tsx
      sheet.tsx
      badge.tsx
      progress.tsx
      separator.tsx
      scroll-area.tsx
      textarea.tsx
      sonner.tsx
  curriculum/
    index.ts
    types.ts
    tracks.ts
    lessons/
      01-arrays-and-hashing/
        index.ts
        concept.mdx
      ...
  lib/
    cn.ts
    ids.ts
    format.ts
    storage.ts
  pages/
    HomePage.tsx
    ConceptPage.tsx
    ProgressPage.tsx
    ProblemPage.tsx
    NotFoundPage.tsx
  runtime/
    codeRunner.ts
    jsRunner.ts
    jsWorker.ts
    staticChecks.ts
    testHarness.ts
    traceGrader.ts
  state/
    cloudProgress.ts
    progress.ts
    syncProgress.ts
    useProgress.ts
    guidance.ts
  styles/
    globals.css
  mdx.d.ts
  main.tsx
convex/
  auth.config.ts
  progress.ts
  schema.ts
  settings.ts
```

## 6. Routes

Implement these routes:

- `/`
  - Home dashboard.
  - Shows the recommended next lesson, track progress, and lesson cards.
  - Defaults to the linear guided path.
- `/progress`
  - Progress and curriculum map page.
  - Shows completed, in-progress, untouched, and recommended lessons.
  - Lets users search, inspect, and manually open lessons.
- `/lesson/:slug`
  - Concept page.
  - Renders MDX lesson content.
  - Shows lesson problems, completion state, and prerequisite guidance.
  - Has primary action to start or continue problems.
- `/lesson/:slug/problem/:problemId`
  - Problem workspace.
  - Uses a shared layout and dispatches to the correct problem renderer by `kind`.
- `*`
  - Not found page with a link back to the dashboard.

## 7. Expanded Curriculum Model

Create `src/curriculum/types.ts` with a richer problem model.

```typescript
import type { ComponentType } from 'react'

export type ProblemKind =
  | 'code'
  | 'debug'
  | 'refactor'
  | 'trace'
  | 'written'
  | 'design'

export type CompletionMode =
  | 'all-tests-pass'
  | 'tests-and-static-checks-pass'
  | 'structured-answer-correct'
  | 'submitted-with-reference-review'
  | 'submitted-with-rubric-review'

export type TestCase = {
  name: string
  args: unknown[]
  expected: unknown
}

export type BaseProblem = {
  id: string
  kind: ProblemKind
  title: string
  prompt: string
  completionMode: CompletionMode
  estimatedMinutes?: number
}

export type CodeProblem = BaseProblem & {
  kind: 'code'
  completionMode: 'all-tests-pass'
  functionName: string
  starter: string
  tests: TestCase[]
}

export type DebugProblem = BaseProblem & {
  kind: 'debug'
  completionMode: 'all-tests-pass'
  functionName: string
  brokenCode: string
  tests: TestCase[]
  bugHints?: string[]
}

export type StaticCheck =
  | { kind: 'forbid-text'; text: string; message: string }
  | { kind: 'require-text'; text: string; message: string }
  | { kind: 'max-lines'; max: number; message: string }
  | { kind: 'no-any'; message: string }
  | { kind: 'no-mutation'; targets: string[]; message: string }

export type RefactorProblem = BaseProblem & {
  kind: 'refactor'
  completionMode: 'tests-and-static-checks-pass'
  functionName: string
  originalCode: string
  starter: string
  tests: TestCase[]
  goals: string[]
  staticChecks: StaticCheck[]
}

export type TraceQuestion =
  | {
      id: string
      type: 'output-order'
      label: string
      options: string[]
      expected: string[]
    }
  | {
      id: string
      type: 'final-value'
      label: string
      variable: string
      expected: unknown
    }
  | {
      id: string
      type: 'multiple-choice'
      label: string
      options: string[]
      answer: string
    }

export type TraceProblem = BaseProblem & {
  kind: 'trace'
  completionMode: 'structured-answer-correct'
  code: string
  questions: TraceQuestion[]
  explanation: string
}

export type WrittenProblem = BaseProblem & {
  kind: 'written'
  completionMode: 'submitted-with-reference-review'
  starter?: string
  referenceAnswer: string
  rubric?: RubricItem[]
}

export type DesignSection =
  | { id: string; type: 'short-answer'; label: string; prompt: string }
  | { id: string; type: 'endpoint-list'; label: string; prompt: string }
  | { id: string; type: 'entity-list'; label: string; prompt: string }
  | { id: string; type: 'tradeoff'; label: string; prompt: string; options: string[] }

export type RubricItem = {
  id: string
  label: string
  description: string
}

export type DesignProblem = BaseProblem & {
  kind: 'design'
  completionMode: 'submitted-with-rubric-review'
  scenario: string
  sections: DesignSection[]
  rubric: RubricItem[]
  referenceAnswer: string
}

export type Problem =
  | CodeProblem
  | DebugProblem
  | RefactorProblem
  | TraceProblem
  | WrittenProblem
  | DesignProblem

export type Approach = {
  name: string
  code?: string
  explanation: string
  complexity?: string
}

export type Lesson = {
  slug: string
  title: string
  summary: string
  track: string
  order: number
  concept: ComponentType
  problems: Problem[]
  approaches: Record<string, Approach[]>
}

export type Track = {
  id: string
  title: string
  summary: string
  lessonSlugs: string[]
}
```

## 8. Progress State

Progress should be local-first and auth-aware.

Use localStorage for:

- Guest mode.
- Fast optimistic UI updates.
- Signed-in cache/fallback while cloud sync is in flight.

Use Convex for:

- Authenticated cross-device persistence.
- Recovery after browser storage is cleared.
- Syncing progress between sessions and devices.

Use separate localStorage keys so signed-in user data is not shown to a later signed-out guest on the same browser:

```text
guest progress: "code-trainer:progress:v2:guest"
authenticated cache: "code-trainer:progress:v2:user:<clerkUserId>"
```

Use a versioned state shape so future migrations are possible:

```typescript
export type ProgressState = {
  version: 2
  completed: Record<string, true>
  drafts: Record<string, string>
  traceAnswers: Record<string, unknown>
  writtenAnswers: Record<string, string>
  designAnswers: Record<string, unknown>
  rubricReviews: Record<string, Record<string, true>>
  revealedReferences: Record<string, true>
  updatedAt: Record<string, number>
  lastSyncedAt?: number
  learningPath: {
    mode: 'guided' | 'self-directed'
    focusLessonSlug?: string
    queuedLessonSlugs: string[]
    updatedAt: number
  }
  lastVisited?: {
    lessonSlug: string
    problemId?: string
    updatedAt: number
  }
}
```

Key formats:

```text
problem key: "slug::problemId"
draft key: "slug::problemId"
trace answer key: "slug::problemId::questionId"
design answer key: "slug::problemId::sectionId"
updatedAt key examples: "drafts::slug::problemId", "traceAnswers::slug::problemId::questionId"
```

The `useProgress()` hook should provide:

- Read progress.
- Save progress.
- Save code drafts.
- Save written answers.
- Save trace answers.
- Save design section answers.
- Reveal reference answer.
- Toggle rubric items.
- Mark problem complete.
- Query lesson completion.
- Query track completion.
- Query recommended next lesson and problem.
- Report sync status.
- Trigger manual sync retry.

The `learningPath` fields remain in the persisted state shape for backward compatibility and possible future feature work. In the current product, Focus/Queue flows are inactive and should not affect recommendations.

Use defensive parsing when loading from `localStorage`. If persisted data is invalid, reset to an empty valid state.

## 8.1 Authentication, Cloud Sync, and Deployment

Use Clerk for authentication and Convex for authenticated progress persistence.

Do not build custom password auth. Authentication should be delegated to Clerk so the app does not own password storage, password recovery, session security, bot protection, or MFA mechanics.

### 8.1.1 Auth UX

Guest users:

- Can browse the curriculum.
- Can complete lessons.
- Save progress to the guest localStorage key.
- See a low-friction "Sign in to sync progress" action in the header and progress surfaces.

Signed-in users:

- See Clerk account controls in the header.
- Sync progress to Convex.
- Can continue across devices.
- Use an authenticated localStorage cache while cloud state is loading.

On sign-in:

- Load guest local progress.
- Load cloud progress from Convex.
- Merge the two states deterministically.
- Save the merged state to Convex.
- Save the merged state to the authenticated local cache.
- Keep the guest progress key unless the user explicitly chooses to clear it.

On sign-out:

- Stop showing the authenticated cache.
- Return to guest progress.
- Do not copy authenticated progress into the guest key automatically.

### 8.1.2 Clerk Integration

Frontend requirements:

- Wrap the app in `ClerkProvider`.
- Use Clerk sign-in/sign-up controls or Clerk-hosted flows.
- Use `UserButton` for signed-in account management.
- Use Clerk's `useAuth()` with Convex's Clerk provider integration.

Environment variables:

```text
VITE_CLERK_PUBLISHABLE_KEY
VITE_CONVEX_URL
```

Secrets and provider configuration should stay out of the frontend bundle. Any Clerk issuer/domain configuration required by Convex belongs in Convex configuration or environment settings.

### 8.1.3 Convex Integration

Use Convex for user-specific progress only. Do not move static curriculum content, MDX files, tests, or reference answers into Convex in v1.

Convex functions must derive the user ID from the authenticated identity on the server side. The client must not be trusted to pass a user ID for authorization.

Recommended server-side identity pattern:

```typescript
const identity = await ctx.auth.getUserIdentity()
if (!identity) {
  throw new Error('Authentication required')
}
const userId = identity.subject
```

Recommended Convex tables:

```typescript
userProblemProgress {
  userId: string
  lessonSlug: string
  problemId: string
  completedAt?: number
  draft?: string
  traceAnswers?: unknown
  writtenAnswer?: string
  designAnswers?: unknown
  rubricReviews?: string[]
  revealedReferenceAt?: number
  updatedAt: number
}

userSettings {
  userId: string
  lastLessonSlug?: string
  lastProblemId?: string
  // Compatibility/future-use fields. Current UI does not expose Focus/Queue flows.
  pathMode?: 'guided' | 'self-directed'
  focusLessonSlug?: string
  queuedLessonSlugs?: string[]
  updatedAt: number
}
```

Recommended indexes:

```typescript
userProblemProgress.by_user: ['userId']
userProblemProgress.by_user_problem: ['userId', 'lessonSlug', 'problemId']
userSettings.by_user: ['userId']
```

Recommended Convex functions:

- `getProgress`
- `mergeProgress`
- `upsertProblemProgress`
- `updateLastVisited`
- `clearUserProgress`, optional and confirmation-gated

### 8.1.4 Sync Rules

Use deterministic merge rules:

- `completed`: OR merge. If local or cloud says complete, keep complete.
- `drafts`: last-write-wins using `updatedAt`.
- `traceAnswers`: last-write-wins using `updatedAt`.
- `writtenAnswer`: last-write-wins using `updatedAt`.
- `designAnswers`: last-write-wins using `updatedAt`.
- `revealedReferences`: OR merge.
- `rubricReviews`: OR merge per rubric item.
- `lastVisited`: last-write-wins using `updatedAt`.
- `learningPath`: retained as a compatibility/future-use setting. Current recommendations should ignore focus and queue values.

After sign-in merge, authenticated cloud progress should become the source of truth. The authenticated local cache should still update optimistically so the interface feels instant.

Debounce frequent cloud writes such as editor drafts. Marking a problem complete, revealing references, and rubric review changes should sync immediately.

### 8.1.5 Sync Status UI

Add a small sync status surface in the app shell:

- Guest mode: "Local progress"
- Signed in and clean: "Synced"
- Pending writes: "Syncing"
- Failed write: "Sync failed" with retry action
- Offline/network unavailable: "Saved locally"

Use toasts sparingly. Persistent sync failures should be visible without repeatedly interrupting the learner.

### 8.1.6 Deployment

Recommended deployment model:

- Static frontend host for the Vite app.
- Convex deployment for progress functions and data.
- Clerk application for authentication.

Deployment documentation must list required environment variables and setup steps:

- Clerk publishable key in the frontend host.
- Convex URL in the frontend host.
- Clerk/Convex auth provider configuration.
- Allowed origins and redirect URLs for the deployed domain.
- Local development setup for Clerk and Convex.

## 9. Guided Path and Access Rules

Use a linear guided path as the default flow, but do not force every user to follow it.

Default guided behavior:

- The app computes a recommended next lesson based on the first incomplete lesson in curriculum order.
- The home page primary action resumes the last valid workspace when available; otherwise it continues the guided recommendation.
- Lesson cards show whether each lesson is completed, in progress, recommended, ahead of the recommended path, or untouched.
- Within a lesson, the first incomplete problem is the default next action.

Manual navigation behavior:

- Users can open the progress/curriculum map and manually choose any lesson.
- Manual navigation does not change the guided recommendation.
- Lessons ahead of the recommended path should show a prerequisite notice, not a hard block.
- Problem order inside a lesson should still default to sequential progression, but users may review the lesson overview before starting.

Future feature candidates:

- Focus lesson: let a user temporarily pin one lesson as the active dashboard target.
- Lesson queue: let a user build an ordered list of lessons to revisit, with a clear "start queue" flow and next-up behavior.

The UI should show:

- Recommended lessons/problems with a circle or arrow icon.
- Completed lessons/problems with a check icon.
- Ahead-of-path lessons with a subtle notice icon, not a blocking lock.
- Completion percentage globally and per track.
- Counts for completed, in-progress, untouched, and ahead-of-path lessons.

Implement guidance logic in `src/state/guidance.ts` as pure functions so it can be tested independently.

## 10. Problem Renderer System

Create a registry so `ProblemPage` does not contain problem-type-specific logic.

```typescript
export const problemRenderers = {
  code: CodeProblemView,
  debug: DebugProblemView,
  refactor: RefactorProblemView,
  trace: TraceProblemView,
  written: WrittenProblemView,
  design: DesignProblemView,
} satisfies Record<ProblemKind, ComponentType<ProblemViewProps>>
```

`ProblemPage` responsibilities:

- Resolve lesson and problem from route params.
- Show prerequisite guidance when the lesson is ahead of the recommended path.
- Render shared shell, sidebar, header, and navigation.
- Render the correct problem view.
- Save last visited location.
- Show approaches/reference panels where relevant.

Each problem view responsibilities:

- Render problem-specific interaction.
- Save drafts/answers.
- Determine whether completion criteria have been met.
- Call progress actions when complete.

## 11. Problem Type UX

### 11.1 Code Problems

Use for standard implementation practice.

UI:

- Prompt and constraints on the left.
- Monaco editor on the right.
- Log result button for console output. It should run the first sample test case only and must not mark completion.
- Evaluate button for running completion tests. It should run the full test set and mark completion only when all checks pass.
- Cmd/Ctrl+Enter evaluates tests.
- Console output and test results appear below the editor in one tabbed results panel.
- Approaches panel hidden until requested or completion.

Completion:

- All tests pass.

### 11.2 Debug Problems

Use for broken implementations.

UI:

- Prompt explains expected behavior and symptoms.
- Monaco editor starts with broken code.
- Optional hint buttons reveal bug categories.
- Same test results UI as code problems.

Completion:

- All tests pass.

### 11.3 Refactor Problems

Use for improving code without changing behavior.

UI:

- Read-only original code on the left.
- Editable learner code on the right.
- Monaco Diff Editor when practical.
- Test results and static check results.
- Goals panel listing refactor objectives.

Completion:

- All behavior tests pass.
- All static checks pass.

Keep static checks simple in v1. Do not build a full linter. Text-based and line-count checks are acceptable.

### 11.4 Trace Problems

Use for event loop, closures, recursion, async ordering, rendering order, and type narrowing reasoning.

UI:

- Read-only code snippet.
- Structured questions:
  - Ordered output list.
  - Final variable values.
  - Multiple-choice reasoning checks.
- For output-order questions, use reorderable rows if available; otherwise use numbered dropdowns.
- Submit button grades answers deterministically.
- Reveal explanation after correct submission or explicit reveal.

Completion:

- All structured answers are correct.

### 11.5 Written Problems

Use for conceptual explanations.

UI:

- Prompt.
- Textarea answer.
- Submit button.
- Reference answer reveal.
- Optional rubric checklist.

Completion:

- Learner submits an answer.
- Learner reveals reference answer.
- If a rubric exists, learner checks all rubric items.

### 11.6 Design Problems

Use for API design, data modeling, system design, architecture tradeoffs, and production readiness.

UI:

- Scenario panel.
- Structured tabs or sections:
  - Requirements.
  - API shape.
  - Data model.
  - Edge cases.
  - Tradeoffs.
  - Final recommendation.
- Endpoint-list section should let users add method/path/description rows.
- Entity-list section should let users add entity/table name, fields, and relationships.
- Tradeoff section should use checkbox or segmented choices with rationale.
- Reference answer reveal.
- Rubric checklist.

Completion:

- All required sections have some content.
- Reference answer has been revealed.
- All rubric items have been reviewed.

Do not claim design answers are automatically correct. The app should frame design completion as guided self-review.

## 12. Runtime Execution

### 12.1 Shared Harness

Create `src/runtime/testHarness.ts`.

Responsibilities:

- `deepEqual(a, b)` for primitives, arrays, and plain objects.
- Stable display formatting for expected/actual values.
- Shared result types:

```typescript
export type TestResult = {
  name: string
  passed: boolean
  error?: string
  expected?: unknown
  actual?: unknown
}

export type RunOutcome = {
  results: TestResult[]
  logs: string[]
  fatal?: string
}
```

### 12.2 JavaScript/TypeScript Runner

Files:

- `src/runtime/jsRunner.ts`
- `src/runtime/jsWorker.ts`

Requirements:

- Run user TypeScript in a dedicated Web Worker.
- Use Sucrase to transpile TypeScript to JavaScript.
- Strip import/export statements so user code evaluates as a script body.
- Invoke the target function once per test case.
- Compare actual vs expected with `deepEqual`.
- Capture `console.log` messages where practical.
- Return fatal errors cleanly.
- Enforce 5000ms timeout by terminating the worker.

Security notes:

- A Web Worker is an isolation boundary for the UI thread, not a full security sandbox.
- The timeout protects app responsiveness.
- Avoid exposing app internals to the worker.

### 12.3 Future Python Curriculum and Runner

Python is intentionally out of scope for the current TypeScript-focused product. The current curriculum targets TypeScript, JavaScript runtime behavior, React, and TypeScript backend/data work, so Python should not appear as a tacked-on language toggle.

Future Python support should be introduced as a parallel curriculum with its own learning path, problem content, runtime constraints, and QA plan.

Potential future requirements:

- Add a dedicated Python curriculum rather than mixing Python into TypeScript lessons.
- Add a Pyodide-backed runner only after the Python curriculum has concrete problem requirements.
- Prefer worker-backed execution with timeout behavior before exposing Python exercises.

### 12.4 Static Checks

File:

- `src/runtime/staticChecks.ts`

Implement deterministic checks:

- Required text present.
- Forbidden text absent.
- Maximum non-empty line count.
- No obvious `any`.
- No direct mutation of named inputs through simple pattern checks.

Static checks are guardrails, not a substitute for human review.

### 12.5 Trace Grader

File:

- `src/runtime/traceGrader.ts`

Implement deterministic grading for:

- Output order arrays.
- Final values.
- Multiple-choice answers.

Normalize trivial whitespace for string answers.

### 12.6 TypeScript Diagnostic Grader

The Sucrase runtime runner removes TypeScript syntax before executing learner
code. It does not prove that the submitted code is type-safe. Before authoring
the type-system lessons beginning with lesson 25, add a browser-side diagnostic
grader that runs independently from the runtime runner.

Requirements:

- Evaluate learner code under a fixed, documented strict TypeScript
  configuration.
- Run the grader in a Web Worker so type analysis does not block the interface.
- Use isolated virtual source files so one problem cannot affect another.
- Report readable compiler diagnostics with source locations.
- Support hidden type-test fixtures that assert expected input, output, and
  inferred types.
- Support intentionally invalid examples through `@ts-expect-error` or an
  equivalent expected-diagnostic contract, and fail when an expected error is
  missing.
- Treat unexpected compiler diagnostics as failures.
- Run ordinary behavior tests as well when a problem has meaningful runtime
  behavior.
- Keep source-text static checks as additional guardrails only. A check such as
  `no-any` must not be presented as proof that the complete type contract is
  correct.

Prefer reusing the TypeScript language service already shipped with Monaco if
it can provide deterministic diagnostics in an isolated worker. If that path
couples grading too closely to editor state, use the TypeScript compiler with a
small virtual file system in a lazily loaded worker. Record the exact compiler
version and compiler options used by each authored problem set.

Implementation notes (grader shipped):

- `src/runtime/typeGrader.ts` runs the TypeScript compiler over a virtual file
  system, decoupled from Monaco. The fixed strict options live in
  `TYPE_GRADER_COMPILER_OPTIONS`, and every result records the compiler
  version. The grader core is environment-agnostic and unit-tested in Node.
- `src/runtime/typeWorker.ts` bundles the ES lib chain (no DOM) as raw text and
  runs the grader in a dedicated worker; `src/runtime/typeRunner.ts` keeps one
  worker alive across checks with a timeout that discards a hung worker. The
  typescript package must never be imported into the main bundle.
- Problems opt in through an optional `typeFixture` string on code, debug, and
  refactor problems: a hidden fixture compiled below the submission in the same
  module, using type-level assertions and `@ts-expect-error` markers. An
  unsatisfied marker fails through the compiler's own TS2578 diagnostic. When a
  fixture is present, completion requires clean diagnostics in addition to the
  problem's behavior tests and static checks.

Completion rules:

- Runtime-focused problems complete after their deterministic trace answers or
  behavior tests pass.
- Type-only problems complete after all compiler diagnostics and hidden type
  tests match the expected result.
- Problems that cross the compile-time/runtime boundary complete only after
  both type checks and behavior tests pass.
- Written and design explanations remain guided self-review. Do not claim that
  prose or architectural judgment has been automatically verified.

## 13. MDX Lesson Rendering

Add `src/mdx.d.ts`:

```typescript
declare module '*.mdx' {
  import type { ComponentType } from 'react'
  const component: ComponentType
  export default component
}
```

Create `Mdx.tsx` that maps MDX elements to styled components:

- `h1`, `h2`, `h3`
- `p`
- `ul`, `ol`, `li`
- `pre`, `code`
- `blockquote`
- `table`
- `a`

Add a reusable `TerminalTranscript` MDX component for commands, console output,
compiler diagnostics, and error messages shown in concept pages. Reuse the same
visual language in the runnable problem console where practical.

`TerminalTranscript` requirements:

- Render a familiar terminal surface with monospaced text, a restrained header,
  and clear prompt, standard output, warning, and error treatments.
- Accept structured lines rather than a preformatted HTML string.
- Preserve whitespace and output order, allow text selection and copying, and
  scroll horizontally on narrow screens.
- Use semantic text markup and an accessible label or caption. Color must not be
  the only way output kinds are distinguished.
- Remain a presentation component. Do not imply that it is a real shell or
  accept command input unless an actual interactive terminal becomes a future
  curriculum requirement.
- Prefer an in-house React component over a terminal-emulation dependency for
  static transcripts and captured console output.

Concept pages should be readable, dense, and useful. Avoid marketing-style hero sections.

## 14. UI and Layout Requirements

### 14.1 Visual Direction

The product should feel like a focused technical learning environment:

- Dense but readable.
- Quiet and utilitarian.
- Clear progress indicators.
- Fast navigation.
- No decorative hero sections.
- No large marketing panels.

### 14.2 App Shell

Desktop:

- Fixed left sidebar for tracks, lessons, and problems.
- Main content area with constrained reading width on concept pages.
- Split-pane workspace on problem pages.

Mobile:

- Hide sidebar.
- Provide sheet-based navigation.
- Stack prompt, editor, and results vertically.

### 14.3 Progress and Curriculum Map

Add a progress overview interface for users who want to choose their own path.

The progress page should show:

- Overall completion percentage.
- Track-level completion percentages.
- Completed, in-progress, untouched, recommended, and ahead-of-path counts.
- A searchable/filterable curriculum map grouped by track.
- Lesson rows or cards with title, summary, progress, status, estimated time, and problem count.
- A primary action to continue the guided recommendation.

The home page should remain simple:

- Prominent continue button.
- Recommended next lesson.
- Track progress overview.
- Link to the full progress/curriculum map.

Use prerequisite notices for lessons ahead of the recommended path. The notice should explain what the guided path would cover first, while still allowing the user to continue.

### 14.4 shadcn/ui Components

Generate/copy at least:

- button
- card
- tabs
- popover
- dropdown-menu
- sheet
- badge
- progress
- separator
- scroll-area
- textarea
- sonner
- tooltip
- dialog
- checkbox
- input
- select

Use lucide-react icons for:

- Lock
- Circle
- Check
- Play
- RotateCcw
- BookOpen
- Code
- Bug
- Wrench
- ListChecks
- PencilLine
- Network
- Moon/Sun

### 14.5 Theme

Use:

- Tailwind CSS 4.
- CSS custom properties.
- OKLCH color values.
- `next-themes`.
- Geist variable font.

Provide light and dark themes.

## 15. Curriculum Plan

Build approximately 60 lessons grouped into 5 tracks.

Each lesson should include:

- 1 MDX concept page.
- A problem set shaped by the track and lesson skill, not a universal `code` / `written` / `design` template.
- 2 to 4 problems for most lessons, with 3 as the default target when the topic supports it.
- At least 1 auto-graded problem when the topic supports it.
- Algorithmic Problem Solving lessons should be code-heavy: at least 2 TypeScript coding problems, preferably 3 for broad patterns, while still allowing written or design review prompts when they add value.
- Reference approaches or reference answers.
- Estimated completion time.

### 15.1 Lesson Problem Progression

Most lessons should use a small progression of problems rather than a single broad exercise.

Default progression:

1. Foundation
   Tests the core concept directly. It should be approachable immediately after reading the lesson and should isolate the main pattern or idea.
2. Applied
   Uses the same concept with realistic constraints, edge cases, or composition with another familiar skill. It should require the learner to recognize when and how to adapt the concept.
3. Interview-depth
   Requires deeper reasoning, tradeoff analysis, or a harder variant. It should resemble the level of ambiguity or edge-case handling expected in a real interview.
4. Optional extension
   Use only when it adds a genuinely different angle. Prefer `debug`, `refactor`, `trace`, `written`, or `design` for the fourth problem rather than another near-duplicate implementation task.

Use 2 problems for narrow topics where a third problem would become repetitive. Use 4 problems only when the fourth problem tests a distinct subskill, failure mode, or interview-relevant tradeoff.

Do not add extra problems merely to increase count. Every problem must have a clear learning purpose and must not be a near-duplicate of another problem in the same lesson.

Do not force every lesson into a `code` / `written` / `design` sequence. The problem kind should match the skill being taught:

- Use `code` when implementation practice is the core interview signal.
- Use `debug` when the lesson is about recognizing and fixing failure modes.
- Use `trace` when the learner needs to reason through execution order, runtime state, recursion, async behavior, or render/effect ordering.
- Use `refactor` when the lesson is about improving structure without changing behavior.
- Use `written` when the interview signal is explanation, tradeoff articulation, security judgment, or testing strategy.
- Use `design` when the lesson asks for API shape, state architecture, data modeling, system boundaries, or production tradeoffs.

Algorithm lessons are the main exception to the 2-to-4 default. They may use 5 practice items when the lesson benefits from 3 distinct code problems plus written/design review. The code problems should still be meaningfully different: foundation, applied, and interview-depth should not be simple wording variants of the same task.

Example progression for sliding window:

1. Foundation: maximum sum of a fixed-size subarray.
2. Applied: longest substring without repeating characters.
3. Interview-depth: minimum window substring.
4. Optional debug: fix a shrinking-window bug.

This is preferable to three fixed-window variants that only change the wording, because each problem introduces a different reasoning step.

### 15.2 Lesson Authoring Principles

Write for a learner meeting the concept for the first time, who is comfortable with basic
TypeScript and nothing else. The lesson voice is a teacher walking a student through a new
idea, not one engineer talking to another. Three hallmarks govern every lesson, and they
override any principle below that conflicts with them:

- **Clear, non-technical language wherever possible.** Define every term of art in plain
  words the first time it appears. If the curriculum has not taught a term yet, teach it in
  place or avoid it.
- **Logically scaffolded explanations.** Open with a concrete problem before naming the
  technique that solves it. Connect each section to the one before it with a sentence. Give
  the hardest idea in the lesson the most words, walked through on a concrete input; one
  asserted sentence is never enough for the lesson's subtlest step.
- **Natural, human-sounding prose.** Before writing, read
  `src/curriculum/lessons/16-dynamic-programming-fundamentals/concept.mdx` and match its
  voice. Write connected paragraphs with varied sentence rhythm, so the lesson reads as
  teaching rather than as a reference card of labeled fragments.

Use these principles when replacing placeholder lessons with final curriculum content:

- Prefer concrete, runnable TypeScript examples over pseudo-code. Avoid placeholder bodies, ellipses, `TODO` comments, and comments that stand in for behavior.
- Prefer interview-realistic problems based on commonly reported public patterns and practical engineering scenarios. Learner fit, scaffolding, and progressive difficulty are more important than exact company provenance.
- Do not claim a problem was asked by a specific company unless the lesson records a reliable public source. Avoid copying proprietary, confidential, or paywalled prompts; adapt wording, constraints, examples, and tests to the lesson goal.
- Before explaining when to choose a pattern, give a realistic prompt that would call for that pattern. The following code example should solve that prompt or a directly related version of it.
- Ground every concept example in concrete input values and the exact expected output. Weave them into the surrounding explanation in whatever order teaches best; a fixed "Example input / Example output" label format is not required and tends to flatten the prose.
- When introducing a representation, key, invariant, or data structure, show both how it is created and how it is used. For example, a hash key section should show the key construction and the `Map` or `Set` lookup that uses it.
- Explain compact encodings before relying on them. If a string, tuple, bit mask, count array, or serialized key represents something meaningful, spell out how to read it.
- State assumptions before they matter, especially input shape, casing, ordering guarantees, mutation expectations, and runtime complexity targets.
- Keep examples small, complete, and self-contained. Define setup values before using them, and prefer a short named function over a detached snippet when the reader needs inputs, output, control flow, and return behavior.
- Add a simple diagram after the initial explanation when a visual representation would make the concept easier to understand. Diagrams are especially useful for spatial relationships, data-structure shape, pointer or boundary movement, and branching control flow. Include them only when they clarify the lesson; do not add decorative or repetitive visuals.
- Use narrated comments in teaching examples and reference approaches. Each comment states the reasoning step a teacher would say aloud to someone new to the idea, and the code below it performs that step.
- Use plain, literal language in comments and explanations. Prefer direct phrases such as "decrease the required count" over metaphorical wording.
- Pair abstract language with an immediate example. If the lesson says "preserve an invariant", name the invariant in plain English and show the update that maintains it.
- For JavaScript runtime topics, begin with a small behavior question or failure,
  then explain the mental model that causes it. Prefer examples the learner can
  trace completely over language-trivia puzzles.
- Distinguish compile-time behavior from runtime behavior explicitly. State
  whether an example produces a TypeScript diagnostic, throws at runtime, logs a
  value, or returns a value, and show that result next to the example.
- State environment assumptions when they affect behavior, including module
  versus script execution, strict mode, browser versus Node.js APIs, and relevant
  TypeScript compiler options.
- For TypeScript topics, show what JavaScript remains after types are removed
  when that distinction affects safety. Reinforce that static types do not parse
  or validate external runtime data.
- Present JS/TS concepts in the order: concrete behavior or failure,
  plain-language mental model, minimal complete example, common failure mode,
  practical rule, then practice transition.
- Include concrete example inputs and expected outputs in code problem prompts, especially when the function returns arrays, tuples, null, or another shape that benefits from seeing the exact result.
- Prepopulate code problem starters with one sample `console.log(...)` call using the prompt's example input, so learners can inspect a concrete run immediately.
- Make output ordering deterministic for auto-graded problems. If multiple answers could be valid, either require a specific order in the prompt or choose a problem shape that avoids ambiguous equality.
- Teach the mistake as well as the method. Call out common failure modes such as missing default values, off-by-one updates, stale state, mutation leaks, unsafe narrowing, missing authorization checks, or unbounded memory.
- Keep each section connected to the practice path. The code, written prompt, and design prompt should exercise concepts that were introduced in the lesson text.
- Use reference approaches to model production-quality clarity, not only the shortest passing answer. Prefer readable names, explicit guards, and complexity notes.
- Avoid broad survey writing. Each lesson should focus on the decisions the learner needs for the attached problems, with links between concept, examples, edge cases, and practice.
- Use language-tagged code fences such as `ts` for TypeScript examples so MDX code highlighting can improve readability.
- Use pseudo-code only when real TypeScript would distract from the point. If pseudo-code is necessary, label it explicitly and keep it out of runnable-looking code fences.

### 15.3 Lesson Content Review Checklist

Before treating a lesson as authored, check the following:

- The concept page names the core pattern, shows self-contained examples, and does not reference undefined variables or prior context.
- Every term of art is defined in plain words before its first use, or replaced with plain language.
- Every code block is preceded by prose explaining the problem it solves, and no section opens cold on an example label.
- The lesson's hardest idea is walked through on a concrete input, not asserted in a sentence or two.
- When a visual representation would aid understanding, the concept page includes a simple diagram immediately after the initial explanation. The diagram has a plain-language caption, works in light and dark themes, remains contained on mobile, and does not rely on visual details alone to convey required information.
- Practice problems map to recognizable interview patterns or practical engineering scenarios without making unsupported company-specific claims.
- Pattern-selection sections include a concrete prompt example before the related code.
- Prompt-rooted concept examples include concrete input before the function and expected output after the function.
- Longer code examples use whiteboard-style comments to break the solution into reasoning steps, invariants, key construction, pointer movement, or state updates.
- Comments and explanations use plain, literal wording and avoid idioms that could obscure the algorithm.
- Code problem prompts include concrete example inputs and expected outputs, including exact return shape and ordering when relevant.
- Starter code exports the required function and includes one sample `console.log(...)` call using the prompt's example input.
- Auto-graded tests cover the main happy path, empty or minimal inputs, duplicate or repeated values when relevant, and at least one edge case that prevents a naive solution.
- Expected outputs are deterministic. If multiple answers could be valid, the prompt defines the required ordering or the problem is reshaped.
- JS/TS examples label compiler diagnostics, runtime errors, console output, and
  returned values accurately rather than grouping them under a generic result.
- JS/TS lessons state the execution environment and compiler assumptions that
  affect the examples.
- Runtime lessons test prediction and debugging without relying on obscure
  language trivia. Type-system lessons use real compiler diagnostics rather than
  runtime tests or text checks alone.
- Problems involving external data test malformed runtime inputs even when the
  submitted TypeScript passes all type checks.
- Reference approaches use readable TypeScript, include concise reasoning comments for non-obvious steps, and state time and space complexity.
- Reference material discusses time and space complexity when it is meaningful;
  otherwise it explains the relevant safety guarantee, runtime behavior, API
  tradeoff, or failure mode instead of forcing an empty complexity note.
- Written and design problems include reference answers or rubrics that connect directly to the lesson text.
- Run the targeted lesson test, then `bun run lint`, `bun run test`, and `bun run build` before the checkpoint summary.

### Track 1: Algorithmic Problem Solving

1. Arrays and hashing
2. Two pointers
3. Sliding window
4. Prefix sums and difference arrays
5. Binary search
6. Sorting and comparison patterns
7. Stacks and monotonic stacks
8. Queues and deques
9. Linked lists
10. Trees and recursion
11. Binary search trees
12. Heaps and priority queues
13. Graph traversal
14. Graph shortest paths
15. Backtracking
16. Dynamic programming fundamentals
17. Advanced dynamic programming
18. Greedy algorithms
19. Big-O analysis and tradeoffs

Recommended problem mix:

- Default shape: `code`, `code`, `code`, with optional `debug`, `trace`, `written`, or `design` review when it adds a distinct skill.
- Mostly `code`; each lesson should have at least 2 TypeScript coding problems, and broad pattern lessons should usually have 3.
- Some `debug` for off-by-one and mutation bugs.
- Some `trace` for recursion and complexity reasoning.
- Written or design prompts may remain as review exercises, but they should not replace the coding-heavy core of this track.

### Track 2: JavaScript and TypeScript Core

20. JavaScript runtime fundamentals
21. Scope, closures, and prototypes
22. Event loop and task scheduling
23. Async patterns with promises
24. Cancellation, timeouts, and AbortController
25. TypeScript strict-mode fundamentals
26. Narrowing, unions, and discriminated unions
27. Generics and reusable abstractions
28. Utility types and mapped types
29. Conditional types and inference
30. Type-safe domain modeling
31. Runtime validation and parsing external data
32. Error handling with Result-style types

Recommended problem mix:

- Default shape: `trace` or `debug`, then `code` or `refactor`, then `written` when explanation matters.
- Runtime lessons should lean on `trace` and `debug` because the core skill is predicting execution behavior.
- Type-system lessons should lean on `code` and `refactor` because the core skill is shaping safer APIs and removing unsafe types.
- Use `written` for tradeoffs, mental models, and edge-case explanation.
- Use `design` sparingly; reserve it for domain modeling or API-boundary lessons where a design artifact is actually the interview signal.

Lesson structure and presentation:

- Runtime lessons should usually open with observable behavior, then build the
  call-stack, scope, prototype, task-queue, promise, or cancellation mental model
  needed to explain it.
- Type-system lessons should usually open with an unsafe value or API boundary,
  show what TypeScript accepts or rejects, and then refactor toward a safer
  contract.
- Use diagrams for scope and prototype chains, task and microtask timelines,
  promise flow, narrowing branches, and relationships between generic types when
  the visual removes meaningful cognitive load.
- Use terminal transcripts for console ordering, thrown errors, compiler output,
  and cancellation logs. Use ordinary syntax-highlighted code blocks for source
  code.
- Keep examples small and self-contained. Avoid tests based only on surprising
  coercion or syntax details unless the behavior prevents a realistic bug.

Default three-problem progression:

1. Foundation: a deterministic `trace` or focused `debug` problem that isolates
   the mental model taught by the lesson.
2. Applied: a `debug`, `code`, or `refactor` problem that places the same concept
   inside realistic code and adds relevant edge cases.
3. Interview-depth: a `refactor`, `code`, or selective `written` problem that
   tests API guarantees, tradeoffs, adaptation, or explanation.

Evaluation rules:

- Lessons 20 through 24 may use the existing trace grader and runtime behavior
  tests, with deterministic scheduling and output expectations.
- Do not author lessons 25 through 32 around the assumption that Sucrase or
  source-text static checks validate TypeScript types. Complete the TypeScript
  diagnostic grader first.
- Type-system code and refactor problems must pass compiler-backed type tests.
- Add runtime behavior tests when code produces values or handles external data;
  successful compilation alone is not sufficient at a runtime boundary.
- Use written self-review only when articulating the mental model or tradeoff is
  itself an interview signal.

### Track 3: React and Frontend Engineering

33. React component design
34. Props, state, and derived state
35. Hooks and custom hooks
36. Effects and synchronization
37. Forms and validation
38. Accessibility and keyboard UX
39. Client state vs server state
40. React performance and memoization
41. Routing and layout architecture
42. Browser storage and offline-friendly state
43. Browser networking and fetch patterns
44. Frontend security basics

Recommended problem mix:

- Default shape: `debug` or `trace`, then `refactor` or `code`, then `design` or `written`.
- Use `debug` for stale closures, bad effects, derived-state bugs, accessibility regressions, and mutation.
- Use `trace` for render/effect ordering and client state transitions.
- Use `refactor` for component extraction, hook design, prop API cleanup, and performance simplification.
- Use `design` for state architecture, routing/layout architecture, forms architecture, and client/server state boundaries.
- Use `written` for accessibility, browser security, networking, and tradeoff explanations.

### Track 4: Backend TypeScript and Data

45. Node.js runtime fundamentals
46. HTTP APIs and request lifecycle
47. API design and resource modeling
48. Authentication and authorization
49. SQL fundamentals
50. Schema design and relationships
51. Indexes and query performance
52. Transactions and consistency
53. Migrations and data evolution
54. Caching and rate limiting

Recommended problem mix:

- Default shape: `code`, then `design`, then `written` or `debug`.
- Use `code` for validators, serializers, request handlers, authorization guards, query builders, migration transforms, and small service functions.
- Use `design` for API resource modeling, schema relationships, transaction boundaries, indexes, caching strategy, and rate-limit design.
- Use `debug` for transaction bugs, missing authorization checks, data consistency issues, and query performance mistakes.
- Use `trace` for async request lifecycle and Node.js runtime behavior.
- Use `written` for auth/security tradeoffs, data evolution risks, and consistency guarantees.

### Track 5: Testing, Design, and Production Readiness

55. Unit testing strategy
56. Integration and contract testing
57. End-to-end testing
58. Debugging and refactoring legacy code
59. SOLID and design patterns in TypeScript
60. System design capstone

Recommended problem mix:

- Default shape: `debug` or `refactor`, then `written`, then `design`.
- Use `debug` for failing tests, flaky assumptions, brittle integrations, and production incident reasoning.
- Use `refactor` for legacy cleanup, testability improvements, SOLID/design-pattern exercises, and behavior-preserving changes.
- Use `written` for testing strategy, debugging process, and production-readiness tradeoffs.
- Use `design` for system design, architecture capstones, observability, reliability, and rollout planning.
- Use `code` only when implementation is the point of the lesson, such as writing a test helper, refactoring a module, or implementing a small pattern.

## 16. Lesson Authoring Template

Each lesson directory should follow this structure:

```text
src/curriculum/lessons/NN-topic-slug/
  concept.mdx
  index.ts
```

`index.ts` pattern:

```typescript
import Concept from './concept.mdx'
import type { Lesson } from '../../types'

export const lesson: Lesson = {
  slug: 'arrays-and-hashing',
  title: 'Arrays and Hashing',
  summary: 'Use arrays, objects, maps, and sets to solve frequency and lookup problems.',
  track: 'algorithms',
  order: 1,
  concept: Concept,
  problems: [
    // problems
  ],
  approaches: {
    // problemId: approaches
  },
}
```

Concept MDX should include:

- What the pattern is.
- When to reach for it.
- Common interview signals.
- Common mistakes.
- TypeScript-specific notes where relevant.
- A short worked example.
- Transition to practice.

## 17. Implementation Phases

### Phase 0: Project Scaffold

Tasks:

- Initialize Vite React TypeScript project.
- Install required dependencies.
- Configure Vite with React, Tailwind, and MDX plugins.
- Configure Tailwind CSS 4.
- Configure shadcn/ui.
- Configure Clerk and Convex dependencies.
- Configure Geist font.
- Configure ESLint flat config.
- Add base `tsconfig` settings.
- Add `.env.example` with required frontend environment variables.
- Add app root, router, providers, and global styles.

Acceptance criteria:

- `npm run dev` starts.
- `npm run build` completes with a placeholder app.
- `npm run lint` runs.

### Phase 1: App Shell and Routing

Tasks:

- Create routes.
- Build app shell.
- Build dashboard layout.
- Build progress/curriculum map page layout.
- Build concept page layout.
- Build problem page layout.
- Add not found page.
- Add dark mode.
- Add toast provider.
- Add Clerk provider shell.
- Add Convex provider shell.
- Add signed-out/sign-in controls and signed-in user menu.

Acceptance criteria:

- All routes render.
- Mobile and desktop layouts are usable.
- Theme toggle works.
- App runs in guest mode without configured authenticated data.

### Phase 2: Curriculum Types and Registry

Tasks:

- Implement expanded curriculum types.
- Implement track registry.
- Implement lesson registry.
- Add placeholder lessons for all 60 lessons.
- Add `mdx.d.ts`.
- Add basic MDX renderer.

Acceptance criteria:

- Dashboard lists all tracks and lessons.
- Concept pages render MDX.
- Build succeeds with all lesson imports.

### Phase 3: Progress and Guided Path

Tasks:

- Implement progress state.
- Implement versioned guest localStorage load/save.
- Implement versioned authenticated localStorage cache load/save.
- Implement guided-path pure functions.
- Implement completion queries.
- Implement last visited state.
- Wire progress into dashboard/sidebar/problem navigation.

Acceptance criteria:

- Progress persists after reload.
- The app computes a guided recommended next lesson.
- Completion percentages update immediately.
- Guest progress and authenticated cache are stored separately.

### Phase 3.5: Authentication, Cloud Sync, and Deployment Path

Tasks:

- Configure Clerk authentication.
- Configure Convex project files.
- Add Convex auth provider configuration for Clerk.
- Implement Convex schema for user progress and user settings.
- Implement Convex progress functions.
- Implement local/cloud progress merge logic.
- Implement sign-in merge from guest progress to cloud progress.
- Implement optimistic local updates with debounced cloud writes.
- Implement sync status UI.
- Add retry behavior for failed sync writes.
- Add deployment notes for environment variables, allowed origins, and redirect URLs.

Acceptance criteria:

- Signed-out users can use the app with guest local progress.
- Signed-in users sync progress to Convex.
- Signing in merges guest and cloud progress deterministically.
- Signing out returns to guest progress without exposing authenticated cache.
- Convex functions reject unauthenticated writes.
- Sync status accurately reports local, syncing, synced, and failed states.

### Phase 4: Code Execution Runtime

Tasks:

- Implement `deepEqual`.
- Implement JS/TS worker runner.
- Implement worker timeout.
- Implement console log capture.
- Implement shared runner facade.

Acceptance criteria:

- TypeScript code problems can run tests.
- Infinite loops in TypeScript are stopped by timeout.
- Runtime errors show readable messages.

### Phase 5: Code, Debug, and Refactor Problem Views

Tasks:

- Build `CodeEditor`.
- Build `DiffEditor`.
- Build `TestResults`.
- Build `StaticCheckResults`.
- Build `ApproachesPanel`.
- Build `CodeProblemView`.
- Build `DebugProblemView`.
- Build `RefactorProblemView`.
- Implement static checks.

Acceptance criteria:

- Code problems complete after all tests pass.
- Debug problems complete after all tests pass.
- Refactor problems complete after tests and static checks pass.
- Drafts autosave per problem and language.

### Phase 6: Trace, Written, and Design Problem Views

Tasks:

- Build `TraceProblemView`.
- Implement trace answer widgets.
- Implement `traceGrader`.
- Build `WrittenProblemView`.
- Build `DesignProblemView`.
- Build `RubricReview`.
- Implement reference answer reveal behavior.

Acceptance criteria:

- Trace problems grade deterministic answers.
- Written/design answers persist.
- Reference/rubric review completion works.

### Phase 7: Navigation and Learning Flow Polish

Tasks:

- Add previous/next problem navigation.
- Add continue button on home page.
- Add progress/curriculum map interactions.
- Add concept reference sheet in problem workspace.
- Add prerequisite notices for ahead-of-path lessons.
- Add toasts on completion and failed tests.
- Add empty/error states.

Acceptance criteria:

- User can move through the curriculum without dead ends.
- Guided and manual navigation flows are both clear.
- Ahead-of-path lessons are clearly labeled without blocking access.
- Completion produces clear feedback.

### Phase 8: Curriculum Content Pass

Tasks:

- Replace placeholder lessons with real MDX content.
- Add 2 to 4 problems per lesson.
- For Algorithmic Problem Solving lessons, add at least 2 and usually 3 distinct TypeScript coding problems before any written/design review prompts.
- For non-algorithm tracks, choose problem kinds from the track-specific mix instead of forcing a `code` / `written` / `design` sequence.
- Add test cases for code/debug/refactor problems.
- Add trace expected answers.
- Add written/design reference answers.
- Add approaches plus complexity notes or the more relevant safety, runtime,
  API, and failure-mode discussion for the lesson.
- Author JavaScript runtime lessons 20 through 24 using deterministic trace,
  debug, and runtime-test evaluation.
- Complete the TypeScript diagnostic grader before authoring type-system lessons
  25 through 32, then use compiler-backed type tests for their type-level claims.
- Add terminal transcripts and focused runtime/type diagrams where they improve
  understanding; do not add them as decoration.

#### Phase 8.1: JS/TS Shared Presentation Foundation

Tasks:

- Build `TerminalTranscript` with structured command, standard output, warning,
  and error lines.
- Register the component for use in MDX concept pages.
- Reuse the terminal visual language in the runnable problem console where
  practical.
- Extend the existing diagram system with only the shared primitives required by
  the JS/TS track.
- Verify keyboard access, text selection, copy behavior, responsive overflow,
  light and dark themes, and non-color output labels.
- Add focused component and rendering tests.

Checkpoint criteria:

- A small fixture demonstrates terminal transcripts and the shared diagram
  foundation without requiring authored JS/TS lessons.
- No terminal-emulation dependency is introduced for static transcripts.

#### Phase 8.2: Synchronous JavaScript Lessons

Author:

- Lesson 20: JavaScript runtime fundamentals.
- Lesson 21: Scope, closures, and prototypes.

Tasks:

- Establish the runtime-track lesson style with observable behavior before the
  mental-model explanation.
- Add call-stack, scope-chain, and prototype-chain diagrams only where they
  materially reduce explanation burden.
- Use small examples that the learner can trace completely.
- Use `trace`, `debug`, and `code` or `refactor` problems according to the
  track-specific progression.
- State module, strict-mode, and runtime assumptions wherever they affect the
  result.

Checkpoint criteria:

- Both lessons have complete concept content, deterministic practice paths, and
  reference material.
- Any new execution-trace presentation need is proven by authored content before
  a shared component is added.

#### Phase 8.3: Asynchronous JavaScript Lessons

Author:

- Lesson 22: Event loop and task scheduling.
- Lesson 23: Async patterns with promises.
- Lesson 24: Cancellation, timeouts, and `AbortController`.

Tasks:

- Prototype deterministic scheduling evaluation before relying on it in lesson
  problems.
- Prefer a small injected clock or scheduler helper when it is sufficient.
- Add `@sinonjs/fake-timers` only if repeated timer, promise, or cancellation
  tests demonstrate that the dependency removes meaningful custom complexity.
- Add an `ExecutionTimeline` component if the authored lessons need a shared
  representation of the call stack, microtasks, tasks, and output order.
- Test timeout, cancellation, cleanup, rejection, and output-order behavior
  without depending on wall-clock timing.

Checkpoint criteria:

- Lessons 20 through 24 are fully authored and evaluable with deterministic
  trace or runtime behavior checks.
- The scheduling-test strategy and any dependency decision are documented.

#### Phase 8.4: TypeScript Diagnostic Grader

Tasks:

- Extend the curriculum contract to represent compiler-backed type tests and
  combined type/runtime completion requirements.
- Add an isolated, lazily loaded TypeScript diagnostic worker using a virtual
  file system.
- Define and document the strict compiler configuration and TypeScript version
  used for grading.
- Compose learner code with hidden virtual type-test fixtures.
- Support positive type assertions, expected diagnostics, and intentionally
  invalid calls.
- Normalize diagnostic codes, messages, and source locations for stable learner
  feedback.
- Add a diagnostics results panel without coupling authoritative grading to
  Monaco editor state.
- Add worker, grader, completion, error-state, and interface tests.
- Measure the production bundle and confirm the compiler path loads only for
  problems that require it.

Vertical-slice fixture requirements:

- A correct type solution passes.
- An incorrect inferred type fails.
- An intentionally invalid call must be rejected.
- An unused `@ts-expect-error` fails.
- A combined problem can require both compiler-backed type tests and runtime
  behavior tests.

Checkpoint criteria:

- The complete fixture path works in the learner interface before lesson 25 is
  authored.
- Sucrase and text-based static checks are not treated as substitutes for the
  TypeScript compiler.

#### Phase 8.5: TypeScript Foundations Lessons

Author:

- Lesson 25: TypeScript strict-mode fundamentals.
- Lesson 26: Narrowing, unions, and discriminated unions.

Tasks:

- Validate the new diagnostic grader against real foundation and applied
  exercises.
- Prefer fixing unsafe values and APIs over isolated syntax questions.
- Pair compiler feedback with runtime tests when the code produces values or
  handles runtime inputs.
- Correct the problem contract or diagnostics interface here before authoring
  advanced type-system lessons.

Checkpoint criteria:

- Both lessons use compiler-backed evaluation for every type-level claim.
- Diagnostics are understandable without requiring the learner to interpret raw
  compiler output alone.

#### Phase 8.6: Reusable and Advanced Type Lessons

Author:

- Lesson 27: Generics and reusable abstractions.
- Lesson 28: Utility types and mapped types.
- Lesson 29: Conditional types and inference.

Tasks:

- Center exercises on readable API guarantees and reusable abstractions rather
  than type puzzles.
- Add inferred-type displays, type-flow diagrams, or source/result comparisons
  only when they clarify relationships that prose and code do not show well.
- Use hidden type tests to verify accepted inputs, rejected inputs, returned
  types, and inference behavior.

Checkpoint criteria:

- Each advanced construct is connected to a practical API or domain problem.
- Passing solutions demonstrate the intended type guarantee, not merely the
  required source text.

#### Phase 8.7: Domain Boundaries and JS/TS Module QA

Author:

- Lesson 30: Type-safe domain modeling.
- Lesson 31: Runtime validation and parsing external data.
- Lesson 32: Error handling with Result-style types.

Tasks:

- Combine compile-time guarantees with runtime parsing and behavior tests.
- Include malformed, missing, and unexpected external values in validation
  exercises.
- Use a design problem only when domain or API modeling is the interview signal.
- Run curriculum contract tests and verify every trace answer, type fixture,
  runtime test, completion path, and reference answer in lessons 20 through 32.
- Review diagnostic-worker failure and timeout handling, lazy-loading behavior,
  compiler-version consistency, and production bundle impact.
- Manually verify mobile layout, keyboard access, terminal transcripts, diagrams,
  editors, diagnostics, and light and dark themes.

Checkpoint criteria:

- All 13 JS/TS Core lessons are fully authored and have honest, working
  completion paths.
- Targeted tests, `bun run lint`, `bun run test`, and `bun run build` pass.

After each JS/TS Core phase, stop with a scoped diff and test summary so the
maintainer can review, commit, and push before work begins on the next phase.

Phase 8 acceptance criteria:

- All 60 lessons have meaningful content.
- All problems have valid completion paths.
- No lesson is empty.

### Phase 9: QA and Hardening

Tasks:

- Run build and lint.
- Manually test representative problems of each kind.
- Test progress persistence.
- Test guest progress.
- Test Clerk sign-in/sign-out.
- Test guest-to-cloud progress merge.
- Test authenticated progress sync across reloads.
- Test sync failure/retry UI.
- Test guided recommended-next behavior.
- Test ahead-of-path prerequisite notices.
- Test mobile layout.
- Test dark mode.
- Test JS worker timeout.

Acceptance criteria:

- `npm run build` passes.
- `npm run lint` passes or documented warnings are resolved.
- No known broken route.
- No known impossible problem.
- Authenticated sync has been manually verified in a deployed or deploy-like environment.

## 18. Suggested Multi-Agent Workstreams

Use these workstreams if splitting the build among agents.

### Agent A: Foundation and UI Shell

Owns:

- Project scaffold.
- Vite/Tailwind/shadcn setup.
- Routing.
- App shell.
- Theme.
- Dashboard.
- Sidebar.
- Shared UI components.

Dependencies:

- None initially.

Deliverables:

- Running app.
- Route skeletons.
- Responsive shell.

### Agent B: Curriculum and Content Model

Owns:

- Curriculum types.
- Track registry.
- Lesson registry.
- Lesson directory structure.
- Placeholder lesson generation.
- Final curriculum content.

Dependencies:

- Needs agreed `types.ts`.

Deliverables:

- All 60 lessons registered.
- MDX concept content.
- Problems and reference material.

### Agent C: Runtime and Grading

Owns:

- JS/TS runner.
- Web Worker.
- Test harness.
- Static checks.
- Trace grading.

Dependencies:

- Needs problem type definitions.

Deliverables:

- Working code execution.
- Working deterministic graders.
- Runtime error handling.

### Agent D: Problem Experiences

Owns:

- Problem renderer registry.
- Code/debug/refactor views.
- Trace/written/design views.
- Editor components.
- Results panels.
- Approaches/reference/rubric panels.

Dependencies:

- Needs app shell, progress API, and runtime API.

Deliverables:

- All problem types interactive.
- Completion logic wired.

### Agent E: State, Guidance, and QA

Owns:

- Progress state.
- Guest localStorage versioning.
- Authenticated cache versioning.
- Guided-path functions.
- Completion percentage.
- Manual QA.
- Build/lint verification.

Dependencies:

- Needs curriculum registry.

Deliverables:

- Persistent local progress.
- Correct guided recommendation behavior.
- QA checklist results.

### Agent F: Auth, Cloud Sync, and Deployment

Owns:

- Clerk setup.
- Convex setup.
- Convex schema and progress functions.
- Clerk/Convex auth integration.
- Guest-to-cloud merge logic.
- Sync status UI.
- Deployment environment documentation.

Dependencies:

- Needs progress state shape.
- Needs app provider shell.

Deliverables:

- Guest mode remains usable.
- Signed-in progress syncs through Convex.
- Authenticated writes are server-authorized.
- Deployment setup is documented.

## 19. Integration Contracts

Agents should coordinate through stable contracts.

### Runtime Contract

```typescript
export type RunRequest = {
  code: string
  functionName: string
  tests: TestCase[]
}

export type CodeRunner = (request: RunRequest) => Promise<RunOutcome>
```

### Problem View Contract

```typescript
export type ProblemViewProps<TProblem extends Problem = Problem> = {
  lesson: Lesson
  problem: TProblem
  problemKey: string
  isCompleted: boolean
  onComplete: () => void
}
```

### Progress Contract

```typescript
export type ProgressActions = {
  saveDraft: (lessonSlug: string, problemId: string, value: string) => void
  getDraft: (lessonSlug: string, problemId: string) => string | undefined
  markComplete: (lessonSlug: string, problemId: string) => void
}
```

Expand this contract as trace/design/written views are implemented.

### Learning Path Contract

```typescript
export type LessonStatus =
  | 'completed'
  | 'in-progress'
  | 'recommended'
  | 'ahead-of-path'
  | 'untouched'

export type LearningPathState = {
  recommendedLessonSlug: string
}
```

Guidance functions should be pure and should derive lesson status from the curriculum registry plus progress state.

### Sync Contract

```typescript
export type SyncStatus =
  | 'guest'
  | 'loading-cloud'
  | 'syncing'
  | 'synced'
  | 'saved-locally'
  | 'failed'

export type ProgressSyncAdapter = {
  status: SyncStatus
  isSignedIn: boolean
  userId?: string
  retry: () => Promise<void>
  mergeGuestIntoCloud: () => Promise<void>
}
```

The progress hook should expose sync status without making problem views depend directly on Clerk or Convex.

### Cloud Progress Contract

```typescript
export type CloudProgressRecord = {
  lessonSlug: string
  problemId: string
  completedAt?: number
  draft?: string
  traceAnswers?: unknown
  writtenAnswer?: string
  designAnswers?: unknown
  rubricReviews?: string[]
  revealedReferenceAt?: number
  updatedAt: number
}
```

Cloud functions must infer the authenticated user on the server. Client-provided `userId` values must not be accepted for reads or writes.

## 20. Testing Strategy

### Automated Checks

Required:

- `npm run build`
- `npm run lint`

Recommended if time allows:

- Unit tests for `deepEqual`.
- Unit tests for guided-path logic.
- Unit tests for lesson status derivation.
- Unit tests for trace grading.
- Unit tests for static checks.
- Unit tests for progress merge rules.
- Unit tests for localStorage key selection by auth state.

If adding a test runner, prefer Vitest because it fits Vite projects naturally. Do not add it unless the build scope allows.

### Manual QA Matrix

Test these flows:

- Fresh user opens dashboard.
- User starts first lesson.
- User completes a TypeScript code problem.
- User triggers a TypeScript runtime error.
- User triggers a TypeScript timeout.
- User completes a debug problem.
- User completes a refactor problem.
- User completes a trace problem.
- User completes a written problem.
- User completes a design problem.
- User reloads and progress persists.
- Signed-out user sees guest local progress.
- User signs in and guest progress merges into cloud progress.
- Signed-in user reloads and cloud progress is restored.
- User signs out and authenticated progress is not shown as guest progress.
- Sync write fails and retry UI appears.
- User opens an ahead-of-path lesson route directly and sees prerequisite guidance.
- User opens the progress page and filters by completion status.
- User selects an ahead-of-path lesson as focus and sees prerequisite guidance.
- User resets back to guided mode.
- User uses mobile navigation.
- User toggles dark/light theme.

## 21. Content Quality Standards

Each lesson should be:

- Accurate.
- Focused.
- Interview-relevant.
- Practical for TypeScript engineers.
- Short enough for a focused session.

Each problem should have:

- Clear instructions.
- A deterministic completion path or explicit self-review path.
- Starter material.
- Reference material.
- No hidden dependency on a backend.

Each problem is acceptable only if:

- It has a clear learning purpose.
- It tests a distinct subskill, failure mode, or interview-relevant tradeoff.
- It is not a near-duplicate of another problem in the same lesson.
- Its expected solution teaches a reusable pattern or judgment.
- Its difficulty matches its position in the lesson progression.
- It includes realistic edge cases.
- It includes a reference approach, reference answer, or rubric.
- Auto-graded problems have tests that catch the main incorrect approaches.

Code tests should include:

- Normal case.
- Edge case.
- Empty/minimal case where relevant.
- Duplicate or repeated value case where relevant.
- Larger case where relevant.

Design rubrics should include:

- Requirements coverage.
- Data shape/API shape correctness.
- Edge cases.
- Security/reliability considerations where relevant.
- Tradeoff clarity.

## 22. Known Risks and Mitigations

### Risk: Curriculum Scope Is Large

Mitigation:

- Build full infrastructure first.
- Start with placeholder content for all 60 lessons.
- Fill content track by track.
- Keep lesson content concise.

### Risk: Browser Code Execution Is Complex

Mitigation:

- Implement TypeScript runner first.
- Use a shared `RunOutcome`.
- Keep test cases JSON-serializable.

### Future Scope: Python Runtime

Python support should not be added as a language toggle inside the TypeScript curriculum.

Future requirements:

- Define a parallel Python curriculum first.
- Add Pyodide only after the Python content and runtime requirements are clear.
- Prefer worker-backed timeout handling before exposing Python exercises.

### Risk: Design Problems Cannot Be Fully Auto-Graded

Mitigation:

- Use structured prompts.
- Use reference answers.
- Use rubric self-review.
- Avoid pretending self-reviewed answers are objectively verified.

### Risk: Static Checks Become Too Ambitious

Mitigation:

- Keep checks simple.
- Use tests as the primary behavior guard.
- Treat static checks as educational nudges.

### Risk: Auth and Sync Increase Setup Complexity

Mitigation:

- Use Clerk and Convex rather than custom auth.
- Keep the backend limited to user progress and settings.
- Keep the curriculum static in the frontend.
- Document required environment variables and provider setup.

### Risk: Progress Merge Conflicts Are Confusing

Mitigation:

- Use deterministic merge rules.
- OR-merge irreversible learning actions such as completion and reference reveal.
- Use `updatedAt` for drafts and editable answers.
- Show sync status clearly.

### Risk: Authenticated Progress Leaks Into Guest Mode

Mitigation:

- Use separate localStorage keys for guest progress and authenticated cache.
- On sign-out, return to guest progress instead of copying user progress into the guest key.
- Do not store Clerk secrets or Convex server credentials in frontend code.

## 23. Definition of Done

The app is done when:

- `npm install` installs dependencies successfully.
- `npm run dev` serves the app.
- `npm run build` type-checks and bundles cleanly.
- `npm run lint` passes.
- All routes work.
- All 60 lessons are present and registered.
- Every lesson has MDX concept content.
- Every lesson has 2 to 4 practice problems, with 3 as the default unless the topic is too narrow to support 3 distinct high-quality exercises.
- Every included problem satisfies the content quality checklist.
- All problem kinds have working interactive views.
- TypeScript code execution works in a Web Worker.
- Guest progress persists to localStorage.
- Authenticated progress syncs to Convex.
- Clerk sign-in, sign-up, sign-out, and user menu flows work.
- Guest progress merges into cloud progress after sign-in.
- Authenticated progress is not exposed as guest progress after sign-out.
- Sync status and retry behavior work.
- The guided path recommends the next lesson by default.
- Users can view completed/in-progress/untouched lessons in a progress map.
- Ahead-of-path lessons show prerequisite guidance without hard-blocking access.
- Desktop and mobile layouts are usable.
- Light and dark themes work.
- Required deployment environment variables and provider setup are documented.
- A representative problem from each problem kind has been manually verified.

## 24. Recommended Build Order Summary

1. Scaffold the project and install dependencies.
2. Build shell, routes, theme, and shadcn/ui foundation.
3. Define curriculum/problem/progress types.
4. Add lesson registry and placeholder lessons.
5. Implement progress, guided-path, and last-visited logic.
6. Add Clerk, Convex, guest mode, cloud sync, and deployment setup.
7. Implement TypeScript runner and test harness.
8. Build code/debug/refactor views.
9. Implement trace/written/design views.
10. Fill curriculum content.
11. Polish navigation and responsive UX.
12. Run full QA and fix failures.

## 25. Agent Handoff Rule

Any agent taking this plan should first identify which workstream they own, then avoid editing unrelated areas unless required by an integration contract.

When changing shared contracts such as `curriculum/types.ts`, progress state, or runtime result types, update all dependent views in the same handoff or clearly document the required follow-up.
