# View Engine Architecture Repair Implementation Plan

> Execute inline in the existing worktree. The user approved the architecture review; commits remain user-triggered.

**Goal:** Make independent core use safe, keep page sessions stable within an explicit scope, and isolate changes to filters, table layout and result rendering.

**Architecture:** The engine owns the applied filter-editing baseline and derives pending state. React reports draft and local validity, consumes immutable extension inputs, and renders record results behind a stable boundary. Shared refresh policy and pure table-layout calculations stay inside this package.

**Tech Stack:** TypeScript, React 19, Wow query DSL, existing shadcn/Base UI and TanStack Table.

**Spec:** The approved architecture review in this task and `docs/superpowers/specs/2026-09-05-wow-view-engine-design.md`.

## Constraints

- No new dependencies, packages, root configuration or build configuration.
- Keep manual Query, unset filter values, instance isolation, write-response reconciliation, pinning and summary recovery semantics.
- `ViewPage` receives a required `scopeKey` identifying the user's tenant/access scope. Local definition/list are initialization inputs; same-scope host callbacks can update without destroying drafts. Change the scope/definition or React key to reset.
- The package is unpublished; update callers and API documentation together rather than preserving the misleading `setFilterPending` setter.
- Record is the implemented view kind. Common metadata/query/presentation contracts will be named separately; new view renderers are outside this repair.

## Task 1: Filter state invariants

Files: `filter/filterTree.ts`, `filter/filterReactTypes.ts`, `filter/FilterPanel.tsx`, `record/recordModel.ts`, `record/ViewEngine.ts`, `record/RecordView.tsx`, related engine/panel/page tests.

- [x] Add a regression: change a draft from `amount >= 10` to `amount >= 500` through the core API; save must reject and retain pending until Query/Undo.
- [x] Store `filterBaseline` and `filterValid` per session. Derive `filterPending = !filterValid || !sameFilterDraft(filterDraft, filterBaseline)` in one shared function.
- [x] Let `setFilterDraft(draft, id?, valid?)` update draft and validity atomically; replace `setFilterPending` with `setFilterValidity(valid, id?)`. A validity callback cannot clear a changed draft's pending state.
- [x] Feed the engine's baseline into FilterPanel; panel reports validity instead of setting the engine's derived pending state. Apply/Restore and copy/reload paths preserve the corresponding baseline.
- [x] Run engine, panel and page tests; cover unset controls, invalid custom input, undo, save-as and in-flight edits.

## Task 2: Explicit page lifetime

Files: `record/ViewPage.tsx`, `test/viewPage.test.tsx`, stories and documentation callers.

- [x] Add a regression: replace a same-scope host object after entering `500`; preserve the input and query count. Change scope and verify a clean session and cancellation of old reads.
- [x] Key the owned page by `[definitionId, scopeKey]`. Capture initialization data once per ownership lifetime.
- [x] Keep a per-owner live host adapter, updating its target after commit; resolve optional methods dynamically and preserve their `this`. Old owners retain their old adapter on a scope change.
- [x] Update every ViewPage example/caller with an explicit scope key; verify StrictMode and caller-owned ViewPageContent behavior.

## Task 3: Immutable extension contract

Files: shared readonly type, `record/recordReactTypes.ts`, `filter/filterReactTypes.ts`, exports, type-contract test, affected examples.

- [x] Add a compiler regression with `@ts-expect-error` assignments to extension record, instance and column inputs; currently the directives are unused.
- [x] Apply recursive readonly types to extension snapshots without changing command payload construction.
- [x] Run package type checks and Storybook type checks. Document cloning an input before editing it.

## Task 4: Shared policy and layout boundaries

Files: internal refresh policy, internal table layout, `RecordRefreshControls.tsx`, `ViewEngine.ts`, `RecordTable.tsx`, focused tests.

- [x] Extract one background-refresh block-reason function used by the engine and the UI; keep focus/visibility handling in React.
- [x] Extract pure column widths, effective pins, filler width and summary-label span calculations. Verify the existing narrow/pinning/resizing geometry plus a focused pure-layout regression.
- [x] Keep summary metrics separate from the pure layout result; a pinned numeric summary must never be merged into the label area.

## Task 5: Isolate record rendering and model responsibilities

Files: `RecordView.tsx`, the memoized `RecordTable` result boundary, `recordModel.ts`, `recordPresentation.ts`, `recordSummary.ts`, tests.

- [x] Add a regression: editing an unsubmitted filter does not rerender a custom record cell, while selection/query/column changes still update it.
- [x] Pass stable result-related values and callbacks into the memoized result boundary; keep filter draft changes outside it.
- [x] Name common instance metadata, record query configuration and table presentation independently. Adapt presentation to `RecordSummaryMetric[]` so calculation/query helpers do not consume table columns. Keep saved-instance JSON stable; update public helper callers and documentation.
- [x] Run package tests/build, record/filter Storybook interactions, scoped lint/format and actual browser checks.

## Task 6: Document and verify

- [x] Update English/Chinese READMEs and `skills/fetcher-view-engine/references/api.md` for `scopeKey`, derived pending, validity and readonly extension inputs.
- [x] Record final checks, inspect the diff, and leave the work ready for the user's commit instruction.

## Verification completed before local commit

- Full monorepo `pnpm test:unit`: 3543 passed, 1 skipped; declared type checks passed.
- Package tests: 283 passed, including compiler-level readonly checks; package type checks passed.
- Package production build passed.
- View-engine Storybook browser interactions: 38 passed; Storybook TypeScript checks passed.
- Scoped ESLint, Prettier and git whitespace checks passed.
- Real browser: pending edits disable Save; Query enables it; clearing a value remains legal, preserves the control after Query, and saves successfully.
