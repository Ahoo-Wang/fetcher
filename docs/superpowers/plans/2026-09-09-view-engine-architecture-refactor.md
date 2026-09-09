# View Engine Architecture Refactor Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development task-by-task; scoped independent review followed by a final combined review. Continue through authorized work without further design gates.

**Goal:** Deliver the approved single configuration model, clear state ownership, proven redundancy removal and production verification across all consumers.

**Architecture:** FilterConfiguration/FilterComponentConfig are the only editing/persistence tree. Component props compile into Wow expressions. Headless record sessions and standalone/controlled panels each have one owner; query/write recovery retain their existing independent identities and invariants.

**Tech Stack:** Existing TypeScript, React Compiler, Fetcher/Wow, Base UI, TanStack and Vitest/Playwright. No new dependency is planned; a demonstrated replacement can be recorded before adoption.

**Spec:** `docs/superpowers/specs/2026-09-09-view-engine-architecture-refactor-design.md` (approved in the next user message after commit 60741eae).

## Global constraints

- Record views only; no analysis view feature or generic workflow framework.
- Current public API/configuration may change; migrate every repository consumer, no permanent legacy aliases or dual-format support.
- Keep component property restoration, unset/raw input, field/operator constraints, five extension types, current-user order and system permissions.
- Keep unknown-write identity/CAS/source-less recovery and newer-operation precedence.
- Preserve nine pre-existing height edits. Baseline copies and patch: `/tmp/fve-architecture-height-baseline`. Stage candidate excluding them using a three-way merge of final working files against those baseline files and HEAD; do not overwrite the working edits.
- Full unit gate before commits. Final isolated candidate must pass ordinary/compiled/type tests, Storybook, public archive, hosts, docs and three-browser production checks at unchanged 100 rows/30 columns/100 fields/10 samples/p95<=1000ms.
- Automatic merge remains paused until the completed candidate is accepted by checks and independent review.

## Shared interfaces (fixed for parallel tasks)

- Keep `FilterComponentConfig {id, component, operator, field?, props, operands?, predicate?}` and `FilterConfiguration {mode, root}` as canonical shapes.
- `newFilterNode(operator: FilterOperator, field?: string, component?: FilterEditorReference): FilterComponentConfig`; default reference builtin, empty props, correct initial container children/DELETION defaults.
- `createFilterConfiguration(root: DeepReadonly<FilterComponentConfig>, mode?: FilterMode): FilterConfiguration`; clone/validate/wrap canonical root, infer mode when omitted. No expression/draft conversion.
- `isSimpleFilter(root: DeepReadonly<FilterComponentConfig>): boolean` keeps current structural rules.
- `clearFilterValues(root: DeepReadonly<FilterComponentConfig>, fields: readonly FilterFieldDefinition[], compilers?: FilterCompilerRegistry, timeZone?: string): FilterComponentConfig`; clear props on a cloned canonical tree with registered semantics, retain node/component identity.
- `compileFilterConfiguration(config, fields, allowedOperators?, compilers?, timeZone?)` remains the public compiler. Pure internal output parsing may exist but is not an editing tree and is not exported publicly.
- Internal `resolveFilterComponent(operator, field?, editors?)` resolves new-node defaults only. Existing nodes always use their explicit component reference.
- `FilterApplyResult {configuration: FilterConfiguration; expression: FilterExpression}`.
- FilterPanel uses `value/onChange` for controlled configuration or `defaultValue` for local ownership (mutually exclusive); optional `appliedValue`; required `onApply(result: FilterApplyResult): void | Promise<void>`. Remove expression-valued value, draft/appliedDraft/onDraftChange and independent mode/onModeChange props. Toolbar mode command remains but changes configuration.mode.
- Existing FilterEditorProps props/operator/onChange remain the component boundary. Only canonical node.props is passed.
- RecordSession.filterDraft and filterBaseline become FilterConfiguration snapshots; remove duplicate filterMode (mode is in config). `setFilterDraft(config, id?, valid?)` and `applyFilter(id?)`; mode convenience command may remain only as a pure canonical config update, with no separate state.
- Remove public FilterDraftNode/createFilterDraft/newFilterDraft/compileFilterDraft/restoreFilterConfiguration/clearFilterDraftValues. No alias or test-only expression-to-component compatibility converter in production.

## Task 1 — Canonical filter core and core regressions

Ownership: pure filter model/compiler/validation/tree/transition modules and non-React filter tests. Do not edit React hooks/types, index.ts, record code, stories or docs.

- [x] Add failing tests for canonical built-in/custom props, clear/transition invariants, restored component identity, element contexts and unset controls.
- [x] Implement fixed interfaces; replace draft-specific tree helpers and remove old public conversion code. Migrate pure compiler internals without giving React a second representation.
- [x] Migrate core filter tests to construct component configuration directly; preserve equivalent semantic and invalid-input assertions.
- [x] Run focused tests/type checks (record/UI may temporarily fail until sibling work lands), scoped lint/format, independent review.

## Task 2 — React filter ownership and UI regressions

Ownership: filter TSX, useFilterPanel*.ts/useRemoteFilterOptions.ts, filterPanelUtils.ts, resolveFilterEditor.ts, filterReactTypes.ts, filter-related TSX tests.

- [x] Establish canonical controlled/defaultValue/apply tests, including async acknowledgment vs newer edits, external replacement and view unmount buffers.
- [x] Read/write node.props consistently; remove built-in/custom flatten/restore adapters and expression synchronization effects.
- [x] Wire common editor/validity/query flow for controlled and local state; preserve callback generations, disabled handling, error boundaries, keyboard and date/time behavior.
- [x] Migrate filter UI tests without removing behavior coverage; independent review after focused checks.

## Task 3 — Record integration and cohesive runtime contracts

Ownership: root agent — record source/tests, core/react entry exports, examples/tests not owned above, API/package checks.

- [x] Migrate sessions, RecordEdits, applied labels and RecordView to canonical draft/applied/saved snapshots; public entry compiles without legacy filter APIs.
- [x] Migrate engine fixtures/tests to explicit canonical builders and keep operation invariant/recovery assertions.
- [x] Separate layout/formatting implementations from record contracts when callers demonstrate the boundary; update imports and public exports atomically.
- [x] Audit LocalStorageViewHost and runtime state for actual duplicated/dead code; delete only proven redundancy and record evidence, keep service transactions and idempotency intact.
- [x] Run record/runtime regressions and independent combined review.

## Task 4 — Repository consumers and documentation

Ownership: consumer agent — stories/view-engine, packages/view-engine/examples, packages/view-engine/scripts; docs/wiki/skill updates after exported interfaces settle. Protect pre-existing story height changes.

- [x] Migrate Storybook fixtures, custom filters, play assertions, readiness/host scenarios and all public examples to canonical config APIs.
- [x] Update bilingual README/wiki, skill API reference and export/reference generation using public implementations as source of truth.
- [x] Retain unchanged stored canonical configurations. Only bump/reset development schema if persisted shape actually changes, with explicit developer reset action.
- [x] Run consumer type/archive/story/doc verification and review.

## Task 5 — Dead-code ledger and final acceptance

- [x] Audit symbol usage including dynamic registries/public examples; record deletions and remaining justified code in this plan.
- [x] Record dependency decision with net code/contract/build cost; default reuse existing dependencies.
- [x] Ensure no legacy APIs or stale imports remain in source, active tests, examples, stories or public documentation (historical specs/plans are historical).
- [x] Build a staged exact candidate excluding height changes and synchronize the owned isolated verifier.
- [x] Full pnpm test:unit, affected build/lint/format, Storybook, wiki generation/tests/build, public archive/host/three-browser readiness with unchanged budgets.
- [ ] Final independent review; fix confirmed issues, repeat only checks justified by changes. Commit/push final candidate; restore exact-HEAD review/CI follow-up without bypassing gates.

## Ledger

- Approved: public APIs may change together; old persisted component shape remains compatible if unchanged. Product behavior and recovery contracts are binding.
- Initial dependency decision: no new library. Existing ecosystem/native primitives cover the planned structural simplifications; revisit only with a concrete replacement proof.
- Existing isolation: use current linked worktree; preserve and exclude unrelated height changes via saved baseline, no extra task/branch created.

## Implementation evidence and deletion ledger

- Canonical configuration is now shared by core, React and record sessions. Public draft/restore/expression-to-editor APIs have no remaining source/test/example/story/public-guide consumers.
- Removed `FilterDraftNode`, `createFilterDraft`, `compileFilterDraft`, `newFilterDraft`, `restoreFilterConfiguration`, `clearFilterDraftValues` and the flatten-vs-props fallback; direct canonical constructors and compiler replace them. Internal protocol parsing only validates compiler output.
- Removed expression-valued panel synchronization, separately owned mode, `readValue`/`readInitialFilterPanelState`, the built-in fallback Set and duplicate baseline compilation. Explicit component references survive definition-default changes.
- Removed `RecordQueryConfig`: its only implementation consumer was `Omit<RecordQueryConfig, 'filter'>`; `RecordViewConfig` now states its actual component/query/presentation fields directly.
- Deleted the function-free `record/engine/recordSnapshot.ts` forwarding layer; nine callers import the unchanged shared snapshot functions directly.
- Moved column policy/constants to `recordColumns`, number formatting to existing `recordValueFormat`, summary presentation to existing `recordPresentation`; recordModel now owns contracts only. Local host persisted-state validation/DTO selection moved to `localViewState`, leaving lock/storage operations in the host transaction.
- Retained `copy` and `cloneSnapshot`: one validates/freezes JSON snapshots, the other returns a writable structured clone. They have different contracts and are not redundant.
- No new library: existing pure transformations, structuredClone, Fetcher/Wow, TanStack and Base UI cover the changes without an additional runtime/state framework.
- Independent core review caught default-editor policy leaking into saved nodes; fixed and re-reviewed. Independent UI review caught same-id external replacement leaving ErrorBoundary latched; fixed and re-reviewed. Record review identified three migrated tests no longer exercising original boundaries; direct engine-input isolation, non-JSON rejection and mode-retention assertions restored and re-reviewed.
- Preserved storage schema: persisted configuration already has the canonical shape; no namespace reset, silent migration or user-data deletion was necessary.
- Consumer verification before final candidate: 66 story/example type modules, archive/examples, wiki tests/build and focused Storybook passed. Final combined gates remain below.

## Final candidate verification

- Exact staged candidate in `/tmp/fve-unified-verify` excludes all nine protected height changes; tracked-file hashes matched the index.
- Full `pnpm test:unit` passed, including 855 view-engine tests in ordinary mode, 855 in React Compiler mode and package type checks. Coverage: statements 96.71%, branches 92.76%, functions 98.09%, lines 98.73%.
- Final package/story lint, changed-file format check, staged whitespace check and bilingual wiki build passed.
- Full test run exposed two stale extension-test API calls; migrated canonical node keys and apply invocation, preserved inherited-name rejection and strengthened readonly/unsupported-expression type assertions. Four focused tests and the subsequent full suite passed.

- Full Storybook: 286 passed. Public archive: five targets, 285 identical packed dist files and nine React consumer examples. LocalStorage and HTTP recovery/permissions/CAS suites passed.
- Production three-browser readiness passed at unchanged 100 rows/30 columns/100 fields, ten warm samples and 1000ms p95 ceiling; light/dark 1440/390px, keyboard, failure/loading recovery and 20 mount/dispose cycles covered. Reviewed existing Base UI WebKit focus-sentinel warnings remain; no VoiceOver certification claimed.
- chromium: refresh 236.95ms, selection 100.96ms, fieldPicker 161.41ms
- firefox: refresh 320.02ms, selection 260.75ms, fieldPicker 241.4ms
- webkit: refresh 298.26ms, selection 109.84ms, fieldPicker 143.24ms

## Post-review lifecycle corrections

- Reproduced suspended `startTransition` replacements dropping edits from the still-visible committed panel. Kept observed configuration/generation in render-local React state; event refs advance during commit. Retained custom editor callbacks use before-mutation committed props/generation, and the fallback button captures its rendered props. Child layout-effect updates still merge into the replacement configuration; obsolete callbacks remain rejected.
- Reproduced both load and selection notifications starting a newer page query that the older automatic query superseded. Both entry points now use the existing query-intent guard. Follow-up reads return a promise so load/navigation preserve errors; completed durable writes continue to isolate subsequent read failures.
- Added seven regression cases: builtin/custom editors with and without suspended replacement, suspended fallback recovery, and load/selection query ownership. Independent review found the fallback sibling path; its ordinary/compiled reproducers passed after the scoped correction.
- No public API, persistence schema, dependency or product scope changes. Nine unrelated height edits remain excluded.

- Final corrected candidate: full `pnpm test:unit` passed (5,554 passed / one skipped; view-engine 862 ordinary + 862 compiled and types), 286 Storybook tests, package/story lint, build, scoped formatting and diff checks. `verify:view-engine` passed public archive/types, LocalStorage/HTTP restoration and Chromium/Firefox/WebKit readiness at unchanged budgets. Logs: `/tmp/fve-commit-boundaries-unit.log`, `/tmp/fve-commit-boundaries-storybook.log`, `/tmp/fve-commit-boundaries-acceptance/`.
- Latest chromium p95: refresh 265.78ms, selection 100.18ms, field picker 152.3ms.
- Latest firefox p95: refresh 290.08ms, selection 239.73ms, field picker 227.52ms.
- Latest webkit p95: refresh 288.55ms, selection 106.75ms, field picker 130.86ms.
