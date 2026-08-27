import { describe, expect, it } from 'vitest'

import { lesson } from './index'

describe('api design and resource modeling lesson', () => {
  it('progresses from boundary code through debugging to design and review', () => {
    expect(
      lesson.problems.map((problem) => `${problem.id}:${problem.kind}`),
    ).toEqual([
      'parse-list-query:code',
      'fix-lying-status-codes:debug',
      'book-club-api-design:design',
      'action-resource-review:written',
    ])
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
    expect(sectionTypes).toContain('endpoint-list')
    expect(sectionTypes).toContain('tradeoff')

    for (const section of design.sections) {
      if (section.type === 'tradeoff') {
        expect(section.options.length).toBeGreaterThanOrEqual(2)
      }
    }
  })

  it('provides complete runnable practice and reference approaches', () => {
    for (const problem of lesson.problems) {
      if (problem.kind === 'code') {
        expect(problem.prompt).toContain('Example:')
        expect(problem.starter).toContain('console.log')
        expect(problem.tests.length).toBeGreaterThanOrEqual(5)
      }

      if (problem.kind === 'debug') {
        expect(problem.brokenCode).toContain('console.log')
        expect(problem.tests.length).toBeGreaterThanOrEqual(5)
        expect(problem.bugHints?.length).toBeGreaterThan(0)
      }

      if (problem.kind === 'code' || problem.kind === 'debug') {
        expect(lesson.approaches[problem.id]?.[0]?.code).toContain(
          `function ${problem.functionName}`,
        )
      }

      if (problem.kind === 'written') {
        expect(problem.referenceAnswer.length).toBeGreaterThan(300)
        expect(problem.rubric?.length).toBeGreaterThanOrEqual(3)
      }
    }
  })
})
