# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fetcher is a modular HTTP client ecosystem built on the native Fetch API. It provides an Axios-like experience with interceptor-powered middleware, TypeScript-first design, and native LLM streaming API support. Published as an npm monorepo under `@ahoo-wang/*`.

## Build & Development Commands

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run unit tests (all packages)
pnpm test:unit

# Run integration tests (required cases; starts a local JSONPlaceholder server)
pnpm test:it

# Run the advisory integration cases that reach public-internet hosts
pnpm test:it:external

# Run tests for a single package
pnpm --filter @ahoo-wang/fetcher test
pnpm --filter @ahoo-wang/fetcher-react test

# Run a single test file
pnpm --filter @ahoo-wang/fetcher exec vitest run test/fetcher.test.ts

# Lint all packages
pnpm lint

# Format code
pnpm format

# Clean all build artifacts
pnpm clean

# Storybook (http, events, storage and react stories)
pnpm storybook

# Update version across all packages
pnpm update-version <version>
```

Each package also supports its own scripts directly: `pnpm --filter <package-name> <script>`.

## Monorepo Structure

pnpm workspaces monorepo with 9 packages in `packages/` plus `integration-test/` and `wiki/`. Dependency versions are centralized via the `catalog:` protocol in `pnpm-workspace.yaml`.

### Package Dependency Graph

```
openapi (standalone types, no deps)
  |
fetcher (core HTTP client, no internal deps)
  |
  +-- decorator  (depends on fetcher, uses reflect-metadata)
  +-- eventbus   (depends on fetcher)
  +-- eventstream (depends on fetcher, adds SSE/LLM streaming via side-effect import)
  |
  +-- openai  (depends on fetcher + eventstream + decorator)
  +-- storage (depends on eventbus)
  +-- cosec   (depends on fetcher + eventbus + storage)
  |
  +-- react    (depends on fetcher + eventstream + eventbus + storage + cosec)
```

### Moved to the Wow repository

The Wow-coupled packages live in [Ahoo-Wang/Wow](https://github.com/Ahoo-Wang/Wow/tree/main/typescript) under `typescript/`, versioned with Wow: `@ahoo-wang/wow-client` (was `fetcher-wow`), `@ahoo-wang/wow-react` (the Wow hooks from `fetcher-react`), `@ahoo-wang/wow-view-engine` (was `fetcher-view-engine`) and `@ahoo-wang/wow-generator` (was `fetcher-generator`). `@ahoo-wang/fetcher-viewer` and the data-monitor hooks were not moved; they stay on the `5.x` branch, which keeps the 5.x line. The new packages are published to npm with Wow's first stable release; until then the 5.x line (`5.x` branch, 5.1.x on npm) keeps `@ahoo-wang/fetcher-wow`, the Wow hooks in `@ahoo-wang/fetcher-react` and `@ahoo-wang/fetcher-generator`. `@ahoo-wang/wow-view-engine` is not published until view-engine is declared stable.

Dependencies run one way, **Wow → fetcher**: no package here may depend on `@ahoo-wang/wow-*` (checked by `.github/scripts/dependency-direction.mjs` in Engineering Quality). `@ahoo-wang/wow-react` imports only the `@ahoo-wang/fetcher-react/core` and `/fetcher` subpaths. `downstream-wow.yml` runs Wow's TypeScript tests against changes to the core packages Wow uses (advisory).

### Package Build Config

All packages use Vite for building with `unplugin-dts` for type declarations. Each package outputs:

- ESM: `dist/index.es.js`, typed by `dist/index.d.ts` (`exports[...].import`)
- UMD: `dist/index.umd.cjs`, typed by `dist/index.d.cts` (`exports[...].require`)

unplugin-dts emits both declaration sets (`outDirs: [{ dir: 'dist', moduleFormat: 'cjs' }, 'dist']`) with runtime extensions on relative specifiers, so types resolve under node16/nodenext. `pnpm check:package-types` (after `pnpm build`) packs every published package and checks it with `@arethetypeswrong/cli`; it runs in Engineering Quality.

The React package also uses `@vitejs/plugin-react` with React Compiler.

### Testing

- **Unit tests**: Vitest with `@vitest/coverage-v8` for coverage
- **Browser tests**: `@vitest/browser` with Playwright (Storybook interaction tests, `pnpm test:storybook`)
- **Integration tests**: Separate `integration-test` workspace with real API calls
- **MSW**: Used for HTTP mocking in unit tests (fetcher package)
- **Vitest globals**: `globals: true` — use `describe`, `it`, `expect`, `vi` without imports
- **React tests**: Run in `jsdom` environment
- Test files follow `*.test.ts` / `*.test.tsx` naming convention alongside source files
- ESLint ignores `**/**.test.ts` files — test files are not linted

## Architecture

### Core (`packages/fetcher`)

The foundation HTTP client. Key concepts:

- **Fetcher**: Main client class wrapping native Fetch with baseURL, timeout, and interceptors
- **NamedFetcher**: Named registry pattern for managing multiple fetcher instances
- **FetcherRegistrar**: Registry for named fetchers, used by decorator and other packages
- **Interceptor system**: Ordered request/response/error interceptors via `InterceptorManager`
- **UrlBuilder**: Handles path parameter templates (`{id}` / `:id`) and query parameters

### Decorator (`packages/decorator`)

Uses `reflect-metadata` to create declarative API service classes:

- `@api(basePath, options)` - class-level decorator for service definition
- `@get/@post/@put/@delete/@patch` - method decorators for HTTP verbs
- `@path/@query/@header/@body` - parameter decorators for argument binding
- Methods are auto-implemented; throw `autoGeneratedError()` as placeholder

### EventStream (`packages/eventstream`)

**Side-effect module** - importing `@ahoo-wang/fetcher-eventstream` patches `Response.prototype` with `eventStream()` and `jsonEventStream()` methods. This is the mechanism for SSE/LLM streaming support.

## Code Style

- **TypeScript strict mode** enabled across all packages
- **Root tsconfig** enables `experimentalDecorators` and `emitDecoratorMetadata` (supports decorator package)
- **Prettier** config: single quotes, trailing commas, semicolons, 80 char width, no arrow parens
- **ESLint**: `@typescript-eslint/no-explicit-any` is OFF
- **ESLint**: `@typescript-eslint/consistent-type-imports` with `prefer: "type-imports"` enforced for integration-test and story files
- **ES modules**: `"type": "module"` throughout
- All source files have Apache 2.0 license headers
- Chinese READMEs (`README.zh-CN.md`) maintained alongside English ones
- Each package has an `analyze` script (`vite-bundle-analyzer`) for bundle size inspection
