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

describe('schema design and relationships lesson', () => {
  it('progresses from normalization through delete planning to design and review', () => {
    expect(
      lesson.problems.map((problem) => `${problem.id}:${problem.kind}`),
    ).toEqual([
      'normalize-order-rows:code',
      'plan-delete:code',
      'book-club-schema-design:design',
      'snapshot-or-anomaly-review:written',
    ])
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
    }
  })

  it('passes every test with the reference approach', async () => {
    for (const problem of runnableProblems) {
      const code = lesson.approaches[problem.id]?.[0]?.code ?? ''
      expect(code).toContain(`function ${problem.functionName}`)

      // Clone so a submission that mutates its arguments cannot corrupt the
      // fixtures the next run reads.
      const results = await runTestCases(
        loadFunction(code, problem.functionName),
        structuredClone(problem.tests),
      )

      for (const result of results) {
        expect(
          result.status,
          `${problem.id} / ${result.name}: ${result.error ?? ''}`,
        ).toBe('passed')
      }
    }
  })

  it('fails at least one test with each starter', async () => {
    for (const problem of runnableProblems) {
      const code =
        problem.kind === 'code' ? problem.starter : problem.brokenCode
      const results = await runTestCases(
        loadFunction(code, problem.functionName),
        structuredClone(problem.tests),
      )

      expect(
        results.some((result) => result.status !== 'passed'),
        `${problem.id} should not already pass`,
      ).toBe(true)
    }
  })

  it('grounds the design problem in lesson-taught criteria', () => {
    const design = lesson.problems.find((problem) => problem.kind === 'design')

    if (design?.kind !== 'design') {
      throw new Error('expected a design problem')
    }

    expect(design.scenario.length).toBeGreaterThan(100)
    expect(design.rubric.length).toBeGreaterThanOrEqual(4)
    expect(design.referenceAnswer.length).toBeGreaterThan(500)

    const sectionTypes = design.sections.map((section) => section.type)
    expect(sectionTypes).toContain('entity-list')
    expect(sectionTypes).toContain('tradeoff')

    for (const section of design.sections) {
      if (section.type === 'tradeoff') {
        expect(section.options.length).toBeGreaterThanOrEqual(2)
      }
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
