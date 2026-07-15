import { describe, expect, it } from 'vitest'

import { lesson } from './index'

describe('dynamic programming fundamentals lesson', () => {
  it('progresses from a recurrence to choices and reusable amounts', () => {
    expect(
      lesson.problems.map((problem) => `${problem.id}:${problem.kind}`),
    ).toEqual([
      'count-climbing-ways:code',
      'maximum-non-adjacent-sum:code',
      'minimum-coins-for-amount:code',
      'dynamic-programming-state-review:written',
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
