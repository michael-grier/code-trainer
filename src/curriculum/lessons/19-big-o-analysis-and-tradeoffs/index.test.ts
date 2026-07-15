import { describe, expect, it } from 'vitest'

import { lesson } from './index'

describe('big-o analysis and tradeoffs lesson', () => {
  it('progresses from added memory to strict time and space constraints', () => {
    expect(
      lesson.problems.map((problem) => `${problem.id}:${problem.kind}`),
    ).toEqual([
      'detect-duplicate-value:code',
      'maximum-single-trade-profit:code',
      'smallest-missing-positive:code',
      'complexity-tradeoff-review:written',
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
