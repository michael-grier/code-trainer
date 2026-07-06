import Concept from './concept.mdx'

import { createPlaceholderLesson } from '../../placeholder'

export const lesson = createPlaceholderLesson({
  slug: 'authentication-and-authorization',
  title: 'Authentication and Authorization',
  summary: 'Separate identity from permission checks and enforce authorization server-side.',
  track: 'backend-data',
  order: 48,
  concept: Concept,
})
