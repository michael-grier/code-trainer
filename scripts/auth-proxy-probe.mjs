import { createServer } from 'node:http'

const host = '127.0.0.1'
const port = 4174
const persistentCookie =
  'code_trainer_auth_probe=persistent; HttpOnly; Max-Age=2592000; Path=/; SameSite=Strict'

// This local upstream exposes only enough behavior to verify the auth rewrite.
const server = createServer((request, response) => {
  if (request.url === '/health') {
    response.writeHead(204).end()
    return
  }

  if (request.url === '/api/auth/probe/set' && request.method === 'POST') {
    response.writeHead(200, {
      'content-type': 'application/json',
      'set-cookie': persistentCookie,
    })
    response.end(
      JSON.stringify({
        forwardedFor: request.headers['x-forwarded-for'] ?? null,
        host: request.headers.host ?? null,
        origin: request.headers.origin ?? null,
        realIp: request.headers['x-real-ip'] ?? null,
      }),
    )
    return
  }

  if (request.url === '/api/auth/probe/session') {
    const cookie = request.headers.cookie ?? ''

    response.writeHead(200, { 'content-type': 'application/json' })
    response.end(
      JSON.stringify({
        authenticated: cookie.includes(
          'code_trainer_auth_probe=persistent',
        ),
      }),
    )
    return
  }

  response.writeHead(404).end()
})

server.listen(port, host, () => {
  console.log(`Auth proxy probe listening on http://${host}:${port}`)
})

function closeServer() {
  server.close()
}

process.once('SIGINT', closeServer)
process.once('SIGTERM', closeServer)
