# AGENTS.md — @ahoo-wang/fetcher-openai

<!-- This file provides coding agents with context about this package. -->

## Build & Run Commands

```bash
# Build this package
pnpm --filter @ahoo-wang/fetcher-openai build

# Run tests
pnpm --filter @ahoo-wang/fetcher-openai test

# Run a single test file
pnpm --filter @ahoo-wang/fetcher-openai vitest run test/openai.test.ts

# Lint
pnpm --filter @ahoo-wang/fetcher-openai lint

# Clean
pnpm --filter @ahoo-wang/fetcher-openai clean
```

## Testing

- Vitest with `globals: true` and `@vitest/coverage-v8`
- Test files: `*.test.ts` in a `test/` directory at the package root (mirroring `src/`)
- Run with `--coverage` flag by default

## Project Structure

```
src/
  openai.ts          — OpenAI API client (decorator-based service)
  index.ts            — Barrel export
  chat/               — Chat completion types and API
  stories/            — Storybook stories
```

### Key Concepts

- **OpenAI Client**: Decorator-based API service for OpenAI's chat completion API
- **Streaming**: Uses eventstream's `jsonEventStream()` for streaming chat responses
- **Decorator Pattern**: Uses `@api`, `@post` decorators from fetcher-decorator

## Dependencies

- `@ahoo-wang/fetcher` — core HTTP client
- `@ahoo-wang/fetcher-eventstream` — SSE streaming for chat completions
- `@ahoo-wang/fetcher-decorator` — declarative API service decorators

## Code Style

- TypeScript strict mode
- Apache 2.0 license headers
- Prettier: single quotes, trailing commas, semicolons, 80 char width

## Git Workflow

- Conventional commits: `feat(openai):`, `fix(openai):`, `test(openai):`
- Version synced via `pnpm update-version`

## Boundaries

- ✅ Adding new OpenAI API endpoints (e.g., embeddings, images)
- ✅ Adding new chat completion options
- ✅ Writing new tests
- ⚠️ Changing streaming response format — affects chat UI consumers
- 🚫 Breaking the OpenAI client API
- 🚫 Removing streaming support
