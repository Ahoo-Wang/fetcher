#!/bin/bash

# Simple script to update version for all packages in the workspace
# Usage: ./scripts/update-all-versions.sh <version>

set -e  # Exit on any error

VERSION=${1:-""}

if [ -z "$VERSION" ]; then
  echo "Error: Version argument is required"
  echo "Usage: ./scripts/update-all-versions.sh <version>"
  exit 1
fi

echo "Updating all packages to version $VERSION..."

# Use Node.js to update package.json files
UPDATE_SCRIPT="
const fs = require('fs');
const path = process.argv[1];
const version = process.argv[2];

try {
  const pkg = JSON.parse(fs.readFileSync(path, 'utf8'));
  pkg.version = version;
  fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n');
  console.log(pkg.name + ' updated to version ' + version);
} catch (error) {
  console.error('Error updating ' + path + ':', error.message);
  process.exit(1);
}
"

# Update root package.json
echo "Updating root package.json..."
node -e "$UPDATE_SCRIPT" package.json "$VERSION"

# Update all workspace packages
echo "Updating workspace packages..."
for package in packages/*/; do
  if [ -f "$package/package.json" ]; then
    echo "Updating ${package}package.json..."
    node -e "$UPDATE_SCRIPT" "${package}package.json" "$VERSION"
  fi
done

# Also update examples package if it exists
if [ -f "examples/package.json" ]; then
  echo "Updating examples/package.json..."
  node -e "$UPDATE_SCRIPT" examples/package.json "$VERSION"
fi

echo "All packages updated to version $VERSION"