# Project Notes

## Local Development

- Use `bun run dev:all` for routine local development. It starts both Vite and the local Convex backend.
- Use `bun run dev:vite` and `bun run dev:convex` in separate terminals only when debugging one side independently.

## Agent Workflow

- Use Bun for installs, scripts, and tests.
- Treat Clerk authentication, Convex authorization, and persistence boundaries as
  explicit security boundaries.
- Use T3 Code worktree threads for parallel work in this repo.
- When authoring curriculum lessons, follow the lesson authoring principles in
  `CODE_TRAINER_BUILD_PLAN.md`.
