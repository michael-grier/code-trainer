import { parseHTML } from 'linkedom'
import { transform } from 'sucrase'
import { beforeAll, describe, expect, it } from 'vitest'

import { deepEqual } from '@/runtime/deepEqual'

import { lesson } from './index'

// react-dom reads window and document at import time, so the linkedom
// globals must exist before the harness (which imports react-dom) loads.
// That forces dynamic imports from beforeAll instead of top-level ones.
let harness: typeof import('@/runtime/reactHarness')
let dom: import('@/runtime/reactHarness').HarnessDom

beforeAll(async () => {
  const parsed = parseHTML(
    '<!doctype html><html><body></body></html>',
  ) as unknown as {
    window: Window & { Event: typeof Event }
    document: Document
  }

  Object.assign(globalThis, {
    window: parsed.window,
    document: parsed.document,
  })

  const react = await import('react')
  Object.assign(globalThis, { __REACT__: react })

  dom = {
    document: parsed.document,
    createEvent: (type) => new parsed.window.Event(type, { bubbles: true }),
  }

  harness = await import('@/runtime/reactHarness')
})

const reactProblems = lesson.problems.flatMap((problem) =>
  problem.kind === 'react-code' ? [problem] : [],
)

const codeProblems = lesson.problems.flatMap((problem) =>
  problem.kind === 'code' ? [problem] : [],
)

// Compile a reference approach the same way the runtime runner does, then
// hand back its exported solution function so tests can execute it.
function loadSolutionFunction(code: string, functionName: string) {
  const compiled = transform(code, {
    transforms: ['typescript', 'imports'],
  }).code
  const module = { exports: {} as Record<string, unknown> }

  new Function('module', 'exports', compiled)(module, module.exports)

  const solution = module.exports[functionName]

  if (typeof solution !== 'function') {
    throw new Error(`approach code does not export function ${functionName}`)
  }

  return solution as (...args: unknown[]) => unknown
}

describe('accessibility and keyboard ux lesson', () => {
  it('progresses from naming through keyboard logic to design and review', () => {
    expect(
      lesson.problems.map((problem) => `${problem.id}:${problem.kind}`),
    ).toEqual([
      'name-the-waitlist-form:react-code',
      'roving-focus-index:code',
      'dropdown-a11y-design:design',
      'semantics-review:written',
    ])
  })

  it('gives the code problem runnable tests and a passing reference approach', () => {
    for (const problem of codeProblems) {
      expect(problem.prompt).toContain('Example:')
      expect(problem.starter).toContain('console.log')
      expect(problem.tests.length).toBeGreaterThanOrEqual(5)

      for (const test of problem.tests) {
        expect(JSON.parse(JSON.stringify(test.args))).toEqual(test.args)
        expect(JSON.parse(JSON.stringify(test.expected))).toEqual(test.expected)
      }

      const solution = loadSolutionFunction(
        lesson.approaches[problem.id]?.[0]?.code ?? '',
        problem.functionName,
      )

      for (const test of problem.tests) {
        const actual = solution(...structuredClone(test.args))
        expect(
          deepEqual(actual, test.expected),
          `${problem.id} / ${test.name}`,
        ).toBe(true)
      }
    }
  })

  it('gives every react problem a starter, enough tests, and a reference approach', () => {
    expect(reactProblems).toHaveLength(1)

    for (const problem of reactProblems) {
      expect(problem.prompt).toContain('Example:')
      expect(problem.starter).toContain(`function ${problem.componentName}`)
      expect(problem.tests.length).toBeGreaterThanOrEqual(5)
      expect(lesson.approaches[problem.id]?.[0]?.code).toContain(
        `function ${problem.componentName}`,
      )

      // Test specs must survive the JSON round-trip the app stores them as.
      for (const test of problem.tests) {
        expect(JSON.parse(JSON.stringify(test))).toEqual(test)
      }
    }
  })

  it('backs the design problem with sections, a rubric, and a reference answer', () => {
    const design = lesson.problems.find((problem) => problem.kind === 'design')

    if (design?.kind !== 'design') {
      throw new Error('expected a design problem')
    }

    expect(design.sections.length).toBeGreaterThanOrEqual(3)
    expect(design.rubric.length).toBeGreaterThanOrEqual(4)
    expect(design.referenceAnswer.length).toBeGreaterThan(500)
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

  it('passes every rendered test with the reference approach', async () => {
    for (const problem of reactProblems) {
      const approachCode = lesson.approaches[problem.id]?.[0]?.code ?? ''
      const Component = harness.loadReactComponent(
        approachCode,
        problem.componentName,
      )
      const results = await harness.runReactTestCases(
        Component,
        problem.tests,
        dom,
      )

      for (const result of results) {
        expect(
          result.status,
          `${problem.id} / ${result.name}: ${result.error ?? ''}`,
        ).toBe('passed')
      }
    }
  })

  it('fails at least one rendered test with each starter', async () => {
    for (const problem of reactProblems) {
      const Component = harness.loadReactComponent(
        problem.starter,
        problem.componentName,
      )
      const results = await harness.runReactTestCases(
        Component,
        problem.tests,
        dom,
      )

      expect(
        results.some((result) => result.status !== 'passed'),
        `${problem.id} starter should not already pass`,
      ).toBe(true)
    }
  })
})
