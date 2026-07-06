import { describe, expect, it } from 'vitest'

import type { Lesson, Track } from '@/curriculum/types'
import {
  getLessonCompletion,
  getLessonStatus,
  getProgressCounts,
  getRecommendedLesson,
  getRecommendedProblem,
  getTrackCompletion,
} from '@/state/guidance'
import { createEmptyProgressState, getProblemKey } from '@/state/progress'

const Concept = () => null

const lessons: Lesson[] = [
  {
    slug: 'first',
    title: 'First',
    summary: 'First lesson',
    track: 'track',
    order: 1,
    concept: Concept,
    problems: [
      {
        id: 'one',
        kind: 'written',
        title: 'One',
        prompt: 'Prompt',
        completionMode: 'submitted-with-reference-review',
        referenceAnswer: 'Answer',
      },
      {
        id: 'two',
        kind: 'written',
        title: 'Two',
        prompt: 'Prompt',
        completionMode: 'submitted-with-reference-review',
        referenceAnswer: 'Answer',
      },
    ],
    approaches: {},
  },
  {
    slug: 'second',
    title: 'Second',
    summary: 'Second lesson',
    track: 'track',
    order: 2,
    concept: Concept,
    problems: [
      {
        id: 'one',
        kind: 'written',
        title: 'One',
        prompt: 'Prompt',
        completionMode: 'submitted-with-reference-review',
        referenceAnswer: 'Answer',
      },
    ],
    approaches: {},
  },
]

const track: Track = {
  id: 'track',
  title: 'Track',
  summary: 'Summary',
  lessonSlugs: lessons.map((lesson) => lesson.slug),
}

describe('guidance', () => {
  it('recommends the first incomplete lesson and problem', () => {
    const progress = createEmptyProgressState()

    expect(getRecommendedLesson(lessons, progress)?.slug).toBe('first')
    expect(getRecommendedProblem(lessons[0], progress).id).toBe('one')

    progress.completed[getProblemKey('first', 'one')] = true

    expect(getRecommendedLesson(lessons, progress)?.slug).toBe('first')
    expect(getRecommendedProblem(lessons[0], progress).id).toBe('two')
  })

  it('computes lesson and track completion', () => {
    const progress = createEmptyProgressState()
    progress.completed[getProblemKey('first', 'one')] = true
    progress.completed[getProblemKey('first', 'two')] = true

    expect(getLessonCompletion(lessons[0], progress)).toMatchObject({
      completedProblems: 2,
      totalProblems: 2,
      percent: 100,
      isComplete: true,
    })
    expect(getTrackCompletion(track, lessons, progress)).toMatchObject({
      completedLessons: 1,
      totalLessons: 2,
      percent: 50,
    })
  })

  it('derives lesson statuses from completion and focus state', () => {
    const progress = createEmptyProgressState()

    expect(getLessonStatus(lessons[0], lessons, progress)).toBe('recommended')
    expect(getLessonStatus(lessons[1], lessons, progress)).toBe('ahead-of-path')

    progress.learningPath.mode = 'self-directed'
    progress.learningPath.focusLessonSlug = 'second'

    expect(getLessonStatus(lessons[1], lessons, progress)).toBe('focus')

    progress.completed[getProblemKey('first', 'one')] = true

    expect(getLessonStatus(lessons[0], lessons, progress)).toBe('recommended')
  })

  it('counts dashboard progress buckets', () => {
    const progress = createEmptyProgressState()
    const counts = getProgressCounts(lessons, progress)

    expect(counts).toEqual({
      completed: 0,
      inProgress: 1,
      untouched: 0,
      aheadOfPath: 1,
    })
  })
})
