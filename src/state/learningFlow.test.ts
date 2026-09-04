import { describe, expect, it } from 'vitest'

import type { Lesson } from '@/curriculum/types'
import {
  getContinueTarget,
  getProblemNavigation,
  learningTargetToPath,
} from '@/state/learningFlow'
import { createEmptyProgressState } from '@/state/progress'

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

describe('learning flow', () => {
  it('prefers the last visited target when it is still valid', () => {
    const progress = createEmptyProgressState()

    progress.lastVisited = {
      lessonSlug: 'first',
      problemId: 'two',
      updatedAt: 100,
    }

    expect(getContinueTarget(lessons, progress)).toEqual({
      lessonSlug: 'first',
      problemId: 'two',
    })
  })

  it('falls back to the recommended problem', () => {
    expect(getContinueTarget(lessons, createEmptyProgressState())).toEqual({
      lessonSlug: 'first',
      problemId: 'one',
    })
  })

  it('ignores legacy focus state when choosing the recommended fallback', () => {
    const progress = createEmptyProgressState()

    progress.learningPath.mode = 'self-directed'
    progress.learningPath.focusLessonSlug = 'second'

    expect(getContinueTarget(lessons, progress)).toEqual({
      lessonSlug: 'first',
      problemId: 'one',
    })
  })

  it('ignores a last visited lesson that is still coming soon', () => {
    const progress = createEmptyProgressState()

    progress.lastVisited = {
      lessonSlug: 'third',
      updatedAt: 100,
    }

    expect(getContinueTarget(lessons, progress)).toEqual({
      lessonSlug: 'first',
      problemId: 'one',
    })
  })

  it('computes previous and next problem links across lessons', () => {
    expect(getProblemNavigation(lessons, 'first', 'two')).toEqual({
      previous: {
        lessonSlug: 'first',
        lessonTitle: 'First',
        problemId: 'one',
        problemTitle: 'One',
      },
      next: {
        lessonSlug: 'second',
        lessonTitle: 'Second',
        problemId: 'one',
        problemTitle: 'One',
      },
    })

    expect(getProblemNavigation(lessons, 'second', 'one').next).toBeUndefined()
  })

  it('formats targets into app paths', () => {
    expect(
      learningTargetToPath({ lessonSlug: 'first', problemId: 'one' }),
    ).toBe('/lesson/first/problem/one')
    expect(learningTargetToPath({ lessonSlug: 'first' })).toBe('/lesson/first')
    expect(learningTargetToPath(undefined)).toBe('/progress')
  })
})
