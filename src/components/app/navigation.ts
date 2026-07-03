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

export const primaryNavItems = [
  { to: '/', label: 'Dashboard', icon: GraduationCap },
  { to: '/progress', label: 'Progress', icon: Route },
]

export const trackPreviewItems = [
  {
    id: 'algorithms',
    title: 'Algorithmic Problem Solving',
    shortTitle: 'Algorithms',
    icon: Brain,
    lessonCount: 19,
    completedCount: 0,
  },
  {
    id: 'js-ts-core',
    title: 'JavaScript and TypeScript Core',
    shortTitle: 'JS/TS Core',
    icon: Code,
    lessonCount: 13,
    completedCount: 0,
  },
  {
    id: 'frontend',
    title: 'React and Frontend Engineering',
    shortTitle: 'Frontend',
    icon: BookOpen,
    lessonCount: 12,
    completedCount: 0,
  },
  {
    id: 'backend-data',
    title: 'Backend TypeScript and Data',
    shortTitle: 'Backend/Data',
    icon: Database,
    lessonCount: 10,
    completedCount: 0,
  },
  {
    id: 'production',
    title: 'Testing, Design, and Production Readiness',
    shortTitle: 'Production',
    icon: Server,
    lessonCount: 6,
    completedCount: 0,
  },
]

export const workspaceSummaryItems = [
  { label: 'Lessons planned', value: '60', icon: BookOpen },
  { label: 'Problem modes', value: '6', icon: ListChecks },
]

