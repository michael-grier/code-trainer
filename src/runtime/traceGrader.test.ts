import { describe, expect, it } from 'vitest'

import type { TraceProblem } from '@/curriculum/types'

import { gradeTraceProblem } from './traceGrader'

const problem: TraceProblem = {
  id: 'trace',
  kind: 'trace',
  title: 'Trace',
  prompt: 'Trace it.',
  completionMode: 'structured-answer-correct',
  code: 'const value = 2',
  explanation: 'The value is assigned synchronously.',
  questions: [
    {
      id: 'order',
      type: 'output-order',
      label: 'Output order',
      options: ['first', 'second'],
      expected: ['first', 'second'],
    },
    {
      id: 'value',
      type: 'final-value',
      label: 'Final value',
      variable: 'value',
      expected: 2,
    },
    {
      id: 'choice',
      type: 'multiple-choice',
      label: 'Choice',
      options: ['sync', 'async'],
      answer: 'sync',
    },
  ],
}

describe('gradeTraceProblem', () => {
  it('passes when every structured answer is correct', () => {
    expect(
      gradeTraceProblem(problem, {
        order: ['first', 'second'],
        value: '2',
        choice: 'sync',
      }),
    ).toMatchObject({
      passed: true,
      answered: 3,
      total: 3,
    })
  })

  it('fails incorrect order, value, or choice answers', () => {
    const result = gradeTraceProblem(problem, {
      order: ['second', 'first'],
      value: '3',
      choice: 'async',
    })

    expect(result.passed).toBe(false)
    expect(result.results.map((item) => item.passed)).toEqual([
      false,
      false,
      false,
    ])
  })
})

