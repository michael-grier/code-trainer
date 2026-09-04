import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  useConvexAuth,
  useMutation,
  useQuery_experimental as useConvexQuery,
} from 'convex/react'

import { lessons } from '@/curriculum'
import { progressApi } from '@/lib/convexProgressApi'
import {
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
import {
  cloudSnapshotToProgressState,
  getProgressRevision,
  markProgressSynced,
  mergeProgressStates,
  progressStateToCloudSnapshot,
  summarizeProgress,
  type CloudProgressSnapshot,
} from '@/state/cloudProgress'
import { useAppAuth } from '@/state/authContext'
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

type PendingProgressHandoff = {
  account: ProgressState
  guest: ProgressState
}

export function ProgressProvider({ children, cloud, userId }: ProgressProviderProps) {
  const storageKey = getProgressStorageKey(userId)
  const [state, setState] = useState<ProgressState>(() => createEmptyProgressState())
  const [isHydrated, setIsHydrated] = useState(false)
  const [hasMergedCloud, setHasMergedCloud] = useState(false)
  const [hasPendingCloudWrite, setHasPendingCloudWrite] = useState(false)
  const [pendingHandoff, setPendingHandoff] =
    useState<PendingProgressHandoff>()
  const [isHandoffSaving, setIsHandoffSaving] = useState(false)
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
    setPendingHandoff(undefined)
    setIsHandoffSaving(false)
    mergedCloudUserRef.current = undefined
    requestedFlushModeRef.current = 'debounced'
    setIsHydrated(true)
  }, [storageKey])

  useEffect(() => {
    latestStateRef.current = state
  }, [state])

  const flushCloudProgress = useCallback(async () => {
    const stateToFlush = latestStateRef.current
    const revisionAtFlush = getProgressRevision(stateToFlush)

    if (revisionAtFlush <= (stateToFlush.lastSyncedAt ?? 0)) {
      setHasPendingCloudWrite(false)
      return true
    }

    if (!canUseCloud || !saveCloudProgress || !hasMergedCloud || !isOnline) {
      return false
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
      return !hasNewerLocalChanges
    } catch (error) {
      setSyncError(error instanceof Error ? error : new Error('Cloud sync failed'))
      setHasPendingCloudWrite(true)
      return false
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
    const accountState = mergeProgressStates(authenticatedCache, cloudState)
    const guestSummary = summarizeProgress(guestCache)

    mergedCloudUserRef.current = userId
    setSyncError(null)

    if (guestSummary.hasMeaningfulWork) {
      latestStateRef.current = accountState
      setState(accountState)
      setPendingHandoff({ account: accountState, guest: guestCache })
      setHasPendingCloudWrite(false)
      setHasMergedCloud(false)
      return
    }

    requestedFlushModeRef.current = 'immediate'
    latestStateRef.current = accountState
    setState(accountState)
    setHasPendingCloudWrite(true)
    setHasMergedCloud(true)
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

      setState((current) => {
        const next = recipe(current, Date.now())

        latestStateRef.current = next
        return next
      })
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

    if (cloudIsLoading || pendingHandoff || !hasMergedCloud) {
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
    pendingHandoff,
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

  const flushProgress = useCallback(async () => {
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current)
      flushTimerRef.current = null
    }

    requestedFlushModeRef.current = 'immediate'
    return flushCloudProgress()
  }, [flushCloudProgress])

  const moveAndContinue = useCallback(async () => {
    if (
      !pendingHandoff ||
      !userId ||
      !canUseCloud ||
      !saveCloudProgress ||
      !isOnline
    ) {
      return false
    }

    // The sheet can be dismissed, so include account edits made while the
    // handoff is pending instead of merging the initial account snapshot.
    const merged = mergeProgressStates(
      latestStateRef.current,
      pendingHandoff.guest,
    )
    const revision = getProgressRevision(merged)

    setIsHandoffSaving(true)

    try {
      await saveCloudProgress({
        progress: progressStateToCloudSnapshot(merged, revision),
      })

      const synced = markProgressSynced(merged, revision)

      latestStateRef.current = synced
      saveProgressState(window.localStorage, getProgressStorageKey(userId), synced)
      window.localStorage.removeItem(getProgressStorageKey())
      setState(synced)
      setPendingHandoff(undefined)
      setHasMergedCloud(true)
      setHasPendingCloudWrite(false)
      setSyncError(null)
      return true
    } catch (error) {
      setSyncError(error instanceof Error ? error : new Error('Cloud sync failed'))
      return false
    } finally {
      setIsHandoffSaving(false)
    }
  }, [
    canUseCloud,
    isOnline,
    pendingHandoff,
    saveCloudProgress,
    userId,
  ])

  const useAccountProgress = useCallback(() => {
    if (!pendingHandoff) {
      return
    }

    requestedFlushModeRef.current = 'immediate'
    setPendingHandoff(undefined)
    setHasMergedCloud(true)
    setHasPendingCloudWrite(true)
    setSyncError(null)
  }, [pendingHandoff])

  const contextValue = useMemo<ProgressContextValue>(() => {
    const recommendedLesson = getRecommendedLesson(lessons, state)

    return {
      state,
      storageKey,
      syncStatus,
      isHydrated,
      handoff: pendingHandoff
        ? {
            device: summarizeProgress(pendingHandoff.guest),
            account: summarizeProgress(state),
            isSaving: isHandoffSaving,
            moveAndContinue,
            useAccountProgress,
          }
        : undefined,
      recommendedLesson,
      counts: getProgressCounts(lessons, state),
      getDraft: (lessonSlug, problemId) =>
        state.drafts[getDraftKey(lessonSlug, problemId)],
      saveDraft: (lessonSlug, problemId, value) => {
        update((current, now) => {
          const key = getDraftKey(lessonSlug, problemId)

          return {
            ...current,
            drafts: { ...current.drafts, [key]: value },
            updatedAt: {
              ...current.updatedAt,
              [getUpdatedAtKey('drafts', lessonSlug, problemId)]: now,
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
      saveLastVisited,
      flushProgress,
      retrySync,
    }
  }, [
    flushProgress,
    isHandoffSaving,
    isHydrated,
    moveAndContinue,
    pendingHandoff,
    retrySync,
    saveLastVisited,
    state,
    storageKey,
    syncStatus,
    update,
    useAccountProgress,
  ])

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
  const auth = useAppAuth()

  if (auth.status === 'unconfigured') {
    return <ProgressProvider>{children}</ProgressProvider>
  }

  return <ConfiguredProgressProvider>{children}</ConfiguredProgressProvider>
}

function ConfiguredProgressProvider({ children }: { children: ReactNode }) {
  const auth = useAppAuth()
  const convexAuth = useConvexAuth()
  const userId = auth.user?.id
  const cloudReady =
    auth.status === 'authenticated' && convexAuth.isAuthenticated

  if (!userId) {
    return <ProgressProvider key="guest">{children}</ProgressProvider>
  }

  return (
    <CloudBackedProgressProvider
      cloudReady={cloudReady}
      key={userId}
      userId={userId}
    >
      {children}
    </CloudBackedProgressProvider>
  )
}

function CloudBackedProgressProvider({
  children,
  cloudReady,
  userId,
}: {
  children: ReactNode
  cloudReady: boolean
  userId: string
}) {
  const queryResult = useConvexQuery({
    query: progressApi.getProgress,
    args: cloudReady ? {} : 'skip',
  })
  const mergeProgress = useMutation(progressApi.mergeProgress)
  const saveProgress = useCallback(
    ({ progress }: { progress: CloudProgressSnapshot }) =>
      mergeProgress({ expectedUserId: userId, progress }),
    [mergeProgress, userId],
  )
  const matchingResponse =
    queryResult.status === 'success' && queryResult.data.userId === userId
      ? queryResult.data
      : undefined
  const cloudSnapshot =
    matchingResponse?.progress
  const cloudError = queryResult.status === 'error' ? queryResult.error : undefined
  const cloudIsLoading =
    cloudReady &&
    (queryResult.status === 'pending' ||
      (queryResult.status === 'success' && !matchingResponse))
  const cloud = useMemo(
    () => ({
      enabled: cloudReady,
      snapshot: cloudSnapshot,
      isLoading: cloudIsLoading,
      error: cloudError,
      saveProgress,
    }),
    [cloudError, cloudIsLoading, cloudReady, cloudSnapshot, saveProgress],
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
