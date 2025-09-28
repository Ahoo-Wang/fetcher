#!/bin/bash

# Publish all packages in the monorepo to NPM
# This script is called from the GitHub Actions release workflow

set -e

echo "Starting NPM publish process..."

# Publish each package in the monorepo
for package in packages/*/; do
  if [ -f "$package/package.json" ]; then
    package_name=$(node -p "require('./$package/package.json').name")
    if [[ "$package_name" != *"@"* ]]; then
      echo "Skipping $package_name as it's not a scoped package"
      continue
    fi
    echo "Publishing $package_name"
    pnpm publish "$package" --access public --no-git-checks
  fi
done

echo "NPM publish process completed successfully!"