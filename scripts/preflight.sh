#!/usr/bin/env bash
# Everything worth checking before a release — run by scripts/release.sh and by the
# release workflow, and safe to run any time.
#
#   scripts/preflight.sh             build, pack, and compile a consumer against the tarball
#   scripts/preflight.sh --release   also: CHANGELOG has a heading for this version
#
# dist/ is not tracked, so a hand `npm publish` ships whatever was built last: on
# 2026-09-26 a checkout's dist/ still lacked WO-052's four enum objects. This checks the
# PACKED tarball from a clean build, from a consumer's side. It builds into throwaway
# directories and publishes nothing; it reads the registry only to compare file lists.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
RELEASE=0
[ "${1:-}" = "--release" ] && RELEASE=1

GREEN=$'\033[0;32m'; RED=$'\033[0;31m'; DIM=$'\033[2m'; RESET=$'\033[0m'
ok()   { echo "  ${GREEN}✓${RESET} $1"; }
fail() { echo "  ${RED}✗${RESET} $1" >&2; exit 1; }
step() { echo; echo "${DIM}── $1${RESET}"; }

cd "$ROOT"
NAME="$(node -p "require('./package.json').name")"
VERSION="$(node -p "require('./package.json').version")"

step "1. version"
echo "$VERSION" | grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$' || fail "package.json version '$VERSION' is not semver"
if [ "$RELEASE" = 1 ]; then
  # The first `## ` heading must be this version: an `## Unreleased` above it means the
  # notes were never given a version.
  first="$(grep -m1 '^## ' CHANGELOG.md || true)"
  case "$first" in
    "## $VERSION "*) ok "$NAME@$VERSION — CHANGELOG: $first" ;;
    *) fail "CHANGELOG's first heading is '$first', not '## $VERSION …' — run npm run release -- prepare" ;;
  esac
else
  ok "$NAME@$VERSION"
fi

step "2. clean build"
npm run -s build >"$WORK/build.log" 2>&1 || { cat "$WORK/build.log" >&2; fail "npm run build (clean, tsc, rollup)"; }
ok "dist/ rebuilt from src/ alone"

step "3. the tarball"
npm pack --silent --pack-destination "$WORK" >/dev/null || fail "npm pack"
TARBALL="$(ls "$WORK"/*.tgz)"
tar -tzf "$TARBALL" | sort > "$WORK/contents"
# What a Capacitor app needs from the package: the web entries package.json names, the
# typings, and the native halves for both build systems on each OS.
for want in package/package.json package/dist/plugin.cjs.js package/dist/index.js package/dist/plugin.js \
            package/src/index.d.ts package/android/build.gradle \
            package/TransistorsoftCapacitorBackgroundGeolocation.podspec package/Package.swift; do
  grep -qx "$want" "$WORK/contents" || fail "the tarball has no $want"
done
grep -q '^package/android/src/main/' "$WORK/contents" || fail "the tarball has no android/src/main/"
grep -q '^package/ios/Sources/' "$WORK/contents" || fail "the tarball has no ios/Sources/"
bad="$(grep -E '^package/(example|test|scripts|help|docs|output|node_modules|\.github)/|^package/RELEASING\.md$' "$WORK/contents" || true)"
[ -z "$bad" ] || fail "the tarball carries what it should not: $(echo "$bad" | head -3 | tr '\n' ' ')"
ok "$(basename "$TARBALL") — $(wc -l < "$WORK/contents" | tr -d ' ') files"
# Against the version on npm now: files that vanish or appear are worth a look before
# they ship. Printed, not enforced — a deliberate move (ios/Plugin → ios/Sources) is fine.
PREV="$(npm view "$NAME" dist-tags.latest 2>/dev/null || true)"
if [ -n "$PREV" ] && (cd "$WORK" && npm pack --silent "$NAME@$PREV" >/dev/null 2>&1); then
  tar -tzf "$WORK"/*-"$PREV".tgz | sort > "$WORK/previous"
  gone="$(comm -23 "$WORK/previous" "$WORK/contents" | sed 's#^package/##')"
  new="$(comm -13 "$WORK/previous" "$WORK/contents" | sed 's#^package/##')"
  ok "against $PREV on npm: $(echo -n "$gone" | grep -c . || true) gone, $(echo -n "$new" | grep -c . || true) new"
  [ -z "$gone" ] || echo "$gone" | head -10 | sed 's/^/      - /'
  [ -z "$new" ] || echo "$new" | head -10 | sed 's/^/      + /'
else
  echo "  ${DIM}(no published version to compare with)${RESET}"
fi

step "4. a consumer compiles and runs against it"
# @capacitor/core is the peer the typings import; the types package comes in as a dependency.
mkdir -p "$WORK/consumer" && cd "$WORK/consumer"
echo '{"name": "consumer", "private": true}' > package.json
CORE="$(node -p "require('$ROOT/package.json').peerDependencies['@capacitor/core']")"
npm install --silent --no-audit --no-fund "$TARBALL" "@capacitor/core@$CORE" >/dev/null \
  || fail "npm install of the tarball with @capacitor/core@$CORE"
cat > index.ts <<'TS'
import BackgroundGeolocation from "@transistorsoft/capacitor-background-geolocation";
import type { Config, Location, State, Subscription } from "@transistorsoft/capacitor-background-geolocation";

const config: Config = {
  geolocation: { desiredAccuracy: BackgroundGeolocation.DesiredAccuracy.High, distanceFilter: 10 },
  logger: { logLevel: BackgroundGeolocation.LogLevel.Verbose },
};
export async function start(): Promise<boolean> {
  const state: State = await BackgroundGeolocation.ready(config);
  const sub: Subscription = BackgroundGeolocation.onLocation((location: Location) => location.coords.latitude);
  sub.remove();
  return state.enabled;
}
TS
for mode in "node16 node16" "esnext bundler"; do
  set -- $mode
  "$ROOT/node_modules/.bin/tsc" --strict --noEmit --skipLibCheck false --target es2020 --lib es2020,dom \
    --module "$1" --moduleResolution "$2" index.ts \
    || fail "a strict consumer does not compile under moduleResolution $2"
done
ok "strict TypeScript compiles under node16 and bundler resolution"
# WO-052: every enum object the typings declare must exist at runtime, not only type-check.
node -e '
  const B = require("@transistorsoft/capacitor-background-geolocation");
  const missing = ["Event", "DesiredAccuracy", "LogLevel", "NotificationPriority", "ActivityType", "LocationRequest"]
    .filter(k => typeof B[k] !== "object" || !Object.keys(B[k]).length);
  if (missing.length) { console.error("undefined at runtime:", missing.join(", ")); process.exit(1); }
  if (B.Event.Location !== "location" || B.DesiredAccuracy.High !== -1) { console.error("wrong enum values"); process.exit(1); }' \
  || fail "the enum objects are not all there at runtime (WO-052)"
ok "require() returns every enum object with its values"

echo
echo "${GREEN}preflight passed${RESET} — $NAME@$VERSION"
