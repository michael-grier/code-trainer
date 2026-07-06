import Concept from './concept.mdx'

import { createPlaceholderLesson } from '../../placeholder'

export const lesson = createPlaceholderLesson({
  slug: 'props-state-and-derived-state',
  title: 'Props, State, and Derived State',
  summary: 'Separate source-of-truth state from values that can be derived during render.',
  track: 'frontend',
  order: 34,
  concept: Concept,
})
