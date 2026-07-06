import { useAuth } from '@clerk/clerk-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  useMutation,
  useQuery_experimental as useConvexQuery,
} from 'convex/react'

import { lessons } from '@/curriculum'
import { progressApi } from '@/lib/convexProgressApi'
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
import { isClerkConfigured, isConvexConfigured } from '@/lib/env'
import {
  cloudSnapshotToProgressState,
  getProgressRevision,
  markProgressSynced,
  mergeProgressStates,
  progressStateToCloudSnapshot,
  type CloudProgressSnapshot,
} from '@/state/cloudProgress'
import {
  ProgressContext,
  type ProgressContextValue,
  type SyncStatus,
} from '@/state/progressContext'

type ProgressProviderProps = {
  children: ReactNode
  userId?: string
  cloud?: {
    enabled: boolean
    snapshot?: CloudProgressSnapshot
    isLoading: boolean
    error?: Error
    saveProgress?: (args: { progress: CloudProgressSnapshot }) => Promise<null>
  }
}

type FlushMode = 'debounced' | 'immediate'

export function ProgressProvider({ children, cloud, userId }: ProgressProviderProps) {
  const storageKey = getProgressStorageKey(userId)
  const [state, setState] = useState<ProgressState>(() => createEmptyProgressState())
  const [isHydrated, setIsHydrated] = useState(false)
  const [hasMergedCloud, setHasMergedCloud] = useState(false)
  const [hasPendingCloudWrite, setHasPendingCloudWrite] = useState(false)
  const [syncError, setSyncError] = useState<Error | null>(null)
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestStateRef = useRef(state)
  const mergedCloudUserRef = useRef<string | undefined>(undefined)
  const requestedFlushModeRef = useRef<FlushMode>('debounced')
  const isOnline = useOnlineStatus()
  const cloudEnabled = cloud?.enabled ?? false
  const cloudSnapshot = cloud?.snapshot
  const cloudIsLoading = cloud?.isLoading ?? false
  const cloudError = cloud?.error
  const saveCloudProgress = cloud?.saveProgress
  const canUseCloud = Boolean(userId && cloudEnabled && saveCloudProgress)

  useEffect(() => {
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current)
      flushTimerRef.current = null
    }

    setIsHydrated(false)
    setState(loadProgressState(window.localStorage, storageKey))
    setSyncError(null)
    setHasPendingCloudWrite(false)
    setHasMergedCloud(false)
    mergedCloudUserRef.current = undefined
    requestedFlushModeRef.current = 'debounced'
    setIsHydrated(true)
  }, [storageKey])

  useEffect(() => {
    latestStateRef.current = state
  }, [state])

  const flushCloudProgress = useCallback(async () => {
    if (!canUseCloud || !saveCloudProgress || !hasMergedCloud || !isOnline) {
      return
    }

    const stateToFlush = latestStateRef.current
    const revisionAtFlush = getProgressRevision(stateToFlush)

    if (revisionAtFlush <= (stateToFlush.lastSyncedAt ?? 0)) {
      setHasPendingCloudWrite(false)
      return
    }

    setHasPendingCloudWrite(true)

    try {
      await saveCloudProgress({
        progress: progressStateToCloudSnapshot(stateToFlush, revisionAtFlush),
      })

      const hasNewerLocalChanges =
        getProgressRevision(latestStateRef.current) > revisionAtFlush

      setSyncError(null)
      setHasPendingCloudWrite(hasNewerLocalChanges)
      setState((current) =>
        markProgressSynced(
          current,
          Math.max(current.lastSyncedAt ?? 0, revisionAtFlush),
        ),
      )
    } catch (error) {
      setSyncError(error instanceof Error ? error : new Error('Cloud sync failed'))
      setHasPendingCloudWrite(true)
    }
  }, [canUseCloud, hasMergedCloud, isOnline, saveCloudProgress])

  useEffect(() => {
    if (
      !isHydrated ||
      !canUseCloud ||
      !cloudSnapshot ||
      cloudIsLoading ||
      cloudError ||
      !userId ||
      mergedCloudUserRef.current === userId
    ) {
      return
    }

    const authenticatedCache = loadProgressState(
      window.localStorage,
      getProgressStorageKey(userId),
    )
    const guestCache = loadProgressState(
      window.localStorage,
      getProgressStorageKey(),
    )
    const cloudState = cloudSnapshotToProgressState(cloudSnapshot)
    const localState = mergeProgressStates(authenticatedCache, guestCache)
    const mergedState = mergeProgressStates(localState, cloudState)

    requestedFlushModeRef.current = 'immediate'
    mergedCloudUserRef.current = userId
    setSyncError(null)
    setHasPendingCloudWrite(true)
    setHasMergedCloud(true)
    setState(mergedState)
  }, [
    canUseCloud,
    cloudError,
    cloudIsLoading,
    cloudSnapshot,
    isHydrated,
    userId,
  ])

  useEffect(() => {
    if (!isHydrated) {
      return
    }

    saveProgressState(window.localStorage, storageKey, state)

    if (!canUseCloud || !saveCloudProgress || !hasMergedCloud) {
      return
    }

    const revision = getProgressRevision(state)

    if (revision <= (state.lastSyncedAt ?? 0)) {
      setHasPendingCloudWrite(false)
      return
    }

    setHasPendingCloudWrite(true)

    if (!isOnline) {
      return
    }

    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current)
    }

    const delay = requestedFlushModeRef.current === 'immediate' ? 0 : 750
    requestedFlushModeRef.current = 'debounced'
    flushTimerRef.current = setTimeout(() => {
      flushTimerRef.current = null
      void flushCloudProgress()
    }, delay)

    return () => {
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current)
        flushTimerRef.current = null
      }
    }
  }, [
    canUseCloud,
    flushCloudProgress,
    hasMergedCloud,
    isHydrated,
    isOnline,
    saveCloudProgress,
    state,
    storageKey,
  ])

  const update = useCallback(
    (
      recipe: (current: ProgressState, now: number) => ProgressState,
      flushMode: FlushMode = 'debounced',
    ) => {
      if (flushMode === 'immediate') {
        requestedFlushModeRef.current = 'immediate'
      }

      setState((current) => recipe(current, Date.now()))
    },
    [],
  )

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

  const syncStatus = useMemo<SyncStatus>(() => {
    if (!userId) {
      return 'guest'
    }

    if (!cloudEnabled || !saveCloudProgress) {
      return 'saved-locally'
    }

    if (!isOnline) {
      return 'saved-locally'
    }

    if (syncError || cloudError) {
      return 'failed'
    }

    if (cloudIsLoading || !hasMergedCloud) {
      return 'loading-cloud'
    }

    if (
      hasPendingCloudWrite ||
      getProgressRevision(state) > (state.lastSyncedAt ?? 0)
    ) {
      return 'syncing'
    }

    return 'synced'
  }, [
    cloudEnabled,
    cloudError,
    cloudIsLoading,
    hasMergedCloud,
    hasPendingCloudWrite,
    isOnline,
    saveCloudProgress,
    state,
    syncError,
    userId,
  ])

  const retrySync = useCallback(async () => {
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current)
      flushTimerRef.current = null
    }

    requestedFlushModeRef.current = 'immediate'
    await flushCloudProgress()
  }, [flushCloudProgress])

  const contextValue = useMemo<ProgressContextValue>(() => {
    const recommendedLesson = getRecommendedLesson(lessons, state)
    const activeLesson = getActiveLesson(lessons, state)

    return {
      state,
      storageKey,
      syncStatus,
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
        }, 'immediate')
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
        }, 'immediate')
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
        }, 'immediate')
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
          updatedAt: {
            ...current.updatedAt,
            [getUpdatedAtKey('learningPath')]: now,
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
          updatedAt: {
            ...current.updatedAt,
            [getUpdatedAtKey('learningPath')]: now,
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
          updatedAt: {
            ...current.updatedAt,
            [getUpdatedAtKey('learningPath')]: now,
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
          updatedAt: {
            ...current.updatedAt,
            [getUpdatedAtKey('learningPath')]: now,
          },
        }))
      },
      saveLastVisited,
      retrySync,
    }
  }, [isHydrated, retrySync, saveLastVisited, state, storageKey, syncStatus, update])

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
  const signedInUserId = isLoaded && isSignedIn ? userId ?? undefined : undefined

  if (!isConvexConfigured) {
    return <ProgressProvider userId={signedInUserId}>{children}</ProgressProvider>
  }

  return (
    <CloudBackedProgressProvider userId={signedInUserId}>
      {children}
    </CloudBackedProgressProvider>
  )
}

function CloudBackedProgressProvider({
  children,
  userId,
}: {
  children: ReactNode
  userId?: string
}) {
  const queryResult = useConvexQuery({
    query: progressApi.getProgress,
    args: userId ? {} : 'skip',
  })
  const saveProgress = useMutation(progressApi.mergeProgress)
  const cloudSnapshot =
    queryResult.status === 'success' ? queryResult.data : undefined
  const cloudError = queryResult.status === 'error' ? queryResult.error : undefined
  const cloudIsLoading = Boolean(userId) && queryResult.status === 'pending'
  const cloud = useMemo(
    () => ({
      enabled: Boolean(userId),
      snapshot: cloudSnapshot,
      isLoading: cloudIsLoading,
      error: cloudError,
      saveProgress,
    }),
    [cloudError, cloudIsLoading, cloudSnapshot, saveProgress, userId],
  )

  return (
    <ProgressProvider cloud={cloud} userId={userId}>
      {children}
    </ProgressProvider>
  )
}

function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)

  useEffect(() => {
    const markOnline = () => setIsOnline(true)
    const markOffline = () => setIsOnline(false)

    window.addEventListener('online', markOnline)
    window.addEventListener('offline', markOffline)

    return () => {
      window.removeEventListener('online', markOnline)
      window.removeEventListener('offline', markOffline)
    }
  }, [])

  return isOnline
}
