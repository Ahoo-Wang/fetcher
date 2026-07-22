# AGENTS.md — @ahoo-wang/fetcher-storage

<!-- This file provides coding agents with context about this package. -->

## Build & Run Commands

```bash
# Build this package
pnpm --filter @ahoo-wang/fetcher-storage build

# Run tests
pnpm --filter @ahoo-wang/fetcher-storage test

# Run a single test file
pnpm --filter @ahoo-wang/fetcher-storage vitest run src/keyStorage.test.ts

# Lint
pnpm --filter @ahoo-wang/fetcher-storage lint

# Clean
pnpm --filter @ahoo-wang/fetcher-storage clean
```

## Testing

- Vitest with `globals: true` and `@vitest/coverage-v8`
- Test files: `*.test.ts` in a `test/` directory at the package root (mirroring `src/`)
- Run with `--coverage` flag by default

## Project Structure

```
src/
  keyStorage.ts          — KeyStorage interface and implementations (localStorage, sessionStorage)
  inMemoryStorage.ts     — In-memory storage fallback for non-browser environments
  serializer.ts          — Serialization/deserialization for storage values
  env.ts                 — Environment detection (browser vs. server)
  index.ts               — Barrel export
  stories/               — Storybook stories
```

### Key Concepts

- **KeyStorage**: Typed key-value storage with localStorage/sessionStorage backends
- **InMemoryStorage**: Fallback for environments without DOM storage (SSR, Node.js)
- **Serializer**: Handles JSON serialization/deserialization of stored values
- **Environment detection**: Gracefully handles browser vs. non-browser contexts

## Dependencies

- `@ahoo-wang/fetcher-eventbus` — for storage change event broadcasting

## Code Style

- TypeScript strict mode
- Apache 2.0 license headers
- Prettier: single quotes, trailing commas, semicolons, 80 char width

## Git Workflow

- Conventional commits: `feat(storage):`, `fix(storage):`, `test(storage):`
- Version synced via `pnpm update-version`

## Boundaries

- ✅ Adding new storage backends (e.g., IndexedDB)
- ✅ Adding new serializer formats
- ✅ Writing new tests
- ⚠️ Changing KeyStorage interface — used by cosec and react packages
- ⚠️ Modifying environment detection logic — affects SSR compatibility
- 🚫 Breaking the KeyStorage API contract
- 🚫 Removing in-memory fallback without migration plan
