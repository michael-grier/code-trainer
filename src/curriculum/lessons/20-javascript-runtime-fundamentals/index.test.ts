import { describe, expect, it } from 'vitest'

import { lesson } from './index'

describe('javascript runtime fundamentals lesson', () => {
  it('progresses from tracing through debugging to explanation', () => {
    expect(
      lesson.problems.map((problem) => `${problem.id}:${problem.kind}`),
    ).toEqual([
      'value-reference-trace:trace',
      'fix-discount-mutation:debug',
      'apply-settings-update:code',
      'values-vs-references-review:written',
    ])
  })

  it('gives the trace problem answerable structured questions', () => {
    const trace = lesson.problems.find((problem) => problem.kind === 'trace')

    if (trace?.kind !== 'trace') {
      throw new Error('expected a trace problem')
    }

    expect(trace.questions.length).toBeGreaterThanOrEqual(3)
    expect(trace.explanation.length).toBeGreaterThan(100)

    for (const question of trace.questions) {
      if (question.type === 'output-order') {
        expect(new Set(question.expected).size).toBe(question.expected.length)
        for (const line of question.expected) {
          expect(question.options).toContain(line)
        }
      }

      if (question.type === 'multiple-choice') {
        expect(question.options).toContain(question.answer)
      }
    }
  })

  it('provides complete runnable practice and reference approaches', () => {
    for (const problem of lesson.problems) {
      if (problem.kind === 'code') {
        expect(problem.prompt).toContain('Example:')
        expect(problem.starter).toContain('console.log')
        expect(problem.tests.length).toBeGreaterThanOrEqual(5)
      }

      if (problem.kind === 'debug') {
        expect(problem.brokenCode).toContain('console.log')
        expect(problem.tests.length).toBeGreaterThanOrEqual(5)
        expect(problem.bugHints?.length).toBeGreaterThan(0)
      }

      if (problem.kind === 'code' || problem.kind === 'debug') {
        expect(lesson.approaches[problem.id]?.[0]?.code).toContain(
          `function ${problem.functionName}`,
        )
      }

      if (problem.kind === 'written') {
        expect(problem.referenceAnswer.length).toBeGreaterThan(300)
        expect(problem.rubric?.length).toBeGreaterThanOrEqual(3)
      }
    }
  })
})
