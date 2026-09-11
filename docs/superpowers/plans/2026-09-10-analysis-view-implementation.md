# AnalysisView Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Independent bounded domains may use superpowers:dispatching-parallel-agents. Do not commit or publish during this implementation run.

**Goal:** Deliver configurable, persistable analysis result tables with a shared instance lifecycle, preserving current record/default-view behavior and the explicitly redesigned save semantics.

**Architecture:** One ViewEngine coordinates immutable sessions and shared writes; record and analysis own their query/edit logic. Pure analysis compilation produces a Wow query plus matching schema. UI invokes instance-bound operations and never infers result scope from working edits.

**Tech Stack:** TypeScript 6, pnpm 10.34.5, React 19, existing Wow DSL, Base UI/shadcn, Vitest and Storybook.

**Spec:** `docs/superpowers/specs/2026-09-10-view-engine-overall-architecture.md`, `2026-09-10-analysis-view-redesign.md`, and `2026-09-10-view-engine-production-contracts.md`.

## Global Constraints

- Current main baseline: `0215a020`; retain personal default-instance preferences, navigation focus, and cross-tab storage semantics introduced since the original audit.
- No compatibility layer, no API-break-only version bump for this unreleased package.
- No new packages, root tsconfig changes, or build changes without separately established authorization.
- Preserve all existing business capabilities and fix confirmed data-loss behavior. Update affected callers, tests and public references with any API change.
- Stay in the existing isolated worktree. Keep untracked design/review assets. No commits, push, release or deployment.
- New logic follows failing-test → implementation → targeted checks. Passing old tests is not proof of the new contract.
- Analysis scope: filters, terms/histogram/date histogram, count/numeric metrics, result table, save/restore. No charts or dashboards.

## Task 1: Recover inline filter buffers across instance navigation

Files: `src/filter/FilterTextValues.tsx`, `builtinFilterRegistrations.tsx`, `builtinFilterCompilers.ts`, `test/viewPage.filters.test.tsx`, `test/filterBuiltinControls.test.tsx` under `packages/view-engine`.

Interface: component raw props retain the unconfirmed text; compiler rejects incomplete input; clear/commit removes the buffer without changing already confirmed values.

- [x] Reproduce the existing text-buffer test from `docs/superpowers/reviews/assets/view-switching-repro.tsx.txt` on the new main.
- [x] Make the input optionally controlled by component configuration, report every raw edit, and compile/clear the raw property consistently. Keep standalone component usage valid.
- [x] Verify the navigation test and existing input/IME/paste/clear tests.

```ts
expect(input.value).toBe('ORDER-002');
expect(engine.getSnapshot().sessions.mine.filterValid).toBe(false);
```

Run: `pnpm --filter @ahoo-wang/fetcher-view-engine exec vitest run test/viewPage.filters.test.tsx test/filterBuiltinControls.test.tsx --coverage.enabled=false`.

## Task 2: Implement pure analysis configuration, compilation and result validation

Create `packages/view-engine/src/analysis/analysisModel.ts`, `analysisCompiler.ts`, `analysisResult.ts` and `test/analysisCompiler.test.ts` / `analysisResult.test.ts`.

Produces: AnalysisCapability, AnalysisViewConfig, AnalysisCompileContext, AnalysisPlan, AnalysisCompileResult, compileAnalysis(config, context), validateAnalysisResult(rows, plan). Uses FilterConfiguration/FilterFieldDefinition and existing Wow AggregationQuery only; no record or React dependency.

- [x] Write count+sum, state/month grouping, stable alias, invalid component/props and missing/null/duplicate result tests.
- [x] Implement registry-based bounded group/metric contributions; builtins terms, histogram, date-histogram, count, numeric. Context contains fields, capability, timezone, filter compilers and custom analysis compilers.
- [x] Compile filter plus all components into one query/schema or return errors without executable output. Validate group tuples and result values by literal alias.
- [x] Run both focused files and type-check the package as integration permits.

```ts
const compiled = compileAnalysis(config, context);
expect(compiled.errors).toEqual([]);
if (compiled.plan) expect(compiled.plan.query.metrics[0].alias).toBe('orders');
```

## Task 3: Shared contracts, state and lifecycle integration

Modify `record/recordModel.ts`, `ViewHost.ts`, `ViewEngine.ts`, `engine/SessionStore.ts`, `ViewLoader.ts`, `ViewPersistence.ts`, `ViewReload.ts`, `ViewManagement.ts` and move shared responsibilities into `src/engine/` / `src/contracts/` as required by their final dependencies. Update every touched import, fixture and local adapter under its actual current main path.

Consumes Task 2's pure plan/validation. Produces a discriminated instance/session model with one atomic publisher, instance-bound record/analysis commands, shared save/default/order/conflict handling.

- [x] Promote the two architecture counterexamples into real regression tests and verify they fail before fixes.
- [x] Separate document editability from plan validity; loaded invalid configs keep working and issues without blocking healthy entries.
- [x] Shared save obtains valid current working content without querying. Preserve late edits, new-main default preferences and delete results.
- [x] Preserve remote/local/baseline on real conflicts; expose explicit use-remote/overwrite decisions tied to reviewed versions. Do not silently advance revision under old local config.
- [x] Add analysis query state with token/scope checks, immutable result/schema and separate failures. Register/cancel requests before reentrant notifications.
- [x] Verify mixed lifecycle, record/default/management, known-write and unknown-write tests. Run type-check to locate and fix all call sites.

```ts
expect(lastSubmitted.config.pagination.size).toBe(50);
expect(healthyEntry.status).toBe('loaded');
expect(paged).toHaveBeenCalledTimes(beforeSave);
```

## Task 4: Analysis UI and mixed navigation

Create `src/analysis/AnalysisView.tsx`, `AnalysisEditor.tsx`, `AnalysisTable.tsx`; update current `record/ViewPage.tsx`, page navigation/actions and `src/react.ts`. Reuse installed controls and type-independent formatting.

- [x] Write a component test for edit → save without run → run → failure → clear sort → switch back with draft retained.
- [x] Render fields/functions/grain as controlled raw configuration, show explicit run and save actions, independent result provenance and inline errors.
- [x] Add analysis type labels to both navigation surfaces; retain default selection in management and show write failures with explicit recovery actions. Loading targets never retain old actionable sessions.
- [x] Test read-only restore, focus, invalid configuration repair and cross-kind callbacks.

```ts
fireEvent.click(screen.getByRole('button', { name: '运行分析' }));
await waitFor(() => expect(screen.getByRole('table')).toBeTruthy());
```

## Task 5: Resource, permission and host boundaries

Files: final shared engine modules, new analysis runtime, actual local host adapter and engine tests.

- [x] Enforce timeouts, query budget, bounded retained results and configuration size using the production-contract defaults. Never evict working/recovery state.
- [x] A dispatched write timeout becomes unknown; a canceled read does not become an error. Diagnostic callbacks are isolated and contain no payloads.
- [x] Retain main's default preference/delete reconciliation and cross-tab locking; verify against adapter contract tests.
- [x] Re-run targeted concurrency and monotonic-permission scenarios.

## Task 6: Public examples, documentation and acceptance

Files: analysis/mixed Storybook examples, package READMEs, `skills/fetcher-view-engine/references/api.md`, matching wiki pages (read wiki/AGENTS.md first), and public consumer examples.

- [x] Add a real mixed order example and a pure aggregation host, including an initial system analysis template and save-as/default behavior.
- [x] Update exported API documentation and all replaced signatures; keep historical evidence separate from final implementation status.
- [x] Build package+dependencies, run package tests/type checks, browser interaction tests, file-scoped lint/format, wiki build and root unit gate.
- [x] Check the built package and NodeNext declaration issue without claiming unsupported consumption succeeds. Capture actual limitations when external backend evidence is unavailable.

## Progress

- Implemented Tasks 1–5. Shared contracts live in `src/contracts`, coordination in `src/engine`, common UI in `src/view`, and the owning hook in `src/react`. Record and analysis modules do not import each other.
- Public record commands are instance-bound; obsolete direct business methods were removed and callers migrated.
- Task 6 complete: final repository unit gate passed with VITEST_MAX_WORKERS=4; View Engine normal and compiled modes each passed 1144 tests. Full View Engine Chrome suite passed 169 tests. Package/Storybook lint, wiki build, public symbols and packed consumer checks passed. Completed 2026-09-11 (Asia/Shanghai), without committing or publishing.
- The NodeNext declaration blocker was fixed on 2026-09-11 by correcting relative module references in the dependency source. Strict packed NodeNext consumption and negative type probes now pass; see the validation record.
