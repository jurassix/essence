#!/usr/bin/env bash
# essence: installer shim. Thin wrapper around bin/install.js; every flag
# you'd pass to that script can be passed here, it's just forwarded.
#
# Local clone:
#   bash install.sh [flags]
#
# Not yet published to npm/GitHub, so there's no curl-pipe one-liner or npx
# fallback: clone the repo and run this from inside it.

set -euo pipefail

if ! command -v node >/dev/null 2>&1; then
  echo "essence: Node.js (>=18) required. Install:" >&2
  echo "  macOS:  brew install node" >&2
  echo "  Linux:  see https://nodejs.org or use nvm (https://github.com/nvm-sh/nvm)" >&2
  exit 1
fi

NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "essence: Node $NODE_MAJOR too old. Need Node >=18." >&2
  exit 1
fi

here="$(cd "$(dirname "${BASH_SOURCE[0]:-}")" 2>/dev/null && pwd)" || here=""
if [ -z "$here" ] || [ ! -f "$here/bin/install.js" ]; then
  echo "essence: run this from inside a clone of the repo (bin/install.js not found)." >&2
  exit 1
fi

exec node "$here/bin/install.js" "$@"
