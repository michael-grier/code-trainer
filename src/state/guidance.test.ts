import { describe, expect, it } from 'vitest'

import type { CodeProblem, Lesson, Track } from '@/curriculum/types'
import {
  getLessonCompletion,
  getLessonStatus,
  getProgressCounts,
  getRecentActivity,
  getRecommendedLesson,
  getRecommendedProblem,
  getTrackCompletion,
} from '@/state/guidance'
import {
  createEmptyProgressState,
  getDraftKey,
  getProblemKey,
  getUpdatedAtKey,
} from '@/state/progress'

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
  {
    slug: 'third',
    title: 'Third',
    summary: 'Third lesson',
    track: 'track',
    order: 3,
    availability: 'coming-soon',
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

    progress.completed[getProblemKey('first', 'two')] = true
    progress.completed[getProblemKey('second', 'one')] = true

    expect(getRecommendedLesson(lessons, progress)).toBeUndefined()
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

  it('derives lesson statuses from completion and guided recommendation', () => {
    const progress = createEmptyProgressState()

    expect(getLessonStatus(lessons[0], lessons, progress)).toBe('recommended')
    expect(getLessonStatus(lessons[1], lessons, progress)).toBe('ahead-of-path')
    expect(getLessonStatus(lessons[2], lessons, progress)).toBe('coming-soon')

    progress.learningPath.mode = 'self-directed'
    progress.learningPath.focusLessonSlug = 'second'

    expect(getLessonStatus(lessons[1], lessons, progress)).toBe('recommended')
    expect(getLessonStatus(lessons[0], lessons, progress)).toBe('untouched')

    progress.completed[getProblemKey('first', 'one')] = true

    expect(getLessonStatus(lessons[0], lessons, progress)).toBe('in-progress')
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

  it('treats draft activity as in progress for the owning lesson', () => {
    const progress = createEmptyProgressState()

    progress.drafts[getDraftKey('first', 'two')] = 'draft code'

    expect(getLessonCompletion(lessons[0], progress).isInProgress).toBe(true)
    expect(getLessonStatus(lessons[0], lessons, progress)).toBe('recommended')
  })
})

describe('focus and recent activity', () => {
  const codeProblem = (id: string): CodeProblem => ({
    id,
    kind: 'code',
    title: id,
    prompt: 'Prompt',
    completionMode: 'all-tests-pass',
    functionName: 'fn',
    starter: 'export function fn() {}',
    tests: [],
  })

  const trackLessons: Lesson[] = [
    {
      slug: 'a1',
      title: 'A1',
      summary: '',
      track: 'a',
      order: 1,
      concept: Concept,
      problems: [codeProblem('one')],
      approaches: {},
    },
    {
      slug: 'a2',
      title: 'A2',
      summary: '',
      track: 'a',
      order: 2,
      concept: Concept,
      problems: [codeProblem('one')],
      approaches: {},
    },
    {
      slug: 'b1',
      title: 'B1',
      summary: '',
      track: 'b',
      order: 3,
      concept: Concept,
      problems: [codeProblem('one')],
      approaches: {},
    },
    {
      slug: 'b2',
      title: 'B2',
      summary: '',
      track: 'b',
      order: 4,
      concept: Concept,
      problems: [codeProblem('one')],
      approaches: {},
    },
  ]

  const focusedOnB = () => {
    const progress = createEmptyProgressState(1)

    progress.learningPath = {
      mode: 'self-directed',
      focusLessonSlug: 'b1',
      queuedLessonSlugs: [],
      updatedAt: 1,
    }

    return progress
  }

  it('recommends within the focused track until it is complete', () => {
    const progress = focusedOnB()

    expect(getRecommendedLesson(trackLessons, progress)?.slug).toBe('b1')

    progress.completed[getProblemKey('b1', 'one')] = true
    expect(getRecommendedLesson(trackLessons, progress)?.slug).toBe('b2')

    progress.completed[getProblemKey('b2', 'one')] = true
    expect(getRecommendedLesson(trackLessons, progress)?.slug).toBe('a1')
  })

  it('does not flag lessons as ahead of the path while focused', () => {
    const guided = createEmptyProgressState(1)
    const focused = focusedOnB()

    expect(getLessonStatus(trackLessons[3], trackLessons, guided)).toBe(
      'ahead-of-path',
    )
    expect(getLessonStatus(trackLessons[3], trackLessons, focused)).toBe(
      'untouched',
    )
    expect(getLessonStatus(trackLessons[0], trackLessons, focused)).toBe(
      'untouched',
    )
  })

  it('lists unfinished problems by latest activity and flags edited drafts', () => {
    const progress = createEmptyProgressState(1)

    progress.drafts[getDraftKey('a1', 'one')] = 'export function fn() {}'
    progress.updatedAt[getUpdatedAtKey('drafts', 'a1', 'one')] = 10
    progress.drafts[getDraftKey('a2', 'one')] = 'export function fn() { return 1 }'
    progress.updatedAt[getUpdatedAtKey('drafts', 'a2', 'one')] = 20
    progress.updatedAt[getUpdatedAtKey('completed', 'b1', 'one')] = 30
    progress.completed[getProblemKey('b1', 'one')] = true
    progress.updatedAt[getUpdatedAtKey('lastVisited')] = 40

    const items = getRecentActivity(trackLessons, progress)

    expect(
      items.map((item) => [item.lesson.slug, item.updatedAt, item.hasDraft]),
    ).toEqual([
      ['a2', 20, true],
      ['a1', 10, false],
    ])
    expect(getRecentActivity(trackLessons, progress, 1)).toHaveLength(1)
  })
})
