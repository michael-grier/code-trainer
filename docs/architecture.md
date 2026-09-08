# Architecture

Code Trainer serves static curriculum and grades exercises in the browser.
The backend handles authentication and account progress. Guest learning works
without configured services. Hosting and environment setup are documented in
[Deployment](../DEPLOYMENT.md); content conventions are in
[Lesson authoring](lesson-authoring.md).

## Curriculum and grading

[src/curriculum/index.ts](../src/curriculum/index.ts) discovers lesson modules,
sorts them by order, and builds track membership. Lessons contain MDX concepts,
typed problem definitions, tests, and reference material. Problem views select
the appropriate execution or self-review path.

Function exercises run after Sucrase transpilation. Optional type fixtures run
separately through the TypeScript compiler under fixed options. React exercises
render through React DOM and linkedom in a worker, with declarative interaction
steps. Written and design work uses reference answers and self-review rubrics.
Client-side tests and reference answers are inspectable; this is a self-study
application, and its completion records are not proof of independent assessment.

## Learner execution boundary

The application sends requests through
[sandboxClient.ts](../src/runtime/sandboxClient.ts) to a hidden iframe with
`allow-scripts` and no same-origin permission. The frame's CSP denies networking
and permits the trusted runner assets and blob workers it needs. A worker alone
would isolate the UI thread without protecting the signed-in application's
origin, so preserve both the frame sandbox and CSP.

[sandboxFrame.ts](../src/runtime/sandboxFrame.ts) starts a separate worker for
each execution and terminates it on completion, cancellation, error, or timeout.
It caches trusted worker source, not running workers. JavaScript, React, and type
checking all use this boundary. MessageChannel traffic validates the protocol,
request identity, runner kind, payload shape, and limits; application rendering
must continue to treat returned text as untrusted.

The build and dev scripts generate worker assets with
[scripts/build-runner-sandbox.mjs](../scripts/build-runner-sandbox.mjs).
`public/runner-assets/` is ignored generated output; `public/runner-sandbox.html`
is maintained source. Keep React's test DOM and the TypeScript compiler in the
runner bundles. The React harness does not model browser layout, navigation,
or real focus behavior.

## Authentication and progress

Better Auth uses GitHub OAuth through the same-origin `/api/auth/*` proxy. Vite
provides the local proxy, while `api/auth.ts` provides the Vercel function.
Session cookies belong to the frontend origin. The auth adapter waits for
Convex-authenticated identity before loading or writing account progress.

Convex progress functions resolve the active Better Auth user on the server and
apply indexed ownership filters. Client identity guards may reject an
account-switch race but never grant access. Payload validation and limits live
in the Convex progress modules. Browser code and cached progress are untrusted.

[src/lib/storage.ts](../src/lib/storage.ts) separates guest and account caches.
[src/state/useProgress.tsx](../src/state/useProgress.tsx) coordinates local edits,
cloud loading, synchronization, and the guest-to-account choice.
[src/state/cloudProgress.ts](../src/state/cloudProgress.ts) defines the merge:

- Completion and reference reveal use OR merges.
- Drafts and editable answers use field timestamps for last-write-wins merges.
- Rubric reviews use an OR merge per item; a checked item in either copy stays
  checked, so an uncheck does not override a checked item from another copy.
- Last-visited state uses its timestamp. Persisted learning-path settings remain
  compatible with older data; current recommendations ignore focus and queue.

Signing in offers a progress handoff when guest work needs a decision. Moving
that work writes the merged cloud snapshot before replacing the account cache
or clearing guest data. A failed write retains both local copies. Choosing
account progress leaves guest work available separately.

Sign-out flushes pending progress before revoking the session. Failure offers
retry or explicit discard of unsynced changes. Successful sign-out clears the
affected account cache, returns to guest state, and notifies other tabs.
The synced indicator requires authenticated readiness and acknowledged cloud
state. Network failures retain local work and expose retry status.
