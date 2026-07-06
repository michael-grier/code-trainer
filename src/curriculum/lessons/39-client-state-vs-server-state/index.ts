import Concept from './concept.mdx'

import { createPlaceholderLesson } from '../../placeholder'

export const lesson = createPlaceholderLesson({
  slug: 'client-state-vs-server-state',
  title: 'Client State vs Server State',
  summary: 'Choose where data lives and how it updates across UI, cache, and backend boundaries.',
  track: 'frontend',
  order: 39,
  concept: Concept,
})
