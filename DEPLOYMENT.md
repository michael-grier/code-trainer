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

Frontend build and local proxy:

```text
VITE_CONVEX_URL=https://your-deployment.convex.cloud
VITE_CONVEX_SITE_URL=https://your-deployment.convex.site
AUTH_PROXY_TARGET=https://optional-proxy-override.example
```

`VITE_CONVEX_URL` is bundled into the browser. `VITE_CONVEX_SITE_URL` is read by
the Vite development server to proxy `/api/auth`; it is not read by application
code. `AUTH_PROXY_TARGET` overrides that target for local proxy testing.

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

## First-party auth proxy

Production must proxy, not redirect, every request under `/api/auth/*` to the
same path on the deployment's `convex.site` origin. A static host without an
edge rewrite, function, or reverse proxy is not sufficient for account sync.

The proxy must:

- Preserve the method, path, query, body, browser `Origin`, `Cookie`, and every
  `Set-Cookie` response header.
- Use the Convex site as the upstream Host/SNI target.
- Remove client-supplied `X-Forwarded-For` and `X-Real-IP`, then set
  `X-Real-IP` from the edge's validated client address.
- Disable caching for auth paths and responses.
- Keep the public request and cookies on the frontend HTTPS origin.

The backend accepts only `SITE_URL` as a trusted origin and does not trust proxy
headers other than the overwritten `X-Real-IP`. After configuring the host, run
the proxy and cookie checks in `e2e/auth-proxy.spec.ts` against a preview URL.

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

## Production order

No production deployment or data change is implicit in these instructions.

1. Confirm whether any deployed database contains progress owned by an older
   auth provider. Take a Convex backup first.
2. If legacy rows exist, stop the clean cutover and follow Phase 7 of
   `AUTH_REPLACEMENT_IMPLEMENTATION_PLAN.md`; do not guess identity mappings.
3. Configure the verified sender and Convex secrets in a preview deployment.
4. Deploy Convex and verify delivery, cookie persistence, JWT refresh,
   revocation, authorization between two accounts, and progress handoff.
5. Configure the preview host's first-party proxy and run the full browser
   matrix.
6. Set production Convex secrets and `SITE_URL`, deploy Convex, configure the
   production proxy, then deploy the matching frontend artifact.
7. Watch auth, email, and sync failures through the release window. Remove any
   legacy provider only after data reconciliation and explicit approval.

Build and deploy with:

```sh
bun run build
bun x convex deploy
```

Keep the old frontend compatible until its replacement backend and proxy are
ready.

## Rotation and rollback

- Rotate `RESEND_API_KEY` independently, verify delivery, then revoke the old
  key.
- Rotating `BETTER_AUTH_SECRET` ends existing sessions and changes private rate
  limit keys. Treat it as a planned global sign-out, update one environment at
  a time, and verify login immediately.
- Change `SITE_URL` only with the public domain and proxy; an origin mismatch
  intentionally blocks auth requests.

Before cutover, preserve the previous frontend artifact and a fresh Convex
backup. If auth fails before any identity migration, restore the old artifact
and proxy while leaving new auth tables unused. Once migration has begun, stop
new claims and use the reviewed mapping plus backup; never blindly rewrite user
IDs.

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
