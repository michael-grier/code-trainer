const AUTH_PATH_PARAMETER = '__auth_path'

export default {
  fetch: proxyAuthRequest,
}

/** Proxies first-party Vercel auth requests to the configured Convex HTTP site. */
export async function proxyAuthRequest(request: Request) {
  const upstreamUrl = getUpstreamUrl(request)

  if (upstreamUrl instanceof Response) {
    return upstreamUrl
  }

  const headers = new Headers(request.headers)
  const clientIp = headers.get('x-vercel-forwarded-for') ?? 'unknown'

  // Only the IP value written by Vercel's edge may reach the trusted header.
  headers.delete('host')
  headers.delete('content-length')
  headers.delete('x-forwarded-for')
  headers.delete('x-real-ip')
  headers.delete('x-vercel-forwarded-for')
  headers.set('accept-encoding', 'identity')
  headers.set('x-real-ip', clientIp)

  try {
    return await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body: hasRequestBody(request.method)
        ? await request.arrayBuffer()
        : undefined,
      redirect: 'manual',
      signal: request.signal,
    })
  } catch {
    return errorResponse('Authentication service is unavailable.', 502)
  }
}

function getUpstreamUrl(request: Request) {
  const siteUrl = process.env.CONVEX_SITE_URL

  if (!siteUrl) {
    return errorResponse('Account sync is not configured.', 503)
  }

  let siteOrigin: URL

  try {
    siteOrigin = new URL(siteUrl)
  } catch {
    return errorResponse('Account sync is not configured.', 503)
  }

  if (
    siteOrigin.protocol !== 'https:' ||
    siteOrigin.username ||
    siteOrigin.password ||
    siteOrigin.pathname !== '/' ||
    siteOrigin.search ||
    siteOrigin.hash
  ) {
    return errorResponse('Account sync is not configured.', 503)
  }

  const requestUrl = new URL(request.url)
  const routeValues = requestUrl.searchParams.getAll(AUTH_PATH_PARAMETER)

  if (routeValues.length !== 1 || !routeValues[0]) {
    return errorResponse('Authentication route not found.', 404)
  }

  requestUrl.searchParams.delete(AUTH_PATH_PARAMETER)

  const upstreamUrl = new URL(`/api/auth/${routeValues[0]}`, siteOrigin)

  if (!upstreamUrl.pathname.startsWith('/api/auth/')) {
    return errorResponse('Authentication route not found.', 404)
  }

  upstreamUrl.search = requestUrl.searchParams.toString()
  return upstreamUrl
}

function hasRequestBody(method: string) {
  return method !== 'GET' && method !== 'HEAD'
}

function errorResponse(message: string, status: number) {
  return Response.json(
    { error: message },
    { status, headers: { 'Cache-Control': 'no-store' } },
  )
}
