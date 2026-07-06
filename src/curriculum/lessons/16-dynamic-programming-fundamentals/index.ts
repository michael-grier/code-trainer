import Concept from './concept.mdx'

import { createPlaceholderLesson } from '../../placeholder'

export const lesson = createPlaceholderLesson({
  slug: 'dynamic-programming-fundamentals',
  title: 'Dynamic Programming Fundamentals',
  summary: 'Identify overlapping subproblems and build memoized or tabulated solutions.',
  track: 'algorithms',
  order: 16,
  concept: Concept,
})
