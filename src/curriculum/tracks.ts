import type { Track } from '@/curriculum/types'

export type TrackDefinition = Omit<Track, 'lessonSlugs'>

export const trackDefinitions = [
  {
    id: 'algorithms',
    title: 'Algorithmic Problem Solving',
    summary:
      'Practice data structures, algorithm patterns, complexity analysis, and interview problem decomposition.',
  },
  {
    id: 'js-ts-core',
    title: 'JavaScript and TypeScript Core',
    summary:
      'Strengthen runtime reasoning, async behavior, type modeling, generics, validation, and error handling.',
  },
  {
    id: 'frontend',
    title: 'React and Frontend Engineering',
    summary:
      'Build judgment around component design, hooks, effects, accessibility, routing, browser APIs, and security.',
  },
  {
    id: 'backend-data',
    title: 'Backend TypeScript and Data',
    summary:
      'Prepare for API design, auth boundaries, SQL, schemas, indexes, transactions, migrations, caching, and rate limits.',
  },
  {
    id: 'production',
    title: 'Testing, Design, and Production Readiness',
    summary:
      'Practice testing strategy, debugging, refactoring, design patterns, and system design tradeoffs.',
  },
] as const satisfies readonly TrackDefinition[]

export type TrackId = (typeof trackDefinitions)[number]['id']

export const trackOrder = trackDefinitions.map((track) => track.id)

