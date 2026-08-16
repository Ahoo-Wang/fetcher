# AGENTS.md — Fetcher Monorepo

TypeScript HTTP-client ecosystem: core `Fetcher`, decorators, event bus, SSE streaming, OpenAI client, OpenAPI types + code generator, React hooks, storage, CoSec auth, Wow CQRS integration, and an Ant Design viewer component library. All packages share one version (currently 3.17.0, updated together via `pnpm update-version <version>`).

## Build & Run Commands

```bash
pnpm install              # Install all dependencies (pnpm@10, Node >= 18.20.8)
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
  fetcher/      — Core HTTP client (no internal deps; everything depends on it)
  decorator/    — TypeScript decorators for API services
  eventbus/     — Event bus (serial, parallel, broadcast)
  eventstream/  — SSE/streaming side-effect module
  openai/       — OpenAI API client integration
  openapi/      — OpenAPI 3.x TypeScript types (type-only, zero runtime)
  generator/    — CLI code generator from OpenAPI specs
  react/        — React hooks for data fetching
  storage/      — Cross-environment storage abstraction
  cosec/        — CoSec authentication integration
  wow/          — Wow DDD/CQRS framework integration
  viewer/       — React + Ant Design component library
integration-test/ — Integration test workspace
skills/         — Agent skills (see below)
wiki/           — VitePress documentation site (see wiki/AGENTS.md)
```

## skills/ — Agent Skills

- 12 skills, one per package family: `SKILL.md` (~38 lines, trigger + workflow) + `references/api.md` (detailed API) + `agents/openai.yaml`; packaged by `skills/plugins.json` (plugin `ahoo-fetcher-skills`).
- `skills/*/evals/` hold test fixtures for some skills (notably `fetcher-openapi-generator`).
- **Skills must stay in sync with package source.** When a package's public API changes, update the matching skill's `api.md` in the same change. Verify documented symbols/signatures/defaults against `packages/*/src/index.ts` exports — past audits found fabricated symbols, wrong operator sets, and non-compiling examples.
- CQRS eval fixtures must satisfy the generator's real discovery rules: root-level `tags:`, inline command `requestBody` + `responses['200']` → `#/components/responses/wow.CommandOk`, plus both `.snapshot_state.single` and `.snapshot.count` operations. Verify fixtures by running the built CLI:
  `cd packages/generator && node dist/cli.js generate -i <spec.yaml> -o /tmp/out -t tsconfig.json` (the "Configuration file parsing failed: ENOENT ./fetcher-generator.config.json" warning is benign).

## wiki/ — Documentation Site

- VitePress; **EN pages (`wiki/…`) and ZH pages (`wiki/zh/…`) must be updated together**.
- Read `wiki/AGENTS.md` before editing the wiki.
- `llms-full.txt`, `llms.txt`, and `.vitepress/dist/` are build artifacts — never hand-edit.
- Validate edits with `pnpm build` inside `wiki/` (checks Mermaid + markdown).

## Code Style

- TypeScript strict mode, ES modules (`"type": "module"`)
- Prettier: single quotes, trailing commas, semicolons, 80 char width
- ESLint: `@typescript-eslint/no-explicit-any` OFF
- ESLint: `consistent-type-imports` with `prefer: "type-imports"` enforced
- All source files have Apache 2.0 license headers
- Root tsconfig: `experimentalDecorators` and `emitDecoratorMetadata` enabled
- All packages use Vite for building with `unplugin-dts` for types

## Git Workflow

- Branch from `main`; conventional commits: `feat:`, `fix:`, `chore:`, `test:`, `refactor:`, `docs:`
- PRs merge **squash-only** (merge commits are disabled repo-wide; branch auto-deletes on merge)
- Version updates via `pnpm update-version <version>` (bumps all packages in lockstep)

## Boundaries

✅ **Always**: Run `pnpm test:unit` before committing, follow existing code patterns, verify doc claims (skills/wiki/README) against actual source before writing them
⚠️ **Ask first**: Adding new packages, changing root tsconfig, modifying build config
🚫 **Never**: Commit without tests, break public API without version bump, add dependencies without catalog entry (catalog lives in `pnpm-workspace.yaml`)
