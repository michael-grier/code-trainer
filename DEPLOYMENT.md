# Deployment

Code Trainer is a static Vite app with Clerk for authentication and Convex for
authenticated progress sync.

## Required Services

- A Clerk application for sign-in, sign-up, session management, and account UI.
- A Convex project for user-specific progress tables and functions.
- A static frontend host for the built Vite app.

## Frontend Environment

Set these variables in local `.env.local` and in the frontend host:

```text
VITE_CLERK_PUBLISHABLE_KEY=pk_...
VITE_CONVEX_URL=https://your-deployment.convex.cloud
```

Do not put Clerk secrets or Convex deploy keys in Vite environment variables.
Only `VITE_*` values are bundled into the browser.

## Convex Environment

Set the Clerk issuer domain in Convex, not in frontend code:

```sh
bun x convex env set CLERK_JWT_ISSUER_DOMAIN https://your-clerk-issuer.clerk.accounts.dev
```

The Convex auth provider in `convex/auth.config.ts` expects Clerk's Convex JWT
template audience/application ID to be `convex`.

## Local Setup

1. Install dependencies with `bun install`.
2. Create a Clerk app and configure allowed origins for the local Vite URL.
3. Link Convex with `bun x convex dev`.
4. Set `VITE_CLERK_PUBLISHABLE_KEY` and `VITE_CONVEX_URL` in `.env.local`.
5. Set `CLERK_JWT_ISSUER_DOMAIN` in Convex.
6. Run the app with `bun run dev`.

## Production Setup

1. Deploy Convex with `bun x convex deploy`.
2. Set the deployed Convex URL as `VITE_CONVEX_URL` in the frontend host.
3. Set the Clerk publishable key as `VITE_CLERK_PUBLISHABLE_KEY`.
4. Add the production domain to Clerk allowed origins and redirect URLs.
5. Confirm Clerk's Convex JWT template is enabled for the production Clerk app.
6. Build the frontend with `bun run build` and deploy `dist/`.

## Auth Boundary

The browser uses Clerk only for identity and account UI. Convex functions derive
the user ID from `ctx.auth.getUserIdentity()` and reject unauthenticated reads
and writes. The client never passes a trusted user ID to Convex.
