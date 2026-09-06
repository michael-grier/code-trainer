import { AuthActionError } from '@/state/authContext'

export type AuthErrorAction = 'signin' | 'signout'

export async function getSignOutReadiness(
  flushProgress: () => Promise<boolean>,
): Promise<'ready' | 'unsynced'> {
  try {
    return (await flushProgress()) ? 'ready' : 'unsynced'
  } catch {
    return 'unsynced'
  }
}

export function toAuthActionError(error: unknown, fallbackMessage: string) {
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

export function getAuthErrorMessage(
  error: AuthActionError,
  action: AuthErrorAction,
) {
  if (error.status === 429) {
    return error.retryAfterSeconds
      ? `Request limit reached. Try again in ${error.retryAfterSeconds} seconds.`
      : 'Request limit reached. Please wait before trying again.'
  }
  if (action === 'signin') {
    return 'GitHub sign-in did not start. You can keep learning locally and retry later.'
  }
  return 'Sign-out did not finish. Your account session is still active.'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}
