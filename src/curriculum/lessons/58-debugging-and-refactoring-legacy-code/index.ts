import Concept from './concept.mdx'

import { createPlaceholderLesson } from '../../placeholder'

export const lesson = createPlaceholderLesson({
  slug: 'debugging-and-refactoring-legacy-code',
  title: 'Debugging and Refactoring Legacy Code',
  summary: 'Isolate failures and improve code incrementally without breaking behavior.',
  track: 'production',
  order: 58,
  concept: Concept,
})
