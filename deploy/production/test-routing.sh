#!/bin/sh
set -eu

CADDYFILE="${1:-$(dirname "$0")/Caddyfile}"

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

grep -F 'www.{$DOMAIN} {' "$CADDYFILE" >/dev/null || fail "missing www domain block"
grep -F 'redir https://{$DOMAIN}{uri} permanent' "$CADDYFILE" >/dev/null || fail "www must redirect to apex"

awk '
  /^\{\$DOMAIN\} \{/ { in_apex=1; next }
  in_apex && /^}/ { exit }
  in_apex && /reverse_proxy new-api:3000/ { found=1 }
  END { exit(found ? 0 : 1) }
' "$CADDYFILE" || fail "apex domain must proxy to native New API"

awk '
  /^api\.\{\$DOMAIN\} \{/ { in_api=1; next }
  in_api && /^}/ { exit }
  in_api && /reverse_proxy gateway:8788/ { found=1 }
  END { exit(found ? 0 : 1) }
' "$CADDYFILE" || fail "API domain must continue proxying to gateway"

echo "PASS: production domain routing is correct"
