import { describe, expect, it } from 'vitest'

import { decideAuthRequestRateLimit } from './authRateLimit'

const rule = { now: 10_000, windowSeconds: 60, max: 3 }

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
})
