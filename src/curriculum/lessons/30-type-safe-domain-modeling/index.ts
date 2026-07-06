import Concept from './concept.mdx'

import { createPlaceholderLesson } from '../../placeholder'

export const lesson = createPlaceholderLesson({
  slug: 'type-safe-domain-modeling',
  title: 'Type-Safe Domain Modeling',
  summary: 'Represent domain rules with types that prevent invalid states.',
  track: 'js-ts-core',
  order: 30,
  concept: Concept,
})
