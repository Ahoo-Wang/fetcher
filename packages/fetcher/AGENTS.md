# AGENTS.md — @ahoo-wang/fetcher

<!-- This file provides coding agents with context about this package. -->

## Build & Run Commands

```bash
# Build this package
pnpm --filter @ahoo-wang/fetcher build

# Run tests
pnpm --filter @ahoo-wang/fetcher test

# Run a single test file
pnpm --filter @ahoo-wang/fetcher vitest run test/fetcher.test.ts

# Lint
pnpm --filter @ahoo-wang/fetcher lint

# Clean
pnpm --filter @ahoo-wang/fetcher clean
```

## Testing

- Vitest with `globals: true` and `@vitest/coverage-v8`
- MSW (Mock Service Worker) used for HTTP mocking
- Test files: `*.test.ts` in a `test/` directory at the package root (mirroring `src/`)
- Run with `--coverage` flag by default

## Project Structure

```
src/
  fetcher.ts                  — Main Fetcher class (wraps native Fetch)
  fetchExchange.ts            — Request/response exchange type
  fetchRequest.ts             — FetchRequest builder
  fetcherError.ts             — FetcherError class
  fetcherRegistrar.ts         — FetcherRegistrar registry for named instances
  namedFetcher.ts             — NamedFetcher pattern
  fetcherCapable.ts           — FetcherCapable interface
  fetchInterceptor.ts         — Request/response interceptor interfaces
  interceptor.ts              — Interceptor type definitions
  interceptorManager.ts       — InterceptorManager (ordered interceptor chain)
  orderedCapable.ts           — Ordered capability interface
  mergeRequest.ts             — Request merging utility
  requestBodyInterceptor.ts   — Request body handling interceptor
  resultExtractor.ts          — Response result extraction utilities
  timeout.ts                  — Timeout handling
  types.ts                    — Shared type definitions
  urlBuilder.ts               — URL builder with path/query params
  urlResolveInterceptor.ts    — URL resolution interceptor
  urlTemplateResolver.ts      — URL template parameter resolution ({id} / :id)
  urls.ts                     — URL utility functions
  utils.ts                    — General utilities
  validateStatusInterceptor.ts — HTTP status validation interceptor
  index.ts                    — Barrel export
  stories/                    — Storybook stories
```

### Key Concepts

- **Fetcher**: Core class — wraps `fetch()` with baseURL, timeout, interceptors, and error handling
- **InterceptorManager**: Manages ordered request/response/error interceptors
- **UrlBuilder**: Handles path parameter templates (`{id}` / `:id`) and query parameters
- **NamedFetcher**: Named registry pattern for managing multiple fetcher instances
- **FetcherRegistrar**: Shared registry used by decorator and other packages

## Code Style

- TypeScript strict mode
- Apache 2.0 license headers on all files
- Prettier: single quotes, trailing commas, semicolons, 80 char width
- No `any` restrictions (`no-explicit-any` is OFF)

## Git Workflow

- Conventional commits: `feat(fetcher):`, `fix(fetcher):`, `test(fetcher):`
- Version synced via `pnpm update-version`

## Boundaries

- ✅ Internal refactoring without changing public signatures
- ✅ Adding new utility functions, interceptors, or result extractors
- ✅ Writing new tests and updating stories
- ⚠️ Adding new exports to `index.ts` — ensure no naming conflicts
- ⚠️ Adding new dependencies — this is the core package, keep it minimal
- 🚫 Changing public API signatures (Fetcher constructor, interceptor chain contract)
- 🚫 Breaking the Fetcher/FetcherRegistrar interface used by all other packages
- 🚫 Removing or renaming exports without updating all downstream packages
