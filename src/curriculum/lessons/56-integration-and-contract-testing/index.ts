import Concept from './concept.mdx'

import { createPlaceholderLesson } from '../../placeholder'

export const lesson = createPlaceholderLesson({
  slug: 'integration-and-contract-testing',
  title: 'Integration and Contract Testing',
  summary: 'Test module and service boundaries with contracts that catch real regressions.',
  track: 'production',
  order: 56,
  concept: Concept,
})
