import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { expect, test, type BrowserContext } from '@playwright/test'

const appUrl = 'http://127.0.0.1:5173'

test('keeps the auth cookie first-party and hides it from app code', async ({
  context,
  page,
}) => {
  await page.goto('/')
  await expect(page).toHaveTitle('Code Trainer | Interactive TypeScript Practice')

  const response = await page.request.post('/api/auth/probe/set', {
    headers: {
      origin: 'http://127.0.0.1:5173',
      'x-forwarded-for': '203.0.113.10',
      'x-real-ip': '198.51.100.12',
    },
  })
  const proxyHeaders = await response.json()

  expect(response.ok()).toBe(true)
  expect(proxyHeaders).toEqual({
    forwardedFor: null,
    host: '127.0.0.1:4174',
    origin: 'http://127.0.0.1:5173',
    realIp: expect.stringMatching(/^(::ffff:)?127\.0\.0\.1$/),
  })

  const cookie = (await context.cookies()).find(
    ({ name }) => name === 'code_trainer_auth_probe',
  )

  expect(cookie).toMatchObject({
    domain: '127.0.0.1',
    httpOnly: true,
    path: '/',
    sameSite: 'Strict',
    value: 'persistent',
  })
  expect(cookie?.expires).toBeGreaterThan(Date.now() / 1000 + 29 * 24 * 60 * 60)
  expect(await page.evaluate<string>('document.cookie')).not.toContain(
    'code_trainer_auth_probe',
  )

  const session = await page.request.get('/api/auth/probe/session')
  await expect(session.json()).resolves.toEqual({ authenticated: true })
})

test('restores the persistent auth cookie after a browser restart', async ({
  browserName,
  playwright,
}) => {
  const profilePath = await mkdtemp(join(tmpdir(), 'code-trainer-auth-'))
  const browserType = playwright[browserName]
  let context: BrowserContext | undefined

  try {
    context = await browserType.launchPersistentContext(profilePath)
    const setCookie = await context.request.post(
      `${appUrl}/api/auth/probe/set`,
      { headers: { origin: appUrl } },
    )

    expect(setCookie.ok()).toBe(true)
    await context.close()
    context = undefined

    context = await browserType.launchPersistentContext(profilePath)
    const session = await context.request.get(
      `${appUrl}/api/auth/probe/session`,
    )

    await expect(session.json()).resolves.toEqual({ authenticated: true })
  } finally {
    await context?.close()
    await rm(profilePath, { force: true, recursive: true })
  }
})
