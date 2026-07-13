import { describe, expect, it } from 'vitest'

import { lesson } from './index'

describe('graph shortest paths lesson', () => {
  it('progresses from unweighted distance to weighted and limited routes', () => {
    expect(
      lesson.problems.map((problem) => `${problem.id}:${problem.kind}`),
    ).toEqual([
      'shortest-unweighted-distance:code',
      'network-delay-time:code',
      'cheapest-route-with-stops:code',
      'shortest-path-method-review:written',
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
