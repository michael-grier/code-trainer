import Concept from './concept.mdx'

import { createPlaceholderLesson } from '../../placeholder'

export const lesson = createPlaceholderLesson({
  slug: 'cancellation-timeouts-and-abortcontroller',
  title: 'Cancellation, Timeouts, and AbortController',
  summary: 'Design async workflows that cancel, time out, and clean up correctly.',
  track: 'js-ts-core',
  order: 24,
  concept: Concept,
})
