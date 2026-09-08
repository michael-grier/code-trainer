# Deployment

Code Trainer is a Vite app with optional account sync. Guests keep learning
progress in the browser. Signed-in users authenticate with GitHub through
Better Auth and store progress in Convex.

## Services and trust boundaries

- The frontend host serves `dist/` and reverse-proxies `/api/auth/*` on the same
  public origin.
- Convex stores Better Auth records and user-owned progress, serves the auth
  HTTP actions, and validates the active session for every protected function.
- GitHub provides the account identity through OAuth. The app requests profile
  and email access, not repository access.
- Learner code runs in an opaque-origin sandbox with a network-denying Content
  Security Policy. Do not add same-origin access or network permissions to that
  frame.

The app remains usable in guest mode when `VITE_CONVEX_URL` is absent. Account
sync requires the frontend, Convex, and a GitHub OAuth app.

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
GITHUB_CLIENT_ID=<GitHub OAuth client ID>
GITHUB_CLIENT_SECRET=<GitHub OAuth client secret>
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
   bun x convex env set GITHUB_CLIENT_ID
   bun x convex env set GITHUB_CLIENT_SECRET
   ```

4. Run both services with `bun run dev:all`.

Convex writes both `VITE_CONVEX_URL` and `VITE_CONVEX_SITE_URL` to the ignored
`.env.local`; Vite uses the latter automatically. For isolated debugging, run
`bun run dev:convex` and `bun run dev:vite` in separate terminals. Always open
`http://127.0.0.1:5173`, since the auth origin must match `SITE_URL` exactly.

To work in guest-only mode, leave `VITE_CONVEX_URL` unset and run
`bun run dev:vite`.

## GitHub OAuth setup

Create a GitHub OAuth app with these production values:

```text
Homepage URL: https://trainer.example.com
Authorization callback URL: https://trainer.example.com/api/auth/callback/github
```

GitHub OAuth apps accept up to 10 callback URLs. Use a separate OAuth app for
local development to keep its credentials isolated from production, with
`http://127.0.0.1:5173/api/auth/callback/github`. Keep each client secret in
its matching Convex environment only.

Test these cases before release:

- A new GitHub account can sign in and a returning account reaches the same
  Code Trainer profile.
- The GitHub consent screen requests no repository access.
- A rejected or failed authorization leaves local progress available.
- The browser receives the session cookie from the public frontend origin.

## Vercel deployment order

Run the [release checks](#release-checks) before deploying. Production changes
require explicit authorization. For an existing deployment, preserve a backup
and check [rollback compatibility](#rotation-and-rollback) first.

1. Create or select the intended Convex deployment. Import the repository into
   Vercel and keep the detected Vite defaults:
   `bun run build` with `dist` as the output directory.
2. Make the first deployment without account-sync variables. Guest mode should
   work, and the deployment establishes the stable production domain.
3. Add these variables to the Vercel Production environment:

   ```text
   VITE_CONVEX_URL=https://your-deployment.convex.cloud
   CONVEX_SITE_URL=https://your-deployment.convex.site
   ```

4. Register the stable origin and callback in the GitHub OAuth app. Set Convex
   `SITE_URL` to that exact origin, then set the Better Auth and GitHub variables
   listed above.
5. Deploy the backend with `bun x convex deploy`, then deploy the matching
   Vercel build. A local `bun run build` only creates the frontend artifact; it
   does not publish it.
6. Complete the [deployed verification](#deployed-verification).

Leave the two Vercel variables unset for Preview deployments unless the preview
uses a separate Convex deployment whose `SITE_URL` exactly matches that preview
origin. An unconfigured preview remains fully usable in guest mode.

## First-party auth proxy

The repository implements the production proxy in `api/auth.ts` and routes
`/api/auth/*` to it before the SPA fallback in `vercel.json`. The function reads
`CONVEX_SITE_URL`, forwards the request to the same path on Convex, and
preserves the upstream response, including OAuth redirects.

The proxy must:

- Preserve the method, path, query, body, browser `Origin`, `Cookie`, every
  `Set-Cookie` response header, and redirect `Location` headers.
- Use the Convex site as the upstream Host/SNI target.
- Remove client-supplied `X-Forwarded-For` and `X-Real-IP`, then set
  `X-Real-IP` from the edge's validated client address.
- Disable caching for auth paths and responses.
- Keep the public request and cookies on the frontend HTTPS origin.

Vercel overwrites `X-Vercel-Forwarded-For` at its edge. The function copies that
value to `X-Real-IP` only after deleting the browser-supplied forwarding
headers. The backend accepts only `SITE_URL` as a trusted origin and does not
trust other proxy headers. The local tests in `e2e/auth-proxy.spec.ts` use a
probe server and fixed localhost URLs. They cannot run against a deployment
unchanged. Use the [deployed verification](#deployed-verification) below to
check real OAuth and cookies through the deployed proxy.

## Sessions, revocation, and limits

Sessions are revocable and renew for 30 days while active, with refresh writes
limited to once per day. The session cookie is host-only, `HttpOnly`,
`SameSite=Strict`, and `Secure` outside local HTTP development. The short-lived
OAuth state cookie uses `SameSite=Lax` so it returns with GitHub's top-level
callback. OAuth tokens are encrypted in Convex and never stored in
`localStorage` or `sessionStorage`.

On a shared computer, use private browsing or sign out when finished. The
account sheet can end only the current session or revoke the other device
sessions before ending the current one.

Abuse controls use HMAC-derived keys rather than storing raw addresses or IP
keys:

- 100 auth requests per minute per request key by default.
- Ten social sign-in starts per minute per request key.

The UI honors `Retry-After`. Alert on sustained 429 rates, OAuth failures,
session/token exchange failures, and progress-sync failures without logging
credentials or email addresses.

## Rotation and rollback

- Generate a new GitHub client secret, update Convex, verify sign-in, then
  delete the old secret in GitHub.
- Rotating `BETTER_AUTH_SECRET` ends existing sessions and changes private rate
  limit keys. Treat it as a planned global sign-out, update one environment at
  a time, and verify login immediately.
- Change `SITE_URL` only with the public domain and proxy; an origin mismatch
  intentionally blocks auth requests.

Before a release that changes stored data or backend contracts, take a Convex
backup and preserve the previous frontend artifact and matching backend revision.
Check whether the previous frontend can use the new backend schema and API.
Restore the frontend alone only when that combination is compatible.

If compatibility changed, plan the matching backend rollback or a forward fix
before release. Restoring a database backup can discard progress written after
the backup; account for those writes and obtain explicit approval before any
data restore. Never reset or abandon auth/progress tables merely because a
deployment began as a demo. An empty, user-free deployment can use a simpler
rollback only after confirming it has no saved user data.

## Release checks

### Local checks

Install dependencies and the Playwright browsers once on a new machine:

```sh
bun install --frozen-lockfile
bun x playwright install chromium firefox webkit
```

On Linux, install missing browser system libraries with
`bun x playwright install-deps` if Playwright reports them. This changes the
machine's system packages and may require administrator privileges.

Run these checks without deploying backend code:

```sh
bun run test
bun run lint
bun run build
bun run test:e2e
```

Playwright starts its own Vite server on port 5173 and auth probe on port 4174;
stop other processes using those ports first. The browser suite uses a local
probe cookie to check the proxy contract and restart persistence, exercises
callback-error UI, and checks learner-runner isolation. It does not establish
that real Better Auth sessions or GitHub OAuth work in a deployed environment.

### Development backend check

For backend changes, select the intended non-production Convex deployment, then
run:

```sh
bun x convex dev --once
```

This updates the selected development deployment's functions, schema, and
indexes and regenerates local API files. It is not a read-only check. Review
any generated diff before committing.

### Deployed verification

Use an authorized, isolated deployment with its own Convex data, exact
`SITE_URL`, and matching GitHub OAuth callback. Use test accounts and synthetic
progress. Verify the following through the frontend origin:

- A new and returning GitHub user can sign in. Rejecting authorization leaves
  guest progress available, and the consent screen requests no repository access.
- Browser network and cookie tools show the callback under `/api/auth/*`, an
  uncached response, and the host-only session cookie with the attributes above.
  The short-lived state cookie must survive the GitHub callback.
- Reloading and restarting the browser preserve the session. An active session
  can refresh the Convex token and continue protected operations.
- Moving guest work acknowledges cloud storage before clearing the guest copy.
  Choosing account progress preserves guest work; offline edits survive retry
  and sync to another device after reconnecting.
- Current-session and all-device sign-out revoke the intended sessions, clear
  the affected browser cache, and return other open tabs to guest state.
- Two test accounts cannot read or change each other's progress. Direct loads
  of lesson and progress routes work through the SPA fallback.

The local probe endpoints are test fixtures, not production auth endpoints.
Repeat the applicable checks against the production origin after an authorized
release; local results do not verify deployed proxy configuration.
