# AGENTS.md — @ahoo-wang/fetcher-react

<!-- This file provides coding agents with context about this package. -->

## Build & Run Commands

```bash
# Build this package
pnpm --filter @ahoo-wang/fetcher-react build

# Run tests
pnpm --filter @ahoo-wang/fetcher-react test

# Run a single test file
pnpm --filter @ahoo-wang/fetcher-react exec vitest run test/core/useQuery.test.tsx

# Lint
pnpm --filter @ahoo-wang/fetcher-react lint

# Clean
pnpm --filter @ahoo-wang/fetcher-react clean
```

## Testing

- Vitest with `globals: true` and `@vitest/coverage-v8`
- Test files: `*.test.ts` / `*.test.tsx` in a `test/` directory at the package root (mirroring `src/`)
- Run with `--coverage` flag by default

## Project Structure

```
src/
  index.ts                    — Barrel export
  types.ts                    — Shared React type definitions
  core/
    usePromiseState.ts        — Promise state ({ status, loading, result, error }) and sync setters
    useExecutePromise.ts      — Cancellable execution; the AbortController identifies the request
    useQuery.ts               — Controlled query: executes when the query content changes
    useQueryTrigger.ts        — Internal: query change detection shared by useQuery/useFetcherQuery
    useLatest.ts              — Latest value ref hook
    useStableValue.ts         — Keeps the previous reference while content is deep-equal
    debounced/                — Debounced variants of hooks
      useDebouncedCallback.ts
      useDebouncedValue.ts
      useDebouncedExecutePromise.ts
      useDebouncedQuery.ts
  api/
    apiHooks.ts               — collectMethods, methodNameToHookName, shared types
    mapApiHooks.ts            — Internal: maps API methods to hooks (not exported)
    createExecuteApiHooks.ts  — Execute API hooks creator
    createQueryApiHooks.ts    — Query API hooks creator
  fetcher/
    useFetcher.ts             — useFetcher hook (Fetcher request as state)
    useFetcherQuery.ts        — Fetcher-based controlled query hook
    debounced/                — Debounced fetcher hooks
      useDebouncedFetcher.ts, useDebouncedFetcherQuery.ts
  cosec/
    SecurityContext.tsx       — Security context provider
    RouteGuard.tsx            — Route guard component (auth)
    RefreshableRouteGuard.tsx — Auto-refresh route guard
    useSecurity.ts            — Security state hook
  eventbus/
    useEventSubscription.ts   — Typed event subscription hook
  storage/
    useKeyStorage.ts          — KeyStorage hook
    useImmerKeyStorage.ts     — Immer-based KeyStorage hook
```

### Key Concepts

- **AbortController as identity**: each execution gets its own
  `AbortController`, and only the current one may write state. A newer
  execution, `abort()`, `reset()` and unmounting all abort it.
- **`execute` never rejects**: it resolves to the state the execution ended in
  (`idle` when cancelled). `onSuccess`/`onError` run only for the current
  execution; `onAbort` runs synchronously on cancellation.
- **Controlled queries**: the query lives in the caller's state and is passed
  as `query`; the hook executes when its content (deep-equal, `dequal`)
  changes. `undefined` means not ready.
- **React 19 + React Compiler**: the compiler compiles the hooks. It skips a
  hook whose body contains `try`/`catch`, so keep `try`/`catch` in plain
  functions outside the hook (see `settle` in `useExecutePromise.ts`).
- **API Hooks Factory**: `createQueryApiHooks` / `createExecuteApiHooks` generate typed hook sets
- **Security**: CoSec integration via SecurityContext and RouteGuard components
- **Subpaths**: `/core` and `/fetcher` load no security, storage or event-bus
  integration; `pnpm test:package` checks this on the build output
- **Wow hooks moved**: Wow's hooks live in `@ahoo-wang/wow-react` in the
  [Wow repository](https://github.com/Ahoo-Wang/Wow/tree/main/typescript),
  which does not depend on this package

## Dependencies

- Peers: `@ahoo-wang/fetcher` (core HTTP client), `@ahoo-wang/fetcher-eventbus`
  (event bus), `@ahoo-wang/fetcher-storage` (storage),
  `@ahoo-wang/fetcher-cosec` (authentication), `react` `^19.0.0`
- Dependencies: `dequal` (deep equality for queries), `immer`
  (`useImmerKeyStorage`)

## Code Style

- TypeScript strict mode
- React 19 with React Compiler (`babel-plugin-react-compiler`)
- Apache 2.0 license headers
- Prettier: single quotes, trailing commas, semicolons, 80 char width
- Stories written as `.stories.tsx` for Storybook

## Git Workflow

- Conventional commits: `feat(react):`, `fix(react):`, `test(react):`
- Version synced via `pnpm update-version`

## Boundaries

- ✅ Adding new React hooks
- ✅ Writing new tests and stories
- ⚠️ Changing hook return types — consumers depend on these
- ⚠️ Modifying SecurityContext/RouteGuard — affects app-level auth flows
- 🚫 Breaking existing hook APIs (useQuery, useFetcher, etc.)
- 🚫 Removing React Compiler integration without team discussion
- 🚫 Loading security, storage or event-bus integration from the `/core` or `/fetcher` subpaths
