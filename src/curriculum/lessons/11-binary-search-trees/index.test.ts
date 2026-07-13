import { describe, expect, it } from 'vitest'

import { lesson } from './index'

describe('binary search trees lesson', () => {
  it('progresses from lookup to validation and sorted selection', () => {
    expect(
      lesson.problems.map((problem) => `${problem.id}:${problem.kind}`),
    ).toEqual([
      'search-binary-search-tree:code',
      'validate-binary-search-tree:code',
      'kth-smallest-bst-value:code',
      'bst-invariant-review:written',
    ])
  })

  it('provides complete code practice and references', () => {
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
