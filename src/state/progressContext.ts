import { createContext, useContext } from 'react'

import type { Language } from '@/curriculum/types'
import type { getLessonStatus } from '@/state/guidance'
import {
  getActiveLesson,
  getLessonCompletion,
  getProgressCounts,
  getRecommendedLesson,
  getRecommendedProblem,
  getTrackCompletion,
} from '@/state/guidance'
import type { ProgressState } from '@/state/progress'

export type SyncStatus =
  | 'guest'
  | 'loading-cloud'
  | 'syncing'
  | 'synced'
  | 'saved-locally'
  | 'failed'

export type ProgressContextValue = {
  state: ProgressState
  storageKey: string
  syncStatus: SyncStatus
  isHydrated: boolean
  recommendedLesson: ReturnType<typeof getRecommendedLesson>
  activeLesson: ReturnType<typeof getActiveLesson>
  counts: ReturnType<typeof getProgressCounts>
  getDraft: (
    lessonSlug: string,
    problemId: string,
    language: Language,
  ) => string | undefined
  saveDraft: (
    lessonSlug: string,
    problemId: string,
    language: Language,
    value: string,
  ) => void
  getLanguage: (lessonSlug: string, problemId: string) => Language | undefined
  setLanguage: (lessonSlug: string, problemId: string, language: Language) => void
  saveTraceAnswer: (
    lessonSlug: string,
    problemId: string,
    questionId: string,
    value: unknown,
  ) => void
  saveWrittenAnswer: (lessonSlug: string, problemId: string, value: string) => void
  saveDesignAnswer: (
    lessonSlug: string,
    problemId: string,
    sectionId: string,
    value: unknown,
  ) => void
  revealReference: (lessonSlug: string, problemId: string) => void
  toggleRubricItem: (
    lessonSlug: string,
    problemId: string,
    rubricItemId: string,
  ) => void
  markComplete: (lessonSlug: string, problemId: string) => void
  isProblemCompleted: (lessonSlug: string, problemId: string) => boolean
  getLessonCompletion: typeof getLessonCompletion
  getTrackCompletion: typeof getTrackCompletion
  getLessonStatus: typeof getLessonStatus
  getRecommendedProblem: typeof getRecommendedProblem
  setFocusLesson: (lessonSlug: string) => void
  resetToGuidedPath: () => void
  queueLesson: (lessonSlug: string) => void
  unqueueLesson: (lessonSlug: string) => void
  saveLastVisited: (lessonSlug: string, problemId?: string) => void
  retrySync: () => Promise<void>
}

export const ProgressContext = createContext<ProgressContextValue | null>(null)

export function useProgress() {
  const value = useContext(ProgressContext)

  if (!value) {
    throw new Error('useProgress must be used within ProgressProvider')
  }

  return value
}
