import { describe, expect, it } from 'vitest'

import { lesson } from './index'

describe('two pointers lesson', () => {
  it('uses a code-heavy practice mix with a movement review', () => {
    expect(
      lesson.problems.map((problem) => `${problem.id}:${problem.kind}`),
    ).toEqual([
      'sorted-pair-sum:code',
      'dedupe-sorted-array:code',
      'container-most-water:code',
      'pointer-movement-review:written',
    ])
  })

  it('provides tests and reference approaches for every code problem', () => {
    const codeProblems = lesson.problems.filter(
      (problem) => problem.kind === 'code',
    )

    expect(codeProblems).toHaveLength(3)

    for (const problem of codeProblems) {
      expect(problem.tests.length).toBeGreaterThanOrEqual(5)
      expect(lesson.approaches[problem.id]?.[0]?.code).toContain(
        `function ${problem.functionName}`,
      )
    }
  })
})
