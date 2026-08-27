import type { ComponentType } from 'react'

export type ProblemKind =
  | 'code'
  | 'debug'
  | 'refactor'
  | 'react-code'
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
  // Type-test fixture compiled below the submission under the fixed strict
  // compiler options. When present, completion also requires a clean type
  // check. "Hidden" means not displayed in the problem UI, not secret: all
  // grading in this app is client-side by design (build plan section 21
  // forbids backend dependencies), exactly like test expectations and
  // reference approaches. See src/runtime/typeGrader.ts.
  typeFixture?: string
}

export type DebugProblem = BaseProblem & {
  kind: 'debug'
  completionMode: 'all-tests-pass'
  functionName: string
  brokenCode: string
  tests: TestCase[]
  bugHints?: string[]
  typeFixture?: string
}

// One interaction applied to the rendered component. Steps are declarative
// and JSON-serializable so problems can be authored as data.
export type ReactTestStep =
  | { action: 'click'; text: string }
  | { action: 'type'; into: string; value: string }

export type ReactExpectation =
  | { type: 'text-present'; text: string }
  | { type: 'text-absent'; text: string }

export type ReactTestCase = {
  name: string
  props?: Record<string, unknown>
  steps?: ReactTestStep[]
  expect: ReactExpectation[]
}

export type ReactCodeProblem = BaseProblem & {
  kind: 'react-code'
  completionMode: 'all-tests-pass'
  componentName: string
  starter: string
  tests: ReactTestCase[]
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
  typeFixture?: string
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
  | {
      id: string
      type: 'tradeoff'
      label: string
      prompt: string
      options: string[]
    }

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
  | ReactCodeProblem
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
