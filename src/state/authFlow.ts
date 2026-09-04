import { AuthActionError } from '@/state/authContext'

export type AuthErrorAction = 'send' | 'verify' | 'signout'

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export function normalizeEmailCode(code: string) {
  return code.replace(/[\s-]/g, '')
}

export function getCountdownSeconds(deadline: number, now = Date.now()) {
  return Math.max(0, Math.ceil((deadline - now) / 1_000))
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
  if (error.code === 'INVALID_OTP') {
    return 'That code does not match. Check the email and try again.'
  }
  if (error.code === 'OTP_EXPIRED') {
    return 'That code expired. Request a new code to continue.'
  }
  if (error.code === 'TOO_MANY_ATTEMPTS') {
    return 'Too many attempts. Request a new code to continue.'
  }
  if (error.status === 429) {
    return error.retryAfterSeconds
      ? `Request limit reached. Try again in ${error.retryAfterSeconds} seconds.`
      : 'Request limit reached. Please wait before trying again.'
  }
  if (action === 'send') {
    return 'Email could not be sent. You can keep learning locally and retry later.'
  }
  if (action === 'verify') {
    return error.message
  }
  return 'Sign-out did not finish. Your account session is still active.'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}
