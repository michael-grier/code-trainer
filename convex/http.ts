import { splitSetCookieHeader } from 'better-auth/cookies'
import { httpRouter } from 'convex/server'

import { httpAction } from './_generated/server'
import { createAuth } from './auth'

const http = httpRouter()

const handleAuthRequest = httpAction(async (ctx, request) => {
  const response = await createAuth(ctx).handler(request)
  return hardenAuthResponse(response)
})

http.route({
  pathPrefix: '/api/auth/',
  method: 'GET',
  handler: handleAuthRequest,
})

http.route({
  pathPrefix: '/api/auth/',
  method: 'POST',
  handler: handleAuthRequest,
})

export default http

function hardenAuthResponse(response: Response) {
  const headers = new Headers(response.headers)
  const setCookieHeader = headers.get('set-cookie')

  headers.set('Cache-Control', 'no-store')

  if (setCookieHeader) {
    headers.delete('set-cookie')

    for (const cookie of splitSetCookieHeader(setCookieHeader)) {
      // The Convex plugin emits an SSR convenience JWT cookie. This SPA gets
      // its short-lived JWT through the token endpoint and keeps it in memory.
      if (!cookieName(cookie).endsWith('.convex_jwt')) {
        headers.append('set-cookie', cookie)
      }
    }
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

function cookieName(setCookieValue: string) {
  return setCookieValue.slice(0, setCookieValue.indexOf('=')).trim()
}
