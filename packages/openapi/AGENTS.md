# AGENTS.md — @ahoo-wang/fetcher-openapi

<!-- This file provides coding agents with context about this package. -->

## Build & Run Commands

```bash
# Build this package
pnpm --filter @ahoo-wang/fetcher-openapi build

# Run tests
pnpm --filter @ahoo-wang/fetcher-openapi test

# Run a single test file
pnpm --filter @ahoo-wang/fetcher-openapi vitest run src/openAPI.test.ts

# Lint
pnpm --filter @ahoo-wang/fetcher-openapi lint

# Clean
pnpm --filter @ahoo-wang/fetcher-openapi clean
```

## Testing

- Vitest with `globals: true` and `@vitest/coverage-v8`
- Test files: `*.test.ts` alongside source files
- Run with `--coverage` flag by default

## Project Structure

```
src/
  openAPI.ts         — Core OpenAPI document types
  info.ts            — OpenAPI Info object types
  server.ts          — Server variable types
  paths.ts           — Path item and operation types
  schema.ts          — JSON Schema types (SchemaObject, ReferenceObject)
  parameters.ts      — Parameter types (query, path, header, cookie)
  responses.ts       — Response types
  requestBody.ts     — (if present) Request body types
  security.ts        — Security scheme types
  tags.ts            — Tag types
  extensions.ts      — Vendor extension (x-*) types
  components.ts      — Components object types
  reference.ts       — $ref reference types
  base-types.ts      — Base/shared type definitions
  client/            — (empty) Client type placeholders
  index.ts           — Barrel export
  stories/           — Storybook stories
```

### Key Concepts

- **Pure Type Definitions**: This package contains only TypeScript type definitions — no runtime code
- **OpenAPI 3.x**: Types model the OpenAPI 3.0+ specification
- **No Dependencies**: Standalone package with no internal or external dependencies
- **Consumed by**: fetcher-generator for code generation, and any package needing OpenAPI type safety

## Dependencies

- None — standalone type definitions package

## Code Style

- TypeScript strict mode
- Apache 2.0 license headers
- Prettier: single quotes, trailing commas, semicolons, 80 char width
- Export-only package (no runtime logic)

## Git Workflow

- Conventional commits: `feat(openapi):`, `fix(openapi):`, `test(openapi):`
- Version synced via `pnpm update-version`

## Boundaries

- ✅ Adding new OpenAPI 3.x type definitions
- ✅ Adding new vendor extension types
- ✅ Writing new tests
- ⚠️ Changing existing type names — affects generator and other consumers
- 🚫 Adding runtime code — this is a types-only package
- 🚫 Removing existing type exports without migration plan
- 🚫 Breaking compatibility with OpenAPI 3.0 specification
