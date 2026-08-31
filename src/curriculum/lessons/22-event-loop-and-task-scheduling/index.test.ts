import { describe, expect, it } from 'vitest'

import { lesson } from './index'

describe('event loop and task scheduling lesson', () => {
  it('progresses from tracing through implementation to explanation', () => {
    expect(
      lesson.problems.map((problem) => `${problem.id}:${problem.kind}`),
    ).toEqual([
      'sync-timer-promise-trace:trace',
      'await-and-timer-trace:trace',
      'record-execution-order:code',
      'two-queues-review:written',
    ])
  })

  it('gives both trace problems answerable structured questions', () => {
    const traces = lesson.problems.filter(
      (problem) => problem.kind === 'trace',
    )

    expect(traces).toHaveLength(2)

    for (const trace of traces) {
      if (trace.kind !== 'trace') {
        throw new Error('expected a trace problem')
      }

      expect(trace.questions.length).toBeGreaterThanOrEqual(3)
      expect(trace.explanation.length).toBeGreaterThan(100)

      for (const question of trace.questions) {
        if (question.type === 'output-order') {
          // Every expected line must be selectable, and a duplicated
          // expected entry would make the question unanswerable.
          for (const line of question.expected) {
            expect(question.options).toContain(line)
          }
          expect(new Set(question.expected).size).toBe(
            question.expected.length,
          )
        }

        if (question.type === 'multiple-choice') {
          expect(question.options).toContain(question.answer)
        }
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

      if (problem.kind === 'code' || problem.kind === 'debug') {
        expect(lesson.approaches[problem.id]?.[0]?.code).toContain(
          `function ${problem.functionName}`,
        )
      }

      if (problem.kind === 'written') {
        expect(problem.referenceAnswer.length).toBeGreaterThan(200)
        expect(problem.rubric?.length).toBeGreaterThanOrEqual(3)
      }
    }
  })
})
