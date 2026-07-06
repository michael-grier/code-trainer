import Concept from './concept.mdx'

import { createPlaceholderLesson } from '../../placeholder'

export const lesson = createPlaceholderLesson({
  slug: 'transactions-and-consistency',
  title: 'Transactions and Consistency',
  summary: 'Protect multi-step data changes with transactional thinking and consistency rules.',
  track: 'backend-data',
  order: 52,
  concept: Concept,
})
