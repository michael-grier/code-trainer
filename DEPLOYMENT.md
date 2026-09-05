# Deployment

Code Trainer is a Vite app with optional passwordless account sync. Guests keep
learning progress in the browser. Signed-in users authenticate with an emailed
one-time code through Better Auth and store progress in Convex.

## Services and trust boundaries

- The frontend host serves `dist/` and reverse-proxies `/api/auth/*` on the same
  public origin.
- Convex stores Better Auth records and user-owned progress, serves the auth
  HTTP actions, and validates the active session for every protected function.
- Resend delivers sign-in codes from a verified sender.
- Learner code runs in an opaque-origin sandbox with a network-denying Content
  Security Policy. Do not add same-origin access or network permissions to that
  frame.

The app remains usable in guest mode when `VITE_CONVEX_URL` is absent. Account
sync requires all three services.

## Environment variables

Frontend build, Vercel auth function, and local proxy:

```text
VITE_CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_SITE_URL=https://your-deployment.convex.site
VITE_CONVEX_SITE_URL=https://your-deployment.convex.site
AUTH_PROXY_TARGET=https://optional-proxy-override.example
```

`VITE_CONVEX_URL` is bundled into the browser. Vercel reads the server-only
`CONVEX_SITE_URL` at runtime and proxies `/api/auth/*` to it.
`VITE_CONVEX_SITE_URL` is the equivalent local Vite proxy target and is not read
by application code. `AUTH_PROXY_TARGET` overrides the local target for proxy
testing.

Convex backend environment:

```text
SITE_URL=https://trainer.example.com
BETTER_AUTH_SECRET=<at least 32 random characters>
RESEND_API_KEY=<Resend API key>
AUTH_EMAIL_FROM=Code Trainer <auth@trainer.example.com>
```

`SITE_URL` must be the exact frontend origin: HTTPS in deployed environments,
with no path, query, or credentials. These values belong in Convex, not in the
frontend host's `VITE_*` variables.

## Local setup

1. Install packages with `bun install`.
2. Create or select a development deployment and generate `.env.local`:

   ```sh
   bun x convex dev --once
   ```

3. Configure the local Convex environment. Omit secret values from the command
   line so the CLI reads them from standard input without saving them in shell
   history:

   ```sh
   bun x convex env set SITE_URL http://127.0.0.1:5173
   openssl rand -hex 32 | bun x convex env set BETTER_AUTH_SECRET
   bun x convex env set RESEND_API_KEY
   bun x convex env set AUTH_EMAIL_FROM 'Code Trainer <auth@your-verified-domain.example>'
   ```

4. Run both services with `bun run dev:all`.

Convex writes both `VITE_CONVEX_URL` and `VITE_CONVEX_SITE_URL` to the ignored
`.env.local`; Vite uses the latter automatically. For isolated debugging, run
`bun run dev:convex` and `bun run dev:vite` in separate terminals. Always open
`http://127.0.0.1:5173`, since the auth origin must match `SITE_URL` exactly.

To work in guest-only mode, leave `VITE_CONVEX_URL` unset and run
`bun run dev:vite`.

## Resend setup

Verify the sending domain in Resend and create a key restricted to sending
email. Set `AUTH_EMAIL_FROM` to a sender on that domain. The backend sends only
eight-digit sign-in codes; codes expire after five minutes, are stored hashed,
rotate on resend, and allow five verification attempts.

Test these cases in a non-production deployment before release:

- A real code arrives, signs in once, and cannot be reused.
- New and returning addresses receive the same public response.
- Provider failures expose no address, code, response body, or API key in logs.
- The browser receives the session cookie from the public frontend origin.

## Vercel setup

1. Import the repository into Vercel and keep the detected Vite defaults:
   `bun run build` with `dist` as the output directory.
2. Make the first deployment without account-sync variables. Guest mode should
   work, and the deployment establishes the stable production domain.
3. Add these variables to the Vercel Production environment:

   ```text
   VITE_CONVEX_URL=https://your-deployment.convex.cloud
   CONVEX_SITE_URL=https://your-deployment.convex.site
   ```

4. Set Convex `SITE_URL` to the exact stable Vercel production origin, then set
   the Better Auth and Resend variables listed above.
5. Deploy Convex before redeploying the Vercel production build.

Leave the two Vercel variables unset for Preview deployments unless the preview
uses a separate Convex deployment whose `SITE_URL` exactly matches that preview
origin. An unconfigured preview remains fully usable in guest mode.

## First-party auth proxy

The repository implements the production proxy in `api/auth.ts` and routes
`/api/auth/*` to it before the SPA fallback in `vercel.json`. The function reads
`CONVEX_SITE_URL`, forwards the request to the same path on Convex, and returns
the upstream response without redirecting the browser.

The proxy must:

- Preserve the method, path, query, body, browser `Origin`, `Cookie`, and every
  `Set-Cookie` response header.
- Use the Convex site as the upstream Host/SNI target.
- Remove client-supplied `X-Forwarded-For` and `X-Real-IP`, then set
  `X-Real-IP` from the edge's validated client address.
- Disable caching for auth paths and responses.
- Keep the public request and cookies on the frontend HTTPS origin.

Vercel overwrites `X-Vercel-Forwarded-For` at its edge. The function copies that
value to `X-Real-IP` only after deleting the browser-supplied forwarding
headers. The backend accepts only `SITE_URL` as a trusted origin and does not
trust other proxy headers. After configuring the host, run the proxy and cookie
checks in `e2e/auth-proxy.spec.ts` against the deployed URL.

## Sessions, revocation, and limits

Sessions are revocable and renew for 30 days while active, with refresh writes
limited to once per day. The cookie is host-only, `HttpOnly`, `SameSite=Strict`,
and `Secure` outside local HTTP development. Authentication credentials are not
stored in `localStorage` or `sessionStorage`.

Version one does not expose a session-only email-code option. On a shared
computer, use private browsing or sign out when finished. The account sheet can
end only the current session or revoke the other device sessions before ending
the current one.

Abuse controls use HMAC-derived keys rather than storing raw addresses or IP
keys:

- 100 auth requests per minute per request key by default.
- Three code-send requests per minute per IP-derived key.
- Five code-verification requests per five minutes per IP-derived key.
- One code email per address per minute and five per address per hour.

The UI honors `Retry-After`. Alert on sustained 429 rates, delivery failures,
session/token exchange failures, and progress-sync failures without logging
credentials or email addresses.

## Demo deployment order

No production deployment or data change is implicit in these instructions.

1. Create or select the empty Convex deployment for this demo.
2. Verify the Resend sender and add the Convex backend variables.
3. Create the Vercel project and confirm its stable production domain with a
   guest-only deployment.
4. Set the exact production `SITE_URL` in Convex and add the two Vercel
   Production variables.
5. Deploy Convex, then deploy the matching Vercel build.
6. Verify email-code sign-in, cookie persistence, progress sync, sign-out, and
   direct loading of SPA routes.

Build and deploy with:

```sh
bun run build
bun x convex deploy
```

## Rotation and rollback

- Rotate `RESEND_API_KEY` independently, verify delivery, then revoke the old
  key.
- Rotating `BETTER_AUTH_SECRET` ends existing sessions and changes private rate
  limit keys. Treat it as a planned global sign-out, update one environment at
  a time, and verify login immediately.
- Change `SITE_URL` only with the public domain and proxy; an origin mismatch
  intentionally blocks auth requests.

For this user-free demo, rollback means restoring the previous Vercel artifact
while leaving the empty Convex auth tables unused. Start taking Convex backups
before treating any saved account progress as durable user data.

## Release checks

Run:

```sh
bun install --frozen-lockfile
bun run test
bun run lint
bun run build
bun x convex dev --once
bun run test:e2e
```

The repository's browser tests prove the proxy contract, persistent cookie
behavior, and learner-runner isolation. A preview deployment with real Resend
configuration is still required to prove valid-code sign-in, session refresh,
revocation, cross-account authorization, and live progress sync.
