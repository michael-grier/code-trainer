import Concept from './concept.mdx'

import { createPlaceholderLesson } from '../../placeholder'

export const lesson = createPlaceholderLesson({
  slug: 'javascript-runtime-fundamentals',
  title: 'JavaScript Runtime Fundamentals',
  summary: 'Reason about values, references, coercion, execution context, and runtime behavior.',
  track: 'js-ts-core',
  order: 20,
  concept: Concept,
})
