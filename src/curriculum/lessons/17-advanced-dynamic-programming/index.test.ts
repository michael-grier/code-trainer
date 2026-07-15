import { describe, expect, it } from 'vitest'

import { lesson } from './index'

describe('advanced dynamic programming lesson', () => {
  it('progresses from grid state to strings and one-use choices', () => {
    expect(
      lesson.problems.map((problem) => `${problem.id}:${problem.kind}`),
    ).toEqual([
      'minimum-grid-path-sum:code',
      'longest-common-subsequence:code',
      'maximum-knapsack-value:code',
      'advanced-dp-state-review:written',
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
