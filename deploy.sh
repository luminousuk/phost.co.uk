#!/usr/bin/env bash
#
# Builds the site on the server after each Plesk Git deployment.
#
# Plesk setup (Git > repository settings > "Enable additional deployment actions"):
#
#     bash deploy.sh
#
# and the domain's document root set to <deployment path>/dist.
#
# Plesk runs deployment actions in a minimal, non-login shell with an almost empty PATH, and Node
# is not on it: the Plesk Node.js extension installs it under /opt/plesk/node/<major>/bin. So this
# script sets a baseline PATH, then puts the Node major from .nvmrc (or the newest one) in front.
#
# The build goes to dist.next and only replaces dist once it has succeeded, so the live site is never
# empty or half-built, and a failed build leaves the previous version online.

export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin${PATH:+:$PATH}"
set -euo pipefail
shopt -s nullglob

cd "$(dirname "$0")"

log() { printf '==> %s\n' "$*"; }

want_major=""
if [ -r .nvmrc ]; then
  read -r want_major < .nvmrc || true
  want_major="${want_major//[!0-9]/}"
fi

if ! command -v npm >/dev/null 2>&1; then
  node_bin=""
  if [ -n "$want_major" ] && [ -x "/opt/plesk/node/$want_major/bin/npm" ]; then
    node_bin="/opt/plesk/node/$want_major/bin"
  else
    for dir in /opt/plesk/node/*/bin; do
      [ -x "$dir/npm" ] && node_bin="$dir"   # glob is ascending, so the last match is the newest
    done
  fi
  if [ -z "$node_bin" ]; then
    echo "ERROR: npm not found. Install Node.js through the Plesk Node.js extension." >&2
    exit 1
  fi
  export PATH="$node_bin:$PATH"
fi
log "node $(node --version), npm $(npm --version)"

# The build tools are devDependencies, so make sure a production NODE_ENV doesn't skip them.
export NODE_ENV=development

log "Installing dependencies (npm ci)"
npm ci --no-audit --no-fund

log "Building into dist.next"
rm -rf dist.next
npm run build -- --outDir dist.next --emptyOutDir

log "Swapping dist.next into place"
rm -rf dist.prev
[ -d dist ] && mv dist dist.prev
mv dist.next dist
rm -rf dist.prev

log "Done: $(pwd)/dist"
