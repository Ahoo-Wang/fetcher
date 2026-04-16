# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Fetcher is a monorepo containing a modern HTTP client library ecosystem built on the native Fetch API. It provides an Axios-like experience with powerful features including interceptors, timeout control, and native LLM streaming API support.

## Tech Stack

- **Package Manager**: pnpm (workspace-based monorepo)
- **Build Tool**: Vite
- **Testing**: Vitest with coverage
- **Language**: TypeScript (strict mode)
- **Linting**: ESLint with Prettier

## Commands

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run all tests
pnpm test

# Run unit tests only (packages/*)
pnpm test:unit

# Run integration tests
pnpm test:it

# Lint all packages
pnpm lint

# Format code
pnpm format

# Clean build artifacts
pnpm clean

# Run Storybook
pnpm storybook

# Build Storybook docs
pnpm build-storybook

# Update all package versions
pnpm update-version <new-version>
```

## Package Architecture

The ecosystem is built on the core `fetcher` package with modular extensions. The core extension mechanism is the **interceptor system** - request/response interceptors with ordered execution that can transform exchanges or handle errors.

### Core
- **`packages/fetcher`** - Ultra-lightweight (3KB) HTTP client with interceptors, timeout, path/query parameters

### Extensions (interceptor-based)
- **`packages/decorator`** - TypeScript decorators for declarative API service definitions, uses `NamedFetcher` registry
- **`packages/eventstream`** - Adds `eventStream()` and `jsonEventStream()` methods to responses via `EventStreamInterceptor`
- **`packages/eventbus`** - Event bus with serial/parallel execution and cross-tab broadcasting
- **`packages/openai`** - Type-safe OpenAI API client with streaming support
- **`packages/storage`** - Cross-environment storage (localStorage/sessionStorage/in-memory)
- **`packages/react`** - React hooks for data fetching and state management

### Framework Integrations
- **`packages/wow`** - First-class support for Wow CQRS/DDD framework (commands, queries, aggregates)
- **`packages/cosec`** - Adds `CoSecInterceptor` for automatic authentication and token refresh

### Code Generation
- **`packages/generator`** - CLI tool that generates type-safe TypeScript clients from OpenAPI 3.0+ specs, with specialized support for Wow CQRS patterns
- **`packages/openapi`** - TypeScript type definitions for OpenAPI 3.0+ specifications (used by generator)

### UI Components
- **`packages/viewer`** - Table, filter, and view components for data display

## Dependency Management

Shared dependencies are managed via `pnpm-workspace.yaml` catalog entries. When adding dependencies, use `catalog:` instead of version numbers to ensure consistency across the monorepo.

## Key Patterns

**Named Fetcher Registry**: The decorator package uses a static registry to map fetcher names to instances. Register with `NamedFetcher.register(name, config)` and reference in `@api('/path', { fetcher: 'name' })`.

**Interceptor Order**: Interceptors execute in ascending `order` value (lower = runs first). Use this to chain middleware like auth → logging → actual request.

## Testing

Tests use Vitest with coverage enabled. Each package has its own `test/` directory. Integration tests live in `integration-test/`.

- **API Mocking**: Tests use MSW (Mock Service Worker) to intercept fetch requests at the network level
- **Browser Testing**: Some packages test in browser environments using `@vitest/browser` with Playwright
- **Run unit tests**: `pnpm test:unit` (packages only, excludes integration tests)
- **Run single test file**: `pnpm vitest run packages/fetcher/test/fetcher.test.ts`