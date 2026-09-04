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
import {
  AuthActionError,
  AuthContext,
  type AppAuth,
  type VerifyCodeInput,
} from '@/state/authContext'
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
      requestCode: unavailable,
      verifyCode: unavailable,
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
  const sessionUserId = session.data?.user.id
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

  const requestCode = useCallback(async (email: string) => {
    const result = await authClient.emailOtp.sendVerificationOtp({
      email: normalizeEmail(email),
      type: 'sign-in',
    })

    if (result.error) {
      throw toAuthActionError(result.error, 'We could not send a sign-in code.')
    }
  }, [])

  const verifyCode = useCallback(
    async ({ email, code }: VerifyCodeInput) => {
      const normalizedCode = code.replace(/[\s-]/g, '')

      if (!/^\d{8}$/.test(normalizedCode)) {
        throw new AuthActionError('Enter the 8-digit code from your email.', {
          code: 'INVALID_CODE_FORMAT',
          status: 400,
        })
      }

      const result = await authClient.signIn.emailOtp({
        email: normalizeEmail(email),
        otp: normalizedCode,
      })

      if (result.error) {
        throw toAuthActionError(result.error, 'That sign-in code did not work.')
      }

      await session.refetch()
    },
    [session],
  )

  const signOut = useCallback(async () => {
    const result = await authClient.signOut()

    if (result.error) {
      throw toAuthActionError(result.error, 'We could not sign you out.')
    }

    await session.refetch()
  }, [session])

  const signOutAllDevices = useCallback(async () => {
    const revokeResult = await authClient.revokeSessions()

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

    await session.refetch()
  }, [session])

  const value = useMemo<AppAuth>(
    () => ({
      ...snapshot,
      requestCode,
      verifyCode,
      signOut,
      signOutAllDevices,
    }),
    [requestCode, signOut, signOutAllDevices, snapshot, verifyCode],
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

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function toAuthActionError(error: unknown, fallbackMessage: string) {
  if (!isRecord(error)) {
    return new AuthActionError(fallbackMessage)
  }

  return new AuthActionError(
    typeof error.message === 'string' ? error.message : fallbackMessage,
    {
      code: typeof error.code === 'string' ? error.code : undefined,
      status: typeof error.status === 'number' ? error.status : undefined,
      retryAfterSeconds:
        typeof error.retryAfterSeconds === 'number'
          ? error.retryAfterSeconds
          : undefined,
    },
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}
