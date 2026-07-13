import { describe, expect, it } from 'vitest'

import { lesson } from './index'

describe('heaps and priority queues lesson', () => {
  it('progresses from bounded heaps to record priorities', () => {
    expect(
      lesson.problems.map((problem) => `${problem.id}:${problem.kind}`),
    ).toEqual([
      'kth-largest-value:code',
      'minimum-meeting-rooms:code',
      'merge-sorted-arrays:code',
      'heap-selection-review:written',
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
