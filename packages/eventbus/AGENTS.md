# AGENTS.md — @ahoo-wang/fetcher-eventbus

<!-- This file provides coding agents with context about this package. -->

## Build & Run Commands

```bash
# Build this package
pnpm --filter @ahoo-wang/fetcher-eventbus build

# Run tests
pnpm --filter @ahoo-wang/fetcher-eventbus test

# Run a single test file
pnpm --filter @ahoo-wang/fetcher-eventbus vitest run src/eventBus.test.ts

# Lint
pnpm --filter @ahoo-wang/fetcher-eventbus lint

# Clean
pnpm --filter @ahoo-wang/fetcher-eventbus clean
```

## Testing

- Vitest with `globals: true` and `@vitest/coverage-v8`
- Test files: `*.test.ts` in a `test/` directory at the package root (mirroring `src/`)
- Run with `--coverage` flag by default

## Project Structure

```
src/
  eventBus.ts                     — Core EventBus interface and implementation
  typedEventBus.ts                — Typed EventBus with generic event types
  abstractTypedEventBus.ts        — Abstract base for typed event buses
  serialTypedEventBus.ts          — Serial execution: handlers run one at a time
  parallelTypedEventBus.ts        — Parallel execution: handlers run concurrently
  broadcastTypedEventBus.ts       — Broadcast: uses BroadcastChannel for cross-tab
  types.ts                        — Event type definitions
  nameGenerator.ts                — Unique name generation for channels
  messengers/                     — Internal messenger implementations
  index.ts                        — Barrel export
  stories/                        — Storybook stories
```

### Key Concepts

- **EventBus**: Core pub/sub interface for typed event dispatch
- **SerialTypedEventBus**: Handlers execute sequentially (in order)
- **ParallelTypedEventBus**: Handlers execute concurrently (Promise.all)
- **BroadcastTypedEventBus**: Cross-tab communication via BroadcastChannel API
- **TypedEventBus**: Generic typed wrapper that enforces event type safety

## Dependencies

- `@ahoo-wang/fetcher` — core HTTP client (for shared types)

## Code Style

- TypeScript strict mode
- Apache 2.0 license headers
- Prettier: single quotes, trailing commas, semicolons, 80 char width

## Git Workflow

- Conventional commits: `feat(eventbus):`, `fix(eventbus):`, `test(eventbus):`
- Version synced via `pnpm update-version`

## Boundaries

- ✅ Adding new event bus variants (e.g., priority-based)
- ✅ Adding new messenger implementations
- ✅ Writing new tests
- ⚠️ Changing EventBus interface — used by storage, cosec, react packages
- ⚠️ Modifying BroadcastChannel usage — affects cross-tab communication
- 🚫 Removing typed event bus variants (Serial/Parallel/Broadcast)
- 🚫 Breaking the EventBus subscriber contract
- 🚫 Changing the event dispatch ordering guarantees
