import { describe, expect, it } from 'vitest'

import { lesson as arraysAndHashing } from './lessons/01-arrays-and-hashing'
import { lesson as slidingWindow } from './lessons/03-sliding-window'
import { lesson as twoPointers } from './lessons/02-two-pointers'

import type { Approach, Lesson, Problem } from './types'

const authoredAlgorithmLessons = [
  arraysAndHashing,
  twoPointers,
  slidingWindow,
]

const unsupportedCompanyClaimPattern =
  /\b(?:asked by|asked at|asked in|reported by|seen at|from (?:Google|Meta|Facebook|Amazon|Microsoft|Apple|Netflix|Uber|Airbnb|Stripe|OpenAI))\b/i

describe('interview-realistic authored lessons', () => {
  it('uses adapted interview patterns without unsupported company claims', () => {
    for (const lesson of authoredAlgorithmLessons) {
      expect(getLessonText(lesson)).not.toMatch(unsupportedCompanyClaimPattern)
    }
  })

  it('scaffolds code problems with concrete examples and runnable starters', () => {
    for (const lesson of authoredAlgorithmLessons) {
      const codeProblems = lesson.problems.filter(
        (problem) => problem.kind === 'code',
      )

      expect(codeProblems.length).toBeGreaterThanOrEqual(3)

      for (const problem of codeProblems) {
        expect(problem.prompt).toContain('Example:')
        expect(problem.starter).toContain('console.log')
        expect(problem.tests.length).toBeGreaterThanOrEqual(5)
      }
    }
  })
})

function getLessonText(lesson: Lesson) {
  return [
    lesson.title,
    lesson.summary,
    ...lesson.problems.flatMap(getProblemText),
    ...Object.values(lesson.approaches).flatMap((approaches) =>
      approaches.flatMap(getApproachText),
    ),
  ].join('\n')
}

function getProblemText(problem: Problem): string[] {
  const baseText = [problem.title, problem.prompt]

  if (problem.kind === 'code') {
    return [...baseText, problem.functionName, problem.starter]
  }

  if (problem.kind === 'debug') {
    return [
      ...baseText,
      problem.functionName,
      problem.brokenCode,
      ...(problem.bugHints ?? []),
    ]
  }

  if (problem.kind === 'refactor') {
    return [
      ...baseText,
      problem.functionName,
      problem.originalCode,
      problem.starter,
      ...problem.goals,
      ...problem.staticChecks.map((check) => check.message),
    ]
  }

  if (problem.kind === 'trace') {
    return [
      ...baseText,
      problem.code,
      problem.explanation,
      ...problem.questions.flatMap((question) => [
        question.label,
        ...('options' in question ? question.options : []),
      ]),
    ]
  }

  if (problem.kind === 'written') {
    return [
      ...baseText,
      problem.starter ?? '',
      problem.referenceAnswer,
      ...(problem.rubric ?? []).flatMap((item) => [
        item.label,
        item.description,
      ]),
    ]
  }

  return [
    ...baseText,
    problem.scenario,
    problem.referenceAnswer,
    ...problem.sections.flatMap((section) => [
      section.label,
      section.prompt,
      ...('options' in section ? section.options : []),
    ]),
    ...problem.rubric.flatMap((item) => [item.label, item.description]),
  ]
}

function getApproachText(approach: Approach) {
  return [
    approach.name,
    approach.code ?? '',
    approach.explanation,
    approach.complexity ?? '',
  ]
}
