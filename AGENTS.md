# AGENTS.md — Fetcher Monorepo

TypeScript HTTP-client ecosystem built around `Fetcher`.

## Scope and Sources

- 默认使用中文与用户沟通。
- Read applicable nested `AGENTS.md` files before editing, including `packages/<package>/AGENTS.md` or `wiki/AGENTS.md`. Their rules apply within their directory.
- Read the release version, Node/pnpm requirements, and root scripts from `package.json`; use `pnpm-workspace.yaml` for workspace membership and the catalog, and each package's `package.json` for its dependencies and scripts.
- Keep changes scoped, follow existing patterns, and reuse package APIs. For fixes, inspect callers and address the shared cause.

## Repository Map

| Path                                                                 | Responsibility                                       |
| -------------------------------------------------------------------- | ---------------------------------------------------- |
| `packages/fetcher/`                                                  | Core HTTP client; no internal dependencies           |
| `packages/decorator/`, `packages/eventbus/`, `packages/eventstream/` | API decorators, event bus, SSE streams               |
| `packages/openapi/`                                                  | OpenAPI types                                        |
| `packages/openai/`, `packages/cosec/`                                | OpenAI client and CoSec authentication               |
| `packages/storage/`                                                  | Cross-environment storage                            |
| `packages/react/`                                                    | React hooks                                          |
| `stories/`, `.storybook/`                                            | Shared Storybook stories and configuration           |
| `integration-test/`                                                  | Integration tests; service setup in its README files |
| `skills/`, `wiki/`                                                   | Agent skills and bilingual VitePress documentation   |

The Wow client, the Wow React hooks, the view engine and the generator moved to
the [Wow repository](https://github.com/Ahoo-Wang/Wow/tree/main/typescript)
(`@ahoo-wang/wow-*`); the deprecated viewer stays on the `5.x` branch, which
also carries fetcher 5.x fixes. Dependencies run one way, Wow → fetcher: no
package here may depend on `@ahoo-wang/wow-*` (`.github/scripts/dependency-direction.mjs`,
run in Engineering Quality). `@ahoo-wang/wow-react` imports only
`@ahoo-wang/fetcher-react/core` and `/fetcher`, so keep those subpaths free of
other integrations. `downstream-wow.yml` runs Wow's TypeScript tests against
changes to the core packages Wow consumes; it is advisory.

## Commands and Verification

Run from the repository root unless noted:

```bash
pnpm install
pnpm build                # Recursive workspace build, including wiki
pnpm test:unit            # Package tests, coverage, and declared type checks
pnpm test:it              # Required integration cases (local JSONPlaceholder server)
pnpm test:it:external     # Advisory: cases against a live LLM provider
pnpm test:storybook       # Storybook browser interaction tests (Playwright)
pnpm storybook            # Shared Storybook on port 6006
pnpm --dir wiki build     # Validate and build the documentation site

# Focused package work; ... includes workspace dependencies when building
pnpm --filter @ahoo-wang/fetcher-react... build
pnpm --filter @ahoo-wang/fetcher-react test
pnpm --filter @ahoo-wang/fetcher exec vitest run test/fetcher.test.ts
```

- Run affected package tests and builds. **Before committing, `pnpm test:unit` must pass.** Report checks run and any blocked validation.
- Follow each package's Vitest configuration, test imports, and `test/` layout. React uses jsdom. Storybook browser tests run separately from `test:unit`.
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
- `node --test .github/scripts/skills.test.mjs` (run in Engineering Quality) enforces this: frontmatter and description budget, `$skill` links, `agents/openai.yaml`, the eval suite's shape (below), and that every `@ahoo-wang/*` import in a skill and backticked API name in its `SKILL.md` is exported by the package source today. Only `fetcher-v6-migration` may name packages that left fetcher or `@ahoo-wang/wow-*`.
- Evals use the `claude plugin eval` format: `skills/<skill>/evals/<case>/prompt.md` (frontmatter `name`, `tags`, `runs`, `max_turns`, `allowed_tools`; the body is the user prompt) plus `graders/*.md` — `type: llm` with criteria taken from the skill's references, `type: regex` for a must-have symbol, and `type: tool_used` / `tool: Skill` asserting the skill fired (unscored under the default `--ablation with-without`; it is the "fired" indicator). The llm judge sees only the criterion and the final answer, never the skill: write numbered PASS points and concrete FAIL cases (the wrong API a model reaches for), not "uses only documented APIs". A negative case (it belongs to a neighbour skill) has a single grader, `min: 0` / `max: 0` with `arm: both`, so "did not fire" is scored in both arms: only the skill under test is loaded, so the neighbour's answer cannot be graded. The guard requires at least 3 cases, a firing case and a negative case per skill, checks `arm`, and rejects a leftover `evals.json`.
- `pnpm eval:skills [skill…]` runs the suites (`claude plugin eval . --trust-plugin --no-publish` in each skill directory; `SKILLS_EVAL_MAX_COST` is the per-skill ceiling in USD, default 2; `SKILLS_EVAL_RUNS` overrides runs per case, default 1) and prints a per-skill exit-code summary. It needs a Claude login and costs money, so it is local only, never CI. Reports go to the git-ignored `skills/<skill>/evals/results/`.
- Update English wiki pages and their `wiki/zh/` counterparts together; follow `wiki/AGENTS.md` and validate with `pnpm --dir wiki build`.
- Never hand-edit generated `wiki/llms.txt`, `wiki/llms-full.txt`, or `wiki/.vitepress/dist/`.
