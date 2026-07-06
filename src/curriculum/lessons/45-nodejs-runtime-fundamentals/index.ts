import Concept from './concept.mdx'

import { createPlaceholderLesson } from '../../placeholder'

export const lesson = createPlaceholderLesson({
  slug: 'nodejs-runtime-fundamentals',
  title: 'Node.js Runtime Fundamentals',
  summary: 'Reason about Node execution, modules, async I/O, and server-side runtime constraints.',
  track: 'backend-data',
  order: 45,
  concept: Concept,
})
