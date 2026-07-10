import { describe, expect, it } from 'vitest'

import { lesson } from './index'

describe('stacks and monotonic stacks lesson', () => {
  it('progresses from LIFO matching to monotonic-stack boundaries', () => {
    expect(
      lesson.problems.map((problem) => `${problem.id}:${problem.kind}`),
    ).toEqual([
      'validate-brackets:code',
      'days-until-warmer:code',
      'largest-histogram-rectangle:code',
      'stack-state-review:written',
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
