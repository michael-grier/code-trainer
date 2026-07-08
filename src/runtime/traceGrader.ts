import type { TraceProblem, TraceQuestion } from '@/curriculum/types'

import { deepEqual } from './deepEqual'

export type TraceGradeResult = {
  questionId: string
  passed: boolean
  expected: string
  actual: string
  message: string
}

export type TraceGradeSummary = {
  passed: boolean
  answered: number
  total: number
  results: TraceGradeResult[]
}

export function gradeTraceProblem(
  problem: TraceProblem,
  answers: Record<string, unknown>,
): TraceGradeSummary {
  const results = problem.questions.map((question) =>
    gradeTraceQuestion(question, answers[question.id]),
  )

  return {
    passed: results.every((result) => result.passed),
    answered: results.filter((result) => result.actual.length > 0).length,
    total: results.length,
    results,
  }
}

export function gradeTraceQuestion(
  question: TraceQuestion,
  answer: unknown,
): TraceGradeResult {
  if (question.type === 'output-order') {
    const actual = Array.isArray(answer)
      ? answer.filter((value): value is string => typeof value === 'string')
      : []
    const passed = deepEqual(actual, question.expected)

    return createResult(question.id, passed, question.expected, actual)
  }

  if (question.type === 'multiple-choice') {
    const actual = typeof answer === 'string' ? answer : ''
    const passed = actual === question.answer

    return createResult(question.id, passed, question.answer, actual)
  }

  const normalizedAnswer =
    typeof answer === 'string' ? parseTraceValue(answer, question.expected) : answer
  const passed = deepEqual(normalizedAnswer, question.expected)

  return createResult(question.id, passed, question.expected, normalizedAnswer)
}

function parseTraceValue(value: string, expected: unknown) {
  const trimmed = value.trim()

  if (typeof expected === 'string') {
    return trimmed
  }

  if (trimmed.length === 0) {
    return ''
  }

  try {
    return JSON.parse(trimmed)
  } catch {
    if (typeof expected === 'number') {
      const numericValue = Number(trimmed)
      return Number.isNaN(numericValue) ? trimmed : numericValue
    }

    if (typeof expected === 'boolean') {
      return trimmed === 'true' ? true : trimmed === 'false' ? false : trimmed
    }

    return trimmed
  }
}

function createResult(
  questionId: string,
  passed: boolean,
  expected: unknown,
  actual: unknown,
): TraceGradeResult {
  return {
    questionId,
    passed,
    expected: formatTraceValue(expected),
    actual: isEmptyAnswer(actual) ? '' : formatTraceValue(actual),
    message: passed ? 'Correct' : 'Review the expected state and execution order.',
  }
}

function isEmptyAnswer(value: unknown) {
  return (
    value === '' ||
    (Array.isArray(value) &&
      value.filter((item) => typeof item === 'string' && item.length > 0)
        .length === 0)
  )
}

function formatTraceValue(value: unknown): string {
  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'undefined') {
    return 'undefined'
  }

  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

