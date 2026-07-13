import { describe, expect, it } from 'vitest'

import { lesson } from './index'

describe('graph traversal lesson', () => {
  it('progresses from traversal to connected regions and directed ordering', () => {
    expect(
      lesson.problems.map((problem) => `${problem.id}:${problem.kind}`),
    ).toEqual([
      'breadth-first-traversal-order:code',
      'count-grid-islands:code',
      'finish-all-courses:code',
      'graph-traversal-review:written',
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
