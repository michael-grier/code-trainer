import { afterEach, describe, expect, it, vi } from 'vitest'

import { sendAuthEmail } from './email'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

describe('authentication email delivery', () => {
  it('sets a deadline on the provider request', async () => {
    vi.stubEnv('BETTER_AUTH_SECRET', 'test-secret-with-at-least-32-characters')
    vi.stubEnv('RESEND_API_KEY', 'test-resend-key')
    vi.stubEnv('AUTH_EMAIL_FROM', 'Code Trainer <auth@example.com>')
    const timeout = vi.spyOn(AbortSignal, 'timeout')
    const request = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 200 }))

    await sendAuthEmail({
      email: 'learner@example.com',
      otp: '12345678',
      type: 'sign-in',
    })

    expect(timeout).toHaveBeenCalledWith(10_000)
    expect(request).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    )
  })
})
