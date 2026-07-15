import { describe, expect, it } from 'vitest'

import { lesson } from './index'

describe('greedy algorithms lesson', () => {
  it('progresses from a boundary to intervals and deferred priority', () => {
    expect(
      lesson.problems.map((problem) => `${problem.id}:${problem.kind}`),
    ).toEqual([
      'reach-last-index:code',
      'maximum-non-overlapping-meetings:code',
      'minimum-refuel-stops:code',
      'greedy-choice-review:written',
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
