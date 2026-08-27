import { tracks } from '@/curriculum'

export const primaryNavItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/progress', label: 'Progress' },
]

const shortTitles = {
  algorithms: 'Algorithms',
  'js-ts-core': 'JS/TS Core',
  frontend: 'Frontend',
  'backend-data': 'Backend/Data',
  production: 'Production',
}

export const trackPreviewItems = tracks.map((track) => ({
  ...track,
  shortTitle: shortTitles[track.id as keyof typeof shortTitles] ?? track.title,
  lessonCount: track.lessonSlugs.length,
}))
