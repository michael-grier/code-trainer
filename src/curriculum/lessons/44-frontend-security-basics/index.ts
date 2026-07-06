import Concept from './concept.mdx'

import { createPlaceholderLesson } from '../../placeholder'

export const lesson = createPlaceholderLesson({
  slug: 'frontend-security-basics',
  title: 'Frontend Security Basics',
  summary: 'Understand client trust boundaries, XSS risks, tokens, and safe rendering habits.',
  track: 'frontend',
  order: 44,
  concept: Concept,
})
