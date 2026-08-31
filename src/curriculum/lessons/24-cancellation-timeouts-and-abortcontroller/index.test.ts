import { describe, expect, it } from 'vitest'

import { lesson } from './index'

describe('cancellation, timeouts, and abortcontroller lesson', () => {
  it('progresses from debugging through implementation to explanation', () => {
    expect(
      lesson.problems.map((problem) => `${problem.id}:${problem.kind}`),
    ).toEqual([
      'fix-ignored-signal:debug',
      'checkpointed-sync:code',
      'latest-wins-trace:trace',
      'cooperative-model-review:written',
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

  it('keeps executed test cases JSON-serializable', () => {
    for (const problem of lesson.problems) {
      if (problem.kind !== 'code' && problem.kind !== 'debug') {
        continue
      }

      for (const test of problem.tests) {
        // Signals and controllers cannot round-trip through JSON, so this
        // also guards against ever passing one as a test argument.
        expect(JSON.parse(JSON.stringify(test.args))).toEqual(test.args)
      }
    }
  })
})
