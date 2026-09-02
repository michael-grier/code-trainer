import { parseHTML } from 'linkedom'
import { beforeAll, describe, expect, it } from 'vitest'

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

describe('react component design lesson', () => {
  it('progresses from the API fix through ownership to design and review', () => {
    expect(
      lesson.problems.map((problem) => `${problem.id}:${problem.kind}`),
    ).toEqual([
      'alert-kind-union:react-code',
      'product-shelf-ownership:react-code',
      'notification-system-design:design',
      'component-api-review:written',
    ])
  })

  it('gives every react problem a starter, enough tests, and a reference approach', () => {
    expect(reactProblems).toHaveLength(2)

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
