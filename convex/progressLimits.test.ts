import { describe, expect, it } from 'vitest'

import {
  PROGRESS_LIMITS,
  validateLastVisited,
  validateProblemProgress,
  validateProgressSnapshot,
} from './progressLimits'

const now = 1_000_000

function validProblem(problemId = 'practice') {
  return {
    lessonSlug: 'arrays-and-hashing',
    problemId,
    completedAt: now - 100,
    draft: 'export function solve() {}',
    traceAnswers: {
      'output-order': ['first', 'second'],
      explanation: 'runs in order',
    },
    writtenAnswer: 'Use a map to retain one-pass lookup.',
    designAnswers: {
      endpoints: ['GET /items', 'POST /items'],
      tradeoff: 'cursor-pagination',
    },
    rubricReviews: ['bounded-input', 'server-authorization'],
    revealedReferenceAt: now - 50,
    fieldUpdatedAt: {
      [`completed::arrays-and-hashing::${problemId}`]: now - 100,
      [`traceAnswers::arrays-and-hashing::${problemId}::output-order`]:
        now - 75,
    },
    updatedAt: now - 50,
  }
}

function validSnapshot() {
  return {
    problems: [validProblem()],
    settings: {
      lastLessonSlug: 'arrays-and-hashing',
      lastProblemId: 'practice',
      pathMode: 'self-directed' as const,
      focusLessonSlug: 'two-pointers',
      queuedLessonSlugs: ['sliding-window'],
      lastVisitedUpdatedAt: now - 25,
      learningPathUpdatedAt: now - 20,
      updatedAt: now - 20,
    },
  }
}

describe('progress input limits', () => {
  it('accepts every structured answer shape used by the curriculum', () => {
    expect(validateProgressSnapshot(validSnapshot(), now)).toBeUndefined()
  })

  it('rejects malformed identifiers and unrelated field timestamps', () => {
    expect(
      validateProblemProgress({ ...validProblem(), problemId: '../other' }, now),
    ).toEqual({ code: 'PROGRESS_INPUT_INVALID', field: 'problemId' })

    expect(
      validateProblemProgress(
        {
          ...validProblem(),
          fieldUpdatedAt: {
            'completed::other-lesson::practice': now,
          },
        },
        now,
      ),
    ).toEqual({ code: 'PROGRESS_INPUT_INVALID', field: 'fieldUpdatedAt' })
  })

  it('rejects timestamps outside the documented clock-skew window', () => {
    expect(
      validateLastVisited(
        {
          lessonSlug: 'arrays-and-hashing',
          updatedAt: now + PROGRESS_LIMITS.maxFutureClockSkewMs + 1,
        },
        now,
      ),
    ).toEqual({ code: 'PROGRESS_INPUT_INVALID', field: 'updatedAt' })

    expect(
      validateProblemProgress({ ...validProblem(), updatedAt: -1 }, now),
    ).toEqual({ code: 'PROGRESS_INPUT_INVALID', field: 'updatedAt' })
  })

  it('bounds record counts and rejects duplicate problem records', () => {
    const tooManyProblems = Array.from(
      { length: PROGRESS_LIMITS.maxProblems + 1 },
      (_, index) => validProblem(`practice-${index}`),
    )

    expect(
      validateProgressSnapshot(
        { problems: tooManyProblems, settings: null },
        now,
      ),
    ).toEqual({ code: 'PROGRESS_LIMIT_EXCEEDED', field: 'problems' })

    expect(
      validateProgressSnapshot(
        { problems: [validProblem(), validProblem()], settings: null },
        now,
      ),
    ).toEqual({ code: 'PROGRESS_INPUT_INVALID', field: 'problems' })
  })

  it('bounds individual records and the complete serialized snapshot', () => {
    const largeAnswers = Object.fromEntries(
      Array.from({ length: 20 }, (_, index) => [
        `answer-${index}`,
        'x'.repeat(25_000),
      ]),
    )

    expect(
      validateProblemProgress(
        { ...validProblem(), traceAnswers: largeAnswers },
        now,
      ),
    ).toEqual({ code: 'PROGRESS_LIMIT_EXCEEDED', field: 'problem' })

    const largeSnapshot = {
      problems: Array.from({ length: 14 }, (_, index) => ({
        ...validProblem(`practice-${index}`),
        draft: 'x'.repeat(PROGRESS_LIMITS.maxDraftLength),
      })),
      settings: null,
    }

    expect(validateProgressSnapshot(largeSnapshot, now)).toEqual({
      code: 'PROGRESS_LIMIT_EXCEEDED',
      field: 'progress',
    })
  })

  it('bounds settings collections and structured answer depth', () => {
    const queuedLessonSlugs = Array.from(
      { length: PROGRESS_LIMITS.maxQueuedLessons + 1 },
      (_, index) => `lesson-${index}`,
    )
    const nestedAnswer = Array.from(
      { length: PROGRESS_LIMITS.maxJsonDepth + 1 },
      () => [] as unknown[],
    )

    for (let index = 0; index < nestedAnswer.length - 1; index += 1) {
      nestedAnswer[index].push(nestedAnswer[index + 1])
    }

    expect(
      validateProgressSnapshot(
        {
          ...validSnapshot(),
          settings: { ...validSnapshot().settings, queuedLessonSlugs },
        },
        now,
      ),
    ).toEqual({
      code: 'PROGRESS_LIMIT_EXCEEDED',
      field: 'queuedLessonSlugs',
    })

    expect(
      validateProblemProgress(
        { ...validProblem(), traceAnswers: { nested: nestedAnswer[0] } },
        now,
      ),
    ).toEqual({ code: 'PROGRESS_INPUT_INVALID', field: 'traceAnswers' })

    expect(
      validateProblemProgress(
        {
          ...validProblem(),
          traceAnswers: { bytes: new Uint8Array([1, 2, 3]) },
        },
        now,
      ),
    ).toEqual({ code: 'PROGRESS_INPUT_INVALID', field: 'traceAnswers' })
  })
})
