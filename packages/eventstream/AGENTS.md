# AGENTS.md — @ahoo-wang/fetcher-eventstream

<!-- This file provides coding agents with context about this package. -->

## Build & Run Commands

```bash
# Build this package
pnpm --filter @ahoo-wang/fetcher-eventstream build

# Run tests
pnpm --filter @ahoo-wang/fetcher-eventstream test

# Run a single test file
pnpm --filter @ahoo-wang/fetcher-eventstream vitest run test/responses.test.ts

# Lint
pnpm --filter @ahoo-wang/fetcher-eventstream lint

# Clean
pnpm --filter @ahoo-wang/fetcher-eventstream clean
```

## Testing

- Vitest with `globals: true` and `@vitest/coverage-v8`
- Test files: `*.test.ts` in a `test/` directory at the package root (mirroring `src/`)
- Run with `--coverage` flag by default

## Project Structure

```
src/
  responses.ts                            — Side-effect: patches Response.prototype with eventStream/jsonEventStream
  eventStreamConverter.ts                 — Converts ReadableStream to SSE event stream
  eventStreamResultExtractor.ts           — Extracts results from event streams
  serverSentEventTransformStream.ts       — SSE TransformStream parser
  jsonServerSentEventTransformStream.ts   — JSON-encoded SSE TransformStream
  textLineTransformStream.ts             — Line-based text TransformStream
  readableStreamAsyncIterable.ts          — Async iterable wrapper for ReadableStream
  readableStreams.ts                      — ReadableStream utilities
  index.ts                                — Barrel export
  stories/                                — Storybook stories
```

### Key Concepts

- **Side-effect module**: Importing `@ahoo-wang/fetcher-eventstream` patches `Response.prototype` with `eventStream()` and `jsonEventStream()` methods. This is the core design pattern.
- **TransformStream**: Uses Web Streams API TransformStreams for parsing SSE data
- **Server-Sent Events (SSE)**: Core protocol for LLM streaming API support
- **JSON SSE**: Variant that parses each SSE event data as JSON

## Dependencies

- `@ahoo-wang/fetcher` — core HTTP client (for Fetcher types, not runtime dependency)

## Code Style

- TypeScript strict mode
- Apache 2.0 license headers
- Prettier: single quotes, trailing commas, semicolons, 80 char width
- Web Streams API preferred (TransformStream, ReadableStream)

## Git Workflow

- Conventional commits: `feat(eventstream):`, `fix(eventstream):`, `test(eventstream):`
- Version synced via `pnpm update-version`

## Boundaries

- ✅ Adding new TransformStream implementations
- ✅ Adding new stream utility functions
- ✅ Writing new tests
- ⚠️ Modifying Response.prototype patching — all consumers depend on this side effect
- ⚠️ Changing SSE parsing behavior — affects LLM streaming in openai/wow packages
- 🚫 Removing `eventStream()` or `jsonEventStream()` from Response prototype
- 🚫 Breaking the side-effect import contract
- 🚫 Changing the SSE event data format expected by consumers
