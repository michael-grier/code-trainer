export type AppAuthStatus =
  | 'unconfigured'
  | 'loading'
  | 'guest'
  | 'authenticated'
  | 'refreshing'
  | 'failed'

export type AppUser = {
  id: string
  email: string
}

export type CurrentUserResult =
  | { status: 'skipped' | 'pending' | 'error' }
  | { status: 'success'; user: AppUser | null }

type AuthStateInput = {
  configured: boolean
  sessionPending: boolean
  sessionFailed: boolean
  sessionUserId?: string
  convexLoading: boolean
  convexAuthenticated: boolean
  currentUser: CurrentUserResult
  previousUser?: AppUser
}

export type AppAuthSnapshot = {
  status: AppAuthStatus
  user?: AppUser
}

export function resolveAppAuthState({
  configured,
  sessionPending,
  sessionFailed,
  sessionUserId,
  convexLoading,
  convexAuthenticated,
  currentUser,
  previousUser,
}: AuthStateInput): AppAuthSnapshot {
  if (!configured) {
    return { status: 'unconfigured' }
  }

  const retainedUser =
    previousUser?.id === sessionUserId ? previousUser : undefined

  if (sessionPending) {
    return {
      status: retainedUser ? 'refreshing' : 'loading',
      user: retainedUser,
    }
  }

  if (sessionFailed) {
    return { status: 'failed', user: retainedUser }
  }

  if (!sessionUserId) {
    return { status: 'guest' }
  }

  const verifiedUser =
    currentUser.status === 'success' && currentUser.user?.id === sessionUserId
      ? currentUser.user
      : undefined

  if (verifiedUser && convexAuthenticated) {
    return { status: 'authenticated', user: verifiedUser }
  }

  if (
    convexLoading ||
    currentUser.status === 'pending' ||
    currentUser.status === 'skipped' ||
    (currentUser.status === 'success' && currentUser.user?.id !== sessionUserId)
  ) {
    return {
      status: retainedUser ? 'refreshing' : 'loading',
      user: retainedUser,
    }
  }

  return { status: 'failed', user: retainedUser }
}
