import { useConvexAuth, useQuery_experimental as useConvexQuery } from 'convex/react'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { authClient } from '@/lib/auth-client'
import { authApi } from '@/lib/convexAuthApi'
import { clearProgressState, getProgressStorageKey } from '@/lib/storage'
import {
  broadcastSignedOut,
  listenForSignedOut,
} from '@/state/authBroadcast'
import {
  AuthActionError,
  AuthContext,
  type AppAuth,
} from '@/state/authContext'
import { toAuthActionError } from '@/state/authFlow'
import {
  resolveAppAuthState,
  type AppUser,
  type CurrentUserResult,
} from '@/state/authState'

export function UnconfiguredAuthProvider({ children }: { children: ReactNode }) {
  const unavailable = useCallback(async () => {
    throw new AuthActionError('Account sync is not configured.', {
      code: 'AUTH_UNCONFIGURED',
    })
  }, [])
  const value = useMemo<AppAuth>(
    () => ({
      status: 'unconfigured',
      signInWithGitHub: unavailable,
      signOut: unavailable,
      signOutAllDevices: unavailable,
    }),
    [unavailable],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function AppAuthProvider({ children }: { children: ReactNode }) {
  const session = authClient.useSession()
  const convexAuth = useConvexAuth()
  const rawSessionUserId = session.data?.user.id
  const refetchSession = session.refetch
  const [isRemoteSignOutPending, setIsRemoteSignOutPending] = useState(false)
  const sessionUserId = isRemoteSignOutPending ? undefined : rawSessionUserId
  const currentUserQuery = useConvexQuery({
    query: authApi.getCurrentUser,
    args: convexAuth.isAuthenticated ? {} : 'skip',
  })
  const [previousUser, setPreviousUser] = useState<AppUser>()
  const currentUser = toCurrentUserResult(currentUserQuery)
  const snapshot = resolveAppAuthState({
    configured: true,
    sessionPending: session.isPending,
    sessionFailed: Boolean(session.error),
    sessionUserId,
    convexLoading: convexAuth.isLoading,
    convexAuthenticated: convexAuth.isAuthenticated,
    currentUser,
    previousUser,
  })

  useEffect(() => {
    if (snapshot.status === 'authenticated') {
      setPreviousUser(snapshot.user)
    } else if (snapshot.status === 'guest') {
      setPreviousUser(undefined)
    }
  }, [snapshot.status, snapshot.user])

  useEffect(
    () =>
      listenForSignedOut((signedOutUserId) => {
        clearProgressState(
          window.localStorage,
          getProgressStorageKey(signedOutUserId),
        )

        if (
          signedOutUserId !== rawSessionUserId &&
          signedOutUserId !== previousUser?.id
        ) {
          return
        }

        // Hide the account immediately instead of waiting on a network refresh.
        setPreviousUser(undefined)
        setIsRemoteSignOutPending(true)
        void refetchSession().finally(() => setIsRemoteSignOutPending(false))
      }),
    [previousUser?.id, rawSessionUserId, refetchSession],
  )

  const signInWithGitHub = useCallback(async () => {
    const returnPath = `${window.location.pathname}${window.location.search}${window.location.hash}`
    const result = await authClient.signIn.social({
      provider: 'github',
      callbackURL: returnPath,
      errorCallbackURL: returnPath,
    })

    if (result.error) {
      throw toAuthActionError(result.error, 'GitHub sign-in could not start.')
    }
  }, [])

  const signOut = useCallback(async () => {
    const userId = rawSessionUserId
    const result = await authClient.signOut()

    if (result.error) {
      throw toAuthActionError(result.error, 'We could not sign you out.')
    }

    clearSignedOutAccount(userId)
    await refetchSession()
  }, [rawSessionUserId, refetchSession])

  const signOutAllDevices = useCallback(async () => {
    const userId = rawSessionUserId
    const revokeResult = await authClient.revokeOtherSessions()

    if (revokeResult.error) {
      throw toAuthActionError(
        revokeResult.error,
        'We could not sign out your other devices.',
      )
    }

    const signOutResult = await authClient.signOut()

    if (signOutResult.error) {
      throw toAuthActionError(signOutResult.error, 'We could not sign you out.')
    }

    clearSignedOutAccount(userId)
    await refetchSession()
  }, [rawSessionUserId, refetchSession])

  const value = useMemo<AppAuth>(
    () => ({
      ...snapshot,
      signInWithGitHub,
      signOut,
      signOutAllDevices,
    }),
    [signInWithGitHub, signOut, signOutAllDevices, snapshot],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function toCurrentUserResult(
  result: ReturnType<typeof useConvexQuery>,
): CurrentUserResult {
  if (result.status === 'success') {
    return { status: 'success', user: result.data }
  }

  return { status: result.status }
}

function clearSignedOutAccount(userId: string | undefined) {
  if (!userId) {
    return
  }

  // BroadcastChannel does not echo to its sender, so this tab clears itself.
  clearProgressState(window.localStorage, getProgressStorageKey(userId))
  broadcastSignedOut(userId)
}
