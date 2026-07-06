import Concept from './concept.mdx'

import { createPlaceholderLesson } from '../../placeholder'

export const lesson = createPlaceholderLesson({
  slug: 'react-performance-and-memoization',
  title: 'React Performance and Memoization',
  summary: 'Measure render costs and apply memoization only where it changes user-facing performance.',
  track: 'frontend',
  order: 40,
  concept: Concept,
})
