# View Engine Library Delivery Plan

**Goal:** Deliver the existing core engine and RecordView as a maintainable library, preserving behavior and proving the public built-package integration.

**Authorization:** The active user goal authorizes review, refactoring, repairs and validation. It excludes cards/analysis/dashboard, dependencies or configuration changes without repository approval, and commits/push/publication/deployment.

**Baseline:** `c21b7c6f`; working tree clean. Previous repository check: 3546 passed, 1 skipped. All delivery gates will be rerun against the final worktree.

## Design boundaries

- The core owns immutable sessions and subscriptions, cancellable record/summary reads, instance loading/navigation, and persistence/reconciliation. `ViewEngine` remains the public composition facade; no React, DOM or table-library dependency may enter its runtime graph.
- Filter operator metadata, protocol construction, compilation, editor session validity, field selection and panel rendering are distinct responsibilities. Preserve all existing Wow operations and manual Query semantics.
- Table calculations and preferences stay independent of rendering. Table composition delegates cells, headers, summaries and failure/empty states to focused components with explicit inputs.
- Page ownership and instance navigation, saved-view actions/dialogs, global/filter/table toolbars and pagination compose the existing RecordView. Transient UI state remains in React; domain rules remain in the engine.
- Retain existing public export names and request/response semantics. Internal modules are not a plugin framework and cannot bypass the existing read/write guards.
- Ordinary files target 300 lines; every file over 400 must be split by responsibility or have a concrete documented reason. Test suites are grouped by observable behavior, not arbitrary line chunks.

## Independent implementation domains

1. Filter domain: `src/filter/**`, its `test/filter*` suites and filter/date stories. Separate compilation, editor lifecycle and UI composition; preserve public exports.
2. Table domain: `RecordTable`, `RecordColumnSettings`, table layout helpers and table tests. Separate rendering responsibilities and behavior suites.
3. Page domain: `ViewPage`, `RecordView`, `ViewManager`, refresh/expansion composition and page tests. Separate ownership/navigation/dialogs/toolbars with existing public props.
4. Core/integration (primary agent): `ViewEngine`, session/query/persistence internals, record/summary/validation models/tests, RecordView stories, public-built-package examples, architecture notes and final evidence.

Implementers own separate files. Shared contracts, exports and global documentation changes are coordinated by the primary agent. No implementation agent commits or changes dependencies/configuration.

## Execution and acceptance

- [x] Record the current responsibility/dependency/size inventory; classify oversized code and suites by behavior.
- [x] Refactor the filter, table and page domains with focused existing regression tests; add failing regressions for confirmed defects before repair.
- [x] Refactor the core into cohesive session, loading, query/summary and persistence responsibilities. Verify cancellation, write reconciliation, invalid-input guards and isolated snapshots.
- [x] Organize tests and oversized stories by behavior while preserving story IDs and meaningful coverage.
- [x] Inspect the complete runtime import graph for cycles and UI dependencies in the core. Add a runnable verification where this prevents a real regression.
- [x] Add a runnable public-package example for core use, React page integration, global/row/batch actions, a custom filter and a custom cell. Cover readonly inputs, async scope, lifecycle and error recovery.
- [x] Build and validate through `@ahoo-wang/fetcher-view-engine` and `/react` exports, not source-only aliases. Verify publishable entries and CSS.
- [x] Run package tests/type checks/build, scoped lint/format, relevant Storybook tests and full `pnpm test:unit`.
- [x] Verify real-browser primary flows, failure/retry, keyboard interaction, light/dark theme and narrow containers; retain evidence.
- [x] Update English/Chinese READMEs, API reference and a concise responsibility map, including any justified size exceptions.
- [x] Audit every requirement against current evidence, report remaining limits and distinguish library validation from live-business admission. Leave the work uncommitted.

## Completed delivery audit

The following results apply to the uncommitted worktree based on `c21b7c6f`.
No dependencies, build configuration, public export paths or package versions changed.

| Requirement                       | Implementation and evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Clear state and runtime ownership | `ViewEngine` composes internal session, scope, edits, query, summary, loading and persistence services. `SessionStore` alone publishes immutable snapshots; UI components compose those commands without importing private core services.                                                                                                                                                                                                                                                       |
| Bounded modules                   | `ViewEngine` 1347 → 215 lines; `ViewPage` 792 → 114; `RecordView` 516 → 210; `RecordTable` 1005 → 117; `ViewManager` 534 → 129; `FilterPanel` 1093 → 140. No source, test, story, example or verification script exceeds 400 lines. The only source above 300 is the 330-line controlled filter-session hook, justified in both READMEs. Largest test: 292; largest story/helper: 273.                                                                                                          |
| Low coupling and shared rules     | Permissions, session inheritance, list validation, snapshots and write locks have shared owners. The runtime-graph architecture check detects cycles in both entry graphs and React/DOM/table imports in core. Packed core execution loads two internal runtime modules without UI imports.                                                                                                                                                                                                     |
| Public extensions                 | `examples/react/OrderExample.tsx` composes public global, row, batch, filter and cell extensions. Four `LibraryDelivery` stories exercise independent use, readonly data, source-bound refresh, failure/retry and narrow dark UI. `examples/core.mjs` runs through the public core export.                                                                                                                                                                                                      |
| Reliability                       | Existing suites remain organized by observable behavior. New failing-then-passing regressions protect newer navigation during synchronous cancellation notifications, both loaded and pending navigation during save-as, and controlled filter edits emitted from a child layout effect. Invalid inputs, immutable snapshots, stale writes/reads, session disposal and uncertain write reconciliation remain covered.                                                                           |
| Public distribution               | Actual `pnpm pack` archive verified: five declared targets, scoped CSS, 216 byte-identical dist files, public core execution and six React example modules passing TypeScript. Type resolution is checked against the unpacked public exports, without private-source aliases.                                                                                                                                                                                                                  |
| Automated validation              | Full `pnpm test:unit`: **3562 passed, 1 skipped**, including **302 view-engine tests across 55 files** and its declared type check. Relevant Storybook: **42 passed across five files**. Package build, package/story ESLint, scoped Prettier and `git diff --check` passed.                                                                                                                                                                                                                    |
| Browser validation                | Standalone public React example: create, manual filtering, unset filter query, row and batch operations. Dark 392px container: wrapping, horizontal scrolling, themed column popover, keyboard reorder and Escape focus restoration. Keyboard resize increased the customer column from 462px to 472px. Summary failure: one error at “all”, page total retained, retry restores all total without repeating record query. No console errors were reported in these three manual browser pages. |
| Documentation                     | Both shipped READMEs contain the same responsibility map, size exception, runnable commands and delivery limits. The API reference documents the public examples and the navigation/lifecycle rules.                                                                                                                                                                                                                                                                                            |

### Reproducible checks

Run from the repository root:

```bash
pnpm --filter @ahoo-wang/fetcher-view-engine build
pnpm test:unit
pnpm --filter @ahoo-wang/fetcher-view-engine exec eslint .
pnpm exec eslint stories/view-engine
pnpm exec vitest run --project=storybook stories/view-engine/
node packages/view-engine/scripts/verify-package.mjs
git diff --check
```

The package verifier uses temporary files and the already installed workspace dependencies. It does not install, publish or alter manifests.
Verified archive SHA-256: `e2587f71cf21714ce8a9e45dbc215d91d074d648804437eef220f72a3440e104`.

Local validation logs, inventory and browser screenshots are retained in:
`/Users/ahoo/.codex/visualizations/2026/09/05/01a06f1e-d229-74f2-ae9d-2df623cfc66a/view-engine-delivery/`.

The manual summary-recovery check retained **¥8,499.00** for the current page and restored **¥36,456.00** for all matching records. The visible host counters remained at **one record query** and increased to **two aggregate requests**. The error and recovery screenshots record this flow.

### Remaining boundary

This completes local library delivery validation with strict simulated hosts and the current installed dependency set. It does not certify real business authentication, authorization, durable persistence, live backend query behavior or production operations. Those checks require the consuming application's environment. No commit, push, release or deployment was performed.
