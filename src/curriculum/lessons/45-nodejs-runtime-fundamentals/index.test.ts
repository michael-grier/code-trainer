import { transform } from 'sucrase'
import { describe, expect, it } from 'vitest'

import { runTestCases } from '@/runtime/testHarness'

import { lesson } from './index'

const runnableProblems = lesson.problems.flatMap((problem) =>
  problem.kind === 'code' || problem.kind === 'debug' ? [problem] : [],
)

// Compile a submission the same way the runtime runner does, then hand back
// its exported function. The module's top-level sample console.log runs on
// load, so a silent console is passed in to keep test output clean.
function loadFunction(code: string, functionName: string) {
  const compiled = transform(code, {
    transforms: ['typescript', 'imports'],
  }).code
  const module = { exports: {} as Record<string, unknown> }

  new Function('module', 'exports', 'console', compiled)(
    module,
    module.exports,
    { log: () => undefined },
  )

  const candidate = module.exports[functionName]

  if (typeof candidate !== 'function') {
    throw new Error(`code does not export function ${functionName}`)
  }

  return candidate as (...args: unknown[]) => unknown
}

describe('nodejs runtime fundamentals lesson', () => {
  it('progresses from the blocked trace through config and the leak to review', () => {
    expect(
      lesson.problems.map((problem) => `${problem.id}:${problem.kind}`),
    ).toEqual([
      'blocked-handler-trace:trace',
      'read-server-config:code',
      'fix-shared-request-state:debug',
      'blocking-handler-review:written',
    ])
  })

  it('gives the trace problem answerable structured questions', () => {
    const trace = lesson.problems.find((problem) => problem.kind === 'trace')

    if (trace?.kind !== 'trace') {
      throw new Error('expected a trace problem')
    }

    expect(trace.questions.length).toBeGreaterThanOrEqual(3)
    expect(trace.explanation.length).toBeGreaterThan(100)

    for (const question of trace.questions) {
      if (question.type === 'output-order') {
        expect(new Set(question.expected).size).toBe(question.expected.length)
        for (const line of question.expected) {
          expect(question.options).toContain(line)
        }
      }

      if (question.type === 'multiple-choice') {
        expect(question.options).toContain(question.answer)
      }
    }
  })

  it('shapes every runnable problem for the runner', () => {
    for (const problem of runnableProblems) {
      expect(problem.prompt).toContain('Example:')
      expect(
        problem.kind === 'code' ? problem.starter : problem.brokenCode,
      ).toContain('console.log')
      expect(problem.tests.length).toBeGreaterThanOrEqual(5)

      for (const test of problem.tests) {
        expect(JSON.parse(JSON.stringify(test.args))).toEqual(test.args)
        expect(JSON.parse(JSON.stringify(test.expected))).toEqual(test.expected)
      }

      if (problem.kind === 'debug') {
        expect(problem.bugHints?.length).toBeGreaterThan(0)
      }
    }
  })

  it('passes every test with the reference approach', async () => {
    for (const problem of runnableProblems) {
      const code = lesson.approaches[problem.id]?.[0]?.code ?? ''
      expect(code).toContain(`function ${problem.functionName}`)

      const results = await runTestCases(
        loadFunction(code, problem.functionName),
        problem.tests,
      )

      for (const result of results) {
        expect(
          result.status,
          `${problem.id} / ${result.name}: ${result.error ?? ''}`,
        ).toBe('passed')
      }
    }
  })

  it('fails at least one test with each starter and broken program', async () => {
    for (const problem of runnableProblems) {
      const code =
        problem.kind === 'code' ? problem.starter : problem.brokenCode
      const results = await runTestCases(
        loadFunction(code, problem.functionName),
        problem.tests,
      )

      expect(
        results.some((result) => result.status !== 'passed'),
        `${problem.id} should not already pass`,
      ).toBe(true)
    }
  })

  it('closes with a written review that has a reference answer and rubric', () => {
    const written = lesson.problems.filter(
      (problem) => problem.kind === 'written',
    )

    expect(written).toHaveLength(1)
    for (const problem of written) {
      expect(problem.referenceAnswer.length).toBeGreaterThan(300)
      expect(problem.rubric?.length).toBeGreaterThanOrEqual(3)
    }
  })
})
