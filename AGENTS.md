# AGENTS.md — Fetcher Monorepo

TypeScript HTTP-client ecosystem built around `Fetcher`.

## Scope and Sources

- 默认使用中文与用户沟通。
- Read applicable nested `AGENTS.md` files before editing, including `packages/<package>/AGENTS.md` or `wiki/AGENTS.md`. Their rules apply within their directory.
- Read versions, Node/pnpm requirements, and scripts from root `package.json`; workspace membership and dependency versions come from `pnpm-workspace.yaml`.
- Keep changes scoped, follow existing patterns, and reuse package APIs. For fixes, inspect callers and address the shared cause.

## Repository Map

| Path                                                                 | Responsibility                                       |
| -------------------------------------------------------------------- | ---------------------------------------------------- |
| `packages/fetcher/`                                                  | Core HTTP client; no internal dependencies           |
| `packages/decorator/`, `packages/eventbus/`, `packages/eventstream/` | API decorators, event bus, SSE streams               |
| `packages/openapi/`, `packages/generator/`                           | OpenAPI types and TypeScript client generation       |
| `packages/openai/`, `packages/cosec/`                                | OpenAI client and CoSec authentication               |
| `packages/storage/`                                                  | Cross-environment storage                            |
| `packages/wow/`                                                      | Wow command/query clients and query DSLs             |
| `packages/react/`, `packages/viewer/`                                | React hooks and Ant Design viewer components         |
| `stories/`, `.storybook/`                                            | Shared Storybook stories and configuration           |
| `integration-test/`                                                  | Integration tests; service setup in its README files |
| `skills/`, `wiki/`                                                   | Agent skills and bilingual VitePress documentation   |

## Commands and Verification

Run from the repository root unless noted:

```bash
pnpm install
pnpm build                # Recursive workspace build, including wiki
pnpm test:unit            # Package tests, coverage, and declared type checks
pnpm test:it              # Integration tests; requires service configuration
pnpm test:storybook       # Storybook browser interaction tests (Playwright)
pnpm storybook            # Shared Storybook on port 6006
pnpm --dir wiki build     # Validate and build the documentation site

# Focused package work; ... includes workspace dependencies when building
pnpm --filter @ahoo-wang/fetcher-react... build
pnpm --filter @ahoo-wang/fetcher-react test
pnpm --filter @ahoo-wang/fetcher exec vitest run test/fetcher.test.ts
```

- Run affected package tests and builds. **Before committing, `pnpm test:unit` must pass.** Report checks run and any blocked validation.
- Use Vitest globals and the package's `test/` layout. React/viewer use jsdom; viewer loads `test/setup.ts`. Storybook browser tests run separately from `test:unit`.
- `pnpm lint` runs ESLint with `--fix`; `pnpm format` rewrites the repository. Prefer file-scoped checks/formatting and inspect the diff.

## Code and Change Boundaries

- Use strict TypeScript, ES modules, type-only imports, and Apache 2.0 headers. Follow `.prettierrc` and the target package's configs.
- **Ask first** before adding packages, changing root `tsconfig.json`, or modifying build configuration, unless already authorized for the task.
- Add external dependencies to the `pnpm-workspace.yaml` catalog and use `catalog:`; use the workspace protocol for internal dependencies.
- Keep package versions aligned with `pnpm update-version <version>`. Never break a public API without a version bump.
- Branch new work from `main`; use conventional commits (`feat:`, `fix:`, `chore:`, `test:`, `refactor:`, `docs:`). Merge PRs with squash only.

## Skills and Documentation

- Verify documented symbols, signatures, defaults, and examples against `packages/<package>/src/index.ts` and its exported implementations.
- Public API changes must update the matching `skills/<skill>/references/api.md` in the same change. Plugin manifest: `skills/plugins.json`.
- CQRS evals in `skills/fetcher-openapi-generator/evals/` must match `packages/generator/src/aggregate/aggregateResolver.ts`: root-level `tags`, inline command `requestBody`, `responses['200'].$ref` → `#/components/responses/wow.CommandOk`, and both `.snapshot_state.single` and `.snapshot.count` operations. Build the generator and its dependencies, then run from `packages/generator/`:

  ```bash
  node dist/cli.js generate -i <absolute-spec-path> -o <temporary-output-dir> -t tsconfig.json
  ```

- Update English wiki pages and their `wiki/zh/` counterparts together; follow `wiki/AGENTS.md` and validate with `pnpm --dir wiki build`.
- Never hand-edit generated `wiki/llms.txt`, `wiki/llms-full.txt`, or `wiki/.vitepress/dist/`.
