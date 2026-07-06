import Concept from './concept.mdx'

import { createPlaceholderLesson } from '../../placeholder'

export const lesson = createPlaceholderLesson({
  slug: 'effects-and-synchronization',
  title: 'Effects and Synchronization',
  summary: 'Use effects for external synchronization without creating stale or redundant state.',
  track: 'frontend',
  order: 36,
  concept: Concept,
})
