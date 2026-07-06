import Concept from './concept.mdx'

import { createPlaceholderLesson } from '../../placeholder'

export const lesson = createPlaceholderLesson({
  slug: 'schema-design-and-relationships',
  title: 'Schema Design and Relationships',
  summary: 'Model entities, relationships, constraints, and nullability intentionally.',
  track: 'backend-data',
  order: 50,
  concept: Concept,
})
