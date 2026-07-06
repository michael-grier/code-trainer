import Concept from './concept.mdx'

import { createPlaceholderLesson } from '../../placeholder'

export const lesson = createPlaceholderLesson({
  slug: 'two-pointers',
  title: 'Two Pointers',
  summary: 'Use paired indexes to scan sorted data, shrink search spaces, and reason about invariants.',
  track: 'algorithms',
  order: 2,
  concept: Concept,
})
