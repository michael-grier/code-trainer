import Concept from './concept.mdx'

import { createPlaceholderLesson } from '../../placeholder'

export const lesson = createPlaceholderLesson({
  slug: 'event-loop-and-task-scheduling',
  title: 'Event Loop and Task Scheduling',
  summary: 'Trace task queues, microtasks, timers, and async ordering.',
  track: 'js-ts-core',
  order: 22,
  concept: Concept,
})
