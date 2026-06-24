#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="${ROOT_DIR:-$(cd -- "$SCRIPT_DIR/.." && pwd)}"
APP_DIR="$ROOT_DIR/grain-react"
PORT="${NATIVE_PORT:-8080}"
LOG_FILE="$ROOT_DIR/.serve.log"
LOCK_FILE="$ROOT_DIR/.deploy.lock"

for command_name in git npm serve lsof curl flock setsid; do
  command -v "$command_name" >/dev/null 2>&1 || {
    echo "Missing required command: $command_name"
    exit 1
  }
done

exec 9>"$LOCK_FILE"
flock -n 9 || {
  echo "Another deployment is already running."
  exit 1
}

cd "$ROOT_DIR"
if [[ "${SKIP_GIT_PULL:-0}" != "1" ]]; then
  git pull --ff-only origin main
fi

cd "$APP_DIR"
npm ci --registry=https://registry.npmmirror.com
npm run build

stop_service() {
  local pids
  pids="$(lsof -ti:"$PORT" || true)"
  if [[ -n "$pids" ]]; then
    kill $pids
  fi
}

stop_service
cd "$ROOT_DIR"
setsid serve -l "$PORT" -s grain-react/dist </dev/null >"$LOG_FILE" 2>&1 &

for _ in {1..15}; do
  if curl --fail --silent --show-error "http://127.0.0.1:$PORT/" >/dev/null; then
    echo "Deployment succeeded: http://127.0.0.1:$PORT"
    exit 0
  fi
  sleep 1
done

echo "Deployment failed. Recent log output:"
tail -n 50 "$LOG_FILE" || true
exit 1
