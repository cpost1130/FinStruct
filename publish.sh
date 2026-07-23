#!/usr/bin/env bash
# Rebuild the site and (re)start the production server on port 3000.
# Build runs in the foreground so errors surface; the server is launched in a new
# session (setsid) so it keeps running after this script — and your shell — exits.
set -euo pipefail
cd "$(dirname "$0")"

umask 002
mkdir -p .run

# Load env vars from .env file if present
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

npm run build
setsid nohup npm run start > .run/server.log 2>&1 < /dev/null &

# Wait for the new server to actually answer before reporting success
for _ in $(seq 1 50); do
  if curl -sf -o /dev/null http://localhost:3000; then
    echo "site published; serving on port 3000"
    exit 0
  fi
  sleep 0.2
done
echo "warning: published, but the server isn't responding — check .run/server.log" >&2
exit 1