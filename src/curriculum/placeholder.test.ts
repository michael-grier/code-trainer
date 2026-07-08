import { describe, expect, it } from 'vitest'

import { createPlaceholderLesson } from '@/curriculum/placeholder'

const Concept = () => null

describe('createPlaceholderLesson', () => {
  it('creates code-heavy placeholders for algorithm lessons', () => {
    const lesson = createPlaceholderLesson({
      slug: 'arrays-and-hashing',
      title: 'Arrays and Hashing',
      summary: 'Summary',
      track: 'algorithms',
      order: 1,
      concept: Concept,
    })

    expect(lesson.problems.filter((problem) => problem.kind === 'code')).toHaveLength(3)
    expect(lesson.problems).toHaveLength(5)
  })

  it('keeps non-algorithm placeholders lighter', () => {
    const lesson = createPlaceholderLesson({
      slug: 'react-component-design',
      title: 'React Component Design',
      summary: 'Summary',
      track: 'frontend',
      order: 33,
      concept: Concept,
    })

    expect(lesson.problems.filter((problem) => problem.kind === 'code')).toHaveLength(1)
    expect(lesson.problems).toHaveLength(3)
  })
})
