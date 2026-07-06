#!/usr/bin/env bash
set -euo pipefail

pids=()
bun_cmd=""

if command -v bun >/dev/null 2>&1; then
  bun_cmd="bun"
elif [[ -n "${BUN_INSTALL:-}" && -x "${BUN_INSTALL}/bin/bun" ]]; then
  bun_cmd="${BUN_INSTALL}/bin/bun"
elif [[ -x "${HOME}/.bun/bin/bun" ]]; then
  bun_cmd="${HOME}/.bun/bin/bun"
else
  echo "Unable to find bun. Install Bun or add it to PATH." >&2
  exit 127
fi

cleanup() {
  local status=$?

  if ((${#pids[@]} > 0)); then
    kill "${pids[@]}" 2>/dev/null || true
    wait "${pids[@]}" 2>/dev/null || true
  fi

  exit "$status"
}

trap cleanup EXIT INT TERM

"$bun_cmd" run dev:vite &
pids+=("$!")

"$bun_cmd" run dev:convex &
pids+=("$!")

while true; do
  for pid in "${pids[@]}"; do
    if ! kill -0 "$pid" 2>/dev/null; then
      wait "$pid"
      exit "$?"
    fi
  done

  sleep 1
done
