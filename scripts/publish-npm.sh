#!/bin/bash

# Publish the packages in the monorepo to NPM
# This script is called from the GitHub Actions release workflow
#
# scripts/release-version.mjs decides everything before the first package
# goes out:
# - every package carries one lowercase semver version, matching RELEASE_TAG /
#   RELEASE_PRERELEASE (from the GitHub release) when they are set;
# - each package's dist-tag: a prerelease (8.0.0-rc.1) under its word (rc),
#   never latest; a stable version under latest, or latest-<major> when npm's
#   latest is already higher (a maintenance release). NPM_DIST_TAG overrides it;
# - which packages npm already has at this version, so rerunning a release
#   that stopped half-way publishes only the rest.
# A failed npm lookup stops the release before anything is published.

set -e

script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

echo "Starting NPM publish process..."

version=$(node "$script_dir/release-version.mjs" check)
echo "Release version $version"
plan=$(node "$script_dir/release-version.mjs" plan)

while IFS=$'\t' read -r package package_name tag state; do
  [ -n "$package" ] || continue
  if [ "$state" = "published" ]; then
    echo "Skipping $package_name@$version: already on npm"
    continue
  fi
  echo "Publishing $package_name@$version with dist-tag $tag"
  pnpm publish "$package" --access public --no-git-checks --tag "$tag"
done <<< "$plan"

echo "NPM publish process completed successfully!"
