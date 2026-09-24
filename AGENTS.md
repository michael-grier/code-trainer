# Project Notes

## Local Development

- Use `bun run dev:all` for routine development. Convex uses the selected development deployment, which may be local or cloud.
- Use `bun run dev:vite` and `bun run dev:convex` in separate terminals only when debugging one side independently.
- In a fresh `git worktree`, run `bun install` and `bun run setup:worktree` before running the
  app. The second command links the main checkout's gitignored `.env.local` into the worktree
  and makes the shared file read-only. Without it the worktree runs in guest-only mode.
- Every worktree shares that one env file, so they all point at the same development Convex
  deployment. `bun run dev:convex` or `dev:all` pushes the current branch's schema and functions
  to it. Run Convex from one worktree at a time, and expect the main checkout to see a feature
  branch's functions until `convex dev` runs there again.
- Never create, edit, or overwrite `.env` or `.env*.local` by hand. Writing to the linked file
  from any worktree changes the credentials every other worktree reads. Treat a
  `Permission denied` on it as the guard working. Ask before changing any credential. Editing
  the committed `.env.example` is how env-contract changes are proposed.

## Agent Workflow

- Use Bun for installs, scripts, and tests.
- Treat Better Auth sessions, Convex authorization, and persistence boundaries as
  explicit security boundaries.
- Use T3 Code worktree threads for parallel work in this repo.
- When authoring or reviewing curriculum lessons, read
  [docs/lesson-authoring.md](docs/lesson-authoring.md).
