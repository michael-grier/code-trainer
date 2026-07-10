import { describe, expect, it } from 'vitest'

import { lesson } from './index'

describe('binary search lesson', () => {
  it('progresses from exact search to a numeric answer boundary', () => {
    expect(
      lesson.problems.map((problem) => `${problem.id}:${problem.kind}`),
    ).toEqual([
      'find-sorted-index:code',
      'first-value-at-least:code',
      'minimum-processing-rate:code',
      'binary-search-boundary-review:written',
    ])
  })

  it('provides complete code practice and reference approaches', () => {
    const codeProblems = lesson.problems.filter(
      (problem) => problem.kind === 'code',
    )

    expect(codeProblems).toHaveLength(3)

    for (const problem of codeProblems) {
      expect(problem.prompt).toContain('Example:')
      expect(problem.starter).toContain('console.log')
      expect(problem.tests.length).toBeGreaterThanOrEqual(5)
      expect(lesson.approaches[problem.id]?.[0]?.code).toContain(
        `function ${problem.functionName}`,
      )
    }
  })
})
