import Concept from './concept.mdx'

import { createPlaceholderLesson } from '../../placeholder'

export const lesson = createPlaceholderLesson({
  slug: 'migrations-and-data-evolution',
  title: 'Migrations and Data Evolution',
  summary: 'Plan schema changes, backfills, rollbacks, and compatibility windows.',
  track: 'backend-data',
  order: 53,
  concept: Concept,
})
