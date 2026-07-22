# AGENTS.md — @ahoo-wang/fetcher-react

<!-- This file provides coding agents with context about this package. -->

## Build & Run Commands

```bash
# Build this package
pnpm --filter @ahoo-wang/fetcher-react build

# Run tests
pnpm --filter @ahoo-wang/fetcher-react test

# Run a single test file
pnpm --filter @ahoo-wang/fetcher-react vitest run src/core/useQuery.test.ts

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
    useQuery.ts               — Core useQuery hook
    usePromiseState.ts        — Promise state management hook
    useExecutePromise.ts      — Execute promise hook
    useQueryState.ts          — Query state hook
    useLatest.ts              — Latest value ref hook
    useMounted.ts             — Mounted state hook
    useForceUpdate.ts         — Force re-render hook
    useRefs.ts                — Multi-ref hook
    useRequestId.ts           — Request ID tracking hook
    debounced/                — Debounced variants of hooks
      useDebouncedCallback.ts
      useDebouncedExecutePromise.ts
      useDebouncedQuery.ts
    fullscreen/               — Fullscreen context and hook
      FullscreenContext.tsx, useFullscreen.ts, utils.ts
  api/
    apiHooks.ts               — Generic API hooks factory
    createExecuteApiHooks.ts  — Execute API hooks creator
    createQueryApiHooks.ts    — Query API hooks creator
  fetcher/
    useFetcher.ts             — useFetcher hook (Fetcher as state)
    useFetcherQuery.ts        — Fetcher-based query hook
    debounced/                — Debounced fetcher hooks
      useDebouncedFetcher.ts, useDebouncedFetcherQuery.ts
  wow/
    useCountQuery.ts          — Wow count query hook
    useListQuery.ts           — Wow list query hook
    useListStreamQuery.ts     — Wow list stream query hook (SSE)
    usePagedQuery.ts          — Wow paged query hook
    useSingleQuery.ts         — Wow single entity query hook
    fetcher/                  — Fetcher-specific wow query implementations
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
  dataMonitor/
    DataMonitorService.ts     — Data monitor service
    useDataMonitor.ts         — Data monitor hook
    useDataMonitorEventBus.ts — Data monitor event bus hook
  notification/
    notificationCenter.ts     — Notification center
    channel/                  — Notification channel implementations
      browserNotification.ts, notificationChannel.ts, notificationChannelRegistry.ts
```

### Key Concepts

- **React 19 + React Compiler**: Uses React Compiler for automatic memoization
- **Hooks-first API**: All functionality exposed as React hooks
- **Wow Query Hooks**: Type-safe hooks for Wow CQRS queries (list, paged, single, count, stream)
- **API Hooks Factory**: `createQueryApiHooks` / `createExecuteApiHooks` generate typed hook sets
- **Security**: CoSec integration via SecurityContext and RouteGuard components
- **Data Monitor**: Real-time data monitoring via EventBus

## Dependencies

- `@ahoo-wang/fetcher` — core HTTP client
- `@ahoo-wang/fetcher-eventstream` — SSE streaming
- `@ahoo-wang/fetcher-eventbus` — event bus
- `@ahoo-wang/fetcher-storage` — storage
- `@ahoo-wang/fetcher-wow` — Wow CQRS types and clients
- `@ahoo-wang/fetcher-cosec` — authentication

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
- ✅ Adding new Wow query hook variants
- ✅ Writing new tests and stories
- ⚠️ Changing hook return types — consumers depend on these
- ⚠️ Modifying SecurityContext/RouteGuard — affects app-level auth flows
- 🚫 Breaking existing hook APIs (useQuery, useFetcher, etc.)
- 🚫 Removing React Compiler integration without team discussion
- 🚫 Changing Wow query hook signatures — affects generated code
