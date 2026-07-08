import { describe, expect, it } from 'vitest'

import { lesson } from './index'

describe('arrays and hashing lesson', () => {
  it('uses the intended code-heavy algorithms practice mix', () => {
    expect(
      lesson.problems.map((problem) => `${problem.id}:${problem.kind}`),
    ).toEqual([
      'valid-anagram:code',
      'group-anagrams:code',
      'longest-consecutive-sequence:code',
      'hashing-tradeoffs-review:written',
      'lookup-strategy-design:design',
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
