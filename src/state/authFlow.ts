import { AuthActionError } from '@/state/authContext'

export type AuthErrorAction = 'signin' | 'signout'

export const GITHUB_AUTH_ERROR_QUERY_PARAM = 'githubAuthError'
export const GITHUB_AUTH_RETURN_TO_QUERY_PARAM = 'githubAuthReturnTo'
export const GITHUB_SIGN_IN_ERROR_MESSAGE =
  'GitHub sign-in did not finish. You can keep learning locally and retry later.'

/** Builds same-origin success and error destinations for the GitHub round trip. */
export function getGitHubAuthRedirects(currentUrl: URL) {
  const returnPath = `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`
  const errorCallbackUrl = new URL(currentUrl)

  // Better Auth appends its error query after this URL, so keep the fragment
  // inside returnTo and restore it after the callback instead.
  errorCallbackUrl.hash = ''
  errorCallbackUrl.searchParams.set(GITHUB_AUTH_ERROR_QUERY_PARAM, '1')
  errorCallbackUrl.searchParams.set(
    GITHUB_AUTH_RETURN_TO_QUERY_PARAM,
    returnPath,
  )

  return {
    callbackURL: returnPath,
    errorCallbackURL: errorCallbackUrl.toString(),
  }
}

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
    return GITHUB_SIGN_IN_ERROR_MESSAGE
  }
  return 'Sign-out did not finish. Your account session is still active.'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}
