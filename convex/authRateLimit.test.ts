import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  createPrivateAuthKey,
  decideAuthRequestRateLimit,
} from './authRateLimit'

const rule = { now: 10_000, windowSeconds: 60, max: 3 }

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('auth request rate limiting', () => {
  it('counts requests atomically within the active window', () => {
    expect(decideAuthRequestRateLimit(null, rule)).toEqual({
      allowed: true,
      retryAfter: null,
      next: { count: 1, lastRequest: 10_000 },
    })
    expect(
      decideAuthRequestRateLimit(
        { count: 2, lastRequest: 9_000 },
        rule,
      ),
    ).toEqual({
      allowed: true,
      retryAfter: null,
      next: { count: 3, lastRequest: 10_000 },
    })
  })

  it('blocks at the limit and reports the remaining whole seconds', () => {
    expect(
      decideAuthRequestRateLimit(
        { count: 3, lastRequest: 9_500 },
        rule,
      ),
    ).toEqual({ allowed: false, retryAfter: 60 })
  })

  it('starts a new window after enough inactivity', () => {
    expect(
      decideAuthRequestRateLimit(
        { count: 3, lastRequest: -50_001 },
        rule,
      ),
    ).toEqual({
      allowed: true,
      retryAfter: null,
      next: { count: 1, lastRequest: 10_000 },
    })
  })

  it('starts a new window at the exact expiry boundary', () => {
    expect(
      decideAuthRequestRateLimit(
        { count: 3, lastRequest: -50_000 },
        rule,
      ),
    ).toEqual({
      allowed: true,
      retryAfter: null,
      next: { count: 1, lastRequest: 10_000 },
    })
  })

  it('stores a stable secret-keyed digest instead of the request identifier', async () => {
    vi.stubEnv('BETTER_AUTH_SECRET', 'test-secret-with-at-least-32-characters')

    const first = await createPrivateAuthKey('github:203.0.113.12')
    const second = await createPrivateAuthKey('github:203.0.113.12')

    expect(first).toBe(second)
    expect(first).toMatch(/^[a-f0-9]{64}$/)
    expect(first).not.toContain('203.0.113.12')
  })
})
