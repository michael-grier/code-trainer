import { afterEach, describe, expect, it, vi } from 'vitest'

import { proxyAuthRequest } from '../api/auth'

describe('Vercel auth proxy', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('forwards the auth request and trusts only Vercel client IP metadata', async () => {
    vi.stubEnv('CONVEX_SITE_URL', 'https://demo.convex.site')

    const upstreamHeaders = new Headers({
      'cache-control': 'no-store',
      'content-type': 'application/json',
    })
    upstreamHeaders.append(
      'set-cookie',
      'code_trainer.session=abc; HttpOnly; Secure; SameSite=Strict; Path=/',
    )
    upstreamHeaders.append(
      'set-cookie',
      'code_trainer.preference=compact; Secure; SameSite=Strict; Path=/',
    )
    const upstreamResponse = new Response('{"ok":true}', {
      status: 200,
      headers: upstreamHeaders,
    })
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(upstreamResponse)
    vi.stubGlobal('fetch', fetchMock)

    const response = await proxyAuthRequest(
      new Request(
        'https://trainer.example.com/api/auth?__auth_path=sign-in/email-otp&returnTo=%2Fprogress',
        {
          method: 'POST',
          headers: {
            cookie: 'code_trainer.session=abc',
            host: 'trainer.example.com',
            origin: 'https://trainer.example.com',
            'x-forwarded-for': '198.51.100.40',
            'x-real-ip': '198.51.100.41',
            'x-vercel-forwarded-for': '203.0.113.12',
          },
          body: '{"email":"learner@example.com"}',
        },
      ),
    )

    expect(response).toBe(upstreamResponse)
    expect(response.headers.getSetCookie()).toEqual([
      'code_trainer.session=abc; HttpOnly; Secure; SameSite=Strict; Path=/',
      'code_trainer.preference=compact; Secure; SameSite=Strict; Path=/',
    ])
    expect(fetchMock).toHaveBeenCalledOnce()

    const [url, init] = fetchMock.mock.calls[0]
    const headers = new Headers(init?.headers)

    expect(url.toString()).toBe(
      'https://demo.convex.site/api/auth/sign-in/email-otp?returnTo=%2Fprogress',
    )
    expect(init?.method).toBe('POST')
    expect(new TextDecoder().decode(init?.body as ArrayBuffer)).toBe(
      '{"email":"learner@example.com"}',
    )
    expect(headers.get('cookie')).toBe('code_trainer.session=abc')
    expect(headers.get('origin')).toBe('https://trainer.example.com')
    expect(headers.get('host')).toBeNull()
    expect(headers.get('x-forwarded-for')).toBeNull()
    expect(headers.get('x-vercel-forwarded-for')).toBeNull()
    expect(headers.get('x-real-ip')).toBe('203.0.113.12')
  })

  it('rejects missing configuration without contacting another host', async () => {
    vi.stubEnv('CONVEX_SITE_URL', '')
    const fetchMock = vi.fn<typeof fetch>()
    vi.stubGlobal('fetch', fetchMock)

    const response = await proxyAuthRequest(
      new Request(
        'https://trainer.example.com/api/auth?__auth_path=get-session',
      ),
    )

    expect(response.status).toBe(503)
    expect(response.headers.get('cache-control')).toBe('no-store')
    await expect(response.json()).resolves.toEqual({
      error: 'Account sync is not configured.',
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it.each([
    'https://trainer.example.com/api/auth',
    'https://trainer.example.com/api/auth?__auth_path=../progress',
    'https://trainer.example.com/api/auth?__auth_path=get-session&__auth_path=sign-out',
  ])('rejects an invalid rewritten route: %s', async (url) => {
    vi.stubEnv('CONVEX_SITE_URL', 'https://demo.convex.site')
    const fetchMock = vi.fn<typeof fetch>()
    vi.stubGlobal('fetch', fetchMock)

    const response = await proxyAuthRequest(new Request(url))

    expect(response.status).toBe(404)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns a generic uncached response when Convex cannot be reached', async () => {
    vi.stubEnv('CONVEX_SITE_URL', 'https://demo.convex.site')
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockRejectedValue(new Error('private upstream error')),
    )

    const response = await proxyAuthRequest(
      new Request(
        'https://trainer.example.com/api/auth?__auth_path=get-session',
      ),
    )

    expect(response.status).toBe(502)
    expect(response.headers.get('cache-control')).toBe('no-store')
    await expect(response.json()).resolves.toEqual({
      error: 'Authentication service is unavailable.',
    })
  })
})
