import { describe, expect, it } from 'vitest'

import { AuthActionError } from '@/state/authContext'
import {
  getAuthErrorMessage,
  getSignOutReadiness,
  toAuthActionError,
} from '@/state/authFlow'

describe('auth helpers', () => {
  it('maps unknown provider failures to a safe public fallback', () => {
    expect(toAuthActionError('private provider failure', 'Try again.')).toEqual(
      expect.objectContaining({
        message: 'Try again.',
        code: undefined,
        status: undefined,
      }),
    )
  })

  it('presents stable sign-in and rate-limit recovery messages', () => {
    expect(
      getAuthErrorMessage(
        new AuthActionError('private provider detail'),
        'signin',
      ),
    ).toBe(
      'GitHub sign-in did not start. You can keep learning locally and retry later.',
    )
    expect(
      getAuthErrorMessage(
        new AuthActionError('provider detail', {
          status: 429,
          retryAfterSeconds: 42,
        }),
        'signin',
      ),
    ).toBe('Request limit reached. Try again in 42 seconds.')
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
