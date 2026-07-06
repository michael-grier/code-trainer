import Concept from './concept.mdx'

import { createPlaceholderLesson } from '../../placeholder'

export const lesson = createPlaceholderLesson({
  slug: 'error-handling-with-result-style-types',
  title: 'Error Handling with Result-Style Types',
  summary: 'Represent recoverable failures explicitly and avoid ambiguous control flow.',
  track: 'js-ts-core',
  order: 32,
  concept: Concept,
})
