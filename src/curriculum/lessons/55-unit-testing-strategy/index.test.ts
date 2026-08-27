import { describe, expect, it } from 'vitest'

import { runStaticChecks } from '@/runtime/staticChecks'

import { lesson } from './index'

describe('unit testing strategy lesson', () => {
  it('moves from debugging through refactoring to strategy and planning', () => {
    expect(
      lesson.problems.map((problem) => `${problem.id}:${problem.kind}`),
    ).toEqual([
      'time-formatter-hidden-clock:debug',
      'inject-retry-jitter:refactor',
      'choose-what-to-test:written',
      'discount-engine-test-plan:design',
    ])
  })

  it('keeps the debug problem deterministic to diagnose and fix', () => {
    const debug = lesson.problems.find((problem) => problem.kind === 'debug')

    if (debug?.kind !== 'debug') {
      throw new Error('expected a debug problem')
    }

    // The planted bug is the hidden clock read the lesson warns about.
    expect(debug.brokenCode).toContain('Date.now')
    expect(debug.brokenCode).toContain('console.log')
    expect(debug.tests.length).toBeGreaterThanOrEqual(5)
    expect(debug.bugHints?.length).toBeGreaterThan(0)

    const approach = lesson.approaches[debug.id]?.[0]
    expect(approach?.code).toContain(`function ${debug.functionName}`)
    expect(approach?.code).not.toContain('Date.now')
  })

  it('grades the refactor with checks its reference solution passes', () => {
    const refactor = lesson.problems.find(
      (problem) => problem.kind === 'refactor',
    )

    if (refactor?.kind !== 'refactor') {
      throw new Error('expected a refactor problem')
    }

    expect(refactor.goals.length).toBeGreaterThan(0)
    expect(refactor.tests.length).toBeGreaterThanOrEqual(5)

    // The unrefactored code must trip the checks that define the exercise.
    const originalResults = runStaticChecks(
      refactor.originalCode,
      refactor.staticChecks,
    )
    expect(originalResults.some((result) => !result.passed)).toBe(true)

    // The reference approach must clear every check it asks learners to clear.
    const approach = lesson.approaches[refactor.id]?.[0]
    expect(approach?.code).toContain(`function ${refactor.functionName}`)

    const approachResults = runStaticChecks(
      approach?.code ?? '',
      refactor.staticChecks,
    )
    expect(approachResults.every((result) => result.passed)).toBe(true)
  })

  it('ties written and design work back to the lesson rules', () => {
    const written = lesson.problems.find(
      (problem) => problem.kind === 'written',
    )

    if (written?.kind !== 'written') {
      throw new Error('expected a written problem')
    }

    expect(written.referenceAnswer.length).toBeGreaterThan(300)
    expect(written.rubric?.length).toBeGreaterThanOrEqual(3)

    const design = lesson.problems.find((problem) => problem.kind === 'design')

    if (design?.kind !== 'design') {
      throw new Error('expected a design problem')
    }

    expect(design.sections.length).toBeGreaterThanOrEqual(3)
    expect(
      design.sections.some((section) => section.type === 'tradeoff'),
    ).toBe(true)
    expect(design.rubric.length).toBeGreaterThanOrEqual(4)
    expect(design.referenceAnswer.length).toBeGreaterThan(300)
  })
})
