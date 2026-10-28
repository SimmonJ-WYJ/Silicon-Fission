#!/usr/bin/env bash
set -euo pipefail

# Build the patched frontend without touching a running service or its database.
script_dir="$(cd "$(dirname "$0")" && pwd)"
output_dir="${1:-$PWD/artifacts/new-api-video-preview}"
mkdir -p "$output_dir"
output_dir="$(cd "$output_dir" && pwd)"
stage_dir="$(mktemp -d "${TMPDIR:-/tmp}/sf-video-preview-build.XXXXXX")"
trap 'rm -rf "$stage_dir"' EXIT

archive="$stage_dir/new-api.tar.gz"
if [[ -n "${NEW_API_ARCHIVE:-}" ]]; then
  cp "$NEW_API_ARCHIVE" "$archive"
else
  curl --fail --location --retry 2 --connect-timeout 15 --max-time 300 \
    https://github.com/QuantumNous/new-api/archive/refs/tags/v1.0.0-rc.22.tar.gz \
    --output "$archive"
fi
printf '%s  %s\n' \
  a0f24a289bdb8b9924efd813e63d0e7cd61113c015ec0be52892e6aafbb00e5a \
  "$archive" | shasum -a 256 --check
tar -xzf "$archive" -C "$stage_dir"
source_dir="$stage_dir/new-api-1.0.0-rc.22"
patch --batch --fuzz=0 -d "$source_dir" -p1 < "$script_dir/video-preview.patch"

cd "$source_dir/web"
bun install --frozen-lockfile
bun test src/features/usage-logs
bun run typecheck
SF_FRONTEND_ASSET_PREFIX=/_sf-video-preview/20261028/ bun run build
tar -czf "$output_dir/frontend-dist.tar.gz" dist
shasum -a 256 "$output_dir/frontend-dist.tar.gz"
printf 'Frontend archive: %s/frontend-dist.tar.gz\n' "$output_dir"
