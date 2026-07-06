import Concept from './concept.mdx'

import { createPlaceholderLesson } from '../../placeholder'

export const lesson = createPlaceholderLesson({
  slug: 'unit-testing-strategy',
  title: 'Unit Testing Strategy',
  summary: 'Choose useful unit boundaries and test behavior without overfitting implementation details.',
  track: 'production',
  order: 55,
  concept: Concept,
})
