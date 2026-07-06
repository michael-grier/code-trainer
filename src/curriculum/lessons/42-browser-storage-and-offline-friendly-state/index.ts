import Concept from './concept.mdx'

import { createPlaceholderLesson } from '../../placeholder'

export const lesson = createPlaceholderLesson({
  slug: 'browser-storage-and-offline-friendly-state',
  title: 'Browser Storage and Offline-Friendly State',
  summary: 'Persist browser state defensively and design around offline or reload behavior.',
  track: 'frontend',
  order: 42,
  concept: Concept,
})
