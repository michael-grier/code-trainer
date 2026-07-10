import { describe, expect, it } from 'vitest'

import { lesson } from './index'

describe('prefix sums and difference arrays lesson', () => {
  it('uses a code-heavy practice mix with a pattern-selection review', () => {
    expect(
      lesson.problems.map((problem) => `${problem.id}:${problem.kind}`),
    ).toEqual([
      'answer-range-sums:code',
      'count-target-sum-subarrays:code',
      'apply-range-updates:code',
      'cumulative-pattern-review:written',
    ])
  })

  it('provides tests, sample logs, and reference approaches for every code problem', () => {
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
