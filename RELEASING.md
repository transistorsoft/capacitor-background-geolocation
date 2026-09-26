# Releasing

`@transistorsoft/capacitor-background-geolocation` is published by GitHub Actions
(`.github/workflows/release.yml`) when a version tag is pushed. npm trusts that workflow
through **Trusted Publishing** (OIDC), so no npm token exists anywhere, and every release
carries **provenance**: a signed record of the repository, commit and workflow that built it.
`@transistorsoft/background-geolocation-types` releases the same way.

## A release

```bash
npm run release -- prepare 9.7.0   # branch chore/release-9.7.0: version, dated CHANGELOG, preflight
# merge chore/release-9.7.0 into master
npm run release -- tag 9.7.0       # on master: tag the merge (lightweight, like every earlier tag)
git push origin master 9.7.0       # the tag starts the workflow
```

A release branch prepared by hand (the version set, the CHANGELOG's `## Unreleased` already
dated) skips `prepare`: merge it, then `npm run release -- tag <version>`.

The workflow checks (the tag equals `package.json`'s version; `scripts/preflight.sh --release`:
a clean build, the packed tarball's contents and what changed since the version on npm, a
strict consumer compile with `@capacitor/core`, every enum object at runtime (WO-052), a
CHANGELOG heading for the version), then publishes. A prerelease such as `9.7.0-beta.1` is
published under the `beta` dist-tag, so `latest` only moves to a release.

`npm run preflight` (without `-- --release`) is safe to run at any time; it publishes nothing.
Never add a `version`, `preversion` or `postversion` script: `release -- prepare` runs
`npm version`, which would run them.

Publishing is only the npm half. The native SDK the podspec and Package.swift require
(`TSLocationManager`) must already be released, or an iOS install fails to resolve.

## A release that failed

Fix the cause, then re-run from the Actions tab: **release → Run workflow → Use workflow
from → Tags → the version**. The workflow refuses to run on a branch, and skips the publish
if that version is already on npm. A version can be published once, ever: if a bad tag was
pushed, delete it and release the next patch version rather than re-using the number.

## Checking a release

- The package page on npmjs.com shows a provenance badge linking to the workflow run. npm
  shows the new version as "validating" for a few minutes before it serves it.
- `npm audit signatures`, in a project that depends on the package, verifies it.

## One-time setup

On npmjs.com, the package's **Settings → Trusted Publisher → GitHub Actions**:
organization `transistorsoft`, repository `capacitor-background-geolocation`, workflow
`release.yml`, environment blank (GitHub Environments are not available on this org's
plan, and the registration and the workflow must agree). **Publishing access**: "Require
two-factor authentication and disallow bypass 2fa tokens". GitHub needs nothing: no secrets,
no environment.
