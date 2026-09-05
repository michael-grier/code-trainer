# Clerk replacement implementation plan

Status: implementation in progress, Phases 0 through 2 complete; Phases 3 and 4 implemented pending non-production integration verification
Last updated: 2026-09-04

## Outcome

Replace Clerk with project-owned passwordless email authentication built on Better Auth and the Convex Better Auth component. Keep every lesson usable without an account. Signing in upgrades progress from device-only storage to authenticated cloud sync.

The finished system must provide:

- One email-code flow for sign-in and first-time registration.
- A persistent, revocable session on trusted devices.
- A session-only option for shared devices if the pinned email-OTP API supports it without patching Better Auth internals.
- Server-side authorization for every cloud progress read and write.
- No persistent authentication credential in `localStorage` or `sessionStorage`.
- Safe migration of existing Clerk-owned progress when production users exist.
- Isolation between learner-authored code and authenticated network access.

## Fixed decisions

These choices do not need to be revisited during implementation:

- Use Better Auth and `@convex-dev/better-auth`. Do not implement password hashing, session token generation, JWT signing, CSRF protection, or OTP verification from scratch.
- Use email OTP as the only initial sign-in method. Do not add passwords, OAuth, passkeys, organizations, roles, or MFA in this change.
- Keep the Vite SPA and Convex. Do not add a general-purpose application server.
- Keep all existing routes public. Authentication protects cloud data, not curriculum access.
- Use a first-party auth URL such as `/api/auth/*`, rewritten by the frontend host to Convex HTTP routes.
- Keep the durable session in a stateful Better Auth session record and a host-only `HttpOnly`, `Secure` cookie.
- Configure a rolling 30-day session and refresh its expiry no more than once per day.
- Make persistent sign-in a browser/device choice, enabled by default. Never grant longer sessions based on an IP address, Wi-Fi network, or network name.
- Hold the short-lived Convex JWT in memory only.
- Use `useConvexAuth()` as the client signal that authenticated Convex calls are ready.
- Resolve the current user inside Convex functions. Never accept a client-provided user ID as authority.
- Keep the existing `userProblemProgress` and `userSettings` tables unless migration testing proves a schema change is necessary.
- Preserve guest-first, local-first behavior and the existing field-level progress merge rules.
- Run the auth UI through the repository's visual mock workflow before changing real components.
- Treat learner code as hostile to the signed-in session. It must not reach auth or application network endpoints.

## Non-goals

- Protecting lesson routes behind sign-in.
- Admin accounts or authorization roles.
- Social sign-in.
- Password login or password recovery.
- Native application authentication.
- A general profile system.
- A session-management dashboard beyond current-session sign-out and sign-out-all-devices.
- Refactoring unrelated progress or curriculum code.

## Current boundaries to preserve

### Browser

- `src/app/providers.tsx` selects guest-only, Clerk-only, or Clerk plus Convex providers.
- `src/components/app/AuthButtons.tsx` owns sign-in, registration, and account controls.
- `src/components/app/SyncStatus.tsx` presents authentication and synchronization state.
- `src/state/useProgress.tsx` selects the guest or user cache, merges guest, authenticated, and cloud state, and sends debounced cloud writes.
- `src/lib/storage.ts` separates guest and authenticated progress by key.

### Convex

- `convex/progress.ts` contains one authenticated query and four authenticated mutations.
- `requireUserId` derives ownership from `ctx.auth.getUserIdentity()`.
- `getProgress` reads through `by_user`.
- `mergeProgress` reads through `by_user`, then replaces, inserts, or deletes the current user's records.
- `upsertProblemProgress` reads through `by_user_problem`.
- `updateLastVisited` and `clearUserProgress` read through `by_user`.
- `convex/schema.ts` defines the required indexes. Authentication must not replace these ownership filters.

### Known weaknesses to address

- Clerk's client state currently starts authenticated Convex work before Convex authentication is necessarily ready.
- Authenticated progress remains in browser storage after sign-out.
- Cloud progress validators permit unrestricted `v.any()` values and unbounded snapshots.
- Learner JavaScript runs in a worker that still has network access.
- Deployment documentation and the main build plan state that Clerk is required and custom authentication is forbidden.

## Target architecture

```text
App origin
├── Vite application
│   ├── guest progress cache
│   ├── authenticated progress cache
│   ├── custom email-code dialog
│   └── Convex client
│       └── short-lived JWT in memory
│
├── /api/auth/*
│   └── hosting rewrite
│       └── Convex HTTP router
│           └── Better Auth
│               ├── users
│               ├── sessions
│               ├── verification records
│               └── database-backed rate limits
│
└── sandboxed runner iframe
    ├── opaque origin
    ├── MessageChannel to the application
    └── connect-src 'none'

Convex WebSocket
└── authenticated progress functions
    ├── active-session validation
    ├── server-derived user ID
    └── indexed per-user progress access
```

## Planned file map

New backend files:

- `convex/convex.config.ts`: register the Better Auth component.
- `convex/auth.ts`: create the configured Better Auth instance.
- `convex/http.ts`: expose the Better Auth HTTP router.
- `convex/authHelpers.ts`: centralize active-session lookup for application functions.
- `convex/email.ts`: contain the server-only delivery function and provider transport.

Existing backend files to change:

- `convex/auth.config.ts`: replace the Clerk JWT provider, or temporarily add Better Auth beside it during a staged migration.
- `convex/progress.ts`: authorize through the active Better Auth session and preserve indexed ownership filters.
- `convex/progressValidators.ts`: add bounded validators and reusable payload checks.
- `convex/schema.ts`: retain progress indexes and add temporary migration indexes only when required.

New browser files:

- `src/lib/auth-client.ts`: configure the Better Auth and Convex client plugins.
- `src/state/authContext.tsx`: expose the application-owned auth state machine and actions.
- `src/runtime/sandboxClient.ts`, `sandboxFrame.ts`, and `sandboxProtocol.ts`: host the existing workers at an opaque origin and mediate validated messages.
- `public/runner-sandbox.html` and `scripts/build-runner-sandbox.mjs`: ship the CSP-constrained frame and its generated, self-contained worker assets.

Existing browser files to change:

- `src/app/providers.tsx`: replace the Clerk provider stack.
- `src/components/app/AuthButtons.tsx`: implement the selected email-code and account interface.
- `src/components/app/SyncStatus.tsx`: separate Convex auth readiness from progress sync state.
- `src/state/useProgress.tsx`, `src/state/progressContext.ts`, and `src/state/cloudProgress.ts`: coordinate authenticated loading, merging, flushing, and sign-out.
- `src/lib/storage.ts`: remove Clerk-specific naming and retain per-account cache separation.
- `src/runtime/jsRunner.ts`, `src/runtime/reactRunner.ts`, and `src/runtime/typeRunner.ts`: delegate worker creation to the sandbox frame without changing their public result contracts.

Tests stay beside pure modules where that is the current convention. Put real browser flows in a new `e2e/` directory with one root Playwright configuration.

## Authentication and synchronization states

Use explicit states instead of combining booleans from Better Auth, Convex, and progress synchronization.

Authentication state:

- `unconfigured`: Convex or auth URLs are absent. The app is guest-only.
- `loading`: the browser is checking the session or Convex is validating a JWT.
- `guest`: no authenticated session exists.
- `authenticated`: Convex validated the JWT and the current-user query succeeded.
- `refreshing`: an existing session is obtaining a new Convex JWT.
- `failed`: session discovery or JWT exchange failed for a reason other than an absent session.

Progress state remains:

- `guest`
- `loading-cloud`
- `syncing`
- `synced`
- `saved-locally`
- `failed`

Rules:

- Treat `useConvexAuth().isAuthenticated` as the gate for protected Convex calls.
- Load the authenticated browser cache only after the server returns the current user ID.
- Render guest data while auth is loading only if doing so cannot overwrite the authenticated cache.
- Show `Synced` only after Convex authentication, initial merge, and any required cloud write complete.
- Treat a network error during session refresh as `failed` or `refreshing`, not as proof that the user signed out.

## Phase 0: resolve implementation gates

Implementation record, 2026-09-04:

- `bun install`, 265 unit tests, lint, and the production build pass before auth source changes.
- Local work uses the clean-cutover branch because this repository has no frontend hosting configuration, GitHub deployment record, or linked Convex configuration. Confirm that no live Clerk progress exists before any production cutover.
- A local same-origin `/api/auth/*` rewrite passes in Chromium, Firefox, and WebKit. It preserves the origin and cookie, replaces client-supplied forwarding headers with one proxy-controlled IP header, and keeps the `HttpOnly` cookie hidden from application JavaScript. The production host must still prove the same contract before deployment.
- Phase 3 will use `better-auth@1.6.30`, `@convex-dev/better-auth@0.12.5`, and `convex@1.45.0`. This exact set installs without peer warnings. The previously locked Convex 1.42.1 does not satisfy the helper version currently selected by the component.
- Better Auth 1.6.30 creates the email-OTP session with configured defaults and exposes no documented or typed `rememberMe` field on that endpoint. Version one therefore uses a persistent 30-day session by default and tells shared-device users to sign out or use private browsing.
- Playwright Test 1.62.1 handles browser auth and runner-isolation checks. WebKit on Ubuntu requires `libevent-2.1-7t64`, `libavif16`, `libgav1-1`, and `libyuv0`; install those through Playwright's documented system-dependency step in CI and developer setup.

Phase 0 has no production side effects. Production deployment remains blocked until the frontend host and live-data migration branch are confirmed.

### 0.1 Restore the local verification baseline

1. Run `bun install` using the existing lockfile.
2. Run `bun run test`, `bun run lint`, and `bun run build`.
3. Record existing failures before editing auth code.
4. Do not repair unrelated failures as part of the auth change. Fix only blockers that prevent auth verification.

Completion criterion: dependencies are installed and every baseline failure is recorded with its command and output.

### 0.2 Confirm the production migration branch

Determine whether any deployed Convex environment contains Clerk-owned progress.

- If no live users or progress exist, mark the migration branch `not required` and use the clean cutover path.
- If live data exists, inventory user count, distinct Clerk subjects, duplicate settings rows, and progress rows per subject. Do not read user drafts into prompts or logs.
- Access production only after the user explicitly authorizes it.

Completion criterion: the implementation notes state either `clean cutover` or `staged Clerk migration`, with evidence.

### 0.3 Confirm first-party auth routing

Identify the production frontend host and prove it can rewrite `/api/auth/*` to the Convex `.site` deployment while forwarding `Cookie`, `Set-Cookie`, `Origin`, `Host`, one sanitized client-IP header, and required CORS headers correctly.

Test the planned routing in a disposable preview or local equivalent. Do not change the daily-driver production channel during this phase.

Completion criterion: Chrome, Firefox, and WebKit can set and return a host-only test cookie through the rewrite, or the work stops for a hosting decision.

### 0.4 Pin a compatible auth dependency set

1. Check the current Convex Better Auth Vite guide and package peer dependencies.
2. Select mutually compatible versions of `better-auth`, `@convex-dev/better-auth`, and `convex`.
3. Pin the auth packages to the supported minor or exact versions. Do not use a broad caret range for this integration.
4. Confirm that the email OTP plugin is listed as supported by the Convex component.
5. Confirm that the component schema and adapter support database-backed rate-limit records and hashed verification records with the selected versions.

The current guide calls for `better-auth@~1.6.15` and Convex 1.25 or newer. Treat that as a starting point, then verify it against the versions available when implementation begins.

Completion criterion: a scratch branch or package-resolution check installs one compatible set without peer warnings or type errors. Do not retain the scratch change until implementation starts.

### 0.5 Prove trusted-device behavior

Against the pinned version, verify:

- Email OTP sign-in creates the configured persistent cookie.
- A 30-day `expiresIn` and one-day `updateAge` work through the Convex adapter.
- Sign-out deletes the cookie and ends the server session.
- Session revocation prevents later JWT exchange.
- The email OTP sign-in route can accept `rememberMe: false`, or another public Better Auth API can create a session cookie without `Max-Age` or `Expires`.

If the public email OTP API cannot create a session-only cookie, use this version-one behavior:

- Persistent sign-in remains the default.
- The dialog says that this device will remain signed in.
- Shared-device users use explicit sign-out or private browsing.
- Record session-only sign-in as a follow-up.
- Do not patch package internals or set Better Auth's private cookies manually.

Completion criterion: persistent and session-only behavior is either proven through public APIs or the documented fallback is accepted before mock copy is finalized.

### 0.6 Add the browser-test runner

Use Vitest for unit and pure state-machine tests. Add Playwright Test as a pinned development dependency for end-to-end auth and runner-isolation coverage.

This is the smallest suitable browser addition after considering:

- Vitest Browser Mode, which is useful for browser-based component tests but does not simplify persistent browser profiles, proxy assertions, or multi-engine end-to-end setup.
- T3 Code's shared preview, which is useful for manual inspection but is not a repeatable CI test runner.
- Playwright Test, which supports Chromium, Firefox, WebKit, cookie inspection, multiple isolated contexts, network interception, and persistent profiles in one tool.

Inspect the selected version's direct and transitive dependencies before installation. Configure only the three required desktop browser projects and keep generated traces, screenshots, and videos out of version control.

Completion criterion: one smoke test boots the existing app in Chromium, Firefox, and WebKit through the same local proxy shape planned for production.

## Phase 1: choose the auth interface through static mocks

Implementation record, 2026-09-04:

- The selected interface is Option B, `Progress handoff`.
- On desktop, authentication uses a full-height right-side sheet so the learner's local progress remains visible throughout email entry, code verification, and progress reconciliation.
- On narrow screens, the sheet fills the viewport and keeps the current step and recovery actions visible without exposing the underlying page to pointer or keyboard interaction.
- The interface uses the application's existing theme state and semantic color tokens. It must respond immediately when the root `dark` class changes; no auth state may hard-code light-only backgrounds, borders, focus rings, status colors, or shadows.
- Keep the existing light/dark selector and theme provider unchanged. Auth controls inherit that choice rather than storing a second preference.
- Preserve the mock's plain persistent-session copy: the browser remembers the user for a rolling 30 days, and shared-computer users should sign out or use private browsing.
- Keep all mock states as the Phase 5 implementation contract, including error recovery, loading, progress merge, account actions, and the pending-sync sign-out warning.

Create three genuinely different static options under the gitignored `mocks/` directory. Match the existing Geist typography, colors, spacing, buttons, header, mobile behavior, and light and dark themes.

Each option must show:

- Guest header state.
- Email entry.
- Code entry with resend timing and change-email action.
- Persistent-session copy and the shared-device choice determined in Phase 0.
- Invalid, expired, over-attempt, rate-limited, and email-delivery failure states.
- Authentication loading and refresh states.
- Successful progress-merge prompt.
- Signed-in account menu with email, sign-out, and sign-out-all-devices.
- Pending-sync sign-out warning.
- Narrow mobile layout and keyboard focus states.

Serve the mocks locally and stop for the user's selection. Keep the selected mock as a gitignored implementation reference, then delete the mock set after the design ships in Phase 5.

Completion criterion: the user selects one option and any requested adjustments are written into the implementation notes.

## Phase 2: isolate learner code from authenticated networking

This is a production auth prerequisite because learner code is arbitrary JavaScript.

Implementation record, 2026-09-04:

- JavaScript, React, and type-check entry points now send work to one hidden iframe through a private `MessageChannel`. The iframe has `sandbox="allow-scripts"` without `allow-same-origin`, so its effective origin is opaque.
- The frame's CSP denies all resources by default and explicitly blocks connections, forms, child frames, objects, images, and media. It permits only same-origin coordinator scripts, blob workers, and `unsafe-eval`; `unsafe-eval` is required by the existing React harness but cannot reach the application origin or network from this context.
- The build generates self-contained classic worker bundles from the existing worker sources. Classic blob workers are required because WebKit rejects module blob workers created by an opaque-origin frame. Blob URLs remain live until the first worker event because WebKit consumes them asynchronously.
- Requests and responses validate their protocol version, discriminant, cryptographically random request ID, runner kind, nested input or result shape, message size, and expected test set. The frame limits concurrency, rejects reused IDs, and terminates each worker on completion, cancellation, error, or timeout.
- JavaScript and React workers bind their native outbound `postMessage` before learner code loads. Learner code therefore cannot intercept the legitimate result, learn its request ID, and substitute a forged result.
- Browser tests in Chromium, Firefox, and WebKit prove ordinary JavaScript, React, type checking, console-safe results, and timeout termination still work. They also prove that cookies, browser storage, IndexedDB, the parent DOM, auth and Convex routes, external HTTP, script imports, WebSockets, EventSource, popups, navigation, forged results, and reused request IDs are unavailable or rejected. A React-specific probe separately confirms that its emulated DOM and storage cannot expose parent-page state.
- Generated runner assets live under the gitignored `public/runner-assets/` directory. Both Vite development commands and production builds regenerate the complete set atomically before starting.

### 2.1 Introduce an opaque execution context

1. Place the code-running coordinator inside an iframe with `sandbox="allow-scripts"` and no `allow-same-origin`.
2. Give the iframe a restrictive CSP. At minimum, block `connect-src`, forms, navigation, popups, child frames, and object embedding. Allow only the script and worker execution needed by the existing runners.
3. Run the existing JavaScript, React, and type-check workers inside that iframe.
4. Communicate through a dedicated `MessageChannel`, not a window-wide message listener.
5. Validate every inbound and outbound message by type, request ID, size, and expected state.
6. Preserve the current timeout and worker-termination behavior.

### 2.2 Prove isolation

Add browser tests in which learner code attempts to:

- Read cookies, local storage, session storage, IndexedDB, and the parent DOM.
- Fetch `/api/auth/get-session` and `/api/auth/convex/token`.
- Fetch the Convex HTTP and WebSocket endpoints directly.
- Open a WebSocket, EventSource, popup, or navigation.
- Exfiltrate through an external HTTP endpoint.
- Forge result messages or reuse another request ID.

All attempts must fail while ordinary JavaScript, React, console capture, timeout, and type-check exercises continue to work.

Completion criterion: automated browser tests prove that learner code cannot access session material or make network requests, and the existing runner tests remain green.

## Phase 3: add the Better Auth backend

Implementation record, 2026-09-04:

- The backend uses `better-auth@1.6.30`, `@convex-dev/better-auth@0.12.5`, and `convex@1.45.0`, with the Better Auth component registered in `convex/convex.config.ts`.
- Email OTP is the only enabled sign-in method. Codes are eight digits, expire after five minutes, are stored hashed, rotate on resend, and allow five verification attempts.
- Sessions are stateful and roll for 30 days, with refresh writes limited to once per day. Session cookies are host-only, `HttpOnly`, `SameSite=Strict`, and `Secure` outside local HTTP development. The component's 15-minute Convex JWT cookie is removed from responses so the SPA will keep that JWT in memory only.
- Auth responses are served only under `/api/auth/*`, receive `Cache-Control: no-store`, and deliberately omit cross-origin response headers. Better Auth still validates `SITE_URL` as its sole trusted browser origin.
- Resend delivery uses its HTTPS API directly. The server never logs or stores plaintext email addresses or codes outside Better Auth's transient send callback. Delivery errors contain only a random correlation ID and HTTP status.
- Sending is limited independently by Better Auth's trusted-IP rules and a transactional, HMAC-keyed per-address rule: one send per minute and five sends per hour. Verification has its own trusted-IP rule and the OTP record's attempt counter.
- At the end of Phase 3 the worktree had no `CONVEX_DEPLOYMENT`, so its API declaration temporarily mirrored the expected component shape. Phase 8 later generated the real declarations and exercised the functions against an isolated anonymous local deployment. No hosted Convex project or production deployment was initialized or changed.
- Production remains gated on proving that the frontend rewrite overwrites the trusted IP header and that direct Convex HTTP ingress cannot supply a forged value. OTP delivery, cookie persistence, session revocation, JWT acceptance, and origin rejection still require the linked non-production browser tests in Phase 8.

### 3.1 Dependencies and component registration

1. Remove `@clerk/clerk-react` only after the replacement provider compiles.
2. Add the pinned Better Auth packages.
3. Add `convex/convex.config.ts` and register the Better Auth component.
4. Regenerate Convex types through the normal Convex development command.

Completion criterion: Convex recognizes the component and generated types contain its API without manual casts.

### 3.2 Auth configuration

Create `convex/auth.ts` with:

- `betterAuth` from its minimal server entry.
- The Convex adapter and JWT plugin.
- The cross-domain plugin only if the verified hosting route still requires it.
- The email OTP plugin imported from its narrow subpath.
- `SITE_URL` as the only trusted browser origin in production.
- A 30-day session lifetime and one-day refresh interval.
- Stateful session storage. Keep cookie session caching disabled unless measurements justify it.
- CSRF and origin checks enabled.
- A project-specific cookie name. Prefer a `__Host-` name when the adapter supports it.
- `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/`, and no `Domain` attribute where the first-party OTP flow permits them.
- Database-backed rate limiting.
- Client-IP detection from one hosting-provided header that the edge proxy overwrites. Do not trust an unsanitized `X-Forwarded-For` value from the browser.

Update `convex/auth.config.ts` with the Better Auth provider expected by Convex. Retain Clerk temporarily only when the staged migration branch requires it.

Completion criterion: a locally issued Better Auth JWT is accepted by Convex and exposes the expected user identity.

### 3.3 Auth HTTP routes

Create `convex/http.ts` and register Better Auth with only the email-OTP provider configured, so unused sign-in methods remain unavailable.

- Restrict CORS to the configured app origin.
- Return credentials only through the first-party rewrite.
- Preserve `Origin` checks.
- Set `Cache-Control: no-store` on responses containing session or token data.
- Avoid GET mutations except endpoints required by Better Auth's protocol.

Completion criterion: untrusted origins cannot create, use, or revoke sessions, and approved browser origins complete the flow.

### 3.4 Transactional email adapter

Create a small server-only email module that sends the OTP through the selected provider's HTTPS API.

- Prefer direct `fetch` over a provider SDK unless the API makes the SDK materially safer.
- Keep the API key and sender address in Convex environment variables.
- Use a supported non-durable background primitive only if it does not persist callback arguments. Otherwise await the provider request inside the auth HTTP action. Never place a plaintext OTP in Convex scheduler arguments, logs, or stored job metadata.
- Send plain text and restrained HTML versions.
- Do not log the OTP, session token, JWT, or full email address.
- Use a generic public response for existing and new accounts.
- Record delivery failures with a redacted correlation ID.

Configure OTP policy:

- Eight numeric digits.
- Five-minute expiry.
- Hashed storage.
- Five verification attempts.
- Rotate the code on resend.
- Enforce a resend cooldown in both the server and UI.
- Rate-limit requests by normalized email and trusted client IP.
- Rate-limit verification separately from email sending.

Completion criterion: delivered codes work once, and expired, reused, replaced, malformed, or over-attempt codes fail without revealing account existence.

### 3.5 Current-user API

Export a public `getCurrentUser` query that returns only the fields needed by the application:

```ts
type CurrentUser = {
  id: string
  email: string
}
```

Use the Better Auth component's session-validating user lookup. Do not return the session token, JWT, IP address, internal account records, or verification records.

Completion criterion: unauthenticated callers receive `null` or a typed auth error, and authenticated callers receive their own minimal user record.

## Phase 4: replace the client auth adapter

Implementation record, 2026-09-04:

- The browser now has one application-owned auth context. Better Auth calls are confined to `src/lib/auth-client.ts` and its provider; feature code consumes the six explicit application states and four auth actions.
- `authenticated` is reached only when the Better Auth session, `useConvexAuth()`, and `auth:getCurrentUser` agree on the same user ID. A transient refresh or network failure retains only the last server-validated account, while a different session ID immediately drops that retained identity.
- The Convex JWT comes from `ConvexBetterAuthProvider` and remains in its in-memory cache. The auth client uses the browser's own origin and credentialed `/api/auth/*` requests without a cross-domain or web-storage plugin.
- Progress keeps the same account cache mounted while its token refreshes, pauses cloud work until Convex is authenticated, and remounts on account changes. Progress query responses carry the server-derived owner ID, and writes include an expected owner used only as a mismatch guard; the server identity remains authoritative.
- An immediate progress flush now reports whether the exact latest revision reached Convex. This is the coordination point for the safe sign-out flow in Phase 5.
- Clerk's provider, hooks, environment variable, and direct dependency have been removed. The authenticated storage-key format is unchanged, but provider-specific parameter naming is gone.
- Six focused state-machine tests cover guest-only mode, partial authentication, refresh, network failure, successful validation, and account switching. Live browser verification still waits on a linked non-production Convex deployment.
- `@convex-dev/better-auth@0.12.5` publishes a provider prop type that resolves session data to `never` with Better Auth 1.6.30. The root contains one documented type-compatibility assertion at that package boundary; remove it when the upstream declaration is corrected.

### 4.1 Create one application auth boundary

Add `src/lib/auth-client.ts` for the Better Auth client and a small application-owned auth context under `src/state/`.

The context should expose only:

```ts
type AppAuth = {
  status: 'unconfigured' | 'loading' | 'guest' | 'authenticated' | 'refreshing' | 'failed'
  user?: { id: string; email: string }
  requestCode: (email: string) => Promise<void>
  verifyCode: (input: VerifyCodeInput) => Promise<void>
  signOut: () => Promise<void>
  signOutAllDevices: () => Promise<void>
}
```

Keep Better Auth imports inside this adapter, the root provider, and auth-specific UI. Feature components should consume `AppAuth` or `useConvexAuth()`.

Completion criterion: no curriculum, page, problem, or generic progress component imports Clerk or Better Auth directly.

### 4.2 Replace the root providers

Update `src/app/providers.tsx`:

- Remove `ClerkProvider`, Clerk appearance configuration, and `ConvexProviderWithClerk`.
- Use `ConvexBetterAuthProvider` when Convex and auth URLs are configured.
- Keep guest-only operation when they are absent.
- Keep the existing theme and toaster providers.
- Avoid recreating the Convex client during renders or auth transitions.

Completion criterion: the application boots in guest-only, configured-signed-out, and configured-signed-in modes without hook-order or missing-provider errors.

### 4.3 Make progress depend on Convex-authenticated identity

Update `src/state/useProgress.tsx`:

1. Remove Clerk imports and configuration checks.
2. Gate `getCurrentUser` and `getProgress` on `useConvexAuth().isAuthenticated`.
3. Use the server-returned user ID for the authenticated local-storage key.
4. Keep the cloud query skipped until that user ID exists.
5. Preserve current merge and debounce behavior.
6. Treat token refresh as a temporary pause, not a sign-out.
7. Prevent a stale response from a previous user from replacing the current user's state.
8. Expose an immediate flush operation for coordinated sign-out.

Completion criterion: rapid sign-in, sign-out, account switching, refresh, and network failure cannot cross-load or cross-write another user's cache.

### 4.4 Rename provider-specific storage language

Rename `clerkUserId` parameters and test descriptions to `userId` or `accountId`. Keep the storage-key format unchanged unless a migration requires a version bump.

Completion criterion: source and tests contain no Clerk-specific naming outside temporary migration code and documentation.

## Phase 5: implement the selected auth interface

Implement only the option selected in Phase 1, using existing button, dialog, dropdown, form, and theme conventions.

Implementation record, 2026-09-04:

- The selected Progress handoff design now ships as a responsive right-side sheet. Its email, code, loading, merge, account, and interrupted-sign-out states use the application's semantic color tokens and were inspected in both light and dark modes.
- Email-code sign-in accepts one pasteable eight-digit code, explains the persistent 30-day session, prevents duplicate submissions, and presents resend and server rate-limit timing.
- Meaningful guest work pauses the first account write. `Move and continue` clears the guest cache only after Convex acknowledges the merged snapshot; `Use account progress` keeps the guest cache available.
- Sign-out flushes the latest progress before session revocation. A failed flush offers retry or an explicit discard path. Sign-out events also clear the affected account cache and refresh auth state in other tabs through `BroadcastChannel`.
- `Sign out all devices` revokes the other sessions before ending the current session, so the final cookie-clearing request still has authority.
- Live email delivery, real session exchange, and the full progress handoff remain gated on a linked non-production Convex deployment in Phase 8.

### 5.1 Email step

- Use a labeled `type="email"` field with `autocomplete="email"`.
- Normalize for submission without changing what the user sees while typing.
- Disable duplicate submissions.
- Always show the same success message whether the account existed.
- Present rate-limit retry time from the server response.

### 5.2 Code step

- Use one pasteable input with `inputmode="numeric"` and `autocomplete="one-time-code"`.
- Accept spaces and hyphens during entry, then normalize before submission.
- Keep the email visible with a `Change` action.
- Show a resend countdown based on the server-provided retry time.
- Preserve focus and announce errors through an accessible live region.
- Present the trusted-device or persistent-session copy approved in Phase 0.

### 5.3 Merge confirmation

After authentication and before the first cloud write:

- Detect whether guest progress contains meaningful work.
- If no guest work exists, load account progress without a prompt.
- If guest work exists, show counts for completed problems and drafts.
- `Move and continue` merges guest, authenticated-cache, and cloud state through existing field-level rules.
- Clear the guest cache only after Convex acknowledges the merged snapshot.
- `Use account progress` leaves the guest cache untouched and loads the account state.
- A failed merge keeps both local copies and offers retry.

Completion criterion: no user progress is deleted before the server acknowledges its durable replacement.

### 5.4 Header and account menu

Replace Clerk controls in `AuthButtons.tsx` with:

- `Sign in to sync` for guests.
- A loading affordance that does not shift header layout.
- The user's email or compact initials after sign-in.
- `Sign out` and `Sign out all devices` actions.

Update `SyncStatus.tsx` to derive authentication readiness from Convex, then synchronization status from the progress context.

Completion criterion: the header never claims `Synced` before Convex has validated the session and completed initial synchronization.

### 5.5 Safe sign-out

1. Stop scheduling new cloud writes.
2. Flush pending progress immediately.
3. If the flush succeeds, revoke the session, clear the current user's local cache, and load guest state.
4. If the flush fails, show the selected mock's warning with `Retry` and `Sign out and discard unsynced changes`.
5. `Sign out all devices` must revoke every server session, including the current one.
6. Broadcast sign-out to other tabs and make them switch to guest state.

Completion criterion: ordinary sign-out loses no acknowledged progress, and forced sign-out states exactly what unsynced data will be discarded.

## Phase 6: strengthen Convex authorization and input limits

Implementation record, 2026-09-04:

- Every public progress query and mutation now resolves the user through the Better Auth component's live session lookup. Missing, expired, and revoked sessions receive the stable `AUTH_REQUIRED` error.
- Ownership remains next to each index-backed database read. The account-switch guard is compared with the server-derived user ID and is never used as authority.
- Progress snapshots allow at most 500 problem records, 400 KB per problem, and 2 MB total. Drafts, written answers, structured answers, identifiers, rubric items, timestamp maps, and queued lessons have smaller field-specific limits.
- Structured trace and design answers remain flexible JSON, but their size, depth, collection width, keys, and numeric values are checked before a write.
- Timestamps must be finite, non-negative, and no more than five minutes ahead of Convex server time. Invalid input returns `PROGRESS_INPUT_INVALID` or `PROGRESS_LIMIT_EXCEEDED` with only a safe field name.
- Pure validation tests cover current curriculum answer shapes, malformed identifiers, field timestamp ownership, duplicate records, clock skew, structured-answer depth, and record and snapshot limits. Session-backed Convex integration tests still require the linked non-production deployment in Phase 8.

### 6.1 Replace the auth helper

Replace `requireUserId` in `convex/progress.ts` with one shared helper that validates the active Better Auth session and returns its user ID.

Apply it to:

- `getProgress`, a query using `by_user`.
- `mergeProgress`, a mutation using `by_user` and `by_user_problem` as needed.
- `upsertProblemProgress`, a mutation using `by_user_problem`.
- `updateLastVisited`, a mutation using `by_user`.
- `clearUserProgress`, a mutation using `by_user`.

Keep every ownership condition next to the database access it protects.

Completion criterion: every public progress function rejects unauthenticated and revoked sessions and can access only rows for the server-derived user ID.

### 6.2 Bound progress input

Add server-side limits based on the current curriculum plus reasonable growth room:

- Maximum records in one snapshot.
- Maximum slug, problem ID, question ID, and rubric ID lengths.
- Maximum draft and written-answer lengths.
- Maximum keys in trace, design, rubric, and timestamp records.
- Maximum serialized snapshot size.
- Finite, non-negative timestamps within an explicitly documented clock-skew policy.

Keep `v.any()` only where the curriculum truly accepts multiple JSON value shapes. Shape-check and size-check those values in the handler.

Return stable error codes for invalid input. Do not echo submitted answers in errors or logs.

Completion criterion: oversized and malformed payload tests fail before any database write, while every authored curriculum answer shape remains accepted.

## Phase 7: migrate Clerk identities when required

Skip this phase for a clean cutover.

Implementation record, 2026-09-04:

- The implementation remains on the clean-cutover branch selected in Phase 0, so no legacy identity table, dual JWT issuer, browser-key migration, or production data mutation was added.
- The repository has no linked Convex deployment or hosting record from which to prove that live Clerk-owned progress is absent. That confirmation remains a production release gate. If live data is found, stop the clean cutover and complete this phase against a backup before disabling Clerk.

### 7.1 Prepare the migration

1. Export a Convex backup.
2. Export Clerk user ID, normalized verified primary email, and verification status.
3. Reject duplicate verified emails and accounts without a verified primary email for manual review.
4. Import a temporary mapping table with:
   - HMAC lookup of the normalized email.
   - Legacy Clerk subject.
   - Optional claimed Better Auth user ID.
   - Claim and migration timestamps.
5. Index the mapping by email lookup and legacy subject.

Use a migration-only HMAC secret stored in Convex environment settings. Do not store the email in the temporary table when a deterministic keyed lookup is sufficient.

Completion criterion: every automatically migratable Clerk subject maps to exactly one verified email lookup.

### 7.2 Claim and re-key server progress

On the first successful Better Auth email-code login:

1. Validate the active Better Auth session and verified email.
2. Compute the migration lookup.
3. Atomically claim an unclaimed mapping for the Better Auth user.
4. Re-key legacy progress and settings to the Better Auth user ID.
5. Merge collisions through existing field timestamps rather than overwriting a whole record.
6. Mark the mapping complete only after every row is moved.
7. Make the mutation safe to retry.

Completion criterion: retries are idempotent, two new accounts cannot claim one legacy identity, and row counts reconcile before and after migration.

### 7.3 Migrate the browser cache

Return the exact legacy Clerk subject only to the newly authenticated user who claimed it.

- Load only that legacy storage key.
- Merge it into the new user cache.
- Write the merged cloud snapshot.
- Remove the legacy key only after cloud acknowledgement.
- Never enumerate or merge other authenticated cache keys on the device.

Completion criterion: a migrated user retains cloud and browser-only progress without exposing another local user's cache.

### 7.4 Grace period and Clerk removal

If stale Clerk clients must remain functional, temporarily accept both JWT issuers and map both identities to the same canonical user ID. Keep this branch small and delete it after the agreed grace period.

Before removal:

- Confirm migration counts and failed claims.
- Confirm no meaningful Clerk-authenticated activity remains.
- Preserve a final backup.
- Obtain explicit approval before changing production provider configuration.

Completion criterion: Clerk can be disabled without orphaning progress or leaving a client path that trusts legacy subjects directly.

## Phase 8: verification

Implementation record, 2026-09-04:

- `bun x convex dev --once` created an anonymous local-only deployment, installed the Better Auth component, applied every declared index, generated the real API files, and compiled all Convex functions. The local deployment is not linked to a Convex account.
- All five protected progress operations returned `AUTH_REQUIRED` without a session. The first-party auth route returned a guest session, rejected an invalid OTP, rejected an untrusted origin, enforced the 100-request global rule exactly, and returned `AUTH_EMAIL_RATE_LIMITED` with `Retry-After` for an immediate repeat email request.
- That live check found that Better Auth deliberately swallows delivery-callback errors. The HMAC email limiter now runs in a pre-request hook before code generation, so a blocked request cannot rotate the valid code and its 429 reaches the client. Core request throttling uses an atomic project table with key and request-age indexes instead of the component's unindexed cleanup path.
- The suite now covers auth transitions, input normalization, public error messages, resend timing, sign-out flush readiness, cross-tab events, durable-before-local progress handoff ordering, failure preservation, storage-key separation, progress merging, and payload limits.
- `bun run test` passes 301 tests in 74 files; lint, the production build, and `convex dev --once` pass. All 18 proxy, persistent-cookie, and runner-isolation browser checks pass across Chromium, Firefox, and WebKit.
- Real Resend delivery, valid-code sign-in and reuse rejection, real Better Auth cookie restart, JWT refresh, revocation, cross-account authorization, and live cloud handoff still require configured transactional email on a non-production deployment. The existing persistent-cookie browser test proves the first-party proxy contract with a probe cookie, not a Better Auth session.

### Unit tests

Use existing Vitest infrastructure for:

- Auth state transitions.
- Email and OTP input normalization.
- Generic public error mapping.
- Resend countdown behavior.
- Guest, legacy, and Better Auth storage-key selection.
- Merge-confirmation choices.
- Sign-out flush outcomes.
- Cross-tab sign-out events.
- Progress payload limit helpers.

### Convex authorization tests

Use the narrowest supported Convex test mechanism. Add a test dependency only after confirming it supports Convex components and the pinned auth versions.

Cover:

- Unauthenticated rejection for every protected function.
- Revoked-session rejection.
- User A cannot read, replace, or delete user B's progress.
- Client-provided user IDs are absent from ownership decisions. The expected-user guard may only reject an account-switch race; it is never authority.
- Index-backed reads for every progress access path.
- Oversized snapshots perform no partial write.
- Migration claims and retries are atomic.

### Browser tests

Add browser automation because cookie flags, reload persistence, host rewrites, and sandbox restrictions cannot be established through component tests alone.

Cover:

- Guest use without auth configuration.
- Request code, reject bad code, accept valid code, and reject reuse.
- Generic response for new and existing emails.
- Persistent sign-in across tab close and browser restart.
- Session-only behavior when supported.
- Session expiry, current-session sign-out, and sign-out-all-devices.
- Initial progress merge, reload, offline editing, reconnect, and retry.
- Shared-device sign-out cache clearing.
- Auth refresh during an active Convex subscription.
- Chrome, Firefox, and WebKit through the first-party rewrite.
- Every runner-isolation attack listed in Phase 2.

### Repository checks

Run:

```sh
bun run test
bun run lint
bun run build
bun x convex dev --once
rg -n "Clerk|clerk|VITE_CLERK|CLERK_JWT" . \
  --glob '!node_modules/**' \
  --glob '!AUTH_REPLACEMENT_IMPLEMENTATION_PLAN.md'
```

For a staged migration, remaining Clerk matches must belong only to temporary migration code and its deletion checklist.

Completion criterion: all checks pass, browser coverage passes on the supported engines, and remaining provider-specific references are intentional and documented.

## Phase 9: documentation and cleanup

Implementation record, 2026-09-04:

- `.env.example` and `DEPLOYMENT.md` now cover guest-only use, local setup, Convex secrets, Resend, the required first-party proxy, the 30-day session, revocation, abuse limits, rotation, release order, rollback, and the learner-runner boundary.
- Vite reads the local Convex site URL generated in `.env.local`, while `AUTH_PROXY_TARGET` remains an explicit override for proxy tests.
- The build plan and project instructions describe Better Auth rather than the retired provider. Direct retired-provider lock records were removed; the only remaining lockfile name is Convex's own optional peer metadata.
- The selected Progress handoff is shipped in responsive light and dark themes, and the discarded static mock files have been removed.
- A frozen install succeeds, the generated local proxy returns the guest session without an override, all 301 unit tests pass, lint and the production build pass, Convex compiles, and all 18 browser checks pass across Chromium, Firefox, and WebKit.

Update:

- `.env.example`
- `DEPLOYMENT.md`
- `CODE_TRAINER_BUILD_PLAN.md`
- `AGENTS.md`
- `package.json`
- `bun.lock`

Document:

- Local setup and required public URLs.
- Convex-only secrets and how to rotate them.
- Transactional email sender setup.
- First-party hosting rewrite.
- Session lifetime and revocation.
- Auth rate-limit behavior.
- Production deployment order.
- Migration and rollback procedures when applicable.
- The learner-runner security boundary.

Remove:

- Clerk dependencies, environment variables, provider configuration, UI code, and deployment instructions.
- Temporary dual-provider and migration code after the grace period.
- Static mocks after the selected interface ships.

Completion criterion: a new developer can configure guest mode and authenticated sync from the repository documentation, and no live instruction still directs them to Clerk.

## Deployment order

### Clean cutover

1. Ship runner isolation.
2. Deploy Better Auth backend routes and secrets without exposing the new UI.
3. Verify email, cookies, JWT exchange, and revocation in a preview environment.
4. Deploy the frontend provider and selected UI.
5. Watch auth errors, email delivery, OTP rate limits, and progress sync failures.
6. Remove Clerk configuration after the release is stable.

### Staged migration

1. Ship runner isolation.
2. Back up Convex and import the verified Clerk mapping.
3. Deploy Better Auth while retaining the temporary Clerk provider path.
4. Deploy the new frontend and migration claim flow.
5. Reconcile users, claimed identities, progress rows, and failed claims daily during the grace period.
6. Obtain approval, take a final backup, and disable Clerk.
7. Remove the migration table, secret, provider branch, and package.

No production step is implicit. Each production deployment, secret change, data import, and provider removal requires explicit user authorization.

## Rollback

Before the cutover, preserve:

- The previous frontend artifact.
- A Convex backup.
- Clerk configuration during the migration grace period.
- A reversible record of every migrated identity.

If authentication fails before data migration, restore the previous frontend and leave Better Auth tables unused.

If migration has begun, do not blindly restore legacy user IDs. Keep both providers available, stop new claims, diagnose against the mapping records, and roll forward or run a reviewed inverse migration from the backup.

Completion criterion: the release owner can restore sign-in without guessing which provider owns each user's progress.

## Security acceptance criteria

- Persistent session material exists only in a host-only `HttpOnly`, `Secure` cookie.
- Authentication tokens never enter browser storage, URLs, analytics, errors, or logs.
- Auth HTTP routes accept only the configured origin and keep CSRF checks enabled.
- OTP records are hashed, short-lived, single-use, attempt-limited, and rate-limited.
- Public responses do not reveal whether an email already has an account.
- Convex validates the active session and derives the user ID for every protected operation.
- Every progress read and write includes an indexed ownership condition.
- Revoked sessions cannot obtain new Convex JWTs or call protected functions.
- Sign-out clears the current device's authenticated progress cache after pending changes are safe.
- Learner code has an opaque origin and no network access.
- Secrets exist only in Convex or hosting secret stores.
- Production auth and migration changes occur only with explicit approval and a fresh backup.

## Product acceptance criteria

- Guests can use the complete curriculum without configuring auth.
- One email-code screen handles new and returning users.
- Regular users remain signed in for a rolling 30 days.
- Shared-device users are told to use private browsing or sign out because the pinned email-code endpoint has no supported session-only option.
- Signing in never discards guest, authenticated-cache, or cloud progress silently.
- `Synced` means Convex has authenticated the session and acknowledged the relevant cloud state.
- Signing out returns the app to guest state without showing authenticated work.
- Email-provider downtime leaves guest learning and local progress available.
- Keyboard, screen-reader, mobile, light-theme, and dark-theme flows match the selected mock.

## Remaining decisions

These production choices remain release gates:

- Whether production Clerk data exists.
- Which frontend host must implement the first-party rewrite.
- Which verified sender domain to use with Resend.
- How long the dual-provider migration grace period lasts if production data requires migration.

## Definition of done

The replacement is complete when all product and security acceptance criteria pass, Clerk is absent from the active runtime, documentation matches the deployed design, production data is reconciled when applicable, and the worktree contains no temporary mocks or migration code that has passed its deletion date.
