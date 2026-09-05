import { describe, expect, it } from 'vitest'

import { resolveAppAuthState, type AppUser } from '@/state/authState'

const user: AppUser = { id: 'user-one', email: 'one@example.com' }
const baseInput = {
  configured: true,
  sessionPending: false,
  sessionFailed: false,
  sessionUserId: user.id,
  convexLoading: false,
  convexAuthenticated: true,
  currentUser: { status: 'success', user } as const,
}

describe('application auth state', () => {
  it('keeps guest-only mode explicit when auth is not configured', () => {
    expect(
      resolveAppAuthState({ ...baseInput, configured: false }),
    ).toEqual({ status: 'unconfigured' })
  })

  it('does not treat a Better Auth session alone as authenticated', () => {
    expect(
      resolveAppAuthState({
        ...baseInput,
        convexAuthenticated: false,
        currentUser: { status: 'error' },
      }),
    ).toEqual({ status: 'failed' })
  })

  it('authenticates only a matching Convex-validated user', () => {
    expect(resolveAppAuthState(baseInput)).toEqual({
      status: 'authenticated',
      user,
    })
  })

  it('retains the same account cache while its token refreshes', () => {
    expect(
      resolveAppAuthState({
        ...baseInput,
        convexAuthenticated: false,
        convexLoading: true,
        currentUser: { status: 'pending' },
        previousUser: user,
      }),
    ).toEqual({ status: 'refreshing', user })
  })

  it('does not retain one account while a different account signs in', () => {
    expect(
      resolveAppAuthState({
        ...baseInput,
        sessionUserId: 'user-two',
        currentUser: { status: 'pending' },
        previousUser: user,
      }),
    ).toEqual({ status: 'loading', user: undefined })
  })

  it('distinguishes a failed session check from a confirmed sign-out', () => {
    expect(
      resolveAppAuthState({
        ...baseInput,
        sessionFailed: true,
        previousUser: user,
      }),
    ).toEqual({ status: 'failed', user })

    expect(
      resolveAppAuthState({
        ...baseInput,
        sessionUserId: undefined,
        convexAuthenticated: false,
        currentUser: { status: 'skipped' },
      }),
    ).toEqual({ status: 'guest' })
  })
})
