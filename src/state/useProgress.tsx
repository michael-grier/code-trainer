import { useAuth } from '@clerk/clerk-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { lessons } from '@/curriculum'
import {
  getActiveLesson,
  getLessonCompletion,
  getLessonStatus,
  getProgressCounts,
  getRecommendedLesson,
  getRecommendedProblem,
  getTrackCompletion,
} from '@/state/guidance'
import {
  createEmptyProgressState,
  getDesignAnswerKey,
  getDraftKey,
  getProblemKey,
  getTraceAnswerKey,
  getUpdatedAtKey,
  type ProgressState,
} from '@/state/progress'
import {
  getProgressStorageKey,
  loadProgressState,
  saveProgressState,
} from '@/lib/storage'
import { isClerkConfigured } from '@/lib/env'
import {
  ProgressContext,
  type ProgressContextValue,
} from '@/state/progressContext'

type ProgressProviderProps = {
  children: ReactNode
  userId?: string
}

export function ProgressProvider({ children, userId }: ProgressProviderProps) {
  const storageKey = getProgressStorageKey(userId)
  const [state, setState] = useState<ProgressState>(() => createEmptyProgressState())
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setState(loadProgressState(window.localStorage, storageKey))
    setIsHydrated(true)
  }, [storageKey])

  useEffect(() => {
    if (!isHydrated) {
      return
    }

    saveProgressState(window.localStorage, storageKey, state)
  }, [isHydrated, state, storageKey])

  const update = useCallback((recipe: (current: ProgressState, now: number) => ProgressState) => {
    setState((current) => recipe(current, Date.now()))
  }, [])

  const saveLastVisited = useCallback(
    (lessonSlug: string, problemId?: string) => {
      update((current, now) => ({
        ...current,
        lastVisited: {
          lessonSlug,
          problemId,
          updatedAt: now,
        },
        updatedAt: {
          ...current.updatedAt,
          [getUpdatedAtKey('lastVisited')]: now,
        },
      }))
    },
    [update],
  )

  const contextValue = useMemo<ProgressContextValue>(() => {
    const recommendedLesson = getRecommendedLesson(lessons, state)
    const activeLesson = getActiveLesson(lessons, state)

    return {
      state,
      storageKey,
      syncStatus: userId ? 'saved-locally' : 'guest',
      isHydrated,
      recommendedLesson,
      activeLesson,
      counts: getProgressCounts(lessons, state),
      getDraft: (lessonSlug, problemId, language) =>
        state.drafts[getDraftKey(lessonSlug, problemId, language)],
      saveDraft: (lessonSlug, problemId, language, value) => {
        update((current, now) => {
          const key = getDraftKey(lessonSlug, problemId, language)

          return {
            ...current,
            drafts: { ...current.drafts, [key]: value },
            updatedAt: {
              ...current.updatedAt,
              [getUpdatedAtKey('drafts', lessonSlug, problemId, language)]: now,
            },
          }
        })
      },
      getLanguage: (lessonSlug, problemId) =>
        state.languages[getProblemKey(lessonSlug, problemId)],
      setLanguage: (lessonSlug, problemId, language) => {
        update((current, now) => {
          const key = getProblemKey(lessonSlug, problemId)

          return {
            ...current,
            languages: { ...current.languages, [key]: language },
            updatedAt: {
              ...current.updatedAt,
              [getUpdatedAtKey('languages', lessonSlug, problemId)]: now,
            },
          }
        })
      },
      saveTraceAnswer: (lessonSlug, problemId, questionId, value) => {
        update((current, now) => {
          const key = getTraceAnswerKey(lessonSlug, problemId, questionId)

          return {
            ...current,
            traceAnswers: { ...current.traceAnswers, [key]: value },
            updatedAt: {
              ...current.updatedAt,
              [getUpdatedAtKey('traceAnswers', lessonSlug, problemId, questionId)]: now,
            },
          }
        })
      },
      saveWrittenAnswer: (lessonSlug, problemId, value) => {
        update((current, now) => {
          const key = getProblemKey(lessonSlug, problemId)

          return {
            ...current,
            writtenAnswers: { ...current.writtenAnswers, [key]: value },
            updatedAt: {
              ...current.updatedAt,
              [getUpdatedAtKey('writtenAnswers', lessonSlug, problemId)]: now,
            },
          }
        })
      },
      saveDesignAnswer: (lessonSlug, problemId, sectionId, value) => {
        update((current, now) => {
          const key = getDesignAnswerKey(lessonSlug, problemId, sectionId)

          return {
            ...current,
            designAnswers: { ...current.designAnswers, [key]: value },
            updatedAt: {
              ...current.updatedAt,
              [getUpdatedAtKey('designAnswers', lessonSlug, problemId, sectionId)]: now,
            },
          }
        })
      },
      revealReference: (lessonSlug, problemId) => {
        update((current, now) => {
          const key = getProblemKey(lessonSlug, problemId)

          return {
            ...current,
            revealedReferences: { ...current.revealedReferences, [key]: true },
            updatedAt: {
              ...current.updatedAt,
              [getUpdatedAtKey('revealedReferences', lessonSlug, problemId)]: now,
            },
          }
        })
      },
      toggleRubricItem: (lessonSlug, problemId, rubricItemId) => {
        update((current, now) => {
          const key = getProblemKey(lessonSlug, problemId)
          const currentReview = current.rubricReviews[key] ?? {}
          const nextReview = { ...currentReview }

          if (nextReview[rubricItemId]) {
            delete nextReview[rubricItemId]
          } else {
            nextReview[rubricItemId] = true
          }

          return {
            ...current,
            rubricReviews: { ...current.rubricReviews, [key]: nextReview },
            updatedAt: {
              ...current.updatedAt,
              [getUpdatedAtKey('rubricReviews', lessonSlug, problemId, rubricItemId)]: now,
            },
          }
        })
      },
      markComplete: (lessonSlug, problemId) => {
        update((current, now) => {
          const key = getProblemKey(lessonSlug, problemId)

          return {
            ...current,
            completed: { ...current.completed, [key]: true },
            updatedAt: {
              ...current.updatedAt,
              [getUpdatedAtKey('completed', lessonSlug, problemId)]: now,
            },
          }
        })
      },
      isProblemCompleted: (lessonSlug, problemId) =>
        Boolean(state.completed[getProblemKey(lessonSlug, problemId)]),
      getLessonCompletion,
      getTrackCompletion,
      getLessonStatus,
      getRecommendedProblem,
      setFocusLesson: (lessonSlug) => {
        update((current, now) => ({
          ...current,
          learningPath: {
            ...current.learningPath,
            mode: 'self-directed',
            focusLessonSlug: lessonSlug,
            updatedAt: now,
          },
        }))
      },
      resetToGuidedPath: () => {
        update((current, now) => ({
          ...current,
          learningPath: {
            ...current.learningPath,
            mode: 'guided',
            focusLessonSlug: undefined,
            updatedAt: now,
          },
        }))
      },
      queueLesson: (lessonSlug) => {
        update((current, now) => ({
          ...current,
          learningPath: {
            ...current.learningPath,
            queuedLessonSlugs: current.learningPath.queuedLessonSlugs.includes(lessonSlug)
              ? current.learningPath.queuedLessonSlugs
              : [...current.learningPath.queuedLessonSlugs, lessonSlug],
            updatedAt: now,
          },
        }))
      },
      unqueueLesson: (lessonSlug) => {
        update((current, now) => ({
          ...current,
          learningPath: {
            ...current.learningPath,
            queuedLessonSlugs: current.learningPath.queuedLessonSlugs.filter(
              (queuedSlug) => queuedSlug !== lessonSlug,
            ),
            updatedAt: now,
          },
        }))
      },
      saveLastVisited,
      retrySync: async () => undefined,
    }
  }, [isHydrated, saveLastVisited, state, storageKey, update, userId])

  return (
    <ProgressContext.Provider value={contextValue}>
      {children}
    </ProgressContext.Provider>
  )
}

export function ProgressProviderWithOptionalAuth({
  children,
}: {
  children: ReactNode
}) {
  if (!isClerkConfigured) {
    return <ProgressProvider>{children}</ProgressProvider>
  }

  return <AuthenticatedProgressProvider>{children}</AuthenticatedProgressProvider>
}

function AuthenticatedProgressProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, userId } = useAuth()

  return (
    <ProgressProvider userId={isLoaded && isSignedIn ? userId ?? undefined : undefined}>
      {children}
    </ProgressProvider>
  )
}
