import Concept from './concept.mdx'

import { createPlaceholderLesson } from '../../placeholder'

export const lesson = createPlaceholderLesson({
  slug: 'sql-fundamentals',
  title: 'SQL Fundamentals',
  summary: 'Query relational data with filtering, joins, grouping, and clear result shapes.',
  track: 'backend-data',
  order: 49,
  concept: Concept,
})
