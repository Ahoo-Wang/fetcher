# AGENTS.md — Fetcher Monorepo

## Build & Run Commands

```bash
pnpm install              # Install all dependencies
pnpm build                # Build all packages
pnpm test:unit            # Run unit tests (all packages)
pnpm test:it              # Run integration tests
pnpm lint                 # Lint all packages
pnpm format               # Format with Prettier
pnpm clean                # Clean all build artifacts
pnpm storybook            # Start Storybook (viewer/react)

# Single package
pnpm --filter @ahoo-wang/fetcher build
pnpm --filter @ahoo-wang/fetcher test
pnpm --filter @ahoo-wang/fetcher vitest run src/fetcher.test.ts
```

## Testing

- **Framework**: Vitest with `@vitest/coverage-v8`
- **Globals**: `true` — use `describe`, `it`, `expect`, `vi` without imports
- **HTTP Mocking**: MSW (Mock Service Worker) in fetcher package
- **Browser Tests**: `@vitest/browser` with Playwright (viewer package)
- **Viewer Environment**: jsdom with `test/setup.ts`
- **Naming**: `*.test.ts` / `*.test.tsx` alongside source files
- **Lint**: ESLint ignores `**/**.test.ts` files

## Project Structure

```
packages/
  fetcher/      — Core HTTP client (no internal deps)
  decorator/    — TypeScript decorators for API services
  eventbus/     — Event bus (serial, parallel, broadcast)
  eventstream/  — SSE/streaming side-effect module
  openai/       — OpenAI API client integration
  openapi/      — OpenAPI 3.x TypeScript types
  generator/    — CLI code generator from OpenAPI specs
  react/        — React hooks for data fetching
  storage/      — Cross-environment storage abstraction
  cosec/        — CoSec authentication integration
  wow/          — Wow DDD/CQRS framework integration
  viewer/       — React + Ant Design component library
integration-test/ — Integration test workspace
```

## Code Style

- TypeScript strict mode, ES modules (`"type": "module"`)
- Prettier: single quotes, trailing commas, semicolons, 80 char width
- ESLint: `@typescript-eslint/no-explicit-any` OFF
- ESLint: `consistent-type-imports` with `prefer: "type-imports"` enforced
- All source files have Apache 2.0 license headers
- Root tsconfig: `experimentalDecorators` and `emitDecoratorMetadata` enabled
- All packages use Vite for building with `unplugin-dts` for types

## Git Workflow

- Branch from `main`
- Conventional commits: `feat:`, `fix:`, `chore:`, `test:`, `refactor:`, `docs:`
- Version updates via `pnpm update-version <version>`

## Boundaries

✅ **Always**: Run `pnpm test:unit` before committing, follow existing code patterns
⚠️ **Ask first**: Adding new packages, changing root tsconfig, modifying build config
🚫 **Never**: Commit without tests, break public API without version bump, add dependencies without catalog entry
