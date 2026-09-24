#!/usr/bin/env bash
# Prepares a linked worktree by linking the main checkout's .env.local into it.
#
# .env.local is gitignored, so `git worktree add` produces a checkout without
# one. Without it VITE_CONVEX_URL is unset, the app runs in guest-only mode,
# and `convex dev` has no selected deployment.
#
# Every worktree then reads the same file, so `convex dev` from any of them
# pushes that branch's schema and functions to the one shared development
# deployment. Run it from a single worktree at a time.
set -euo pipefail

worktree_root=$(git rev-parse --show-toplevel)
# The common dir is inside the main checkout even when run from a linked worktree.
main_root=$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")

if [ "$worktree_root" = "$main_root" ]; then
  echo "Already in the main checkout; nothing to link."
  exit 0
fi

target="$worktree_root/.env.local"
source_env="$main_root/.env.local"

# Every linked worktree writes through to this one file, so `cp`, `>`, and `>>`
# from any of them would replace the credentials all the others read. Dropping
# write permission blocks that for every tool, not only the ones that read a
# config file. Reads still work, so the dev server and build are unaffected.
harden_shared_env() {
  if [ -w "$source_env" ]; then
    chmod a-w "$source_env"
    echo "Made $source_env read-only (chmod u+w to rotate credentials)."
  fi
}

# A link whose target has since been deleted holds nothing. Reporting success
# would leave the worktree without an env the app can read, so clear it first.
if [ -L "$target" ] && [ ! -e "$target" ]; then
  echo "Removing dangling link $target -> $(readlink "$target")." >&2
  rm "$target"
fi

if [ -L "$target" ]; then
  echo "$target is already linked; leaving it unchanged."
  harden_shared_env
  exit 0
fi

if [ -e "$target" ]; then
  # A real file here is a deliberate per-worktree override.
  echo "$target already exists as a regular file; leaving it unchanged."
  exit 0
fi

if [ ! -f "$source_env" ]; then
  echo "No .env.local in the main checkout ($main_root)." >&2
  echo "Create one there first; see DEPLOYMENT.md, Local setup." >&2
  exit 1
fi

ln -s "$source_env" "$target"
echo "Linked $target -> $source_env"
harden_shared_env
