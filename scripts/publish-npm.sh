#!/bin/bash

# Publish the packages in the monorepo to NPM
# This script is called from the GitHub Actions release workflow
#
# Every package is published under the dist-tag scripts/release-version.mjs
# derives from the version: a prerelease (8.0.0-rc.1) under its word (rc),
# never latest; a stable version under latest, or latest-<major> when npm's
# latest is already higher (a maintenance release). NPM_DIST_TAG overrides it.
# RELEASE_TAG / RELEASE_PRERELEASE (from the GitHub release) must match.

set -e

script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

echo "Starting NPM publish process..."

# Refuse misaligned, malformed or mismatched versions before publishing anything
version=$(node "$script_dir/release-version.mjs" check)
echo "Release version $version"

# Publish each package in the monorepo
for package in packages/*/; do
  if [ -f "$package/package.json" ]; then
    package_name=$(node -p "require('./$package/package.json').name")
    if [[ "$package_name" != *"@"* ]]; then
      echo "Skipping $package_name as it's not a scoped package"
      continue
    fi
    tag=$(node "$script_dir/release-version.mjs" tag "$package_name")
    echo "Publishing $package_name@$version with dist-tag $tag"
    pnpm publish "$package" --access public --no-git-checks --tag "$tag"
  fi
done

echo "NPM publish process completed successfully!"
