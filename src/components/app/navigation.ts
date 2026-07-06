import {
  BookOpen,
  Brain,
  Code,
  Database,
  GraduationCap,
  ListChecks,
  Route,
  Server,
} from 'lucide-react'

import { tracks } from '@/curriculum'

export const primaryNavItems = [
  { to: '/', label: 'Dashboard', icon: GraduationCap },
  { to: '/progress', label: 'Progress', icon: Route },
]

const trackIcons = {
  algorithms: Brain,
  'js-ts-core': Code,
  frontend: BookOpen,
  'backend-data': Database,
  production: Server,
}

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
  icon: trackIcons[track.id as keyof typeof trackIcons] ?? BookOpen,
  lessonCount: track.lessonSlugs.length,
  completedCount: 0,
}))

export const workspaceSummaryItems = [
  {
    label: 'Lessons planned',
    value: String(tracks.reduce((total, track) => total + track.lessonSlugs.length, 0)),
    icon: BookOpen,
  },
  { label: 'Problem modes', value: '6', icon: ListChecks },
]
