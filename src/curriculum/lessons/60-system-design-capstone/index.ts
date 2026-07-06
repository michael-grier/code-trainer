import Concept from './concept.mdx'

import { createPlaceholderLesson } from '../../placeholder'

export const lesson = createPlaceholderLesson({
  slug: 'system-design-capstone',
  title: 'System Design Capstone',
  summary: 'Synthesize product requirements, APIs, data models, reliability, and tradeoffs.',
  track: 'production',
  order: 60,
  concept: Concept,
})
