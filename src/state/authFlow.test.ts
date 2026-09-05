import { describe, expect, it } from 'vitest'

import { AuthActionError } from '@/state/authContext'
import {
  getAuthErrorMessage,
  getCountdownSeconds,
  getSignOutReadiness,
  normalizeEmail,
  normalizeEmailCode,
  toAuthActionError,
} from '@/state/authFlow'

describe('email-code auth helpers', () => {
  it('normalizes email and paste-friendly codes at the request boundary', () => {
    expect(normalizeEmail('  Learner@Example.COM ')).toBe(
      'learner@example.com',
    )
    expect(normalizeEmailCode('12 34-56 78')).toBe('12345678')
  })

  it('rounds the resend countdown up and never shows a negative value', () => {
    expect(getCountdownSeconds(61_001, 1_000)).toBe(61)
    expect(getCountdownSeconds(1_000, 1_001)).toBe(0)
  })

  it('maps unknown provider failures to a safe public fallback', () => {
    expect(toAuthActionError('private provider failure', 'Try again.')).toEqual(
      expect.objectContaining({
        message: 'Try again.',
        code: undefined,
        status: undefined,
      }),
    )
  })

  it('presents stable OTP and rate-limit recovery messages', () => {
    expect(
      getAuthErrorMessage(
        new AuthActionError('provider detail', { code: 'INVALID_OTP' }),
        'verify',
      ),
    ).toBe('That code does not match. Check the email and try again.')
    expect(
      getAuthErrorMessage(
        new AuthActionError('provider detail', {
          status: 429,
          retryAfterSeconds: 42,
        }),
        'send',
      ),
    ).toBe('Request limit reached. Try again in 42 seconds.')
    expect(
      getAuthErrorMessage(
        new AuthActionError('provider detail'),
        'send',
      ),
    ).toBe(
      'Email could not be sent. You can keep learning locally and retry later.',
    )
  })

  it('requires a completed flush before ordinary sign-out continues', async () => {
    await expect(getSignOutReadiness(async () => true)).resolves.toBe('ready')
    await expect(getSignOutReadiness(async () => false)).resolves.toBe(
      'unsynced',
    )
    await expect(
      getSignOutReadiness(async () => {
        throw new Error('offline')
      }),
    ).resolves.toBe('unsynced')
  })
})
