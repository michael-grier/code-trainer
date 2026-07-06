import type { Language } from '@/curriculum/types'

export type ProgressState = {
  version: 2
  completed: Record<string, true>
  drafts: Record<string, string>
  languages: Record<string, Language>
  traceAnswers: Record<string, unknown>
  writtenAnswers: Record<string, string>
  designAnswers: Record<string, unknown>
  rubricReviews: Record<string, Record<string, true>>
  revealedReferences: Record<string, true>
  updatedAt: Record<string, number>
  lastSyncedAt?: number
  learningPath: {
    mode: 'guided' | 'self-directed'
    focusLessonSlug?: string
    queuedLessonSlugs: string[]
    updatedAt: number
  }
  lastVisited?: {
    lessonSlug: string
    problemId?: string
    updatedAt: number
  }
}

export type LessonCompletion = {
  completedProblems: number
  totalProblems: number
  percent: number
  isComplete: boolean
  isInProgress: boolean
}

export type TrackCompletion = {
  completedLessons: number
  totalLessons: number
  percent: number
}

export type ProgressCounts = {
  completed: number
  inProgress: number
  untouched: number
  aheadOfPath: number
}

export const PROGRESS_VERSION = 2

export function createEmptyProgressState(now = Date.now()): ProgressState {
  return {
    version: PROGRESS_VERSION,
    completed: {},
    drafts: {},
    languages: {},
    traceAnswers: {},
    writtenAnswers: {},
    designAnswers: {},
    rubricReviews: {},
    revealedReferences: {},
    updatedAt: {},
    learningPath: {
      mode: 'guided',
      queuedLessonSlugs: [],
      updatedAt: now,
    },
  }
}

export function getProblemKey(lessonSlug: string, problemId: string) {
  return `${lessonSlug}::${problemId}`
}

export function getDraftKey(
  lessonSlug: string,
  problemId: string,
  language: Language,
) {
  return `${lessonSlug}::${problemId}::${language}`
}

export function getTraceAnswerKey(
  lessonSlug: string,
  problemId: string,
  questionId: string,
) {
  return `${lessonSlug}::${problemId}::${questionId}`
}

export function getDesignAnswerKey(
  lessonSlug: string,
  problemId: string,
  sectionId: string,
) {
  return `${lessonSlug}::${problemId}::${sectionId}`
}

export function getUpdatedAtKey(...parts: string[]) {
  return parts.join('::')
}

