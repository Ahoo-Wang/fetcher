#!/bin/bash

# Install dependencies
pnpm install

# Build all packages
pnpm run build

# Run tests
pnpm run test

echo "Fetcher project initialized successfully!"